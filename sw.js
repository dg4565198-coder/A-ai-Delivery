/**
 * ROTTA DO AÇAÍ - SERVICE WORKER (v13)
 * Cache Strategy: Network-First with Cache Fallback for instant updates on mobile!
 */

const CACHE_NAME = 'rotta-acai-v13';
const urlsToCache = [
  './',
  './index.html',
  './painel.html',
  './assets/styles.css',
  './assets/logo.jpg',
  './js/store.js',
  './js/app.js',
  './js/painel.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Network-First strategy: Always fetch fresh code when online, fallback to cache if offline
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// Handle push notifications for Mobile browsers (Android/iOS PWA)
self.addEventListener('push', event => {
  let data = { title: 'Rotta do Açaí 🍇', body: 'Você tem uma nova atualização!' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  const options = {
    body: data.body,
    icon: 'assets/logo.jpg',
    badge: 'assets/logo.jpg',
    vibrate: [200, 100, 200, 100, 200],
    data: { url: data.url || './' },
    renotify: true,
    tag: 'rotta-push-' + Date.now()
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || './');
      }
    })
  );
});
