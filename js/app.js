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
  try { setupBroadcastNotificationListener(); } catch (e) { console.error('Broadcast:', e); }
  try { syncPromotionsFeedFromFirebase(); } catch (e) { console.error('Sync promos feed:', e); }
  try { updateProfileNotifBadge(); } catch (e) { console.error('Profile badge:', e); }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}

function setupSyncListener() {
  window.Store.listenToConfig(config => {
    try {
      if (window.Store.checkAndApplyAutoSchedule) {
        window.Store.checkAndApplyAutoSchedule(config);
      }
      renderStoreHeader();
    } catch (e) {}
  });

  setInterval(() => {
    try {
      if (window.Store.checkAndApplyAutoSchedule) {
        window.Store.checkAndApplyAutoSchedule();
      }
    } catch (e) {}
  }, 60000);

  window.Store.listenToStock(() => {
    try { renderProducts(); } catch (e) {}
  });

  // Listeners em TEMPO REAL para atualizações do Programa de Fidelidade (Níveis e Pontos)
  window.Store.listenToFidelityConfig(() => {
    try { renderFidelityModal(); } catch (e) {}
  });

  window.Store.listenToCustomers(() => {
    try { renderFidelityModal(); } catch (e) {}
  });
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

function getDeviceOS() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
    return 'ios';
  }
  if (/android/i.test(ua)) {
    return 'android';
  }
  return 'desktop';
}

function isInstagramOrInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /Instagram|FB_IAB|FBAV|FBAN|Musical_ly|TikTok/i.test(ua);
}

function setupPWAInstaller() {
  const btn = document.getElementById('pwa-install-btn');
  const banner = document.getElementById('inapp-browser-banner');
  const bannerText = document.getElementById('inapp-banner-text');
  const os = getDeviceOS();

  if (isInstagramOrInAppBrowser()) {
    if (banner) {
      if (bannerText) {
        if (os === 'ios') {
          bannerText.innerHTML = 'Você está no <strong>Instagram (iPhone)</strong>. Para baixar o App, toque nos <strong>3 pontinhos (...)</strong> no topo e escolha <strong>"Abrir no Safari"</strong>!';
        } else {
          bannerText.innerHTML = 'Você está no <strong>Instagram (Android)</strong>. Para baixar o App, toque nos <strong>3 pontinhos (⋮)</strong> no topo e escolha <strong>"Abrir no Chrome"</strong>!';
        }
      }
      banner.classList.remove('hidden');
    }
    if (btn) btn.classList.remove('hidden');
    return;
  }

  // No iPhone (Safari), exibir sempre o botão para orientar o cliente como instalar no iOS
  if (os === 'ios') {
    if (btn) btn.classList.remove('hidden');
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    state.deferredPWAInstall = e;
    if (btn) btn.classList.remove('hidden');
  });
}

function installPWA() {
  const os = getDeviceOS();

  if (isInstagramOrInAppBrowser()) {
    if (os === 'ios') {
      alert("📸 VOCÊ ESTÁ NO INSTAGRAM (iPhone)!\n\n1. Toque nos 3 pontinhos (...) no canto superior do Instagram.\n2. Selecione a opção 'Abrir no Safari'.\n3. No Safari, toque no botão Compartilhar 📤 (barra inferior) e selecione 'Adicionar à Tela de Início' ➕!");
    } else {
      alert("📸 VOCÊ ESTÁ NO INSTAGRAM (Android)!\n\n1. Toque nos 3 pontinhos (⋮) no canto superior direito do Instagram.\n2. Selecione a opção 'Abrir no Chrome'.\n3. No Chrome, o aplicativo poderá ser instalado diretamente!");
    }
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
  } else if (os === 'ios') {
    alert("🍏 COMO INSTALAR NO IPHONE (iOS):\n\n1. No navegador Safari, toque no botão Compartilhar 📤 (o quadradinho com a seta para cima na barra inferior).\n\n2. Role a lista de opções para baixo e toque em 'Adicionar à Tela de Início' ➕.\n\n3. Clique em 'Adicionar' no canto superior direito.\n\nPronto! O aplicativo da Rotta do Açaí será instalado na tela do seu iPhone!");
  } else {
    alert("📱 COMO INSTALAR NO ANDROID:\n\n1. Toque nos 3 pontinhos (⋮) no canto superior direito do navegador Chrome.\n\n2. Escolha 'Instalar aplicativo' ou 'Adicionar à tela inicial'.\n\n3. Confirme a instalação!");
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
    copos: '🍧 Copos Tradicionais de Açaí',
    adicionais: '🍫 Adicionais Pagos (Nutella, Cremes Extra...)',
    complementos: '🥣 Cremes & Complementos do Açaí',
    caldas: '🍯 Coberturas & Caldas'
  };

  const titleElem = document.getElementById('current-category-title');
  if (titleElem) {
    titleElem.innerHTML = titles[category] || 'Cardápio';
  }

  renderProducts();
}

