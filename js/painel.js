/**
 * ROTTA DO AÇAÍ - PAINEL DE GESTÃO DA LOJA (v2 - Firebase)
 * Pedidos chegam em tempo real de qualquer celular do mundo!
 */

let currentViewingOrder = null;
let _firstLoad = true; // controla se é o carregamento inicial (sem tocar alarme)

// ==========================================================================
// 1. INICIALIZAÇÃO
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  window.Store.init();
  updateStoreStatusButton();
  renderStockManagement();
  renderFinancialMetrics();
  loadConfigForm();

  // Inicia a escuta em tempo real do Firebase
  setupFirebaseListener();
});

// ==========================================================================
// 2. LISTENER FIREBASE - CORAÇÃO DO SISTEMA EM TEMPO REAL
// ==========================================================================
function setupFirebaseListener() {
  window.Store.listenToOrders(
    // Callback para novo pedido ou carregamento inicial
    function onNewOrder(order) {
      if (order === null) {
        // Carregamento inicial completo - renderiza sem alarme
        _firstLoad = false;
        renderKanbanBoard();
        renderFinancialMetrics();
        return;
      }

      // Pedido novo de verdade - toca alarme e atualiza o painel!
      if (!_firstLoad && order.status === 'novo') {
        window.Store.playNotificationSound();
        showNewOrderNotification(order);
      }

      renderKanbanBoard();
      renderFinancialMetrics();
    },

    // Callback para mudança de status de pedido existente
    function onOrderChanged(order) {
      renderKanbanBoard();
      renderFinancialMetrics();
    }
  );
}

