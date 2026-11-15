// Đất Phú Mini POS Service Worker v1.0.0
const CACHE_NAME = 'datphu-pos-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/datphu-mini-pos.html',
  '/pos-manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-pos.svg',
  '/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Install: Cache Shell & Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[POS ServiceWorker] Caching static shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[POS ServiceWorker] Some assets could not be pre-cached:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[POS ServiceWorker] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for Static, Network-First for dynamic/API
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Skip non-GET requests and chrome-extension
  if (event.request.method !== 'GET' || !requestUrl.protocol.startsWith('http')) {
    return;
  }

  // API calls: Network first, no caching
  if (requestUrl.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets & Pages: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to offline page if available
        if (event.request.mode === 'navigate') {
          return caches.match('/datphu-mini-pos.html');
        }
      });

      return cachedResponse || fetchPromise;
    })
  );
});
