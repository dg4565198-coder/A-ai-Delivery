/**
 * ROTTA DO AÇAÍ - APLICATIVO DO CLIENTE (CARDÁPIO DIGITAL & PWA)
 */

const state = {
  activeCategory: 'todos',
  cart: [],
  currentBuildingProduct: null,
  selectedBase: null,
  selectedFreeToppings: [],
  selectedFruits: [],
  selectedCalda: null,
  builderQuantity: 1,
  deliveryType: 'entrega',
  lastCreatedOrderId: null,
  deferredPWAInstall: null
};

function startApp() {
  try { window.Store.init(); } catch (e) { console.error('Store init:', e); }
  try { setupSplashScreen(); } catch (e) { console.error('Splash:', e); }
  try { renderStoreHeader(); } catch (e) { console.error('Header:', e); }
  try { renderFavorites(); } catch (e) { console.error('Favorites:', e); }
  try { loadSavedCustomerData(); } catch (e) { console.error('Customer data:', e); }
  try { renderProducts(); } catch (e) { console.error('Products:', e); }
  try { setupSyncListener(); } catch (e) { console.error('Sync:', e); }
  try { setupPWAInstaller(); } catch (e) { console.error('PWA:', e); }
  try { setupOrderNotificationListeners(); } catch (e) { console.error('Notifications:', e); }
  try { setupPromotionsListener(); } catch (e) { console.error('Promotions:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function setupSplashScreen() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  const dismiss = () => {
    splash.classList.add('hidden-splash');
    setTimeout(() => {
      splash.style.display = 'none';
    }, 400);
  };

  splash.addEventListener('click', dismiss);
  splash.addEventListener('touchstart', dismiss, { passive: true });
  setTimeout(dismiss, 1500);
}

function isInstagramOrInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /Instagram|FB_IAB|FBAV|FBAN|Musical_ly|TikTok/i.test(ua);
}

function setupPWAInstaller() {
  const btn = document.getElementById('pwa-install-btn');
  const banner = document.getElementById('inapp-browser-banner');

  if (isInstagramOrInAppBrowser()) {
    if (banner) banner.classList.remove('hidden');
    if (btn) btn.classList.remove('hidden');
    return;
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPWAInstall = e;
    if (btn) btn.classList.remove('hidden');
  });
}

function installPWA() {
  if (isInstagramOrInAppBrowser()) {
    alert("📸 VOCÊ ESTÁ NO INSTAGRAM!\n\nConforme mostra seu menu (nos 3 pontinhos no topo):\n\n1. Toque nos 3 pontinhos (⋮) no canto superior direito.\n2. Selecione a opção 'Abrir no Chrome' (ou 'Abrir no Safari').\n3. Pronto! O aplicativo poderá ser instalado normalmente na tela do seu celular!");
    return;
  }

  if (state.deferredPWAInstall) {
    state.deferredPWAInstall.prompt();
    state.deferredPWAInstall.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        const btn = document.getElementById('pwa-install-btn');
        if (btn) btn.classList.add('hidden');
      }
      state.deferredPWAInstall = null;
    });
  } else {
    alert("📲 Para instalar o App da Rotta do Açaí no celular:\n\n• No Android/Chrome: Toque no menu (3 pontinhos) do navegador e escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.\n\n• No iPhone/Safari: Toque no botão Compartilhar 📤 e escolha 'Adicionar à Tela de Início'.");
  }
}

function renderStoreHeader() {
  const config = window.Store.getConfig();
  const statusBadge = document.getElementById('store-status-badge');
  const deliveryTime = document.getElementById('header-delivery-time');
  const storeName = document.getElementById('header-store-name');
  const closedBanner = document.getElementById('store-closed-banner');
  const headerWhatsApp = document.getElementById('header-whatsapp-btn');

  if (storeName && config.name) {
    storeName.textContent = config.name;
  }

  if (statusBadge) {
    if (config.isOpen) {
      statusBadge.className = "inline-flex items-center px-3.5 py-1.5 rounded-2xl text-xs font-extrabold bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 shadow";
      statusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-emerald-400 mr-2 badge-pulse"></span> Loja Aberta`;
    } else {
      statusBadge.className = "inline-flex items-center px-3.5 py-1.5 rounded-2xl text-xs font-extrabold bg-rose-950/80 text-rose-300 border border-rose-500/60 shadow";
      statusBadge.innerHTML = `<span class="w-2.5 h-2.5 rounded-full bg-rose-400 mr-2"></span> Loja Fechada`;
    }
  }

  if (closedBanner) {
    if (config.isOpen) {
      closedBanner.classList.add('hidden');
    } else {
      closedBanner.classList.remove('hidden');
    }
  }

  if (deliveryTime && config.estimatedTime) {
    deliveryTime.textContent = `Entrega rápida • ${config.estimatedTime}`;
  }

  const todayText = getTodayBusinessHoursText(config);
  const hoursElem = document.getElementById('hours-text');
  if (hoursElem) {
    hoursElem.textContent = todayText;
  }

  const hoursMobileElem = document.getElementById('hours-text-mobile');
  if (hoursMobileElem) {
    hoursMobileElem.textContent = todayText;
  }

  const dockWhatsApp = document.getElementById('dock-whatsapp-btn');
  if (dockWhatsApp) {
    const cleanPhone = window.Store.formatWhatsAppPhone(config.phone);
    dockWhatsApp.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Olá! Gostaria de tirar dúvidas ou falar com a equipe da Rotta do Açaí.')}`;
  }

  if (headerWhatsApp) {
    const cleanPhone = window.Store.formatWhatsAppPhone(config.phone);
    headerWhatsApp.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent('Olá! Gostaria de tirar dúvidas ou saber mais sobre o cardápio da Rotta do Açaí.')}`;
  }
}

// ==========================================================================
// 2. RENDERIZAÇÃO DO CARDÁPIO & FILTROS
// ==========================================================================
function filterCategory(category) {
  state.activeCategory = category;

  document.querySelectorAll('.cat-btn').forEach(btn => {
    if (btn.dataset.cat === category) {
      btn.className = "cat-btn px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap bg-acai-700 text-white shadow-sm transition";
    } else {
      btn.className = "cat-btn px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-700 hover:bg-gray-200 transition";
    }
  });

  const titles = {
    todos: '🍧 Cardápio Completo',
    copos: '🍧 Copos Tradicionais de Açaí'
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

  const products = window.Store.getProducts().filter(p => p.available !== false);
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
    <div class="product-card bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
      ${prod.badge ? `<span class="absolute top-3 right-3 bg-gold-500 text-acai-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-sm">${prod.badge}</span>` : ''}
      
      <div class="flex items-start space-x-3.5">
        <div class="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
          ${prod.image ? `<img src="${prod.image}" class="w-full h-full object-cover">` : (prod.icon || '🍧')}
        </div>
        <div class="flex-1 pr-12">
          <h4 class="font-bold text-gray-900 text-base leading-snug">${prod.name}</h4>
          <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">${prod.description || ''}</p>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <div>
          <span class="text-[10px] text-gray-400 block uppercase font-bold">${prod.allowsCustomization ? 'A partir de' : 'Valor'}</span>
          <span class="text-base font-extrabold text-acai-900">${window.Store.formatCurrency(prod.price)}</span>
        </div>

        <button onclick="handleProductClick('${prod.id}')" class="bg-acai-700 hover:bg-acai-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition transform active:scale-95 flex items-center space-x-1.5">
          <span>${prod.allowsCustomization ? 'Montar' : 'Adicionar'}</span>
          <span class="text-gold-400 font-extrabold">+</span>
        </button>
      </div>
    </div>
  `).join('');
}

