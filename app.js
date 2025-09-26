// app.js — исправленный и доработанный
// Конфигурация
const CONFIG = {
  TON_TO_STARS: 176,
  API_URL: window.location.origin + '/api',
  CASE_PRICES: {
    free: 0,
    basic: 18,   // 0.1 TON -> 18 ⭐️ (пример)
    premium: 88  // 0.5 TON -> 88 ⭐️ (пример)
  },
  ITEM_IMAGES: {
    common: 'items/drops/common/',
    uncommon: 'items/drops/uncommon/',
    rare: 'items/drops/rare/',
    epic: 'items/drops/epic/',
    legendary: 'items/drops/legendary/'
  }
};

// Глобальное состояние
let currentUser = null;
let currentPage = 'main';
let selectedCaseType = null;
let freeCaseNextAvailable = 0;

// Telegram WebApp safe reference
const tg = window.Telegram?.WebApp || null;

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
  await initializeApp();
  setupEventListeners();
  loadInitialData();
});

async function initializeApp() {
  try {
    if (tg?.expand) {
      try { tg.expand(); } catch (e) { /* ignore if not allowed */ }
    }
    // Загрузим пользователя
    await loadUserData();
    updateUI();
    startTimers();
  } catch (e) {
    console.error('initializeApp error', e);
  }
}

// Загрузка данных пользователя — безопасно
async function loadUserData() {
  try {
    // если запускается внутри Telegram WebApp и есть данные
    if (tg?.initDataUnsafe?.user) {
      const u = tg.initDataUnsafe.user;
      currentUser = {
        id: String(u.id),
        firstName: u.first_name  (u.username  'Guest'),
        username: u.username || '',
        photoUrl: u.photo_url || 'icons/default-avatar.jpg',
        balance: 0,
        walletConnected: false,
        invitedCount: 0,
        earnedFromRefs: 0,
        walletAddress: null
      };

      // Попробуем загрузить серверные данные (если есть endpoint)
      try {
        const res = await fetch(`${CONFIG.API_URL}/user/${encodeURIComponent(currentUser.id)}`);
        if (res.ok) {
          const j = await res.json();
          // сервер может вернуть структуру { user: {...} } или просто объект — защищаемся
          const serverUser = j.user || j;
          if (serverUser) {
            Object.assign(currentUser, serverUser);
          }
        } else {
          console.warn('User API returned non-OK', res.status);
        }
      } catch (err) {
        console.warn('Unable to load server user data', err);
      }
    } else {
      // локальная заглушка для разработки
      const demoId = localStorage.getItem('fv_demo_id') || demo_${Math.floor(Math.random() * 1000000)};
      localStorage.setItem('fv_demo_id', demoId);
      currentUser = {
        id: demoId,
        firstName: 'DemoUser',
        username: 'demo',
        photoUrl: 'icons/default-avatar.jpg',
        balance: 150,
        walletConnected: false,
        invitedCount: 2,
        earnedFromRefs: 5,
        walletAddress: null
      };
    }
  } catch (e) {
    console.error('loadUserData error', e);
  }
}

// Навешиваем обработчики UI
function setupEventListeners() {
  // Навигация
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = e.currentTarget.getAttribute('data-page');
      if (page) switchPage(page);
    });
  });

  // Tabs in Weekly top
  document.querySelectorAll('.top-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      const el = e.currentTarget;
      const kind = el.dataset.kind || 'global';
      showTop(kind);
    });
  });

  // Modal close by clicking overlay
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  });

  // Open-case button inside modal
  const openBtn = document.getElementById('btn-open-case');
  if (openBtn) openBtn.addEventListener('click', openCase);

  // Copy referral
  const refBtn = document.querySelector('.btn-referral');
  if (refBtn) refBtn.addEventListener('click', copyReferral);

  // Wallet actions
  const connectBtn = document.querySelector('.btn-connect');
  if (connectBtn) connectBtn.addEventListener('click', connectWallet);

  const depositBtn = document.querySelectorAll('.btn-deposit');
  depositBtn.forEach(b => b.addEventListener('click', showDepositModal));
}

// Показ страницы
function switchPage(page) {
  try {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const nav = document.querySelector(`.nav-btn[data-page="${page}"]`);
    if (nav) nav.classList.add('active');

    const pageEl = document.getElementById(`${page}-page`) || document.getElementById(`${page}-page`.replace('--', ''));
    // поддержка старых id: main-page, weekly-page, profile-page
    const fallbackPage = document.getElementById(`${page}-page`);
    if (pageEl) pageEl.classList.add('active');
    else if (fallbackPage) fallbackPage.classList.add('active');

    currentPage = page;

    // динамично грузим контент для страниц
    if (page === 'weekly') loadLeaderboard();
    if (page === 'profile') loadInventory();
  } catch (e) {
    console.error('switchPage error', e);
  }
}

