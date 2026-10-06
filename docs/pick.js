// ─────────────────────────────────────────────────────────────────────
// THE PHONE
//
// Home is the programme: five levels, the routines inside each one, and
// what you have finished ticked off. You pick what you are doing, which
// is usually the next one but does not have to be.
//
// Once a routine is running the phone becomes one big button at a time,
// because it is being read by somebody out of breath.
//
//   warm-up   ->  warm-up done
//   circuit   ->  end circuit
//   rest      ->  start circuit, only if you do not want to wait
//
// Rest running out needs no tap. It counts down, gives five seconds of
// countdown, and the next circuit is live.
// ─────────────────────────────────────────────────────────────────────

import { setSession, watchSession, recordWorkout, getDone } from './store.js?v=0.2.7';

const VERSION = '0.2.7';
const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let session = null;
let done = [];            // routine ids already finished
let openId = null;        // the routine being looked at, before it is started
let openLevels = null;    // which levels are expanded; null until progress is known

const all = () => (window.ROUTINES || []).slice()
  .sort((a, b) => (a.level - b.level) || (a.order - b.order));
const byId = (id) => (window.ROUTINES || []).find((r) => r.id === id);
const expand = (r) => window.expandRoutine(r);
const nextUp = () => window.nextRoutine(done);
const levels = () => [...new Set(all().map((r) => r.level))];

const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const label = (m) => m.reps != null ? String(m.reps)
  : m.distance_m != null ? m.distance_m + 'm'
  : m.seconds != null ? mmss(m.seconds * 1000) : '';
const nice = (s) => esc(String(s).replace(/-/g, ' '));

const totals = (r) => {
  const e = expand(r);
  return {
    circuits: e.circuits.length,
    reps: e.circuits.reduce((t, c) => t + c.movements.reduce((u, m) => u + (m.reps || 0), 0), 0),
  };
};

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('up'), 1600);
}

/// Same derivation the TV uses. Rest expiring is not an event, it is just
/// what the clock says, so both ends agree without talking to each other.
function live(now) {
  if (!session || !session.phase) return { phase: 'idle' };
  if (session.phase === 'resting' && now >= session.restEndsAt) {
    return Object.assign({}, session, { phase: 'running', circuit: session.nextCircuit,
      circuitStartedAt: session.restEndsAt });
  }
  return session;
}

async function write(state) {
  try { await setSession(state); } catch { toast('No connection'); }
}

// ── the moves ────────────────────────────────────────────────────────
function startRoutine(id) {
  const r = expand(byId(id));
  if (r.warmup && r.warmup.length) return write({ routineId: r.id, phase: 'warmup' });
  const now = Date.now();
  return write({ routineId: r.id, phase: 'running', circuit: 0,
                 startedAt: now, circuitStartedAt: now, circuitMs: [] });
}

function warmupDone() {
  const now = Date.now();
  return write({ routineId: session.routineId, phase: 'running', circuit: 0,
                 startedAt: now, circuitStartedAt: now, circuitMs: [] });
}

async function endCircuit() {
  const now = Date.now();
  const s = live(now);
  const r = expand(byId(s.routineId));
  const c = r.circuits[s.circuit];
  const circuitMs = (s.circuitMs || []).slice();
  circuitMs[s.circuit] = now - s.circuitStartedAt;

  if (s.circuit >= r.circuits.length - 1) {
    const reps = totals(byId(s.routineId)).reps;
    const totalMs = now - s.startedAt;
    await write({ routineId: r.id, phase: 'done', circuitMs, totalMs, reps, finishedAt: now });
    recordWorkout({ routineId: r.id, ms: totalMs, reps, circuits: r.circuits.length })
      .then(() => { if (done.indexOf(r.id) < 0) done = done.concat([r.id]); })
      .catch(() => { /* the stats can miss one rather than block the board */ });
    return;
  }

  const rest = (c.rest_after_seconds || 0) * 1000;
  if (!rest) {
    return write({ routineId: r.id, phase: 'running', circuit: s.circuit + 1,
                   startedAt: s.startedAt, circuitStartedAt: now, circuitMs });
  }
  return write({ routineId: r.id, phase: 'resting', circuit: s.circuit,
                 nextCircuit: s.circuit + 1, restEndsAt: now + rest,
                 startedAt: s.startedAt, circuitMs });
}

