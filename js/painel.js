/**
 * ROTTA DO AÇAÍ - PAINEL DE GESTÃO DA LOJA (v2 - Firebase)
 */

let currentViewingOrder = null;
let _firstLoad = true;

const AUTH_SESSION_KEY = 'rotta_panel_session';
const AUTH_DATE_KEY = 'rotta_panel_login_date';
const CREDS_KEY = 'rotta_panel_creds';

function getPanelCredentials() {
  try {
    const creds = JSON.parse(localStorage.getItem(CREDS_KEY));
    if (creds && creds.user && creds.pass) return creds;
  } catch {}
  return { user: 'admin', pass: 'rotta123' };
}

function isLoginValidForToday() {
  if (sessionStorage.getItem(AUTH_SESSION_KEY) === 'true') return true;
  const lastLoginDate = localStorage.getItem(AUTH_DATE_KEY);
  if (!lastLoginDate) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return lastLoginDate === todayStr;
}

function updateNotificationBanner() {
  const banner = document.getElementById('notification-permission-banner');
  if (!banner) return;
  if ('Notification' in window && Notification.permission !== 'granted') {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function requestNotificationPermission() {
  if ('Notification' in window) {
    if (Notification.permission === 'default' || Notification.permission === 'denied') {
      Notification.requestPermission().then(permission => {
        console.log('Permissão de notificações no painel:', permission);
        updateNotificationBanner();
      }).catch(err => console.warn('Erro ao solicitar notificações:', err));
    } else {
      updateNotificationBanner();
    }
  }
}

let _wakeLock = null;
let _wakeLockDesiredState = false;

async function requestWakeLockSentinel() {
  if (!_wakeLockDesiredState) return;
  if (!('wakeLock' in navigator)) return;

  try {
    if (_wakeLock !== null && !_wakeLock.released) return;

    _wakeLock = await navigator.wakeLock.request('screen');
    updateWakeLockUI(true);

    _wakeLock.addEventListener('release', () => {
      _wakeLock = null;
      if (_wakeLockDesiredState) {
        updateWakeLockUI(true);
        setTimeout(requestWakeLockSentinel, 1000);
      } else {
        updateWakeLockUI(false);
      }
    });
  } catch (err) {
    console.warn('Erro ao solicitar Wake Lock:', err);
    if (_wakeLockDesiredState) {
      updateWakeLockUI(true);
      setTimeout(requestWakeLockSentinel, 3000);
    }
  }
}

function updateWakeLockUI(isActive) {
  const btn = document.getElementById('btn-wake-lock');
  const statusText = document.getElementById('wake-lock-status-text');

  if (isActive) {
    if (btn) btn.className = "px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-acai-950 font-black text-xs shadow-md transition flex items-center space-x-1.5 animate-pulse shrink-0";
    if (statusText) statusText.textContent = "💡 Tela Ligada (ON)";
  } else {
    if (btn) btn.className = "px-3 py-1.5 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-purple-300 border border-purple-700/60 text-[11px] sm:text-xs font-bold transition flex items-center space-x-1.5 shadow shrink-0";
    if (statusText) statusText.textContent = "💡 Tela Ligada (OFF)";
  }
}

async function toggleWakeLock() {
  if (_wakeLockDesiredState) {
    _wakeLockDesiredState = false;
    if (_wakeLock !== null) {
      try {
        await _wakeLock.release();
      } catch (e) {}
      _wakeLock = null;
    }
    updateWakeLockUI(false);
  } else {
    _wakeLockDesiredState = true;
    if ('wakeLock' in navigator) {
      await requestWakeLockSentinel();
    } else {
      alert('Seu navegador não suporta manter a tela ligada automaticamente. Recomendamos ajustar o tempo de limite de tela nas configurações do celular para 10 ou 30 minutos enquanto a loja estiver aberta.');
    }
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && _wakeLockDesiredState) {
    requestWakeLockSentinel();
  }
});

function handlePanelLogin(e) {
  if (e) e.preventDefault();
  const userInput = document.getElementById('login-username').value.trim();
  const passInput = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');
  const creds = getPanelCredentials();

  if (userInput === creds.user && passInput === creds.pass) {
    const todayStr = new Date().toISOString().split('T')[0];
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    localStorage.setItem(AUTH_DATE_KEY, todayStr);

    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    requestNotificationPermission();
    runPainelApp();
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}

function handlePanelLogout() {
  if (confirm('Deseja realmente sair do Painel da Loja?')) {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_DATE_KEY);
    window.location.reload();
  }
}

function startPainel() {
  const isLogged = isLoginValidForToday();
  const modal = document.getElementById('login-modal');

  if (!isLogged) {
    if (modal) modal.classList.remove('hidden');
    return;
  }

  if (modal) modal.classList.add('hidden');
  requestNotificationPermission();
  runPainelApp();
}

function runPainelApp() {
  try { window.Store.init(); } catch (e) { console.error('Store init:', e); }
  try { updateStoreStatusButton(); } catch (e) { console.error('Status:', e); }
  try { renderStockManagement(); } catch (e) { console.error('Stock:', e); }
  try { renderFinancialMetrics(); } catch (e) { console.error('Metrics:', e); }
  try { loadConfigForm(); } catch (e) { console.error('Config:', e); }
  try { loadHoursTab(); } catch (e) { console.error('Hours:', e); }
  try { loadOpenPromoCard(); } catch (e) { console.error('OpenPromo:', e); }
  try { setupFirebaseListener(); } catch (e) { console.error('Firebase:', e); }
  try {
    if (window.Store.checkAndApplyAutoSchedule) {
      window.Store.checkAndApplyAutoSchedule();
      setInterval(() => {
        window.Store.checkAndApplyAutoSchedule();
      }, 60000);
    }
  } catch (e) { console.error('AutoSchedule Loop:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startPainel);
} else {
  startPainel();
}

// ==========================================================================
// 2. LISTENER FIREBASE
// ==========================================================================
function setupFirebaseListener() {
  const badge = document.getElementById('firebase-status-badge');
  const dot = document.getElementById('firebase-status-dot');
  const text = document.getElementById('firebase-status-text');

  window.Store.listenToOrders(
    function onNewOrder(order) {
      if (badge && dot && text) {
        badge.className = "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 shadow";
        dot.className = "w-2 h-2 rounded-full bg-emerald-400";
        text.textContent = "Firebase Online 🟢";
      }

      if (order === null) {
        _firstLoad = false;
        renderKanbanBoard();
        renderFinancialMetrics();
        return;
      }

      if (!_firstLoad) {
        window.Store.playNotificationSound();
        showNewOrderNotification(order);
      }

      renderKanbanBoard();
      renderFinancialMetrics();
    },
    function onOrderChanged(_ignored) {
      renderKanbanBoard();
      renderFinancialMetrics();
    },
    function onFirebaseError(err) {
      console.error("Firebase Error:", err);
      if (badge && dot && text) {
        badge.className = "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-600 shadow animate-bounce";
        dot.className = "w-2 h-2 rounded-full bg-rose-500";
        text.textContent = "Permissão Negada no Firebase 🔴";
      }
    }
  );

  window.Store.listenToConfig(cfg => {
    updateStoreStatusButton();
    loadConfigForm();
  });

  window.Store.listenToStock(() => {
    renderStockManagement();
  });

  window.Store.listenToFidelityConfig(() => {
    renderFidelityLevelsEditor();
  });

  window.Store.listenToCustomers(() => {
    renderCustomersTableAdmin();
  });
}

function showInAppToast(title, body) {
  let toast = document.getElementById('in-app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'in-app-toast';
    toast.className = 'fixed top-4 left-4 right-4 z-50 bg-acai-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-gold-400 transform -translate-y-32 transition-all duration-300 flex items-start space-x-3 pointer-events-auto';
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <span class="text-2xl shrink-0">🔔</span>
    <div class="flex-1 min-w-0">
      <h4 class="font-black text-sm text-gold-400 truncate">${title}</h4>
      <p class="text-xs text-purple-100 font-semibold mt-0.5 leading-snug">${body}</p>
    </div>
    <button onclick="document.getElementById('in-app-toast').classList.add('-translate-y-32')" class="text-gray-400 hover:text-white font-extrabold text-base leading-none">&times;</button>
  `;

  setTimeout(() => {
    toast.classList.remove('-translate-y-32');
    toast.classList.add('translate-y-0');
  }, 50);

  setTimeout(() => {
    if (toast) {
      toast.classList.remove('translate-y-0');
      toast.classList.add('-translate-y-32');
    }
  }, 7000);
}

async function sendPushNotification(title, body) {
  try { window.Store.playNotificationSound(); } catch {}
  showInAppToast(title, body);

  if ('Notification' in window && Notification.permission === 'granted') {
    const notificationOptions = {
      body: body,
      icon: 'assets/logo.jpg',
      badge: 'assets/logo.jpg',
      vibrate: [500, 200, 500, 200, 500, 200, 1000],
      tag: 'rotta-panel-' + Date.now(),
      renotify: true,
      requireInteraction: true,
      data: { url: './painel.html' }
    };

    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, notificationOptions);
          return;
        }
      } catch (err) {
        console.warn('SW Panel Notification error:', err);
      }
    }

    try {
      new Notification(title, notificationOptions);
    } catch (e) {
      console.warn('Desktop Panel Notification fallback error:', e);
    }
  }
}

function showNewOrderNotification(order) {
  const badge = document.getElementById('kanban-new-badge');
  const orders = window.Store.getOrdersArray();
  const preparoCount = orders.filter(o => o.status === 'preparo' || o.status === 'novo').length;
  if (badge && preparoCount > 0) {
    badge.textContent = preparoCount;
    badge.classList.remove('hidden');
  } else if (badge) {
    badge.classList.add('hidden');
  }

  if (order) {
    const customerName = order.customer ? order.customer.name : 'Cliente';
    const totalVal = window.Store.formatCurrency(order.total || 0);
    sendPushNotification(`🚨 NOVO PEDIDO (${order.orderNumber || ''})`, `${customerName} realizou um pedido no valor de ${totalVal}!`);
  }
}

// ==========================================================================
// 3. STATUS DA LOJA (ABERTA / FECHADA)
// ==========================================================================
function toggleStoreOpenStatus() {
  const config = window.Store.getConfig();
  config.isOpen = !config.isOpen;
  window.Store.saveConfig(config);
  updateStoreStatusButton();
}

function updateStoreStatusButton() {
  const config = window.Store.getConfig();
  const btn = document.getElementById('btn-toggle-store-status');
  const text = document.getElementById('store-status-text');
  const tabStatusText = document.getElementById('hours-tab-store-status');

  if (config.isOpen) {
    if (btn) btn.className = "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow transition";
    if (text) text.textContent = "Loja Aberta";
    if (tabStatusText) tabStatusText.textContent = "🟢 Loja Aberta";
  } else {
    if (btn) btn.className = "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow transition";
    if (text) text.textContent = "Loja Fechada";
    if (tabStatusText) tabStatusText.textContent = "🔴 Loja Fechada";
  }
}

function testAudioAlert() {
  window.Store.playNotificationSound();
}

// ==========================================================================
// 4. NAVEGAÇÃO POR ABAS
// ==========================================================================
function switchTab(tabId) {
  const tabs = ['kanban', 'estoque', 'horarios', 'promocoes', 'caixa', 'config', 'avaliacoes', 'fidelidade'];
  tabs.forEach(t => {
    const content = document.getElementById('tab-content-' + t);
    const btn = document.getElementById('tab-btn-' + t);
    if (!content || !btn) return;
    if (t === tabId) {
      content.classList.remove('hidden');
      btn.className = "tab-button px-4 py-2 text-xs font-bold rounded-lg transition bg-acai-800 text-gold-400 flex items-center space-x-2";
    } else {
      content.classList.add('hidden');
      btn.className = "tab-button px-4 py-2 text-xs font-bold rounded-lg transition text-purple-200 hover:bg-acai-800 flex items-center space-x-1.5";
    }
  });

  if (tabId === 'estoque') renderStockManagement();
  if (tabId === 'caixa') renderFinancialMetrics();
  if (tabId === 'horarios') loadHoursTab();
  if (tabId === 'promocoes') { renderPromotionsHistory(); loadOpenPromoCard(); }
  if (tabId === 'avaliacoes') renderRatingsTab();
  if (tabId === 'fidelidade') renderFidelityAdminTab();
}

// ==========================================================================
// 5. KANBAN DE PEDIDOS AO VIVO
// ==========================================================================
function renderKanbanBoard() {
  const orders = window.Store.getOrdersArray();

  const columns = {
    preparo: document.getElementById('column-preparo'),
    entrega: document.getElementById('column-entrega'),
    concluido: document.getElementById('column-concluido')
  };

  const counts = { preparo: 0, entrega: 0, concluido: 0 };

  Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

  orders.forEach(order => {
    let status = order.status || 'preparo';
    if (status === 'novo') status = 'preparo';

    if (counts[status] !== undefined) counts[status]++;
    const col = columns[status];
    if (col) col.appendChild(createOrderCardElement(order, status));
  });

  if (document.getElementById('count-col-preparo')) document.getElementById('count-col-preparo').textContent = counts.preparo;
  if (document.getElementById('count-col-entrega')) document.getElementById('count-col-entrega').textContent = counts.entrega;
  if (document.getElementById('count-col-concluido')) document.getElementById('count-col-concluido').textContent = counts.concluido;

  const badge = document.getElementById('kanban-new-badge');
  if (badge) {
    if (counts.preparo > 0) {
      badge.textContent = counts.preparo;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  Object.keys(columns).forEach(key => {
    if (counts[key] === 0 && columns[key]) {
      const messages = {
        preparo: 'Nenhum açaí sendo montado',
        entrega: 'Nenhum pedido a caminho',
        concluido: 'Nenhum pedido finalizado ainda'
      };
      columns[key].innerHTML = `
        <div class="h-36 flex flex-col items-center justify-center text-center text-gray-400 text-xs p-4">
          <span class="text-2xl mb-1 opacity-50">🥣</span>
          <span>${messages[key] || 'Vazio'}</span>
        </div>`;
    }
  });
}

function createOrderCardElement(order, currentStatus) {
  const card = document.createElement('div');
  const isPreparo = currentStatus === 'preparo';

  card.className = `order-card bg-white p-3.5 rounded-xl border-2 transition shadow-sm space-y-3 ${
    isPreparo ? 'border-amber-400 new-order-alert bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'
  }`;

  const customer = order.customer || {};
  const customerName = customer.name || 'Cliente';
  const customerPhone = customer.phone ? String(customer.phone).replace(/\D/g, '') : '';
  const items = Array.isArray(order.items) ? order.items : [];

  const headerHtml = `
    <div class="flex items-center justify-between border-b border-gray-100 pb-2">
      <div class="flex items-center space-x-2">
        <span class="font-black text-sm text-acai-900">${order.orderNumber || '#'}</span>
        <span class="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">${order.timeFormatted || ''}</span>
      </div>
      <span class="text-[11px] font-bold px-2 py-0.5 rounded ${
        order.deliveryType === 'entrega' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
      }">
        ${order.deliveryType === 'entrega' ? '🛵 Entrega' : '🏬 Retirada'}
      </span>
    </div>`;

  const customerHtml = `
    <div class="space-y-0.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="font-extrabold text-gray-900 truncate">${customerName}</span>
        ${customerPhone ? `<a href="https://api.whatsapp.com/send?phone=55${customerPhone}" target="_blank" class="text-[11px] text-emerald-600 hover:underline font-bold">💬 WhatsApp</a>` : ''}
      </div>
      ${order.address ? `<p class="text-[11px] text-gray-500 line-clamp-2">📍 ${order.address.street || ''}, ${order.address.number || ''} - ${order.address.neighborhood || ''}${order.address.ref ? ' (' + order.address.ref + ')' : ''}</p>` : '<p class="text-[11px] text-blue-600">Retirada no balcão</p>'}
    </div>`;

  const itemsHtml = `
    <div class="bg-gray-50 p-2 rounded-lg space-y-1.5 border border-gray-100 text-xs">
      ${items.map(item => `
        <div class="border-b border-gray-200/50 pb-1 last:border-0 last:pb-0">
          <div class="flex justify-between font-bold text-gray-800 text-[11px]">
            <span>${item.quantity || 1}x ${item.name || item.title || 'Açaí'}</span>
            <span>${window.Store.formatCurrency((item.unitPrice || item.price || 0) * (item.quantity || 1))}</span>
          </div>
          ${item.calda ? `<div class="text-[9px] text-amber-800 font-bold">🍯 Calda: ${item.calda}</div>` : ''}
          ${item.fruits && item.fruits.length > 0 ? `<div class="text-[9px] text-emerald-700 font-semibold">🍓 Frutas: ${item.fruits.map(f => typeof f === 'object' ? f.name : f).join(', ')}</div>` : ''}
          ${item.freeToppings && item.freeToppings.length > 0 ? `<div class="text-[9px] text-gray-600">✓ Complementos: ${item.freeToppings.map(t => typeof t === 'object' ? t.name : t).join(', ')}</div>` : ''}
          ${item.notes ? `<div class="text-[9px] italic text-purple-600 bg-purple-50 p-0.5 rounded mt-0.5">Obs: "${item.notes}"</div>` : ''}
        </div>`).join('')}
    </div>`;

  let paymentTextHtml = '';
  if (order.paymentMethod === 'combinado') {
    paymentTextHtml = `
      <span class="font-black text-purple-900 uppercase block text-[11px]">🔄 COMBINADO</span>
      <span class="text-[10px] text-emerald-700 font-bold block">💠 Pix: ${window.Store.formatCurrency(order.pixAmount)}</span>
      <span class="text-[10px] text-purple-900 font-bold block">💵 Dinheiro: ${window.Store.formatCurrency(order.cashAmount)}</span>
      ${order.paymentChange ? `<span class="text-[10px] text-gray-500 block font-normal">Troco p/: ${order.paymentChange}</span>` : ''}
    `;
  } else if (order.paymentMethod === 'dinheiro') {
    paymentTextHtml = `
      <span class="font-bold text-gray-700 uppercase block">💵 DINHEIRO</span>
      ${order.paymentChange ? `<span class="text-[10px] text-gray-500 block">Troco p/: ${order.paymentChange}</span>` : ''}
    `;
  } else {
    paymentTextHtml = `<span class="font-bold text-emerald-700 uppercase block">💠 PIX (100%)</span>`;
  }

  const paymentHtml = `
    <div class="flex items-center justify-between text-xs pt-1">
      <div>
        <span class="text-[10px] text-gray-400 block uppercase font-bold">Pagamento:</span>
        ${paymentTextHtml}
      </div>
      <div class="text-right">
        <span class="text-[10px] text-gray-400 block uppercase font-bold">Total:</span>
        <span class="text-sm font-black text-acai-900">${window.Store.formatCurrency(order.total)}</span>
      </div>
    </div>`;

  const targetOrderId = order.id || order.key || '';

  let actionHtml = '';
  if (currentStatus === 'preparo') {
    actionHtml = `<div class="space-y-1.5 pt-1">
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openReceiptModal('${targetOrderId}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
        <button onclick="advanceOrderStatus('${targetOrderId}', 'entrega')" class="text-xs bg-purple-600 hover:bg-purple-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>${order.deliveryType === 'entrega' ? '🛵 Despachar' : '🏬 Pronto'}</span></button>
      </div>
      <button type="button" data-action="cancel-order" data-order-id="${targetOrderId}" onclick="openCancelOrderModal('${targetOrderId}')" class="w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>❌</span><span>Cancelar Pedido</span></button>
    </div>`;
  } else if (currentStatus === 'entrega') {
    actionHtml = `<div class="space-y-1.5 pt-1">
      <div class="grid grid-cols-2 gap-2">
        <button onclick="openReceiptModal('${targetOrderId}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
        <button onclick="advanceOrderStatus('${targetOrderId}', 'concluido')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>✅ Concluir</span></button>
      </div>
      <button type="button" data-action="cancel-order" data-order-id="${targetOrderId}" onclick="openCancelOrderModal('${targetOrderId}')" class="w-full text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold py-1.5 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>❌</span><span>Cancelar Pedido</span></button>
    </div>`;
  } else {
    actionHtml = `<div class="pt-1"><button onclick="openReceiptModal('${targetOrderId}')" class="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1.5 rounded-lg transition">🖨️ Reemitir Comanda</button></div>`;
  }

  card.innerHTML = headerHtml + customerHtml + itemsHtml + paymentHtml + actionHtml;
  return card;
}

async function openCancelOrderModal(orderId) {
  console.log('[Painel] Abrindo modal de cancelamento para orderId:', orderId);
  const order = window.Store ? window.Store.getOrderById(orderId) : null;
  const modal = document.getElementById('cancel-order-modal');
  const title = document.getElementById('cancel-order-modal-title');
  const targetIdInput = document.getElementById('cancel-target-order-id');
  const reasonInput = document.getElementById('cancel-reason-input');

  const orderNum = order ? (order.orderNumber || '') : '';
  const resolvedId = orderId || (order ? order.id : '');

  if (targetIdInput) targetIdInput.value = resolvedId;
  if (reasonInput) reasonInput.value = '';
  if (title) title.textContent = orderNum ? `Cancelar Pedido ${orderNum}` : 'Cancelar Pedido';

  if (modal) {
    modal.classList.remove('hidden');
    modal.style.setProperty('display', 'flex', 'important');
    modal.style.zIndex = '999999';
    if (reasonInput) setTimeout(() => reasonInput.focus(), 100);
  } else {
    const reason = prompt(`Informe o motivo do cancelamento do Pedido ${orderNum || resolvedId}:`, "Ingrediente indisponível no estoque");
    if (reason && reason.trim()) {
      try {
        await window.Store.updateOrderStatus(resolvedId, 'cancelado', reason.trim());
        alert('Pedido cancelado com sucesso e cliente notificado!');
      } catch (e) {
        alert('Erro ao cancelar pedido: ' + (e.message || e));
      }
    }
  }
}
window.openCancelOrderModal = openCancelOrderModal;

function closeCancelOrderModal() {
  const modal = document.getElementById('cancel-order-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.setProperty('display', 'none', 'important');
  }
}
window.closeCancelOrderModal = closeCancelOrderModal;

function selectQuickCancelReason(reasonText) {
  const reasonInput = document.getElementById('cancel-reason-input');
  if (reasonInput) {
    reasonInput.value = reasonText;
    reasonInput.focus();
  }
}
window.selectQuickCancelReason = selectQuickCancelReason;

async function handleConfirmCancelOrder() {
  console.log('[Painel] handleConfirmCancelOrder acionado');
  const targetIdInput = document.getElementById('cancel-target-order-id');
  const reasonInput = document.getElementById('cancel-reason-input');

  const orderId = targetIdInput ? targetIdInput.value : null;
  const reason = reasonInput ? reasonInput.value.trim() : '';

  if (!orderId) {
    alert('Erro ao identificar o pedido.');
    return;
  }

  if (!reason) {
    alert('Por favor, informe ou selecione o motivo do cancelamento.');
    return;
  }

  // Fecha o modal IMEDIATAMENTE para dar resposta instantânea ao usuário
  closeCancelOrderModal();

  try {
    await window.Store.updateOrderStatus(orderId, 'cancelado', reason);
    console.log('[Painel] Pedido cancelado e cliente notificado com sucesso!');
  } catch (err) {
    console.error('Erro ao cancelar pedido:', err);
    alert('Erro ao salvar cancelamento: ' + (err.message || err));
  }
}
window.handleConfirmCancelOrder = handleConfirmCancelOrder;

// Global Event Delegation para garantir o clique em qualquer dispositivo
document.addEventListener('click', function(e) {
  const cancelBtn = e.target.closest('[data-action="cancel-order"]');
  if (cancelBtn) {
    e.preventDefault();
    const orderId = cancelBtn.getAttribute('data-order-id');
    console.log('[Painel Event Delegation] Clique detectado no botão de cancelar, ID:', orderId);
    if (orderId) {
      openCancelOrderModal(orderId);
    }
  }
});

function advanceOrderStatus(orderId, newStatus) {
  window.Store.updateOrderStatus(orderId, newStatus);
}

function confirmClearOrders() {
  if (confirm('Deseja realmente limpar os pedidos concluídos do histórico?')) {
    window.Store.clearConcludedOrders();
  }
}

// ==========================================================================
// 6. COMANDA DE MONTAGEM & IMPRESSÃO TÉRMICA
// ==========================================================================
function openReceiptModal(orderId) {
  const order = window.Store.getOrderById(orderId);
  if (!order) return;

  currentViewingOrder = order;
  const config = window.Store.getConfig();
  const container = document.getElementById('receipt-modal-content');

  let paymentTextReceipt = order.paymentMethod.toUpperCase();
  if (order.paymentMethod === 'combinado') {
    paymentTextReceipt = `COMBINADO (PIX + DINHEIRO)<br>` +
      `<span class="text-[10px]">💠 Pix: ${window.Store.formatCurrency(order.pixAmount)}</span><br>` +
      `<span class="text-[10px]">💵 Dinheiro: ${window.Store.formatCurrency(order.cashAmount)}</span>` +
      (order.paymentChange ? `<br><span class="text-[10px]">Troco em dinheiro: ${order.paymentChange}</span>` : '');
  } else if (order.paymentChange) {
    paymentTextReceipt += `<br><span class="text-[10px]">Troco para: ${order.paymentChange}</span>`;
  }

  container.innerHTML = `
    <div class="text-center pb-2 border-b border-dashed border-gray-400">
      <div class="font-extrabold text-sm uppercase">*** ROTTA DO AÇAÍ ***</div>
      <div class="text-[10px] text-gray-600">${config.address || 'Loja Principal'}</div>
      <div class="font-black text-base mt-2 py-1 bg-gray-100 rounded">PEDIDO ${order.orderNumber}</div>
      <div class="text-[10px] text-gray-600">${order.dateFormatted} às ${order.timeFormatted}</div>
    </div>
    <div class="py-2 border-b border-dashed border-gray-400 space-y-0.5 text-[11px]">
      <div><strong>CLIENTE:</strong> ${order.customer.name}</div>
      <div><strong>TEL:</strong> ${order.customer.phone}</div>
      <div><strong>TIPO:</strong> ${order.deliveryType === 'entrega' ? 'ENTREGA EM DOMICÍLIO' : 'RETIRADA NO BALCÃO'}</div>
      ${order.address ? `<div class="mt-1 bg-gray-50 p-1 rounded"><strong>ENDEREÇO:</strong><br>${order.address.street}, ${order.address.number} - ${order.address.neighborhood}${order.address.ref ? '<br>Ref: ' + order.address.ref : ''}</div>` : ''}
    </div>
    <div class="py-2 border-b border-dashed border-gray-400 space-y-2">
      <div class="font-bold text-[11px] uppercase">=== ITENS DO PEDIDO ===</div>
      ${order.items.map(item => `
        <div class="text-[11px] pb-1 border-b border-gray-100 last:border-0">
          <div class="flex justify-between font-extrabold"><span>[${item.quantity}x] ${item.name}</span><span>${window.Store.formatCurrency(item.unitPrice * item.quantity)}</span></div>
          ${item.calda ? `<div class="font-extrabold ml-2 text-amber-900">» Calda: ${item.calda}</div>` : ''}
          ${item.fruits && item.fruits.length > 0 ? `<div class="font-semibold ml-2">» Frutas: ${item.fruits.map(f => f.name).join(' + ')}</div>` : ''}
          ${item.freeToppings && item.freeToppings.length > 0 ? `<div class="ml-2">» Complementos: ${item.freeToppings.map(t => t.name).join(' + ')}</div>` : ''}
          ${item.notes ? `<div class="italic ml-2 bg-yellow-50 p-0.5">OBS: "${item.notes}"</div>` : ''}
        </div>`).join('')}
    </div>
    <div class="pt-2 text-[11px] space-y-1">
      <div class="flex justify-between"><span>Subtotal:</span><span>${window.Store.formatCurrency(order.subtotal)}</span></div>
      <div class="flex justify-between font-black text-sm pt-1 border-t border-gray-400"><span>TOTAL:</span><span>${window.Store.formatCurrency(order.total)}</span></div>
      <div class="text-center font-bold uppercase mt-2 pt-1 border-t border-dashed border-gray-400">
        ${paymentTextReceipt}
      </div>
    </div>`;

  document.getElementById('receipt-modal').classList.remove('hidden');
}

function closeReceiptModal() {
  document.getElementById('receipt-modal').classList.add('hidden');
  currentViewingOrder = null;
}

// ==========================================================================
// 7. GESTÃO DE CARDÁPIO & ESTOQUE
// ==========================================================================
function renderStockManagement() {
  renderStockProducts();
  renderStockAddons();
  renderStockToppings();
  renderStockCaldas();
}

function renderStockProducts() {
  const container = document.getElementById('stock-products-list');
  const products = window.Store.getProducts();
  container.innerHTML = products.map(prod => `
    <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        ${prod.image ? `<img src="${prod.image}" class="w-10 h-10 object-cover rounded-lg border border-purple-200">` : `<span class="text-2xl">${prod.icon || '🍧'}</span>`}
        <div>
          <h4 class="font-bold text-xs text-gray-800">${prod.name}</h4>
          <span class="text-[11px] text-gray-500 font-semibold">${window.Store.formatCurrency(prod.price)}</span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="openEditModal('product', '${prod.id}')" title="Editar item" class="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-bold transition">✏️</button>
        <button onclick="handleDeleteProduct('${prod.id}')" title="Excluir item definitivamente" class="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition">🗑️</button>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${prod.available !== false ? 'checked' : ''} onchange="toggleProductAvailability('${prod.id}')" class="sr-only peer">
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>`).join('');
}

function toggleProductAvailability(id) {
  const products = window.Store.getProducts();
  const prod = products.find(p => p.id === id);
  if (prod) { prod.available = !(prod.available !== false); window.Store.saveProducts(products); renderStockProducts(); }
}

function handleDeleteProduct(id) {
  if (confirm("Deseja realmente excluir este produto definitivamente do cardápio?")) {
    window.Store.deleteProduct(id);
    renderStockProducts();
    alert("✅ Produto excluído com sucesso!");
  }
}

function renderStockAddons() {
  const container = document.getElementById('stock-addons-list');
  const fruits = window.Store.getFruits();
  container.innerHTML = fruits.map(fruit => `
    <div class="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        ${fruit.image ? `<img src="${fruit.image}" class="w-10 h-10 object-cover rounded-lg border border-amber-200">` : `<span class="text-xl">${fruit.icon || '🍓'}</span>`}
        <div>
          <h4 class="font-bold text-xs text-gray-800">${fruit.name}</h4>
          <span class="text-[11px] text-amber-700 font-semibold">Fruta Inclusa</span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="openEditModal('fruit', '${fruit.id}')" title="Editar item" class="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition">✏️</button>
        <button onclick="handleDeleteFruit('${fruit.id}')" title="Excluir fruta definitivamente" class="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition">🗑️</button>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${fruit.available !== false ? 'checked' : ''} onchange="toggleFruitAvailability('${fruit.id}')" class="sr-only peer">
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>`).join('');
}

function toggleFruitAvailability(id) {
  const fruits = window.Store.getFruits();
  const fruit = fruits.find(a => a.id === id);
  if (fruit) { fruit.available = !(fruit.available !== false); window.Store.saveFruits(fruits); renderStockAddons(); }
}

function handleDeleteFruit(id) {
  if (confirm("Deseja realmente excluir esta fruta definitivamente do cardápio?")) {
    window.Store.deleteFruit(id);
    renderStockAddons();
    alert("✅ Fruta excluída com sucesso!");
  }
}

function renderStockToppings() {
  const container = document.getElementById('stock-toppings-list');
  const toppings = window.Store.getFreeToppings();
  container.innerHTML = toppings.map(top => `
    <div class="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        ${top.image ? `<img src="${top.image}" class="w-10 h-10 object-cover rounded-lg border border-emerald-200">` : `<span class="text-xl">${top.icon || '🥣'}</span>`}
        <div>
          <h4 class="font-bold text-xs text-gray-800">${top.name}</h4>
          <span class="text-[11px] text-purple-700 font-semibold">Complemento</span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="openEditModal('topping', '${top.id}')" title="Editar item" class="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition">✏️</button>
        <button onclick="handleDeleteTopping('${top.id}')" title="Excluir complemento definitivamente" class="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition">🗑️</button>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${top.available !== false ? 'checked' : ''} onchange="toggleToppingAvailability('${top.id}')" class="sr-only peer">
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>`).join('');
}

function toggleToppingAvailability(id) {
  const toppings = window.Store.getFreeToppings();
  const top = toppings.find(t => t.id === id);
  if (top) { top.available = !(top.available !== false); window.Store.saveFreeToppings(toppings); renderStockToppings(); }
}

function handleDeleteTopping(id) {
  if (confirm("Deseja realmente excluir este complemento definitivamente do cardápio?")) {
    window.Store.deleteFreeTopping(id);
    renderStockToppings();
    alert("✅ Complemento excluído com sucesso!");
  }
}

function renderStockCaldas() {
  const container = document.getElementById('stock-caldas-list');
  if (!container) return;
  const caldas = window.Store.getCaldas();
  container.innerHTML = caldas.map(calda => `
    <div class="p-3 bg-amber-50/70 rounded-xl border border-amber-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        ${calda.image ? `<img src="${calda.image}" class="w-10 h-10 object-cover rounded-lg border border-amber-200">` : `<span class="text-xl">${calda.icon || '🍯'}</span>`}
        <div>
          <h4 class="font-bold text-xs text-gray-800">${calda.name}</h4>
          <span class="text-[11px] text-amber-800 font-semibold">Calda</span>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="openEditModal('calda', '${calda.id}')" title="Editar item" class="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition">✏️</button>
        <button onclick="handleDeleteCalda('${calda.id}')" title="Excluir calda definitivamente" class="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold transition">🗑️</button>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" ${calda.available !== false ? 'checked' : ''} onchange="toggleCaldaAvailability('${calda.id}')" class="sr-only peer">
          <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
        </label>
      </div>
    </div>`).join('');
}

function toggleCaldaAvailability(id) {
  const caldas = window.Store.getCaldas();
  const calda = caldas.find(c => c.id === id);
  if (calda) { calda.available = !(calda.available !== false); window.Store.saveCaldas(caldas); renderStockCaldas(); }
}

function handleDeleteCalda(id) {
  if (confirm("Deseja realmente excluir esta opção de calda definitivamente do cardápio?")) {
    window.Store.deleteCalda(id);
    renderStockCaldas();
    alert("✅ Calda excluída com sucesso!");
  }
}

let currentEditItem = null;

function openEditModal(type, id) {
  let item = null;
  if (type === 'product') {
    item = window.Store.getProducts().find(p => p.id === id);
  } else if (type === 'fruit') {
    item = window.Store.getFruits().find(f => f.id === id);
  } else if (type === 'topping') {
    item = window.Store.getFreeToppings().find(t => t.id === id);
  } else if (type === 'calda') {
    item = window.Store.getCaldas().find(c => c.id === id);
  }

  if (!item) return;

  currentEditItem = { type, id, image: item.image || '' };

  document.getElementById('edit-item-type').value = type;
  document.getElementById('edit-item-id').value = id;
  document.getElementById('edit-item-name').value = item.name || '';
  document.getElementById('edit-item-price').value = item.price || 0;

  const limitsContainer = document.getElementById('edit-item-limits-container');
  if (type === 'product' && item.allowsCustomization) {
    limitsContainer.classList.remove('hidden');
    document.getElementById('edit-item-fruit-limit').value = item.freeFruitLimit || 3;
    document.getElementById('edit-item-topping-limit').value = item.freeToppingLimit || 3;
  } else {
    limitsContainer.classList.add('hidden');
  }

  const previewDiv = document.getElementById('edit-item-image-preview');
  const previewImg = document.getElementById('preview-img-src');
  if (item.image) {
    previewImg.src = item.image;
    previewDiv.classList.remove('hidden');
  } else {
    previewImg.src = '';
    previewDiv.classList.add('hidden');
  }

  document.getElementById('edit-item-photo').value = '';
  document.getElementById('edit-item-modal').classList.remove('hidden');
}

function closeEditModal() {
  document.getElementById('edit-item-modal').classList.add('hidden');
  currentEditItem = null;
}

function resizeImageFile(file, maxWidth, maxHeight, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.8;
      let dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      while (dataUrl.length > 270000 && quality > 0.3) {
        quality -= 0.1;
        dataUrl = canvas.toDataURL('image/jpeg', quality);
      }

      callback(dataUrl);
    };
    img.onerror = function() {
      callback(null);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function handleSaveItemEdit(e) {
  e.preventDefault();
  if (!currentEditItem) return;

  const type = document.getElementById('edit-item-type').value;
  const id = document.getElementById('edit-item-id').value;
  const newName = document.getElementById('edit-item-name').value.trim();
  const newPrice = parseFloat(document.getElementById('edit-item-price').value) || 0;
  const fileInput = document.getElementById('edit-item-photo');

  let base64Image = currentEditItem.image;

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert("O arquivo selecionado é muito grande. Escolha uma imagem menor.");
      return;
    }

    base64Image = await new Promise(resolve => {
      resizeImageFile(file, 800, 800, function(dataUrl) {
        resolve(dataUrl);
      });
    });

    if (!base64Image) {
      alert("Erro ao processar imagem. Tente outra foto.");
      return;
    }

    if (base64Image.length > 270000) {
      alert("A imagem selecionada é muito pesada mesmo após otimização (máx. 200 KB). Por favor escolha uma foto com menor resolução.");
      return;
    }
  }

  if (type === 'product') {
    const products = window.Store.getProducts();
    const prod = products.find(p => p.id === id);
    if (prod) {
      prod.name = newName;
      prod.price = newPrice;
      prod.image = base64Image;
      if (prod.allowsCustomization) {
        prod.freeFruitLimit = parseInt(document.getElementById('edit-item-fruit-limit').value) || 3;
        prod.freeToppingLimit = parseInt(document.getElementById('edit-item-topping-limit').value) || 3;
      }
      window.Store.saveProducts(products);
    }
  } else if (type === 'fruit') {
    const fruits = window.Store.getFruits();
    const fruit = fruits.find(f => f.id === id);
    if (fruit) {
      fruit.name = newName;
      fruit.price = newPrice;
      fruit.image = base64Image;
      window.Store.saveFruits(fruits);
    }
  } else if (type === 'topping') {
    const toppings = window.Store.getFreeToppings();
    const top = toppings.find(t => t.id === id);
    if (top) {
      top.name = newName;
      top.image = base64Image;
      window.Store.saveFreeToppings(toppings);
    }
  } else if (type === 'calda') {
    const caldas = window.Store.getCaldas();
    const calda = caldas.find(c => c.id === id);
    if (calda) {
      calda.name = newName;
      calda.image = base64Image;
      window.Store.saveCaldas(caldas);
    }
  }

  closeEditModal();
  renderStockManagement();
  alert("✅ Item atualizado com sucesso!");
}

// Modal de Criação de Novo Item
function openAddNewItemModal() {
  const modal = document.getElementById('add-new-item-modal');
  if (modal) {
    modal.classList.remove('hidden');
    toggleNewItemFields();
  }
}

function closeAddNewItemModal() {
  const modal = document.getElementById('add-new-item-modal');
  if (modal) {
    modal.classList.add('hidden');
    const form = document.getElementById('add-item-form');
    if (form) form.reset();
  }
}

function toggleNewItemFields() {
  const typeSelect = document.getElementById('new-item-type');
  if (!typeSelect) return;
  const type = typeSelect.value;
  const priceContainer = document.getElementById('new-item-price-container');
  const catContainer = document.getElementById('new-item-category-container');
  const limitsContainer = document.getElementById('new-item-limits-container');

  if (type === 'product') {
    if (priceContainer) priceContainer.classList.remove('hidden');
    if (catContainer) catContainer.classList.remove('hidden');
    if (limitsContainer) limitsContainer.classList.remove('hidden');
  } else {
    if (priceContainer) priceContainer.classList.add('hidden');
    if (catContainer) catContainer.classList.add('hidden');
    if (limitsContainer) limitsContainer.classList.add('hidden');
  }
}

async function handleCreateNewItem(e) {
  e.preventDefault();
  const type = document.getElementById('new-item-type').value;
  const name = document.getElementById('new-item-name').value.trim();
  const price = parseFloat(document.getElementById('new-item-price').value) || 0;
  const fileInput = document.getElementById('new-item-photo');

  if (!name) {
    alert("Informe o nome do item!");
    return;
  }

  let base64Image = '';
  if (fileInput && fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    base64Image = await new Promise(resolve => {
      resizeImageFile(file, 800, 800, function(dataUrl) {
        resolve(dataUrl || '');
      });
    });
  }

  if (type === 'product') {
    const category = document.getElementById('new-item-product-cat').value || 'copos';
    const fruitLimit = parseInt(document.getElementById('new-item-fruit-limit').value) || 3;
    const toppingLimit = parseInt(document.getElementById('new-item-topping-limit').value) || 3;
    const allowsCustomization = category !== 'bebidas';

    window.Store.addProduct({
      id: 'prod_' + Date.now(),
      name,
      price,
      category,
      allowsCustomization,
      freeFruitLimit: fruitLimit,
      freeToppingLimit: toppingLimit,
      available: true,
      image: base64Image,
      icon: '🍧'
    });
  } else if (type === 'fruit') {
    window.Store.addFruit({
      id: 'fruit_' + Date.now(),
      name,
      available: true,
      image: base64Image,
      icon: '🍓'
    });
  } else if (type === 'topping') {
    window.Store.addFreeTopping({
      id: 'top_' + Date.now(),
      name,
      available: true,
      image: base64Image,
      icon: '🥣'
    });
  } else if (type === 'calda') {
    window.Store.addCalda({
      id: 'calda_' + Date.now(),
      name,
      available: true,
      image: base64Image,
      icon: '🍯'
    });
  }

  closeAddNewItemModal();
  renderStockManagement();
  alert("✅ Novo item adicionado ao cardápio com sucesso!");
}

// ==========================================================================
// 8. CAIXA & RELATÓRIOS DO DIA & GRÁFICOS
// ==========================================================================
let salesChartInstance = null;
let currentChartPeriod = 'dia';

function filterSalesChart(period) {
  currentChartPeriod = period;
  ['dia', 'semana', 'mes', 'ano'].forEach(p => {
    const btn = document.getElementById(`chart-filter-${p}`);
    if (btn) {
      if (p === period) {
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition bg-acai-700 text-white shadow-sm";
      } else {
        btn.className = "px-3 py-1.5 rounded-lg text-xs font-bold transition text-gray-600 hover:bg-gray-200";
      }
    }
  });

  const orders = window.Store.getOrdersArray().filter(o => o.status !== 'cancelado');
  renderSalesChart(orders, period);
}

function renderSalesChart(orders, period) {
  const canvas = document.getElementById('sales-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (salesChartInstance) {
    salesChartInstance.destroy();
    salesChartInstance = null;
  }

  let labels = [];
  let revenueData = [];
  let ordersCountData = [];

  if (period === 'dia') {
    const hours = [10, 12, 14, 16, 18, 20, 22];
    labels = hours.map(h => `${h}:00`);
    revenueData = hours.map(() => 0);
    ordersCountData = hours.map(() => 0);

    orders.forEach(o => {
      let orderHour = 14;
      if (o.createdAt) {
        orderHour = new Date(o.createdAt).getHours();
      } else if (o.timeFormatted) {
        orderHour = parseInt(o.timeFormatted.split(':')[0]) || 14;
      }
      let idx = 0;
      let minDiff = 999;
      hours.forEach((h, i) => {
        const diff = Math.abs(orderHour - h);
        if (diff < minDiff) {
          minDiff = diff;
          idx = i;
        }
      });
      revenueData[idx] += (o.total || 0);
      ordersCountData[idx] += 1;
    });

  } else if (period === 'semana') {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    labels = days;
    revenueData = [0, 0, 0, 0, 0, 0, 0];
    ordersCountData = [0, 0, 0, 0, 0, 0, 0];

    orders.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const dayIdx = d.getDay();
      revenueData[dayIdx] += (o.total || 0);
      ordersCountData[dayIdx] += 1;
    });

  } else if (period === 'mes') {
    labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
    revenueData = [0, 0, 0, 0];
    ordersCountData = [0, 0, 0, 0];

    orders.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateNum = d.getDate();
      let weekIdx = Math.floor((dateNum - 1) / 7);
      if (weekIdx > 3) weekIdx = 3;
      revenueData[weekIdx] += (o.total || 0);
      ordersCountData[weekIdx] += 1;
    });

  } else if (period === 'ano') {
    labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    revenueData = new Array(12).fill(0);
    ordersCountData = new Array(12).fill(0);

    orders.forEach(o => {
      const d = o.createdAt ? new Date(o.createdAt) : new Date();
      const monthIdx = d.getMonth();
      revenueData[monthIdx] += (o.total || 0);
      ordersCountData[monthIdx] += 1;
    });
  }

  salesChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Faturamento (R$)',
          data: revenueData,
          backgroundColor: 'rgba(76, 8, 103, 0.85)',
          borderColor: '#4c0867',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y'
        },
        {
          label: 'Qtd Pedidos',
          data: ordersCountData,
          backgroundColor: 'rgba(245, 166, 35, 0.85)',
          borderColor: '#f5a623',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          ticks: {
            callback: function(val) { return 'R$ ' + val; },
            font: { size: 10 }
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            stepSize: 1,
            font: { size: 10 }
          }
        },
        x: {
          ticks: { font: { size: 10 } }
        }
      },
      plugins: {
        legend: {
          display: true,
          labels: { font: { size: 11, weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.datasetIndex === 0) {
                label += 'R$ ' + context.parsed.y.toFixed(2).replace('.', ',');
              } else {
                label += context.parsed.y + ' pedidos';
              }
              return label;
            }
          }
        }
      }
    }
  });
}

function getSelectedCaixaDate() {
  const dateInput = document.getElementById('caixa-date-filter');
  if (dateInput && dateInput.value) {
    return dateInput.value;
  }
  const today = new Date().toISOString().split('T')[0];
  if (dateInput) dateInput.value = today;
  return today;
}

function handleCaixaDateChange() {
  renderFinancialMetrics();
}

function setCaixaDateToday() {
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('caixa-date-filter');
  if (dateInput) dateInput.value = today;
  renderFinancialMetrics();
}

function promptEditDailyGoal() {
  const currentGoal = window.Store.getDailyGoal();
  const input = prompt('Definir Meta Diária de Faturamento (R$):', currentGoal);
  if (input === null) return;
  const num = parseFloat(input);
  if (isNaN(num) || num <= 0) {
    alert('Por favor, digite um valor numérico válido para a meta.');
    return;
  }
  window.Store.setDailyGoal(num);
  renderFinancialMetrics();
  alert(`✅ Meta diária atualizada para ${window.Store.formatCurrency(num)}!`);
}

function promptEditInitialCash() {
  const dateStr = getSelectedCaixaDate();
  const data = window.Store.getCashRegisterData(dateStr);
  const input = prompt(`Definir Troco Inicial (Abertura de Caixa em ${dateStr.split('-').reverse().join('/')}):`, data.initialCash || 0);
  if (input === null) return;
  const num = parseFloat(input);
  if (isNaN(num) || num < 0) {
    alert('Por favor, digite um valor numérico válido.');
    return;
  }
  data.initialCash = num;
  window.Store.saveCashRegisterData(dateStr, data).then(() => {
    renderFinancialMetrics();
  });
}

function openCashTransactionModal(type) {
  const modal = document.getElementById('cash-transaction-modal');
  const title = document.getElementById('cash-modal-title');
  const typeInput = document.getElementById('cash-tx-type');
  const submitBtn = document.getElementById('cash-tx-submit-btn');

  if (typeInput) typeInput.value = type;

  if (type === 'sangria') {
    if (title) title.textContent = '🔻 Lançar Sangria (Saída de Caixa)';
    if (submitBtn) {
      submitBtn.textContent = '➖ Confirmar Sangria';
      submitBtn.className = 'px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow';
    }
  } else {
    if (title) title.textContent = '🟢 Lançar Suprimento (Entrada de Troco)';
    if (submitBtn) {
      submitBtn.textContent = '➕ Confirmar Suprimento';
      submitBtn.className = 'px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow';
    }
  }

  const amountInput = document.getElementById('cash-tx-amount');
  const reasonInput = document.getElementById('cash-tx-reason');
  if (amountInput) amountInput.value = '';
  if (reasonInput) reasonInput.value = '';

  if (modal) modal.classList.remove('hidden');
}

function closeCashTransactionModal() {
  const modal = document.getElementById('cash-transaction-modal');
  if (modal) modal.classList.add('hidden');
}

function handleSaveCashTransaction(e) {
  e.preventDefault();
  const type = document.getElementById('cash-tx-type').value;
  const amount = parseFloat(document.getElementById('cash-tx-amount').value) || 0;
  const reason = document.getElementById('cash-tx-reason').value.trim();
  const dateStr = getSelectedCaixaDate();

  if (amount <= 0) {
    alert('Informe um valor válido maior que zero!');
    return;
  }

  window.Store.addCashTransaction(dateStr, type, amount, reason).then(() => {
    closeCashTransactionModal();
    renderFinancialMetrics();
    alert(`✅ ${type === 'sangria' ? 'Sangria' : 'Suprimento'} de ${window.Store.formatCurrency(amount)} lançado com sucesso!`);
  });
}

function renderFinancialMetrics() {
  const selectedDate = getSelectedCaixaDate();
  const allOrders = window.Store.getOrdersArray().filter(o => o.status !== 'cancelado');

  const orders = allOrders.filter(o => {
    if (!o.createdAt) return true;
    const d = new Date(o.createdAt);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const orderDateStr = `${yyyy}-${mm}-${dd}`;
    return orderDateStr === selectedDate;
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const totalCount = orders.length;
  const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const formattedDateLabel = isToday ? 'Hoje' : selectedDate.split('-').reverse().join('/');
  
  if (document.getElementById('metric-revenue-today')) document.getElementById('metric-revenue-today').textContent = window.Store.formatCurrency(totalRevenue);
  if (document.getElementById('metric-revenue-subtitle')) document.getElementById('metric-revenue-subtitle').textContent = `Total finalizado em ${formattedDateLabel}`;
  if (document.getElementById('metric-orders-count')) document.getElementById('metric-orders-count').textContent = totalCount;
  if (document.getElementById('metric-average-ticket')) document.getElementById('metric-average-ticket').textContent = window.Store.formatCurrency(avgTicket);

  // 1. Meta Diária de Faturamento
  const dailyGoal = window.Store.getDailyGoal();
  const goalPercent = Math.min(100, Math.round((totalRevenue / dailyGoal) * 100));
  if (document.getElementById('caixa-goal-text')) {
    document.getElementById('caixa-goal-text').textContent = `${window.Store.formatCurrency(totalRevenue)} de ${window.Store.formatCurrency(dailyGoal)}`;
  }
  if (document.getElementById('caixa-goal-bar')) {
    document.getElementById('caixa-goal-bar').style.width = `${goalPercent}%`;
  }
  if (document.getElementById('caixa-goal-percent')) {
    document.getElementById('caixa-goal-percent').textContent = `${goalPercent}% Atingido`;
  }
  if (document.getElementById('caixa-goal-status')) {
    if (goalPercent >= 100) {
      document.getElementById('caixa-goal-status').textContent = '🎉 META ALCANÇADA!';
    } else {
      document.getElementById('caixa-goal-status').textContent = `Faltam ${window.Store.formatCurrency(Math.max(0, dailyGoal - totalRevenue))} 🚀`;
    }
  }

  // 2. Fluxo de Caixa Físico (Troco Inicial, Sangrias, Suprimentos)
  const cashRegData = window.Store.getCashRegisterData(selectedDate);
  const initialCash = cashRegData.initialCash || 0;
  
  const cashOrders = orders.filter(o => o.paymentMethod === 'dinheiro');
  const cashSalesTotal = cashOrders.reduce((s, o) => s + (o.total || 0), 0);

  const sangriasList = cashRegData.sangrias || [];
  const suprimentosList = cashRegData.suprimentos || [];
  const totalSangrias = sangriasList.reduce((s, item) => s + (item.amount || 0), 0);
  const totalSuprimentos = suprimentosList.reduce((s, item) => s + (item.amount || 0), 0);

  const expectedDrawer = initialCash + cashSalesTotal + totalSuprimentos - totalSangrias;

  if (document.getElementById('caixa-initial-cash')) document.getElementById('caixa-initial-cash').textContent = window.Store.formatCurrency(initialCash);
  if (document.getElementById('caixa-cash-sales')) document.getElementById('caixa-cash-sales').textContent = window.Store.formatCurrency(cashSalesTotal);
  if (document.getElementById('caixa-total-suprimentos')) document.getElementById('caixa-total-suprimentos').textContent = window.Store.formatCurrency(totalSuprimentos);
  if (document.getElementById('caixa-total-sangrias')) document.getElementById('caixa-total-sangrias').textContent = window.Store.formatCurrency(totalSangrias);
  if (document.getElementById('caixa-expected-drawer')) document.getElementById('caixa-expected-drawer').textContent = window.Store.formatCurrency(expectedDrawer);

  // Renderizar Lista de Movimentações
  const txHistoryContainer = document.getElementById('caixa-transactions-list');
  if (txHistoryContainer) {
    const allTxs = [
      ...sangriasList.map(t => ({ ...t, type: 'sangria' })),
      ...suprimentosList.map(t => ({ ...t, type: 'suprimento' }))
    ].sort((a, b) => (b.id || 0).localeCompare(a.id || 0));

    if (allTxs.length === 0) {
      txHistoryContainer.innerHTML = `<p class="text-gray-400 italic text-center text-[11px] py-1">Nenhuma sangria ou suprimento lançado nesta data.</p>`;
    } else {
      txHistoryContainer.innerHTML = allTxs.map(t => `
        <div class="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-200">
          <div class="flex items-center space-x-2">
            <span class="text-xs">${t.type === 'sangria' ? '🔻' : '🟢'}</span>
            <div>
              <span class="font-bold ${t.type === 'sangria' ? 'text-rose-700' : 'text-emerald-700'}">${t.type === 'sangria' ? 'Sangria' : 'Suprimento'}: ${t.reason}</span>
              <span class="text-[10px] text-gray-400 block">${t.time || ''}</span>
            </div>
          </div>
          <span class="font-black text-xs ${t.type === 'sangria' ? 'text-rose-700' : 'text-emerald-700'}">
            ${t.type === 'sangria' ? '-' : '+'}${window.Store.formatCurrency(t.amount)}
          </span>
        </div>
      `).join('');
    }
  }

  // 3. Vendas por Pagamento & Recebimento
  const pix = orders.filter(o => o.paymentMethod === 'pix');
  const combined = orders.filter(o => o.paymentMethod === 'combinado');
  const cash = orders.filter(o => o.paymentMethod === 'dinheiro');

  if (document.getElementById('metric-pix-total')) document.getElementById('metric-pix-total').textContent = window.Store.formatCurrency(pix.reduce((s, o) => s + (o.total || 0), 0));
  if (document.getElementById('metric-pix-count')) document.getElementById('metric-pix-count').textContent = pix.length + ' ped';
  if (document.getElementById('metric-card-total')) document.getElementById('metric-card-total').textContent = window.Store.formatCurrency(combined.reduce((s, o) => s + (o.total || 0), 0));
  if (document.getElementById('metric-card-count')) document.getElementById('metric-card-count').textContent = combined.length + ' ped';
  if (document.getElementById('metric-cash-total')) document.getElementById('metric-cash-total').textContent = window.Store.formatCurrency(cashSalesTotal);
  if (document.getElementById('metric-cash-count')) document.getElementById('metric-cash-count').textContent = cash.length + ' ped';

  const delivery = orders.filter(o => o.deliveryType === 'entrega');
  const pickup = orders.filter(o => (o.deliveryType || 'retirada') === 'retirada');

  if (document.getElementById('metric-delivery-total')) document.getElementById('metric-delivery-total').textContent = window.Store.formatCurrency(delivery.reduce((s, o) => s + (o.total || 0), 0));
  if (document.getElementById('metric-delivery-count')) document.getElementById('metric-delivery-count').textContent = delivery.length + ' ped';
  if (document.getElementById('metric-pickup-total')) document.getElementById('metric-pickup-total').textContent = window.Store.formatCurrency(pickup.reduce((s, o) => s + (o.total || 0), 0));
  if (document.getElementById('metric-pickup-count')) document.getElementById('metric-pickup-count').textContent = pickup.length + ' ped';

  // 4. Ranking dos Produtos & Insumos Mais Vendidos (Top Vendas)
  renderTopSellers(orders);

  // 5. Tabela de Transações
  const tbody = document.getElementById('sales-table-body');
  if (tbody) {
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-gray-400 font-semibold text-center">Nenhum pedido finalizado em ${formattedDateLabel}.</td></tr>`;
    } else {
      tbody.innerHTML = orders.map(o => `
        <tr class="hover:bg-purple-50/50 transition">
          <td class="p-3 font-black text-acai-900">${o.orderNumber}</td>
          <td class="p-3 text-gray-600 font-semibold">${o.timeFormatted || ''}</td>
          <td class="p-3 font-bold text-gray-800">${o.customer ? o.customer.name : ''}</td>
          <td class="p-3 text-gray-600 max-w-xs truncate">${o.items ? o.items.map(i => `${i.quantity}x ${i.name}`).join(', ') : ''}</td>
          <td class="p-3">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.deliveryType === 'entrega' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}">
              ${o.deliveryType === 'entrega' ? '🛵 Entrega' : '🏪 Retirada'}
            </span>
          </td>
          <td class="p-3">
            <span class="font-bold text-[10px] uppercase text-gray-700">${o.paymentMethod}</span>
          </td>
          <td class="p-3 text-right font-black text-acai-900">${window.Store.formatCurrency(o.total)}</td>
        </tr>
      `).join('');
    }
  }

  // Gráfico de Vendas
  try {
    renderSalesChart(orders, currentChartPeriod);
  } catch (err) {
    console.error("Erro ao renderizar gráfico de vendas:", err);
  }
}

function renderTopSellers(orders) {
  const prodCounts = {};
  const fruitCounts = {};
  const toppingCounts = {};

  orders.forEach(order => {
    if (!Array.isArray(order.items)) return;
    order.items.forEach(item => {
      const q = parseInt(item.quantity, 10) || 1;
      const pName = item.name || 'Produto';
      prodCounts[pName] = (prodCounts[pName] || 0) + q;

      if (Array.isArray(item.selectedFruits)) {
        item.selectedFruits.forEach(f => {
          const fName = (typeof f === 'string' ? f : f.name) || '';
          if (fName) fruitCounts[fName] = (fruitCounts[fName] || 0) + q;
        });
      }

      if (Array.isArray(item.selectedToppings)) {
        item.selectedToppings.forEach(t => {
          const tName = (typeof t === 'string' ? t : t.name) || '';
          if (tName) toppingCounts[tName] = (toppingCounts[tName] || 0) + q;
        });
      }

      if (item.selectedCalda) {
        const cName = (typeof item.selectedCalda === 'string' ? item.selectedCalda : item.selectedCalda.name) || '';
        if (cName && !cName.toLowerCase().includes('sem calda')) {
          toppingCounts[`Calda: ${cName}`] = (toppingCounts[`Calda: ${cName}`] || 0) + q;
        }
      }
    });
  });

  const renderRankingList = (containerId, dataMap, badgeColorClass) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const sorted = Object.entries(dataMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) {
      container.innerHTML = `<p class="text-gray-400 italic text-center py-3 text-[11px]">Sem registros suficientes no período</p>`;
      return;
    }
    container.innerHTML = sorted.map(([name, count], index) => `
      <div class="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-100">
        <div class="flex items-center space-x-2 truncate">
          <span class="w-5 h-5 rounded-full ${badgeColorClass} text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-sm">${index + 1}</span>
          <span class="font-bold text-gray-800 text-xs truncate">${name}</span>
        </div>
        <span class="font-black text-xs text-acai-900 shrink-0 bg-white px-2 py-0.5 rounded-md border border-gray-200">${count}x</span>
      </div>
    `).join('');
  };

  renderRankingList('top-products-list', prodCounts, 'bg-acai-800');
  renderRankingList('top-fruits-list', fruitCounts, 'bg-amber-600');
  renderRankingList('top-toppings-list', toppingCounts, 'bg-purple-700');
}

// ==========================================================================
// 9. CONFIGURAÇÕES DA LOJA
// ==========================================================================
function loadConfigForm() {
  const config = window.Store.getConfig();
  document.getElementById('cfg-name').value = config.name || '';
  document.getElementById('cfg-phone').value = config.phone || '';
  document.getElementById('cfg-pix').value = config.pixKey || '4b93bf67-9a91-4ffc-951c-ddd12184e042';
  document.getElementById('cfg-time').value = config.estimatedTime || '';
  document.getElementById('cfg-address').value = config.address || '';
  const tgElem = document.getElementById('cfg-telegram-chatid');
  if (tgElem) tgElem.value = config.telegramChatId || '8114492362';

  const creds = getPanelCredentials();
  const userField = document.getElementById('cfg-username');
  const passField = document.getElementById('cfg-password');
  if (userField) userField.value = creds.user;
  if (passField) passField.value = creds.pass;
}

function saveStoreSettings(e) {
  e.preventDefault();
  const config = window.Store.getConfig();
  config.name = document.getElementById('cfg-name').value.trim();
  config.phone = window.Store.formatWhatsAppPhone(document.getElementById('cfg-phone').value.trim());
  config.pixKey = document.getElementById('cfg-pix').value.trim();
  config.deliveryFee = 0;
  config.estimatedTime = document.getElementById('cfg-time').value.trim();
  config.address = document.getElementById('cfg-address').value.trim();
  const tgVal = document.getElementById('cfg-telegram-chatid')?.value.trim();
  if (tgVal) config.telegramChatId = tgVal;

  document.getElementById('cfg-phone').value = config.phone;

  window.Store.saveConfig(config);

  const newUser = document.getElementById('cfg-username')?.value.trim();
  const newPass = document.getElementById('cfg-password')?.value.trim();
  if (newUser && newPass) {
    localStorage.setItem(CREDS_KEY, JSON.stringify({ user: newUser, pass: newPass }));
  }

  alert('✅ Configurações salvas com sucesso!');
}

async function detectTelegramGroupId() {
  const token = '8861858650:AAG_aPAz8Uwvkxow7q3s1wKI-4Qo_CmefgY';
  const btn = document.querySelector('button[onclick*="detectTelegramGroupId"]');
  if (btn) btn.textContent = '⏳ Buscando...';

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.result) && data.result.length > 0) {
      const groupMsg = [...data.result].reverse().find(u => {
        const chat = (u.message && u.message.chat) || (u.my_chat_member && u.my_chat_member.chat);
        return chat && (chat.type === 'group' || chat.type === 'supergroup');
      });

      if (groupMsg) {
        const chat = groupMsg.message ? groupMsg.message.chat : groupMsg.my_chat_member.chat;
        const groupId = chat.id;
        const groupTitle = chat.title || 'Grupo da Loja';

        const input = document.getElementById('cfg-telegram-chatid');
        if (input) input.value = groupId;

        // Grava no Firebase IMEDIATAMENTE para garantir que todos os pedidos vão pro grupo!
        const config = window.Store.getConfig();
        config.telegramChatId = String(groupId).trim();
        window.Store.saveConfig(config);

        alert(`✅ Grupo Encontrado e Salvo com Sucesso!\n\nNome: "${groupTitle}"\nID: ${groupId}\n\nO grupo foi configurado no sistema! Todos os novos pedidos chegarão diretamente neste grupo.`);
        return;
      }
    }

    alert('⚠️ Nenhum grupo detectado ainda no robô.\n\nPassos rápidos:\n1. Adicione o robô da loja ao seu grupo do Telegram.\n2. Envie qualquer mensagem no grupo (ex: "oi").\n3. Clique neste botão novamente!');
  } catch (err) {
    alert('Erro ao consultar o Telegram: ' + err.message);
  } finally {
    if (btn) btn.innerHTML = '<span>🔍</span><span>Detectar ID do Grupo</span>';
  }
}
window.detectTelegramGroupId = detectTelegramGroupId;