// ==========================================================================
// 3. MONTADOR DE AÇAÍ (MODAL CUSTOMIZADOR)
// ==========================================================================
function handleProductClick(productId) {
  const product = window.Store.getProducts().find(p => p.id === productId);
  if (!product || product.available === false) return;

  if (!product.allowsCustomization) {
    addItemDirectlyToCart(product);
    return;
  }

  state.currentBuildingProduct = product;
  state.selectedBase = null;
  state.selectedFreeToppings = [];
  state.selectedFruits = [];
  const caldas = window.Store.getCaldas();
  const defaultCalda = caldas.find(c => c.available !== false && c.id === 'calda-leite-cond') || caldas.find(c => c.available !== false) || { id: 'calda-leite-cond', name: 'Leite Condensado' };
  state.selectedCalda = defaultCalda;
  state.builderQuantity = 1;

  document.getElementById('builder-product-name').textContent = product.name;
  document.getElementById('builder-icon').innerHTML = product.image ? `<img src="${product.image}" class="w-full h-full object-cover rounded-xl">` : (product.icon || '🍧');
  document.getElementById('builder-base-price').textContent = window.Store.formatCurrency(product.price);
  document.getElementById('builder-notes').value = '';

  const qtyElem = document.getElementById('builder-quantity');
  if (qtyElem) qtyElem.textContent = '1';

  const fruitLimit = product.freeFruitLimit || 3;
  const fruitLimitLabel = document.getElementById('builder-fruit-limit-label');
  if (fruitLimitLabel) fruitLimitLabel.textContent = `Escolha até ${fruitLimit} opções`;

  const freeLimit = product.freeToppingLimit || 3;
  const freeLimitLabel = document.getElementById('builder-free-limit-label');
  if (freeLimitLabel) freeLimitLabel.textContent = `Escolha até ${freeLimit} opções`;

  renderBuilderFruits();
  renderBuilderFreeToppings();
  renderBuilderCaldas();
  updateBuilderTotal();

  const modal = document.getElementById('builder-modal');
  modal.classList.remove('hidden');
}

function closeBuilderModal() {
  document.getElementById('builder-modal').classList.add('hidden');
  state.currentBuildingProduct = null;
}

