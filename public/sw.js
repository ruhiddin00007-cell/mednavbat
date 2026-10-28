// Med navbat - Service Worker (Offline kesh va PWA qo'llab-quvvatlash)
const CACHE_NAME = 'mednavbat-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

// O'rnatish - asosiy ilova qobig'ini (app shell) keshga saqlash
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Med navbat SW] Keshga yozishda ogohlantirish:', err);
      });
    })
  );
  self.skipWaiting();
});

// Faollashtirish - eski versiya keshlarini tozalash va darhol nazoratni olish
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Med navbat SW] Eski kesh o\'chirildi:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// So'rovlarni tutish (Fetch)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Faqat GET so'rovlari va HTTP/HTTPS protokollarini ko'rib chiqish
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Vite ichki so'rovlari va API so'rovlarini keshlamasdan to'g'ridan-to'g'ri o'tkazish
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.includes('node_modules') ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  // Sahifalar navigatsiyasi (HTML): Network-First, aloqa yo'q bo'lsa keshdagi index.html
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedRes = await caches.match(req);
          if (cachedRes) return cachedRes;
          const fallback = await caches.match('/index.html') || await caches.match('/');
          return fallback || new Response(
            '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Med navbat - Offline</title></head><body style=\"font-family:sans-serif;text-align:center;padding:40px;\"><h2>Med navbat</h2><p>Internet tarmog\'i mavjud emas. Iltimos, aloqani tekshiring.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        })
    );
    return;
  }

  // Statik resurslar (CSS, JS, Rasmlar, Shriftlar): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Tarmoq bo'lmasa xavfsiz davom etadi
          return null;
        });

      if (cachedResponse) {
        return cachedResponse;
      }

      return fetchPromise.then((response) => {
        if (response) return response;
        return new Response('', { status: 408, statusText: 'Offline Asset Unavailable' });
      });
    })
  );
});
