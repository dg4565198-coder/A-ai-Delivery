/**
 * ROTTA DO AÇAÍ - PAINEL DE GESTÃO DA LOJA (v2 - Firebase)
 */

let currentViewingOrder = null;
let _firstLoad = true;

const AUTH_SESSION_KEY = 'rotta_panel_session';
const CREDS_KEY = 'rotta_panel_creds';

function getPanelCredentials() {
  try {
    const creds = JSON.parse(localStorage.getItem(CREDS_KEY));
    if (creds && creds.user && creds.pass) return creds;
  } catch {}
  return { user: 'admin', pass: 'rotta123' };
}

function handlePanelLogin(e) {
  if (e) e.preventDefault();
  const userInput = document.getElementById('login-username').value.trim();
  const passInput = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');
  const creds = getPanelCredentials();

  if (userInput === creds.user && passInput === creds.pass) {
    sessionStorage.setItem(AUTH_SESSION_KEY, 'true');
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.add('hidden');
    if (errorMsg) errorMsg.classList.add('hidden');
    runPainelApp();
  } else {
    if (errorMsg) errorMsg.classList.remove('hidden');
  }
}

function handlePanelLogout() {
  if (confirm('Deseja realmente sair do Painel da Loja?')) {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    window.location.reload();
  }
}

function startPainel() {
  const isLogged = sessionStorage.getItem(AUTH_SESSION_KEY) === 'true';
  const modal = document.getElementById('login-modal');

  if (!isLogged) {
    if (modal) modal.classList.remove('hidden');
    return;
  }

  if (modal) modal.classList.add('hidden');
  runPainelApp();
}

function runPainelApp() {
  try { window.Store.init(); } catch (e) { console.error('Store init:', e); }
  try { updateStoreStatusButton(); } catch (e) { console.error('Status:', e); }
  try { renderStockManagement(); } catch (e) { console.error('Stock:', e); }
  try { renderFinancialMetrics(); } catch (e) { console.error('Metrics:', e); }
  try { loadConfigForm(); } catch (e) { console.error('Config:', e); }
  try { loadHoursTab(); } catch (e) { console.error('Hours:', e); }
  try { setupFirebaseListener(); } catch (e) { console.error('Firebase:', e); }
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
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(title, {
            body: body,
            icon: 'assets/logo.jpg',
            badge: 'assets/logo.jpg',
            vibrate: [200, 100, 200, 100, 200],
            tag: 'rotta-panel-' + Date.now(),
            renotify: true
          });
          return;
        }
      } catch (err) {
        console.warn('SW Panel Notification error:', err);
      }
    }

    try {
      new Notification(title, {
        body: body,
        icon: 'assets/logo.jpg',
        badge: 'assets/logo.jpg'
      });
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
  const tabs = ['kanban', 'estoque', 'horarios', 'promocoes', 'caixa', 'config', 'avaliacoes'];
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
  if (tabId === 'promocoes') renderPromotionsHistory();
  if (tabId === 'avaliacoes') renderRatingsTab();
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

  const headerHtml = `
    <div class="flex items-center justify-between border-b border-gray-100 pb-2">
      <div class="flex items-center space-x-2">
        <span class="font-black text-sm text-acai-900">${order.orderNumber}</span>
        <span class="text-[10px] text-gray-500 font-semibold bg-gray-100 px-2 py-0.5 rounded-full">${order.timeFormatted}</span>
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
        <span class="font-extrabold text-gray-900 truncate">${order.customer.name}</span>
        <a href="https://api.whatsapp.com/send?phone=55${order.customer.phone.replace(/\D/g, '')}" target="_blank" class="text-[11px] text-emerald-600 hover:underline font-bold">💬 WhatsApp</a>
      </div>
      ${order.address ? `<p class="text-[11px] text-gray-500 line-clamp-2">📍 ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}${order.address.ref ? ' (' + order.address.ref + ')' : ''}</p>` : '<p class="text-[11px] text-blue-600">Retirada no balcão</p>'}
    </div>`;

  const itemsHtml = `
    <div class="bg-gray-50 p-2 rounded-lg space-y-1.5 border border-gray-100 text-xs">
      ${order.items.map(item => `
        <div class="border-b border-gray-200/50 pb-1 last:border-0 last:pb-0">
          <div class="flex justify-between font-bold text-gray-800 text-[11px]">
            <span>${item.quantity}x ${item.name}</span>
            <span>${window.Store.formatCurrency(item.unitPrice * item.quantity)}</span>
          </div>
          ${item.calda ? `<div class="text-[9px] text-amber-800 font-bold">🍯 Calda: ${item.calda}</div>` : ''}
          ${item.fruits && item.fruits.length > 0 ? `<div class="text-[9px] text-emerald-700 font-semibold">🍓 Frutas: ${item.fruits.map(f => f.name).join(', ')}</div>` : ''}
          ${item.freeToppings && item.freeToppings.length > 0 ? `<div class="text-[9px] text-gray-600">✓ Complementos: ${item.freeToppings.map(t => t.name).join(', ')}</div>` : ''}
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

  let actionHtml = '';
  if (currentStatus === 'preparo') {
    actionHtml = `<div class="grid grid-cols-2 gap-2 pt-1">
      <button onclick="openReceiptModal('${order.id}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
      <button onclick="advanceOrderStatus('${order.id}', 'entrega')" class="text-xs bg-purple-600 hover:bg-purple-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>${order.deliveryType === 'entrega' ? '🛵 Despachar' : '🏬 Pronto'}</span></button>
    </div>`;
  } else if (currentStatus === 'entrega') {
    actionHtml = `<div class="grid grid-cols-2 gap-2 pt-1">
      <button onclick="openReceiptModal('${order.id}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
      <button onclick="advanceOrderStatus('${order.id}', 'concluido')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>✅ Concluir</span></button>
    </div>`;
  } else {
    actionHtml = `<div class="pt-1"><button onclick="openReceiptModal('${order.id}')" class="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1.5 rounded-lg transition">🖨️ Reemitir Comanda</button></div>`;
  }

  card.innerHTML = headerHtml + customerHtml + itemsHtml + paymentHtml + actionHtml;
  return card;
}

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

