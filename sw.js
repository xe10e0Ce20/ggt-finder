const CACHE_NAME = 'gadget-finder-cache-v2';
const CACHE_RESOURCES = ['/', 'index.html', 'sw.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method === 'GET' && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedRes => {
          const networkRes = fetch(event.request).then(netRes => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRes.clone()));
            return netRes;
          });
          return cachedRes || networkRes;
        })
    );
  }
});