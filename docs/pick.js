// ─────────────────────────────────────────────────────────────────────
// THE PHONE
//
// The controller. One big button at a time, because it is being used by
// somebody out of breath who is not going to read anything.
//
//   next routine  ->  start
//   warm-up       ->  warm-up done
//   circuit       ->  end circuit
//   rest          ->  start circuit, if you do not want to wait
//
// Rest running out needs no tap. It counts down, gives five seconds of
// countdown, and the next circuit is live. The button is only there for
// when you want to cut it short.
// ─────────────────────────────────────────────────────────────────────

import { setSession, watchSession, recordWorkout, getDone } from './store.js?v=0.2.1';

const VERSION = '0.2.1';
const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let session = null;
let showRundown = false;
let done = [];   // routine ids already finished
let chosen = null;  // a routine picked by hand, overriding the next one
let showList = false;

const routines = () => (window.ROUTINES || []).map(window.expandRoutine);
const upNext = () => {
  if (chosen) {
    const r = (window.ROUTINES || []).find((x) => x.id === chosen);
    if (r) return window.expandRoutine(r);
  }
  return window.expandRoutine(window.nextRoutine(done));
};
const allRoutines = () => (window.ROUTINES || []).slice()
  .sort((a, b) => (a.level - b.level) || (a.order - b.order));
const routineById = (id) => routines().find((r) => r.id === id) || routines()[0];

const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
const label = (m) => m.reps != null ? String(m.reps)
  : m.distance_m != null ? m.distance_m + 'm'
  : m.seconds != null ? mmss(m.seconds * 1000) : '';

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('up'), 1600);
}

/// Same derivation the TV uses. Rest expiring is not an event, it is
/// just what the clock says, so both ends agree without talking.
function live(now) {
  if (!session || !session.phase) return { phase: 'idle' };
  if (session.phase === 'resting' && now >= session.restEndsAt) {
    return { ...session, phase: 'running', circuit: session.nextCircuit,
             circuitStartedAt: session.restEndsAt };
  }
  return session;
}

async function write(state) {
  try { await setSession(state); } catch { toast('No connection'); }
}

// ── the moves ────────────────────────────────────────────────────────
function start() {
  const r = upNext();
  const hasWarmup = r.warmup && r.warmup.length;
  if (hasWarmup) return write({ routineId: r.id, phase: 'warmup' });
  const now = Date.now();
  return write({ routineId: r.id, phase: 'running', circuit: 0,
                 startedAt: now, circuitStartedAt: now, circuitMs: [] });
}

function warmupDone() {
  const r = routineById(session.routineId);
  const now = Date.now();
  return write({ routineId: r.id, phase: 'running', circuit: 0,
                 startedAt: now, circuitStartedAt: now, circuitMs: [] });
}