async function testTelegramGroupNotification() {
  const input = document.getElementById('cfg-telegram-chatid');
  const chatId = input ? input.value.trim() : '';

  if (!chatId) {
    alert('Por favor, informe ou detecte o Telegram Chat ID primeiro.');
    return;
  }

  // Grava o ID no banco do Firebase imediatamente ao clicar em Testar Envio!
  const config = window.Store.getConfig();
  config.telegramChatId = chatId;
  window.Store.saveConfig(config);

  const token = '8861858650:AAG_aPAz8Uwvkxow7q3s1wKI-4Qo_CmefgY';
  const testMsg = `🔔 <b>TESTE DE NOTIFICAÇÃO - ROTTA DO AÇAÍ</b> 🍇\n\n` +
                  `Se você está lendo esta mensagem no Telegram, o robô está **configurado com sucesso no seu Grupo (${chatId})** e enviará todos os novos pedidos automaticamente! 🎉`;

  const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(testMsg)}&parse_mode=HTML`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok) {
      alert(`🎉 SUCESSO!\n\nA mensagem de teste foi enviada e gravada no sistema para o seu grupo (${chatId}) com sucesso!\n\nConfira o seu aplicativo do Telegram no celular ou computador.`);
    } else {
      console.warn('Telegram Error:', data);
      const errDesc = data.description || 'Erro desconhecido no Telegram';
      alert(`⚠️ Erro ao enviar para o Telegram (${data.error_code}):\n\n"${errDesc}"\n\nVerifique se o robô foi adicionado ao grupo como administrador.`);
    }
  } catch (err) {
    alert('Erro de conexão com o Telegram: ' + err.message);
  }
}
window.testTelegramGroupNotification = testTelegramGroupNotification;

// ==========================================================================
// 10. HORÁRIOS DE FUNCIONAMENTO & PROMOÇÕES PUSH
// ==========================================================================
const DAYS_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

function loadHoursTab() {
  const config = window.Store.getConfig();
  const summaryInput = document.getElementById('cfg-hours-text');
  if (summaryInput) summaryInput.value = config.businessHours || 'Terça a Domingo • 14:00 às 22:00';

  const autoToggle = document.getElementById('cfg-auto-schedule-toggle');
  if (autoToggle) {
    autoToggle.checked = config.autoScheduleEnabled !== false;
  }

  const weekly = config.weeklyHours || {
    segunda: { active: false, hours: 'Fechado' },
    terca: { active: true, hours: '14:00 às 22:00' },
    quarta: { active: true, hours: '14:00 às 22:00' },
    quinta: { active: true, hours: '14:00 às 22:00' },
    sexta: { active: true, hours: '14:00 às 22:00' },
    sabado: { active: true, hours: '14:00 às 22:00' },
    domingo: { active: true, hours: '14:00 às 22:00' }
  };

  DAYS_KEYS.forEach(day => {
    const activeCb = document.getElementById(`wh-${day}-active`);
    const hoursInput = document.getElementById(`wh-${day}-hours`);
    const dayData = weekly[day] || { active: true, hours: '14:00 às 22:00' };

    if (activeCb) activeCb.checked = dayData.active;
    if (hoursInput) {
      hoursInput.value = dayData.hours || '';
      hoursInput.disabled = !dayData.active;
      if (!dayData.active && !hoursInput.value) hoursInput.value = 'Fechado';
    }
  });

  const statusText = document.getElementById('hours-tab-store-status');
  if (statusText) {
    statusText.textContent = config.isOpen ? "🟢 Loja Aberta" : "🔴 Loja Fechada";
  }
}

function handleToggleAutoSchedule() {
  const autoToggle = document.getElementById('cfg-auto-schedule-toggle');
  const config = window.Store.getConfig();
  config.autoScheduleEnabled = autoToggle ? autoToggle.checked : true;
  window.Store.saveConfig(config);

  if (config.autoScheduleEnabled) {
    if (window.Store.checkAndApplyAutoSchedule) window.Store.checkAndApplyAutoSchedule(config);
    alert('⏰ Abertura e fechamento automático por horário ATIVADO!');
  } else {
    alert('⏸️ Automação por horário DESATIVADA. O status da loja agora é 100% manual.');
  }
}
window.handleToggleAutoSchedule = handleToggleAutoSchedule;

function toggleDayInput(day) {
  const activeCb = document.getElementById(`wh-${day}-active`);
  const hoursInput = document.getElementById(`wh-${day}-hours`);
  if (hoursInput && activeCb) {
    hoursInput.disabled = !activeCb.checked;
    if (!activeCb.checked) {
      hoursInput.value = 'Fechado';
    } else if (hoursInput.value === 'Fechado') {
      hoursInput.value = '14:00 às 22:00';
    }
  }
}

function handleSaveBusinessHours(e) {
  e.preventDefault();
  const config = window.Store.getConfig();
  const summaryText = document.getElementById('cfg-hours-text')?.value.trim();

  const weeklyHours = {};
  DAYS_KEYS.forEach(day => {
    const active = document.getElementById(`wh-${day}-active`)?.checked || false;
    const hours = document.getElementById(`wh-${day}-hours`)?.value.trim() || (active ? '14:00 às 22:00' : 'Fechado');
    weeklyHours[day] = { active, hours };
  });

  config.weeklyHours = weeklyHours;
  if (summaryText) config.businessHours = summaryText;

  window.Store.saveConfig(config);
  if (config.autoScheduleEnabled !== false && window.Store.checkAndApplyAutoSchedule) {
    window.Store.checkAndApplyAutoSchedule(config);
  }
  alert("✅ Horários de funcionamento salvos com sucesso!");
}

// --------------------------------------------------------------------------
// Notificação Automática de Abertura da Loja (1x ao Dia)
// --------------------------------------------------------------------------
function loadOpenPromoCard() {
  const config = window.Store.getConfig();
  const activeCb = document.getElementById('open-promo-active');
  const activeLabel = document.getElementById('open-promo-active-label');
  const titleInput = document.getElementById('open-promo-title');
  const msgInput = document.getElementById('open-promo-msg');

  const isEnabled = config.openNotificationEnabled !== false;
  if (activeCb) activeCb.checked = isEnabled;
  if (activeLabel) activeLabel.textContent = isEnabled ? 'Ativada' : 'Desativada';

  if (titleInput) titleInput.value = config.openNotificationTitle || '🟣 Rotta do Açaí Aberta!';
  if (msgInput) msgInput.value = config.openNotificationMessage || 'Já estamos funcionando! Peça seu açaí geladinho agora mesmo pelo aplicativo. 🍧';
}
window.loadOpenPromoCard = loadOpenPromoCard;

function toggleOpenPromoActive() {
  const activeCb = document.getElementById('open-promo-active');
  const activeLabel = document.getElementById('open-promo-active-label');
  const config = window.Store.getConfig();

  config.openNotificationEnabled = activeCb ? activeCb.checked : false;
  if (activeLabel) activeLabel.textContent = config.openNotificationEnabled ? 'Ativada' : 'Desativada';
  window.Store.saveConfig(config);
}
window.toggleOpenPromoActive = toggleOpenPromoActive;

function handleSaveOpenPromo(e) {
  e.preventDefault();
  const titleInput = document.getElementById('open-promo-title');
  const msgInput = document.getElementById('open-promo-msg');
  const activeCb = document.getElementById('open-promo-active');

  const title = titleInput ? titleInput.value.trim() : '';
  const message = msgInput ? msgInput.value.trim() : '';

  if (!title || !message) {
    alert('Por favor, informe o título e a frase da notificação de abertura.');
    return;
  }

  const config = window.Store.getConfig();
  config.openNotificationTitle = title;
  config.openNotificationMessage = message;
  config.openNotificationEnabled = true;

  if (activeCb) activeCb.checked = true;
  const activeLabel = document.getElementById('open-promo-active-label');
  if (activeLabel) activeLabel.textContent = 'Ativada';

  window.Store.saveConfig(config);
  alert('✅ Frase de abertura de loja salva com sucesso! Ela será enviada 1x ao dia no celular dos clientes assim que a loja abrir.');
}
window.handleSaveOpenPromo = handleSaveOpenPromo;

function handleDeleteOpenPromo() {
  if (!confirm('Deseja realmente excluir/desativar a frase automática de abertura da loja?')) return;

  const config = window.Store.getConfig();
  config.openNotificationEnabled = false;
  config.openNotificationTitle = '';
  config.openNotificationMessage = '';

  const titleInput = document.getElementById('open-promo-title');
  const msgInput = document.getElementById('open-promo-msg');
  const activeCb = document.getElementById('open-promo-active');
  const activeLabel = document.getElementById('open-promo-active-label');

  if (titleInput) titleInput.value = '';
  if (msgInput) msgInput.value = '';
  if (activeCb) activeCb.checked = false;
  if (activeLabel) activeLabel.textContent = 'Desativada';

  window.Store.saveConfig(config);
  alert('🗑️ Frase de abertura excluída e notificação automática desativada com sucesso.');
}
window.handleDeleteOpenPromo = handleDeleteOpenPromo;

async function handleSendInstantPromo(e) {
  e.preventDefault();
  const title = document.getElementById('promo-instant-title').value.trim();
  const message = document.getElementById('promo-instant-msg').value.trim();

  if (!title || !message) {
    alert('Por favor, preencha o título e a mensagem da promoção.');
    return;
  }

  try {
    await window.Store.sendPromotion({ title, message });
    document.getElementById('instant-promo-form').reset();
    alert('🚀 Promoção enviada com sucesso em tempo real para todos os clientes!');
    renderPromotionsHistory();
  } catch (err) {
    alert('Erro ao enviar promoção: ' + err.message);
  }
}

async function handleSchedulePromo(e) {
  e.preventDefault();
  const title = document.getElementById('promo-sched-title').value.trim();
  const message = document.getElementById('promo-sched-msg').value.trim();
  const dateVal = document.getElementById('promo-sched-date').value;
  const timeVal = document.getElementById('promo-sched-time').value;

  if (!title || !message || !dateVal || !timeVal) {
    alert('Por favor, preencha todos os campos do agendamento.');
    return;
  }

  const scheduledTime = `${dateVal}T${timeVal}:00`;

  try {
    await window.Store.sendPromotion({ title, message, scheduledTime });
    document.getElementById('scheduled-promo-form').reset();
    alert(`⏰ Promoção agendada com sucesso para ${new Date(scheduledTime).toLocaleString('pt-BR')}!`);
    renderPromotionsHistory();
  } catch (err) {
    alert('Erro ao agendar promoção: ' + err.message);
  }
}

function renderPromotionsHistory() {
  const container = document.getElementById('promotions-history-list');
  if (!container) return;

  const db = window.Store.getDB ? window.Store.getDB() : null;
  if (!db) {
    container.innerHTML = '<div class="text-gray-400 text-xs">Aguardando conexão com o Firebase...</div>';
    return;
  }

  db.ref('promotions').once('value').then(snap => {
    if (!snap.exists()) {
      container.innerHTML = '<div class="text-gray-400 py-4 text-center">Nenhuma promoção enviada ou agendada ainda.</div>';
      return;
    }

    const data = snap.val();
    const list = Object.values(data).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    container.innerHTML = list.map(p => `
      <div class="bg-purple-50/70 p-3.5 rounded-xl border border-purple-100 flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="font-extrabold text-acai-900 flex flex-wrap items-center gap-2">
            <span>📢 ${p.title}</span>
            ${p.scheduledTime 
              ? `<span class="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">⏰ Agendado para ${new Date(p.scheduledTime).toLocaleString('pt-BR')}</span>`
              : `<span class="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">⚡ Disparado em ${p.createdAt ? new Date(p.createdAt).toLocaleString('pt-BR') : ''}</span>`
            }
          </div>
          <p class="text-gray-600 mt-1 text-xs leading-relaxed">${p.message}</p>
        </div>
        <button onclick="handleDeletePromotion('${p.id}')" title="Excluir esta promoção" class="p-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition shrink-0 flex items-center gap-1">
          <span>🗑️</span>
          <span class="hidden sm:inline">Excluir</span>
        </button>
      </div>
    `).join('');
  }).catch(err => {
    container.innerHTML = `<div class="text-red-500 text-xs">Erro ao carregar histórico: ${err.message}</div>`;
  });
}

async function handleDeletePromotion(promoId) {
  if (!promoId) return;
  if (confirm("Deseja realmente excluir esta promoção do histórico?")) {
    try {
      await window.Store.deletePromotion(promoId);
      alert("✅ Promoção excluída com sucesso!");
      renderPromotionsHistory();
    } catch (err) {
      alert("Erro ao excluir promoção: " + err.message);
    }
  }
}

async function handleClearAllPromotions() {
  if (confirm("Deseja realmente apagar TODAS as promoções enviadas e agendadas do histórico?")) {
    try {
      await window.Store.clearAllPromotions();
      alert("✅ Histórico de promoções limpo com sucesso!");
      renderPromotionsHistory();
    } catch (err) {
      alert("Erro ao limpar histórico: " + err.message);
    }
  }
}

window.handlePanelLogin = handlePanelLogin;
window.handlePanelLogout = handlePanelLogout;
window.toggleStoreOpenStatus = toggleStoreOpenStatus;
window.testAudioAlert = testAudioAlert;
window.switchTab = switchTab;
window.renderKanbanBoard = renderKanbanBoard;
window.advanceOrderStatus = advanceOrderStatus;
window.confirmClearOrders = confirmClearOrders;
window.openReceiptModal = openReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.toggleProductAvailability = toggleProductAvailability;
window.toggleAddonAvailability = toggleFruitAvailability;
window.toggleFruitAvailability = toggleFruitAvailability;
window.toggleToppingAvailability = toggleToppingAvailability;
window.renderStockCaldas = renderStockCaldas;
window.toggleCaldaAvailability = toggleCaldaAvailability;
window.handleDeleteCalda = handleDeleteCalda;
window.handleDeleteProduct = handleDeleteProduct;
window.handleDeleteFruit = handleDeleteFruit;
window.handleDeleteTopping = handleDeleteTopping;
window.openAddNewItemModal = openAddNewItemModal;
window.closeAddNewItemModal = closeAddNewItemModal;
window.toggleNewItemFields = toggleNewItemFields;
window.handleCreateNewItem = handleCreateNewItem;
window.filterSalesChart = filterSalesChart;
window.renderSalesChart = renderSalesChart;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.handleSaveItemEdit = handleSaveItemEdit;
window.saveStoreSettings = saveStoreSettings;
window.loadHoursTab = loadHoursTab;
window.handleToggleAutoSchedule = handleToggleAutoSchedule;
window.toggleDayInput = toggleDayInput;
window.handleSaveBusinessHours = handleSaveBusinessHours;
window.loadOpenPromoCard = loadOpenPromoCard;
window.toggleOpenPromoActive = toggleOpenPromoActive;
window.handleSaveOpenPromo = handleSaveOpenPromo;
window.handleDeleteOpenPromo = handleDeleteOpenPromo;
window.handleSendInstantPromo = handleSendInstantPromo;
window.handleSchedulePromo = handleSchedulePromo;
window.handleDeletePromotion = handleDeletePromotion;
window.handleClearAllPromotions = handleClearAllPromotions;
window.sendPushNotification = sendPushNotification;
window.showInAppToast = showInAppToast;

// ==========================================================================
// 12. GESTÃO DE AVALIAÇÕES DOS CLIENTES
// ==========================================================================
let _ratingsCacheData = [];
let _ratingsCurrentFilter = 'all';

function renderRatingsTab() {
  if (!window.Store || !window.Store.listenToRatings) return;

  window.Store.listenToRatings(ratingsMap => {
    _ratingsCacheData = ratingsMap ? Object.values(ratingsMap) : [];
    updateRatingsMetricsAndList();
  });
}

function updateRatingsMetricsAndList() {
  const container = document.getElementById('ratings-list-container');
  if (!container) return;

  const total = _ratingsCacheData.length;
  const fiveCount = _ratingsCacheData.filter(r => (r.stars || 5) === 5).length;
  const improvementsCount = _ratingsCacheData.filter(r => (r.stars || 5) < 5).length;
  const sumStars = _ratingsCacheData.reduce((acc, r) => acc + (r.stars || 5), 0);
  const avg = total > 0 ? (sumStars / total).toFixed(1) : '0.0';

  const avgElem = document.getElementById('rating-avg-score');
  const totalElem = document.getElementById('rating-total-count');
  const fiveElem = document.getElementById('rating-five-star-count');
  const impElem = document.getElementById('rating-improvements-count');

  if (avgElem) avgElem.textContent = `${avg} ⭐`;
  if (totalElem) totalElem.textContent = `${total}`;
  if (fiveElem) fiveElem.textContent = `${fiveCount}`;
  if (impElem) impElem.textContent = `${improvementsCount}`;

  let filtered = [..._ratingsCacheData];
  if (_ratingsCurrentFilter === 'five') {
    filtered = filtered.filter(r => (r.stars || 5) === 5);
  } else if (_ratingsCurrentFilter === 'improvements') {
    filtered = filtered.filter(r => (r.stars || 5) < 5);
  }

  filtered.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center py-10 text-gray-400 bg-purple-50/50 rounded-xl border border-purple-100">
        <span class="text-3xl block mb-2">⭐</span>
        <p class="font-bold text-gray-700 text-sm">Nenhuma avaliação encontrada nesta categoria.</p>
        <p class="text-xs text-gray-500 mt-1">As avaliações enviadas pelos clientes após a conclusão dos pedidos aparecerão aqui!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const stars = r.stars || 5;
    const starsDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const isFive = stars === 5;
    const badge = isFive 
      ? `<span class="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">🌟 5★ Excelente</span>`
      : `<span class="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">💡 ${stars}★ Sugestão de Melhoria</span>`;

    const cleanPhone = (r.customerPhone || '').replace(/\D/g, '');
    const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : '#';

    return `
      <div class="bg-gradient-to-r from-purple-50/70 to-white p-4 rounded-2xl border border-purple-100 shadow-sm space-y-2">
        <div class="flex items-start justify-between flex-wrap gap-2 border-b border-purple-100/60 pb-2">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-acai-800 text-gold-400 font-black flex items-center justify-center text-sm shadow">
              ${(r.customerName || 'C')[0].toUpperCase()}
            </div>
            <div>
              <div class="font-extrabold text-gray-900 text-sm flex items-center gap-2">
                <span>${r.customerName || 'Cliente'}</span>
                ${cleanPhone ? `<a href="${waLink}" target="_blank" class="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1">📱 WhatsApp</a>` : ''}
              </div>
              <div class="text-[11px] text-gray-400">
                <span>Pedido ${r.orderNumber || '#'}</span> • <span>${r.createdAt ? new Date(r.createdAt).toLocaleString('pt-BR') : ''}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            ${badge}
            <button onclick="handleDeleteRating('${r.id}')" title="Excluir Avaliação" class="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition text-xs font-bold flex items-center gap-1">
              <span>🗑️</span>
              <span class="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </div>

        <div class="space-y-1 pt-1">
          <div class="text-amber-500 font-black text-sm tracking-wider">
            ${starsDisplay} <span class="text-xs text-gray-600 font-bold ml-1">(${stars}/5)</span>
          </div>
          <p class="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-purple-50 italic">
            "${r.comment ? r.comment : 'O cliente não digitou um comentário por extenso.'}"
          </p>
        </div>
      </div>
    `;
  }).join('');
}

function filterRatings(type) {
  _ratingsCurrentFilter = type;

  const btnAll = document.getElementById('rating-filter-all');
  const btnFive = document.getElementById('rating-filter-five');
  const btnImp = document.getElementById('rating-filter-improvements');

  const activeClass = "px-3 py-1.5 rounded-lg bg-acai-800 text-gold-400 font-bold shadow-sm";
  const inactiveClass = "px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-bold";

  if (btnAll) btnAll.className = type === 'all' ? activeClass : inactiveClass;
  if (btnFive) btnFive.className = type === 'five' ? activeClass : inactiveClass;
  if (btnImp) btnImp.className = type === 'improvements' ? activeClass : inactiveClass;

  updateRatingsMetricsAndList();
}

async function handleDeleteRating(ratingId) {
  if (!ratingId) return;
  if (confirm("Deseja realmente excluir esta avaliação do painel?")) {
    try {
      await window.Store.deleteRating(ratingId);
      alert("✅ Avaliação excluída com sucesso!");
    } catch (err) {
      alert("Erro ao excluir avaliação: " + err.message);
    }
  }
}

window.renderRatingsTab = renderRatingsTab;
window.filterRatings = filterRatings;
window.handleDeleteRating = handleDeleteRating;

// ==========================================================================
// ABA CLIENTES & PROGRAMA DE FIDELIDADE
// ==========================================================================
let _fidelityAdminLevels = [];

function renderFidelityAdminTab() {
  const cfg = window.Store.getFidelityConfig();
  _fidelityAdminLevels = JSON.parse(JSON.stringify(cfg.levels || []));

  renderFidelityLevelsEditor();
  renderCustomersTableAdmin();
}

function renderFidelityLevelsEditor() {
  const container = document.getElementById('fidelity-levels-editor-container');
  if (!container) return;

  if (_fidelityAdminLevels.length === 0) {
    const cfg = window.Store.getFidelityConfig();
    _fidelityAdminLevels = JSON.parse(JSON.stringify(cfg.levels || []));
  }

  container.innerHTML = _fidelityAdminLevels.map((lvl, idx) => `
    <div class="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      <div class="flex items-center space-x-2 shrink-0">
        <span class="font-extrabold text-acai-900 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-xl">
          Nível ${idx + 1}
        </span>
        <div class="flex items-center space-x-1">
          <label class="font-bold text-gray-700">Copos:</label>
          <input type="number" min="1" max="500" value="${lvl.cupsRequired}" onchange="updateFidelityLevelField(${idx}, 'cupsRequired', this.value)" class="w-16 px-2 py-1 border border-gray-300 rounded-lg text-center font-bold text-acai-900 focus:outline-none focus:ring-1 focus:ring-purple-600">
        </div>
      </div>
      <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label class="font-bold text-gray-600 block text-[10px] uppercase">Título do Prêmio:</label>
          <input type="text" value="${lvl.rewardTitle || ''}" onchange="updateFidelityLevelField(${idx}, 'rewardTitle', this.value)" placeholder="Ex: Açaí 300ml Grátis" class="w-full px-2.5 py-1 border border-gray-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-600">
        </div>
        <div>
          <label class="font-bold text-gray-600 block text-[10px] uppercase">Descrição do Prêmio:</label>
          <input type="text" value="${lvl.rewardDescription || ''}" onchange="updateFidelityLevelField(${idx}, 'rewardDescription', this.value)" placeholder="Ex: 1 Açaí 300ml por nossa conta!" class="w-full px-2.5 py-1 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-600">
        </div>
      </div>
      <button onclick="removeFidelityLevelInAdmin(${idx})" title="Remover Nível" class="text-red-500 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 text-base self-end md:self-center">
        🗑️
      </button>
    </div>
  `).join('');
}

function updateFidelityLevelField(index, field, value) {
  if (_fidelityAdminLevels[index]) {
    if (field === 'cupsRequired') {
      _fidelityAdminLevels[index][field] = Math.max(1, parseInt(value, 10) || 1);
    } else {
      _fidelityAdminLevels[index][field] = value;
    }
  }
}

function addFidelityLevelInAdmin() {
  const nextNum = _fidelityAdminLevels.length + 1;
  const lastCups = _fidelityAdminLevels.length > 0 ? _fidelityAdminLevels[_fidelityAdminLevels.length - 1].cupsRequired : 10;
  
  _fidelityAdminLevels.push({
    level: nextNum,
    cupsRequired: lastCups + 10,
    rewardTitle: `Prêmio Nível ${nextNum}`,
    rewardCode: `REWARD_LVL_${nextNum}`,
    rewardDescription: `Prêmio especial para quem acumular ${lastCups + 10} copos!`
  });

  renderFidelityLevelsEditor();
}

function removeFidelityLevelInAdmin(index) {
  if (_fidelityAdminLevels.length <= 1) {
    alert("O programa de fidelidade precisa ter pelo menos 1 nível.");
    return;
  }
  _fidelityAdminLevels.splice(index, 1);
  _fidelityAdminLevels.forEach((lvl, i) => lvl.level = i + 1);
  renderFidelityLevelsEditor();
}

function saveFidelityConfigFromAdmin() {
  _fidelityAdminLevels.sort((a, b) => a.cupsRequired - b.cupsRequired);
  _fidelityAdminLevels.forEach((lvl, i) => lvl.level = i + 1);

  const cfg = {
    enabled: true,
    levels: _fidelityAdminLevels
  };

  window.Store.saveFidelityConfig(cfg).then(() => {
    alert("✅ Configurações da Trilha salvas com sucesso!");
  }).catch(err => {
    alert("Erro ao salvar configurações da trilha: " + err.message);
  });
}

function resetFidelityConfigToDefault() {
  if (confirm("Deseja restaurar os níveis padrão (10, 25 e 35 copos)?")) {
    window.Store.saveFidelityConfig({
      enabled: true,
      levels: [
        { level: 1, cupsRequired: 10, rewardTitle: "Açaí 300ml Grátis", rewardCode: "REWARD_300ML", rewardDescription: "1 Açaí de 300ml completo por nossa conta!" },
        { level: 2, cupsRequired: 25, rewardTitle: "Açaí 500ml Grátis", rewardCode: "REWARD_500ML", rewardDescription: "1 Açaí de 500ml delicioso totalmente grátis!" },
        { level: 3, cupsRequired: 35, rewardTitle: "Açaí 700ml Grátis", rewardCode: "REWARD_700ML", rewardDescription: "1 Açaí de 700ml gigante de presente para você!" }
      ]
    }).then(() => {
      renderFidelityAdminTab();
      alert("✅ Trilha restaurada para os padrões!");
    });
  }
}

function renderCustomersTableAdmin() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  const customersMap = window.Store.getCustomersLocally();
  let customersList = Object.values(customersMap);

  const searchVal = (document.getElementById('search-customer-input')?.value || '').toLowerCase().trim();
  if (searchVal) {
    customersList = customersList.filter(c => 
      (c.name || '').toLowerCase().includes(searchVal) ||
      (c.phone || '').replace(/\D/g, '').includes(searchVal)
    );
  }

  const totalCustomers = Object.keys(customersMap).length;
  let totalCups = 0;
  let unlockedRewardsCount = 0;

  const fidelityCfg = window.Store.getFidelityConfig();
  const minCupsForLvl1 = (fidelityCfg.levels && fidelityCfg.levels.length > 0) ? fidelityCfg.levels[0].cupsRequired : 10;

  Object.values(customersMap).forEach(c => {
    const cups = parseInt(c.totalCups, 10) || 0;
    totalCups += cups;
    if (cups >= minCupsForLvl1) unlockedRewardsCount++;
  });

  if (document.getElementById('fidelity-admin-total-customers')) document.getElementById('fidelity-admin-total-customers').textContent = totalCustomers;
  if (document.getElementById('fidelity-admin-total-cups')) document.getElementById('fidelity-admin-total-cups').textContent = `${totalCups} 🍧`;
  if (document.getElementById('fidelity-admin-rewards-unlocked')) document.getElementById('fidelity-admin-rewards-unlocked').textContent = `${unlockedRewardsCount} 🎁`;

  if (customersList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-gray-400">
          <span class="text-3xl block mb-1">👥</span>
          <p class="font-bold text-gray-600">Nenhum cliente encontrado.</p>
          <p class="text-[11px] text-gray-400 mt-0.5">Assim que os clientes fizerem pedidos, o perfil e os copos aparecerão aqui automaticamente!</p>
        </td>
      </tr>
    `;
    return;
  }

  customersList.sort((a, b) => (b.totalCups || 0) - (a.totalCups || 0));

  tbody.innerHTML = customersList.map(c => {
    const cups = parseInt(c.totalCups, 10) || 0;
    const cleanPhone = window.Store.cleanPhoneKey(c.phone || c.phoneKey);
    const lastDate = c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('pt-BR') : 'Recente';

    let levelBadge = `<span class="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-bold text-[10px]">Iniciante (${cups} copos)</span>`;
    if (cups >= 35) {
      levelBadge = `<span class="bg-gold-500 text-acai-950 px-2.5 py-1 rounded-full font-black text-[10px] shadow-sm">🥇 Nível 3 (VIP)</span>`;
    } else if (cups >= 25) {
      levelBadge = `<span class="bg-purple-100 text-purple-900 px-2.5 py-1 rounded-full font-extrabold text-[10px]">🥈 Nível 2</span>`;
    } else if (cups >= 10) {
      levelBadge = `<span class="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full font-bold text-[10px]">🥉 Nível 1</span>`;
    }

    const whatsUrl = `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=Oi%20${encodeURIComponent(c.name || 'Cliente')}%21%20Tudo%20bem%3F%20Passando%20para%20lembrar%20que%20voc%C3%AA%20tem%20${cups}%20copo%28s%29%20acumulado%28s%29%20no%20nosso%20Programa%20de%20Fidelidade%20da%20Rotta%20do%20A%C3%A7a%C3%AD%21%20%F0%9F%8D%87`;

    return `
      <tr class="hover:bg-purple-50/50 transition">
        <td class="p-3">
          <div class="font-extrabold text-gray-900 text-xs">${c.name || 'Cliente'}</div>
          <div class="text-[11px] text-gray-500">${c.phone || cleanPhone}</div>
        </td>
        <td class="p-3">
          <span class="font-black text-sm text-acai-900">${cups}</span>
          <span class="text-[10px] text-amber-700 font-bold ml-1">copos 🍧</span>
        </td>
        <td class="p-3">
          ${levelBadge}
        </td>
        <td class="p-3 text-[11px] text-gray-500 font-medium">
          ${lastDate}
        </td>
        <td class="p-3 text-right space-x-1">
          <button onclick="editCustomerCups('${cleanPhone}', '${c.name || 'Cliente'}', ${cups})" class="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold rounded-lg text-xs transition" title="Editar Copos">
            ✏️ Editar Pontos
          </button>
          <a href="${whatsUrl}" target="_blank" class="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition inline-block">
            💬 WhatsApp
          </a>
        </td>
      </tr>
    `;
  }).join('');
}

