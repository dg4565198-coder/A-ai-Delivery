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
  PRODUCTS: 'rotta_products_v5',
  BASES: 'rotta_bases_v5',
  FREE_TOPPINGS: 'rotta_free_toppings_v5',
  FRUITS: 'rotta_fruits_v5',
  CALDAS: 'rotta_caldas_v5',
  CUSTOMER: 'rotta_customer_data',
  MY_ORDERS: 'rotta_my_orders_v1',
  FAVORITES: 'rotta_favorites_v1',
  RATED_ORDERS: 'rotta_rated_orders_v1',
  ALL_RATINGS: 'rotta_all_ratings_v1',
  FIDELITY_CONFIG: 'rotta_fidelity_config_v1',
  CUSTOMERS: 'rotta_customers_v1'
};

const DEFAULT_FIDELITY_CONFIG = {
  enabled: true,
  levels: [
    { level: 1, cupsRequired: 10, rewardTitle: "Açaí 300ml Grátis", rewardCode: "REWARD_300ML", rewardDescription: "1 Açaí de 300ml completo por nossa conta!" },
    { level: 2, cupsRequired: 25, rewardTitle: "Açaí 500ml Grátis", rewardCode: "REWARD_500ML", rewardDescription: "1 Açaí de 500ml delicioso totalmente grátis!" },
    { level: 3, cupsRequired: 35, rewardTitle: "Açaí 700ml Grátis", rewardCode: "REWARD_700ML", rewardDescription: "1 Açaí de 700ml gigante de presente para você!" }
  ]
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
  businessHours: 'Terça a Domingo • 14:00 às 22:00',
  weeklyHours: {
    segunda: { active: false, hours: 'Fechado' },
    terca: { active: true, hours: '14:00 às 22:00' },
    quarta: { active: true, hours: '14:00 às 22:00' },
    quinta: { active: true, hours: '14:00 às 22:00' },
    sexta: { active: true, hours: '14:00 às 22:00' },
    sabado: { active: true, hours: '14:00 às 22:00' },
    domingo: { active: true, hours: '14:00 às 22:00' }
  }
};

