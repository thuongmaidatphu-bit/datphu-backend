// =========================================================================
// SERVICE WORKER: TỰ ĐỘNG DỌN SẠCH CACHE CŨ ĐỂ LUÔN HIỂN THỊ GIAO DIỆN MỚI NHẤT
// =========================================================================
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Luôn lấy trực tiếp từ Server (Network Only - Không giữ cache cũ)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;
  event.respondWith(fetch(event.request));
});
