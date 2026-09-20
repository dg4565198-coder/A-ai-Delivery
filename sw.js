/**
 * ROTTA DO AÇAÍ - SERVICE WORKER (v29)
 * Background Order Tracking & Push Notification Engine
 */

const CACHE_NAME = 'rotta-acai-v29';
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
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
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
  if (!event.data) return;

  if (event.data.type === 'TRACK_ORDERS' && Array.isArray(event.data.orderIds)) {
    event.data.orderIds.forEach(id => {
      if (_trackedOrdersMap[id] === undefined) {
        _trackedOrdersMap[id] = null; // null indicates uninitialized initial state
      }
    });
    checkTrackedOrdersStatus();
  }

  if (event.data.type === 'STOP_TRACKING' && event.data.orderId) {
    delete _trackedOrdersMap[event.data.orderId];
    self.registration.getNotifications().then(notifications => {
      notifications.forEach(notification => {
        if (notification.data && notification.data.orderId === event.data.orderId) {
          notification.close();
        }
      });
    }).catch(() => {});
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

        // Se o pedido já foi avaliado, encerrar rastreamento e fechar notificações
        if (order.rated) {
          delete _trackedOrdersMap[orderId];
          self.registration.getNotifications().then(notifications => {
            notifications.forEach(n => {
              if (n.data && n.data.orderId === orderId) n.close();
            });
          }).catch(() => {});
          return;
        }

        const lastStatus = _trackedOrdersMap[orderId];
        const newStatus = order.status;

        // Dispara notificação APENAS se havia um status prévio conhecido E o status mudou
        if (lastStatus !== null && lastStatus !== undefined && lastStatus !== newStatus) {
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
              renotify: false,
              data: { url: './', orderId: orderId, status: newStatus }
            });
          }

          _trackedOrdersMap[orderId] = newStatus;
          if (newStatus === 'concluido' || newStatus === 'cancelado') {
            delete _trackedOrdersMap[orderId];
          }
        } else {
          // Primeira checagem (inicialização) ou sem alteração
          _trackedOrdersMap[orderId] = newStatus;
          if (newStatus === 'concluido' || newStatus === 'cancelado') {
            // Já estava concluído/cancelado ao iniciar -> remove para não rastrear nem notificar repetido
            delete _trackedOrdersMap[orderId];
          }
        }
      })
      .catch(() => {});
  });
}

// Service Worker background polling loop
setInterval(checkTrackedOrdersStatus, 10000);

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