const DEFAULT_PRODUCTS = [
  { id: 'copo-300', name: 'Copo Tradicional 300ml', category: 'copos', price: 16.00, description: 'Tamanho ideal para matar a vontade. Inclui até 3 frutas e 3 complementos!', freeFruitLimit: 3, freeToppingLimit: 3, allowsCustomization: true, available: true, badge: 'Popular', icon: '🍧', image: '' },
  { id: 'copo-500', name: 'Copo Tradicional 500ml', category: 'copos', price: 22.00, description: 'O queridinho da galera! Inclui até 3 frutas e 4 complementos!', freeFruitLimit: 3, freeToppingLimit: 4, allowsCustomization: true, available: true, badge: 'Mais Pedido ⭐', icon: '🍧', image: '' },
  { id: 'copo-770', name: 'Copo Gigante 770ml', category: 'copos', price: 28.00, description: 'Para quem ama açaí de verdade! Acompanha até 3 frutas e 5 complementos.', freeFruitLimit: 3, freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Top!', icon: '🍨', image: '' },
  { id: 'pote-1000', name: 'Pote Família 1 Litro', category: 'copos', price: 38.00, description: 'Açaí super cremoso para dividir com quem você ama. Inclui até 3 frutas e 5 complementos!', freeFruitLimit: 3, freeToppingLimit: 5, allowsCustomization: true, available: true, badge: 'Família', icon: '🪣', image: '' }
];

const DEFAULT_BASES = [];

const DEFAULT_FRUITS = [
  { id: 'fruta-sem-fruta', name: 'Não Querer (Sem Frutas)', available: true, icon: '🚫', image: '' },
  { id: 'fruta-morango', name: 'Morango Fresco', available: true, icon: '🍓', image: '' },
  { id: 'fruta-banana', name: 'Banana Fatiada', available: true, icon: '🍌', image: '' },
  { id: 'fruta-kiwi', name: 'Kiwi em Fatias', available: true, icon: '🥝', image: '' },
  { id: 'fruta-uva', name: 'Uva Sem Semente', available: true, icon: '🍇', image: '' },
  { id: 'fruta-manga', name: 'Manga em Cubos', available: true, icon: '🥭', image: '' }
];

const DEFAULT_FREE_TOPPINGS = [
  { id: 'top-leite-po', name: 'Leite em Pó (Ninho)', available: true, icon: '🥛', image: '' },
  { id: 'top-granola', name: 'Granola Tradicional Crocante', available: true, icon: '🌾', image: '' },
  { id: 'top-pacoca', name: 'Farinha de Paçoca Doce', available: true, icon: '🥜', image: '' },
  { id: 'top-chocoball', name: 'Chocoball Crocante', available: true, icon: '🍫', image: '' },
  { id: 'top-gotas', name: 'Gotas de Chocolate Nobre', available: true, icon: '🍫', image: '' },
  { id: 'top-aveia', name: 'Aveia em Flocos', available: true, icon: '🥣', image: '' },
  { id: 'top-amendoim', name: 'Amendoim Triturado', available: true, icon: '🥜', image: '' },
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

function sendCallMeBotWhatsAppAlert(order) {
  try {
    const phone = '557399643417';
    const apiKey = '1466568';
    
    if (!phone || !apiKey) return;

    const customerName = order.customer ? (order.customer.name || 'Cliente') : 'Cliente';
    const customerPhone = order.customer ? (order.customer.phone || '') : '';
    const totalVal = order.total ? `R$ ${Number(order.total).toFixed(2).replace('.', ',')}` : '';
    const deliveryType = order.deliveryType === 'entrega' ? '🛵 Entrega' : '🏬 Retirada';
    
    let itemsText = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsText = order.items.map(i => `• ${i.quantity || 1}x ${i.title || i.name || 'Açaí'}`).join('\n');
    } else {
      itemsText = '• 1x Açaí';
    }

    const text = `🚨 *NOVO PEDIDO CHEGOU NA LOJA!* 🍇\n\n` +
                 `*Pedido:* ${order.orderNumber || '#'}\n` +
                 `*Cliente:* ${customerName} (${customerPhone})\n` +
                 `*Tipo:* ${deliveryType}\n` +
                 `*Total:* ${totalVal}\n\n` +
                 `*Itens:*\n${itemsText}\n\n` +
                 `👉 Abra o painel da cozinha para aceitar e preparar!`;

    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(text)}&apikey=${apiKey}`;

    fetch(url, { mode: 'no-cors' }).catch(err => console.warn('CallMeBot fetch error:', err));
  } catch (err) {
    console.warn('CallMeBot alert error:', err);
  }
}

function sendTelegramBotNotification(order) {
  try {
    const token = '8861858650:AAG_aPAz8Uwvkxow7q3s1wKI-4Qo_CmefgY';
    const chatId = '8114492362';

    if (!token || !chatId) return;

    const customerName = order.customer ? (order.customer.name || 'Cliente') : 'Cliente';
    const customerPhone = order.customer ? (order.customer.phone || '') : '';
    const totalVal = order.total ? `R$ ${Number(order.total).toFixed(2).replace('.', ',')}` : '';
    const deliveryType = order.deliveryType === 'entrega' ? '🛵 Entrega' : '🏬 Retirada';

    let itemsText = '';
    if (Array.isArray(order.items) && order.items.length > 0) {
      itemsText = order.items.map(i => `• <b>${i.quantity || 1}x ${i.name || i.title || 'Açaí'}</b>`).join('\n');
    } else {
      itemsText = '• <b>1x Açaí</b>';
    }

    const messageHtml = `🚨 <b>NOVO PEDIDO CHEGOU NA LOJA!</b> 🍇\n\n` +
                        `<b>Pedido:</b> ${order.orderNumber || '#'}\n` +
                        `<b>Cliente:</b> ${customerName} (${customerPhone})\n` +
                        `<b>Tipo:</b> ${deliveryType}\n` +
                        `<b>Total:</b> ${totalVal}\n\n` +
                        `<b>Itens:</b>\n${itemsText}\n\n` +
                        `👉 Abra o painel da cozinha para aceitar e preparar!`;

    const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(messageHtml)}&parse_mode=HTML`;

    fetch(url).catch(err => console.warn('Telegram Bot fetch error:', err));
  } catch (err) {
    console.warn('Telegram Bot alert error:', err);
  }
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
    if (db) {
      db.ref('stock').once('value').then(snapshot => {
        if (!snapshot.exists()) {
          db.ref('stock').set({
            products: DEFAULT_PRODUCTS,
            toppings: DEFAULT_FREE_TOPPINGS,
            fruits: DEFAULT_FRUITS,
            caldas: DEFAULT_CALDAS
          });
        }
      }).catch(e => console.warn('Erro ao verificar estoque Firebase:', e));
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
    if (db) return db.ref('stock/products').set(_stockCache.products).catch(e => console.warn('Firebase set stock/products:', e));
    return Promise.resolve();
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
    if (db) return db.ref('stock/toppings').set(_stockCache.toppings).catch(e => console.warn('Firebase set stock/toppings:', e));
    return Promise.resolve();
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
    if (db) return db.ref('stock/fruits').set(_stockCache.fruits).catch(e => console.warn('Firebase set stock/fruits:', e));
    return Promise.resolve();
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
    if (db) return db.ref('stock/caldas').set(_stockCache.caldas).catch(e => console.warn('Firebase set stock/caldas:', e));
    return Promise.resolve();
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
          const remoteProds = Array.isArray(data.products) ? data.products : (data.products ? Object.values(data.products) : []);
          const localProds = _stockCache.products || [];
          _stockCache.products = remoteProds.map(p => {
            if (!p.image) {
              const match = localProds.find(l => l.id === p.id);
              if (match && match.image) p.image = match.image;
            }
            return p;
          });
          try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(_stockCache.products)); } catch {}
        }
        if (data.toppings !== undefined) {
          let list = Array.isArray(data.toppings) ? data.toppings : (data.toppings ? Object.values(data.toppings) : []);
          list = list.filter(t => {
            const nameLower = (t.name || '').toLowerCase();
            return !nameLower.includes('leite condesado') && !nameLower.includes('sem leite condes');
          });

          const localToppings = _stockCache.toppings || [];
          list = list.map(t => {
            if (!t.image) {
              const match = localToppings.find(l => l.id === t.id || (l.name || '').toLowerCase() === (t.name || '').toLowerCase());
              if (match && match.image) t.image = match.image;
            }
            return t;
          });

          _stockCache.toppings = list;
          try { localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(_stockCache.toppings)); } catch {}
        }
        if (data.fruits !== undefined) {
          let list = Array.isArray(data.fruits) ? data.fruits : (data.fruits ? Object.values(data.fruits) : []);
          const localFruits = _stockCache.fruits || [];
          list = list.map(f => {
            if (!f.image) {
              const match = localFruits.find(l => l.id === f.id || (l.name || '').toLowerCase() === (f.name || '').toLowerCase());
              if (match && match.image) f.image = match.image;
            }
            return f;
          });

          _stockCache.fruits = list;
          try { localStorage.setItem(STORAGE_KEYS.FRUITS, JSON.stringify(_stockCache.fruits)); } catch {}
        }
        if (data.caldas !== undefined) {
          const remoteCaldas = Array.isArray(data.caldas) ? data.caldas : (data.caldas ? Object.values(data.caldas) : []);
          const localCaldas = _stockCache.caldas || [];
          _stockCache.caldas = remoteCaldas.map(c => {
            if (!c.image) {
              const match = localCaldas.find(l => l.id === c.id);
              if (match && match.image) c.image = match.image;
            }
            return c;
          });
          try { localStorage.setItem(STORAGE_KEYS.CALDAS, JSON.stringify(_stockCache.caldas)); } catch {}
        }
        if (callback) callback();
      }
    });
  },

  fixDuplicateOrderNumbers(ordersObj) {
    if (!ordersObj || typeof ordersObj !== 'object') return;
    const ordersList = Object.values(ordersObj);
    if (ordersList.length === 0) return;

    const groupsByDate = {};
    ordersList.forEach(o => {
      if (!o || !o.createdAt) return;
      const dateStr = new Date(o.createdAt).toLocaleDateString('pt-BR');
      if (!groupsByDate[dateStr]) groupsByDate[dateStr] = [];
      groupsByDate[dateStr].push(o);
    });

    const db = getDB();
    Object.keys(groupsByDate).forEach(dateStr => {
      const group = groupsByDate[dateStr];
      const numbersSeen = new Set();
      let hasDuplicates = false;
      for (const o of group) {
        if (numbersSeen.has(o.orderNumber)) {
          hasDuplicates = true;
          break;
        }
        numbersSeen.add(o.orderNumber);
      }

      if (hasDuplicates) {
        group.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        let num = 1;
        group.forEach(order => {
          const expectedNumber = '#' + num;
          if (order.orderNumber !== expectedNumber && order.id) {
            order.orderNumber = expectedNumber;
            try {
              db.ref('orders/' + order.id).update({ orderNumber: expectedNumber });
            } catch (e) {}
          }
          num++;
        });
      }
    });
  },

  async createOrder(orderData) {
    const db = getDB();
    const now = new Date();
    const todayStr = now.toLocaleDateString('pt-BR');

    let maxOrderNum = 0;
    try {
      // Buscar todos os pedidos no Firebase para calcular a sequência do dia corretamente
      const snap = await db.ref('orders').once('value');
      const firebaseOrders = snap.val() || {};
      const allOrdersList = Object.values(firebaseOrders);

      allOrdersList.forEach(o => {
        if (!o || !o.createdAt) return;
        const d = new Date(o.createdAt);
        if (d.toLocaleDateString('pt-BR') === todayStr) {
          let num = 0;
          if (o.orderNumber) {
            const match = String(o.orderNumber).match(/\d+/);
            if (match) num = parseInt(match[0], 10);
          }
          if (num > maxOrderNum) {
            maxOrderNum = num;
          }
        }
      });
    } catch (e) {
      console.warn('Erro ao consultar sequência de pedidos no Firebase:', e);
    }

    const nextSeq = maxOrderNum + 1;
    const orderNumber = '#' + nextSeq;

    const newOrder = {
      orderNumber,
      createdAt: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: todayStr,
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

    try {
      sendCallMeBotWhatsAppAlert(newOrder);
      sendTelegramBotNotification(newOrder);
    } catch (e) {
      console.warn('Alert error:', e);
    }

    return newOrder;
  },

  async updateOrderStatus(orderId, newStatus, cancelReason = null) {
    const db = getDB();
    const order = this.getOrderById(orderId);
    const targetKey = (order && (order.id || order.key)) ? (order.id || order.key) : orderId;

    const updateObj = {
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'cancelado' && cancelReason) {
      updateObj.cancelReason = cancelReason;
    }

    if (order) {
      order.status = newStatus;
      if (newStatus === 'cancelado' && cancelReason) {
        order.cancelReason = cancelReason;
      }
    }

    if (newStatus === 'concluido') {
      let targetOrder = order;
      if (!targetOrder && db) {
        try {
          const snap = await db.ref('orders/' + targetKey).once('value');
          if (snap.exists()) targetOrder = snap.val();
        } catch (e) {}
      }

      if (targetOrder && !targetOrder.fidelityCredited && targetOrder.customer && targetOrder.customer.phone) {
        let cupsCount = 0;
        if (Array.isArray(targetOrder.items)) {
          targetOrder.items.forEach(item => {
            const nameLower = (item.name || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            if (cat === 'copos' || nameLower.includes('copo') || nameLower.includes('pote') || nameLower.includes('açaí') || nameLower.includes('acai') || item.allowsCustomization !== false) {
              cupsCount += (parseInt(item.quantity, 10) || 1);
            }
          });
          if (cupsCount === 0) {
            targetOrder.items.forEach(item => {
              cupsCount += (parseInt(item.quantity, 10) || 1);
            });
          }
        } else {
          cupsCount = 1;
        }

        if (cupsCount > 0) {
          await this.addCupsToCustomer(targetOrder.customer.phone, targetOrder.customer.name, cupsCount);
          updateObj.fidelityCredited = true;
          updateObj.cupsCredited = cupsCount;
        }
      }
    }

    if (db && targetKey) {
      try {
        await db.ref('orders/' + targetKey).update(updateObj);
      } catch (e) {
        console.error('[Store] Erro ao atualizar status no Firebase:', e);
      }
    }
    return Promise.resolve();
  },

  getOrderById(orderId) {
    if (!orderId) return null;
    if (_ordersCache[orderId]) return _ordersCache[orderId];
    return Object.values(_ordersCache).find(o => o && (o.id === orderId || o.orderNumber === orderId)) || null;
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
          const val = child.val();
          if (val && typeof val === 'object') {
            val.id = child.key;
            newCache[child.key] = val;
            newKeys.add(child.key);
          }
        });
      }

      try {
        this.fixDuplicateOrderNumbers(newCache);
      } catch (err) {}

      _ordersCache = newCache;
      const oldKeys = _knownKeys;
      _knownKeys = newKeys;
      _orderCount = Object.keys(newCache).length;

      if (_isFirstLoad) {
        _isFirstLoad = false;
        if (onNewOrder) onNewOrder(null);
        return;
      }

      newKeys.forEach(key => {
        if (!oldKeys.has(key)) {
          if (onNewOrder) onNewOrder(newCache[key]);
        }
      });

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

  getCustomerData() {
    return this.getSavedCustomer();
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

  getRatingsLocally() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALL_RATINGS);
      return data ? JSON.parse(data) : [];
    } catch { return []; }
  },

  saveRatingLocally(ratingObj) {
    try {
      const current = this.getRatingsLocally();
      const idx = current.findIndex(r => r.id === ratingObj.id || (r.orderId && r.orderId === ratingObj.orderId));
      if (idx >= 0) {
        current[idx] = { ...current[idx], ...ratingObj };
      } else {
        current.unshift(ratingObj);
      }
      localStorage.setItem(STORAGE_KEYS.ALL_RATINGS, JSON.stringify(current));
    } catch (e) {
      console.warn('Erro ao salvar avaliação localmente:', e);
    }
  },

  removeRatingLocally(ratingId) {
    try {
      let current = this.getRatingsLocally();
      current = current.filter(r => r.id !== ratingId && r.orderId !== ratingId);
      localStorage.setItem(STORAGE_KEYS.ALL_RATINGS, JSON.stringify(current));
    } catch (e) {}
  },

  saveRating(ratingData) {
    const db = getDB();

    const targetOrderId = ratingData.orderId || ('order_' + Date.now());
    const ratingId = (db ? db.ref('ratings').push().key : null) || ('rating_' + Date.now());

    const payload = {
      id: ratingId,
      orderId: targetOrderId,
      orderNumber: ratingData.orderNumber || '#',
      customerName: ratingData.customerName || 'Cliente',
      customerPhone: ratingData.customerPhone || '',
      stars: ratingData.stars || 5,
      comment: ratingData.comment || '',
      createdAt: Date.now()
    };

    // 1. Persistir imediatamente no LocalStorage (fallback instantâneo)
    this.saveRatingLocally(payload);
    this.markOrderAsRatedLocally(targetOrderId);

    if (!db) return Promise.resolve(payload);

    // 2. Salvar no Firebase (nó ratings + nó do pedido)
    const p1 = db.ref('ratings/' + ratingId).set(payload).catch(e => console.warn('Firebase /ratings set:', e));

    let p2 = Promise.resolve();
    if (ratingData.orderId) {
      p2 = db.ref('orders/' + ratingData.orderId).update({
        rated: true,
        rating: {
          stars: payload.stars,
          comment: payload.comment,
          createdAt: payload.createdAt
        }
      }).catch(e => console.warn('Firebase /orders update:', e));
    }

    return Promise.all([p1, p2]);
  },

  deleteRating(ratingId) {
    this.removeRatingLocally(ratingId);
    const db = getDB();
    if (!db) return Promise.resolve();
    return db.ref('ratings/' + ratingId).remove().catch(e => console.warn('Firebase remove rating:', e));
  },

  listenToRatings(callback) {
    const ratingsMap = {};

    // 1. Carregar primeiro avaliações salvas localmente
    const localRatings = this.getRatingsLocally();
    localRatings.forEach(r => {
      if (r && r.id) {
        ratingsMap[r.id] = r;
      }
    });

    function trigger() {
      if (callback) callback(ratingsMap);
    }

    trigger();

    const db = getDB();
    if (!db) return;

    // 2. Escutar nó /ratings no Firebase
    db.ref('ratings').on('value', snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.assign(ratingsMap, val);
        // Atualizar cache local
        try {
          const arr = Object.values(ratingsMap);
          localStorage.setItem(STORAGE_KEYS.ALL_RATINGS, JSON.stringify(arr));
        } catch (e) {}
      }
      trigger();
    });

    // 3. Escutar nó /orders no Firebase para avaliações embutidas nos pedidos
    db.ref('orders').on('value', snapshot => {
      if (snapshot.exists()) {
        snapshot.forEach(child => {
          const o = child.val();
          if (o && o.rating && o.rating.stars) {
            const rId = 'rating_order_' + child.key;
            if (!ratingsMap[rId]) {
              ratingsMap[rId] = {
                id: rId,
                orderId: child.key,
                orderNumber: o.orderNumber || '#',
                customerName: (o.customer && o.customer.name) ? o.customer.name : 'Cliente',
                customerPhone: (o.customer && o.customer.phone) ? o.customer.phone : '',
                stars: o.rating.stars,
                comment: o.rating.comment || '',
                createdAt: o.rating.createdAt || Date.now()
              };
            }
          }
        });
      }
      trigger();
    });
  },

  // --- PROGRAMA DE FIDELIDADE & GESTÃO DE CLIENTES ---
  cleanPhoneKey(phone) {
    if (!phone) return '';
    let digits = String(phone).replace(/\D/g, '');
    if (digits.length === 10 || digits.length === 11) {
      digits = '55' + digits;
    }
    return digits;
  },

  getFidelityConfig() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIDELITY_CONFIG);
      if (data) {
        return { ...DEFAULT_FIDELITY_CONFIG, ...JSON.parse(data) };
      }
    } catch {}
    return DEFAULT_FIDELITY_CONFIG;
  },

  saveFidelityConfig(cfg) {
    const finalCfg = { ...DEFAULT_FIDELITY_CONFIG, ...cfg };
    try {
      localStorage.setItem(STORAGE_KEYS.FIDELITY_CONFIG, JSON.stringify(finalCfg));
    } catch {}
    const db = getDB();
    if (db) {
      return db.ref('fidelity_config').set(finalCfg).catch(e => console.warn('Firebase fidelity_config set:', e));
    }
    return Promise.resolve();
  },

  listenToFidelityConfig(callback) {
    const localCfg = this.getFidelityConfig();
    if (callback) callback(localCfg);

    const db = getDB();
    if (!db) return;

    db.ref('fidelity_config').on('value', snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const merged = { ...DEFAULT_FIDELITY_CONFIG, ...val };
        try { localStorage.setItem(STORAGE_KEYS.FIDELITY_CONFIG, JSON.stringify(merged)); } catch {}
        if (callback) callback(merged);
      }
    });
  },

  getCustomersLocally() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : {};
    } catch { return {}; }
  },

  saveCustomerLocally(phone, customerData) {
    const key = this.cleanPhoneKey(phone);
    if (!key) return;
    try {
      const current = this.getCustomersLocally();
      current[key] = {
        ...current[key],
        ...customerData,
        phoneKey: key,
        updatedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(current));
    } catch (e) {
      console.warn('Erro ao salvar cliente localmente:', e);
    }
  },

  saveCustomerFidelity(phone, customerData) {
    const key = this.cleanPhoneKey(phone);
    if (!key) return Promise.resolve();

    const currentLocal = this.getCustomersLocally();
    const existing = currentLocal[key] || {};
    const payload = {
      phoneKey: key,
      phone: customerData.phone || existing.phone || phone,
      name: customerData.name || existing.name || 'Cliente',
      totalCups: (customerData.totalCups !== undefined) ? customerData.totalCups : (existing.totalCups || 0),
      claimedRewards: customerData.claimedRewards || existing.claimedRewards || [],
      lastOrderAt: customerData.lastOrderAt || existing.lastOrderAt || Date.now(),
      updatedAt: Date.now()
    };

    this.saveCustomerLocally(key, payload);

    const db = getDB();
    if (!db) return Promise.resolve(payload);

    return db.ref('customers/' + key).update(payload).catch(e => console.warn('Firebase /customers set:', e));
  },

  addCupsToCustomer(phone, name, cupsCount) {
    const key = this.cleanPhoneKey(phone);
    if (!key) return;

    const customers = this.getCustomersLocally();
    const existing = customers[key] || {};
    const currentCups = parseInt(existing.totalCups, 10) || 0;
    const newTotal = currentCups + (parseInt(cupsCount, 10) || 0);

    return this.saveCustomerFidelity(key, {
      name: name || existing.name || 'Cliente',
      totalCups: newTotal,
      lastOrderAt: Date.now()
    });
  },

  async recalculateCustomerCupsFromOrders(phone) {
    const key = this.cleanPhoneKey(phone);
    if (!key) return 0;

    const db = getDB();
    let ordersList = Object.values(_ordersCache);

    if (db) {
      try {
        const snap = await db.ref('orders').once('value');
        if (snap.exists()) {
          ordersList = Object.values(snap.val());
        }
      } catch (e) {}
    }

    let calculatedCups = 0;
    let customerName = 'Cliente';

    ordersList.forEach(order => {
      if (!order || !order.customer || !order.customer.phone) return;
      const orderPhoneKey = this.cleanPhoneKey(order.customer.phone);

      if (orderPhoneKey === key && order.status === 'concluido') {
        if (order.customer.name) customerName = order.customer.name;

        let cupsInOrder = 0;
        if (Array.isArray(order.items)) {
          order.items.forEach(item => {
            const nameLower = (item.name || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            if (cat === 'copos' || nameLower.includes('copo') || nameLower.includes('pote') || nameLower.includes('açaí') || nameLower.includes('acai') || item.allowsCustomization !== false) {
              cupsInOrder += (parseInt(item.quantity, 10) || 1);
            }
          });
          if (cupsInOrder === 0) {
            order.items.forEach(item => {
              cupsInOrder += (parseInt(item.quantity, 10) || 1);
            });
          }
        } else {
          cupsInOrder = 1;
        }

        calculatedCups += cupsInOrder;
      }
    });

    const customersMap = this.getCustomersLocally();
    const existing = customersMap[key] || {};

    const finalCups = Math.max(calculatedCups, parseInt(existing.totalCups, 10) || 0);

    await this.saveCustomerFidelity(key, {
      name: customerName !== 'Cliente' ? customerName : (existing.name || 'Cliente'),
      totalCups: finalCups
    });

    return finalCups;
  },

  updateCustomerPoints(phone, newTotalCups) {
    const key = this.cleanPhoneKey(phone);
    if (!key) return;

    const customers = this.getCustomersLocally();
    const existing = customers[key] || {};

    return this.saveCustomerFidelity(key, {
      name: existing.name || 'Cliente',
      totalCups: Math.max(0, parseInt(newTotalCups, 10) || 0)
    });
  },

  listenToCustomers(callback) {
    const customersMap = this.getCustomersLocally();
    if (callback) callback(customersMap);

    const db = getDB();
    if (!db) return;

    db.ref('customers').on('value', snapshot => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.assign(customersMap, val);
        try {
          localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customersMap));
        } catch (e) {}
      }
      if (callback) callback(customersMap);
    });
  },

  // ===========================================================================
  // GESTÃO DE CAIXA FÍSICO (Abertura, Sangria, Suprimento e Meta)
  // ===========================================================================
  getCashRegisterData(dateStr) {
    const key = `rotta_cash_reg_${dateStr}`;
    let data = {
      initialCash: 0,
      sangrias: [],
      suprimentos: []
    };
    try {
      const stored = localStorage.getItem(key);
      if (stored) data = JSON.parse(stored);
    } catch (e) {}
    return data;
  },

  saveCashRegisterData(dateStr, data) {
    const key = `rotta_cash_reg_${dateStr}`;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
    const db = getDB();
    if (db) {
      db.ref(`cashRegisters/${dateStr}`).set(data).catch(e => console.warn('Firebase set cashRegister:', e));
    }
    return Promise.resolve(data);
  },

  addCashTransaction(dateStr, type, amount, reason) {
    const data = this.getCashRegisterData(dateStr);
    const item = {
      id: 'tx_' + Date.now(),
      amount: parseFloat(amount) || 0,
      reason: reason || (type === 'sangria' ? 'Sangria de Caixa' : 'Entrada de Troco'),
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
    if (type === 'sangria') {
      if (!data.sangrias) data.sangrias = [];
      data.sangrias.push(item);
    } else {
      if (!data.suprimentos) data.suprimentos = [];
      data.suprimentos.push(item);
    }
    return this.saveCashRegisterData(dateStr, data);
  },

  getDailyGoal() {
    try {
      const val = localStorage.getItem('rotta_daily_goal');
      if (val !== null) return parseFloat(val) || 500;
    } catch (e) {}
    return 500;
  },

  setDailyGoal(goal) {
    const val = parseFloat(goal) || 500;
    try {
      localStorage.setItem('rotta_daily_goal', val);
    } catch (e) {}
    const db = getDB();
    if (db) db.ref('settings/dailyGoal').set(val).catch(() => {});
    return val;
  }
};