// Обновление UI из currentUser
function updateUI() {
  if (!currentUser) return;
  safeSetSrc('user-avatar', currentUser.photoUrl);
  safeSetText('user-name', currentUser.firstName || 'Guest');
  safeSetTextBySelector('.balance', (Number(currentUser.balance || 0)).toFixed(2));
  safeSetSrc('profile-avatar', currentUser.photoUrl);
  safeSetText('profile-name', currentUser.firstName || 'Guest');
  safeSetText('profile-balance', (Number(currentUser.balance || 0)).toFixed(2));
  safeSetText('invited-count', currentUser.invitedCount || 0);
  safeSetText('earned-amount', currentUser.earnedFromRefs || 0);

  const walletElement = document.getElementById('wallet-address');
  if (walletElement) {
    if (currentUser.walletAddress) {
      walletElement.textContent = ${currentUser.walletAddress.slice(0, 8)}...${currentUser.walletAddress.slice(-4)};
    } else {
      walletElement.textContent = 'Not connected';
    }
  }
}

// Безопасная утилита для установки текста
function safeSetText(idOrSelector, value) {
  if (!idOrSelector) return;
  const el = document.getElementById(idOrSelector) || document.querySelector(idOrSelector);
  if (el) el.textContent = value;
}

// Безопасная утилита для установки src
function safeSetSrc(id, src) {
  const el = document.getElementById(id);
  if (el && src) el.src = src;
}

// Live Drops (демо — можно заменить реальными данными)
function updateLiveDrops() {
  try {
    const drops = [
      { user: 'Alex', item: 'Common Coin', rarity: 'common', value: 5 },
      { user: 'Maria', item: 'Rare Hat', rarity: 'rare', value: 50 },
      { user: 'John', item: 'Epic Sword', rarity: 'epic', value: 150 }
    ];
    const container = document.getElementById('live-drops');
    if (!container) return;
    container.innerHTML = drops.map(drop => `
      <div class="live-drop-item">
        <strong>${escapeHtml(drop.user)}</strong> won
        <span class="rarity-${drop.rarity}"> ${escapeHtml(drop.item)}</span>
        <span class="drop-value">+${drop.value}⭐️</span>
      </div>
    `).join('');
  } catch (e) {
    console.error('updateLiveDrops', e);
  }
}

// Открытие модального окна кейса
function openCaseModal(caseType) {
  try {
    selectedCaseType = caseType;
    const price = CONFIG.CASE_PRICES[caseType] ?? 0;
    const imgEl = document.getElementById('modal-case-image');
    if (imgEl) imgEl.src = items/cases/${caseType}-case.jpg;
    safeSetText('modal-price', price);

    const openBtn = document.getElementById('btn-open-case');
    if (openBtn) {
      if (price > (currentUser.balance || 0) && caseType !== 'free') {
        openBtn.disabled = true;
        openBtn.textContent = 'INSUFFICIENT BALANCE';
        openBtn.style.opacity = '0.6';
      } else {
        openBtn.disabled = false;
        openBtn.innerHTML = OPEN FOR <span id="modal-price">${price}</span> ⭐️;
        openBtn.style.opacity = '';
      }
    }
    showModal('case-modal');
  } catch (e) {
    console.error('openCaseModal error', e);
  }
}

