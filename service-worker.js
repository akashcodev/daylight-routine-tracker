// service-worker.js
// Bump this version string every time you deploy changes so old caches get cleared.
const CACHE_NAME = 'daylight-cache-v1';

// App shell — the files needed for the site to load and work offline.
// Add any other pages/assets (CSS, JS, fonts, images) you want available offline.
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './gym.html',
  './swimming.html',
  './focus.html',
  './insights.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for app-shell assets, falling back to network,
// and falling back to the cached homepage for offline navigations.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Cache a copy of newly-fetched files for next time
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline and not cached: if it's a page navigation, show the homepage
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
