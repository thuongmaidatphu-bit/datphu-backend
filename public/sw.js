// =========================================================================
// SERVICE WORKER: ĐẤT PHÚ CHỢ PHIÊN (PWA OFFLINE LOCAL-FIRST)
// =========================================================================
const CACHE_NAME = 'datphu-pwa-v1.2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './logo_datphu.jpg',
  './bieu_phi_dich_vu_niem_yet_k6.csv',
  './so_dieu_phoi_va_lenh_cong_viec_k6.csv',
  './so_nghiem_thu_va_bao_hanh_tem_qr.csv',
  './so_kho_vat_tu_tho_datphu.csv'
];

// 1. Cài đặt Service Worker và lưu Cache tài nguyên tĩnh
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching Static Assets for Offline Mode...');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Kích hoạt và dọn dẹp Cache cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Xử lý Fetch Request: Network First with Cache Fallback (hoặc Cache First cho Asset)
self.addEventListener('fetch', (event) => {
  // Bỏ qua các request không phải GET hoặc chrome-extension
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Nếu fetch thành công từ mạng, lưu bản sao vào cache
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Khi mất mạng / Ngoại tuyến PWA: Lấy từ Cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Nếu trang HTML không có trong cache, trả về trang index gốc
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return caches.match('./index.html') || caches.match('./cho-dia-phuong.html');
          }
        });
      })
  );
});