function renderBuilderFruits() {
  const container = document.getElementById('builder-fruits-list');
  if (!container) return;

  const fruits = window.Store.getFruits().filter(a => a.available !== false);
  const limit = state.currentBuildingProduct?.freeFruitLimit || 3;

  const counterElem = document.getElementById('builder-fruit-counter');
  if (counterElem) counterElem.textContent = `${state.selectedFruits.length} / ${limit}`;

  container.innerHTML = fruits.map(fruit => {
    const isSelected = state.selectedFruits.some(a => a.id === fruit.id);
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${isSelected ? 'border-emerald-500 bg-emerald-50/70 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleFruit('${fruit.id}')" class="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5">
          ${fruit.image ? `<img src="${fruit.image}" class="w-8 h-8 object-cover rounded-lg border border-purple-100 shadow-sm shrink-0">` : `<span class="text-base">${fruit.icon || '🍓'}</span>`}
          <span class="text-gray-800">${fruit.name}</span>
        </div>
      </label>
    `;
  }).join('');
}

function toggleFruit(fruitId) {
  const fruit = window.Store.getFruits().find(a => a.id === fruitId);
  if (!fruit) return;

  const limit = state.currentBuildingProduct?.freeFruitLimit || 3;
  const index = state.selectedFruits.findIndex(a => a.id === fruitId);

  if (index !== -1) {
    state.selectedFruits.splice(index, 1);
  } else {
    if (state.selectedFruits.length >= limit) {
      alert(`Você já atingiu o limite de ${limit} frutas para este tamanho. Desmarque uma para poder escolher outra!`);
      return;
    }
    state.selectedFruits.push(fruit);
  }

  renderBuilderFruits();
  updateBuilderTotal();
}

function renderBuilderFreeToppings() {
  const container = document.getElementById('builder-free-list');
  if (!container) return;

  const toppings = window.Store.getFreeToppings().filter(t => t.available !== false);
  const limit = state.currentBuildingProduct?.freeToppingLimit || 3;

  const counterElem = document.getElementById('builder-free-counter');
  if (counterElem) counterElem.textContent = `${state.selectedFreeToppings.length} / ${limit}`;

  container.innerHTML = toppings.map(top => {
    const isSelected = state.selectedFreeToppings.some(t => t.id === top.id);
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${isSelected ? 'border-emerald-600 bg-emerald-50/60 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleFreeTopping('${top.id}')" class="rounded text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5">
          ${top.image ? `<img src="${top.image}" class="w-8 h-8 object-cover rounded-lg border border-purple-100 shadow-sm shrink-0">` : `<span class="text-base">${top.icon || '🥣'}</span>`}
          <span class="text-gray-800">${top.name}</span>
        </div>
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
      alert(`Você já atingiu o limite de ${limit} complementos para este tamanho. Desmarque um para poder escolher outro!`);
      return;
    }
    state.selectedFreeToppings.push(topping);
  }

  renderBuilderFreeToppings();
}

function renderBuilderCaldas() {
  const container = document.getElementById('builder-calda-list');
  if (!container) return;

  const caldas = window.Store.getCaldas().filter(c => c.available !== false);
  const tagElem = document.getElementById('builder-calda-selected-tag');
  if (tagElem) {
    tagElem.textContent = state.selectedCalda ? state.selectedCalda.name : 'Sem Calda';
  }

  container.innerHTML = caldas.map(calda => {
    const isSelected = state.selectedCalda && state.selectedCalda.id === calda.id;
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs cursor-pointer ${isSelected ? 'border-amber-500 bg-amber-50/80 font-bold shadow-sm' : 'border-gray-200 bg-white'}" onclick="selectCalda('${calda.id}')">
        <div class="flex items-center space-x-2.5">
          <input type="radio" name="builder_calda_choice" ${isSelected ? 'checked' : ''} class="text-amber-600 focus:ring-amber-500 h-3.5 w-3.5">
          ${calda.image ? `<img src="${calda.image}" class="w-8 h-8 object-cover rounded-lg border border-purple-100 shadow-sm shrink-0">` : `<span class="text-base">${calda.icon || '🍯'}</span>`}
          <span class="text-gray-800">${calda.name}</span>
        </div>
      </label>
    `;
  }).join('');
}

function selectCalda(caldaId) {
  const calda = window.Store.getCaldas().find(c => c.id === caldaId);
  if (!calda) return;
  state.selectedCalda = calda;
  renderBuilderCaldas();
}

function changeBuilderQuantity(delta) {
  let newQty = (state.builderQuantity || 1) + delta;
  if (newQty < 1) newQty = 1;
  if (newQty > 5) {
    alert('Você pode adicionar no máximo 5 unidades por vez deste açaí.');
    newQty = 5;
  }
  state.builderQuantity = newQty;
  const qtyElem = document.getElementById('builder-quantity');
  if (qtyElem) qtyElem.textContent = newQty;
  updateBuilderTotal();
}

function updateBuilderTotal() {
  if (!state.currentBuildingProduct) return;

  let unitPrice = state.currentBuildingProduct.price;
  let total = unitPrice * (state.builderQuantity || 1);

  const priceElem = document.getElementById('builder-total-price');
  if (priceElem) {
    priceElem.textContent = window.Store.formatCurrency(total);
  }
}

function confirmAddItemToCart() {
  if (!state.currentBuildingProduct) return;

  let unitPrice = state.currentBuildingProduct.price;
  const notes = document.getElementById('builder-notes').value.trim();

  const cartItem = {
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    productId: state.currentBuildingProduct.id,
    name: state.currentBuildingProduct.name,
    icon: state.currentBuildingProduct.icon || '🍧',
    unitPrice,
    base: null,
    freeToppings: [...state.selectedFreeToppings],
    fruits: [...state.selectedFruits],
    calda: state.selectedCalda ? state.selectedCalda.name : 'Sem Calda',
    notes,
    quantity: state.builderQuantity || 1
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
    fruits: [],
    notes: '',
    quantity: 1
  };
  state.cart.push(cartItem);
  updateCartUI();
}

// ==========================================================================
// 4. CARRINHO & FORMAS DE PAGAMENTO (PIX, COMBINADO, DINHEIRO)
// ==========================================================================
function updateCartUI() {
  const cartBar = document.getElementById('floating-cart-bar');
  const cartCount = document.getElementById('cart-item-count');
  const cartTotal = document.getElementById('cart-bar-total');

  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

  if (cartCount) cartCount.textContent = totalItems;
  if (cartTotal) cartTotal.textContent = window.Store.formatCurrency(totalPrice);

  if (cartBar) {
    if (totalItems > 0) {
      cartBar.classList.remove('hidden');
    } else {
      cartBar.classList.add('hidden');
    }
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
  closeCartModal();
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

        ${item.calda ? `
          <p class="text-[10px] text-amber-800 font-bold mt-0.5">
            <strong>Calda:</strong> ${item.calda}
          </p>
        ` : ''}

        ${item.fruits && item.fruits.length > 0 ? `
          <p class="text-[10px] text-emerald-700 font-medium mt-0.5">
            <strong>Frutas:</strong> ${item.fruits.map(f => f.name).join(', ')}
          </p>
        ` : ''}

        ${item.freeToppings && item.freeToppings.length > 0 ? `
          <p class="text-[10px] text-gray-500 mt-0.5">
            <strong>Complementos:</strong> ${item.freeToppings.map(t => t.name).join(', ')}
          </p>
        ` : ''}

        ${item.notes ? `<p class="text-[10px] italic text-purple-600 mt-0.5">Obs: "${item.notes}"</p>` : ''}

        <div class="mt-2.5 flex items-center justify-between">
          <span class="text-xs font-bold text-acai-900">${window.Store.formatCurrency(item.unitPrice * item.quantity)}</span>
          
          <div class="flex items-center space-x-2 border border-purple-200 rounded-lg px-2 py-0.5 bg-white shadow-sm">
            <button onclick="changeCartItemQuantity(${idx}, -1)" class="text-acai-900 font-extrabold px-1.5 hover:bg-purple-100 rounded text-sm">&minus;</button>
            <span class="font-extrabold text-xs text-acai-900">${item.quantity}</span>
            <button onclick="changeCartItemQuantity(${idx}, 1)" class="text-acai-900 font-extrabold px-1.5 hover:bg-purple-100 rounded text-sm">&plus;</button>
          </div>
        </div>
      </div>

      <button onclick="removeCartItem(${idx})" class="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
      </button>
    </div>
  `).join('');

  updateCheckoutCalculations();
}

function changeCartItemQuantity(index, delta) {
  if (!state.cart[index]) return;
  let newQty = state.cart[index].quantity + delta;
  if (newQty <= 0) {
    removeCartItem(index);
    return;
  }
  if (newQty > 5) {
    alert('Limite máximo de 5 unidades por item atingido.');
    newQty = 5;
  }
  state.cart[index].quantity = newQty;
  updateCartUI();
  renderCartModalContent();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  updateCartUI();
  if (state.cart.length > 0) {
    renderCartModalContent();
  } else {
    closeCartModal();
  }
}

function updateCheckoutCalculations() {
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const grandTotal = subtotal;

  const subtotalElem = document.getElementById('checkout-subtotal');
  if (subtotalElem) subtotalElem.textContent = window.Store.formatCurrency(subtotal);

  const grandTotalElem = document.getElementById('checkout-grand-total');
  if (grandTotalElem) grandTotalElem.textContent = window.Store.formatCurrency(grandTotal);

  calculateCombinedPayment();
}

function togglePaymentMethod(method) {
  const lblPix = document.getElementById('lbl-pay-pix');
  const lblCombinado = document.getElementById('lbl-pay-combinado');
  const lblDinheiro = document.getElementById('lbl-pay-dinheiro');
  const combinadoFields = document.getElementById('combinado-fields-container');
  const changeFields = document.getElementById('change-field-container');

  lblPix.className = "payment-card cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition " +
    (method === 'pix' ? "border-acai-600 bg-purple-50/60" : "border-gray-200 bg-white");

  lblCombinado.className = "payment-card cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition " +
    (method === 'combinado' ? "border-acai-600 bg-purple-50/60" : "border-gray-200 bg-white");

  lblDinheiro.className = "payment-card cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition " +
    (method === 'dinheiro' ? "border-acai-600 bg-purple-50/60" : "border-gray-200 bg-white");

  if (method === 'combinado') {
    if (combinadoFields) combinadoFields.classList.remove('hidden');
    if (changeFields) changeFields.classList.add('hidden');
    calculateCombinedPayment();
  } else if (method === 'dinheiro') {
    if (changeFields) changeFields.classList.remove('hidden');
    if (combinadoFields) combinadoFields.classList.add('hidden');
  } else {
    if (changeFields) changeFields.classList.add('hidden');
    if (combinadoFields) combinadoFields.classList.add('hidden');
  }
}

function calculateCombinedPayment() {
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  const pixInput = document.getElementById('order-pix-amount');
  const remainingLabel = document.getElementById('order-cash-remaining-label');

  if (!pixInput || !remainingLabel) return;

  const pixVal = parseFloat(pixInput.value) || 0;
  const cashRemaining = Math.max(0, subtotal - pixVal);

  remainingLabel.textContent = window.Store.formatCurrency(cashRemaining);
}

function setDeliveryType(type) {
  state.deliveryType = type;
  const btnEntrega = document.getElementById('btn-type-entrega');
  const btnRetirada = document.getElementById('btn-type-retirada');
  const fields = document.getElementById('delivery-fields');
  const noticeBox = document.getElementById('pickup-notice-box');
  const titleElem = document.getElementById('address-box-title');

  if (type === 'entrega') {
    if (btnEntrega) btnEntrega.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-acai-700 text-white border-acai-700 shadow-sm";
    if (btnRetirada) btnRetirada.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-white text-gray-700 border-gray-200";
    if (fields) fields.classList.remove('hidden');
    if (noticeBox) noticeBox.classList.add('hidden');
    if (titleElem) titleElem.textContent = 'Endereço de Entrega';
  } else {
    if (btnRetirada) btnRetirada.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-acai-700 text-white border-acai-700 shadow-sm";
    if (btnEntrega) btnEntrega.className = "py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 border-2 transition bg-white text-gray-700 border-gray-200";
    if (fields) fields.classList.add('hidden');
    if (noticeBox) noticeBox.classList.remove('hidden');
    if (titleElem) titleElem.textContent = 'Opção de Retirada';
  }

  updateCheckoutCalculations();
}

function loadSavedCustomerData() {
  const customer = window.Store.getSavedCustomer();
  if (!customer) return;

  const nameInput = document.getElementById('order-customer-name');
  const phoneInput = document.getElementById('order-customer-phone');
  const addressInput = document.getElementById('order-address');

  if (nameInput && customer.name) nameInput.value = customer.name;
  if (phoneInput && customer.phone) phoneInput.value = customer.phone;
  if (addressInput) {
    const savedAddr = customer.street || customer.address || (typeof customer.address === 'string' ? customer.address : '');
    if (savedAddr) addressInput.value = savedAddr;
  }
}

function saveCustomerDataIfRequested(name, phone, address) {
  const checkbox = document.getElementById('save-customer-checkbox');
  if (checkbox && checkbox.checked) {
    const data = {
      name,
      phone,
      street: address?.street || address || ''
    };
    window.Store.saveCustomer(data);
  }
}

// ==========================================================================
// 5. ENVIO DO PEDIDO
// ==========================================================================
async function submitFinalOrder() {
  const config = window.Store.getConfig();
  if (config.isOpen === false) {
    alert('A loja está FECHADA no momento e não está aceitando novos pedidos.\n\nPor favor, aguarde a reabertura para enviar seu pedido.');
    return;
  }

  // Bloqueio de novos pedidos se houver pedido concluído não avaliado
  const pendingOrder = await checkPendingOrderRating();
  if (pendingOrder) {
    alert(`⭐ Por favor, avalie seu pedido anterior ${pendingOrder.orderNumber || '#'} antes de realizar um novo pedido!`);
    closeCartModal();
    openRatingModal(pendingOrder);
    return;
  }

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
    const addressInput = document.getElementById('order-address');
    const addressVal = addressInput ? addressInput.value.trim() : '';

    if (!addressVal) {
      alert('Por favor, informe onde deseja receber seu pedido (Ex: Minha casa, na esquina da padaria).');
      if (addressInput) addressInput.focus();
      return;
    }

    address = { street: addressVal };
  }

  saveCustomerDataIfRequested(name, phone, address);

  const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value || 'pix';
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);
  let pixAmount = 0;
  let cashAmount = 0;
  let paymentChange = null;

  if (paymentMethod === 'combinado') {
    pixAmount = parseFloat(document.getElementById('order-pix-amount').value) || 0;
    if (pixAmount <= 0 || pixAmount >= subtotal) {
      alert(`Para pagamento combinado, informe um valor válido no Pix (entre R$ 1,00 e ${window.Store.formatCurrency(subtotal - 1)}).`);
      document.getElementById('order-pix-amount').focus();
      return;
    }
    cashAmount = Math.max(0, subtotal - pixAmount);
    paymentChange = document.getElementById('order-combined-change').value.trim();
  } else if (paymentMethod === 'dinheiro') {
    cashAmount = subtotal;
    paymentChange = document.getElementById('order-change').value.trim();
  } else {
    pixAmount = subtotal;
  }

  const deliveryFee = 0;
  const total = subtotal;

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
      pixAmount,
      cashAmount,
      paymentChange,
      subtotal,
      deliveryFee,
      total
    });

    state.lastCreatedOrderId = newOrder.id;
    window.Store.addMyOrder(newOrder.id);
    setupOrderNotificationListeners();

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
  document.getElementById('confirmed-status-text').textContent = '🥣 Pedido aceito automaticamente! Já estamos preparando seu açaí fresquinho!';

  const pixBox = document.getElementById('pix-payment-box');
  const combinedNotice = document.getElementById('pix-combined-notice');

  if (order.paymentMethod === 'pix' || order.paymentMethod === 'combinado') {
    pixBox.classList.remove('hidden');
    document.getElementById('pix-copy-input').value = config.pixKey || '4b93bf67-9a91-4ffc-951c-ddd12184e042';

    if (order.paymentMethod === 'combinado') {
      combinedNotice.classList.remove('hidden');
      combinedNotice.innerHTML = `
        👉 <strong>Pagamento Combinado:</strong><br>
        • Pagar <strong class="text-emerald-700">${window.Store.formatCurrency(order.pixAmount)}</strong> no Pix agora.<br>
        • Restante de <strong class="text-purple-800">${window.Store.formatCurrency(order.cashAmount)}</strong> será pago em Dinheiro na entrega.
      `;
    } else {
      combinedNotice.classList.add('hidden');
    }
  } else {
    pixBox.classList.add('hidden');
  }

  const whatsappBtn = document.getElementById('btn-whatsapp-optional');
  const storeName = config.name || 'ROTTA DO AÇAÍ';

  let paymentText = order.paymentMethod.toUpperCase();
  if (order.paymentMethod === 'combinado') {
    paymentText = `COMBINADO (Pix: ${window.Store.formatCurrency(order.pixAmount)} + Dinheiro: ${window.Store.formatCurrency(order.cashAmount)})`;
  }

  let itemsText = (order.items || []).map(item => {
    let lines = [`• *${item.quantity}x ${item.name}* (${window.Store.formatCurrency(item.unitPrice * item.quantity)})`];
    if (item.calda) {
      lines.push(`  🍯 *Calda:* ${item.calda}`);
    }
    if (item.fruits && item.fruits.length > 0) {
      lines.push(`  🍓 *Frutas:* ${item.fruits.map(f => f.name).join(', ')}`);
    }
    if (item.freeToppings && item.freeToppings.length > 0) {
      lines.push(`  🥣 *Complementos:* ${item.freeToppings.map(t => t.name).join(', ')}`);
    }
    if (item.notes) {
      lines.push(`  📝 *Obs:* ${item.notes}`);
    }
    return lines.join('\n');
  }).join('\n\n');

  const textMsg = encodeURIComponent(
    `*NOVO PEDIDO ${order.orderNumber} - ${storeName.toUpperCase()}*\n\n` +
    `Olá! Acabei de enviar meu pedido pelo Cardápio Digital.\n\n` +
    `👤 *Cliente:* ${order.customer.name}\n` +
    `📱 *Telefone:* ${order.customer.phone}\n` +
    `🛵 *Tipo:* ${order.deliveryType === 'entrega' ? 'Entrega em Casa' : 'Retirada no Balcão'}\n` +
    (order.address ? `📍 *Endereço:* ${typeof order.address === 'string' ? order.address : (order.address.street + (order.address.number ? ', ' + order.address.number : '') + (order.address.neighborhood ? ' - ' + order.address.neighborhood : '') + (order.address.ref ? ' (' + order.address.ref + ')' : ''))}\n` : '') +
    `💳 *Pagamento:* ${paymentText}\n\n` +
    `📋 *ITENS DO PEDIDO:*\n${itemsText}\n\n` +
    `💰 *TOTAL DO PEDIDO:* ${window.Store.formatCurrency(order.total)}\n\n` +
    `Aguardando confirmação!`
  );

  const cleanPhone = window.Store.formatWhatsAppPhone(config.phone);
  whatsappBtn.href = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${textMsg}`;

  document.getElementById('success-modal').classList.remove('hidden');

  window.Store.listenToOrder(order.id, (updatedOrder) => {
    const statusMap = {
      novo: '🥣 Pedido aceito! Já estamos preparando seu açaí!',
      preparo: '🥣 Pedido aceito! Seu açaí está sendo montado com muito carinho!',
      entrega: order.deliveryType === 'entrega' ? '🛵 Seu açaí saiu para entrega! Fique atento!' : '🏬 Seu açaí está pronto para retirada no balcão!',
      concluido: '✅ Pedido entregue! Bom apetite com a Rotta do Açaí!',
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
    alert('✅ Chave Pix (Kevillyn Martins dos Santos) copiada com sucesso! Abra o app do seu banco e cole na opção Pix Copia e Cola.');
  }).catch(() => {
    alert('Chave Pix: ' + input.value);
  });
}

function closeSuccessModal() {
  document.getElementById('success-modal').classList.add('hidden');
}

function setupSyncListener() {
  window.Store.listenToConfig(config => {
    renderStoreHeader();
    updateCheckoutCalculations();
  });

  window.Store.listenToStock(() => {
    renderProducts();
    const builderModal = document.getElementById('builder-modal');
    if (builderModal && !builderModal.classList.contains('hidden') && state.currentBuildingProduct) {
      renderBuilderFruits();
      renderBuilderFreeToppings();
      renderBuilderCaldas();
    }
  });
}

// ==========================================================================
// 6. AÇAÍS FAVORITOS
// ==========================================================================
function saveCurrentBuildAsFavorite() {
  if (!state.currentBuildingProduct) return;

  const namePrompt = prompt("Dê um nome para o seu Açaí Favorito (ex: Meu Açaí Especial):", `${state.currentBuildingProduct.name} Especial`);
  if (!namePrompt) return;

  const favorite = {
    id: 'fav_' + Date.now(),
    customName: namePrompt.trim(),
    productId: state.currentBuildingProduct.id,
    productName: state.currentBuildingProduct.name,
    icon: state.currentBuildingProduct.icon || '🍧',
    unitPrice: state.currentBuildingProduct.price,
    freeToppings: [...state.selectedFreeToppings],
    fruits: [...state.selectedFruits],
    notes: document.getElementById('builder-notes').value.trim()
  };

  window.Store.saveFavorite(favorite);
  renderFavorites();
  alert(`⭐ "${favorite.customName}" foi salvo nos seus Açaís Favoritos!`);
}

function renderFavorites() {
  const container = document.getElementById('favorites-container');
  const list = document.getElementById('favorites-list');
  if (!container || !list) return;

  const favs = window.Store.getFavorites();
  if (!favs || favs.length === 0) {
    container.classList.add('hidden');
    return;
  }

  container.classList.remove('hidden');
  list.innerHTML = favs.map(fav => `
    <div class="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-xl flex flex-col justify-between space-y-2">
      <div class="flex items-start justify-between">
        <div>
          <div class="font-extrabold text-xs text-gold-300 flex items-center gap-1">
            <span>⭐</span> ${fav.customName}
          </div>
          <div class="text-[11px] text-purple-100 mt-0.5">
            ${fav.productName}
          </div>
          ${fav.fruits && fav.fruits.length > 0 ? `<div class="text-[10px] text-purple-200">🍓 ${fav.fruits.map(f => f.name).join(', ')}</div>` : ''}
          ${fav.freeToppings && fav.freeToppings.length > 0 ? `<div class="text-[10px] text-purple-200">🥣 ${fav.freeToppings.map(t => t.name).join(', ')}</div>` : ''}
        </div>
        <button onclick="deleteFavorite('${fav.id}')" class="text-rose-300 hover:text-rose-100 text-xs p-1" title="Excluir Favorito">&times;</button>
      </div>
      
      <div class="flex items-center justify-between pt-1 border-t border-white/10">
        <span class="text-xs font-bold text-white">${window.Store.formatCurrency(fav.unitPrice)}</span>
        <button onclick="addFavoriteToCart('${fav.id}')" class="bg-gold-500 hover:bg-gold-400 text-acai-950 font-black text-xs px-3 py-1.5 rounded-lg shadow transition transform active:scale-95 flex items-center gap-1">
          <span>🛒 Adicionar</span>
        </button>
      </div>
    </div>
  `).join('');
}

function addFavoriteToCart(favId) {
  const fav = window.Store.getFavorites().find(f => f.id === favId);
  if (!fav) return;

  const cartItem = {
    cartId: 'c_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    productId: fav.productId,
    name: `${fav.productName} (${fav.customName})`,
    icon: fav.icon || '🍧',
    unitPrice: fav.unitPrice,
    base: null,
    freeToppings: [...(fav.freeToppings || [])],
    fruits: [...(fav.fruits || [])],
    notes: fav.notes || '',
    quantity: 1
  };

  state.cart.push(cartItem);
  updateCartUI();
  alert(`🛒 "${fav.customName}" foi adicionado à sua sacola!`);
}

function deleteFavorite(favId) {
  if (confirm("Remover este açaí dos seus favoritos?")) {
    window.Store.removeFavorite(favId);
    renderFavorites();
  }
}

// ==========================================================================
// 7. NOTIFICAÇÕES EM TEMPO REAL & MEUS PEDIDOS
// ==========================================================================
const _notifiedStatuses = {};

// Global Audio & Notification setup for mobile
function unlockMobileAudioAndNotifications() {
  try {
    if (!window._sharedAudioCtx) {
      window._sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (window._sharedAudioCtx.state === 'suspended') {
      window._sharedAudioCtx.resume();
    }
  } catch {}

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

document.addEventListener('touchstart', unlockMobileAudioAndNotifications, { passive: true });
document.addEventListener('click', unlockMobileAudioAndNotifications, { passive: true });

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        showInAppToast('Rotta do Açaí 🍇', 'Notificações ativadas no seu celular com sucesso!');
      }
    }).catch(() => {});
  }
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
            tag: 'rotta-notif-' + Date.now(),
            renotify: true,
            data: { url: window.location.href }
          });
          return;
        }
      } catch (err) {
        console.warn('SW Notification error:', err);
      }
    }

    try {
      new Notification(title, {
        body: body,
        icon: 'assets/logo.jpg',
        badge: 'assets/logo.jpg'
      });
    } catch (e) {
      console.warn('Desktop Notification fallback error:', e);
    }
  }
}

