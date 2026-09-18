/**
 * ROTTA DO AÇAÍ - APLICATIVO DO CLIENTE (CARDÁPIO DIGITAL)
 */

// Estado da Aplicação do Cliente
const state = {
  activeCategory: 'todos',
  cart: [],
  currentBuildingProduct: null,
  selectedBase: null,
  selectedFreeToppings: [],
  selectedPaidAddons: [],
  deliveryType: 'entrega', // 'entrega' | 'retirada'
  lastCreatedOrderId: null
};

// ==========================================================================
// 1. INICIALIZAÇÃO & SPLASH SCREEN
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  window.Store.init();
  setupSplashScreen();
  renderStoreHeader();
  renderProducts();
  setupSyncListener();
});

function setupSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Animação de entrada estilo iFood: 2.2 segundos para exibição e fade out suave
  setTimeout(() => {
    splash.classList.add('hidden-splash');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 800);
  }, 2200);
}

function renderStoreHeader() {
  const config = window.Store.getConfig();
  const statusBadge = document.getElementById('store-status-badge');
  const deliveryFee = document.getElementById('header-delivery-fee');

  if (statusBadge) {
    if (config.isOpen) {
      statusBadge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
      statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 badge-pulse"></span> Aberto`;
    } else {
      statusBadge.className = "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30";
      statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-400 mr-1.5"></span> Fechado`;
    }
  }

  if (deliveryFee) {
    deliveryFee.textContent = window.Store.formatCurrency(config.deliveryFee);
  }
}

