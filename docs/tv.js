// ─────────────────────────────────────────────────────────────────────
// THE TV
//
// Boots into the kiosk and never navigates. It renders whatever the
// session document says, and works the rest of it out from the clock:
// rest running out and the next circuit starting need no write, so a
// phone that has gone to sleep cannot stall the board.
//
// Nobody is ever going to touch this screen, so it also looks after
// itself: it pulls its own updates and never shows an error.
// ─────────────────────────────────────────────────────────────────────

import { watchSession, getDone } from './store.js?v=0.2.3';
import { drawMovement, cycleMs } from './exercise.js?v=0.2.3';

const root = document.getElementById('root');
const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let session = null;
let painted = '';          // what the DOM currently holds, so we only rebuild on change
let panels = [];           // { g, id, offset }

let done = [];
const routines = () => (window.ROUTINES || []).map(window.expandRoutine);
const upNext = () => window.expandRoutine(window.nextRoutine(done));
const routineById = (id) => routines().find((r) => r.id === id) || routines()[0];

const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const label = (m) => m.reps != null ? String(m.reps)
  : m.distance_m != null ? m.distance_m + '<i>m</i>'
  : m.seconds != null ? mmss(m.seconds * 1000) : '';
const timed = (c) => c.movements.some((m) => m.seconds != null);

// ── what is actually happening right now ─────────────────────────────
//
// The document records what started when. This turns that plus the clock
// into the state the screen should be in.
function live(now) {
  if (!session || !session.phase || session.phase === 'idle') return { phase: 'idle' };
  if (session.phase === 'resting') {
    if (now >= session.restEndsAt) {
      return { phase: 'running', circuit: session.nextCircuit,
               circuitStartedAt: session.restEndsAt, startedAt: session.startedAt };
    }
    return { ...session, remaining: session.restEndsAt - now };
  }
  return session;
}

// ── sound ────────────────────────────────────────────────────────────
let ac = null;
function beep(freq, ms, vol) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.frequency.value = freq; o.type = 'sine';
    g.gain.value = vol == null ? 0.25 : vol;
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + ms / 1000);
  } catch { /* a board with no audio is still a board */ }
}
let lastBeepBucket = -1, lastCount = -1;

// ── screens ──────────────────────────────────────────────────────────
function panelMarkup(m, i) {
  return `<div class="cell">
      <svg class="art" viewBox="14 22 176 164" data-move="${esc(m.movement)}"></svg>
      <div class="rep">${label(m)}</div>
      <div class="mv">${esc(m.movement.replace(/-/g, ' '))}</div>
      ${m.note ? `<div class="note">${esc(m.note)}</div>` : ''}
    </div>`;
}

function paintCircuit(r, c, idx, head) {
  const key = 'c' + idx + '|' + c.movements.map((m) => m.movement).join(',');
  if (painted !== key) {
    root.innerHTML = `
      <header>
        <div class="clock"><b id="wclock">0:00</b><span>ELAPSED</span></div>
        <div class="tmr" id="ctimer"></div>
        <div class="count"><b id="cnum">${head}</b><span>CIRCUIT</span></div>
      </header>
      <div class="strip">${c.movements.map(panelMarkup).join('')}</div>`;
    painted = key;
    panels = [...root.querySelectorAll('.art')].map((svg, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);
      return { g, id: svg.dataset.move, offset: i * 370 };
    });
  }
}