function openFirstCustomizableProductModal() {
  const products = window.Store.getProducts().filter(p => p.available !== false && p.allowsCustomization);
  if (products.length > 0) {
    handleProductClick(products[0].id);
  } else {
    const anyProd = window.Store.getProducts().find(p => p.available !== false);
    if (anyProd) handleProductClick(anyProd.id);
  }
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const activeCat = state.activeCategory || 'todos';

  if (activeCat === 'adicionais') {
    const addons = window.Store.getPaidAddons().filter(a => a.available !== false);
    if (addons.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400"><span class="text-3xl block mb-2">🍫</span>Nenhum adicional pago cadastrado no momento.</div>`;
      return;
    }
    grid.innerHTML = addons.map(addon => `
      <div class="product-card bg-white rounded-2xl p-4 border border-rose-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <span class="absolute top-3 right-3 bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-rose-200 shadow-sm">
          🍫 Adicional Pago
        </span>
        <div class="flex items-start space-x-3.5">
          <div class="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
            ${addon.image ? `<img src="${addon.image}" class="w-full h-full object-cover">` : (addon.icon || '🍫')}
          </div>
          <div class="flex-1 pr-12">
            <h4 class="font-bold text-gray-900 text-base leading-snug">${addon.name}</h4>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">Adicional extra para turbine seu açaí no copo.</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-gray-400 block uppercase font-bold">Valor Extra</span>
            <span class="text-base font-extrabold text-rose-800">+ ${window.Store.formatCurrency(addon.price || 0)}</span>
          </div>
          <button onclick="openFirstCustomizableProductModal()" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center space-x-1 active:scale-95">
            <span>Pedir no Copo</span>
            <span class="font-bold text-gold-300">+</span>
          </button>
        </div>
      </div>
    `).join('');
    return;
  }

  if (activeCat === 'complementos') {
    const toppings = window.Store.getFreeToppings().filter(t => t.available !== false);
    if (toppings.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400"><span class="text-3xl block mb-2">🥣</span>Nenhum complemento cadastrado no momento.</div>`;
      return;
    }
    grid.innerHTML = toppings.map(top => `
      <div class="product-card bg-white rounded-2xl p-4 border border-purple-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <span class="absolute top-3 right-3 bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-purple-200 shadow-sm">
          🥣 Creme / Complemento
        </span>
        <div class="flex items-start space-x-3.5">
          <div class="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
            ${top.image ? `<img src="${top.image}" class="w-full h-full object-cover">` : (top.icon || '🥣')}
          </div>
          <div class="flex-1 pr-12">
            <h4 class="font-bold text-gray-900 text-base leading-snug">${top.name}</h4>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">Opção de complemento incluso na montagem do seu copo.</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-purple-800 block uppercase font-bold">Incluso no Copo</span>
            <span class="text-xs font-black text-purple-900">Grátis na montagem</span>
          </div>
          <button onclick="openFirstCustomizableProductModal()" class="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center space-x-1 active:scale-95">
            <span>Escolher no Copo</span>
            <span class="font-bold text-gold-300">+</span>
          </button>
        </div>
      </div>
    `).join('');
    return;
  }

  if (activeCat === 'caldas') {
    const caldas = window.Store.getCaldas().filter(c => c.available !== false);
    if (caldas.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400"><span class="text-3xl block mb-2">🍯</span>Nenhuma calda cadastrada no momento.</div>`;
      return;
    }
    grid.innerHTML = caldas.map(calda => `
      <div class="product-card bg-white rounded-2xl p-4 border border-amber-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
        <span class="absolute top-3 right-3 bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-amber-200 shadow-sm">
          🍯 Cobertura / Calda
        </span>
        <div class="flex items-start space-x-3.5">
          <div class="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
            ${calda.image ? `<img src="${calda.image}" class="w-full h-full object-cover">` : (calda.icon || '🍯')}
          </div>
          <div class="flex-1 pr-12">
            <h4 class="font-bold text-gray-900 text-base leading-snug">${calda.name}</h4>
            <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">Opção de calda inclusa para finalizar seu copo.</p>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span class="text-[10px] text-amber-800 block uppercase font-bold">Incluso no Copo</span>
            <span class="text-xs font-black text-amber-900">Grátis na montagem</span>
          </div>
          <button onclick="openFirstCustomizableProductModal()" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow transition flex items-center space-x-1 active:scale-95">
            <span>Escolher no Copo</span>
            <span class="font-bold text-gold-300">+</span>
          </button>
        </div>
      </div>
    `).join('');
    return;
  }

  const products = window.Store.getProducts().filter(p => p.available !== false);
  const filtered = activeCat === 'todos' 
    ? products 
    : products.filter(p => p.category === activeCat);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-12 text-center text-gray-400">
        <span class="text-3xl block mb-2">🫐</span>
        Nenhum item disponível nesta categoria no momento.
      </div>
    `;
    return;
  }

  let html = filtered.map(prod => `
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

  if (activeCat === 'todos') {
    const paidAddons = window.Store.getPaidAddons().filter(a => a.available !== false);
    if (paidAddons.length > 0) {
      html += `
        <div class="col-span-full pt-6 mt-4 border-t border-gray-200">
          <h3 class="text-base font-extrabold text-acai-900 mb-3 flex items-center gap-2">
            <span>🍫</span> Adicionais Pagos (Nutella, Cremes Extra...)
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${paidAddons.map(addon => `
              <div class="product-card bg-white rounded-2xl p-4 border border-rose-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
                <span class="absolute top-3 right-3 bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border border-rose-200 shadow-sm">
                  🍫 Adicional Pago
                </span>
                <div class="flex items-start space-x-3.5">
                  <div class="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl shrink-0 shadow-inner overflow-hidden">
                    ${addon.image ? `<img src="${addon.image}" class="w-full h-full object-cover">` : (addon.icon || '🍫')}
                  </div>
                  <div class="flex-1 pr-12">
                    <h4 class="font-bold text-gray-900 text-base leading-snug">${addon.name}</h4>
                    <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">Adicional extra para turbine seu açaí no copo.</p>
                  </div>
                </div>
                <div class="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-gray-400 block uppercase font-bold">Valor Extra</span>
                    <span class="text-base font-extrabold text-rose-800">+ ${window.Store.formatCurrency(addon.price || 0)}</span>
                  </div>
                  <button onclick="openFirstCustomizableProductModal()" class="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition flex items-center space-x-1 active:scale-95">
                    <span>Pedir no Copo</span>
                    <span class="font-bold text-gold-300">+</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
  }

  grid.innerHTML = html;
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
  state.selectedPaidAddons = [];
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
  renderBuilderPaidAddons();
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
          ${fruit.image ? `<img src="${fruit.image}" class="w-12 h-12 object-cover rounded-xl border border-emerald-200 shadow-sm shrink-0">` : `<span class="w-12 h-12 text-xl rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">${fruit.icon || '🍓'}</span>`}
          <span class="text-gray-800 font-bold">${fruit.name}</span>
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
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs ${isSelected ? 'border-purple-600 bg-purple-50/60 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleFreeTopping('${top.id}')" class="rounded text-purple-600 focus:ring-purple-500 h-3.5 w-3.5">
          ${top.image ? `<img src="${top.image}" class="w-12 h-12 object-cover rounded-xl border border-purple-200 shadow-sm shrink-0">` : `<span class="w-12 h-12 text-xl rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">${top.icon || '🥣'}</span>`}
          <span class="text-gray-800 font-bold">${top.name}</span>
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
          ${calda.image ? `<img src="${calda.image}" class="w-12 h-12 object-cover rounded-xl border border-amber-200 shadow-sm shrink-0">` : `<span class="w-12 h-12 text-xl rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">${calda.icon || '🍯'}</span>`}
          <span class="text-gray-800 font-bold">${calda.name}</span>
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

function renderBuilderPaidAddons() {
  const container = document.getElementById('builder-paid-addons-list');
  if (!container) return;

  const addons = window.Store.getPaidAddons().filter(a => a.available !== false);

  const counterElem = document.getElementById('builder-paid-counter');
  if (counterElem) counterElem.textContent = `${(state.selectedPaidAddons || []).length} selecionados`;

  if (addons.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 col-span-full">Nenhum adicional pago cadastrado no momento.</p>`;
    return;
  }

  container.innerHTML = addons.map(addon => {
    const isSelected = (state.selectedPaidAddons || []).some(a => a.id === addon.id);
    const priceFormatted = window.Store.formatCurrency(addon.price || 0);
    return `
      <label class="selectable-item flex items-center justify-between p-2.5 rounded-xl border transition text-xs cursor-pointer ${isSelected ? 'border-rose-500 bg-rose-50/70 font-semibold' : 'border-gray-200 bg-white'}">
        <div class="flex items-center space-x-2.5">
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="togglePaidAddon('${addon.id}')" class="rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5">
          ${addon.image ? `<img src="${addon.image}" class="w-12 h-12 object-cover rounded-xl border border-rose-200 shadow-sm shrink-0">` : `<span class="w-12 h-12 text-xl rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">${addon.icon || '🍫'}</span>`}
          <div class="flex flex-col">
            <span class="text-gray-800 font-bold">${addon.name}</span>
            <span class="text-[11px] text-rose-700 font-extrabold">+ ${priceFormatted}</span>
          </div>
        </div>
      </label>
    `;
  }).join('');
}

function togglePaidAddon(addonId) {
  const addon = window.Store.getPaidAddons().find(a => a.id === addonId);
  if (!addon) return;

  if (!Array.isArray(state.selectedPaidAddons)) state.selectedPaidAddons = [];
  const index = state.selectedPaidAddons.findIndex(a => a.id === addonId);
  if (index !== -1) {
    state.selectedPaidAddons.splice(index, 1);
  } else {
    state.selectedPaidAddons.push(addon);
  }

  renderBuilderPaidAddons();
  updateBuilderTotal();
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
  if (Array.isArray(state.selectedPaidAddons)) {
    const extraPrice = state.selectedPaidAddons.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
    unitPrice += extraPrice;
  }
  let total = unitPrice * (state.builderQuantity || 1);

  const priceElem = document.getElementById('builder-total-price');
  if (priceElem) {
    priceElem.textContent = window.Store.formatCurrency(total);
  }
}

function confirmAddItemToCart() {
  if (!state.currentBuildingProduct) return;

  let unitPrice = state.currentBuildingProduct.price;
  const paidAddons = [...(state.selectedPaidAddons || [])];
  const extraPrice = paidAddons.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  unitPrice += extraPrice;
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
    paidAddons,
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

        ${item.paidAddons && item.paidAddons.length > 0 ? `
          <p class="text-[10px] text-rose-700 font-bold mt-0.5">
            <strong>Adicionais Pagos:</strong> ${item.paidAddons.map(a => `${a.name || a} (+${window.Store.formatCurrency(a.price || 0)})`).join(', ')}
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
    try {
      localStorage.setItem('rotta_customer_data', JSON.stringify({ name, phone }));
      window.Store.saveCustomerFidelity(phone, { name, phone });
    } catch (e) {}
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

function renderProgressBarHTML(status, deliveryType = 'entrega') {
  if (status === 'cancelado') {
    return `
      <div class="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs space-y-1">
        <div class="font-extrabold text-rose-800 flex items-center space-x-1">
          <span>❌</span><span>Pedido Cancelado pela Loja</span>
        </div>
      </div>
    `;
  }

  let progressWidth = '33%';
  let stage1Class = 'text-purple-900 bg-purple-200 border-purple-300 font-extrabold shadow-xs';
  let stage2Class = 'text-gray-400 bg-gray-100 border-gray-200';
  let stage3Class = 'text-gray-400 bg-gray-100 border-gray-200';
  let statusText = '⏱️ Estimado: 15 a 20 min • Seu pedido está sendo preparado com carinho!';
  let barGradient = 'from-purple-600 to-purple-500';

  if (status === 'entrega') {
    progressWidth = '66%';
    stage1Class = 'text-purple-900 bg-purple-100 border-purple-200 font-bold';
    stage2Class = 'text-purple-900 bg-purple-200 border-purple-300 font-extrabold shadow-xs';
    stage3Class = 'text-gray-400 bg-gray-100 border-gray-200';
    statusText = deliveryType === 'entrega' 
      ? '🛵 Saiu para entrega! O motoboy está a caminho do seu endereço.' 
      : '🏬 Seu açaí está pronto para retirada no balcão!';
    barGradient = 'from-purple-600 to-indigo-600';
  } else if (status === 'concluido') {
    progressWidth = '100%';
    stage1Class = 'text-emerald-900 bg-emerald-100 border-emerald-200 font-bold';
    stage2Class = 'text-emerald-900 bg-emerald-100 border-emerald-200 font-bold';
    stage3Class = 'text-emerald-900 bg-emerald-200 border-emerald-300 font-extrabold shadow-xs';
    statusText = '✅ Pedido entregue e concluído. Aproveite seu açaí!';
    barGradient = 'from-emerald-500 to-emerald-600';
  }

  return `
    <div class="bg-purple-50/90 p-3.5 rounded-2xl border border-purple-200 space-y-2.5 text-left shadow-xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-black text-acai-900 flex items-center gap-1">
          <span class="animate-pulse">📍</span> Status em Tempo Real
        </span>
        <span class="text-[10px] font-extrabold bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-300 shadow-xs">
          ⏱️ 15 a 20 min
        </span>
      </div>

      <div class="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden flex shadow-inner">
        <div class="bg-gradient-to-r ${barGradient} h-full transition-all duration-500 ease-out" style="width: ${progressWidth};"></div>
      </div>

      <div class="grid grid-cols-3 text-center text-[10px] gap-1">
        <div class="py-1 rounded-lg border ${stage1Class}">1. 🥣 Preparo</div>
        <div class="py-1 rounded-lg border ${stage2Class}">2. 🛵 Entrega</div>
        <div class="py-1 rounded-lg border ${stage3Class}">3. ✅ Finalizado</div>
      </div>

      <div class="text-[11px] font-bold text-purple-950 bg-white/90 p-2 rounded-xl border border-purple-100 flex items-center gap-1.5 shadow-xs">
        <span class="w-2 h-2 rounded-full bg-purple-600 animate-ping shrink-0"></span>
        <span>${statusText}</span>
      </div>
    </div>
  `;
}

function updateTrackingModalProgress(updatedOrder) {
  if (!updatedOrder) return;
  const bar = document.getElementById('order-progress-bar');
  const s1 = document.getElementById('step-stage-1');
  const s2 = document.getElementById('step-stage-2');
  const s3 = document.getElementById('step-stage-3');
  const txt = document.getElementById('confirmed-status-text');

  if (!txt) return;

  const status = updatedOrder.status || 'novo';
  const deliveryType = updatedOrder.deliveryType || 'entrega';

  if (status === 'cancelado') {
    if (bar) {
      bar.style.width = '100%';
      bar.className = 'bg-rose-500 h-full transition-all duration-500 ease-out';
    }
    if (s1) s1.className = 'py-1 rounded-lg border text-rose-800 bg-rose-100 border-rose-200 font-bold';
    if (s2) s2.className = 'py-1 rounded-lg border text-rose-800 bg-rose-100 border-rose-200 font-bold';
    if (s3) s3.className = 'py-1 rounded-lg border text-rose-800 bg-rose-200 border-rose-300 font-black';
    txt.textContent = '❌ Pedido cancelado pela loja. Entre em contato se precisar.';
    return;
  }

  if (status === 'novo' || status === 'preparo') {
    if (bar) {
      bar.style.width = '33%';
      bar.className = 'bg-gradient-to-r from-purple-600 to-purple-500 h-full transition-all duration-500 ease-out';
    }
    if (s1) s1.className = 'py-1 rounded-lg border text-purple-900 bg-purple-200 border-purple-300 font-extrabold shadow-xs';
    if (s2) s2.className = 'py-1 rounded-lg border text-gray-400 bg-gray-100 border-gray-200';
    if (s3) s3.className = 'py-1 rounded-lg border text-gray-400 bg-gray-100 border-gray-200';
    txt.textContent = '⏱️ Estimado: 15 a 20 min • Seu pedido está sendo preparado com carinho!';
  } else if (status === 'entrega') {
    if (bar) {
      bar.style.width = '66%';
      bar.className = 'bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500 ease-out';
    }
    if (s1) s1.className = 'py-1 rounded-lg border text-purple-900 bg-purple-100 border-purple-200 font-bold';
    if (s2) s2.className = 'py-1 rounded-lg border text-purple-900 bg-purple-200 border-purple-300 font-extrabold shadow-xs';
    if (s3) s3.className = 'py-1 rounded-lg border text-gray-400 bg-gray-100 border-gray-200';
    txt.textContent = deliveryType === 'entrega'
      ? '🛵 Saiu para entrega! O motoboy está a caminho do seu endereço.'
      : '🏬 Seu açaí está pronto para retirada no balcão!';
  } else if (status === 'concluido') {
    if (bar) {
      bar.style.width = '100%';
      bar.className = 'bg-gradient-to-r from-emerald-500 to-emerald-600 h-full transition-all duration-500 ease-out';
    }
    if (s1) s1.className = 'py-1 rounded-lg border text-emerald-900 bg-emerald-100 border-emerald-200 font-bold';
    if (s2) s2.className = 'py-1 rounded-lg border text-emerald-900 bg-emerald-100 border-emerald-200 font-bold';
    if (s3) s3.className = 'py-1 rounded-lg border text-emerald-900 bg-emerald-200 border-emerald-300 font-extrabold shadow-xs';
    txt.textContent = '✅ Pedido entregue e concluído. Aproveite seu açaí!';
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

  updateTrackingModalProgress(order);

  window.Store.listenToOrder(order.id, (updatedOrder) => {
    if (updatedOrder) {
      updateTrackingModalProgress(updatedOrder);
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
          cancelado: `❌ Pedido ${order.orderNumber} foi cancelado pela loja.\nMotivo: "${order.cancelReason || 'Sem motivo informado'}"`
        };

        if (messages[order.status]) {
          sendPushNotification('Rotta do Açaí 🍇', messages[order.status]);
          try { window.Store.playNotificationSound(); } catch {}
        }

        if (order.status === 'concluido') {
          try { renderFidelityModal(); } catch (e) {}
          if (!order.rated && !window.Store.getRatedOrdersLocally().includes(orderId)) {
            setTimeout(() => { openRatingModal({ id: orderId, ...order }); }, 1000);
          }
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

        ${renderProgressBarHTML(order.status, order.deliveryType)}

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

        ${order.status === 'cancelado' ? `
          <div class="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs space-y-1">
            <div class="font-extrabold text-rose-800 flex items-center space-x-1">
              <span>❌</span><span>Pedido Cancelado pela Loja</span>
            </div>
            <p class="text-rose-700 font-medium">Motivo: "${order.cancelReason || 'Sem motivo informado'}"</p>
            <div class="pt-1">
              <a href="https://api.whatsapp.com/send?phone=557399643417&text=${encodeURIComponent('Olá, gostaria de falar sobre o meu pedido cancelado ' + (order.orderNumber || '#'))}" target="_blank" class="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition">
                <span>💬</span><span>Falar com a Loja no WhatsApp</span>
              </a>
            </div>
          </div>
        ` : ''}

        ${(order.rating && order.rating.reply && order.rating.reply.text) ? `
          <div class="bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs space-y-1 shadow-sm mt-2">
            <div class="font-extrabold text-acai-900 flex items-center justify-between">
              <span class="flex items-center gap-1">💬 <span>Resposta da Rotta do Açaí</span></span>
              <span class="text-[10px] text-purple-400 font-normal">${order.rating.reply.createdAt ? new Date(order.rating.reply.createdAt).toLocaleDateString('pt-BR') : ''}</span>
            </div>
            <p class="text-gray-700 italic">"${order.rating.reply.text}"</p>
          </div>
        ` : ''}

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
  try { saveStoreNotificationToFeed(promo); } catch (e) {}

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

function setupBroadcastNotificationListener() {
  if (!window.Store || !window.Store.listenToBroadcastNotifications) return;

  window.Store.listenToBroadcastNotifications((broadcastData) => {
    if (!broadcastData || !broadcastData.createdAt) return;

    const lastSeen = localStorage.getItem('last_seen_broadcast_time') || 0;
    if (broadcastData.createdAt > parseInt(lastSeen, 10)) {
      localStorage.setItem('last_seen_broadcast_time', broadcastData.createdAt);

      const title = broadcastData.title || 'Rotta do Açaí 🍇';
      const body = broadcastData.body || 'Confira nossas ofertas do dia!';

      sendPushNotification(title, body);
      try { window.Store.playNotificationSound(); } catch {}
      try {
        saveStoreNotificationToFeed({
          id: 'bc_' + broadcastData.createdAt,
          title: title,
          message: body,
          createdAt: broadcastData.createdAt
        });
      } catch (e) {}

      const titleElem = document.getElementById('promo-modal-title');
      const msgElem = document.getElementById('promo-modal-message');
      const modal = document.getElementById('promo-modal');

      if (titleElem && msgElem && modal) {
        titleElem.textContent = title;
        msgElem.textContent = body;
        modal.classList.remove('hidden');
      }
    }
  });
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

// ==========================================================================
// PROGRAMA DE FIDELIDADE & NAVEGAÇÃO INFERIOR
// ==========================================================================
function switchAppTab(tab) {
  const btnMenu = document.getElementById('nav-btn-menu');
  const btnFidelidade = document.getElementById('nav-btn-fidelidade');
  const btnPedidos = document.getElementById('nav-btn-pedidos');
  const btnPerfil = document.getElementById('nav-btn-perfil');

  if (btnMenu) btnMenu.className = "nav-tab-btn flex flex-col items-center space-y-1 text-purple-300 hover:text-gold-300 font-bold transition";
  if (btnFidelidade) btnFidelidade.className = "nav-tab-btn flex flex-col items-center space-y-1 text-purple-300 hover:text-gold-300 font-bold transition relative";
  if (btnPedidos) btnPedidos.className = "nav-tab-btn flex flex-col items-center space-y-1 text-purple-300 hover:text-gold-300 font-bold transition";
  if (btnPerfil) btnPerfil.className = "nav-tab-btn flex flex-col items-center space-y-1 text-purple-300 hover:text-gold-300 font-bold transition relative";

  if (tab === 'menu') {
    if (btnMenu) btnMenu.className = "nav-tab-btn flex flex-col items-center space-y-1 text-gold-400 font-bold transition";
    closeFidelityModal();
    closeMyOrdersModal();
    closeCustomerProfileModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (tab === 'fidelidade') {
    if (btnFidelidade) btnFidelidade.className = "nav-tab-btn flex flex-col items-center space-y-1 text-gold-400 font-bold transition relative";
    closeMyOrdersModal();
    closeCustomerProfileModal();
    openFidelityModal();
  } else if (tab === 'pedidos') {
    if (btnPedidos) btnPedidos.className = "nav-tab-btn flex flex-col items-center space-y-1 text-gold-400 font-bold transition";
    closeFidelityModal();
    closeCustomerProfileModal();
    openMyOrdersModal();
  } else if (tab === 'perfil') {
    if (btnPerfil) btnPerfil.className = "nav-tab-btn flex flex-col items-center space-y-1 text-gold-400 font-bold transition relative";
    closeFidelityModal();
    closeMyOrdersModal();
    openCustomerProfileModal();
  }
}

// ==========================================================================
// MODAL DE PERFIL DO CLIENTE & NOTIFICAÇÕES (12 HORAS MAX)
// ==========================================================================
const PROFILE_NOTIFS_STORAGE_KEY = 'rotta_profile_notifications_v1';
const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;

function openCustomerProfileModal() {
  const modal = document.getElementById('customer-profile-modal');
  if (modal) modal.classList.remove('hidden');
  loadCustomerProfileForm();
  renderProfileNotifications();
  renderProfileFavorites();
  updateProfileNotifBadge();
}

function closeCustomerProfileModal() {
  const modal = document.getElementById('customer-profile-modal');
  if (modal) modal.classList.add('hidden');
}

function switchProfileTab(tabName) {
  const btnDados = document.getElementById('profile-tab-btn-dados');
  const btnNotifs = document.getElementById('profile-tab-btn-notificacoes');
  const btnFavs = document.getElementById('profile-tab-btn-favoritos');

  const contentDados = document.getElementById('profile-tab-content-dados');
  const contentNotifs = document.getElementById('profile-tab-content-notificacoes');
  const contentFavs = document.getElementById('profile-tab-content-favoritos');

  if (btnDados) btnDados.className = "flex-1 py-2 px-1 text-center rounded-xl text-purple-300 hover:text-white transition flex items-center justify-center gap-1";
  if (btnNotifs) btnNotifs.className = "flex-1 py-2 px-1 text-center rounded-xl text-purple-300 hover:text-white transition flex items-center justify-center gap-1 relative";
  if (btnFavs) btnFavs.className = "flex-1 py-2 px-1 text-center rounded-xl text-purple-300 hover:text-white transition flex items-center justify-center gap-1";

  if (contentDados) contentDados.classList.add('hidden');
  if (contentNotifs) contentNotifs.classList.add('hidden');
  if (contentFavs) contentFavs.classList.add('hidden');

  if (tabName === 'dados') {
    if (btnDados) btnDados.className = "flex-1 py-2 px-1 text-center rounded-xl bg-purple-800/80 text-gold-300 shadow transition flex items-center justify-center gap-1 font-bold";
    if (contentDados) contentDados.classList.remove('hidden');
    loadCustomerProfileForm();
  } else if (tabName === 'notificacoes') {
    if (btnNotifs) btnNotifs.className = "flex-1 py-2 px-1 text-center rounded-xl bg-purple-800/80 text-gold-300 shadow transition flex items-center justify-center gap-1 font-bold relative";
    if (contentNotifs) contentNotifs.classList.remove('hidden');
    markProfileNotificationsAsRead();
    renderProfileNotifications();
  } else if (tabName === 'favoritos') {
    if (btnFavs) btnFavs.className = "flex-1 py-2 px-1 text-center rounded-xl bg-purple-800/80 text-gold-300 shadow transition flex items-center justify-center gap-1 font-bold";
    if (contentFavs) contentFavs.classList.remove('hidden');
    renderProfileFavorites();
  }
}

function loadCustomerProfileForm() {
  const data = window.Store.getCustomerData() || {};
  const nameInput = document.getElementById('profile-name-input');
  const phoneInput = document.getElementById('profile-phone-input');
  const streetInput = document.getElementById('profile-street-input');
  const numberInput = document.getElementById('profile-number-input');
  const neighborhoodInput = document.getElementById('profile-neighborhood-input');
  const referenceInput = document.getElementById('profile-reference-input');

  if (nameInput) nameInput.value = data.name || '';
  if (phoneInput) phoneInput.value = data.phone || '';
  if (streetInput) streetInput.value = data.street || '';
  if (numberInput) numberInput.value = data.number || '';
  if (neighborhoodInput) neighborhoodInput.value = data.neighborhood || '';
  if (referenceInput) referenceInput.value = data.reference || '';
}

function saveCustomerProfileData(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('profile-name-input')?.value.trim();
  const phone = document.getElementById('profile-phone-input')?.value.trim();
  const street = document.getElementById('profile-street-input')?.value.trim();
  const number = document.getElementById('profile-number-input')?.value.trim();
  const neighborhood = document.getElementById('profile-neighborhood-input')?.value.trim();
  const reference = document.getElementById('profile-reference-input')?.value.trim();

  if (!name || !phone || !street || !number || !neighborhood) {
    alert("⚠️ Por favor, preencha todos os campos obrigatórios (*).");
    return;
  }

  const payload = {
    name,
    phone,
    street,
    number,
    neighborhood,
    reference: reference || ''
  };

  window.Store.saveCustomer(payload);
  alert("✅ Seus dados do perfil foram salvos com sucesso!");
}

function getActive12HourNotifications() {
  try {
    const raw = localStorage.getItem(PROFILE_NOTIFS_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    
    // Filtro rigoroso: manter apenas mensagens dos últimos 12 horas (43.200.000 ms)
    const activeList = list.filter(n => (now - (n.createdAt || 0)) <= TWELVE_HOURS_MS);

    if (activeList.length !== list.length) {
      localStorage.setItem(PROFILE_NOTIFS_STORAGE_KEY, JSON.stringify(activeList));
    }
    return activeList;
  } catch {
    return [];
  }
}

function saveStoreNotificationToFeed(notif) {
  if (!notif || (!notif.title && !notif.message && !notif.body)) return;
  try {
    const activeList = getActive12HourNotifications();
    const notifId = notif.id || (notif.createdAt ? 'notif_' + notif.createdAt : 'notif_' + Date.now());
    const notifTitle = notif.title || 'Notificação da Rotta';
    const notifMsg = notif.message || notif.body || '';

    const exists = activeList.some(n => n.id === notifId || (n.title === notifTitle && Math.abs((n.createdAt || 0) - (notif.createdAt || 0)) < 2000));
    
    if (!exists) {
      const item = {
        id: notifId,
        title: notifTitle,
        message: notifMsg,
        createdAt: notif.createdAt || Date.now(),
        read: false
      };
      activeList.unshift(item);
      localStorage.setItem(PROFILE_NOTIFS_STORAGE_KEY, JSON.stringify(activeList));
      updateProfileNotifBadge();
    }
  } catch (e) {
    console.warn('Erro ao salvar notificação:', e);
  }
}

function markProfileNotificationsAsRead() {
  try {
    const activeList = getActive12HourNotifications();
    activeList.forEach(n => n.read = true);
    localStorage.setItem(PROFILE_NOTIFS_STORAGE_KEY, JSON.stringify(activeList));
    updateProfileNotifBadge();
  } catch {}
}

function updateProfileNotifBadge() {
  const badgeNav = document.getElementById('nav-perfil-badge');
  const badgeTab = document.getElementById('profile-notif-tab-badge');
  const activeList = getActive12HourNotifications();
  const unreadCount = activeList.filter(n => !n.read).length;

  if (badgeNav) {
    if (unreadCount > 0) {
      badgeNav.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badgeNav.classList.remove('hidden');
    } else {
      badgeNav.classList.add('hidden');
    }
  }

  if (badgeTab) {
    if (unreadCount > 0) {
      badgeTab.textContent = unreadCount > 9 ? '9+' : unreadCount;
      badgeTab.classList.remove('hidden');
    } else {
      badgeTab.classList.add('hidden');
    }
  }
}

function getTimeAgoString(timestamp) {
  if (!timestamp) return 'Recente';
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes === 1) return 'Há 1 min';
  if (diffMinutes < 60) return `Há ${diffMinutes} min`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'Há 1 hora';
  return `Há ${diffHours} h`;
}

function renderProfileNotifications() {
  const container = document.getElementById('profile-notifications-list');
  if (!container) return;

  const list = getActive12HourNotifications();
  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="bg-purple-900/20 border border-purple-800/40 p-6 rounded-2xl text-center space-y-2 text-purple-300">
        <span class="text-3xl block">📭</span>
        <h4 class="font-bold text-sm text-white">Nenhum aviso no momento</h4>
        <p class="text-xs text-purple-300/80">As notificações enviadas pela loja nas últimas 12 horas aparecerão aqui!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(item => {
    const timeAgo = getTimeAgoString(item.createdAt);
    return `
      <div class="bg-purple-900/40 border border-purple-700/50 p-3.5 rounded-2xl space-y-1 shadow-sm">
        <div class="flex items-center justify-between">
          <h4 class="font-extrabold text-xs text-gold-300 flex items-center gap-1.5">
            <span>🟣</span> ${escapeHtml(item.title)}
          </h4>
          <span class="text-[10px] text-purple-300 font-semibold">${timeAgo}</span>
        </div>
        <p class="text-xs text-purple-100 leading-relaxed font-normal">${escapeHtml(item.message)}</p>
      </div>
    `;
  }).join('');
}

function syncPromotionsFeedFromFirebase() {
  if (window.Store && window.Store.getPromotionsList) {
    window.Store.getPromotionsList(promos => {
      if (Array.isArray(promos)) {
        promos.forEach(p => {
          saveStoreNotificationToFeed(p);
        });
        updateProfileNotifBadge();
      }
    });
  }
}

function renderProfileFavorites() {
  const container = document.getElementById('profile-favorites-list');
  if (!container) return;

  const favs = window.Store.getFavorites();
  if (!favs || favs.length === 0) {
    container.innerHTML = `
      <div class="bg-purple-900/20 border border-purple-800/40 p-6 rounded-2xl text-center space-y-2 text-purple-300">
        <span class="text-3xl block">⭐</span>
        <h4 class="font-bold text-sm text-white">Nenhum açaí favoritado ainda</h4>
        <p class="text-xs text-purple-300/80">Ao montar seu açaí no cardápio, clique no botão <strong>⭐ Salvar Favorito</strong> para guardar suas combinações preferidas!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = favs.map(fav => `
    <div class="bg-purple-900/40 border border-purple-700/50 p-3.5 rounded-2xl space-y-2 shadow-sm">
      <div class="flex items-start justify-between">
        <div>
          <h4 class="font-extrabold text-xs text-gold-300 flex items-center gap-1">
            <span>⭐</span> ${escapeHtml(fav.customName)}
          </h4>
          <p class="text-[11px] text-white font-semibold mt-0.5">${escapeHtml(fav.productName)}</p>
          ${fav.fruits && fav.fruits.length > 0 ? `<p class="text-[10px] text-purple-200 mt-0.5">🍓 ${fav.fruits.map(f => f.name).join(', ')}</p>` : ''}
          ${fav.freeToppings && fav.freeToppings.length > 0 ? `<p class="text-[10px] text-purple-200">🥣 ${fav.freeToppings.map(t => t.name).join(', ')}</p>` : ''}
          ${fav.calda ? `<p class="text-[10px] text-purple-200">🍯 ${escapeHtml(fav.calda.name)}</p>` : ''}
        </div>
        <button onclick="removeFavoriteFromProfile('${fav.id}')" class="text-rose-400 hover:text-rose-200 text-xs font-bold px-2 py-1 bg-rose-950/50 hover:bg-rose-900 border border-rose-700/50 rounded-lg transition" title="Excluir Favorito">
          🗑️
        </button>
      </div>
      
      <div class="flex items-center justify-between pt-2 border-t border-purple-700/40">
        <span class="text-xs font-extrabold text-gold-300">${window.Store.formatCurrency(fav.unitPrice)}</span>
        <button onclick="addFavoriteDirectlyToCart('${fav.id}')" class="bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-acai-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow transition transform active:scale-95 flex items-center gap-1">
          <span>🛒 Pedir este Açaí</span>
        </button>
      </div>
    </div>
  `).join('');
}

function removeFavoriteFromProfile(favId) {
  if (confirm("Remover este açaí dos seus favoritos?")) {
    window.Store.removeFavorite(favId);
    renderProfileFavorites();
    renderFavorites();
  }
}

function addFavoriteDirectlyToCart(favId) {
  addFavoriteToCart(favId);
  closeCustomerProfileModal();
}

function openFidelityModal() {
  const modal = document.getElementById('fidelity-modal');
  if (modal) modal.classList.remove('hidden');
  renderFidelityModal();
}

function closeFidelityModal() {
  const modal = document.getElementById('fidelity-modal');
  if (modal) modal.classList.add('hidden');
}

function getActiveCustomerData() {
  try {
    const saved = localStorage.getItem('rotta_customer_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.phone) return parsed;
    }
  } catch {}

  // Fallback inteligente: Busca o cliente a partir dos pedidos salvos no celular do cliente
  try {
    const myOrderIds = window.Store.getMyOrders();
    if (myOrderIds && myOrderIds.length > 0) {
      for (const orderId of myOrderIds) {
        const order = window.Store.getOrderById(orderId);
        if (order && order.customer && order.customer.phone) {
          const fallbackData = {
            name: order.customer.name || 'Cliente',
            phone: order.customer.phone
          };
          try { localStorage.setItem('rotta_customer_data', JSON.stringify(fallbackData)); } catch {}
          return fallbackData;
        }
      }
    }
  } catch (e) {}

  return null;
}

let _isRecalculatingFidelity = false;

function renderFidelityModal() {
  const customer = getActiveCustomerData();
  const fidelityCfg = window.Store.getFidelityConfig();

  const nameElem = document.getElementById('fidelity-user-name');
  const phoneElem = document.getElementById('fidelity-user-phone');
  const cupsElem = document.getElementById('fidelity-user-cups');

  let currentCups = 0;
  let customerPhoneClean = '';
  let customerName = 'Cliente';

  if (customer && customer.phone) {
    customerPhoneClean = window.Store.cleanPhoneKey(customer.phone);
    customerName = customer.name || 'Cliente';

    const customersMap = window.Store.getCustomersLocally();
    const customerRecord = customersMap[customerPhoneClean] || {};

    currentCups = parseInt(customerRecord.totalCups, 10) || 0;

    if (nameElem) nameElem.textContent = customerName;
    if (phoneElem) phoneElem.textContent = `Tel: ${customer.phone}`;

    if (!_isRecalculatingFidelity) {
      _isRecalculatingFidelity = true;
      window.Store.recalculateCustomerCupsFromOrders(customer.phone).then(finalCups => {
        _isRecalculatingFidelity = false;
        if (finalCups !== currentCups) {
          if (cupsElem) cupsElem.textContent = `${finalCups} 🍧`;
          renderFidelityModalUI(customer, fidelityCfg, finalCups);
        }
      }).catch(() => { _isRecalculatingFidelity = false; });
    }
  } else {
    if (nameElem) nameElem.textContent = 'Cliente (Não Identificado)';
    if (phoneElem) phoneElem.textContent = 'Toque em "Alterar Telefone" para consultar seus pontos';
  }

  renderFidelityModalUI(customer, fidelityCfg, currentCups);
}

function renderFidelityModalUI(customer, fidelityCfg, currentCups) {
  const levels = fidelityCfg.levels || [];
  const cupsElem = document.getElementById('fidelity-user-cups');
  if (cupsElem) cupsElem.textContent = `${currentCups} 🍧`;

  let maxTargetCups = 35;
  if (levels.length > 0) {
    maxTargetCups = Math.max(...levels.map(l => l.cupsRequired));
  }

  let nextLevel = levels.find(l => l.cupsRequired > currentCups);
  if (!nextLevel && levels.length > 0) {
    nextLevel = levels[levels.length - 1];
  }

  const progressPercent = Math.min(100, Math.round((currentCups / (nextLevel ? nextLevel.cupsRequired : maxTargetCups)) * 100));

  const percentElem = document.getElementById('fidelity-progress-percent');
  const barElem = document.getElementById('fidelity-progress-bar');

  if (percentElem) percentElem.textContent = `${progressPercent}%`;
  if (barElem) barElem.style.width = `${progressPercent}%`;

  const motivationTitle = document.getElementById('fidelity-motivation-title');
  const motivationText = document.getElementById('fidelity-motivation-text');

  if (motivationTitle && motivationText) {
    if (currentCups === 0) {
      motivationTitle.textContent = "Sua jornada do Açaí começou! 🚀";
      motivationText.textContent = "Faça seu 1º pedido para acumular seus primeiros copos de açaí!";
    } else if (nextLevel) {
      const remaining = nextLevel.cupsRequired - currentCups;
      if (remaining <= 2) {
        motivationTitle.textContent = "Você está QUASE LÁ! 🔥";
        motivationText.textContent = `Faltam apenas ${remaining} copo(s) de açaí para desbloquear o prêmio: ${nextLevel.rewardTitle}!`;
      } else if (currentCups >= Math.round(nextLevel.cupsRequired / 2)) {
        motivationTitle.textContent = "Passou da metade do caminho! 💪";
        motivationText.textContent = `Você já tem ${currentCups} copos. Falta pouco para conquistar seu ${nextLevel.rewardTitle}!`;
      } else {
        motivationTitle.textContent = "Continue acumulando! 🎯";
        motivationText.textContent = `Você possui ${currentCups} copos. Faltam ${remaining} copos para o próximo prêmio!`;
      }
    } else {
      motivationTitle.textContent = "Você é um cliente VIP Top Açaí! 🏆";
      motivationText.textContent = "Parabéns! Você alcançou o nível máximo de fidelidade!";
    }
  }

  const levelsContainer = document.getElementById('fidelity-levels-container');
  if (levelsContainer) {
    const icons = ['🥉', '🥈', '🥇', '🏆', '👑'];
    levelsContainer.innerHTML = levels.map((lvl, index) => {
      const isUnlocked = currentCups >= lvl.cupsRequired;
      const prevLvlCups = index > 0 ? levels[index - 1].cupsRequired : 0;
      const cupsForThisLevel = lvl.cupsRequired - prevLvlCups;
      const userProgressThisLevel = Math.max(0, Math.min(cupsForThisLevel, currentCups - prevLvlCups));
      const levelPercent = Math.min(100, Math.round((userProgressThisLevel / cupsForThisLevel) * 100));

      const icon = isUnlocked ? (icons[index % icons.length]) : '🔒';
      const remainingForThis = Math.max(0, lvl.cupsRequired - currentCups);

      return `
        <div class="relative flex items-start group">
          <!-- Nó Circuito / Marco Visual da Trilha -->
          <div class="absolute -left-7 top-3.5 z-10 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 shadow-md transition-all ${
            isUnlocked 
              ? 'bg-gradient-to-br from-gold-400 via-gold-500 to-amber-600 text-acai-950 border-gold-300 ring-4 ring-gold-500/20 shadow-gold-500/40' 
              : (currentCups > prevLvlCups ? 'bg-purple-900 text-gold-300 border-gold-500/60 ring-2 ring-purple-500/30' : 'bg-acai-950 text-gray-400 border-purple-800')
          }">
            ${icon}
          </div>

          <!-- Card do Nível da Trilha -->
          <div class="flex-1 p-3.5 sm:p-4 rounded-2xl border transition-all ${
            isUnlocked 
              ? 'bg-gradient-to-r from-purple-900/90 via-acai-900 to-purple-950 border-gold-500/60 shadow-lg shadow-purple-950/50' 
              : 'bg-acai-900/80 border-purple-800/50 opacity-95'
          }">
            <div class="flex flex-wrap items-center justify-between gap-1.5 border-b border-purple-800/40 pb-2 mb-2.5">
              <div class="flex items-center space-x-1.5">
                <span class="text-xs font-black text-gold-400 uppercase tracking-wider whitespace-nowrap">Nível ${lvl.level}</span>
                <span class="text-[10px] bg-purple-950/80 text-purple-200 px-2 py-0.5 rounded-md font-bold border border-purple-700/50 whitespace-nowrap">Meta: ${lvl.cupsRequired} copos</span>
              </div>
              <div class="shrink-0">
                ${isUnlocked 
                  ? '<span class="bg-emerald-500 text-acai-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow whitespace-nowrap">DESBLOQUEADO! 🎉</span>' 
                  : `<span class="text-[10px] bg-purple-900/60 text-amber-300 px-2 py-0.5 rounded-md font-extrabold border border-amber-500/30 whitespace-nowrap">Faltam ${remainingForThis} copo(s)</span>`
                }
              </div>
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h5 class="font-black text-sm text-white flex items-center gap-1.5 leading-snug">
                  <span>🎁</span> ${lvl.rewardTitle}
                </h5>
                <p class="text-xs text-purple-200/90 leading-snug mt-0.5">${lvl.rewardDescription || 'Prêmio especial de fidelidade'}</p>
              </div>

              ${isUnlocked ? `
                <button onclick="claimFidelityReward('${lvl.rewardCode}', '${lvl.rewardTitle}')" class="w-full sm:w-auto shrink-0 bg-gradient-to-r from-gold-400 to-gold-500 hover:from-gold-300 hover:to-gold-400 text-acai-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center space-x-1">
                  <span>🎁</span>
                  <span>Resgatar</span>
                </button>
              ` : ''}
            </div>

            <!-- Mini Barra de Progresso Local do Nível -->
            ${!isUnlocked ? `
              <div class="mt-3 pt-2 border-t border-purple-900/60">
                <div class="flex justify-between text-[10px] font-bold text-purple-300 mb-1">
                  <span>Progresso para o Nível ${lvl.level}</span>
                  <span>${userProgressThisLevel} / ${cupsForThisLevel} copos (${levelPercent}%)</span>
                </div>
                <div class="w-full bg-acai-950 rounded-full h-2 overflow-hidden border border-purple-800/40">
                  <div class="bg-gold-400 h-full rounded-full transition-all duration-300" style="width: ${levelPercent}%"></div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
}

function promptEditFidelityPhone() {
  const currentData = getActiveCustomerData() || {};
  const newName = prompt("Digite seu nome completo:", currentData.name || "");
  if (newName === null) return;

  const newPhone = prompt("Digite seu número de WhatsApp (com DDD):", currentData.phone || "");
  if (newPhone === null) return;

  if (!newPhone.trim()) {
    alert("Por favor, digite um número de WhatsApp válido.");
    return;
  }

  const payload = {
    name: newName.trim() || 'Cliente',
    phone: newPhone.trim()
  };

  try {
    localStorage.setItem('rotta_customer_data', JSON.stringify(payload));
    window.Store.saveCustomerFidelity(payload.phone, payload);
    renderFidelityModal();
    alert("✅ Perfil de Fidelidade atualizado com sucesso!");
  } catch (e) {
    alert("Erro ao salvar dados.");
  }
}

function claimFidelityReward(code, title) {
  alert(`🎉 Parabéns! Para resgatar o seu "${title}", informe o cupom [${code}] na observação do seu pedido ou fale com a loja no WhatsApp!`);
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
  if (listElem) {
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
  }

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
window.switchAppTab = switchAppTab;
window.openFidelityModal = openFidelityModal;
window.closeFidelityModal = closeFidelityModal;
window.promptEditFidelityPhone = promptEditFidelityPhone;
window.claimFidelityReward = claimFidelityReward;
window.openCustomerProfileModal = openCustomerProfileModal;
window.closeCustomerProfileModal = closeCustomerProfileModal;
window.switchProfileTab = switchProfileTab;
window.saveCustomerProfileData = saveCustomerProfileData;
window.removeFavoriteFromProfile = removeFavoriteFromProfile;
window.addFavoriteDirectlyToCart = addFavoriteDirectlyToCart;

window.setupRatingReplyListener = function() {
  const db = window.Store && window.Store.getDB ? window.Store.getDB() : null;
  if (!db) return;

  const orderIds = window.Store.getMyOrders ? window.Store.getMyOrders() : [];
  if (!orderIds || orderIds.length === 0) return;

  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    try { Notification.requestPermission(); } catch(e) {}
  }

  orderIds.slice(0, 10).forEach(orderId => {
    db.ref(`orders/${orderId}/rating/reply`).on('value', snap => {
      if (snap.exists()) {
        const reply = snap.val();
        if (reply && reply.text) {
          const notifKey = 'notified_reply_' + orderId + '_' + (reply.createdAt || 0);
          if (!localStorage.getItem(notifKey)) {
            localStorage.setItem(notifKey, 'true');

            if ("Notification" in window && Notification.permission === "granted") {
              if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                navigator.serviceWorker.ready.then(reg => {
                  reg.showNotification("Rotta do Açaí 🍧", {
                    body: `A loja respondeu sua avaliação: "${reply.text}"`,
                    icon: "assets/logo.jpg",
                    badge: "assets/logo.jpg",
                    vibrate: [300, 100, 300, 100, 300],
                    data: { url: "index.html" },
                    tag: 'reply-notif-' + orderId
                  });
                }).catch(() => {});
              } else {
                try {
                  new Notification("Rotta do Açaí 🍧", {
                    body: `A loja respondeu sua avaliação: "${reply.text}"`,
                    icon: "assets/logo.jpg"
                  });
                } catch(e) {}
              }
            }

            if (typeof renderMyOrders === 'function') renderMyOrders();
          }
        }
      }
    });
  });
};

setTimeout(() => {
  if (typeof window.setupRatingReplyListener === 'function') {
    window.setupRatingReplyListener();
  }
  if (typeof window.setupCustomerWinbackNotifListener === 'function') {
    window.setupCustomerWinbackNotifListener();
  }
}, 3000);

window.setupCustomerWinbackNotifListener = function() {
  const db = window.Store && window.Store.getDB ? window.Store.getDB() : null;
  if (!db) return;

  let savedPhone = '';
  try {
    const rawFidelity = localStorage.getItem('rotta_customer_fidelity_phone');
    if (rawFidelity) savedPhone = rawFidelity.replace(/\D/g, '');
  } catch(e) {}

  function attachWinbackListener(cleanPhone) {
    if (!cleanPhone) return;
    const cleanKey = cleanPhone.replace(/^55/, '');
    const targetKeys = [cleanKey, '55' + cleanKey];
    
    targetKeys.forEach(key => {
      db.ref('customer_notifications/' + key).on('value', snap => {
        if (snap.exists()) {
          const notif = snap.val();
          if (notif && notif.body) {
            const seenKey = 'seen_winback_' + (notif.createdAt || 0);
            if (!localStorage.getItem(seenKey)) {
              localStorage.setItem(seenKey, 'true');

              if ("Notification" in window && Notification.permission === "granted") {
                if (navigator.serviceWorker && navigator.serviceWorker.ready) {
                  navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(notif.title || "Rotta do Açaí 🍧", {
                      body: notif.body,
                      icon: "assets/logo.jpg",
                      badge: "assets/logo.jpg",
                      vibrate: [400, 100, 400, 100, 400],
                      data: { url: "index.html" },
                      tag: 'winback-' + (notif.createdAt || Date.now())
                    });
                  }).catch(() => {});
                } else {
                  try {
                    new Notification(notif.title || "Rotta do Açaí 🍧", {
                      body: notif.body,
                      icon: "assets/logo.jpg"
                    });
                  } catch(e) {}
                }
              }

              if (typeof showToast === 'function') {
                showToast(`📢 Rotta do Açaí: "${notif.body}"`);
              }
            }
          }
        }
      });
    });
  }

  if (!savedPhone) {
    const orders = window.Store.getMyOrders ? window.Store.getMyOrders() : [];
    if (orders && orders.length > 0) {
      db.ref('orders/' + orders[0]).once('value').then(snap => {
        if (snap.exists() && snap.val() && snap.val().customer && snap.val().customer.phone) {
          const ph = snap.val().customer.phone.replace(/\D/g, '');
          if (ph) attachWinbackListener(ph);
        }
      });
    }
  } else {
    attachWinbackListener(savedPhone);
  }
};

// ==========================================================================
// 14. CHAT AO VIVO (SAC) & SISTEMA DE NOTIFICAÇÕES PUSH PARA O CLIENTE
// ==========================================================================
let _customerChatSubscribedKey = null;
let _lastSeenChatMessageIds = new Set();
let _isChatModalOpen = false;

function getCustomerChatKey() {
  try {
    const rawFidelity = localStorage.getItem('rotta_customer_fidelity_phone');
    if (rawFidelity && rawFidelity.replace(/\D/g, '')) {
      return rawFidelity.replace(/\D/g, '');
    }
    const rawCust = localStorage.getItem('rotta_customer_data');
    if (rawCust) {
      const parsed = JSON.parse(rawCust);
      if (parsed && parsed.phone && parsed.phone.replace(/\D/g, '')) {
        return parsed.phone.replace(/\D/g, '');
      }
    }
    const tempKey = localStorage.getItem('rotta_temp_chat_key');
    if (tempKey) return tempKey;
  } catch (e) {}

  const newTemp = 'cliente_' + Math.random().toString(36).substring(2, 9);
  try { localStorage.setItem('rotta_temp_chat_key', newTemp); } catch (e) {}
  return newTemp;
}

function getCustomerSavedName() {
  try {
    const rawCust = localStorage.getItem('rotta_customer_data');
    if (rawCust) {
      const parsed = JSON.parse(rawCust);
      if (parsed && parsed.name) return parsed.name;
    }
    const savedName = localStorage.getItem('rotta_temp_chat_name');
    if (savedName) return savedName;
  } catch(e) {}
  return 'Cliente';
}

function openLiveChatModal() {
  const modal = document.getElementById('live-chat-modal');
  if (!modal) return;

  _isChatModalOpen = true;
  modal.classList.remove('hidden');

  const badge = document.getElementById('chat-unread-badge');
  if (badge) badge.classList.add('hidden');

  const customerKey = getCustomerChatKey();
  
  const identityBox = document.getElementById('chat-identity-box');
  if (identityBox) {
    if (customerKey.startsWith('cliente_')) {
      identityBox.classList.remove('hidden');
    } else {
      identityBox.classList.add('hidden');
    }
  }

  checkChatNotificationPermission();
  initCustomerChatListener();

  if (window.Store && window.Store.markChatAsReadByCustomer) {
    window.Store.markChatAsReadByCustomer(customerKey);
  }

  setTimeout(() => {
    const msgFeed = document.getElementById('live-chat-messages');
    if (msgFeed) msgFeed.scrollTop = msgFeed.scrollHeight;
  }, 200);
}

function closeLiveChatModal() {
  const modal = document.getElementById('live-chat-modal');
  if (modal) modal.classList.add('hidden');
  _isChatModalOpen = false;
}

function checkChatNotificationPermission() {
  const banner = document.getElementById('chat-notification-banner');
  if (!banner) return;

  if ("Notification" in window) {
    if (Notification.permission === "default") {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  } else {
    banner.classList.add('hidden');
  }
}

function requestChatNotificationPermission() {
  if ("Notification" in window) {
    Notification.requestPermission().then(permission => {
      checkChatNotificationPermission();
      if (permission === 'granted') {
        showToast('🔔 Notificações ativadas com sucesso!');
      }
    });
  }
}

function saveChatIdentity() {
  const nameInput = document.getElementById('chat-input-name');
  const phoneInput = document.getElementById('chat-input-phone');
  
  const name = nameInput ? nameInput.value.trim() : '';
  const phone = phoneInput ? phoneInput.value.replace(/\D/g, '') : '';

  if (!name || !phone || phone.length < 8) {
    showToast('⚠️ Por favor, informe seu nome e telefone válido!');
    return;
  }

  try {
    localStorage.setItem('rotta_temp_chat_name', name);
    localStorage.setItem('rotta_customer_fidelity_phone', phone);
    const existingData = localStorage.getItem('rotta_customer_data');
    const custObj = existingData ? JSON.parse(existingData) : {};
    custObj.name = name;
    custObj.phone = phone;
    localStorage.setItem('rotta_customer_data', JSON.stringify(custObj));
  } catch (e) {}

  const identityBox = document.getElementById('chat-identity-box');
  if (identityBox) identityBox.classList.add('hidden');

  showToast('✅ Identificação salva! Como podemos te ajudar?');
  initCustomerChatListener();
}

let _optimisticCustomerMessages = [];

function sendQuickChatMessage(text) {
  const input = document.getElementById('live-chat-input');
  if (input) input.value = text;
  handleSendCustomerChatMessage();
}

async function handleSendCustomerChatMessage(event) {
  if (event) event.preventDefault();
  const input = document.getElementById('live-chat-input');
  if (!input) return;

  const text = input.value.trim();
  if (!text) {
    if (typeof showToast === 'function') {
      showToast('⚠️ Digite uma mensagem antes de enviar!');
    }
    return;
  }

  const customerKey = getCustomerChatKey();
  const customerName = getCustomerSavedName();
  const customerPhone = localStorage.getItem('rotta_customer_fidelity_phone') || customerKey;

  input.value = '';

  // Renderizar otimisticamente na tela de imediato
  const tempMsg = {
    id: 'temp_' + Date.now(),
    sender: 'customer',
    text: text,
    timestamp: new Date().toISOString()
  };
  _optimisticCustomerMessages.push(tempMsg);
  renderCustomerChatMessages(_lastReceivedChatData);

  if (window.Store && window.Store.sendChatMessage) {
    try {
      await window.Store.sendChatMessage(customerKey, 'customer', text, customerName, customerPhone);
      notifyServiceWorkerTrackChat(customerKey);
    } catch (err) {
      console.warn('Erro ao enviar mensagem no chat:', err);
    }
  }
}

function notifyServiceWorkerTrackChat(customerKey) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'TRACK_CHAT',
      customerKey: customerKey
    });
  }
}

let _lastReceivedChatData = null;

function initCustomerChatListener() {
  const customerKey = getCustomerChatKey();
  if (!customerKey) return;
  if (_customerChatSubscribedKey === customerKey) return;

  if (window.Store && window.Store.listenToCustomerChat) {
    const chatRef = window.Store.listenToCustomerChat(customerKey, chatData => {
      _lastReceivedChatData = chatData;
      renderCustomerChatMessages(chatData);
    });
    if (chatRef) {
      _customerChatSubscribedKey = customerKey;
      notifyServiceWorkerTrackChat(customerKey);
    } else {
      setTimeout(initCustomerChatListener, 1000);
    }
  } else {
    setTimeout(initCustomerChatListener, 1000);
  }
}

async function fetchCustomerSingleChatDirectly() {
  const customerKey = getCustomerChatKey();
  if (!customerKey) return;
  const cleanKey = (window.Store && window.Store.getCleanCustomerKey) ? window.Store.getCleanCustomerKey(customerKey) : customerKey;

  try {
    const res = await fetch(`https://rotta-do-acai-default-rtdb.firebaseio.com/chats/${cleanKey}.json?cb=` + Date.now());
    const data = await res.json();
    if (data && typeof data === 'object') {
      _lastReceivedChatData = data;
      renderCustomerChatMessages(data);
    }
  } catch (e) {}
}

setTimeout(fetchCustomerSingleChatDirectly, 500);
setInterval(fetchCustomerSingleChatDirectly, 2500);

function renderCustomerChatMessages(chatData) {
  const msgFeed = document.getElementById('live-chat-messages');
  if (!msgFeed) return;

  const rtdbMessagesObj = (chatData && chatData.messages) ? chatData.messages : {};
  const rtdbList = Object.values(rtdbMessagesObj);

  // Mesclar mensagens do RTDB com mensagens temporárias otimistas
  const allMessagesMap = {};
  rtdbList.forEach(m => { if (m && m.id) allMessagesMap[m.id] = m; });
  _optimisticCustomerMessages.forEach(m => {
    if (m && m.id) {
      const existsInRtdb = rtdbList.some(r => r && r.sender === 'customer' && r.text === m.text && Math.abs(new Date(r.timestamp) - new Date(m.timestamp)) < 15000);
      if (!existsInRtdb) {
        allMessagesMap[m.id] = m;
      }
    }
  });

  const messageList = Object.values(allMessagesMap).sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

  if (messageList.length === 0) {
    msgFeed.innerHTML = `
      <div class="text-center text-xs text-gray-400 py-6">
        👋 Olá! Envie sua primeira mensagem para falar com a Rotta do Açaí.
      </div>
    `;
    return;
  }

  let hasNewStoreMessage = false;
  let latestStoreMsgText = '';

  const html = messageList.map(msg => {
    const isCustomer = msg.sender === 'customer';
    const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';

    if (!isCustomer && !_lastSeenChatMessageIds.has(msg.id)) {
      if (_lastSeenChatMessageIds.size > 0) {
        hasNewStoreMessage = true;
        latestStoreMsgText = msg.text;
      }
      _lastSeenChatMessageIds.add(msg.id);
    } else {
      _lastSeenChatMessageIds.add(msg.id);
    }

    if (isCustomer) {
      return `
        <div class="flex flex-col items-end">
          <div class="max-w-[80%] bg-acai-900 text-purple-100 rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-xs space-y-1">
            <p class="leading-relaxed whitespace-pre-wrap">${escapeHtmlApp(msg.text)}</p>
            <span class="text-[9px] text-purple-300/70 block text-right">${timeStr}</span>
          </div>
        </div>
      `;
    } else {
      return `
        <div class="flex flex-col items-start">
          <div class="flex items-center space-x-1 mb-0.5">
            <span class="text-[10px] font-bold text-acai-900">Rotta do Açaí 🍇</span>
          </div>
          <div class="max-w-[80%] bg-white border border-purple-200 text-gray-800 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm text-xs space-y-1">
            <p class="leading-relaxed whitespace-pre-wrap">${escapeHtmlApp(msg.text)}</p>
            <span class="text-[9px] text-gray-400 block text-right">${timeStr}</span>
          </div>
        </div>
      `;
    }
  }).join('');

  msgFeed.innerHTML = html;

  if (_isChatModalOpen) {
    msgFeed.scrollTop = msgFeed.scrollHeight;
    if (window.Store && window.Store.markChatAsReadByCustomer) {
      window.Store.markChatAsReadByCustomer(getCustomerChatKey());
    }
  } else if (chatData && chatData.unreadByCustomer) {
    const badge = document.getElementById('chat-unread-badge');
    if (badge) badge.classList.remove('hidden');
  }

  if (hasNewStoreMessage) {
    triggerCustomerChatPushNotification(latestStoreMsgText);
  }
}

function escapeHtmlApp(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerCustomerChatPushNotification(text) {
  try {
    if (window.Store && window.Store.playNotificationSound) {
      window.Store.playNotificationSound();
    }
  } catch (e) {}

  const title = "💬 Rotta do Açaí respondeu:";
  const body = text || "Nova mensagem do atendimento!";

  if (!_isChatModalOpen && typeof showToast === 'function') {
    showToast(`💬 Rotta do Açaí: "${body}"`);
  }

  if ("Notification" in window && Notification.permission === "granted") {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: body,
          icon: "assets/logo.jpg",
          badge: "assets/logo.jpg",
          vibrate: [300, 100, 300, 100, 300],
          tag: "rotta-chat-" + Date.now(),
          data: { url: "index.html?openChat=true" }
        });
      }).catch(() => {});
    } else {
      try {
        new Notification(title, {
          body: body,
          icon: "assets/logo.jpg"
        });
      } catch (e) {}
    }
  }
}

setTimeout(() => {
  if (typeof initCustomerChatListener === 'function') {
    initCustomerChatListener();
  }
}, 2000);