function skipRest() {
  return write({ routineId: session.routineId, phase: 'running',
                 circuit: session.nextCircuit, startedAt: session.startedAt,
                 circuitStartedAt: Date.now(), circuitMs: session.circuitMs || [] });
}

const goHome = () => { openId = null; return write({ phase: 'idle' }); };

function abandon() {
  if (!confirm('Stop this workout? It will not be recorded.')) return;
  goHome();
}

// ── home: the programme ──────────────────────────────────────────────
function renderHome() {
  const next = nextUp();
  if (openLevels === null) openLevels = new Set([next.level]);

  const body = levels().map((lv) => {
    const rs = all().filter((r) => r.level === lv);
    const finished = rs.filter((r) => done.indexOf(r.id) >= 0).length;
    const open = openLevels.has(lv);
    const rows = !open ? '' : rs.map((r) => {
      const isDone = done.indexOf(r.id) >= 0;
      const isNext = r.id === next.id;
      const t = totals(r);
      return `<button class="row${isDone ? ' done' : ''}${isNext ? ' next' : ''}" data-rid="${esc(r.id)}">
          <span class="tick">${isDone ? '&check;' : r.order}</span>
          <span class="rname">${esc(r.name)}
            <em>${t.circuits} circuits &middot; ${t.reps} reps</em></span>
          ${isNext ? '<i>next</i>' : ''}
        </button>`;
    }).join('');
    return `<div class="lvlblk">
        <button class="lvl${open ? ' open' : ''}" data-lvl="${lv}">
          <span>Level ${lv}</span><em>${finished} of ${rs.length}</em>
        </button>
        ${rows}
      </div>`;
  }).join('');

  root.innerHTML = `
    <header>
      <div class="kicker">GYMBOARD</div>
      <h1>${done.length} of ${all().length}</h1>
      <div class="sub">routines finished</div>
    </header>
    ${body}
    <div class="foot"><span>v${VERSION}</span><button id="upd">Check for updates</button></div>`;

  root.querySelectorAll('[data-lvl]').forEach((b) => b.addEventListener('click', () => {
    const lv = Number(b.dataset.lvl);
    if (openLevels.has(lv)) openLevels.delete(lv); else openLevels.add(lv);
    render();
  }));
  root.querySelectorAll('[data-rid]').forEach((b) => b.addEventListener('click', () => {
    openId = b.dataset.rid;
    render();
  }));
  bind('#upd', checkForUpdate);
}

