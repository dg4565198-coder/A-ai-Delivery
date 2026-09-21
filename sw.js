/**
 * ROTTA DO AÇAÍ - SERVICE WORKER (v44)
 * Background Order Tracking & Push Notification Engine
 */

const CACHE_NAME = 'rotta-acai-v44';
const urlsToCache = [
  './',
  './index.html',
  './painel.html',
  './assets/styles.css',
  './assets/logo.jpg',
  './js/store.js',
  './js/app.js',
  './js/painel.js',
  './manifest.json',
  './manifest-painel.json'
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
let _knownLojistaOrders = null;

self.addEventListener('message', event => {
  if (!event.data) return;

  if (event.data.type === 'TRACK_ORDERS' && Array.isArray(event.data.orderIds)) {
    event.data.orderIds.forEach(id => {
      if (_trackedOrdersMap[id] === undefined) {
        _trackedOrdersMap[id] = null;
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
          _trackedOrdersMap[orderId] = newStatus;
          if (newStatus === 'concluido' || newStatus === 'cancelado') {
            delete _trackedOrdersMap[orderId];
          }
        }
      })
      .catch(() => {});
  });
}

// Monitoramento de Novos Pedidos para o Painel da Lojista (Mesmo com App Fechado)
function checkNewOrdersForLojista() {
  fetch('https://rotta-do-acai-default-rtdb.firebaseio.com/orders.json')
    .then(res => res.json())
    .then(data => {
      if (!data) return;
      const ordersList = Array.isArray(data) ? data : Object.values(data);

      if (_knownLojistaOrders === null) {
        _knownLojistaOrders = new Set(ordersList.map(o => String(o.orderNumber || o.id)));
        return;
      }

      ordersList.forEach(order => {
        const orderId = String(order.orderNumber || order.id);
        if (!orderId) return;

        if (!_knownLojistaOrders.has(orderId)) {
          _knownLojistaOrders.add(orderId);

          if (order.status === 'preparo' || !order.status) {
            const customerName = order.customer ? order.customer.name : 'Cliente';
            const totalVal = order.total ? `R$ ${order.total.toFixed(2).replace('.', ',')}` : '';

            self.registration.showNotification('🔔 NOVO PEDIDO CHEGOU! 🍇', {
              body: `Pedido ${order.orderNumber || ''} • ${customerName} (${totalVal})\nToque para abrir a cozinha e preparar!`,
              icon: 'assets/logo.jpg',
              badge: 'assets/logo.jpg',
              vibrate: [500, 200, 500, 200, 500, 200, 1000],
              tag: 'new-order-' + orderId,
              renotify: true,
              requireInteraction: true,
              data: { url: './painel.html', orderId: orderId }
            });
          }
        }
      });
    })
    .catch(() => {});
}

// Background loops
setInterval(checkTrackedOrdersStatus, 10000);
setInterval(checkNewOrdersForLojista, 7000);

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
    data: { url: data.url || './painel.html' },
    renotify: true,
    tag: 'rotta-push-' + Date.now()
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || './painel.html';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          if (urlToOpen.includes('painel.html') && client.url.includes('painel.html')) {
            client.postMessage({ type: 'REFRESH_PANEL' });
            return client.focus();
          }
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
