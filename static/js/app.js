/**
 * WishFlow - Gestão Inteligente de Itens & Desejos
 * UI/UX Senior Architecture & Interactive Engine
 */

// Estado Global da Aplicação
const state = {
  user: null,
  items: [],
  filteredItems: [],
  searchQuery: '',
  selectedPriority: 'all',
  sortBy: 'newest',
  onboardingStep: 0,
  theme: localStorage.getItem('wishflow_theme') || 'dark',
  isOnlineMode: true,
  draggedItemId: null,
  editingItem: null,
  photoPreviewUrl: ''
};

// Amostra de presets de imagens para facilitar testes com 1 clique
const PHOTO_PRESETS = [
  { name: 'MacBook Pro', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80', cat: 'tenho' },
  { name: 'Fone Sony ANC', url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80', cat: 'tenho' },
  { name: 'Café Espresso', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80', cat: 'tenho' },
  { name: 'Viagem Japão', url: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80', cat: 'quero' },
  { name: 'Cadeira Herman Miller', url: 'https://images.unsplash.com/photo-1580481077195-c328a37db729?auto=format&fit=crop&w=800&q=80', cat: 'quero' },
  { name: 'Câmera Leica', url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80', cat: 'quero' },
  { name: 'Monitor 4K Ultrawide', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80', cat: 'preciso' },
  { name: 'Manutenção Veículo', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80', cat: 'preciso' },
  { name: 'Teclado Mecânico Split', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80', cat: 'preciso' },
  { name: 'Relógio Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80', cat: 'quero' },
  { name: 'Livros de Design & Arquitetura', url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', cat: 'tenho' }
];

// Efeito sonoro haptic suave usando sintetizador Web Audio API (sem dependências de rede)
function playHapticSound(type = 'success') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.16); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'achievement') {
      // Fanfarra de conquista
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    // Silencioso se áudio não for permitido pelo browser
  }
}

// Disparador de confetes
function triggerCelebrationConfetti() {
  playHapticSound('achievement');
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ['#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#3b82f6']
    });
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#10b981', '#34d399', '#6ee7b7']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#8b5cf6', '#a78bfa', '#c084fc']
      });
    }, 200);
  }
}

