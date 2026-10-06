// ─────────────────────────────────────────────────────────────────────
// THE TV
//
// Boots into the kiosk and never navigates. It renders whatever the
// session document says and works the rest out from the clock: rest
// running out and the next circuit starting need no write, so a phone
// asleep in a pocket cannot stall the board.
//
// Nobody will ever touch this screen, so it looks after itself. It pulls
// its own updates, it never shows an error, and the loop survives its own
// exceptions, because a board that dies silently is the one failure
// nobody is standing there to see.
// ─────────────────────────────────────────────────────────────────────

import { watchSession, getDone } from './store.js?v=0.2.5';
import { drawMovement } from './exercise.js?v=0.2.5';

const root = document.getElementById('root');
const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let session = null;
let done = [];
let painted = '';          // what the DOM holds, so it only rebuilds on a change
let panels = [];           // { g, id, offset }

const all = () => (window.ROUTINES || []);
const byId = (id) => all().find((r) => r.id === id);
const expand = (r) => window.expandRoutine(r);
const upNext = () => expand(window.nextRoutine(done));

const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const label = (m) => m.reps != null ? String(m.reps)
  : m.distance_m != null ? m.distance_m + '<i>m</i>'
  : m.seconds != null ? mmss(m.seconds * 1000) : '';
const nice = (s) => esc(String(s).replace(/-/g, ' '));
const timed = (c) => c.movements.some((m) => m.seconds != null);
const repsOf = (r) => r.circuits.reduce((t, c) =>
  t + c.movements.reduce((u, m) => u + (m.reps || 0), 0), 0);

// ── what is actually happening right now ─────────────────────────────
function live(now) {
  if (!session || !session.phase || session.phase === 'idle') return { phase: 'idle' };
  if (session.phase === 'resting') {
    if (now >= session.restEndsAt) {
      return { phase: 'running', routineId: session.routineId, circuit: session.nextCircuit,
               circuitStartedAt: session.restEndsAt, startedAt: session.startedAt };
    }
    return Object.assign({}, session, { remaining: session.restEndsAt - now });
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

// ── pieces ───────────────────────────────────────────────────────────
/// One segment per circuit across the very top, so how far through you
/// are reads from the doorway with no words on screen.
function segs(total, current) {
  let out = '<div class="segs">';
  for (let i = 0; i < total; i++) {
    out += `<span class="${i < current ? 'seg on' : i === current ? 'seg now' : 'seg'}"></span>`;
  }
  return out + '</div>';
}

function cell(m) {
  return `<div class="cell">
      <svg class="art" viewBox="14 22 176 164" data-move="${esc(m.movement)}"></svg>
      <div class="rep">${label(m)}</div>
      <div class="mv">${nice(m.movement)}</div>
      ${m.note ? `<div class="note">${esc(m.note)}</div>` : ''}
    </div>`;
}

function wire() {
  panels = [...root.querySelectorAll('.art')].map((svg, i) => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);
    return { g, id: svg.dataset.move, offset: i * 370 };
  });
}

// ── screens ──────────────────────────────────────────────────────────
function paintIdle() {
  const r = upNext();
  const key = 'idle' + r.id + done.length;
  if (painted === key) return;
  root.innerHTML = `
    ${segs(r.circuits.length, -1)}
    <header class="single">
      <div>
        <div class="kicker">LEVEL ${r.level} &middot; ROUTINE ${r.order} &middot; ${done.length} OF ${all().length} DONE</div>
        <h1>${esc(r.name)}</h1>
      </div>
      <div class="facts">
        <div class="fact"><b>${r.circuits.length}</b><span>CIRCUITS</span></div>
        <div class="fact"><b>${repsOf(r)}</b><span>REPS</span></div>
      </div>
    </header>
    <div class="strip faded">${r.circuits[0].movements.map(cell).join('')}</div>
    <div class="hint">Start it on your phone</div>`;
  painted = key;
  wire();
}

function paintStrip(key, head, movements) {
  if (painted === key) return;
  root.innerHTML = head + `<div class="strip">${movements.map(cell).join('')}</div>`;
  painted = key;
  wire();
}

