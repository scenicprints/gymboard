// ─────────────────────────────────────────────────────────────────────
// THE TV
//
// Boots into the kiosk and never navigates. Shows whatever the phone
// selected; with nothing selected it follows the week, so walking in on
// a Tuesday already shows Tuesday.
//
// Nobody is ever going to click anything here, so it also has to look
// after itself: roll over at midnight, and pull its own updates.
// ─────────────────────────────────────────────────────────────────────

import { watch } from './store.js?v=0.1.0';

const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
              'Friday', 'Saturday'];

const root = document.getElementById('root');
const P = window.PROGRAM;

let selected = null;          // null means "follow the week"
let shownDay = new Date().getDay();

const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function sessionById(id) {
  return P.sessions.find((s) => s.id === id) || null;
}

function todaysSession() {
  return sessionById(P.week[DAYS[new Date().getDay()]]);
}

function banner() {
  return P.placeholder
    ? `<div class="banner">Placeholder program. Edit docs/program.js.</div>`
    : '';
}

function render() {
  const now = new Date();
  const dayName = LONG[now.getDay()];
  const session = selected ? sessionById(selected) : todaysSession();

  if (!session) {
    root.innerHTML = `
      <div class="big rest">
        <div class="headline">REST</div>
        <div class="sub">${esc(dayName)}</div>
      </div>${banner()}`;
    return;
  }

  const rows = session.work.map((w) => {
    const blank = w.load === null || w.load === undefined || w.load === '';
    // A bare number gets the units; anything written out ("bodyweight",
    // "band") is already a sentence and gets left alone.
    const unit = (typeof w.load === 'number' || /^[\d.]+$/.test(String(w.load)))
      ? `<span class="unit">${esc(P.units)}</span>` : '';
    const load = blank
      ? `<div class="load blank">&mdash;</div>`
      : `<div class="load">${esc(w.load)}${unit}</div>`;
    return `
      <div class="row">
        <div>
          <div class="name">${esc(w.name)}</div>
          ${w.note ? `<div class="note">${esc(w.note)}</div>` : ''}
        </div>
        <div class="sets">${esc(w.sets)} &times; ${esc(w.reps)}</div>
        ${load}
      </div>`;
  }).join('');

  root.innerHTML = `
    <header>
      <div>
        <h1>${esc(session.name)}</h1>
        ${session.focus ? `<div class="focus">${esc(session.focus)}</div>` : ''}
      </div>
      <div class="today"><b>${esc(dayName)}</b></div>
    </header>
    <div class="work">${rows}</div>
    ${banner()}`;
}

// ── keep itself honest ───────────────────────────────────────────────

/// Midnight rollover. Nobody is here to refresh it.
setInterval(() => {
  const d = new Date().getDay();
  if (d !== shownDay) { shownDay = d; render(); }
}, 60 * 1000);

/// OTA. The kiosk has no keyboard, so the page checks for a new build and
/// reloads itself. version.json is fetched past the HTTP cache because
/// GitHub Pages serves a ten-minute max-age.
const BOOT_VERSION = '0.1.0';
setInterval(async () => {
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();
    if (version && version !== BOOT_VERSION) location.reload();
  } catch { /* offline, try again next time */ }
}, 5 * 60 * 1000);

// ── go ───────────────────────────────────────────────────────────────

render();

watch((id) => {
  selected = id;
  render();
}).catch(() => {
  // No network on boot. The week still renders from program.js, which is
  // the whole point of keeping the schedule local.
});