function filterCustomersListAdmin() {
  renderCustomersTableAdmin();
}

function editCustomerCups(phone, name, currentCups) {
  const input = prompt(`Ajustar copos de açaí de "${name}":`, currentCups);
  if (input === null) return;

  const newTotal = parseInt(input, 10);
  if (isNaN(newTotal) || newTotal < 0) {
    alert("Por favor, informe um número válido de copos (0 ou mais).");
    return;
  }

  window.Store.updateCustomerPoints(phone, newTotal).then(() => {
    renderCustomersTableAdmin();
    alert(`✅ Pontuação de ${name} atualizada para ${newTotal} copos!`);
  }).catch(err => {
    alert("Erro ao atualizar pontos: " + err.message);
  });
}

window.renderFidelityAdminTab = renderFidelityAdminTab;
window.saveFidelityConfigFromAdmin = saveFidelityConfigFromAdmin;
window.addFidelityLevelInAdmin = addFidelityLevelInAdmin;
window.removeFidelityLevelInAdmin = removeFidelityLevelInAdmin;
window.resetFidelityConfigToDefault = resetFidelityConfigToDefault;
window.updateFidelityLevelField = updateFidelityLevelField;
window.filterCustomersListAdmin = filterCustomersListAdmin;
window.editCustomerCups = editCustomerCups;

