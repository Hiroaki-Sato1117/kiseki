// KISEKI Service Worker — offline-first app shell + runtime font caching
const VERSION = 'kiseki-v6';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== 'kiseki-fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Firestore/Auth realtime channels: always network (never cache)
  if (url.hostname === 'firestore.googleapis.com' || url.hostname === 'identitytoolkit.googleapis.com' || url.hostname === 'securetoken.googleapis.com') return;

  // Google Fonts & Firebase SDK: stale-while-revalidate
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com' || url.hostname === 'www.gstatic.com') {
    e.respondWith(
      caches.open('kiseki-fonts').then(async cache => {
        const cached = await cache.match(e.request);
        const network = fetch(e.request).then(res => { cache.put(e.request, res.clone()); return res; }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Same-origin navigation & shell: network-first with cache fallback (so updates land, offline still works)
  if (url.origin === location.origin) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(VERSION).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
  }
});
