/*
  Service Worker — TechRetail PWA.
  Estrategia conservadora pensada para una app server-rendered con sesiones:
  - Navegación (HTML): siempre a la red; si no hay conexión, página offline.
    No se cachean páginas autenticadas (evita datos viejos o sesión rota).
  - Assets estáticos propios (/js, /icons): cache-first.
  - Cross-origin (CDN), POST y socket.io: no se interceptan.
*/
const CACHE = 'techretail-v1';
const ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/js/validacion.js',
  '/js/password.js',
  '/js/pwa.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // CDN y externos: red normal
  if (url.pathname.startsWith('/socket.io/')) return;    // websockets: no interceptar

  // Navegación: red primero, página offline como fallback
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('/offline.html')));
    return;
  }

  // Assets propios: cache-first, guardando /js y /icons
  event.respondWith(
    caches.match(req).then((cacheado) => {
      if (cacheado) return cacheado;
      return fetch(req).then((res) => {
        if (url.pathname.startsWith('/js/') || url.pathname.startsWith('/icons/')) {
          const copia = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copia));
        }
        return res;
      });
    })
  );
});
