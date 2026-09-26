/**
 * ROTTA DO AÇAÍ - SERVICE WORKER (v47)
 * Background Order Tracking & Realtime Push Notification Engine (SSE + Telegram Bot + Polling)
 */

const CACHE_NAME = 'rotta-acai-v68';
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
let _isStreamInitialized = false;
let _streamAbortController = null;
let _sseReconnectTimeout = null;

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

  if (event.data.type === 'INIT_LOJISTA_STREAM') {
    startFirebaseSSEStream();
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
            cancelado: `❌ Pedido ${order.orderNumber || ''} foi cancelado pela loja.\nMotivo: "${order.cancelReason || 'Sem motivo informado'}"`
          };

          if (messages[newStatus]) {
            self.registration.showNotification('Rotta do Açaí 🍇', {
              body: messages[newStatus],
              icon: 'assets/logo.jpg',
              badge: 'assets/logo.jpg',
              vibrate: newStatus === 'cancelado' ? [500, 200, 500, 200, 500] : [200, 100, 200, 100, 200],
              tag: 'rotta-status-' + orderId + '-' + newStatus,
              renotify: true,
              requireInteraction: newStatus === 'cancelado',
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

function escapeTelegramHtmlSW(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sendTelegramBotFromSW(order) {
  try {
    const token = '8861858650:AAG_aPAz8Uwvkxow7q3s1wKI-4Qo_CmefgY';

    fetch('https://rotta-do-acai-default-rtdb.firebaseio.com/config/telegramChatId.json')
      .then(res => res.json())
      .then(async savedChatId => {
        const chatId = (savedChatId && String(savedChatId).trim()) ? String(savedChatId).trim() : '-1003761318858';
        if (!token || !chatId) return;

        const customerName = escapeTelegramHtmlSW(order.customer ? (order.customer.name || 'Cliente') : 'Cliente');
        const customerPhone = escapeTelegramHtmlSW(order.customer ? (order.customer.phone || '') : '');
        const totalVal = order.total ? `R$ ${Number(order.total).toFixed(2).replace('.', ',')}` : 'R$ 0,00';
        const deliveryType = order.deliveryType === 'entrega' ? '🛵 Entrega' : '🏬 Retirada no Balcão';

        let addressStr = '';
        if (order.deliveryType === 'entrega' && order.address) {
          if (typeof order.address === 'string') {
            addressStr = escapeTelegramHtmlSW(order.address);
          } else {
            const parts = [];
            if (order.address.street) parts.push(order.address.street);
            if (order.address.number) parts.push(`nº ${order.address.number}`);
            if (order.address.neighborhood) parts.push(`Bairro ${order.address.neighborhood}`);
            if (order.address.ref) parts.push(`(Ref: ${order.address.ref})`);
            addressStr = escapeTelegramHtmlSW(parts.join(', '));
          }
        }

        let paymentStr = (order.paymentMethod || 'pix').toUpperCase();
        if (order.paymentMethod === 'combinado') {
          paymentStr = `Combinado (Pix: R$ ${Number(order.pixAmount || 0).toFixed(2).replace('.', ',')} + Dinheiro: R$ ${Number(order.cashAmount || 0).toFixed(2).replace('.', ',')})`;
          if (order.paymentChange) paymentStr += ` [Troco: ${escapeTelegramHtmlSW(order.paymentChange)}]`;
        } else if (order.paymentMethod === 'dinheiro' && order.paymentChange) {
          paymentStr += ` [Troco para: ${escapeTelegramHtmlSW(order.paymentChange)}]`;
        }

        let itemsText = '';
        if (Array.isArray(order.items) && order.items.length > 0) {
          itemsText = order.items.map(i => {
            const nameClean = escapeTelegramHtmlSW(i.name || i.title || 'Açaí');
            const qty = i.quantity || 1;
            const priceVal = i.unitPrice ? ` (R$ ${(Number(i.unitPrice) * qty).toFixed(2).replace('.', ',')})` : '';
            let line = `• <b>${qty}x ${nameClean}</b>${priceVal}`;
            if (i.calda) line += `\n   🍯 Calda: ${escapeTelegramHtmlSW(i.calda)}`;
            if (Array.isArray(i.fruits) && i.fruits.length > 0) line += `\n   🍓 Frutas: ${escapeTelegramHtmlSW(i.fruits.map(f => f.name || f).join(', '))}`;
            if (Array.isArray(i.freeToppings) && i.freeToppings.length > 0) line += `\n   🥣 Complementos: ${escapeTelegramHtmlSW(i.freeToppings.map(t => t.name || t).join(', '))}`;
            if (i.notes) line += `\n   📝 Obs: ${escapeTelegramHtmlSW(i.notes)}`;
            return line;
          }).join('\n');
        } else {
          itemsText = '• <b>1x Açaí</b>';
        }

        let messageHtml = `🚨 <b>NOVO PEDIDO CHEGOU NA LOJA!</b> 🍇\n\n` +
                            `<b>Pedido:</b> ${escapeTelegramHtmlSW(order.orderNumber || '#')}\n` +
                            `<b>Cliente:</b> ${customerName} (${customerPhone})\n` +
                            `<b>Tipo:</b> ${deliveryType}\n`;
        if (addressStr) messageHtml += `<b>Endereço:</b> ${addressStr}\n`;
        messageHtml += `<b>Pagamento:</b> ${escapeTelegramHtmlSW(paymentStr)}\n\n` +
                       `<b>Itens:</b>\n${itemsText}\n\n`;
        if (order.notes) messageHtml += `<b>Observação Geral:</b> ${escapeTelegramHtmlSW(order.notes)}\n\n`;
        messageHtml += `<b>Total:</b> ${totalVal}\n\n` +
                       `👉 Abra o painel da cozinha para aceitar e preparar!`;

        try {
          const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: messageHtml, parse_mode: 'HTML' })
          });
          const data = await res.json();
          if (!data.ok) {
            const messagePlain = messageHtml.replace(/<\/?b>/g, '');
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: chatId, text: messagePlain })
            });
          }
        } catch (e) {}
      })
      .catch(() => {});
  } catch (e) {}
}

