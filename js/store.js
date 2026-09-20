/**
 * ROTTA DO AÇAÍ - STORE & DATA LAYER
 * Versão 2.0 com Firebase Realtime Database para sincronização entre dispositivos.
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAaHO4ZemS5SCw42SxC-ekHsHcW1nlazhg",
  authDomain: "rotta-do-acai.firebaseapp.com",
  databaseURL: "https://rotta-do-acai-default-rtdb.firebaseio.com",
  projectId: "rotta-do-acai",
  storageBucket: "rotta-do-acai.firebasestorage.app",
  messagingSenderId: "974745460161",
  appId: "1:974745460161:web:92ff4dfbde68f1cecb2340",
  measurementId: "G-VB785L6695"
};

const STORAGE_KEYS = {
  CONFIG: 'rotta_config',
  PRODUCTS: 'rotta_products_v4',
  BASES: 'rotta_bases_v4',
  FREE_TOPPINGS: 'rotta_free_toppings_v4',
  FRUITS: 'rotta_fruits_v4',
  CALDAS: 'rotta_caldas_v4',
  CUSTOMER: 'rotta_customer_data',
  MY_ORDERS: 'rotta_my_orders_v1',
  FAVORITES: 'rotta_favorites_v1',
  RATED_ORDERS: 'rotta_rated_orders_v1'
};

const DEFAULT_CONFIG = {
  name: 'Rotta do Açaí',
  slogan: 'O sabor que conquista seu dia!',
  phone: '5511999999999',
  pixKey: '4b93bf67-9a91-4ffc-951c-ddd12184e042',
  pixReceiver: 'KEVILLYN MARTINS DOS SANTOS (Banco Inter)',
  pixQrImage: 'assets/pix_qr.jpg',
  estimatedTime: '30 a 50 min',
  isOpen: true,
  address: 'Rua Principal, 123 - Centro',
  businessHours: 'Terça a Domingo - 14:00 às 22:00'
};

const DEFAULT_PRODUCTS = [
  { id: 'copo-300', name: 'Copo Tradicional 300ml', category: 'copos', price: 16.00, description: 'Tamanho ideal para matar a vontade. Inclui até 3 frutas e 3 complementos!', freeFruitLimit: 3, freeToppingLimit: 3, allowsCustomization: true, available: true, badge: 'Popular', icon: '🍧', image: '' },
  { id: 'copo-500', name: 'Copo Tradicional 500ml', category: 'copos', price: 22.00, description: 'O queridinho da galera! Inclui até 3 frutas e 4 complementos!', freeFruitLimit: 3, freeToppingLimit: 4, allowsCustomization: true, available: true, badge: 'Mais Pedido ⭐', icon: '🍧', image: '' },
  { id: 'copo-770', name: 'Copo Gigante 770ml', category: 'copos', price: 28.00, description: 'Para quem ama açaí de verdade! Acompanha até 3 frutas e 5 complementos.', freeFruitLimit: 3, freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Top!', icon: '🍨', image: '' },
  { id: 'pote-1000', name: 'Pote Família 1 Litro', category: 'copos', price: 38.00, description: 'Açaí super cremoso para dividir com quem você ama. Inclui até 3 frutas e 5 complementos!', freeFruitLimit: 3, freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Família', icon: '🪣', image: '' },
  { id: 'barca-especial', name: 'Barca Especial Rotta (1,2kg)', category: 'especiais', price: 49.90, description: 'Barca recheada com açaí. Escolha seus acompanhamentos!', freeFruitLimit: 5, freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Gourmet 🍫', icon: '⛵', image: '' },
  { id: 'roletta-degustacao', name: 'Roleta de Sabores Rotta', category: 'especiais', price: 56.00, description: '6 potinhos com açaí e coberturas diferentes!', freeFruitLimit: 4, freeToppingLimit: 4, allowsCustomization: true, available: true, badge: 'Novidade', icon: '🎡', image: '' },
  { id: 'bebida-agua', name: 'Água Mineral sem Gás 500ml', category: 'bebidas', price: 4.00, description: 'Garrafinha 500ml gelada.', allowsCustomization: false, available: true, icon: '💧', image: '' },
  { id: 'bebida-refri', name: 'Refrigerante em Lata 350ml', category: 'bebidas', price: 6.00, description: 'Coca-Cola, Guaraná Antarctica ou Fanta geladinhos.', allowsCustomization: false, available: true, icon: '🥤', image: '' },
  { id: 'suco-laranja', name: 'Suco Natural de Laranja 400ml', category: 'bebidas', price: 9.00, description: '100% fruta natural feito na hora.', allowsCustomization: false, available: true, icon: '🍊', image: '' }
];

const DEFAULT_BASES = [];

const DEFAULT_FRUITS = [
  { id: 'fruta-morango', name: 'Morango Fresco', available: true, icon: '🍓', image: '' },
  { id: 'fruta-banana', name: 'Banana Fatiada', available: true, icon: '🍌', image: '' },
  { id: 'fruta-kiwi', name: 'Kiwi em Fatias', available: true, icon: '🥝', image: '' },
  { id: 'fruta-uva', name: 'Uva Sem Semente', available: true, icon: '🍇', image: '' },
  { id: 'fruta-manga', name: 'Manga em Cubos', available: true, icon: '🥭', image: '' }
];

const DEFAULT_FREE_TOPPINGS = [
  { id: 'top-leite-po', name: 'Leite em Pó (Ninho)', available: true, icon: '🥛', image: '' },
  { id: 'top-granola', name: 'Granola Tradicional', available: true, icon: '🌾', image: '' },
  { id: 'top-aveia', name: 'Aveia em Flocos', available: true, icon: '🥣', image: '' },
  { id: 'top-pacoca', name: 'Farinha de Paçoca', available: true, icon: '🥜', image: '' },
  { id: 'top-chocoball', name: 'Chocoball', available: true, icon: '🍫', image: '' },
  { id: 'top-gotas', name: 'Gotas de Chocolate', available: true, icon: '🍫', image: '' },
  { id: 'top-confetes', name: 'Confetes de Chocolate', available: true, icon: '🍬', image: '' }
];

const DEFAULT_CALDAS = [
  { id: 'calda-leite-cond', name: 'Leite Condensado', available: true, icon: '🍯', image: '' },
  { id: 'calda-sem-calda', name: 'Não Querer (Sem Calda)', available: true, icon: '🚫', image: '' },
  { id: 'calda-chocolate', name: 'Cobertura de Chocolate', available: true, icon: '🍫', image: '' },
  { id: 'calda-morango', name: 'Cobertura de Morango', available: true, icon: '🍓', image: '' },
  { id: 'calda-mel', name: 'Mel de Abelha', available: true, icon: '🐝', image: '' }
];

let _db = null;
let _ordersCache = {};
let _orderCount = 0;
let _currentConfig = DEFAULT_CONFIG;
let _stockCache = {
  products: null,
  bases: null,
  toppings: null,
  fruits: null,
  caldas: null
};

function getDB() {
  if (!_db) {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(FIREBASE_CONFIG);
        } else {
          firebase.app();
        }
        _db = firebase.database();
      }
    } catch (e) {
      console.warn('Erro ao inicializar Firebase:', e);
    }
  }
  return _db;
}

window.Store = {
  init() {
    try {
      const savedCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedCfg) _currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedCfg) };
      else localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));

      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      if (!localStorage.getItem(STORAGE_KEYS.BASES)) localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(DEFAULT_BASES));
      if (!localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS)) localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(DEFAULT_FREE_TOPPINGS));
      if (!localStorage.getItem(STORAGE_KEYS.FRUITS)) localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(DEFAULT_FRUITS));
      if (!localStorage.getItem(STORAGE_KEYS.CALDAS)) localStorage.setItem(STORAGE_KEYS.CALDAS, JSON.stringify(DEFAULT_CALDAS));

      // Purgar os dois complementos de leite condensado indesejados
      try {
        const topStr = localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS);
        if (topStr) {
          let list = JSON.parse(topStr);
          if (Array.isArray(list)) {
            list = list.filter(t => {
              const nameLower = (t.name || '').toLowerCase();
              return !nameLower.includes('leite condesado') && !nameLower.includes('sem leite condes');
            });
            localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(list));
            _stockCache.toppings = list;
          }
        }
      } catch (e) {}
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }
    const db = getDB();
    if (db && _stockCache.toppings) {
      db.ref('stock/toppings').set(_stockCache.toppings);
    }
  },

  getDB() {
    return getDB();
  },

  getConfig() {
    return _currentConfig || DEFAULT_CONFIG;
  },

  sendPromotion(promoData) {
    const db = getDB();
    if (!db) return Promise.reject(new Error('Firebase não inicializado'));

    const promoRef = db.ref('promotions').push();
    const payload = {
      id: promoRef.key,
      title: promoData.title,
      message: promoData.message,
      scheduledTime: promoData.scheduledTime || null,
      createdAt: Date.now()
    };

    return promoRef.set(payload);
  },

  deletePromotion(promoId) {
    const db = getDB();
    if (!db) return Promise.reject(new Error('Firebase não inicializado'));
    return db.ref('promotions/' + promoId).remove();
  },

  clearAllPromotions() {
    const db = getDB();
    if (!db) return Promise.reject(new Error('Firebase não inicializado'));
    return db.ref('promotions').remove();
  },

  listenToPromotions(callback) {
    const db = getDB();
    if (!db) return;

    db.ref('promotions').on('child_added', snapshot => {
      if (snapshot.exists() && callback) {
        callback(snapshot.val());
      }
    });
  },

  saveConfig(config) {
    _currentConfig = { ...DEFAULT_CONFIG, ...config };
    try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(_currentConfig)); } catch {}
    const db = getDB();
    if (db) {
      return db.ref('config').set(_currentConfig);
    }
    return Promise.resolve();
  },

  listenToConfig(callback) {
    const db = getDB();
    if (!db) {
      if (callback) callback(_currentConfig);
      return;
    }

    db.ref('config').on('value', snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        _currentConfig = { ...DEFAULT_CONFIG, ...val };
        try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(_currentConfig)); } catch {}
        if (callback) callback(_currentConfig);
      } else {
        db.ref('config').set(_currentConfig);
        if (callback) callback(_currentConfig);
      }
    }, error => {
      console.warn('Erro no listener de config do Firebase:', error);
      if (callback) callback(_currentConfig);
    });
  },

  getProducts() {
    if (_stockCache.products !== null && _stockCache.products !== undefined) {
      return _stockCache.products.map(item => ({ ...item, available: item.available !== false }));
    }
    try {
      const p = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (p !== null) {
        const parsed = JSON.parse(p);
        if (Array.isArray(parsed)) {
          _stockCache.products = parsed;
          return parsed.map(item => ({ ...item, available: item.available !== false }));
        }
      }
    } catch {}
    return DEFAULT_PRODUCTS.map(item => ({ ...item, available: item.available !== false }));
  },

  saveProducts(products) {
    _stockCache.products = products || [];
    try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(_stockCache.products)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/products').set(_stockCache.products);
  },

  getBases() {
    return [];
  },

  saveBases(bases) {
    _stockCache.bases = [];
  },

  getFreeToppings() {
    let list = DEFAULT_FREE_TOPPINGS;
    if (_stockCache.toppings !== null && _stockCache.toppings !== undefined) {
      list = _stockCache.toppings;
    } else {
      try {
        const f = localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS);
        if (f !== null) {
          const parsed = JSON.parse(f);
          if (Array.isArray(parsed)) {
            _stockCache.toppings = parsed;
            list = parsed;
          }
        }
      } catch {}
    }
    const cleaned = list.filter(t => {
      const nameLower = (t.name || '').toLowerCase();
      return !nameLower.includes('leite condesado') && !nameLower.includes('sem leite condes');
    });
    return cleaned.map(item => ({ ...item, available: item.available !== false }));
  },

  saveFreeToppings(toppings) {
    const cleaned = (toppings || []).filter(t => {
      const nameLower = (t.name || '').toLowerCase();
      return !nameLower.includes('leite condesado') && !nameLower.includes('sem leite condes');
    });
    _stockCache.toppings = cleaned;
    try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(_stockCache.toppings)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/toppings').set(_stockCache.toppings);
  },

  getFruits() {
    if (_stockCache.fruits !== null && _stockCache.fruits !== undefined) {
      return _stockCache.fruits.map(item => ({ ...item, available: item.available !== false }));
    }
    try {
      const a = localStorage.getItem(STORAGE_KEYS.FRUITS);
      if (a !== null) {
        const parsed = JSON.parse(a);
        if (Array.isArray(parsed)) {
          _stockCache.fruits = parsed;
          return parsed.map(item => ({ ...item, available: item.available !== false }));
        }
      }
    } catch {}
    return DEFAULT_FRUITS.map(item => ({ ...item, available: item.available !== false }));
  },

  saveFruits(fruits) {
    _stockCache.fruits = fruits || [];
    try { localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(_stockCache.fruits)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/fruits').set(_stockCache.fruits);
  },

  getCaldas() {
    if (_stockCache.caldas !== null && _stockCache.caldas !== undefined) {
      return _stockCache.caldas.map(item => ({ ...item, available: item.available !== false }));
    }
    try {
      const c = localStorage.getItem(STORAGE_KEYS.CALDAS);
      if (c !== null) {
        const parsed = JSON.parse(c);
        if (Array.isArray(parsed)) {
          _stockCache.caldas = parsed;
          return parsed.map(item => ({ ...item, available: item.available !== false }));
        }
      }
    } catch {}
    return DEFAULT_CALDAS.map(item => ({ ...item, available: item.available !== false }));
  },

  saveCaldas(caldas) {
    _stockCache.caldas = caldas || [];
    try { localStorage.setItem(STORAGE_KEYS.CALDAS, JSON.stringify(_stockCache.caldas)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/caldas').set(_stockCache.caldas);
  },

  getPaidAddons() {
    return this.getFruits();
  },

  savePaidAddons(addons) {
    return this.saveFruits(addons);
  },

  listenToStock(callback) {
    const db = getDB();
    if (!db) return;

    db.ref('stock').on('value', snapshot => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (data.products !== undefined) {
          _stockCache.products = Array.isArray(data.products) ? data.products : (data.products ? Object.values(data.products) : []);
          try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(_stockCache.products)); } catch {}
        }
        if (data.toppings !== undefined) {
          let list = Array.isArray(data.toppings) ? data.toppings : (data.toppings ? Object.values(data.toppings) : []);
          _stockCache.toppings = list.filter(t => {
            const nameLower = (t.name || '').toLowerCase();
            return !nameLower.includes('leite condesado') && !nameLower.includes('sem leite condes');
          });
          try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(_stockCache.toppings)); } catch {}
        }
        if (data.fruits !== undefined) {
          _stockCache.fruits = Array.isArray(data.fruits) ? data.fruits : (data.fruits ? Object.values(data.fruits) : []);
          try { localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(_stockCache.fruits)); } catch {}
        }
        if (data.caldas !== undefined) {
          _stockCache.caldas = Array.isArray(data.caldas) ? data.caldas : (data.caldas ? Object.values(data.caldas) : []);
          try { localStorage.setItem(STORAGE_KEYS.CALDAS, JSON.stringify(_stockCache.caldas)); } catch {}
        }
        if (callback) callback();
      }
    });
  },

  async createOrder(orderData) {
    const db = getDB();
    const now = new Date();
    const orderNumber = '#' + (101 + _orderCount);

    const newOrder = {
      orderNumber,
      createdAt: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: now.toLocaleDateString('pt-BR'),
      status: 'preparo',
      customer: orderData.customer,
      items: orderData.items,
      deliveryType: orderData.deliveryType,
      address: orderData.address || null,
      paymentMethod: orderData.paymentMethod,
      paymentChange: orderData.paymentChange || null,
      subtotal: orderData.subtotal,
      deliveryFee: 0,
      total: orderData.total,
      notes: orderData.notes || ''
    };

    const ref = db.ref('orders').push();
    newOrder.id = ref.key;
    await ref.set(newOrder);

    return newOrder;
  },

  updateOrderStatus(orderId, newStatus) {
    const db = getDB();
    return db.ref('orders/' + orderId).update({
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
  },

  getOrderById(orderId) {
    return _ordersCache[orderId] || null;
  },

  getOrdersArray() {
    return Object.values(_ordersCache).sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  },

  clearConcludedOrders() {
    const db = getDB();
    const toDelete = Object.values(_ordersCache).filter(o => o.status === 'concluido');
    toDelete.forEach(order => {
      db.ref('orders/' + order.id).remove();
    });
  },

  listenToOrders(onNewOrder, onOrderChanged, onError) {
    const db = getDB();
    let _isFirstLoad = true;
    let _knownKeys = new Set();

    if (!db) {
      if (onError) onError(new Error("Firebase indisponível"));
      return;
    }

    db.ref('orders').on('value', snapshot => {
      const newCache = {};
      const newKeys = new Set();

      if (snapshot.exists()) {
        snapshot.forEach(child => {
          newCache[child.key] = child.val();
          newKeys.add(child.key);
        });
      }

      if (_isFirstLoad) {
        _ordersCache = newCache;
        _knownKeys = newKeys;
        _orderCount = Object.keys(newCache).length;
        _isFirstLoad = false;
        if (onNewOrder) onNewOrder(null);
        return;
      }

      newKeys.forEach(key => {
        if (!_knownKeys.has(key)) {
          if (onNewOrder) onNewOrder(newCache[key]);
        }
      });

      _ordersCache = newCache;
      _knownKeys = newKeys;
      _orderCount = Object.keys(newCache).length;

      if (onOrderChanged) onOrderChanged(_ordersCache);
    }, error => {
      console.warn('Erro no listener de pedidos do Firebase:', error);
      if (onError) onError(error);
    });
  },

  listenToOrder(orderId, callback) {
    const db = getDB();
    if (!db) return;

    db.ref('orders/' + orderId).on('value', snapshot => {
      if (snapshot.exists() && callback) {
        callback(snapshot.val());
      }
    });
  },

  formatCurrency(val) {
    return (val || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  formatWhatsAppPhone(phone) {
    if (!phone) return '5511999999999';
    let clean = phone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    return clean;
  },

  playNotificationSound() {
    try {
      if (navigator.vibrate) {
        try { navigator.vibrate([200, 100, 200, 100, 200]); } catch {}
      }

      if (!window._sharedAudioCtx) {
        window._sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = window._sharedAudioCtx;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn('Áudio não permitido pelo navegador:', e);
    }
  },

  getSavedCustomer() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMER);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  saveCustomer(data) {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER, JSON.stringify(data));
    } catch {}
  },

  getMyOrders() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  addMyOrder(orderId) {
    try {
      const list = this.getMyOrders();
      if (!list.includes(orderId)) {
        list.unshift(orderId);
        localStorage.setItem(STORAGE_KEYS.MY_ORDERS, JSON.stringify(list.slice(0, 30)));
      }
    } catch {}
  },

  getFavorites() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveFavorite(favorite) {
    try {
      const list = this.getFavorites();
      if (list.length >= 3) {
        alert("⚠️ Você já possui 3 Açaís Favoritos salvos! Por favor desmarque/exclua um dos favoritos antes de salvar este novo.");
        return null;
      }
      list.unshift(favorite);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(list));
      return list;
    } catch { return []; }
  },

  removeFavorite(favId) {
    try {
      let list = this.getFavorites();
      list = list.filter(f => f.id !== favId);
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(list));
      return list;
    } catch { return []; }
  },

  deleteProduct(productId) {
    let products = this.getProducts().filter(p => p.id !== productId);
    this.saveProducts(products);
    return products;
  },

  deleteFruit(fruitId) {
    let fruits = this.getFruits().filter(f => f.id !== fruitId);
    this.saveFruits(fruits);
    return fruits;
  },

  deleteFreeTopping(toppingId) {
    let toppings = this.getFreeToppings().filter(t => t.id !== toppingId);
    this.saveFreeToppings(toppings);
    return toppings;
  },

  deleteCalda(caldaId) {
    let caldas = this.getCaldas().filter(c => c.id !== caldaId);
    this.saveCaldas(caldas);
    return caldas;
  },

  addProduct(product) {
    let products = this.getProducts();
    const item = {
      ...product,
      id: product.id || 'prod_' + Date.now(),
      available: product.available !== false
    };
    products.push(item);
    this.saveProducts(products);
    return products;
  },

  addFruit(fruit) {
    let fruits = this.getFruits();
    const item = {
      ...fruit,
      id: fruit.id || 'fruit_' + Date.now(),
      available: fruit.available !== false
    };
    fruits.push(item);
    this.saveFruits(fruits);
    return fruits;
  },

  addFreeTopping(topping) {
    let toppings = this.getFreeToppings();
    const item = {
      ...topping,
      id: topping.id || 'top_' + Date.now(),
      available: topping.available !== false
    };
    toppings.push(item);
    this.saveFreeToppings(toppings);
    return toppings;
  },

  addCalda(calda) {
    let caldas = this.getCaldas();
    const item = {
      ...calda,
      id: calda.id || 'calda_' + Date.now(),
      available: calda.available !== false
    };
    caldas.push(item);
    this.saveCaldas(caldas);
    return caldas;
  },

  // --- AVALIAÇÕES (RATINGS) ---
  getRatedOrdersLocally() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RATED_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  markOrderAsRatedLocally(orderId) {
    try {
      const list = this.getRatedOrdersLocally();
      if (!list.includes(orderId)) {
        list.push(orderId);
        localStorage.setItem(STORAGE_KEYS.RATED_ORDERS, JSON.stringify(list));
      }
    } catch {}
  },

  saveRating(ratingData) {
    const db = getDB();
    if (!db) return Promise.reject(new Error('Firebase não inicializado'));

    const targetOrderId = ratingData.orderId || ('order_' + Date.now());

    const ratingRef = db.ref('ratings').push();
    const payload = {
      id: ratingRef.key,
      orderId: targetOrderId,
      orderNumber: ratingData.orderNumber || '#',
      customerName: ratingData.customerName || 'Cliente',
      customerPhone: ratingData.customerPhone || '',
      stars: ratingData.stars || 5,
      comment: ratingData.comment || '',
      createdAt: Date.now()
    };

    this.markOrderAsRatedLocally(targetOrderId);

    // Salvar no nó ratings e atualizar nó orders
    const updates = {};
    updates['ratings/' + payload.id] = payload;
    if (ratingData.orderId) {
      updates['orders/' + ratingData.orderId + '/rated'] = true;
      updates['orders/' + ratingData.orderId + '/rating'] = {
        stars: payload.stars,
        comment: payload.comment,
        createdAt: payload.createdAt
      };
    }

    return db.ref().update(updates);
  },

  deleteRating(ratingId) {
    const db = getDB();
    if (!db) return Promise.reject(new Error('Firebase não inicializado'));
    return db.ref('ratings/' + ratingId).remove();
  },

  listenToRatings(callback) {
    const db = getDB();
    if (!db) return;

    db.ref('ratings').on('value', snapshot => {
      const val = snapshot.exists() ? snapshot.val() : {};
      if (callback) callback(val);
    });
  }
};