// ── a routine, before you commit to it ───────────────────────────────
function renderRoutine() {
  const raw = byId(openId);
  const r = expand(raw);
  const t = totals(raw);
  const isDone = done.indexOf(r.id) >= 0;
  root.innerHTML = `
    <button class="back" id="back">&larr; All routines</button>
    <header>
      <div class="kicker">LEVEL ${r.level} &middot; ROUTINE ${r.order}${isDone ? ' &middot; DONE' : ''}</div>
      <h1>${esc(r.name)}</h1>
      <div class="sub">${t.circuits} circuits &middot; ${t.reps} reps</div>
    </header>
    ${r.warmup && r.warmup.length ? `<div class="blk">
      <div class="kicker">WARM-UP</div>
      <ul class="list">${r.warmup.map((m) =>
        `<li><b>${label(m)}</b> ${nice(m.movement)}${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
    </div>` : ''}
    ${r.circuits.map((c, i) => `<div class="blk">
      <div class="kicker">CIRCUIT ${i + 1}${c.rest_after_seconds
        ? ' &middot; ' + c.rest_after_seconds + 's REST AFTER' : ''}</div>
      <ul class="list">${c.movements.map((m) =>
        `<li><b>${label(m)}</b> ${nice(m.movement)}${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
    </div>`).join('')}
    <button class="go" id="start">${isDone ? 'Do it again' : 'Start'}</button>`;
  bind('#back', () => { openId = null; render(); });
  bind('#start', () => startRoutine(r.id));
}

// ── the workout ──────────────────────────────────────────────────────
function render() {
  const now = Date.now();
  const s = live(now);

  if (s.phase === 'idle') return openId ? renderRoutine() : renderHome();

  const r = expand(byId(s.routineId));

  if (s.phase === 'warmup') {
    root.innerHTML = `
      <header><div class="kicker">WARM-UP</div><h1>${esc(r.name)}</h1></header>
      <ul class="list">${(r.warmup || []).map((m) =>
        `<li><b>${label(m)}</b> ${nice(m.movement)}${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
      <button class="go" id="done">Warm-up done</button>
      <button class="quiet" id="stop">Stop</button>`;
    bind('#done', warmupDone);
    bind('#stop', abandon);
    return;
  }

  if (s.phase === 'running') {
    const c = r.circuits[s.circuit];
    root.innerHTML = `
      <header>
        <div class="kicker">CIRCUIT ${s.circuit + 1} OF ${r.circuits.length}</div>
        <h1 id="clock">${mmss(now - s.startedAt)}</h1>
      </header>
      <ul class="list">${c.movements.map((m) =>
        `<li><b>${label(m)}</b> ${nice(m.movement)}${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
      <button class="go" id="end">End circuit</button>
      <button class="quiet" id="stop">Stop</button>`;
    bind('#end', endCircuit);
    bind('#stop', abandon);
    return;
  }

  if (s.phase === 'resting') {
    root.innerHTML = `
      <header><div class="kicker">REST</div><h1 id="clock">${mmss(s.restEndsAt - now)}</h1></header>
      <div class="sub">Circuit ${s.nextCircuit + 1} is next. It starts on its own.</div>
      <ul class="list">${r.circuits[s.nextCircuit].movements.map((m) =>
        `<li><b>${label(m)}</b> ${nice(m.movement)}</li>`).join('')}</ul>
      <button class="go" id="skip">Start circuit now</button>
      <button class="quiet" id="stop">Stop</button>`;
    bind('#skip', skipRest);
    bind('#stop', abandon);
    return;
  }

  if (s.phase === 'done') {
    root.innerHTML = `
      <header><div class="kicker">DONE</div><h1>${mmss(s.totalMs || 0)}</h1>
        <div class="sub">${s.reps || 0} reps &middot; ${(s.circuitMs || []).length} circuits</div></header>
      <ul class="list">${(s.circuitMs || []).map((ms, i) =>
        `<li><b>${mmss(ms)}</b> circuit ${i + 1}</li>`).join('')}</ul>
      <button class="go" id="home">All routines</button>`;
    bind('#home', goHome);
  }
}

function bind(sel, fn) {
  const el = root.querySelector(sel);
  if (el) el.addEventListener('click', fn);
}

/// Only the clock moves between renders, so patch it rather than
/// rebuilding the screen under somebody's thumb.
setInterval(() => {
  const now = Date.now();
  const el = document.getElementById('clock');
  if (!el || !session) return;
  if (session.phase === 'running') el.textContent = mmss(now - session.startedAt);
  else if (session.phase === 'resting') {
    if (now >= session.restEndsAt) render();
    else el.textContent = mmss(session.restEndsAt - now);
  }
}, 500);

// ── OTA ──────────────────────────────────────────────────────────────
async function checkForUpdate() {
  const btn = root.querySelector('#upd');
  if (!btn) return;
  btn.textContent = 'Checking...';
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();
    if (version && version !== VERSION) {
      btn.textContent = `Installing v${version}...`;
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) { await reg.update().catch(() => {}); await reg.unregister().catch(() => {}); }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      location.reload();
      return;
    }
    btn.textContent = 'Up to date';
  } catch { btn.textContent = 'No connection'; }
  setTimeout(() => {
    const b = root.querySelector('#upd');
    if (b) b.textContent = 'Check for updates';
  }, 2200);
}

// ── go ───────────────────────────────────────────────────────────────
render();
getDone().then((d) => { done = d; render(); }).catch(() => { /* offer level one */ });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((reg) => reg.update().catch(() => {}))
    .catch(() => {});
}

watchSession((s) => { session = s; render(); }).catch(() => {
  toast('Offline, the board will not follow');
});