function renderFinancialMetrics() {
  const orders = window.Store.getOrdersArray().filter(o => o.status !== 'cancelado');
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCount = orders.length;
  const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  if (document.getElementById('metric-revenue-today')) document.getElementById('metric-revenue-today').textContent = window.Store.formatCurrency(totalRevenue);
  if (document.getElementById('metric-orders-count')) document.getElementById('metric-orders-count').textContent = totalCount;
  if (document.getElementById('metric-average-ticket')) document.getElementById('metric-average-ticket').textContent = window.Store.formatCurrency(avgTicket);

  const pix = orders.filter(o => o.paymentMethod === 'pix');
  const combined = orders.filter(o => o.paymentMethod === 'combinado');
  const cash = orders.filter(o => o.paymentMethod === 'dinheiro');

  if (document.getElementById('metric-pix-total')) document.getElementById('metric-pix-total').textContent = window.Store.formatCurrency(pix.reduce((s, o) => s + o.total, 0));
  if (document.getElementById('metric-pix-count')) document.getElementById('metric-pix-count').textContent = pix.length + ' ped';
  if (document.getElementById('metric-card-total')) document.getElementById('metric-card-total').textContent = window.Store.formatCurrency(combined.reduce((s, o) => s + o.total, 0));
  if (document.getElementById('metric-card-count')) document.getElementById('metric-card-count').textContent = combined.length + ' ped';
  if (document.getElementById('metric-cash-total')) document.getElementById('metric-cash-total').textContent = window.Store.formatCurrency(cash.reduce((s, o) => s + o.total, 0));
  if (document.getElementById('metric-cash-count')) document.getElementById('metric-cash-count').textContent = cash.length + ' ped';

  // Por tipo de entrega
  const delivery = orders.filter(o => o.deliveryType === 'entrega');
  const pickup = orders.filter(o => (o.deliveryType || 'retirada') === 'retirada');

  if (document.getElementById('metric-delivery-total')) document.getElementById('metric-delivery-total').textContent = window.Store.formatCurrency(delivery.reduce((s, o) => s + o.total, 0));
  if (document.getElementById('metric-delivery-count')) document.getElementById('metric-delivery-count').textContent = delivery.length + ' ped';
  if (document.getElementById('metric-pickup-total')) document.getElementById('metric-pickup-total').textContent = window.Store.formatCurrency(pickup.reduce((s, o) => s + o.total, 0));
  if (document.getElementById('metric-pickup-count')) document.getElementById('metric-pickup-count').textContent = pickup.length + ' ped';

  // Tabela de transações
  const tbody = document.getElementById('sales-table-body');
  if (tbody) {
    if (orders.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-gray-400 font-semibold text-center">Nenhum pedido registrado hoje.</td></tr>';
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

  // Renderizar gráfico
  try {
    renderSalesChart(orders, currentChartPeriod);
  } catch (err) {
    console.error("Erro ao renderizar gráfico de vendas:", err);
  }
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

  document.getElementById('cfg-phone').value = config.phone;

  window.Store.saveConfig(config);

  const newUser = document.getElementById('cfg-username')?.value.trim();
  const newPass = document.getElementById('cfg-password')?.value.trim();
  if (newUser && newPass) {
    localStorage.setItem(CREDS_KEY, JSON.stringify({ user: newUser, pass: newPass }));
  }

  alert('✅ Configurações salvas com sucesso!');
}

// ==========================================================================
// 10. HORÁRIOS DE FUNCIONAMENTO & PROMOÇÕES PUSH
// ==========================================================================
const DAYS_KEYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];

function loadHoursTab() {
  const config = window.Store.getConfig();
  const summaryInput = document.getElementById('cfg-hours-text');
  if (summaryInput) summaryInput.value = config.businessHours || 'Terça a Domingo • 14:00 às 22:00';

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
  alert("✅ Horários de funcionamento salvos com sucesso!");
}

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
window.toggleDayInput = toggleDayInput;
window.handleSaveBusinessHours = handleSaveBusinessHours;
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