function render(now) {
  const s = live(now);

  if (s.phase === 'idle') {
    const r = upNext();
    if (painted !== 'idle') {
      root.innerHTML = `
        <div class="big">
          <div class="kicker">LEVEL ${r.level} &middot; ROUTINE ${r.order}</div>
          <div class="headline">${esc(r.name)}</div>
          <div class="sub">${r.circuits.length} circuits &middot; ${r.circuits[0].movements.length} movements
            &middot; ${r.warmup ? r.warmup.length + ' warm-up' : 'no warm-up'}</div>
          <div class="hint">Start it on your phone</div>
        </div>`;
      painted = 'idle';
      panels = [];
    }
    return;
  }

  const r = routineById(s.routineId);

  if (s.phase === 'warmup') {
    const c = { movements: r.warmup || [] };
    paintCircuit(r, c, 'w', 'WARM-UP');
    const el = document.getElementById('cnum');
    if (el) el.textContent = 'WARM';
    const wc = document.getElementById('wclock');
    if (wc) wc.textContent = '0:00';
    return;
  }

  if (s.phase === 'running') {
    const c = r.circuits[s.circuit];
    if (!c) return;
    paintCircuit(r, c, s.circuit, String(s.circuit + 1).padStart(2, '0')
      + '<i>/</i>' + String(r.circuits.length).padStart(2, '0'));
    const wc = document.getElementById('wclock');
    if (wc) wc.textContent = mmss(now - s.startedAt);
    const ct = document.getElementById('ctimer');
    if (ct) {
      if (timed(c)) {
        const el = now - s.circuitStartedAt;
        ct.textContent = mmss(el);
        const bucket = Math.floor(el / 30000);
        if (bucket > 0 && bucket !== lastBeepBucket) { lastBeepBucket = bucket; beep(880, 260, 0.35); }
      } else { ct.textContent = ''; }
    }
    return;
  }

  if (s.phase === 'resting') {
    const next = r.circuits[s.nextCircuit];
    const left = Math.ceil(s.remaining / 1000);
    const counting = s.remaining <= 5000;
    if (counting && left !== lastCount && left > 0) { lastCount = left; beep(660, 140, 0.3); }
    if (painted !== 'rest' + s.nextCircuit) {
      root.innerHTML = `
        <div class="rest">
          <div class="restnum" id="restnum"></div>
          <div class="kicker">NEXT, CIRCUIT ${s.nextCircuit + 1} OF ${r.circuits.length}</div>
          <ul class="plain">${next.movements.map((m) =>
            `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}</li>`).join('')}</ul>
        </div>`;
      painted = 'rest' + s.nextCircuit;
      panels = [];
    }
    const n = document.getElementById('restnum');
    if (n) {
      n.textContent = counting ? String(left) : mmss(s.remaining);
      n.className = 'restnum' + (counting ? ' go' : '');
    }
    return;
  }

  if (s.phase === 'done') {
    if (painted !== 'done' + s.finishedAt) {
      const bars = (s.circuitMs || []).map((ms, i) => {
        const max = Math.max(...s.circuitMs);
        return `<div class="bar"><span style="width:${Math.round((ms / max) * 100)}%"></span>
                <i>${mmss(ms)}</i><u>${i + 1}</u></div>`;
      }).join('');
      root.innerHTML = `
        <div class="stats">
          <div class="kicker">DONE</div>
          <div class="total">${mmss(s.totalMs || 0)}</div>
          <div class="sub">${s.reps || 0} reps &middot; ${r.circuits.length} circuits</div>
          <div class="bars">${bars}</div>
        </div>`;
      painted = 'done' + s.finishedAt;
      panels = [];
      beep(523, 180, 0.3);
      setTimeout(() => beep(659, 180, 0.3), 200);
      setTimeout(() => beep(784, 420, 0.3), 400);
    }
  }
}

// ── the loop ─────────────────────────────────────────────────────────
// 24 frames a second, not 60. This is a 1GB Pi driving five animations
// at once, and nobody can tell the difference across a room.
let last = 0;
function frame(ts) {
  // The loop has to outlive its own bugs. An exception escaping here
  // would end the animation for good, on a screen nobody is watching.
  try {
    if (ts - last > 41) {
      last = ts;
      const now = Date.now();
      render(now);
      for (const p of panels) drawMovement(p.g, p.id, ts + p.offset);
    }
  } catch (e) {
    window.__gbErr = String((e && e.stack) || e);
    console.error('gymboard frame', e);
  }
}

// A timer, not requestAnimationFrame. An unattended board has to keep
// drawing even when the compositor decides nothing is watching, and a
// kiosk that freezes because the window was considered hidden is a board
// showing yesterday's circuit.
setInterval(() => frame(performance.now()), 42);

// Midnight and OTA. The kiosk has no keyboard, so the page checks for a
// new build and reloads itself.
const BOOT_VERSION = '0.2.3';
setInterval(async () => {
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();
    if (version && version !== BOOT_VERSION) location.reload();
  } catch { /* offline, try again next time */ }
}, 5 * 60 * 1000);

getDone().then((d) => { done = d; painted = ''; }).catch(() => {});

watchSession((s) => { session = s; painted = ''; }).catch(() => {
  // No network on boot. The idle screen still renders from routines.js,
  // which is exactly why the routines are local and not in the database.
});