function render(now) {
  const s = live(now);
  if (s.phase === 'idle') return paintIdle();

  const raw = byId(s.routineId);
  if (!raw) return paintIdle();
  const r = expand(raw);

  if (s.phase === 'warmup') {
    paintStrip('warm' + r.id, `
      ${segs(r.circuits.length, -1)}
      <header>
        <div class="clock"><b>&mdash;</b><span>ELAPSED</span></div>
        <div class="tmr"></div>
        <div class="count"><b>WARM<i>&middot;</i>UP</b><span>${esc(r.name).toUpperCase()}</span></div>
      </header>`, r.warmup || []);
    return;
  }

  if (s.phase === 'running') {
    const c = r.circuits[s.circuit];
    if (!c) return;
    paintStrip('c' + s.circuit + r.id, `
      ${segs(r.circuits.length, s.circuit)}
      <header>
        <div class="clock"><b id="wclock">0:00</b><span>ELAPSED</span></div>
        <div class="tmr" id="ctimer"></div>
        <div class="count"><b>${String(s.circuit + 1).padStart(2, '0')}<i>/</i>${String(r.circuits.length).padStart(2, '0')}</b>
          <span>CIRCUIT</span></div>
      </header>`, c.movements);

    const wc = document.getElementById('wclock');
    if (wc) wc.textContent = mmss(now - s.startedAt);
    const ct = document.getElementById('ctimer');
    if (ct) {
      if (timed(c)) {
        const el = now - s.circuitStartedAt;
        ct.textContent = mmss(el);
        const bucket = Math.floor(el / 30000);
        if (bucket > 0 && bucket !== lastBeepBucket) { lastBeepBucket = bucket; beep(880, 260, 0.35); }
      } else if (ct.textContent) { ct.textContent = ''; }
    }
    return;
  }

  if (s.phase === 'resting') {
    const next = r.circuits[s.nextCircuit];
    const left = Math.ceil(s.remaining / 1000);
    const counting = s.remaining <= 5000;
    if (counting && left !== lastCount && left > 0) { lastCount = left; beep(660, 140, 0.3); }
    const key = 'rest' + s.nextCircuit + r.id;
    if (painted !== key) {
      root.innerHTML = `
        ${segs(r.circuits.length, s.nextCircuit - 1)}
        <div class="rest">
          <div class="kicker">REST</div>
          <div class="restnum" id="restnum"></div>
          <div class="kicker up">COMING UP, CIRCUIT ${s.nextCircuit + 1} OF ${r.circuits.length}</div>
          <ul class="plain">${next.movements.map((m) =>
            `<li><b>${label(m)}</b><span>${nice(m.movement)}</span></li>`).join('')}</ul>
        </div>`;
      painted = key;
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
    const key = 'done' + s.finishedAt;
    if (painted !== key) {
      const ms = s.circuitMs || [];
      const max = Math.max.apply(null, ms.concat([1]));
      const bars = ms.map((v, i) =>
        `<div class="bar"><u>${i + 1}</u><span style="width:${Math.max(4, Math.round((v / max) * 100))}%"></span><i>${mmss(v)}</i></div>`
      ).join('');
      root.innerHTML = `
        ${segs(ms.length, ms.length)}
        <div class="stats">
          <div class="kicker">${esc(r.name).toUpperCase()} &middot; DONE</div>
          <div class="total">${mmss(s.totalMs || 0)}</div>
          <div class="facts row">
            <div class="fact"><b>${s.reps || 0}</b><span>REPS</span></div>
            <div class="fact"><b>${ms.length}</b><span>CIRCUITS</span></div>
            <div class="fact"><b>${done.length + 1}</b><span>OF ${all().length}</span></div>
          </div>
          <div class="bars">${bars}</div>
        </div>`;
      painted = key;
      panels = [];
      beep(523, 180, 0.3);
      setTimeout(() => beep(659, 180, 0.3), 200);
      setTimeout(() => beep(784, 420, 0.3), 400);
    }
  }
}

// ── the loop ─────────────────────────────────────────────────────────
// A timer, not requestAnimationFrame. An unattended board has to keep
// drawing even when the compositor decides nobody is watching, and 24
// frames a second is plenty on a 1GB Pi driving five animations at once.
let last = 0;
function frame(ts) {
  try {
    if (ts - last > 41) {
      last = ts;
      render(Date.now());
      for (const p of panels) drawMovement(p.g, p.id, ts + p.offset);
    }
  } catch (e) {
    window.__gbErr = String((e && e.stack) || e);
    console.error('gymboard frame', e);
  }
}
setInterval(() => frame(performance.now()), 42);

// OTA. The kiosk has no keyboard, so the page checks for a new build and
// reloads itself.
const BOOT_VERSION = '0.2.5';
setInterval(async () => {
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();
    if (version && version !== BOOT_VERSION) location.reload();
  } catch { /* offline, try again next time */ }
}, 5 * 60 * 1000);

getDone().then((d) => { done = d; painted = ''; }).catch(() => {});

watchSession((s) => {
  session = s;
  painted = '';
  if (!s || s.phase === 'idle') getDone().then((d) => { done = d; painted = ''; }).catch(() => {});
}).catch(() => {
  // No network on boot. The idle screen still renders from routines.js,
  // which is exactly why the routines are local and not in the database.
});