function syncOrderTrackingToServiceWorker() {
  const myOrderIds = window.Store.getMyOrders();
  if (!myOrderIds || myOrderIds.length === 0) return;

  const rated = window.Store.getRatedOrdersLocally();
  const unratedIds = myOrderIds.filter(id => !rated.includes(id));
  if (unratedIds.length === 0) return;

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) {
        reg.active.postMessage({
          type: 'TRACK_ORDERS',
          orderIds: unratedIds
        });
      }
    }).catch(() => {});

    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'TRACK_ORDERS',
        orderIds: unratedIds
      });
    }
  }
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data && event.data.type === 'OPEN_MY_ORDERS') {
      openMyOrdersModal();
    }
  });
}

function setupOrderNotificationListeners() {
  requestNotificationPermission();
  syncOrderTrackingToServiceWorker();

  const myOrderIds = window.Store.getMyOrders();
  if (!myOrderIds || myOrderIds.length === 0) return;

  myOrderIds.forEach(orderId => {
    window.Store.listenToOrder(orderId, (order) => {
      if (!order || !order.status) return;

      const lastStatus = _notifiedStatuses[orderId];
      if (lastStatus && lastStatus !== order.status) {
        const messages = {
          preparo: `🥣 Seu Pedido ${order.orderNumber} está sendo preparado com muito carinho!`,
          entrega: order.deliveryType === 'entrega' 
            ? `🛵 Seu Pedido ${order.orderNumber} saiu para entrega! Fique atento(a)!`
            : `🏬 Seu Pedido ${order.orderNumber} está pronto para retirada no balcão!`,
          concluido: `✅ Pedido ${order.orderNumber} concluído! Por favor, avalie sua experiência!`,
          cancelado: `❌ Pedido ${order.orderNumber} foi cancelado pela loja.`
        };

        if (messages[order.status]) {
          sendPushNotification('Rotta do Açaí 🍇', messages[order.status]);
          try { window.Store.playNotificationSound(); } catch {}
        }

        if (order.status === 'concluido' && !order.rated && !window.Store.getRatedOrdersLocally().includes(orderId)) {
          setTimeout(() => { openRatingModal({ id: orderId, ...order }); }, 1000);
        }
      }
      _notifiedStatuses[orderId] = order.status;

      const modal = document.getElementById('my-orders-modal');
      if (modal && !modal.classList.contains('hidden')) {
        renderMyOrders();
      }
    });
  });
}

function openMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  if (modal) modal.classList.remove('hidden');
  renderMyOrders();
}

function closeMyOrdersModal() {
  const modal = document.getElementById('my-orders-modal');
  if (modal) modal.classList.add('hidden');
}

function renderMyOrders() {
  const container = document.getElementById('my-orders-list');
  if (!container) return;

  const orderIds = window.Store.getMyOrders();
  if (!orderIds || orderIds.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <span class="text-4xl block mb-2">📋</span>
        <p class="font-bold text-gray-700">Nenhum pedido realizado ainda.</p>
        <p class="text-xs text-gray-500 mt-1">Seus últimos pedidos aparecerão aqui para você acompanhar ao vivo!</p>
      </div>
    `;
    return;
  }

  const db = window.Store.getDB ? window.Store.getDB() : null;

  container.innerHTML = `<div class="text-center py-6 text-gray-500 text-xs">Carregando seus pedidos...</div>`;

  if (!db) {
    container.innerHTML = `<div class="text-center py-6 text-red-500 text-xs">Erro ao conectar com o servidor.</div>`;
    return;
  }

  const promises = orderIds.slice(0, 10).map(id => {
    return db.ref('orders/' + id).once('value').then(snap => snap.exists() ? { id: snap.key, ...snap.val() } : null);
  });

  Promise.all(promises).then(orders => {
    const validOrders = orders.filter(o => o !== null).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (validOrders.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <span class="text-4xl block mb-2">📋</span>
          <p class="font-bold text-gray-700">Nenhum pedido recente encontrado.</p>
        </div>
      `;
      return;
    }

    const statusBadges = {
      novo: '<span class="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span> Pedido Recebido</span>',
      preparo: '<span class="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Em Preparo</span>',
      entrega: '<span class="bg-purple-100 text-purple-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce"></span> Saiu / Pronto</span>',
      concluido: '<span class="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">✅ Concluído</span>',
      cancelado: '<span class="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">❌ Cancelado</span>'
    };

    const localRated = window.Store.getRatedOrdersLocally();

    container.innerHTML = validOrders.map(order => {
      const isUnratedConcluido = (order.status === 'concluido' && !order.rated && !localRated.includes(order.id));

      return `
      <div class="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-2">
          <div>
            <span class="font-black text-acai-900 text-base">${order.orderNumber || '#'}</span>
            <span class="text-[11px] text-gray-400 block">${order.createdAt ? new Date(order.createdAt).toLocaleString('pt-BR') : ''}</span>
          </div>
          <div>
            ${statusBadges[order.status] || statusBadges['novo']}
          </div>
        </div>

        <div class="space-y-1.5 text-xs">
          ${(order.items || []).map(i => `
            <div class="border-b border-gray-100 pb-1 text-xs last:border-0 last:pb-0">
              <div class="flex justify-between text-gray-800 font-bold">
                <span>${i.quantity}x ${i.name}</span>
                <span>${window.Store.formatCurrency(i.unitPrice * i.quantity)}</span>
              </div>
              ${i.calda ? `<div class="text-[10px] text-amber-800 font-semibold">🍯 Calda: ${i.calda}</div>` : ''}
              ${i.fruits && i.fruits.length > 0 ? `<div class="text-[10px] text-emerald-700">🍓 Frutas: ${i.fruits.map(f => f.name).join(', ')}</div>` : ''}
              ${i.freeToppings && i.freeToppings.length > 0 ? `<div class="text-[10px] text-gray-500">🥣 Complementos: ${i.freeToppings.map(t => t.name).join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-gray-100 text-xs font-extrabold">
          <span class="text-gray-600">Total do Pedido:</span>
          <span class="text-acai-900 text-sm">${window.Store.formatCurrency(order.total)}</span>
        </div>

        ${isUnratedConcluido ? `
          <button onclick="closeMyOrdersModal(); openRatingModal({ id: '${order.id}', orderNumber: '${order.orderNumber || '#'}' })" class="w-full mt-2 bg-gold-500 hover:bg-gold-400 text-acai-950 font-black py-2 rounded-xl text-xs shadow transition">
            ⭐ Avaliar este Pedido
          </button>
        ` : ''}
      </div>
    `;
    }).join('');
  }).catch(err => {
    console.error("Erro ao carregar Meus Pedidos:", err);
    container.innerHTML = `<div class="text-center py-6 text-red-500 text-xs">Erro ao carregar histórico de pedidos.</div>`;
  });
}