function showNewOrderNotification(order) {
  // Badge numérico na aba
  const badge = document.getElementById('kanban-new-badge');
  const orders = window.Store.getOrdersArray();
  const novos = orders.filter(o => o.status === 'novo').length;
  if (badge && novos > 0) {
    badge.textContent = novos;
    badge.classList.remove('hidden');
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

  if (config.isOpen) {
    btn.className = "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow transition";
    text.textContent = "Loja Aberta";
  } else {
    btn.className = "flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow transition";
    text.textContent = "Loja Fechada";
  }
}

function testAudioAlert() {
  window.Store.playNotificationSound();
}

// ==========================================================================
// 4. NAVEGAÇÃO POR ABAS
// ==========================================================================
function switchTab(tabId) {
  const tabs = ['kanban', 'estoque', 'caixa', 'config'];
  tabs.forEach(t => {
    const content = document.getElementById('tab-content-' + t);
    const btn = document.getElementById('tab-btn-' + t);
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
}

// ==========================================================================
// 5. KANBAN DE PEDIDOS AO VIVO
// ==========================================================================
function renderKanbanBoard() {
  const orders = window.Store.getOrdersArray();

  const columns = {
    novo: document.getElementById('column-novo'),
    preparo: document.getElementById('column-preparo'),
    entrega: document.getElementById('column-entrega'),
    concluido: document.getElementById('column-concluido')
  };

  const counts = { novo: 0, preparo: 0, entrega: 0, concluido: 0 };

  Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

  orders.forEach(order => {
    const status = order.status || 'novo';
    if (counts[status] !== undefined) counts[status]++;
    const col = columns[status];
    if (col) col.appendChild(createOrderCardElement(order));
  });

  // Atualiza contadores
  document.getElementById('count-col-novo').textContent = counts.novo;
  document.getElementById('count-col-preparo').textContent = counts.preparo;
  document.getElementById('count-col-entrega').textContent = counts.entrega;
  document.getElementById('count-col-concluido').textContent = counts.concluido;

  // Badge aba
  const badge = document.getElementById('kanban-new-badge');
  if (counts.novo > 0) {
    badge.textContent = counts.novo;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }

  // Placeholders para colunas vazias
  Object.keys(columns).forEach(key => {
    if (counts[key] === 0 && columns[key]) {
      columns[key].innerHTML = `
        <div class="h-36 flex flex-col items-center justify-center text-center text-gray-400 text-xs p-4">
          <span class="text-2xl mb-1 opacity-50">📭</span>
          <span>Nenhum pedido aqui</span>
        </div>`;
    }
  });
}

function createOrderCardElement(order) {
  const card = document.createElement('div');
  const isNew = order.status === 'novo';

  card.className = `order-card bg-white p-3.5 rounded-xl border-2 transition shadow-sm space-y-3 ${
    isNew ? 'border-amber-400 new-order-alert bg-amber-50/20' : 'border-gray-200 hover:border-gray-300'
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
          ${item.base ? `<div class="text-[10px] text-acai-700 font-semibold">Base: ${item.base}</div>` : ''}
          ${item.freeToppings && item.freeToppings.length > 0 ? `<div class="text-[9px] text-gray-600">✓ ${item.freeToppings.map(t => t.name).join(', ')}</div>` : ''}
          ${item.paidAddons && item.paidAddons.length > 0 ? `<div class="text-[9px] text-amber-700 font-semibold">★ ${item.paidAddons.map(a => a.name).join(', ')}</div>` : ''}
          ${item.notes ? `<div class="text-[9px] italic text-purple-600 bg-purple-50 p-0.5 rounded mt-0.5">Obs: "${item.notes}"</div>` : ''}
        </div>`).join('')}
    </div>`;

  const paymentHtml = `
    <div class="flex items-center justify-between text-xs pt-1">
      <div>
        <span class="text-[10px] text-gray-400 block uppercase font-bold">Pagamento:</span>
        <span class="font-bold text-gray-700 uppercase">${order.paymentMethod}</span>
        ${order.paymentChange ? `<span class="text-[10px] text-gray-500 block">Troco p/: ${order.paymentChange}</span>` : ''}
      </div>
      <div class="text-right">
        <span class="text-[10px] text-gray-400 block uppercase font-bold">Total:</span>
        <span class="text-sm font-black text-acai-900">${window.Store.formatCurrency(order.total)}</span>
      </div>
    </div>`;

  let actionHtml = '';
  if (order.status === 'novo') {
    actionHtml = `<div class="grid grid-cols-2 gap-2 pt-1">
      <button onclick="openReceiptModal('${order.id}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
      <button onclick="advanceOrderStatus('${order.id}', 'preparo')" class="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>🥣</span><span>Aceitar</span></button>
    </div>`;
  } else if (order.status === 'preparo') {
    actionHtml = `<div class="grid grid-cols-2 gap-2 pt-1">
      <button onclick="openReceiptModal('${order.id}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
      <button onclick="advanceOrderStatus('${order.id}', 'entrega')" class="text-xs bg-purple-600 hover:bg-purple-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>🛵</span><span>Despachar</span></button>
    </div>`;
  } else if (order.status === 'entrega') {
    actionHtml = `<div class="grid grid-cols-2 gap-2 pt-1">
      <button onclick="openReceiptModal('${order.id}')" class="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-2 rounded-lg transition flex items-center justify-center space-x-1"><span>🖨️</span><span>Comanda</span></button>
      <button onclick="advanceOrderStatus('${order.id}', 'concluido')" class="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-2 rounded-lg shadow transition flex items-center justify-center space-x-1"><span>✅</span><span>Concluir</span></button>
    </div>`;
  } else {
    actionHtml = `<div class="pt-1"><button onclick="openReceiptModal('${order.id}')" class="w-full text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-1.5 rounded-lg transition">🖨️ Reemitir Comanda</button></div>`;
  }

  card.innerHTML = headerHtml + customerHtml + itemsHtml + paymentHtml + actionHtml;
  return card;
}

function advanceOrderStatus(orderId, newStatus) {
  window.Store.updateOrderStatus(orderId, newStatus);
  // O Firebase vai notificar o painel automaticamente via listener
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
          ${item.base ? `<div class="font-semibold ml-2">» Base: ${item.base}</div>` : ''}
          ${item.freeToppings && item.freeToppings.length > 0 ? `<div class="ml-2">» Grátis: ${item.freeToppings.map(t => t.name).join(' + ')}</div>` : ''}
          ${item.paidAddons && item.paidAddons.length > 0 ? `<div class="font-bold ml-2">★ Extras: ${item.paidAddons.map(a => a.name).join(' + ')}</div>` : ''}
          ${item.notes ? `<div class="italic ml-2 bg-yellow-50 p-0.5">OBS: "${item.notes}"</div>` : ''}
        </div>`).join('')}
    </div>
    <div class="pt-2 text-[11px] space-y-1">
      <div class="flex justify-between"><span>Subtotal:</span><span>${window.Store.formatCurrency(order.subtotal)}</span></div>
      ${order.deliveryFee > 0 ? `<div class="flex justify-between"><span>Taxa Entrega:</span><span>${window.Store.formatCurrency(order.deliveryFee)}</span></div>` : ''}
      <div class="flex justify-between font-black text-sm pt-1 border-t border-gray-400"><span>TOTAL:</span><span>${window.Store.formatCurrency(order.total)}</span></div>
      <div class="text-center font-bold uppercase mt-2 pt-1 border-t border-dashed border-gray-400">
        PAGAMENTO: ${order.paymentMethod}
        ${order.paymentChange ? `<br><span class="text-[10px]">Troco para: ${order.paymentChange}</span>` : ''}
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
}

function renderStockProducts() {
  const container = document.getElementById('stock-products-list');
  const products = window.Store.getProducts();
  container.innerHTML = products.map(prod => `
    <div class="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <span class="text-2xl">${prod.icon || '🍧'}</span>
        <div><h4 class="font-bold text-xs text-gray-800">${prod.name}</h4><span class="text-[11px] text-gray-500 font-semibold">${window.Store.formatCurrency(prod.price)}</span></div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" ${prod.available ? 'checked' : ''} onchange="toggleProductAvailability('${prod.id}')" class="sr-only peer">
        <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
      </label>
    </div>`).join('');
}

function toggleProductAvailability(id) {
  const products = window.Store.getProducts();
  const prod = products.find(p => p.id === id);
  if (prod) { prod.available = !prod.available; window.Store.saveProducts(products); renderStockProducts(); }
}

