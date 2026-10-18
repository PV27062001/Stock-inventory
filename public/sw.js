// Simple offline-first service worker for the PWA.
const CACHE = 'sriamman-v1';

// Pre-cache the app entry so it can open with no network.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg']))
      .catch(() => {})
  );
  self.skipWaiting();
});

// Drop old caches on activate.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let Firebase and external APIs go to network directly.
  if (url.origin !== self.location.origin) return;
  // Never cache API routes (live rates / news) — always hit the network.
  if (url.pathname.startsWith('/api/')) return;

  // Page navigations: network-first, fall back to cache so the app still opens offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Static assets (JS/CSS/fonts/images): cache-first for speed, then network.
  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request)
          .then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            return response;
          })
          .catch(() => cached)
    )
  );
});
