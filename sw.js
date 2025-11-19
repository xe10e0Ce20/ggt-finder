// sw.js：Service Worker 核心逻辑
const CACHE_NAME = 'gadget-finder-cache-v1';
// 需缓存的核心资源（页面+自身）
const CACHE_RESOURCES = ['/', 'index.html', 'sw.js'];

// 1. 安装阶段：缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_RESOURCES))
      .then(() => self.skipWaiting()) // 立即激活新SW，无需等待旧SW关闭
  );
});

// 2. 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name)) // 删除非当前版本缓存
      );
    }).then(() => self.clients.claim()) // 接管所有打开的页面
  );
});

// 3. 请求拦截：优先用缓存，离线可用
self.addEventListener('fetch', (event) => {
  // 只缓存同源GET请求（适配页面资源+本地文件处理场景）
  if (event.request.method === 'GET' && new URL(event.request.url).origin === self.location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedRes => {
          // 有缓存用缓存，无缓存请求网络并缓存新资源
          const networkRes = fetch(event.request).then(netRes => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, netRes.clone()));
            return netRes;
          });
          return cachedRes || networkRes;
        })
    );
  }
});