function renderStockAddons() {
  const container = document.getElementById('stock-addons-list');
  const addons = window.Store.getPaidAddons();
  container.innerHTML = addons.map(addon => `
    <div class="p-3 bg-amber-50/50 rounded-xl border border-amber-200 flex items-center justify-between">
      <div class="flex items-center space-x-2.5">
        <span class="text-xl">${addon.icon || '✨'}</span>
        <div><h4 class="font-bold text-xs text-gray-800">${addon.name}</h4><span class="text-[11px] text-amber-700 font-semibold">+ ${window.Store.formatCurrency(addon.price)}</span></div>
      </div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" ${addon.available ? 'checked' : ''} onchange="toggleAddonAvailability('${addon.id}')" class="sr-only peer">
        <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
      </label>
    </div>`).join('');
}

function toggleAddonAvailability(id) {
  const addons = window.Store.getPaidAddons();
  const addon = addons.find(a => a.id === id);
  if (addon) { addon.available = !addon.available; window.Store.savePaidAddons(addons); renderStockAddons(); }
}

function renderStockToppings() {
  const container = document.getElementById('stock-toppings-list');
  const toppings = window.Store.getFreeToppings();
  container.innerHTML = toppings.map(top => `
    <div class="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
      <div><h4 class="font-bold text-xs text-gray-800">${top.name}</h4><span class="text-[11px] text-emerald-700 font-semibold">Grátis</span></div>
      <label class="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" ${top.available ? 'checked' : ''} onchange="toggleToppingAvailability('${top.id}')" class="sr-only peer">
        <div class="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
      </label>
    </div>`).join('');
}

function toggleToppingAvailability(id) {
  const toppings = window.Store.getFreeToppings();
  const top = toppings.find(t => t.id === id);
  if (top) { top.available = !top.available; window.Store.saveFreeToppings(toppings); renderStockToppings(); }
}

// ==========================================================================
// 8. CAIXA & RELATÓRIOS DO DIA
// ==========================================================================
function renderFinancialMetrics() {
  const orders = window.Store.getOrdersArray().filter(o => o.status !== 'cancelado');
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalCount = orders.length;
  const avgTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

  document.getElementById('metric-revenue-today').textContent = window.Store.formatCurrency(totalRevenue);
  document.getElementById('metric-orders-count').textContent = totalCount;
  document.getElementById('metric-average-ticket').textContent = window.Store.formatCurrency(avgTicket);

  const pix = orders.filter(o => o.paymentMethod === 'pix');
  const card = orders.filter(o => o.paymentMethod === 'cartao');
  const cash = orders.filter(o => o.paymentMethod === 'dinheiro');

  document.getElementById('metric-pix-total').textContent = window.Store.formatCurrency(pix.reduce((s, o) => s + o.total, 0));
  document.getElementById('metric-pix-count').textContent = pix.length + ' ped';
  document.getElementById('metric-card-total').textContent = window.Store.formatCurrency(card.reduce((s, o) => s + o.total, 0));
  document.getElementById('metric-card-count').textContent = card.length + ' ped';
  document.getElementById('metric-cash-total').textContent = window.Store.formatCurrency(cash.reduce((s, o) => s + o.total, 0));
  document.getElementById('metric-cash-count').textContent = cash.length + ' ped';
}

// ==========================================================================
// 9. CONFIGURAÇÕES DA LOJA
// ==========================================================================
function loadConfigForm() {
  const config = window.Store.getConfig();
  document.getElementById('cfg-name').value = config.name || '';
  document.getElementById('cfg-phone').value = config.phone || '';
  document.getElementById('cfg-pix').value = config.pixKey || '';
  document.getElementById('cfg-delivery-fee').value = config.deliveryFee || 6.00;
  document.getElementById('cfg-time').value = config.estimatedTime || '';
  document.getElementById('cfg-address').value = config.address || '';
}

function saveStoreSettings(e) {
  e.preventDefault();
  const config = window.Store.getConfig();
  config.name = document.getElementById('cfg-name').value.trim();
  config.phone = document.getElementById('cfg-phone').value.trim();
  config.pixKey = document.getElementById('cfg-pix').value.trim();
  config.deliveryFee = parseFloat(document.getElementById('cfg-delivery-fee').value) || 0;
  config.estimatedTime = document.getElementById('cfg-time').value.trim();
  config.address = document.getElementById('cfg-address').value.trim();
  window.Store.saveConfig(config);
  alert('Configurações salvas com sucesso!');
}

// Vincula funções globais
window.toggleStoreOpenStatus = toggleStoreOpenStatus;
window.testAudioAlert = testAudioAlert;
window.switchTab = switchTab;
window.renderKanbanBoard = renderKanbanBoard;
window.advanceOrderStatus = advanceOrderStatus;
window.confirmClearOrders = confirmClearOrders;
window.openReceiptModal = openReceiptModal;
window.closeReceiptModal = closeReceiptModal;
window.toggleProductAvailability = toggleProductAvailability;
window.toggleAddonAvailability = toggleAddonAvailability;
window.toggleToppingAvailability = toggleToppingAvailability;
window.saveStoreSettings = saveStoreSettings;