// Открыть кейс (взаимодействие с сервером)
async function openCase() {
  if (!selectedCaseType || !currentUser) return;
  try {
    const res = await fetch(`${CONFIG.API_URL}/case/${encodeURIComponent(selectedCaseType)}/${encodeURIComponent(currentUser.id)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const j = await res.json();
    if (!j) return alert('Server returned empty response.');
    if (j.ok || j.success) {
      // Сервер может возвращать разную структуру: normalize
      const newBal = j.balance ?? j.newBalance ?? (j.user && j.user.balance) ?? currentUser.balance;
      currentUser.balance = Number(newBal  currentUser.balance  0);
      updateUI();
      // item description
      const item = j.item  j.prize  { name: j.name  'Unknown', rarity: j.rarity  'common', value: j.value || 0 };
      showWinModal(item);
      // обновляем live-drops (демо)
      updateLiveDrops();
    } else {
      const msg = j.error  j.message  'Unknown server error';
      alert(msg);
    }
  } catch (e) {
    console.error('openCase error', e);
    alert('Error opening case (network). Check console.');
  }
}

// Показываем модал с выигранным предметом
function showWinModal(item) {
  try {
    const imgPath = ${CONFIG.ITEM_IMAGES[item.rarity] || CONFIG.ITEM_IMAGES.common}${(item.image || item.name || 'unknown').toString().toLowerCase().replace(/\s+/g, '-')}.jpg;
    const wonImg = document.getElementById('won-item-image');
    if (wonImg) wonImg.src = imgPath;
    safeSetText('won-item-name', item.name || 'Unknown');
    safeSetText('won-item-value', item.value ?? item.stars ?? 0);

    closeModal();
    showModal('win-modal');

    // GSAP animation (if подключён)
    if (window.gsap) {
      window.gsap.from('.won-item', {
        scale: 0,
        rotation: 360,
        duration: 1,
        ease: "back.out(1.7)"
      });
    }
  } catch (e) {
    console.error('showWinModal', e);
  }
}

// Модальные окна
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}
function closeModal() {
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
}

// Подключение кошелька (заглушка)
function connectWallet() {
  alert('Wallet connect will be implemented here (TonConnect).');
}

// Показываем modal пополнения (демо)
function showDepositModal() {
  const el = document.getElementById('deposit-address');
  if (el) el.textContent = 'EQ...DEMOADDRESS';
  showModal('deposit-modal');
}

// Копирование реферальной ссылки
function copyReferral() {
  try {
    const link = https://t.me/fiatvalue_bot?start=ref_${currentUser.id};
    navigator.clipboard.writeText(link);
    alert('Referral link copied!');
  } catch (e) {
    console.error('copyReferral', e);
    prompt('Copy referral link:', `https://t.me/fiatvalue_bot?start=ref_${currentUser.id}`);
  }
}

// Таймеры (free case и live-drops)
function startTimers() {
  updateLiveDrops();
  setInterval(updateLiveDrops, 5000);
  setInterval(updateFreeCaseTimer, 1000);
}

function updateFreeCaseTimer() {
  // Демонстрационный таймер: покажем "Available now" если freeCaseNextAvailable в прошлом
  const el = document.getElementById('free-timer');
  if (!el) return;
  const now = Date.now();
  if (!freeCaseNextAvailable || now >= freeCaseNextAvailable) {
    el.textContent = 'Available now';
  } else {
    const diff = Math.max(0, Math.floor((freeCaseNextAvailable - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    el.textContent = ${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')};
  }
}

// Загрузка начальных данных
function loadInitialData() {
  updateLiveDrops();
  loadLeaderboard();
  loadInventory();
  updateUI();
}

// Загрузка топа
async function loadLeaderboard() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/weekly-top`);
    if (!res.ok) return;
    const j = await res.json();const list = j.top || j;
    const container = document.getElementById('leaderboard');
    if (!container) return;
    container.innerHTML = (list  []).map((u, i) => `<div class="leader-row"><div class="rank">${i+1}</div><div class="name">${escapeHtml(u.name  u.id)}</div><div class="spent">${Number(u.spent||0).toFixed(2)} TON</div></div>`).join('');
  } catch (e) {
    console.error('loadLeaderboard', e);
  }
}

// Показ таба Top (global / friends)
function showTop(kind = 'global') {
  document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.top-tab').forEach(t => {
    if (t.dataset.kind === kind) t.classList.add('active');
  });
  // Для демо просто перезагрузим leaderboard — в реальной логике будет endpoint /weekly-top?kind=friends
  loadLeaderboard();
}

// Загрузка инвентаря
async function loadInventory() {
  try {
    const res = await fetch(`${CONFIG.API_URL}/inventory/${encodeURIComponent(currentUser.id)}`);
    if (!res.ok) return;
    const j = await res.json();
    const items = j.inventory || j;
    const container = document.getElementById('inventory');
    if (!container) return;
    container.innerHTML = (items || []).map(it => `
      <div class="inventory-item ${escapeHtml(it.rarity || 'common')}">
        <img src="${escapeHtml(it.image  it.img  'items/default-item.png')}" alt="${escapeHtml(it.name || '')}">
        <div class="item-price">${Number(it.value  it.stars  0)}⭐️</div>
        <div class="item-name">${escapeHtml(it.name || 'Item')}</div>
      </div>
    `).join('');
  } catch (e) {
    console.error('loadInventory', e);
  }
}

// Вспомогательные функции
function escapeHtml(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}