// =============================================================================
// INSTALAÇÃO DO PWA / APP DO PAINEL DE GESTÃO
// =============================================================================
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  const nativeContainer = document.getElementById('pwa-native-install-container');
  if (nativeContainer) nativeContainer.classList.remove('hidden');
});

function openInstallAppModal() {
  const modal = document.getElementById('install-app-modal');
  if (modal) {
    modal.classList.remove('hidden');
    if (deferredInstallPrompt) {
      const nativeContainer = document.getElementById('pwa-native-install-container');
      if (nativeContainer) nativeContainer.classList.remove('hidden');
    }
  }
}

function closeInstallAppModal() {
  const modal = document.getElementById('install-app-modal');
  if (modal) modal.classList.add('hidden');
}

function triggerInstallApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('Usuário aceitou instalar o App de Gestão PWA');
      }
      deferredInstallPrompt = null;
      closeInstallAppModal();
    });
  } else {
    alert('Para instalar o app de gestão:\n\n• Android (Chrome): Toque nos 3 pontos ⠇ no topo do navegador e escolha "Instalar aplicativo" ou "Adicionar à tela inicial".\n\n• iPhone (Safari): Toque no botão de Compartilhar 📤 e escolha "Adicionar à Tela de Início".');
  }
}

window.toggleWakeLock = toggleWakeLock;
window.requestNotificationPermission = requestNotificationPermission;
window.openInstallAppModal = openInstallAppModal;
window.closeInstallAppModal = closeInstallAppModal;
window.triggerInstallApp = triggerInstallApp;

window.getSelectedCaixaDate = getSelectedCaixaDate;
window.handleCaixaDateChange = handleCaixaDateChange;
window.setCaixaDateToday = setCaixaDateToday;
window.promptEditDailyGoal = promptEditDailyGoal;
window.promptEditInitialCash = promptEditInitialCash;
window.openCashTransactionModal = openCashTransactionModal;
window.closeCashTransactionModal = closeCashTransactionModal;
window.handleSaveCashTransaction = handleSaveCashTransaction;