// ==========================================================================
// 8. PROMOÇÕES & NOTIFICAÇÕES INSTANTÂNEAS E AGENDADAS
// ==========================================================================
const _seenPromos = {};

function setupPromotionsListener() {
  window.Store.listenToPromotions(promo => {
    if (!promo || !promo.id || _seenPromos[promo.id]) return;
    _seenPromos[promo.id] = true;

    if (promo.scheduledTime) {
      const scheduledMs = new Date(promo.scheduledTime).getTime();
      const nowMs = Date.now();
      const delayMs = scheduledMs - nowMs;

      if (delayMs > 0) {
        setTimeout(() => {
          triggerPromoNotification(promo);
        }, delayMs);
        return;
      }
    }

    triggerPromoNotification(promo);
  });
}

function triggerPromoNotification(promo) {
  sendPushNotification(`📢 ${promo.title}`, promo.message);
  try { window.Store.playNotificationSound(); } catch {}

  const titleElem = document.getElementById('promo-modal-title');
  const msgElem = document.getElementById('promo-modal-message');
  const modal = document.getElementById('promo-modal');

  if (titleElem && msgElem && modal) {
    titleElem.textContent = promo.title;
    msgElem.textContent = promo.message;
    modal.classList.remove('hidden');
  }
}

function closePromoModal() {
  const modal = document.getElementById('promo-modal');
  if (modal) modal.classList.add('hidden');
}

