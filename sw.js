/**
 * ROTTA DO AÇAÍ - SERVICE WORKER (v17)
 * Background Order Tracking & Push Notification Engine
 */

const CACHE_NAME = 'rotta-acai-v17';
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
  self.skipWaiting();
  self.clients.claim();
});

// Network-First strategy
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

// =========================================================================
// BACKGROUND ORDER TRACKING & SYSTEM PUSH NOTIFICATIONS ENGINE
// =========================================================================
let _trackedOrdersMap = {}; // { orderId: lastKnownStatus }

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'TRACK_ORDERS' && Array.isArray(event.data.orderIds)) {
    event.data.orderIds.forEach(id => {
      if (!_trackedOrdersMap[id]) {
        _trackedOrdersMap[id] = 'novo';
      }
    });
    checkTrackedOrdersStatus();
  }
});

function checkTrackedOrdersStatus() {
  const orderIds = Object.keys(_trackedOrdersMap);
  if (orderIds.length === 0) return;

  orderIds.forEach(orderId => {
    const firebaseUrl = `https://rotta-do-acai-default-rtdb.firebaseio.com/orders/${orderId}.json`;
    fetch(firebaseUrl)
      .then(res => res.json())
      .then(order => {
        if (!order || !order.status) return;

        const lastStatus = _trackedOrdersMap[orderId];
        const newStatus = order.status;

        if (lastStatus && lastStatus !== newStatus) {
          const messages = {
            preparo: `🥣 Seu Pedido ${order.orderNumber || ''} está sendo preparado com muito carinho!`,
            entrega: order.deliveryType === 'entrega' 
              ? `🛵 Seu Pedido ${order.orderNumber || ''} saiu para entrega! Fique atento(a)!`
              : `🏬 Seu Pedido ${order.orderNumber || ''} está pronto para retirada no balcão!`,
            concluido: `✅ Pedido ${order.orderNumber || ''} entregue! Por favor, avalie sua experiência!`,
            cancelado: `❌ Pedido ${order.orderNumber || ''} foi cancelado pela loja.`
          };

          if (messages[newStatus]) {
            self.registration.showNotification('Rotta do Açaí 🍇', {
              body: messages[newStatus],
              icon: 'assets/logo.jpg',
              badge: 'assets/logo.jpg',
              vibrate: [200, 100, 200, 100, 200],
              tag: 'rotta-status-' + orderId + '-' + newStatus,
              renotify: true,
              data: { url: './', orderId: orderId, status: newStatus }
            });
          }

          _trackedOrdersMap[orderId] = newStatus;
        } else if (!lastStatus) {
          _trackedOrdersMap[orderId] = newStatus;
        }
      })
      .catch(() => {});
  });
}

// Service Worker background polling loop
setInterval(checkTrackedOrdersStatus, 6000);

// Handle push notifications
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
  const urlToOpen = event.notification.data?.url || './';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.postMessage({ type: 'OPEN_MY_ORDERS' });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
