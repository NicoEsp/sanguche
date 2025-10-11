// Service Worker for caching static assets
const CACHE_NAME = 'productprepa-v1';
const urlsToCache = [
  '/',
  '/assets/sanguche.png',
  '/favicon.png',
];

// Install service worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then((fetchResponse) => {
          // Cache new resources
          return caches.open(CACHE_NAME).then((cache) => {
            // Only cache GET requests
            if (event.request.method === 'GET') {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      })
      .catch(() => {
        // If both cache and network fail, show offline page
        // You can create a custom offline page here
        return new Response('Offline');
      })
  );
});