// Toasts de Notificação
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgColors = {
    success: 'bg-emerald-600/90 text-white border-emerald-400/40 shadow-emerald-900/40',
    info: 'bg-indigo-600/90 text-white border-indigo-400/40 shadow-indigo-900/40',
    warning: 'bg-amber-600/90 text-white border-amber-400/40 shadow-amber-900/40',
    error: 'bg-rose-600/90 text-white border-rose-400/40 shadow-rose-900/40'
  };

  const icons = {
    success: '<i data-lucide="check-circle" class="w-5 h-5 flex-shrink-0"></i>',
    info: '<i data-lucide="info" class="w-5 h-5 flex-shrink-0"></i>',
    warning: '<i data-lucide="alert-triangle" class="w-5 h-5 flex-shrink-0"></i>',
    error: '<i data-lucide="alert-circle" class="w-5 h-5 flex-shrink-0"></i>'
  };

  toast.className = `flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl text-sm font-medium transform transition-all duration-300 translate-y-4 opacity-0 ${bgColors[type] || bgColors.info}`;
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <span>${message}</span>
  `;

  container.appendChild(toast);
  if (window.lucide) lucide.createIcons({ root: toast });

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 350);
  }, 4000);
}

// ==================== COMUNICAÇÃO COM API & LOCALSTORAGE FALLBACK ====================

const api = {
  async getMe() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn('API indisponível, usando modo offline local');
    }
    const localUser = localStorage.getItem('wishflow_user');
    return {
      authenticated: !!localUser,
      user: localUser ? JSON.parse(localUser) : null
    };
  },

  async login(email, password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no login');
      return data;
    } catch (e) {
      // Fallback local
      if (email && password) {
        const dummyUser = { id: 1, name: 'Alexandre Silva', email, has_seen_onboarding: 1, theme_preference: 'dark' };
        localStorage.setItem('wishflow_user', JSON.stringify(dummyUser));
        return { success: true, user: dummyUser };
      }
      throw e;
    }
  },

  async demoLogin() {
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' });
      const data = await res.json();
      if (res.ok) return data;
    } catch (e) {
      console.warn('Usando login demo local');
    }
    const demoUser = { id: 1, name: 'Convidado WishFlow', email: 'demo@wishflow.com', has_seen_onboarding: 0, theme_preference: 'dark' };
    localStorage.setItem('wishflow_user', JSON.stringify(demoUser));
    return { success: true, user: demoUser };
  },

  async register(name, email, password) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro no cadastro');
      return data;
    } catch (e) {
      const newUser = { id: Date.now(), name, email, has_seen_onboarding: 0, theme_preference: 'dark' };
      localStorage.setItem('wishflow_user', JSON.stringify(newUser));
      return { success: true, user: newUser };
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('wishflow_user');
  },

  async setOnboardingSeen() {
    try {
      await fetch('/api/auth/onboarding', { method: 'POST' });
    } catch (e) {}
    if (state.user) {
      state.user.has_seen_onboarding = 1;
      localStorage.setItem('wishflow_user', JSON.stringify(state.user));
    }
  },

  async getItems() {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const data = await res.json();
        return data.items || [];
      }
    } catch (e) {}
    // Fallback Local
    const local = localStorage.getItem('wishflow_items');
    if (local) return JSON.parse(local);
    // Se ainda não houver itens locais, inicializa com amostra
    const defaults = PHOTO_PRESETS.slice(0, 9).map((p, idx) => ({
      id: idx + 1,
      title: p.name,
      description: `Item planejado com carinho e clareza visual.`,
      category: p.cat,
      priority: idx % 3 === 0 ? 'alta' : (idx % 2 === 0 ? 'media' : 'baixa'),
      price: (idx + 1) * 350.0,
      image_url: p.url,
      created_at: new Date().toISOString()
    }));
    localStorage.setItem('wishflow_items', JSON.stringify(defaults));
    return defaults;
  },

  async createItem(itemData) {
    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {}
    // Fallback
    const items = await this.getItems();
    const newItem = {
      id: Date.now(),
      ...itemData,
      created_at: new Date().toISOString()
    };
    items.unshift(newItem);
    localStorage.setItem('wishflow_items', JSON.stringify(items));
    return newItem;
  },

  async updateItem(id, itemData) {
    try {
      const res = await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      });
      if (res.ok) {
        const data = await res.json();
        return data.item;
      }
    } catch (e) {}
    const items = await this.getItems();
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...itemData };
      localStorage.setItem('wishflow_items', JSON.stringify(items));
      return items[idx];
    }
  },

  async moveCategory(id, newCategory) {
    try {
      const res = await fetch(`/api/items/${id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}
    const items = await this.getItems();
    const item = items.find(i => i.id === id);
    if (item) {
      const wasWish = (item.category === 'quero' || item.category === 'preciso');
      item.category = newCategory;
      localStorage.setItem('wishflow_items', JSON.stringify(items));
      return { success: true, item, is_achievement: wasWish && newCategory === 'tenho' };
    }
  },

  async deleteItem(id) {
    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    } catch (e) {}
    let items = await this.getItems();
    items = items.filter(i => i.id !== id);
    localStorage.setItem('wishflow_items', JSON.stringify(items));
    return true;
  },

  async resetDemo() {
    try {
      const res = await fetch('/api/demo/reset', { method: 'POST' });
      if (res.ok) return true;
    } catch (e) {}
    localStorage.removeItem('wishflow_items');
    return true;
  }
};

// ==================== CONTROLE DE TEMAS ====================

function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem('wishflow_theme', theme);
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle-btn');
  
  if (theme === 'light') {
    root.classList.remove('dark');
    root.classList.add('light');
    if (themeBtn) themeBtn.innerHTML = '<i data-lucide="moon" class="w-5 h-5"></i>';
  } else {
    root.classList.remove('light');
    root.classList.add('dark');
    if (themeBtn) themeBtn.innerHTML = '<i data-lucide="sun" class="w-5 h-5"></i>';
  }
  if (window.lucide) lucide.createIcons();
}

function toggleTheme() {
  applyTheme(state.theme === 'dark' ? 'light' : 'dark');
}

// ==================== RENDERIZADORES DE TELAS ====================

// Alternar entre Telas (Auth vs Dashboard)
function showView(viewName) {
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');

  if (viewName === 'auth') {
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
  } else {
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    renderUserProfile();
    loadAndRenderItems();
  }
  if (window.lucide) lucide.createIcons();
}

function renderUserProfile() {
  if (!state.user) return;
  const nameEl = document.getElementById('user-display-name');
  const emailEl = document.getElementById('user-display-email');
  const avatarEl = document.getElementById('user-display-avatar');

  if (nameEl) nameEl.textContent = state.user.name;
  if (emailEl) emailEl.textContent = state.user.email;
  if (avatarEl) {
    const initials = state.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    avatarEl.textContent = initials;
  }
}