// Trigger mobile system notification for Lojista
function triggerNewOrderNotification(order) {
  if (!order) return;
  const orderId = String(order.orderNumber || order.id || '');
  if (!orderId) return;

  if (_knownLojistaOrders === null) {
    _knownLojistaOrders = new Set();
  }

  if (_knownLojistaOrders.has(orderId)) return;
  _knownLojistaOrders.add(orderId);

  if (order.status === 'preparo' || order.status === 'novo' || !order.status) {
    const customerName = order.customer ? order.customer.name : 'Cliente';
    const totalVal = order.total ? `R$ ${Number(order.total).toFixed(2).replace('.', ',')}` : '';

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

    sendTelegramBotFromSW(order);
  }
}

// REALTIME HTTP STREAM (SSE) FROM FIREBASE REALTIME DATABASE
function processStreamData(eventType, eventData) {
  if (eventType === 'keep-alive' || !eventData || eventData === 'null') return;
  
  try {
    const payload = JSON.parse(eventData);
    const path = payload.path || '/';
    const data = payload.data;

    if (!data) return;

    if (path === '/') {
      let ordersList = [];
      if (Array.isArray(data)) {
        ordersList = data.filter(Boolean);
      } else if (typeof data === 'object') {
        ordersList = Object.values(data).filter(Boolean);
      }

      if (!_isStreamInitialized) {
        if (_knownLojistaOrders === null) _knownLojistaOrders = new Set();
        ordersList.forEach(o => {
          if (o) {
            const id = String(o.orderNumber || o.id || o.key || '');
            if (id) _knownLojistaOrders.add(id);
          }
        });
        _isStreamInitialized = true;
      } else {
        ordersList.forEach(o => {
          if (o) triggerNewOrderNotification(o);
        });
      }
    } else {
      // Path is e.g. "/-N123" or "/0"
      if (typeof data === 'object' && data !== null) {
        if (data.orderNumber || data.id || data.status) {
          if (!_isStreamInitialized) {
            if (_knownLojistaOrders === null) _knownLojistaOrders = new Set();
            const id = String(data.orderNumber || data.id || '');
            if (id) _knownLojistaOrders.add(id);
          } else {
            triggerNewOrderNotification(data);
          }
        } else {
          const subOrders = Object.values(data).filter(o => o && typeof o === 'object');
          subOrders.forEach(o => {
            if (!_isStreamInitialized) {
              if (_knownLojistaOrders === null) _knownLojistaOrders = new Set();
              const id = String(o.orderNumber || o.id || '');
              if (id) _knownLojistaOrders.add(id);
            } else {
              triggerNewOrderNotification(o);
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('SW SSE Parse Error:', e);
  }
}

async function startFirebaseSSEStream() {
  if (_streamAbortController) {
    try { _streamAbortController.abort(); } catch {}
  }
  _streamAbortController = new AbortController();

  try {
    const response = await fetch('https://rotta-do-acai-default-rtdb.firebaseio.com/orders.json', {
      headers: { 'Accept': 'text/event-stream' },
      signal: _streamAbortController.signal
    });

    if (!response.ok || !response.body) {
      scheduleSSEReconnect();
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split('\n\n');
      buffer = blocks.pop() || '';

      for (const block of blocks) {
        if (!block.trim()) continue;
        let eventType = 'put';
        let eventData = null;

        const lines = block.split('\n');
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.replace('event:', '').trim();
          } else if (line.startsWith('data:')) {
            eventData = line.replace('data:', '').trim();
          }
        }

        if (eventData) {
          processStreamData(eventType, eventData);
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.warn('SW SSE Connection error:', err);
    }
  }

  scheduleSSEReconnect();
}

function scheduleSSEReconnect() {
  if (_sseReconnectTimeout) clearTimeout(_sseReconnectTimeout);
  _sseReconnectTimeout = setTimeout(() => {
    startFirebaseSSEStream();
  }, 5000);
}

// Fallback interval check for Lojista orders
function checkNewOrdersForLojista() {
  fetch('https://rotta-do-acai-default-rtdb.firebaseio.com/orders.json')
    .then(res => res.json())
    .then(data => {
      if (!data) return;
      const ordersList = Array.isArray(data) ? data : Object.values(data);

      if (_knownLojistaOrders === null) {
        _knownLojistaOrders = new Set(ordersList.map(o => String(o.orderNumber || o.id)));
        _isStreamInitialized = true;
        return;
      }

      ordersList.forEach(order => {
        if (order) triggerNewOrderNotification(order);
      });
    })
    .catch(() => {});
}

// Initialize stream and background loops
startFirebaseSSEStream();
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
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    data: { url: data.url || './painel.html' },
    renotify: true,
    requireInteraction: true,
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