async function endCircuit() {
  const now = Date.now();
  const s = live(now);
  const r = routineById(s.routineId);
  const c = r.circuits[s.circuit];
  const circuitMs = (s.circuitMs || []).slice();
  circuitMs[s.circuit] = now - s.circuitStartedAt;

  const isLast = s.circuit >= r.circuits.length - 1;
  if (isLast) {
    const reps = r.circuits.reduce((t, cc) =>
      t + cc.movements.reduce((u, m) => u + (m.reps || 0), 0), 0);
    const totalMs = now - s.startedAt;
    await write({ routineId: r.id, phase: 'done', circuitMs,
                  totalMs, reps, finishedAt: now });
    recordWorkout({ routineId: r.id, ms: totalMs, reps, circuits: r.circuits.length })
      .then(() => { done = done.concat([r.id]); })
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
  const now = Date.now();
  const s = session;
  return write({ routineId: s.routineId, phase: 'running', circuit: s.nextCircuit,
                 startedAt: s.startedAt, circuitStartedAt: now,
                 circuitMs: s.circuitMs || [] });
}

const goHome = () => write({ phase: 'idle' });

function abandon() {
  if (!confirm('Stop this workout? It will not be recorded.')) return;
  goHome();
}

// ── screens ──────────────────────────────────────────────────────────
function render() {
  const now = Date.now();
  const s = live(now);

  if (s.phase === 'idle') {
    const r = upNext();
    const reps = r.circuits.reduce((t, c) =>
      t + c.movements.reduce((u, m) => u + (m.reps || 0), 0), 0);
    root.innerHTML = `
      <header>
        <div class="kicker">LEVEL ${r.level} &middot; ROUTINE ${r.order}</div>
        <h1>${esc(r.name)}</h1>
        <div class="sub">${r.circuits.length} circuits &middot; ${reps} reps</div>
      </header>
      ${showRundown ? rundown(r) : ''}
      <button class="go" id="start">Start</button>
      <button class="ghost" id="peek">${showRundown ? 'Hide the rundown' : 'See the rundown'}</button>
      <button class="ghost" id="pick">${showList ? 'Close the list' : 'Pick a different routine'}</button>
      ${showList ? routineList(r) : ''}
      <div class="foot"><span>v${VERSION}</span><button id="upd">Check for updates</button></div>`;
    bind('#start', start);
    bind('#peek', () => { showRundown = !showRundown; render(); });
    bind('#pick', () => { showList = !showList; render(); });
    root.querySelectorAll('[data-rid]').forEach((b) => b.addEventListener('click', () => {
      chosen = b.dataset.rid; showList = false; showRundown = false; render();
    }));
    bind('#upd', checkForUpdate);
    return;
  }

  const r = routineById(s.routineId);

  if (s.phase === 'warmup') {
    root.innerHTML = `
      <header><div class="kicker">WARM-UP</div><h1>${esc(r.name)}</h1></header>
      <ul class="list">${(r.warmup || []).map((m) =>
        `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}
         ${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
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
        `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}
         ${m.note ? `<i>${esc(m.note)}</i>` : ''}</li>`).join('')}</ul>
      <button class="go" id="end">End circuit</button>
      <button class="quiet" id="stop">Stop</button>`;
    bind('#end', endCircuit);
    bind('#stop', abandon);
    return;
  }

  if (s.phase === 'resting') {
    const left = s.restEndsAt - now;
    root.innerHTML = `
      <header><div class="kicker">REST</div><h1 id="clock">${mmss(left)}</h1></header>
      <div class="sub">Circuit ${s.nextCircuit + 1} is next. It starts on its own.</div>
      <ul class="list">${r.circuits[s.nextCircuit].movements.map((m) =>
        `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}</li>`).join('')}</ul>
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
      <button class="go" id="home">Home</button>`;
    bind('#home', goHome);
  }
}

/// Every routine, in order, so a day one or a repeat is one tap away.
/// Finished ones are marked rather than hidden: you are allowed to redo one.
function routineList(current) {
  let level = 0;
  return '<div class="rundown">' + allRoutines().map((r) => {
    const head = r.level !== level ? (level = r.level,
      `<div class="kicker" style="margin:18px 0 6px">LEVEL ${r.level}</div>`) : '';
    const isNow = r.id === current.id;
    const isDone = done.indexOf(r.id) >= 0;
    return head + `<button class="row${isNow ? ' on' : ''}" data-rid="${esc(r.id)}">
        <b>${r.order}</b> ${esc(r.name)}
        <i>${isDone ? 'done' : isNow ? 'next' : ''}</i>
      </button>`;
  }).join('') + '</div>';
}

function rundown(r) {
  return `<div class="rundown">
    ${r.warmup && r.warmup.length ? `<div class="blk"><div class="kicker">WARM-UP</div>
      <ul class="list">${r.warmup.map((m) =>
        `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}</li>`).join('')}</ul></div>` : ''}
    ${r.circuits.map((c, i) => `<div class="blk">
      <div class="kicker">CIRCUIT ${i + 1}${c.rest_after_seconds
        ? ' &middot; ' + c.rest_after_seconds + 's REST AFTER' : ''}</div>
      <ul class="list">${c.movements.map((m) =>
        `<li><b>${label(m)}</b> ${esc(m.movement.replace(/-/g, ' '))}</li>`).join('')}</ul>
    </div>`).join('')}</div>`;
}

function bind(sel, fn) {
  const el = root.querySelector(sel);
  if (el) el.addEventListener('click', fn);
}

/// Only the clock moves between renders, so patch it rather than
/// rebuilding the screen under someone's thumb.
setInterval(() => {
  const now = Date.now();
  const s = live(now);
  const el = document.getElementById('clock');
  if (!el) return;
  if (s.phase === 'running') el.textContent = mmss(now - s.startedAt);
  else if (s.phase === 'resting') {
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
  setTimeout(() => { const b = root.querySelector('#upd'); if (b) b.textContent = 'Check for updates'; }, 2200);
}

// ── go ───────────────────────────────────────────────────────────────
render();
getDone().then((d) => { done = d; render(); }).catch(() => { /* offer routine one */ });

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((reg) => reg.update().catch(() => {}))
    .catch(() => {});
}

watchSession((s) => { session = s; render(); }).catch(() => {
  toast('Offline, the board will not follow');
});