// Renderização dos Itens e Métricas no Dashboard
async function loadAndRenderItems() {
  state.items = await api.getItems();
  applyFiltersAndRender();
  updateStats();
}

function updateStats() {
  const stats = {
    tenho: 0,
    quero: 0,
    preciso: 0,
    valorTenho: 0,
    valorQuero: 0,
    valorPreciso: 0
  };

  state.items.forEach(item => {
    const p = parseFloat(item.price) || 0;
    if (item.category === 'tenho') {
      stats.tenho++;
      stats.valorTenho += p;
    } else if (item.category === 'quero') {
      stats.quero++;
      stats.valorQuero += p;
    } else if (item.category === 'preciso') {
      stats.preciso++;
      stats.valorPreciso += p;
    }
  });

  const total = state.items.length;
  const rate = (stats.tenho + stats.quero > 0)
    ? Math.round((stats.tenho / (stats.tenho + stats.quero)) * 100)
    : 0;

  // Atualizar badges nas colunas
  const countTenho = document.getElementById('count-tenho');
  const countQuero = document.getElementById('count-quero');
  const countPreciso = document.getElementById('count-preciso');

  if (countTenho) countTenho.textContent = stats.tenho;
  if (countQuero) countQuero.textContent = stats.quero;
  if (countPreciso) countPreciso.textContent = stats.preciso;

  // Atualizar barra de métricas do topo
  const statTotalEl = document.getElementById('stat-total-items');
  const statRateEl = document.getElementById('stat-achievement-rate');
  const statWishValEl = document.getElementById('stat-wishlist-value');

  if (statTotalEl) statTotalEl.textContent = total;
  if (statRateEl) statRateEl.textContent = `${rate}%`;
  if (statWishValEl) statWishValEl.textContent = stats.valorQuero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function applyFiltersAndRender() {
  const query = state.searchQuery.toLowerCase().trim();
  const priority = state.selectedPriority;
  const sort = state.sortBy;

  let filtered = state.items.filter(item => {
    const matchText = (item.title || '').toLowerCase().includes(query) ||
                      (item.description || '').toLowerCase().includes(query);
    const matchPriority = priority === 'all' || item.priority === priority;
    return matchText && matchPriority;
  });

  // Ordenação
  filtered.sort((a, b) => {
    if (sort === 'newest') return b.id - a.id;
    if (sort === 'oldest') return a.id - b.id;
    if (sort === 'price-desc') return (b.price || 0) - (a.price || 0);
    if (sort === 'price-asc') return (a.price || 0) - (b.price || 0);
    if (sort === 'title') return a.title.localeCompare(b.title);
    return 0;
  });

  renderColumn('tenho', filtered.filter(i => i.category === 'tenho'));
  renderColumn('quero', filtered.filter(i => i.category === 'quero'));
  renderColumn('preciso', filtered.filter(i => i.category === 'preciso'));

  if (window.lucide) lucide.createIcons();
}

function renderColumn(category, items) {
  const container = document.getElementById(`cards-container-${category}`);
  const emptyState = document.getElementById(`empty-${category}`);
  if (!container) return;

  container.innerHTML = '';

  if (items.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  } else {
    if (emptyState) emptyState.classList.add('hidden');
  }

  items.forEach(item => {
    const card = createItemCardElement(item);
    container.appendChild(card);
  });
}

function createItemCardElement(item) {
  const card = document.createElement('div');
  card.className = 'glass-card rounded-2xl overflow-hidden p-4 relative group cursor-grab active:cursor-grabbing border';
  card.setAttribute('draggable', 'true');
  card.setAttribute('data-id', item.id);

  // Drag and Drop Handlers
  card.addEventListener('dragstart', (e) => {
    state.draggedItemId = item.id;
    card.classList.add('dragging-card');
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging-card');
    state.draggedItemId = null;
    document.querySelectorAll('.column-dropzone').forEach(dz => dz.classList.remove('drag-over-active'));
  });

  // Prioridade Badge
  const priorityConfig = {
    alta: { label: 'Alta Prioridade', class: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    media: { label: 'Média', class: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    baixa: { label: 'Baixa', class: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' }
  };
  const priorityBadge = priorityConfig[item.priority] || priorityConfig.media;

  // Imagem
  const imgUrl = item.image_url || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
  const priceDisplay = item.price > 0 
    ? `<span class="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
        ${parseFloat(item.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
       </span>`
    : '';

  // Ações de Transição Rápida baseada na categoria
  let moveButtonsHtml = '';
  if (item.category === 'quero') {
    moveButtonsHtml = `
      <button onclick="handleQuickMove(${item.id}, 'tenho')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition border border-emerald-500/30 shadow-sm" title="Marcar como Conquistado!">
        <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
        <span>Conquistei! 🎉</span>
      </button>
      <button onclick="handleQuickMove(${item.id}, 'preciso')" class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs transition" title="Tornar necessidade urgente">
        <i data-lucide="arrow-right" class="w-3 h-3"></i>
        <span>Preciso</span>
      </button>
    `;
  } else if (item.category === 'preciso') {
    moveButtonsHtml = `
      <button onclick="handleQuickMove(${item.id}, 'tenho')" class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition border border-emerald-500/30 shadow-sm" title="Marcar como Adquirido/Resolvido!">
        <i data-lucide="check" class="w-3.5 h-3.5"></i>
        <span>Adquiri!</span>
      </button>
      <button onclick="handleQuickMove(${item.id}, 'quero')" class="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs transition" title="Mudar para Quero">
        <i data-lucide="arrow-left" class="w-3 h-3"></i>
        <span>Quero</span>
      </button>
    `;
  } else {
    // categoria 'tenho'
    moveButtonsHtml = `
      <button onclick="handleQuickMove(${item.id}, 'quero')" class="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-xs transition" title="Devolver para Desejos">
        <i data-lucide="refresh-cw" class="w-3 h-3"></i>
        <span>Re-desejar</span>
      </button>
    `;
  }

  card.innerHTML = `
    <!-- Topo da Imagem -->
    <div class="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-gray-900">
      <img src="${imgUrl}" alt="${escapeHtml(item.title)}" class="w-full h-full object-cover card-img-zoom" loading="lazy" />
      <div class="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-transparent to-transparent"></div>
      
      <!-- Badges sobre a foto -->
      <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
        <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full border backdrop-blur-md ${priorityBadge.class}">
          ${priorityBadge.label}
        </span>
      </div>

      <div class="absolute top-2.5 right-2.5 flex items-center gap-1">
        <button onclick="openEditModal(${item.id})" class="w-7 h-7 rounded-lg bg-gray-900/70 hover:bg-gray-800 text-gray-300 hover:text-white flex items-center justify-center backdrop-blur-md transition shadow border border-white/10" title="Editar item">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
        </button>
        <button onclick="handleDeleteItem(${item.id})" class="w-7 h-7 rounded-lg bg-gray-900/70 hover:bg-rose-950 text-gray-300 hover:text-rose-400 flex items-center justify-center backdrop-blur-md transition shadow border border-white/10" title="Excluir item">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>

      <div class="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
        ${priceDisplay}
      </div>
    </div>

    <!-- Conteúdo do Card -->
    <div class="space-y-1.5">
      <h3 class="text-base font-bold text-gray-100 group-hover:text-indigo-300 transition-colors line-clamp-1">
        ${escapeHtml(item.title)}
      </h3>
      <p class="text-xs text-gray-400 line-clamp-2 leading-relaxed">
        ${escapeHtml(item.description || 'Sem descrição informada.')}
      </p>
    </div>

    <!-- Rodapé de Ações Rápidas -->
    <div class="mt-3 pt-3 border-t border-gray-700/50 flex items-center justify-between gap-1">
      <span class="text-[11px] text-gray-400 flex items-center gap-1">
        <i data-lucide="grip-vertical" class="w-3 h-3 text-gray-400"></i>
        <span>Arrastar</span>
      </span>
      <div class="flex items-center gap-1.5">
        ${moveButtonsHtml}
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}

// ==================== AÇÕES DE ITENS ====================

async function handleQuickMove(itemId, targetCategory) {
  const result = await api.moveCategory(itemId, targetCategory);
  if (result) {
    playHapticSound(result.is_achievement ? 'achievement' : 'success');
    if (result.is_achievement) {
      triggerCelebrationConfetti();
      showToast('🎉 Conquista desbloqueada! Desejo realizado e movido para seus itens!', 'success');
    } else {
      showToast(`Item movido para "${targetCategory.toUpperCase()}" com sucesso!`, 'info');
    }
    await loadAndRenderItems();
  }
}

async function handleDeleteItem(itemId) {
  if (confirm('Deseja realmente remover este item da sua gestão?')) {
    await api.deleteItem(itemId);
    playHapticSound('success');
    showToast('Item removido com sucesso.', 'warning');
    await loadAndRenderItems();
  }
}

// Configuração dos Dropzones para Drag and Drop
function setupDropzones() {
  const columns = ['tenho', 'quero', 'preciso'];

  columns.forEach(category => {
    const colEl = document.getElementById(`column-${category}`);
    if (!colEl) return;

    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      colEl.classList.add('drag-over-active');
    });

    colEl.addEventListener('dragleave', (e) => {
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('drag-over-active');
      }
    });

    colEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over-active');

      const itemId = parseInt(e.dataTransfer.getData('text/plain') || state.draggedItemId);
      if (!itemId) return;

      const currentItem = state.items.find(i => i.id === itemId);
      if (currentItem && currentItem.category !== category) {
        await handleQuickMove(itemId, category);
      }
    });
  });
}

// ==================== MODAL DE CRIAÇÃO / EDIÇÃO ====================

function openCreateModal(defaultCategory = 'quero') {
  state.editingItem = null;
  state.photoPreviewUrl = '';

  const modal = document.getElementById('item-modal');
  const title = document.getElementById('item-modal-title');
  const form = document.getElementById('item-form');

  title.textContent = 'Adicionar Novo Item';
  form.reset();
  
  // Set default category
  document.querySelectorAll('input[name="modal-category"]').forEach(r => {
    r.checked = (r.value === defaultCategory);
  });
  // Default priority
  document.querySelectorAll('input[name="modal-priority"]').forEach(r => {
    r.checked = (r.value === 'media');
  });

  resetPhotoPreview();
  renderPhotoPresets(defaultCategory);

  modal.classList.remove('hidden');
  document.getElementById('item-title-input').focus();
  if (window.lucide) lucide.createIcons();
}

function openEditModal(itemId) {
  const item = state.items.find(i => i.id === itemId);
  if (!item) return;

  state.editingItem = item;
  state.photoPreviewUrl = item.image_url || '';

  const modal = document.getElementById('item-modal');
  const title = document.getElementById('item-modal-title');

  title.textContent = 'Editar Detalhes do Item';

  document.getElementById('item-title-input').value = item.title || '';
  document.getElementById('item-desc-input').value = item.description || '';
  document.getElementById('item-price-input').value = item.price || '';
  document.getElementById('item-image-url-input').value = item.image_url || '';

  document.querySelectorAll('input[name="modal-category"]').forEach(r => {
    r.checked = (r.value === item.category);
  });
  document.querySelectorAll('input[name="modal-priority"]').forEach(r => {
    r.checked = (r.value === item.priority);
  });

  setPhotoPreview(item.image_url);
  renderPhotoPresets(item.category);

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeItemModal() {
  document.getElementById('item-modal').classList.add('hidden');
  state.editingItem = null;
  state.photoPreviewUrl = '';
}

function setPhotoPreview(url) {
  const previewContainer = document.getElementById('photo-preview-container');
  const previewImg = document.getElementById('photo-preview-img');
  const uploadPlaceholder = document.getElementById('photo-upload-placeholder');

  if (url) {
    state.photoPreviewUrl = url;
    previewImg.src = url;
    previewContainer.classList.remove('hidden');
    uploadPlaceholder.classList.add('hidden');
  } else {
    resetPhotoPreview();
  }
}

function resetPhotoPreview() {
  state.photoPreviewUrl = '';
  const previewContainer = document.getElementById('photo-preview-container');
  const uploadPlaceholder = document.getElementById('photo-upload-placeholder');
  const fileInput = document.getElementById('photo-file-input');
  const urlInput = document.getElementById('item-image-url-input');

  if (previewContainer) previewContainer.classList.add('hidden');
  if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');
  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
}

function renderPhotoPresets(category = 'quero') {
  const container = document.getElementById('photo-presets-container');
  if (!container) return;

  container.innerHTML = '';
  PHOTO_PRESETS.forEach(preset => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'group relative w-14 h-14 rounded-xl overflow-hidden border border-white/10 hover:border-indigo-400 transition-all flex-shrink-0';
    btn.title = preset.name;
    btn.innerHTML = `
      <img src="${preset.url}" alt="${preset.name}" class="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
      <span class="absolute inset-0 bg-black/40 group-hover:bg-transparent transition"></span>
    `;
    btn.onclick = () => {
      setPhotoPreview(preset.url);
      document.getElementById('item-image-url-input').value = preset.url;
      playHapticSound('click');
    };
    container.appendChild(btn);
  });
}

// Salvar Item (Criar ou Atualizar)
async function handleItemFormSubmit(e) {
  e.preventDefault();

  const title = document.getElementById('item-title-input').value.trim();
  const description = document.getElementById('item-desc-input').value.trim();
  const price = parseFloat(document.getElementById('item-price-input').value) || 0.0;
  const imageUrl = state.photoPreviewUrl || document.getElementById('item-image-url-input').value.trim();

  let category = 'quero';
  document.querySelectorAll('input[name="modal-category"]').forEach(r => {
    if (r.checked) category = r.value;
  });

  let priority = 'media';
  document.querySelectorAll('input[name="modal-priority"]').forEach(r => {
    if (r.checked) priority = r.value;
  });

  if (!title) {
    showToast('Por favor, informe o título do item.', 'warning');
    return;
  }

  const payload = { title, description, price, category, priority, image_url: imageUrl };

  if (state.editingItem) {
    await api.updateItem(state.editingItem.id, payload);
    showToast('Item atualizado com sucesso!', 'success');
  } else {
    await api.createItem(payload);
    showToast('Item adicionado à sua lista!', 'success');
    if (category === 'tenho') {
      playHapticSound('success');
    }
  }

  closeItemModal();
  await loadAndRenderItems();
}

// ==================== TUTORIAL DE ONBOARDING (PRIMEIRO ACESSO) ====================

const ONBOARDING_STEPS = [
  {
    title: 'Bem-vindo ao WishFlow ✨',
    subtitle: 'A sua nova central de clareza mental, desejos e conquistas materiais.',
    icon: 'sparkles',
    badge: 'Passo 1 de 4',
    content: `
      <div class="text-center py-4 space-y-3">
        <div class="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white animate-float-slow">
          <i data-lucide="layers" class="w-10 h-10"></i>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
          Quantas vezes você comprou por impulso ou perdeu o controle dos seus sonhos? 
          O <strong>WishFlow</strong> foi criado para proporcionar uma experiência visual viciante e consciente de gestão da sua vida material.
        </p>
      </div>
    `
  },
  {
    title: 'O Poder das 3 Categorias',
    subtitle: 'Simplicidade visual que transforma ansiedade em realização.',
    icon: 'columns-3',
    badge: 'Passo 2 de 4',
    content: `
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 py-3">
        <div class="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-1.5">
          <div class="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <span class="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">📦</span>
            <span>Tenho</span>
          </div>
          <p class="text-xs text-gray-300">Seu inventário de valor real. Pratique a gratidão pelo que você já conquistou.</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5">
          <div class="flex items-center gap-2 text-purple-400 font-bold text-sm">
            <span class="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">✨</span>
            <span>Quero</span>
          </div>
          <p class="text-xs text-gray-300">Sonhos, viagens e desejos futuros. Deixe marinar antes de comprar por impulso.</p>
        </div>
        <div class="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-1.5">
          <div class="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <span class="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center">⚡</span>
            <span>Preciso</span>
          </div>
          <p class="text-xs text-gray-300">Necessidades imediatas e essenciais que merecem prioridade financeira urgente.</p>
        </div>
      </div>
    `
  },
  {
    title: 'Arraste & Comemore! 🎉',
    subtitle: 'A sensação viciante de transformar um desejo em conquista real.',
    icon: 'trophy',
    badge: 'Passo 3 de 4',
    content: `
      <div class="text-center py-4 space-y-4">
        <div class="flex items-center justify-center gap-4 text-xs font-semibold">
          <div class="px-3 py-2 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300 flex items-center gap-1.5">
            <span>✨ Cadeira Ergonômica</span>
          </div>
          <div class="text-indigo-400 animate-pulse">➔ Drag & Drop ➔</div>
          <div class="px-3 py-2 rounded-xl bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5">
            <span>📦 Meu Inventário</span>
          </div>
        </div>
        <p class="text-sm text-gray-300 leading-relaxed max-w-md mx-auto">
          Ao conquistar uma meta, basta <strong>arrastar o card</strong> ou clicar em <strong>"Conquistei! 🎉"</strong> para celebrar com efeitos especiais e alimentar a sua taxa de realização!
        </p>
      </div>
    `
  },
  {
    title: 'Você Está no Comando 🚀',
    subtitle: 'Adicione fotos, personalize prioridades e tenha ajuda sempre que precisar.',
    icon: 'help-circle',
    badge: 'Passo 4 de 4',
    content: `
      <div class="space-y-3 py-2 text-sm text-gray-300">
        <div class="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">📸</div>
          <div>
            <h4 class="font-bold text-white text-xs">Fotos em Alta Definição</h4>
            <p class="text-xs text-gray-400">Faça upload de fotos do seu dispositivo ou use presets de inspiração.</p>
          </div>
        </div>
        <div class="flex items-start gap-3 p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
          <div class="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">💡</div>
          <div>
            <h4 class="font-bold text-white text-xs">Botão Flutuante de Ajuda</h4>
            <p class="text-xs text-gray-400">Dúvidas sobre o método? Clique no botão flutuante no canto inferior a qualquer hora.</p>
          </div>
        </div>
      </div>
    `
  }
];

function openOnboardingModal(step = 0) {
  state.onboardingStep = step;
  renderOnboardingStep();
  const modal = document.getElementById('onboarding-modal');
  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeOnboardingModal() {
  document.getElementById('onboarding-modal').classList.add('hidden');
  api.setOnboardingSeen();
}

function renderOnboardingStep() {
  const current = ONBOARDING_STEPS[state.onboardingStep];
  if (!current) return;

  document.getElementById('onboarding-badge').textContent = current.badge;
  document.getElementById('onboarding-title').textContent = current.title;
  document.getElementById('onboarding-subtitle').textContent = current.subtitle;
  document.getElementById('onboarding-body').innerHTML = current.content;

  // Dots de Progresso
  const dotsContainer = document.getElementById('onboarding-dots');
  dotsContainer.innerHTML = '';
  ONBOARDING_STEPS.forEach((_, idx) => {
    const dot = document.createElement('span');
    dot.className = `h-2 rounded-full transition-all duration-300 ${
      idx === state.onboardingStep ? 'w-6 bg-indigo-500' : 'w-2 bg-gray-600'
    }`;
    dotsContainer.appendChild(dot);
  });

  // Botões
  const backBtn = document.getElementById('onboarding-back-btn');
  const nextBtn = document.getElementById('onboarding-next-btn');

  if (state.onboardingStep === 0) {
    backBtn.classList.add('invisible');
  } else {
    backBtn.classList.remove('invisible');
  }

  if (state.onboardingStep === ONBOARDING_STEPS.length - 1) {
    nextBtn.innerHTML = `<span>Começar Minha Jornada!</span> <i data-lucide="check" class="w-4 h-4 ml-1"></i>`;
    nextBtn.className = 'px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:opacity-95 transition flex items-center';
  } else {
    nextBtn.innerHTML = `<span>Próximo</span> <i data-lucide="arrow-right" class="w-4 h-4 ml-1"></i>`;
    nextBtn.className = 'px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center';
  }

  if (window.lucide) lucide.createIcons();
}

function handleOnboardingNext() {
  if (state.onboardingStep < ONBOARDING_STEPS.length - 1) {
    state.onboardingStep++;
    renderOnboardingStep();
    playHapticSound('click');
  } else {
    closeOnboardingModal();
    playHapticSound('achievement');
    triggerCelebrationConfetti();
    showToast('Tudo pronto! Bem-vindo ao WishFlow.', 'success');
  }
}

function handleOnboardingBack() {
  if (state.onboardingStep > 0) {
    state.onboardingStep--;
    renderOnboardingStep();
    playHapticSound('click');
  }
}

// ==================== BOTÃO FLUTUANTE DE AJUDA & FAQ ====================

function openHelpModal() {
  const modal = document.getElementById('help-modal');
  modal.classList.remove('hidden');
  playHapticSound('click');
  if (window.lucide) lucide.createIcons();
}

function closeHelpModal() {
  document.getElementById('help-modal').classList.add('hidden');
}

function toggleFaqItem(faqId) {
  const answer = document.getElementById(`faq-ans-${faqId}`);
  const icon = document.getElementById(`faq-icon-${faqId}`);
  if (!answer) return;

  const isHidden = answer.classList.contains('hidden');
  // Fechar todos
  document.querySelectorAll('[id^="faq-ans-"]').forEach(a => a.classList.add('hidden'));
  document.querySelectorAll('[id^="faq-icon-"]').forEach(i => i.classList.remove('rotate-180'));

  if (isHidden) {
    answer.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
  }
}

// ==================== EVENT LISTENERS & INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', async () => {
  // Aplicar tema
  applyTheme(state.theme);

  // Botão de Tema
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme);

  // Setup de Dropzones
  setupDropzones();

  // Upload de Imagem Local (FileReader -> Base64)
  const fileInput = document.getElementById('photo-file-input');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 4 * 1024 * 1024) {
          showToast('A imagem deve ter no máximo 4MB.', 'warning');
          return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          setPhotoPreview(event.target.result);
          showToast('Foto carregada com sucesso!', 'info');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Busca e Filtros
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value;
      applyFiltersAndRender();
    });
  }

  const prioritySelect = document.getElementById('priority-filter-select');
  if (prioritySelect) {
    prioritySelect.addEventListener('change', (e) => {
      state.selectedPriority = e.target.value;
      applyFiltersAndRender();
    });
  }

  const sortSelect = document.getElementById('sort-by-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFiltersAndRender();
    });
  }

  // Form Submit do Modal de Item
  document.getElementById('item-form')?.addEventListener('submit', handleItemFormSubmit);

  // Auth Forms
  setupAuthListeners();

  // Checar Sessão
  const sessionCheck = await api.getMe();
  if (sessionCheck.authenticated && sessionCheck.user) {
    state.user = sessionCheck.user;
    showView('dashboard');

    if (!state.user.has_seen_onboarding) {
      setTimeout(() => openOnboardingModal(0), 400);
    }
  } else {
    showView('auth');
  }

  // Fechar modais ao teclar ESC
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeItemModal();
      closeHelpModal();
      document.getElementById('onboarding-modal')?.classList.add('hidden');
    }
  });

  if (window.lucide) lucide.createIcons();
});

// Listener de Formulários de Autenticação
function setupAuthListeners() {
  const tabLogin = document.getElementById('tab-btn-login');
  const tabRegister = document.getElementById('tab-btn-register');
  const formLogin = document.getElementById('form-login');
  const formRegister = document.getElementById('form-register');

  tabLogin?.addEventListener('click', () => {
    tabLogin.classList.add('bg-indigo-600', 'text-white');
    tabLogin.classList.remove('text-gray-400', 'hover:text-white');
    tabRegister.classList.remove('bg-indigo-600', 'text-white');
    tabRegister.classList.add('text-gray-400', 'hover:text-white');
    formLogin.classList.remove('hidden');
    formRegister.classList.add('hidden');
  });

  tabRegister?.addEventListener('click', () => {
    tabRegister.classList.add('bg-indigo-600', 'text-white');
    tabRegister.classList.remove('text-gray-400', 'hover:text-white');
    tabLogin.classList.remove('bg-indigo-600', 'text-white');
    tabLogin.classList.add('text-gray-400', 'hover:text-white');
    formRegister.classList.remove('hidden');
    formLogin.classList.add('hidden');
  });

  // Login Submit
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
      const res = await api.login(email, password);
      state.user = res.user;
      showToast('Bem-vindo de volta!', 'success');
      showView('dashboard');
      if (!state.user.has_seen_onboarding) {
        setTimeout(() => openOnboardingModal(0), 300);
      }
    } catch (err) {
      showToast(err.message || 'Erro ao realizar login', 'error');
    }
  });

  // Register Submit
  formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    try {
      const res = await api.register(name, email, password);
      state.user = res.user;
      showToast('Conta criada com sucesso!', 'success');
      showView('dashboard');
      setTimeout(() => openOnboardingModal(0), 400);
    } catch (err) {
      showToast(err.message || 'Erro ao realizar cadastro', 'error');
    }
  });

  // Demo Login Button
  document.getElementById('btn-demo-access')?.addEventListener('click', async () => {
    try {
      const res = await api.demoLogin();
      state.user = res.user;
      showToast('Entrando em Modo Demonstração!', 'info');
      showView('dashboard');
      if (!state.user.has_seen_onboarding) {
        setTimeout(() => openOnboardingModal(0), 300);
      }
    } catch (err) {
      showToast('Erro ao entrar como demo', 'error');
    }
  });

  // Logout Button
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await api.logout();
    state.user = null;
    showToast('Você saiu com segurança.', 'info');
    showView('auth');
  });

  // Botão Resetar Demo Data na ajuda
  document.getElementById('btn-reset-demo-data')?.addEventListener('click', async () => {
    if (confirm('Deseja recarregar o conjunto de itens e desejos de demonstração?')) {
      await api.resetDemo();
      closeHelpModal();
      await loadAndRenderItems();
      showToast('Itens de demonstração restaurados com sucesso!', 'success');
    }
  });
}
