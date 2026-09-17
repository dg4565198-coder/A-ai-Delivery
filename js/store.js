/**
 * ROTTA DO AÇAÍ - STORE & DATA LAYER
 * Gerenciamento centralizado de dados, cardápio, estoque, pedidos e sincronização em tempo real.
 */

const STORAGE_KEYS = {
  CONFIG: 'rotta_config',
  PRODUCTS: 'rotta_products',
  BASES: 'rotta_bases',
  FREE_TOPPINGS: 'rotta_free_toppings',
  PAID_ADDONS: 'rotta_paid_addons',
  ORDERS: 'rotta_orders'
};

// Configurações Padrão da Loja
const DEFAULT_CONFIG = {
  name: 'Rotta do Açaí',
  slogan: 'O sabor que conquista seu dia!',
  phone: '5511999999999', // WhatsApp da Loja
  pixKey: 'rotta.acai.pix@gmail.com (Chave E-mail ou Celular)',
  pixReceiver: 'Rotta do Açaí',
  deliveryFee: 6.00,
  minOrder: 15.00,
  estimatedTime: '30 a 50 min',
  isOpen: true,
  address: 'Rua Principal, 123 - Centro'
};

// Produtos Iniciais
const DEFAULT_PRODUCTS = [
  {
    id: 'copo-300',
    name: 'Copo Tradicional 300ml',
    category: 'copos',
    price: 16.00,
    description: 'Tamanho ideal para matar a vontade. Inclui até 3 acompanhamentos tradicionais grátis!',
    freeToppingLimit: 3,
    allowsCustomization: true,
    available: true,
    badge: 'Popular',
    icon: '🍧'
  },
  {
    id: 'copo-500',
    name: 'Copo Tradicional 500ml',
    category: 'copos',
    price: 22.00,
    description: 'O queridinho da galera! Muito sabor e cremosidade. Inclui até 3 acompanhamentos grátis!',
    freeToppingLimit: 3,
    allowsCustomization: true,
    available: true,
    badge: 'Mais Pedido ⭐',
    icon: '🍧'
  },
  {
    id: 'copo-700',
    name: 'Copo Gigante 700ml',
    category: 'copos',
    price: 28.00,
    description: 'Para quem ama açaí de verdade! Acompanha até 4 opções tradicionais grátis.',
    freeToppingLimit: 4,
    allowsCustomization: true,
    available: true,
    badge: 'Top!',
    icon: '🍨'
  },
  {
    id: 'pote-1000',
    name: 'Pote Família 1 Litro',
    category: 'copos',
    price: 38.00,
    description: 'Açaí super cremoso para dividir com quem você ama. Inclui até 5 acompanhamentos grátis!',
    freeToppingLimit: 5,
    allowsCustomization: true,
    available: true,
    badge: 'Família',
    icon: '🪣'
  },
  {
    id: 'barca-especial',
    name: 'Barca Especial Rotta (1,2kg)',
    category: 'especiais',
    price: 49.90,
    description: 'Barca recheada com açaí, morangos frescos, Nutella pura, banana fatiada, leite ninho e bombom!',
    freeToppingLimit: 5,
    allowsCustomization: true,
    available: true,
    badge: 'Gourmet 🍫',
    icon: '⛵'
  },
  {
    id: 'roletta-degustacao',
    name: 'Roleta de Sabores Rotta',
    category: 'especiais',
    price: 56.00,
    description: '6 potinhos com açaí e 5 coberturas diferentes para você montar como quiser!',
    freeToppingLimit: 4,
    allowsCustomization: true,
    available: true,
    badge: 'Novidade',
    icon: '🎡'
  },
  {
    id: 'bebida-agua',
    name: 'Água Mineral sem Gás 500ml',
    category: 'bebidas',
    price: 4.00,
    description: 'Garrafinha 500ml gelada.',
    allowsCustomization: false,
    available: true,
    icon: '💧'
  },
  {
    id: 'bebida-refri',
    name: 'Refrigerante em Lata 350ml',
    category: 'bebidas',
    price: 6.00,
    description: 'Coca-Cola, Guaraná Antarctica ou Fanta geladinhos.',
    allowsCustomization: false,
    available: true,
    icon: '🥤'
  },
  {
    id: 'suco-laranja',
    name: 'Suco Natural de Laranja 400ml',
    category: 'bebidas',
    price: 9.00,
    description: '100% fruta natural feito na hora.',
    allowsCustomization: false,
    available: true,
    icon: '🍊'
  }
];

// Bases de Açaí
const DEFAULT_BASES = [
  { id: 'base-trad', name: 'Açaí Tradicional Cremoso (Receita da Casa)', extraPrice: 0, available: true },
  { id: 'base-trufado', name: 'Açaí Trufado com Chocolate', extraPrice: 3.00, available: true },
  { id: 'base-cupuacu', name: 'Cupuaçu Puro Cremoso do Pará', extraPrice: 2.00, available: true },
  { id: 'base-meio', name: 'Meio a Meio (Açaí Tradicional + Cupuaçu)', extraPrice: 1.50, available: true },
  { id: 'base-zero', name: 'Açaí Zero Adição de Açúcar (Fit)', extraPrice: 2.50, available: true }
];

