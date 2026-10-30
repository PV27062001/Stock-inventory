// Simple offline-capable service worker for the browser-installed PWA.
// (The Android app doesn't use it; it always loads the live site.)
//
// Update rules, so a new deploy shows up without reinstalling:
// - /_next/static/* file names change with every build, so they are safe to cache forever.
// - Everything else (pages, Next.js screen data, public files) is network-first and only
//   falls back to the cache when offline.
// - Next.js screen data (?_rsc= / RSC header) and /api/* are never cached.
const CACHE = 'sriamman-v3';

// Pre-cache the app entry so it can open with no network.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icon.svg', '/icons/icon-192.png', '/icons/icon-512.png', '/apple-touch-icon.png']))
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

const isNextData = (request, url) =>
  url.searchParams.has('_rsc') ||
  request.headers.get('RSC') === '1' ||
  request.headers.has('Next-Router-State-Tree') ||
  request.headers.has('Next-Router-Prefetch');

const putInCache = (request, response) => {
  if (!response || !response.ok || response.type === 'opaque') return;
  const copy = response.clone();
  caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let Firebase and external APIs go to network directly.
  if (url.origin !== self.location.origin) return;
  // Never cache API routes (live rates / news) or Next.js screen data — always hit the network.
  if (url.pathname.startsWith('/api/')) return;
  if (isNextData(request, url)) return;
  // Always check the server for a newer Android app version.
  if (url.pathname === '/app-version.json') return;

  // Build files: name changes per build, so cache-first is safe and fast.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            putInCache(request, response);
            return response;
          })
      )
    );
    return;
  }

  // Pages and public files: network-first, fall back to cache so the app still opens offline.
  event.respondWith(
    fetch(request)
      .then((response) => {
        putInCache(request, response);
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || (request.mode === 'navigate' ? caches.match('/') : undefined))
      )
  );
});