// ==========================================================================
// 2. RENDERIZAÇÃO DO CARDÁPIO & FILTROS
// ==========================================================================
function filterCategory(category) {
  state.activeCategory = category;

  // Atualizar botões visuais
  document.querySelectorAll('.cat-btn').forEach(btn => {
    if (btn.dataset.cat === category) {
      btn.className = "cat-btn px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-acai-700 text-white shadow-sm transition";
    } else {
      btn.className = "cat-btn px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition";
    }
  });

  const titles = {
    todos: '🍧 Cardápio Completo',
    copos: '🍧 Copos Tradicionais de Açaí',
    especiais: '⛵ Barcas & Especiais da Casa',
    bebidas: '🥤 Bebidas & Refrescos'
  };

  const titleElem = document.getElementById('current-category-title');
  if (titleElem) {
    titleElem.innerHTML = titles[category] || 'Cardápio';
  }

  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const products = window.Store.getProducts();
  const filtered = state.activeCategory === 'todos' 
    ? products 
    : products.filter(p => p.category === state.activeCategory);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <span class="text-3xl block mb-2">🫐</span>
        Nenhum item disponível nesta categoria no momento.
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(prod => `
    <div class="product-card bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden ${!prod.available ? 'opacity-60 grayscale' : ''}">
      ${prod.badge ? `
        <span class="absolute top-3 right-3 bg-gold-500 text-acai-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">
          ${prod.badge}
        </span>
      ` : ''}

      <div class="flex items-start space-x-3.5">
        <div class="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-3xl shrink-0 shadow-inner">
          ${prod.icon || '🍧'}
        </div>
        <div class="flex-1 pr-12">
          <h4 class="font-bold text-gray-900 text-base leading-snug">${prod.name}</h4>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">${prod.description}</p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-[10px] text-gray-400 block uppercase font-bold">A partir de</span>
          <span class="text-base font-extrabold text-acai-900">${window.Store.formatCurrency(prod.price)}</span>
        </div>

        ${prod.available ? `
          <button onclick="handleProductClick('${prod.id}')" class="bg-acai-700 hover:bg-acai-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center space-x-1.5">
            <span>${prod.allowsCustomization ? 'Montar' : 'Adicionar'}</span>
            <span class="text-gold-400 font-extrabold">+</span>
          </button>
        ` : `
          <span class="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-xl">Esgotado</span>
        `}
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 3. MONTADOR DE AÇAÍ (MODAL DE PERSONALIZAÇÃO)
// ==========================================================================
function handleProductClick(productId) {
  const product = window.Store.getProducts().find(p => p.id === productId);
  if (!product || !product.available) return;

  if (!product.allowsCustomization) {
    addItemDirectlyToCart(product);
    return;
  }

  state.currentBuildingProduct = product;
  state.selectedBase = window.Store.getBases().find(b => b.available) || null;
  state.selectedFreeToppings = [];
  state.selectedPaidAddons = [];

  document.getElementById('builder-product-name').textContent = product.name;
  document.getElementById('builder-icon').textContent = product.icon || '🍧';
  document.getElementById('builder-base-price').textContent = window.Store.formatCurrency(product.price);
  document.getElementById('builder-notes').value = '';

  const freeLimit = product.freeToppingLimit || 3;
  document.getElementById('builder-free-limit-label').textContent = `Escolha até ${freeLimit} opções grátis`;

  renderBuilderBases();
  renderBuilderFreeToppings();
  renderBuilderPaidAddons();
  updateBuilderTotal();

  const modal = document.getElementById('builder-modal');
  modal.classList.remove('hidden');
}

function renderBuilderBases() {
  const container = document.getElementById('builder-bases-list');
  const bases = window.Store.getBases().filter(b => b.available);

  container.innerHTML = bases.map(base => `
    <label class="selectable-item flex items-center justify-between p-3 rounded-xl border-2 transition ${state.selectedBase?.id === base.id ? 'selected border-acai-600 bg-purple-50/70' : 'border-gray-200 bg-white hover:border-gray-300'}">
      <div class="flex items-center space-x-3">
        <input type="radio" name="builder-base" value="${base.id}" ${state.selectedBase?.id === base.id ? 'checked' : ''} onchange="selectBase('${base.id}')" class="text-acai-700 focus:ring-acai-600 h-4 w-4">
        <span class="font-medium text-gray-800 text-xs">${base.name}</span>
      </div>
      <span class="text-xs font-bold ${base.extraPrice > 0 ? 'text-acai-700' : 'text-emerald-600'}">
        ${base.extraPrice > 0 ? `+ ${window.Store.formatCurrency(base.extraPrice)}` : 'Incluso'}
      </span>
    </label>
  `).join('');
}

function selectBase(baseId) {
  const base = window.Store.getBases().find(b => b.id === baseId);
  if (base) {
    state.selectedBase = base;
    renderBuilderBases();
    updateBuilderTotal();
  }
}

function renderBuilderFreeToppings() {
  const container = document.getElementById('builder-free-list');
  const toppings = window.Store.getFreeToppings().filter(t => t.available);
  const limit = state.currentBuildingProduct?.freeToppingLimit || 3;

  document.getElementById('builder-free-counter').textContent = `${state.selectedFreeToppings.length} / ${limit}`;

  container.innerHTML = toppings.map(top => {
    const isSelected = state.selectedFreeToppings.some(t => t.id === top.id);
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${isSelected ? 'border-emerald-600 bg-emerald-50/60 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleFreeTopping('${top.id}')" class="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5">
          <span class="text-gray-800">${top.name}</span>
        </div>
        <span class="text-[11px] text-emerald-700 font-bold">Grátis</span>
      </label>
    `;
  }).join('');
}

function toggleFreeTopping(toppingId) {
  const topping = window.Store.getFreeToppings().find(t => t.id === toppingId);
  if (!topping) return;

  const limit = state.currentBuildingProduct?.freeToppingLimit || 3;
  const index = state.selectedFreeToppings.findIndex(t => t.id === toppingId);

  if (index !== -1) {
    state.selectedFreeToppings.splice(index, 1);
  } else {
    if (state.selectedFreeToppings.length >= limit) {
      alert(`Você já atingiu o limite de ${limit} acompanhamentos grátis para este tamanho. Você pode desmarcar um ou escolher adicionais gourmet abaixo!`);
      return;
    }
    state.selectedFreeToppings.push(topping);
  }

  renderBuilderFreeToppings();
}