// Acompanhamentos Grátis
const DEFAULT_FREE_TOPPINGS = [
  { id: 'top-leite-po', name: 'Leite em Pó (Ninho)', available: true },
  { id: 'top-leite-cond', name: 'Leite Condensado Moça', available: true },
  { id: 'top-granola', name: 'Granola Tradicional Crocante', available: true },
  { id: 'top-banana', name: 'Banana Fatiada Fresquinha', available: true },
  { id: 'top-aveia', name: 'Aveia em Flocos Finos', available: true },
  { id: 'top-pacoca', name: 'Farinha de Paçoca Doce', available: true },
  { id: 'top-mel', name: 'Mel de Abelha Puro', available: true }
];

// Adicionais Pagos (Gourmet / Extras)
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

// BroadcastChannel para sincronização instantânea entre abas
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('rotta_do_acai_channel') : null;

window.Store = {
  // Inicialização
  init() {
    if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BASES)) {
      localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(DEFAULT_BASES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS)) {
      localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(DEFAULT_FREE_TOPPINGS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAID_ADDONS)) {
      localStorage.setItem(STORAGE_KEYS.PAID_ADDONS, JSON.stringify(DEFAULT_PAID_ADDONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
  },

  // Configurações
  getConfig() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG)) || DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  },

  saveConfig(config) {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    this.broadcast('CONFIG_UPDATED', config);
  },

  // Produtos
  getProducts() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PRODUCTS)) || DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProducts(products) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    this.broadcast('PRODUCTS_UPDATED', products);
  },

  // Bases
  getBases() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BASES)) || DEFAULT_BASES;
    } catch {
      return DEFAULT_BASES;
    }
  },

  saveBases(bases) {
    localStorage.setItem(STORAGE_KEYS.BASES, JSON.stringify(bases));
    this.broadcast('BASES_UPDATED', bases);
  },

  // Acompanhamentos Grátis
  getFreeToppings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.FREE_TOPPINGS)) || DEFAULT_FREE_TOPPINGS;
    } catch {
      return DEFAULT_FREE_TOPPINGS;
    }
  },

  saveFreeToppings(toppings) {
    localStorage.setItem(STORAGE_KEYS.FREE_TOPPINGS, JSON.stringify(toppings));
    this.broadcast('TOPPINGS_UPDATED', toppings);
  },

  // Adicionais Pagos
  getPaidAddons() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PAID_ADDONS)) || DEFAULT_PAID_ADDONS;
    } catch {
      return DEFAULT_PAID_ADDONS;
    }
  },

  savePaidAddons(addons) {
    localStorage.setItem(STORAGE_KEYS.PAID_ADDONS, JSON.stringify(addons));
    this.broadcast('ADDONS_UPDATED', addons);
  },

  // Pedidos
  getOrders() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS)) || [];
    } catch {
      return [];
    }
  },

  getOrderById(orderId) {
    const orders = this.getOrders();
    return orders.find(o => o.id === orderId);
  },

  createOrder(orderData) {
    const orders = this.getOrders();
    const now = new Date();
    
    // Gerar número de pedido sequencial amigável ex: #101
    const nextNumber = 101 + orders.length;
    const orderNumber = `#${nextNumber}`;

    const newOrder = {
      id: 'ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      orderNumber,
      createdAt: now.toISOString(),
      timeFormatted: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      dateFormatted: now.toLocaleDateString('pt-BR'),
      status: 'novo', // 'novo' | 'preparo' | 'entrega' | 'concluido' | 'cancelado'
      customer: orderData.customer,
      items: orderData.items,
      deliveryType: orderData.deliveryType, // 'entrega' | 'retirada'
      address: orderData.address || null,
      paymentMethod: orderData.paymentMethod, // 'pix' | 'cartao' | 'dinheiro'
      paymentChange: orderData.paymentChange || null,
      subtotal: orderData.subtotal,
      deliveryFee: orderData.deliveryFee,
      total: orderData.total,
      notes: orderData.notes || ''
    };

    orders.unshift(newOrder); // Coloca o mais recente no topo
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));

    // Notifica em tempo real a tela da lojista!
    this.broadcast('NEW_ORDER', newOrder);
    return newOrder;
  },

  updateOrderStatus(orderId, newStatus) {
    const orders = this.getOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
      orders[orderIndex].status = newStatus;
      orders[orderIndex].updatedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      this.broadcast('ORDER_STATUS_CHANGED', orders[orderIndex]);
      return orders[orderIndex];
    }
    return null;
  },

  clearAllOrders() {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    this.broadcast('ORDERS_CLEARED', {});
  },

  // Sincronização Broadcast
  broadcast(type, payload) {
    if (channel) {
      channel.postMessage({ type, payload, timestamp: Date.now() });
    }
  },

  onSync(callback) {
    if (channel) {
      channel.onmessage = (event) => {
        callback(event.data);
      };
    }
    // Fallback para abas via storage event
    window.addEventListener('storage', (e) => {
      if (Object.values(STORAGE_KEYS).includes(e.key)) {
        callback({ type: 'STORAGE_EVENT', key: e.key });
      }
    });
  },

  // Alerta Sonoro usando a Web Audio API nativa
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

      // Toque melódico alegre ("Plim-Plim-Plim!")
      playTone(587.33, 0.0, 0.25); // D5
      playTone(739.99, 0.15, 0.3); // F#5
      playTone(880.00, 0.32, 0.6); // A5
    } catch (e) {
      console.warn('Som não pôde ser reproduzido automaticamente:', e);
    }
  },

  // Formatador de Moeda R$
  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
};
