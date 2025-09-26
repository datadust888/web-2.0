// Конфигурация приложения
const CONFIG = {
    TON_TO_STARS: 175, // 1 TON = 175 звезд
    API_URL: 'http://localhost:3000/api',
    BOT_USERNAME: 'fiatvalue_bot',
    MERCHANT_WALLET: 'EQABCD1234567890abcdefghijklmnopqrstuvwxyz1234567890abc',
    CASE_PRICES: {
        free: 0,
        basic: 10,
        premium: 50,
        luxury: 100
    }
};

// Глобальное состояние
let currentUser = null;
let currentPage = 'cases';
let selectedCaseType = null;
let depositAmount = 0;

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Основная функция инициализации
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
    setupEventListeners();
    loadInitialData();
});

async function initializeApp() {
    // Инициализация Telegram Web App
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Загрузка пользователя
    await loadUserData();
    
    // Обновление интерфейса
    updateUserInterface();
    updateLiveDrops();
    updateTopLists();
    updateInventory();
}

async function loadUserData() {
    try {
        // Если пользователь авторизован через Telegram
        if (tg.initDataUnsafe?.user) {
            const userData = tg.initDataUnsafe.user;
            currentUser = {
                id: userData.id,
                firstName: userData.first_name,
                lastName: userData.last_name || '',
                username: userData.username,
                photoUrl: userData.photo_url,
                balance: 0,
                walletConnected: false,
                walletAddress: null,
                invitedCount: 0,
                earnedFromRefs: 0
            };
            
            // Загрузка данных с сервера
            const response = await fetch(`${CONFIG.API_URL}/user/${currentUser.id}`);
            if (response.ok) {
                const serverData = await response.json();
                Object.assign(currentUser, serverData);
            }
        } else {
            // Заглушка для разработки
            currentUser = {
                id: 1,
                firstName: 'Тестовый',
                lastName: 'Игрок',
                username: 'testplayer',
                photoUrl: 'icons/default-avatar.jpg',
                balance: 100,
                walletConnected: false,
                walletAddress: null,
                invitedCount: 3,
                earnedFromRefs: 15
            };
        }
    } catch (error) {
        console.error('Ошибка загрузки пользователя:', error);
    }
}

