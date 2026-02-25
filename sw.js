/**
 * INFINIVERSAL · sw.js
 * Service Worker — cache-first
 * Incrementa CACHE_NAME para forzar actualización
 */

const CACHE_NAME = 'infiniversal-v4';

const ASSETS = [
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/icon-72.png',
  '/icons/icon-96.png',
  '/icons/icon-144.png',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// INSTALL: precachear todo
self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => {
        console.log('[SW] Cache completo');
        return self.skipWaiting();
      })
  );
});

// ACTIVATE: limpiar cachés viejas
self.addEventListener('activate', event => {
  console.log('[SW] Activando...');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Borrando caché vieja:', k);
          return caches.delete(k);
        })
      ))
      .then(() => self.clients.claim())
  );
});

// FETCH: cache-first, fallback a red
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