// ==========================================================================
// AVALIAÇÕES E FEEDBACKS DOS CLIENTES
// ==========================================================================
let currentRatingStars = 5;

function setRatingStars(stars) {
  currentRatingStars = stars;
  const buttons = document.querySelectorAll('.star-btn');
  buttons.forEach(btn => {
    const s = parseInt(btn.getAttribute('data-star'));
    if (s <= stars) {
      btn.classList.remove('text-gray-300');
      btn.classList.add('text-amber-400');
    } else {
      btn.classList.remove('text-amber-400');
      btn.classList.add('text-gray-300');
    }
  });

  const banner = document.getElementById('rating-prompt-banner');
  const text = document.getElementById('rating-prompt-text');
  const textarea = document.getElementById('rating-comment-input');

  if (stars < 5) {
    if (banner) {
      banner.className = "p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold leading-relaxed flex items-start gap-2.5";
    }
    if (text) {
      text.textContent = "O que podemos melhorar no seu pedido? Conte para nós para aprimorarmos!";
    }
    if (textarea) {
      textarea.placeholder = "Diga-nos o que não saiu perfeito (ex: sabor, coberturas, tempo de entrega, embalagem)...";
    }
  } else {
    if (banner) {
      banner.className = "p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold leading-relaxed flex items-start gap-2.5";
    }
    if (text) {
      text.textContent = "🎉 Que ótimo! Conte-nos o que você mais gostou no seu pedido!";
    }
    if (textarea) {
      textarea.placeholder = "Escreva aqui o que você mais gostou no atendimento, sabor ou rapidez...";
    }
  }
}

async function checkPendingOrderRating() {
  const myOrderIds = window.Store.getMyOrders();
  if (!myOrderIds || myOrderIds.length === 0) return null;

  const localRated = window.Store.getRatedOrdersLocally();
  const unratedIds = myOrderIds.filter(id => !localRated.includes(id));
  if (unratedIds.length === 0) return null;

  const db = window.Store.getDB ? window.Store.getDB() : null;
  if (!db) return null;

  try {
    for (const orderId of unratedIds.slice(0, 5)) {
      const snap = await db.ref('orders/' + orderId).once('value');
      const orderData = snap.val();
      if (orderData && orderData.status === 'concluido' && !orderData.rated) {
        return { id: orderId, ...orderData };
      }
    }
  } catch (e) {}

  return null;
}

function openRatingModal(order) {
  if (!order) return;
  const modal = document.getElementById('rating-modal');
  if (!modal) return;

  const resolvedId = (typeof order === 'string') ? order : (order.id || order.key || '');
  const resolvedNumber = (typeof order === 'object' && order.orderNumber) ? order.orderNumber : '#';

  const targetId = document.getElementById('rating-target-order-id');
  const targetNum = document.getElementById('rating-target-order-number');
  const title = document.getElementById('rating-order-title');

  if (targetId) targetId.value = resolvedId;
  if (targetNum) targetNum.value = resolvedNumber;
  if (title) title.textContent = `Avalie seu Pedido ${resolvedNumber}`;
  
  const textarea = document.getElementById('rating-comment-input');
  if (textarea) textarea.value = '';

  setRatingStars(5);
  modal.classList.remove('hidden');
}

