// Network first, so a push lands as soon as there is a signal, with the
// cached copy standing in when there is not. Same approach as Parchis.
//
// The page itself is fetched past the HTTP cache: GitHub Pages serves a
// ten-minute max-age, and "network first" through a browser cache is just
// the stale copy wearing a network hat. The ?v= stamps bust the rest.

const CACHE = 'gymboard-v10';
const SHELL = [
  './',
  'index.html',
  'tv.html',
  'sheet.html',
  'styles.css',
  'routines.js',
  'exercise.js',
  'store.js',
  'pick.js',
  'tv.js',
  'version.json',
  'manifest.webmanifest',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;   // Firebase, gstatic: leave alone

  const isPage = e.request.mode === 'navigate' ||
                 e.request.destination === 'document';

  e.respondWith(
    fetch(isPage ? new Request(e.request.url, { cache: 'no-store' }) : e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('index.html')))
  );
});
