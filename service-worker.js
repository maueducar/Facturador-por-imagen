const CACHE_NAME = 'facturascan-ai-cache-v1';
// Lista de archivos del "app shell" que se cachearán durante la instalación.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
];

// Evento de instalación: se cachean los archivos principales.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto. Cacheando el app shell.');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Activa el nuevo service worker inmediatamente.
  );
});

// Evento de activación: se eliminan los cachés antiguos.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Toma control de todas las páginas abiertas.
  );
});

// Evento de fetch: intercepta las peticiones de red.
self.addEventListener('fetch', event => {
  // No se cachean peticiones que no sean GET.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // No se cachean las llamadas a la API de Google.
  if (event.request.url.includes('generativelanguage.googleapis.com')) {
    return; 
  }

  // Estrategia: "Cache, falling back to network".
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(response => {
        // Devuelve la respuesta del caché si existe.
        // Si no, la busca en la red, la añade al caché y la devuelve.
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Solo cachea respuestas válidas.
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            cache.put(event.request, responseToCache);
          }
          return networkResponse;
        });

        // Devuelve la respuesta del caché o la promesa de red.
        return response || fetchPromise;
      });
    })
  );
});