function renderBuilderPaidAddons() {
  const container = document.getElementById('builder-paid-list');
  const addons = window.Store.getPaidAddons().filter(a => a.available);

  container.innerHTML = addons.map(addon => {
    const isSelected = state.selectedPaidAddons.some(a => a.id === addon.id);
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${isSelected ? 'border-amber-500 bg-amber-50/70 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="togglePaidAddon('${addon.id}')" class="rounded text-amber-600 focus:ring-amber-500 h-3.5 w-3.5">
          <span class="text-base">${addon.icon || '✨'}</span>
          <span class="text-gray-800">${addon.name}</span>
        </div>
        <span class="text-xs font-bold text-amber-700">+ ${window.Store.formatCurrency(addon.price)}</span>
      </label>
    `;
  }).join('');
}

function togglePaidAddon(addonId) {
  const addon = window.Store.getPaidAddons().find(a => a.id === addonId);
  if (!addon) return;

  const index = state.selectedPaidAddons.findIndex(a => a.id === addonId);
  if (index !== -1) {
    state.selectedPaidAddons.splice(index, 1);
  } else {
    state.selectedPaidAddons.push(addon);
  }

  renderBuilderPaidAddons();
  updateBuilderTotal();
}

function updateBuilderTotal() {
  if (!state.currentBuildingProduct) return;

  let total = state.currentBuildingProduct.price;
  if (state.selectedBase && state.selectedBase.extraPrice) {
    total += state.selectedBase.extraPrice;
  }
  state.selectedPaidAddons.forEach(a => {
    total += a.price;
  });

  const priceElem = document.getElementById('builder-total-price');
  if (priceElem) {
    priceElem.textContent = window.Store.formatCurrency(total);
  }
}

function closeBuilderModal() {
  const modal = document.getElementById('builder-modal');
  modal.classList.add('hidden');
  state.currentBuildingProduct = null;
}

function confirmAddItemToCart() {
  if (!state.currentBuildingProduct) return;

  let unitPrice = state.currentBuildingProduct.price;
  if (state.selectedBase?.extraPrice) unitPrice += state.selectedBase.extraPrice;
  state.selectedPaidAddons.forEach(a => unitPrice += a.price);

  const notes = document.getElementById('builder-notes').value.trim();

  const cartItem = {
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    productId: state.currentBuildingProduct.id,
    name: state.currentBuildingProduct.name,
    icon: state.currentBuildingProduct.icon || '🍧',
    unitPrice,
    base: state.selectedBase ? state.selectedBase.name : null,
    freeToppings: [...state.selectedFreeToppings],
    paidAddons: [...state.selectedPaidAddons],
    notes,
    quantity: 1
  };

  state.cart.push(cartItem);
  closeBuilderModal();
  updateCartUI();
}

function addItemDirectlyToCart(product) {
  const cartItem = {
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    productId: product.id,
    name: product.name,
    icon: product.icon || '🥤',
    unitPrice: product.price,
    base: null,
    freeToppings: [],
    paidAddons: [],
    notes: '',
    quantity: 1
  };
  state.cart.push(cartItem);
  updateCartUI();
}

// ==========================================================================
// 4. CARRINHO & SACOLA
// ==========================================================================
function updateCartUI() {
  const cartBar = document.getElementById('floating-cart-bar');
  const countBadge = document.getElementById('cart-item-count');
  const barTotal = document.getElementById('cart-bar-total');

  const totalItems = state.cart.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

  if (totalItems > 0) {
    cartBar.classList.remove('hidden');
    countBadge.textContent = totalItems;
    barTotal.textContent = window.Store.formatCurrency(subtotal);
  } else {
    cartBar.classList.add('hidden');
    closeCartModal();
  }
}

function openCartModal() {
  if (state.cart.length === 0) return;
  renderCartModalContent();
  document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.add('hidden');
}

function clearCart() {
  state.cart = [];
  updateCartUI();
}

function renderCartModalContent() {
  const container = document.getElementById('cart-items-list');

  container.innerHTML = state.cart.map((item, idx) => `
    <div class="bg-gray-50 p-3 rounded-2xl border border-gray-200 flex items-start justify-between gap-2">
      <div class="flex-1">
        <div class="flex items-center space-x-1.5">
          <span class="text-lg">${item.icon}</span>
          <h5 class="font-bold text-gray-900 text-xs">${item.name}</h5>
        </div>

        ${item.base ? `<p class="text-[11px] text-acai-700 font-semibold mt-1">Base: ${item.base}</p>` : ''}
        
        ${item.freeToppings.length > 0 ? `
          <p class="text-[10px] text-gray-500 mt-0.5">
            <strong>Grátis:</strong> ${item.freeToppings.map(t => t.name).join(', ')}
          </p>
        ` : ''}

        ${item.paidAddons.length > 0 ? `
          <p class="text-[10px] text-amber-700 font-medium mt-0.5">
            <strong>Extras:</strong> ${item.paidAddons.map(a => `${a.name} (+${window.Store.formatCurrency(a.price)})`).join(', ')}
          </p>
        ` : ''}

        ${item.notes ? `<p class="text-[10px] italic text-purple-600 mt-0.5">Obs: "${item.notes}"</p>` : ''}

        <div class="mt-2 text-xs font-bold text-acai-900">
          ${window.Store.formatCurrency(item.unitPrice * item.quantity)}
        </div>
      </div>

      <button onclick="removeCartItem(${idx})" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    </div>
  `).join('');

  updateCheckoutCalculations();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  updateCartUI();
  if (state.cart.length > 0) {
    renderCartModalContent();
  }
}

function updateCheckoutCalculations() {
  const config = window.Store.getConfig();
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const deliveryFee = state.deliveryType === 'entrega' ? config.deliveryFee : 0;
  const grandTotal = subtotal + deliveryFee;

  document.getElementById('checkout-subtotal').textContent = window.Store.formatCurrency(subtotal);
  document.getElementById('checkout-delivery-fee').textContent = window.Store.formatCurrency(deliveryFee);
  document.getElementById('checkout-grand-total').textContent = window.Store.formatCurrency(grandTotal);

  const feeRow = document.getElementById('checkout-fee-row');
  if (state.deliveryType === 'retirada') {
    feeRow.classList.add('hidden');
  } else {
    feeRow.classList.remove('hidden');
  }
}

function setDeliveryType(type) {
  state.deliveryType = type;
  const btnEntrega = document.getElementById('btn-type-entrega');
  const btnRetirada = document.getElementById('btn-type-retirada');
  const fields = document.getElementById('delivery-fields');

  if (type === 'entrega') {
    btnEntrega.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-acai-700 text-white border-acai-700 shadow-sm";
    btnRetirada.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-white text-gray-700 border-gray-200";
    fields.classList.remove('hidden');
  } else {
    btnRetirada.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-acai-700 text-white border-acai-700 shadow-sm";
    btnEntrega.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-white text-gray-700 border-gray-200";
    fields.classList.add('hidden');
  }

  updateCheckoutCalculations();
}

function togglePaymentChange(show) {
  const changeField = document.getElementById('change-field-container');
  if (show) {
    changeField.classList.remove('hidden');
  } else {
    changeField.classList.add('hidden');
  }
}

// ==========================================================================
// 5. ENVIO DO PEDIDO (DIRETO PARA O SISTEMA DA LOJA!)
// ==========================================================================
function submitFinalOrder() {
  const name = document.getElementById('order-customer-name').value.trim();
  const phone = document.getElementById('order-customer-phone').value.trim();

  if (!name) {
    alert('Por favor, informe o seu nome.');
    document.getElementById('order-customer-name').focus();
    return;
  }

  if (!phone) {
    alert('Por favor, informe seu telefone ou WhatsApp para contato.');
    document.getElementById('order-customer-phone').focus();
    return;
  }

  let address = null;
  if (state.deliveryType === 'entrega') {
    const street = document.getElementById('order-street').value.trim();
    const number = document.getElementById('order-number').value.trim();
    const neighborhood = document.getElementById('order-neighborhood').value.trim();
    const ref = document.getElementById('order-ref').value.trim();

    if (!street || !number || !neighborhood) {
      alert('Para entrega em casa, preencha o endereço completo (Rua, Número e Bairro).');
      return;
    }

    address = { street, number, neighborhood, ref };
  }

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'pix';
  const paymentChange = paymentMethod === 'dinheiro' ? document.getElementById('order-change').value.trim() : null;

  const config = window.Store.getConfig();
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const deliveryFee = state.deliveryType === 'entrega' ? config.deliveryFee : 0;
  const total = subtotal + deliveryFee;

  const btnSubmit = document.getElementById('btn-submit-order');
  btnSubmit.disabled = true;
  btnSubmit.innerHTML = `<span>⏳ Enviando pedido direto para a loja...</span>`;

  try {
    const newOrder = await window.Store.createOrder({
      customer: { name, phone },
      items: [...state.cart],
      deliveryType: state.deliveryType,
      address,
      paymentMethod,
      paymentChange,
      subtotal,
      deliveryFee,
      total
    });

    state.lastCreatedOrderId = newOrder.id;

    state.cart = [];
    updateCartUI();
    closeCartModal();

    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>🚀 Confirmar e Enviar Pedido</span>`;

    showSuccessOrderModal(newOrder);
  } catch (error) {
    console.error("Erro ao enviar pedido para o Firebase:", error);
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = `<span>🚀 Confirmar e Enviar Pedido</span>`;
    alert('Atenção: Não foi possível registrar o pedido no banco de dados da loja.\n\nMotivo: ' + (error.message || 'Permissão negada no Firebase.'));
  }
}

function showSuccessOrderModal(order) {
  const config = window.Store.getConfig();
  document.getElementById('confirmed-order-number').textContent = order.orderNumber;
  document.getElementById('confirmed-status-text').textContent = 'Pedido enviado direto para a loja! Aguardando aceite.';

  const pixBox = document.getElementById('pix-payment-box');
  if (order.paymentMethod === 'pix') {
    pixBox.classList.remove('hidden');
    document.getElementById('pix-copy-input').value = config.pixKey;
  } else {
    pixBox.classList.add('hidden');
  }

  const whatsappBtn = document.getElementById('btn-whatsapp-optional');
  const textMsg = encodeURIComponent(
    `*NOVO PEDIDO ${order.orderNumber} - ROTTA DO AÇAÍ*\n\n` +
    `Olá! Acabei de enviar meu pedido pelo Cardápio Digital.\n\n` +
    `👤 *Cliente:* ${order.customer.name}\n` +
    `📱 *Telefone:* ${order.customer.phone}\n` +
    `🛵 *Tipo:* ${order.deliveryType === 'entrega' ? 'Entrega em Casa' : 'Retirada no Balcão'}\n` +
    (order.address ? `📍 *Endereço:* ${order.address.street}, ${order.address.number} - ${order.address.neighborhood}\n` : '') +
    `💳 *Pagamento:* ${order.paymentMethod.toUpperCase()}\n` +
    `💰 *Total:* ${window.Store.formatCurrency(order.total)}\n\n` +
    `Aguardando confirmação!`
  );

  whatsappBtn.href = `https://api.whatsapp.com/send?phone=${config.phone}&text=${textMsg}`;

  document.getElementById('success-modal').classList.remove('hidden');

  // Rastreio em tempo real via Firebase - status do pedido atualiza automaticamente
  window.Store.listenToOrder(order.id, (updatedOrder) => {
    const statusMap = {
      novo: '⏳ Pedido recebido! Aguardando aceite da loja...',
      preparo: '🥣 Seu açaí está sendo montado com muito carinho!',
      entrega: '🛵 Seu açaí saiu para entrega! Fique atento à porta!',
      concluido: '🎉 Pedido entregue! Bom apetite com a Rotta do Açaí!',
      cancelado: '❌ Pedido cancelado pela loja. Entre em contato.'
    };
    const textElem = document.getElementById('confirmed-status-text');
    if (textElem && updatedOrder.status) {
      textElem.textContent = statusMap[updatedOrder.status] || 'Status atualizado!';
    }
  });
}

function copyPixKey() {
  const input = document.getElementById('pix-copy-input');
  input.select();
  navigator.clipboard.writeText(input.value).then(() => {
    alert('Chave Pix copiada para a área de transferência! Abra o app do seu banco e cole.');
  }).catch(() => {
    alert('Chave Pix: ' + input.value);
  });
}

function closeSuccessModal() {
  document.getElementById('success-modal').classList.add('hidden');
}

function setupSyncListener() {
  // O rastreio é feito pelo Firebase após o pedido ser criado
  // (veja showSuccessOrderModal -> window.Store.listenToOrder)
}

// Vincula funções globais
window.filterCategory = filterCategory;
window.handleProductClick = handleProductClick;
window.selectBase = selectBase;
window.toggleFreeTopping = toggleFreeTopping;
window.togglePaidAddon = togglePaidAddon;
window.closeBuilderModal = closeBuilderModal;
window.confirmAddItemToCart = confirmAddItemToCart;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.clearCart = clearCart;
window.removeCartItem = removeCartItem;
window.setDeliveryType = setDeliveryType;
window.togglePaymentChange = togglePaymentChange;
window.submitFinalOrder = submitFinalOrder;
window.copyPixKey = copyPixKey;
window.closeSuccessModal = closeSuccessModal;
