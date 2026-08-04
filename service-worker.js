// service-worker.js
// Improved service worker: versioned cache, stale-while-revalidate for assets,
// network-first for navigations, skipWaiting support via postMessage.

const CACHE_VERSION = 'v1';
const CACHE_NAME = `daylight-cache-${CACHE_VERSION}`;

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/gym.html',
  '/swimming.html',
  '/focus.html',
  '/insights.html',
  '/styles.css',
  '/daily.js',
  '/wellness.js',
  '/theme-toggle.js',
  '/alarm-sound.js',
  '/pwa-register.js',
  '/manifest.json',
  '/offline.html',
  '/sounds/Wakeup.mp3',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap'
];

self.addEventListener('install', (event) => {
  console.log('[SW] install');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(err => { console.warn('[SW] some assets failed to cache', err); }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activate');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: try network first for navigation, otherwise use cache-first with
// stale-while-revalidate behavior for assets.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const req = event.request;
  const url = new URL(req.url);

  // Special handling for Google Fonts so pages look correct offline
  const isGoogleFontsCSS = url.hostname === 'fonts.googleapis.com';
  const isGoogleFonts = url.hostname === 'fonts.gstatic.com';
  if (isGoogleFontsCSS || isGoogleFonts) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(networkResponse => {
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkResponse.clone()));
          return networkResponse;
        }).catch(() => cached || null);
      })
    );
    return;
  }

  // Always allow cross-origin requests to pass through (assets from CDNs, fonts)
  const isSameOrigin = url.origin === self.location.origin;
  const isNavigation = req.mode === 'navigate';

  if (isNavigation) {
    // Network-first for navigations so user gets the latest UI, fallback to cache
    event.respondWith(
      fetch(req).then(networkResponse => {
        // update cache in background
        const copy = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return networkResponse;
      }).catch(() => {
        // If network fails, try the exact requested page from cache first, then index.html, then offline.html
        return caches.match(req).then(cachedReq => cachedReq || caches.match('/index.html')).then(response => response || caches.match('/offline.html'));
      })
    );
    return;
  }

  // For same-origin asset requests: stale-while-revalidate
  if (isSameOrigin) {
    event.respondWith(
      caches.match(req).then(cached => {
        const networkFetch = fetch(req).then(networkResponse => {
          // update cache asynchronously
          caches.open(CACHE_NAME).then(cache => cache.put(req, networkResponse.clone()));
          return networkResponse;
        }).catch(() => null);

        // Return cached if available, otherwise wait for network
        return cached || networkFetch;
      })
    );
    return;
  }

  // For cross-origin requests, just use network with fallback to cache
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Listen for messages from the page (e.g., to trigger skipWaiting)
self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    console.log('[SW] skip waiting requested');
    self.skipWaiting();
  }
});