function submitRatingModal() {
  let orderId = document.getElementById('rating-target-order-id')?.value;
  let orderNumber = document.getElementById('rating-target-order-number')?.value;
  const comment = (document.getElementById('rating-comment-input')?.value || '').trim();
  const stars = currentRatingStars || 5;

  if (!orderId) {
    const myOrderIds = window.Store.getMyOrders();
    const localRated = window.Store.getRatedOrdersLocally();
    const unrated = myOrderIds.filter(id => !localRated.includes(id));
    if (unrated.length > 0) {
      orderId = unrated[0];
    } else if (myOrderIds.length > 0) {
      orderId = myOrderIds[0];
    } else {
      orderId = 'order_' + Date.now();
    }
  }

  // 1. Marca imediatamente como avaliado no localStorage para desbloquear o cliente
  window.Store.markOrderAsRatedLocally(orderId);

  // Cancela o rastreamento no Service Worker e remove a notificação da barra do celular
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(reg => {
      if (reg.active) {
        reg.active.postMessage({ type: 'STOP_TRACKING', orderId: orderId });
      }
      if (reg.getNotifications) {
        reg.getNotifications().then(notifications => {
          notifications.forEach(n => {
            if (n.data && n.data.orderId === orderId) n.close();
          });
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // 2. Fecha o modal imediatamente
  const modal = document.getElementById('rating-modal');
  if (modal) modal.classList.add('hidden');

  // 3. Exibe mensagem de agradecimento
  alert("✨ Muito obrigado pela sua avaliação! Sua opinião é super importante para a Rotta do Açaí!");

  // 4. Salva no Firebase e LocalStorage em segundo plano sem travar o modal
  const customerData = (window.Store.getSavedCustomer && window.Store.getSavedCustomer()) || (window.Store.getCustomerData && window.Store.getCustomerData()) || {};
  window.Store.saveRating({
    orderId: orderId,
    orderNumber: orderNumber || '#',
    customerName: customerData.name || 'Cliente',
    customerPhone: customerData.phone || '',
    stars: stars,
    comment: comment
  }).catch(err => {
    console.warn('Sincronização em segundo plano da avaliação:', err);
  });
}

function getTodayBusinessHoursText(config) {
  if (!config) return 'Terça a Domingo • 14:00 às 22:00';

  const dayKeys = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  const now = new Date();
  const dayIndex = now.getDay();
  const todayKey = dayKeys[dayIndex];
  const todayName = dayNames[dayIndex];

  if (config.weeklyHours && config.weeklyHours[todayKey]) {
    const todayData = config.weeklyHours[todayKey];
    if (!todayData.active || todayData.hours === 'Fechado') {
      return `Hoje (${todayName}) • Fechado`;
    }
    return `Hoje (${todayName}) • ${todayData.hours}`;
  }

  return config.businessHours || 'Terça a Domingo • 14:00 às 22:00';
}

function openWeeklyHoursModal() {
  const config = window.Store.getConfig();
  const listElem = document.getElementById('weekly-hours-modal-list');
  if (!listElem) return;

  const dayKeys = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  const dayLabels = {
    segunda: 'Segunda-feira',
    terca: 'Terça-feira',
    quarta: 'Quarta-feira',
    quinta: 'Quinta-feira',
    sexta: 'Sexta-feira',
    sabado: 'Sábado',
    domingo: 'Domingo'
  };

  const dayIndexToday = new Date().getDay();
  const todayKeyMap = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const currentTodayKey = todayKeyMap[dayIndexToday];

  const weekly = config.weeklyHours || {
    segunda: { active: false, hours: 'Fechado' },
    terca: { active: true, hours: '14:00 às 22:00' },
    quarta: { active: true, hours: '14:00 às 22:00' },
    quinta: { active: true, hours: '14:00 às 22:00' },
    sexta: { active: true, hours: '14:00 às 22:00' },
    sabado: { active: true, hours: '14:00 às 22:00' },
    domingo: { active: true, hours: '14:00 às 22:00' }
  };

  listElem.innerHTML = dayKeys.map(key => {
    const isToday = (key === currentTodayKey);
    const dayData = weekly[key] || { active: true, hours: '14:00 às 22:00' };
    const isOpenDay = dayData.active && dayData.hours !== 'Fechado';

    return `
      <div class="flex items-center justify-between p-2.5 rounded-xl transition ${isToday ? 'bg-purple-100 border border-acai-500/40 font-bold' : 'bg-gray-50 border border-gray-100'}">
        <div class="flex items-center space-x-2">
          <span>${isToday ? '⭐' : (isOpenDay ? '🟢' : '🔴')}</span>
          <span class="${isToday ? 'text-acai-900 font-extrabold' : 'text-gray-800'}">${dayLabels[key]}${isToday ? ' (Hoje)' : ''}</span>
        </div>
        <span class="${isOpenDay ? 'text-emerald-700 font-bold' : 'text-rose-600 font-semibold'}">
          ${isOpenDay ? dayData.hours : 'Fechado'}
        </span>
      </div>
    `;
  }).join('');

  const modal = document.getElementById('weekly-hours-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeWeeklyHoursModal() {
  const modal = document.getElementById('weekly-hours-modal');
  if (modal) modal.classList.add('hidden');
}

// Funções Globais
window.filterCategory = filterCategory;
window.handleProductClick = handleProductClick;
window.closeBuilderModal = closeBuilderModal;
window.toggleFruit = toggleFruit;
window.toggleFreeTopping = toggleFreeTopping;
window.confirmAddItemToCart = confirmAddItemToCart;
window.changeBuilderQuantity = changeBuilderQuantity;
window.changeCartItemQuantity = changeCartItemQuantity;
window.openCartModal = openCartModal;
window.closeCartModal = closeCartModal;
window.clearCart = clearCart;
window.removeCartItem = removeCartItem;
window.setDeliveryType = setDeliveryType;
window.togglePaymentMethod = togglePaymentMethod;
window.calculateCombinedPayment = calculateCombinedPayment;
window.submitFinalOrder = submitFinalOrder;
window.openWeeklyHoursModal = openWeeklyHoursModal;
window.closeWeeklyHoursModal = closeWeeklyHoursModal;
window.copyPixKey = copyPixKey;
window.closeSuccessModal = closeSuccessModal;
window.installPWA = installPWA;
window.saveCurrentBuildAsFavorite = saveCurrentBuildAsFavorite;
window.addFavoriteToCart = addFavoriteToCart;
window.deleteFavorite = deleteFavorite;
window.openMyOrdersModal = openMyOrdersModal;
window.closeMyOrdersModal = closeMyOrdersModal;
window.closePromoModal = closePromoModal;
window.setRatingStars = setRatingStars;
window.openRatingModal = openRatingModal;
window.submitRatingModal = submitRatingModal;
