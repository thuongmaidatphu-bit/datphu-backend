// =========================================================================
// SERVICE WORKER: LỊCH DÂN SINH & VĂN HÓA ĐẤT PHÚ (OFFLINE-FIRST PWA)
// =========================================================================
const CACHE_NAME = 'datphu-pwa-v3';

const CORE_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/logo_datphu_brand.jpg',
  '/img/logo_hoa_sen_real.png',
  '/img/lotus_lagoon_real_dawn.jpg',
  '/img/lotus_throne_cinematic_3d.jpg',
  '/img/lao_dong_nu_cuoi_cong_trinh.jpg',
  '/img/lao_dong_mong_cong_trinh.jpg',
  '/img/lao_dong_lat_da_san_chua.jpg',
  '/img/tu_bo_chua_co_dem_1.jpg',
  '/img/tu_bo_chua_co_dem_2.jpg',
  '/img/tet_sum_vay_dat_phu.jpg'
];

// Cài đặt và tải trước các tài nguyên cốt lõi
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_PRECACHE_URLS).catch(err => {
        console.warn('Pre-cache partial fail (some remote URLs may skip):', err);
      });
    })
  );
});

// Kích hoạt và dọn dẹp các cache phiên bản cũ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Chiến lược Fetch:
// - Đối với trang HTML: Network First, fallback về Cache khi mất mạng (Offline-Ready)
// - Đối với Ảnh, Font, CSS, JS: Cache First / Stale While Revalidate
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const url = new URL(req.url);

  // Xử lý Navigation / HTML
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(() => {
          return caches.match('/index.html').then((cached) => {
            return cached || caches.match('/');
          });
        })
    );
    return;
  }

  // Xử lý Hình ảnh & Assets tĩnh
  if (req.destination === 'image' || req.destination === 'font' || req.destination === 'style' || req.destination === 'script') {
    event.respondWith(
      caches.match(req).then((cachedRes) => {
        if (cachedRes) {
          // Trả về ngay từ Cache, đồng thời fetch ngầm để cập nhật phiên bản mới
          fetch(req).then((netRes) => {
            if (netRes && netRes.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, netRes));
            }
          }).catch(() => {});
          return cachedRes;
        }
        return fetch(req).then((netRes) => {
          if (netRes && netRes.status === 200) {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return netRes;
        });
      })
    );
    return;
  }

  // Mặc định
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});

// Nhấn vào thông báo nhắc nhở ngày Giỗ / Rằm
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