function setupEventListeners() {
    // Обработка закрытия модальных окон
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function loadInitialData() {
    // Загрузка живых дропов
    updateLiveDrops();
    
    // Загрузка топа
    updateTopLists();
    
    // Загрузка инвентаря
    updateInventory();
}

// Навигация по страницам
function switchPage(page) {
    // Скрыть все страницы
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    // Показать выбранную страницу
    document.getElementById(`${page}-page`).classList.add('active');
    document.querySelector(`.nav-btn[onclick="switchPage('${page}')"]`).classList.add('active');
    
    currentPage = page;
    
    // Обновить данные страницы
    switch(page) {
        case 'top':
            updateTopLists();
            break;
        case 'profile':
            updateInventory();
            break;
    }
}

// Обновление интерфейса пользователя
function updateUserInterface() {
    if (!currentUser) return;
    
    // Обновление аватара и имени
    document.getElementById('user-avatar').src = currentUser.photoUrl;
    document.getElementById('user-name').textContent = currentUser.firstName;
    document.getElementById('user-balance').textContent = currentUser.balance;
    
    document.getElementById('profile-avatar').src = currentUser.photoUrl;
    document.getElementById('profile-name').textContent = currentUser.firstName;
    document.getElementById('profile-balance-amount').textContent = currentUser.balance;
    
    // Обновление кошелька
    const walletElement = document.getElementById('wallet-address');
    if (currentUser.walletConnected && currentUser.walletAddress) {
        walletElement.textContent = `${currentUser.walletAddress.slice(0, 8)}...${currentUser.walletAddress.slice(-8)}`;
    } else {
        walletElement.textContent = 'Не подключен';
    }
    
    // Обновление реферальной статистики
    document.getElementById('invited-count').textContent = currentUser.invitedCount;
    document.getElementById('earned-amount').textContent = `${currentUser.earnedFromRefs} ⭐`;
}

// Лента живых дропов
function updateLiveDrops() {
    const liveDrops = [
        { user: 'Alex', item: 'Rare Hat', value: 50, rarity: 'rare' },
        { user: 'Maria', item: 'Epic Cake', value: 150, rarity: 'epic' },
        { user: 'John', item: 'Legendary Gem', value: 500, rarity: 'legendary' },
        { user: 'Sarah', item: 'Common Coin', value: 10, rarity: 'common' }
    ];
    
    const liveDropScroll = document.querySelector('.live-drop-scroll');
    liveDropScroll.innerHTML = liveDrops.map(drop => `
        <div class="live-drop-item">
            ${drop.user} выиграл <span class="rarity-${drop.rarity}">${drop.item}</span> (+${drop.value}⭐)!
        </div>
    `).join('');
}

// Топ игроков
function updateTopLists() {
    const globalTop = [
        { rank: 1, name: 'CryptoKing', amount: 12500, avatar: 'icons/default-avatar.jpg' },
        { rank: 2, name: 'NFTHunter', amount: 9800, avatar: 'icons/default-avatar.jpg' },
        { rank: 3, name: 'TonMaster', amount: 7650, avatar: 'icons/default-avatar.jpg' },
        { rank: 4, name: 'BlockChainPro', amount: 5420, avatar: 'icons/default-avatar.jpg' },
        { rank: 5, name: currentUser.firstName, amount: currentUser.balance, avatar: currentUser.photoUrl, isCurrent: true }
    ];
    
    const friendsTop = [
        { rank: 1, name: 'Друг_1', amount: 1500, avatar: 'icons/default-avatar.jpg' },
        { rank: 2, name: 'Друг_2', amount: 1200, avatar: 'icons/default-avatar.jpg' },
        { rank: 3, name: currentUser.firstName, amount: currentUser.balance, avatar: currentUser.photoUrl, isCurrent: true }
    ];
    
    document.getElementById('global-top').innerHTML = globalTop.map(player => `
        <div class="top-item ${player.isCurrent ? 'current-user' : ''}">
            <div class="top-rank">#${player.rank}</div>
            <div class="top-user">
                <img src="${player.avatar}" alt="${player.name}" class="top-user-avatar">
                <span>${player.name}</span>
            </div>
            <div class="top-amount">${player.amount} ⭐</div>
        </div>
    `).join('');
    
    document.getElementById('friends-top').innerHTML = friendsTop.map(player => `
        <div class="top-item ${player.isCurrent ? 'current-user' : ''}">
            <div class="top-rank">#${player.rank}</div>
            <div class="top-user">
                <img src="${player.avatar}" alt="${player.name}" class="top-user-avatar">
                <span>${player.name}</span>
            </div>
            <div class="top-amount">${player.amount} ⭐</div>
        </div>
    `).join('');
}

// Переключение вкладок топа
function switchTopTab(tab) {
    document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.top-list').forEach(l => l.classList.add('hidden'));
    
    document.querySelector(`.top-tab[onclick="switchTopTab('${tab}')"]`).classList.add('active');
    document.getElementById(`${tab}-top`).classList.remove('hidden');
}

// Инвентарь
function updateInventory() {
    const inventory = [
        { name: 'Golden Coin', rarity: 'rare', value: 50, image: 'items/drops/coin.jpg' },
        { name: 'Magic Hat', rarity: 'epic', value: 150, image: 'items/drops/hat.jpg' },
        { name: 'Crystal Gem', rarity: 'legendary', value: 500, image: 'items/drops/gem.jpg' }
    ];
    
    const inventoryGrid = document.getElementById('inventory-grid');
    inventoryGrid.innerHTML = inventory.map(item => `
        <div class="item-card ${item.rarity}">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-price">${item.value}⭐</div>
            <div class="item-name">${item.name}</div>
        </div>
    `).join('');
}

// Модальные окна
function showDepositModal() {
    document.getElementById('deposit-address').textContent = CONFIG.MERCHANT_WALLET;
    showModal('deposit-modal');
}

function openCaseModal(caseType) {
    selectedCaseType = caseType;
    const price = CONFIG.CASE_PRICES[caseType];
    
    document.getElementById('modal-case-price').textContent = price;
    document.getElementById('modal-case-image').src = `items/cases/${caseType}-case.jpg`;
    document.getElementById('case-modal-title').textContent = `Открытие ${getCaseName(caseType)}`;
    
    // Проверка баланса
    const openButton = document.getElementById('btn-open-case');
    if (price > currentUser.balance && caseType !== 'free') {
        openButton.disabled = true;
        openButton.textContent = 'НЕДОСТАТОЧНО СРЕДСТВ';
        openButton.style.background = '#666';
    } else {
        openButton.disabled = false;
        openButton.innerHTML = `ОТКРЫТЬ ЗА <span id="modal-case-price">${price}</span> ⭐`;
        openButton.style.background = '';
    }
    
    showModal('case-modal');
}

function openCase() {
    if (!selectedCaseType) return;
    
    const price = CONFIG.CASE_PRICES[selectedCaseType];
    
    // Проверка баланса
    if (price > currentUser.balance && selectedCaseType !== 'free') {
        alert('Недостаточно средств!');
        return;
    }
    
    // Симуляция открытия кейса
    simulateCaseOpening(selectedCaseType);
}

function simulateCaseOpening(caseType) {
    const items = {
        free: [
            { name: 'Обычная монета', rarity: 'common', value: 5, image: 'items/drops/coin.jpg' },
            { name: 'Необычный цветок', rarity: 'uncommon', value: 15, image: 'items/drops/flower.jpg' },
            { name: 'Редкая шляпа', rarity: 'rare', value: 50, image: 'items/drops/hat.jpg' }
        ],
        basic: [
            { name: 'Серебряная монета', rarity: 'uncommon', value: 20, image: 'items/drops/coin2.jpg' },
            { name: 'Магический свиток', rarity: 'rare', value: 75, image: 'items/drops/scroll.jpg' },
            { name: 'Эпический меч', rarity: 'epic', value: 200, image: 'items/drops/sword.jpg' }
        ],
        premium: [
            { name: 'Золотой слиток', rarity: 'rare', value: 100, image: 'items/drops/gold.jpg' },
            { name: 'Кристальный шар', rarity: 'epic', value: 300, image: 'items/drops/crystal.jpg' },
            { name: 'Легендарный артефакт', rarity: 'legendary', value: 800, image: 'items/drops/artifact.jpg' }
        ],
        luxury: [
            { name: 'Алмазный перстень', rarity: 'epic', value: 500, image: 'items/drops/ring.jpg' },
            { name: 'Мифический дракон', rarity: 'mythic', value: 1500, image: 'items/drops/dragon.jpg' },
            { name: 'Божественная реликвия', rarity: 'mythic', value: 5000, image: 'items/drops/relic.jpg' }
        ]
    };
    
    const caseItems = items[caseType] || items.free;
    const wonItem = caseItems[Math.floor(Math.random() * caseItems.length)];
    
    // Обновление баланса
    const price = CONFIG.CASE_PRICES[caseType];
    currentUser.balance = currentUser.balance - price + wonItem.value;
    
    // Показать выигрыш
    showWinModal(wonItem);
    
    // Обновить интерфейс
    updateUserInterface();
    updateInventory();
}

function showWinModal(item) {
    document.getElementById('won-item-image').src = item.image;
    document.getElementById('won-item-name').textContent = item.name;
    document.getElementById('won-item-value').textContent = item.value;
    
    closeModal('case-modal');
    showModal('win-modal');
}

function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

function getCaseName(caseType) {
    const names = {
        free: 'бесплатного кейса',
        basic: 'базового кейса', 
        premium: 'премиум кейса',
        luxury: 'люкс кейса'
    };
    return names[caseType] || 'кейса';
}

// Функции кошелька
function connectWallet() {
    // Интеграция с TonConnect будет здесь
    alert('Функция подключения кошелька скоро будет доступна!');
}

function copyReferralLink() {
    const link = `https://t.me/${CONFIG.BOT_USERNAME}?start=ref_${currentUser.id}`;
    navigator.clipboard.writeText(link);
    alert('Реферальная ссылка скопирована в буфер обмена!');
}

function selectAmount(amount) {
    depositAmount = amount;
    document.querySelectorAll('.deposit-option').forEach(opt => opt.classList.remove('selected'));
    event.target.classList.add('selected');
}

function copyAddress() {
    navigator.clipboard.writeText(CONFIG.MERCHANT_WALLET);
    alert('Адрес кошелька скопирован!');
}

function showHistory() {
    alert('История выигрышей скоро будет доступна!');
}

// Инициализация при загрузке
initializeApp();