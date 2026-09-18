/**
 * ROTTA DO AÇAÍ - STORE & DATA LAYER
 * Versão 2.0 com Firebase Realtime Database para sincronização entre dispositivos.
 * Pedidos em tempo real! Funciona de qualquer celular ou computador do mundo.
 */

// ==========================================
// CONFIGURAÇÃO DO FIREBASE (Google)
// ==========================================
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

// ==========================================
// DADOS ESTÁTICOS (LocalStorage - não precisam de sync entre devices)
// ==========================================
const STORAGE_KEYS = {
  CONFIG: 'rotta_config',
  PRODUCTS: 'rotta_products_v4',
  BASES: 'rotta_bases_v4',
  FREE_TOPPINGS: 'rotta_free_toppings_v4',
  FRUITS: 'rotta_fruits_v4'
};

const DEFAULT_CONFIG = {
  name: 'Rotta do Açaí',
  slogan: 'O sabor que conquista seu dia!',
  phone: '5511999999999',
  pixKey: 'rotta.acai.pix@gmail.com (Chave E-mail ou Celular)',
  pixReceiver: 'Rotta do Açaí',
  estimatedTime: '30 a 50 min',
  isOpen: true,
  address: 'Rua Principal, 123 - Centro'
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

const DEFAULT_BASES = [
  { id: 'base-trad', name: 'Açaí Tradicional Cremoso (Receita da Casa)', extraPrice: 0, available: true },
  { id: 'base-trufado', name: 'Açaí Trufado com Chocolate', extraPrice: 3.00, available: true },
  { id: 'base-cupuacu', name: 'Cupuaçu Puro Cremoso do Pará', extraPrice: 2.00, available: true },
  { id: 'base-meio', name: 'Meio a Meio (Açaí Tradicional + Cupuaçu)', extraPrice: 1.50, available: true },
  { id: 'base-zero', name: 'Açaí Zero Adição de Açúcar (Fit)', extraPrice: 2.50, available: true }
];

const DEFAULT_FRUITS = [
  { id: 'fruta-morango', name: 'Morango Fresco', available: true, icon: '🍓', image: '' },
  { id: 'fruta-banana', name: 'Banana Fatiada', available: true, icon: '🍌', image: '' },
  { id: 'fruta-kiwi', name: 'Kiwi em Fatias', available: true, icon: '🥝', image: '' },
  { id: 'fruta-uva', name: 'Uva Sem Semente', available: true, icon: '🍇', image: '' },
  { id: 'fruta-manga', name: 'Manga em Cubos', available: true, icon: '🥭', image: '' }
];

const DEFAULT_FREE_TOPPINGS = [
  { id: 'top-leite-po', name: 'Leite em Pó (Ninho)', available: true, image: '' },
  { id: 'top-leite-cond', name: 'Leite Condensado Moça', available: true, image: '' },
  { id: 'top-granola', name: 'Granola Tradicional Crocante', available: true, image: '' },
  { id: 'top-aveia', name: 'Aveia em Flocos Finos', available: true, image: '' },
  { id: 'top-pacoca', name: 'Farinha de Paçoca Doce', available: true, image: '' },
  { id: 'top-mel', name: 'Mel de Abelha Puro', available: true, image: '' },
  { id: 'top-chocoball', name: 'Chocoball Crocante', available: true, image: '' },
  { id: 'top-gotas', name: 'Gotas de Chocolate Nobre', available: true, image: '' },
  { id: 'top-confetes', name: 'Confetes de Chocolate', available: true, image: '' }
];

// ==========================================
// FIREBASE & STORE
// ==========================================
let _db = null;
let _ordersCache = {}; 
let _orderCount = 0;   
let _currentConfig = DEFAULT_CONFIG;
let _stockCache = {
  products: null,
  bases: null,
  toppings: null,
  fruits: null
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

  // ---------- Inicialização ----------
  init() {
    try {
      const savedCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedCfg) _currentConfig = { ...DEFAULT_CONFIG, ...JSON.parse(savedCfg) };
      else localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));

      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      if (!localStorage.getItem(STORAGE_KEYS.BASES)) localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(DEFAULT_BASES));
      if (!localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS)) localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(DEFAULT_FREE_TOPPINGS));
      if (!localStorage.getItem(STORAGE_KEYS.FRUITS)) localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(DEFAULT_FRUITS));
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }
    // Inicializa conexão com Firebase
    getDB();
  },

  // ---------- Configurações (Sincronizadas via Firebase) ----------
  getConfig() {
    return _currentConfig || DEFAULT_CONFIG;
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
        // Se ainda não existir no Firebase, inicializa com o atual
        db.ref('config').set(_currentConfig);
        if (callback) callback(_currentConfig);
      }
    }, error => {
      console.warn('Erro no listener de config do Firebase:', error);
      if (callback) callback(_currentConfig);
    });
  },

  // ---------- Estoque & Cardápio (Sincronizados via Firebase) ----------
  getProducts() {
    if (_stockCache.products && _stockCache.products.length > 0) return _stockCache.products;
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
      if (Array.isArray(p) && p.length > 0) return p;
    } catch {}
    return DEFAULT_PRODUCTS;
  },

  saveProducts(products) {
    _stockCache.products = products;
    try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/products').set(products);
  },

  getBases() {
    if (_stockCache.bases && _stockCache.bases.length > 0) return _stockCache.bases;
    try {
      const b = JSON.parse(localStorage.getItem(STORAGE_KEYS.BASES));
      if (Array.isArray(b) && b.length > 0) return b;
    } catch {}
    return DEFAULT_BASES;
  },

  saveBases(bases) {
    _stockCache.bases = bases;
    try { localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(bases)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/bases').set(bases);
  },

  getFreeToppings() {
    if (_stockCache.toppings && _stockCache.toppings.length > 0) return _stockCache.toppings;
    try {
      const f = JSON.parse(localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS));
      if (Array.isArray(f) && f.length > 0) return f;
    } catch {}
    return DEFAULT_FREE_TOPPINGS;
  },

  saveFreeToppings(toppings) {
    _stockCache.toppings = toppings;
    try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(toppings)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/toppings').set(toppings);
  },

  getFruits() {
    if (_stockCache.fruits && _stockCache.fruits.length > 0) return _stockCache.fruits;
    try {
      const a = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRUITS));
      if (Array.isArray(a) && a.length > 0) return a;
    } catch {}
    return DEFAULT_FRUITS;
  },

  saveFruits(fruits) {
    _stockCache.fruits = fruits;
    try { localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(fruits)); } catch {}
    const db = getDB();
    if (db) db.ref('stock/fruits').set(fruits);
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
        if (data.products) { _stockCache.products = data.products; try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(data.products)); } catch {} }
        if (data.bases) { _stockCache.bases = data.bases; try { localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(data.bases)); } catch {} }
        if (data.toppings) { _stockCache.toppings = data.toppings; try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(data.toppings)); } catch {} }
        if (data.fruits) { _stockCache.fruits = data.fruits; try { localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(data.fruits)); } catch {} }
        if (callback) callback();
      }
    });
  },

  // ==============================================
  // PEDIDOS - 100% Firebase Realtime Database
  // Funciona entre QUALQUER celular ou computador!
  // ==============================================

  async createOrder(orderData) {
    const db = getDB();
    const now = new Date();
    const orderNumber = '#' + (101 + _orderCount);

    const newOrder = {
      orderNumber,
      createdAt: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: now.toLocaleDateString('pt-BR'),
      status: 'preparo', // Aceite automático: entra direto em preparo na cozinha!
      customer: orderData.customer,
      items: orderData.items,
      deliveryType: orderData.deliveryType,
      address: orderData.address || null,
      paymentMethod: orderData.paymentMethod,
      paymentChange: orderData.paymentChange || null,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee || 0,
      total: orderData.total,
      notes: orderData.notes || ''
    };

    // Salva no Firebase e aguarda confirmação
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

  // Escuta pedidos em TEMPO REAL do Firebase
  listenToOrders(onNewOrder, onOrderChanged, onError) {
    const db = getDB();
    let _isFirstLoad = true;
    let _knownKeys = new Set();

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
        // Primeiro carregamento: popula o cache silenciosamente
        _ordersCache = newCache;
        _knownKeys = newKeys;
        _orderCount = Object.keys(newCache).length;
        _isFirstLoad = false;
        if (onNewOrder) onNewOrder(null); // sinal de carga inicial com sucesso
        return;
      }

      // Detecta pedidos NOVOS (chaves que não existiam antes)
      newKeys.forEach(key => {
        if (!_knownKeys.has(key)) {
          if (onNewOrder) onNewOrder(newCache[key]);
        }
      });

      _ordersCache = newCache;
      _knownKeys = newKeys;
      _orderCount = Object.keys(newCache).length;

      // Notifica mudanças (status, remoções, etc.)
      if (onOrderChanged) onOrderChanged(null);
    }, error => {
      console.error('Firebase listenToOrders error:', error);
      if (onError) onError(error);
    });
  },

  // Escuta status de um pedido específico (usado na tela do cliente para rastreio)
  listenToOrder(orderId, callback) {
    const db = getDB();
    db.ref('orders/' + orderId).on('value', snapshot => {
      if (snapshot.exists() && callback) {
        callback(snapshot.val());
      }
    });
  },

  stopListeningToOrder(orderId) {
    const db = getDB();
    db.ref('orders/' + orderId).off();
  },

  // Mantido para compatibilidade (não usado mais ativamente)
  broadcast() {},
  onSync() {},

  // ---------- Áudio de Notificação (Web Audio API) ----------
  playNotificationSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.35, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playTone(587.33, 0.0, 0.25);
      playTone(739.99, 0.15, 0.3);
      playTone(880.00, 0.32, 0.6);
    } catch (e) {
      console.warn('Áudio não disponível:', e);
    }
  },

  // ---------- Formatador de Moeda ----------
  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  },

  // ---------- Formatador de Telefone WhatsApp ----------
  formatWhatsAppPhone(phone) {
    if (!phone) return '5511999999999';
    let clean = ('' + phone).replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }
    return clean;
  }
};
