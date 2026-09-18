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
  PRODUCTS: 'rotta_products',
  BASES: 'rotta_bases',
  FREE_TOPPINGS: 'rotta_free_toppings',
  PAID_ADDONS: 'rotta_paid_addons'
};

const DEFAULT_CONFIG = {
  name: 'Rotta do Açaí',
  slogan: 'O sabor que conquista seu dia!',
  phone: '5511999999999',
  pixKey: 'rotta.acai.pix@gmail.com (Chave E-mail ou Celular)',
  pixReceiver: 'Rotta do Açaí',
  deliveryFee: 6.00,
  minOrder: 15.00,
  estimatedTime: '30 a 50 min',
  isOpen: true,
  address: 'Rua Principal, 123 - Centro'
};

const DEFAULT_PRODUCTS = [
  { id: 'copo-300', name: 'Copo Tradicional 300ml', category: 'copos', price: 16.00, description: 'Tamanho ideal para matar a vontade. Inclui até 3 acompanhamentos tradicionais grátis!', freeToppingLimit: 3, allowsCustomization: true, available: true, badge: 'Popular', icon: '🍧' },
  { id: 'copo-500', name: 'Copo Tradicional 500ml', category: 'copos', price: 22.00, description: 'O queridinho da galera! Muito sabor e cremosidade. Inclui até 3 acompanhamentos grátis!', freeToppingLimit: 3, allowsCustomization: true, available: true, badge: 'Mais Pedido ⭐', icon: '🍧' },
  { id: 'copo-700', name: 'Copo Gigante 700ml', category: 'copos', price: 28.00, description: 'Para quem ama açaí de verdade! Acompanha até 4 opções tradicionais grátis.', freeToppingLimit: 4, allowsCustomization: true, available: true, badge: 'Top!', icon: '🍨' },
  { id: 'pote-1000', name: 'Pote Família 1 Litro', category: 'copos', price: 38.00, description: 'Açaí super cremoso para dividir com quem você ama. Inclui até 5 acompanhamentos grátis!', freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Família', icon: '🪣' },
  { id: 'barca-especial', name: 'Barca Especial Rotta (1,2kg)', category: 'especiais', price: 49.90, description: 'Barca recheada com açaí, morangos frescos, Nutella pura, banana fatiada, leite ninho e bombom!', freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Gourmet 🍫', icon: '⛵' },
  { id: 'roletta-degustacao', name: 'Roleta de Sabores Rotta', category: 'especiais', price: 56.00, description: '6 potinhos com açaí e 5 coberturas diferentes para você montar como quiser!', freeToppingLimit: 4, allowsCustomization: true, available: true, badge: 'Novidade', icon: '🎡' },
  { id: 'bebida-agua', name: 'Água Mineral sem Gás 500ml', category: 'bebidas', price: 4.00, description: 'Garrafinha 500ml gelada.', allowsCustomization: false, available: true, icon: '💧' },
  { id: 'bebida-refri', name: 'Refrigerante em Lata 350ml', category: 'bebidas', price: 6.00, description: 'Coca-Cola, Guaraná Antarctica ou Fanta geladinhos.', allowsCustomization: false, available: true, icon: '🥤' },
  { id: 'suco-laranja', name: 'Suco Natural de Laranja 400ml', category: 'bebidas', price: 9.00, description: '100% fruta natural feito na hora.', allowsCustomization: false, available: true, icon: '🍊' }
];

const DEFAULT_BASES = [
  { id: 'base-trad', name: 'Açaí Tradicional Cremoso (Receita da Casa)', extraPrice: 0, available: true },
  { id: 'base-trufado', name: 'Açaí Trufado com Chocolate', extraPrice: 3.00, available: true },
  { id: 'base-cupuacu', name: 'Cupuaçu Puro Cremoso do Pará', extraPrice: 2.00, available: true },
  { id: 'base-meio', name: 'Meio a Meio (Açaí Tradicional + Cupuaçu)', extraPrice: 1.50, available: true },
  { id: 'base-zero', name: 'Açaí Zero Adição de Açúcar (Fit)', extraPrice: 2.50, available: true }
];

const DEFAULT_FREE_TOPPINGS = [
  { id: 'top-leite-po', name: 'Leite em Pó (Ninho)', available: true },
  { id: 'top-leite-cond', name: 'Leite Condensado Moça', available: true },
  { id: 'top-granola', name: 'Granola Tradicional Crocante', available: true },
  { id: 'top-banana', name: 'Banana Fatiada Fresquinha', available: true },
  { id: 'top-aveia', name: 'Aveia em Flocos Finos', available: true },
  { id: 'top-pacoca', name: 'Farinha de Paçoca Doce', available: true },
  { id: 'top-mel', name: 'Mel de Abelha Puro', available: true }
];

const DEFAULT_PAID_ADDONS = [
  { id: 'add-morango', name: 'Morango Fresco Selecionado', price: 4.50, available: true, icon: '🍓' },
  { id: 'add-nutella', name: 'Nutella Ferrero Original', price: 5.50, available: true, icon: '🍫' },
  { id: 'add-ouro-branco', name: 'Bombom Ouro Branco Picado', price: 3.50, available: true, icon: '🍬' },
  { id: 'add-sonho-valsa', name: 'Bombom Sonho de Valsa Picado', price: 3.50, available: true, icon: '🍬' },
  { id: 'add-kitkat', name: 'KitKat Picadinho Crocante', price: 4.00, available: true, icon: '🍫' },
  { id: 'add-creme-ninho', name: 'Creme Trufado de Leite Ninho', price: 4.50, available: true, icon: '🥛' },
  { id: 'add-gotas-choc', name: 'Gotas de Chocolate Nobre', price: 3.00, available: true, icon: '✨' },
  { id: 'add-kiwi', name: 'Kiwi Fresco em Fatias', price: 4.00, available: true, icon: '🥝' },
  { id: 'add-mms', name: 'Confetes de Chocolate (estilo M&M)', price: 3.00, available: true, icon: '🌈' },
  { id: 'add-chocoball', name: 'Chocoball Crocante', price: 2.50, available: true, icon: '⚪' }
];

// ==========================================
// FIREBASE & STORE
// ==========================================
let _db = null;
let _ordersCache = {}; // cache local dos pedidos (preenchido pelo Firebase)
let _orderCount = 0;   // contador para numerar pedidos

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
      if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
      if (!localStorage.getItem(STORAGE_KEYS.BASES)) localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(DEFAULT_BASES));
      if (!localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS)) localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(DEFAULT_FREE_TOPPINGS));
      if (!localStorage.getItem(STORAGE_KEYS.PAID_ADDONS)) localStorage.setItem(STORAGE_KEYS.PAID_ADDONS, JSON.stringify(DEFAULT_PAID_ADDONS));
    } catch (e) {
      console.warn('LocalStorage inacessível:', e);
    }
    // Inicializa conexão com Firebase em background
    getDB();
  },

  // ---------- Configurações ----------
  getConfig() {
    try {
      const cfg = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG));
      return cfg && typeof cfg === 'object' ? cfg : DEFAULT_CONFIG;
    } catch { return DEFAULT_CONFIG; }
  },
  saveConfig(config) {
    try { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config)); } catch {}
  },

  // ---------- Produtos (sempre retorna lista com itens) ----------
  getProducts() {
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS));
      if (Array.isArray(p) && p.length > 0) return p;
      return DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },
  saveProducts(products) {
    try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); } catch {}
  },

  // ---------- Bases ----------
  getBases() {
    try {
      const b = JSON.parse(localStorage.getItem(STORAGE_KEYS.BASES));
      if (Array.isArray(b) && b.length > 0) return b;
      return DEFAULT_BASES;
    } catch { return DEFAULT_BASES; }
  },
  saveBases(bases) {
    try { localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(bases)); } catch {}
  },

  // ---------- Acompanhamentos Grátis ----------
  getFreeToppings() {
    try {
      const f = JSON.parse(localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS));
      if (Array.isArray(f) && f.length > 0) return f;
      return DEFAULT_FREE_TOPPINGS;
    } catch { return DEFAULT_FREE_TOPPINGS; }
  },
  saveFreeToppings(toppings) {
    try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(toppings)); } catch {}
  },

  // ---------- Adicionais Pagos ----------
  getPaidAddons() {
    try {
      const a = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAID_ADDONS));
      if (Array.isArray(a) && a.length > 0) return a;
      return DEFAULT_PAID_ADDONS;
    } catch { return DEFAULT_PAID_ADDONS; }
  },
  savePaidAddons(addons) {
    try { localStorage.setItem(STORAGE_KEYS.PAID_ADDONS, JSON.stringify(addons)); } catch {}
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
      status: 'novo',
      customer: orderData.customer,
      items: orderData.items,
      deliveryType: orderData.deliveryType,
      address: orderData.address || null,
      paymentMethod: orderData.paymentMethod,
      paymentChange: orderData.paymentChange || null,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
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
        if (!_knownKeys.has(key) && newCache[key].status === 'novo') {
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
  }
};
