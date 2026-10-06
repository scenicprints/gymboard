// ─────────────────────────────────────────────────────────────────────
// THE PHONE
//
// A list of workouts. Tap one and it is on the TV. That is the app.
//
// Installs to the home screen, so there is no address bar and no browser
// to get into. After tapping, the phone can lock; the TV is driven by the
// board, not by this page.
// ─────────────────────────────────────────────────────────────────────

import { select, watch } from './store.js?v=0.1.0';

const VERSION = '0.1.0';
const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

const root = document.getElementById('root');
const toastEl = document.getElementById('toast');
const P = window.PROGRAM;

let live = null;        // what the TV is showing, null = following the week

const esc = (s) => String(s).replace(/[&<>"]/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

let toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('up');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('up'), 1600);
}

function todayId() {
  return P.week[DAYS[new Date().getDay()]] || null;
}

function render() {
  const today = todayId();

  const cards = P.sessions.map((s) => {
    const cls = ['card'];
    if (live === s.id) cls.push('on', 'live');
    const tag = s.id === today ? `<span class="tag">TODAY</span>` : '';
    return `
      <button class="${cls.join(' ')}" data-id="${esc(s.id)}">
        ${tag}
        <div class="name">${esc(s.name)}</div>
        <div class="meta">${s.work.length} lifts${s.focus ? ' &middot; ' + esc(s.focus) : ''}</div>
      </button>`;
  }).join('');

  root.innerHTML = `
    <header>
      <h1>Gymboard</h1>
      <div class="sub">${live
        ? 'On the TV now'
        : 'Following the week'}</div>
    </header>
    ${cards}
    <button class="ghost" id="clear">Follow the week</button>
    ${P.placeholder
      ? `<div class="sub" style="margin-top:14px">Placeholder program. Replace docs/program.js.</div>`
      : ''}
    <div class="foot">
      <span>v${VERSION}</span>
      <button id="upd">Check for updates</button>
    </div>`;

  root.querySelectorAll('.card').forEach((b) => {
    b.addEventListener('click', async () => {
      const id = b.dataset.id;
      try {
        await select(id);
        toast('On the TV');
      } catch {
        toast('No connection');
      }
    });
  });

  root.querySelector('#clear').addEventListener('click', async () => {
    try {
      await select(null);
      toast('Following the week');
    } catch {
      toast('No connection');
    }
  });

  root.querySelector('#upd').addEventListener('click', checkForUpdate);
}

// ── OTA ──────────────────────────────────────────────────────────────
//
// Same shape as BodyComp's updater, in PWA terms: ask whether a newer
// build is published, and if so take it and restart. The service worker
// is network-first, so the only thing standing between a push and a new
// app is this button, or the next cold start.

async function checkForUpdate() {
  const btn = root.querySelector('#upd');
  btn.textContent = 'Checking...';
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();

    if (version && version !== VERSION) {
      btn.textContent = `Installing v${version}...`;
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) {
        await reg.update().catch(() => {});
        await reg.unregister().catch(() => {});
      }
      if (window.caches) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      location.reload();
      return;
    }

    btn.textContent = 'Up to date';
    btn.classList.remove('ready');
  } catch {
    btn.textContent = 'No connection';
  }
  setTimeout(() => { btn.textContent = 'Check for updates'; }, 2200);
}

/// Quiet check on open, so the button already knows the answer.
async function peek() {
  try {
    const r = await fetch('version.json', { cache: 'no-store' });
    const { version } = await r.json();
    if (version && version !== VERSION) {
      const btn = root.querySelector('#upd');
      btn.textContent = `Update to v${version}`;
      btn.classList.add('ready');
    }
  } catch { /* offline */ }
}

// ── go ───────────────────────────────────────────────────────────────

render();
peek();

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then((reg) => reg.update().catch(() => {}))
    .catch(() => {});
}

watch((id) => {
  live = id;
  render();
  peek();
}).catch(() => {
  toast('Offline, picks will not reach the TV');
});
