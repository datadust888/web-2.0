// Configuration
const CONFIG = {
    TON_TO_STARS: 176,
    FREE_CASE_COOLDOWN: 24 * 60 * 60 * 1000,
    BOT_USERNAME: 'fiatvalue_bot',
    CHANNEL_USERNAME: 'fiatvalue'
};

// Global State
let currentUser = null;
let userInventory = [];
let liveDrops = [];
let leaderboard = [];
let freeCaseAvailable = false;
let freeCaseCooldown = 0;
let hasSentWelcomeMessage = false;

// Initialize Telegram Web App
const tg = window.Telegram.WebApp;

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApp();
        setupEventListeners();
        startTimers();
    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('App initialization failed', 'error');
    }
});

async function initializeApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    await loadUserData();
    updateUserInterface();
    updateFreeCaseTimer();
    await loadLiveDrops();
    await loadLeaderboard();
    await loadInventory();
}

async function loadUserData() {
    const initData = tg.initDataUnsafe;
    
    if (initData?.user) {
        currentUser = {
            id: initData.user.id,
            firstName: initData.user.first_name,
            lastName: initData.user.last_name || '',
            username: initData.user.username,
            photoUrl: initData.user.photo_url,
            balance: 100,
            lastFreeCase: null,
            invitedCount: 0,
            earnedFromRefs: 0,
            walletConnected: false,
            walletAddress: null,
            firstOpen: true,
            isSubscribed: false
        };

        try {
            const response = await fetch(`/api/user/${currentUser.id}`);
            if (response.ok) {
                const userData = await response.json();
                Object.assign(currentUser, userData);
            }
        } catch (error) {
            console.log('Using default user data');
        }

        await checkSubscriptionStatus();
        checkFreeCaseAvailability();
    }
}

async function checkSubscriptionStatus() {
    try {
        const response = await fetch(`/api/check_subscription/${currentUser.id}`);
        const result = await response.json();
        currentUser.isSubscribed = result.subscribed;
        return result.subscribed;
    } catch (error) {
        currentUser.isSubscribed = false;
        return false;
    }
}

function checkFreeCaseAvailability() {
    if (!currentUser.lastFreeCase) {
        freeCaseAvailable = true;
        return;
    }

    const now = Date.now();
    const lastOpen = new Date(currentUser.lastFreeCase).getTime();
    const timePassed = now - lastOpen;
    
    freeCaseAvailable = timePassed >= CONFIG.FREE_CASE_COOLDOWN;
    freeCaseCooldown = Math.max(0, CONFIG.FREE_CASE_COOLDOWN - timePassed);
    updateFreeCaseUI();
}

function updateFreeCaseUI() {
    const freeCaseBtn = document.querySelector('.free-case .btn-open');
    const timerElement = document.getElementById('free-timer');
    
    if (freeCaseAvailable && currentUser.isSubscribed) {
        freeCaseBtn.disabled = false;
        freeCaseBtn.textContent = 'OPEN';
        timerElement.textContent = 'Available Now!';
        timerElement.style.color = '#4caf50';
    } else if (!currentUser.isSubscribed) {
        freeCaseBtn.disabled = false;
        freeCaseBtn.textContent = 'SUBSCRIBE TO OPEN';
        timerElement.textContent = 'Subscription required';
        timerElement.style.color = '#ff9800';
    } else {
        freeCaseBtn.disabled = true;
        freeCaseBtn.textContent = 'WAIT';
        timerElement.style.color = '#ff9800';
    }
}

function updateFreeCaseTimer() {
    if (!freeCaseAvailable && freeCaseCooldown > 0) {
        const hours = Math.floor(freeCaseCooldown / (1000 * 60 * 60));
        const minutes = Math.floor((freeCaseCooldown % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((freeCaseCooldown % (1000 * 60)) / 1000);
        
        document.getElementById('free-timer').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        freeCaseCooldown -= 1000;
        
        if (freeCaseCooldown <= 0) {
            freeCaseAvailable = true;
            updateFreeCaseUI();
        }
    }
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const page = e.currentTarget.getAttribute('data-page');
            switchPage(page);
        });
    });

    document.getElementById('top-up-btn').addEventListener('click', showTopUpOptions);
    
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function switchPage(pageName) {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-page="${pageName}"]`).classList.add('active');

    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(`${pageName}-page`).classList.add('active');

    if (pageName === 'weekly') {
        loadLeaderboard();
    } else if (pageName === 'profile') {
        loadInventory();
        updateProfileStats();
    }
}

async function openCase(caseType) {
    if (caseType === 'free') {
        if (!freeCaseAvailable) {
            showNotification('Free case is not available yet!', 'error');
            return;
        }
        
        const isSubscribed = await checkSubscriptionStatus();
        if (!isSubscribed) {
            showModal('subscription-modal');
            return;
        }
    } else {
        const casePrice = getCasePrice(caseType);
        if (currentUser.balance < casePrice) {
            showNotification('Insufficient balance!', 'error');
            showTopUpOptions();
            return;
        }
    }

    showCaseOpeningAnimation(caseType);
    
    try {
        const result = await simulateCaseOpening(caseType);
        currentUser.balance = result.newBalance;
        updateBalanceUI();
        addToLiveDrops(result.item);
        addToInventory(result.item);
        showWinAnimation(result.item);
        
        if (currentUser.firstOpen && !hasSentWelcomeMessage) {
            await sendWelcomeMessage();
            currentUser.firstOpen = false;
            hasSentWelcomeMessage = true;
        }
        
    } catch (error) {
        showNotification('Error opening case: ' + error.message, 'error');
        closeModal('case-modal');
    }
}

function getCasePrice(caseType) {
    const prices = { 'free': 0, 'basic': 22, 'premium': 110 };
    return prices[caseType] || 0;
}

function showCaseOpeningAnimation(caseType) {
    const caseImage = getCaseImage(caseType);
    document.getElementById('spinning-case').src = caseImage;
    showModal('case-modal');
    
    gsap.to('.case-spinner', {
        rotation: 360,
        duration: 2,
        repeat: -1,
        ease: "power2.inOut"
    });
}

async function simulateCaseOpening(caseType) {
    await new Promise(resolve => {
        setTimeout(() => {
            gsap.to('.case-spinner', {
                rotation: 720,
                duration: 3,
                ease: "power2.inOut"
            });
            setTimeout(resolve, 3000);
        }, 2000);
    });
    
    const item = generateRandomItem(caseType);
    const newBalance = currentUser.balance - getCasePrice(caseType) + item.value;
    
    if (caseType === 'free') {
        currentUser.lastFreeCase = new Date().toISOString();
        freeCaseAvailable = false;
        freeCaseCooldown = CONFIG.FREE_CASE_COOLDOWN;
        updateFreeCaseUI();
    }
    
    return { item: item, newBalance: newBalance };
}

function generateRandomItem(caseType) {
    const items = {
        free: [
            { name: "Common NFT", value: 11, rarity: "common", image: "items/drops/common/nft1.jpg", weight: 40 },
            { name: "Rare Shard", value: 20, rarity: "rare", image: "items/drops/rare/shard1.jpg", weight: 25 },
            { name: "Energy Boost", value: 12, rarity: "common", image: "items/drops/common/boost1.jpg", weight: 15 },
            { name: "30 Stars", value: 30, rarity: "common", image: "icons/stars.jpg", weight: 12 },
            { name: "Epic Fragment", value: 60, rarity: "epic", image: "items/drops/epic/fragment1.jpg", weight: 5 },
            { name: "Mystery Box", value: 100, rarity: "legendary", image: "items/drops/legendary/mystery.jpg", weight: 3 }
        ],
        basic: [
            { name: "Common Dust", value: 3, rarity: "common", image: "items/drops/common/dust1.jpg", weight: 20 },
            { name: "Rare NFT", value: 33, rarity: "rare", image: "items/drops/rare/nft1.jpg", weight: 15 },
            { name: "50 Stars", value: 50, rarity: "common", image: "icons/stars.jpg", weight: 12 },
            { name: "Epic Material", value: 88, rarity: "epic", image: "items/drops/epic/material1.jpg", weight: 8 },
            { name: "Legendary Shard", value: 200, rarity: "legendary", image: "items/drops/legendary/shard1.jpg", weight: 3 },
            { name: "500 Stars", value: 500, rarity: "mythic", image: "icons/stars.jpg", weight: 2 }
        ],
        premium: [
            { name: "Rare NFT Pack", value: 66, rarity: "rare", image: "items/drops/rare/pack1.jpg", weight: 15 },
            { name: "Epic NFT", value: 88, rarity: "epic", image: "items/drops/epic/nft1.jpg", weight: 12 },
            { name: "250 Stars", value: 250, rarity: "epic", image: "icons/stars.jpg", weight: 10 },
            { name: "Legendary NFT", value: 264, rarity: "legendary", image: "items/drops/legendary/nft1.jpg", weight: 6 },
            { name: "Mythic Fragment", value: 400, rarity: "mythic", image: "items/drops/mythic/fragment1.jpg", weight: 4 },
            { name: "1500 Stars", value: 1500, rarity: "mythic", image: "icons/stars.jpg", weight: 2 },
            { name: "Ultimate Jackpot", value: 2500, rarity: "mythic", image: "items/drops/mythic/jackpot.jpg", weight: 1 }
        ]
    };

    const caseItems = items[caseType] || items.free;
    const totalWeight = caseItems.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const item of caseItems) {
        random -= item.weight;
        if (random <= 0) return { ...item };
    }

    return caseItems[0];
}

function showWinAnimation(item) {
    closeModal('case-modal');
    
    document.getElementById('won-item-image').src = item.image;
    document.getElementById('won-item-name').textContent = item.name;
    document.getElementById('won-item-value').textContent = item.value;
    
    const rarityElement = document.getElementById('won-item-rarity');
    rarityElement.textContent = item.rarity.toUpperCase();
    rarityElement.className = `item-rarity rarity-${item.rarity}`;
    
    showModal('win-modal');
    
    gsap.from('.won-item', {
        scale: 0,
        rotation: -180,
        duration: 1,
        ease: "back.out(1.7)"
    });
    
    gsap.from('#won-item-name, .item-value', {
        y: 50,
        opacity: 0,
        duration: 0.8,
        delay: 0.5,
        stagger: 0.2
    });
}

function addToLiveDrops(item) {
    const drop = {
        user: currentUser.firstName,
        avatar: currentUser.photoUrl || 'icons/default-avatar.jpg',
        item: item,
        timestamp: Date.now()
    };
    
    liveDrops.unshift(drop);
    if (liveDrops.length > 15) liveDrops = liveDrops.slice(0, 15);
    updateLiveDropsUI();
}

function updateLiveDropsUI() {
    const container = document.getElementById('live-drop-feed');
    if (!container) return;
    
    container.innerHTML = liveDrops.map(drop => `
        <div class="live-drop-item">
            <img src="${drop.avatar}" alt="${drop.user}" class="live-drop-avatar">
            <span>${drop.user}</span>
            <img src="${drop.item.image}" alt="${drop.item.name}">
            <span class="rarity-${drop.item.rarity}">${drop.item.rarity}</span>
        </div>
    `).join('');
}

function addToInventory(item) {
    userInventory.push({
        ...item,
        id: Date.now(),
        acquired: new Date().toISOString()
    });
    updateInventoryUI();
}

function updateInventoryUI() {
    const container = document.getElementById('inventory-grid');
    if (!container) return;
    
    container.innerHTML = userInventory.map(item => `
        <div class="inventory-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-name">${item.name}</div>
            <div class="item-rarity rarity-${item.rarity}">${item.rarity}</div>
            <div class="item-value">${item.value} ⭐</div>
        </div>
    `).join('');
}

function updateUserInterface() {
    if (!currentUser) return;
    
    document.getElementById('user-avatar').src = currentUser.photoUrl || 'icons/default-avatar.jpg';
    document.getElementById('user-name').textContent = currentUser.firstName;
    document.getElementById('balance-amount').textContent = currentUser.balance;
    
    document.getElementById('profile-avatar').src = currentUser.photoUrl || 'icons/default-avatar.jpg';
    document.getElementById('profile-name').textContent = currentUser.firstName;
    document.getElementById('profile-balance').textContent = currentUser.balance;
}

function updateBalanceUI() {
    document.getElementById('balance-amount').textContent = currentUser.balance;
    document.getElementById('profile-balance').textContent = currentUser.balance;
    document.getElementById('cases-opened').textContent = userInventory.length;
}

function updateProfileStats() {
    document.getElementById('invited-count').textContent = currentUser.invitedCount || 0;
    document.getElementById('earned-amount').textContent = currentUser.earnedFromRefs || 0;
}

async function loadLiveDrops() {
    try {
        const response = await fetch('/api/live-drops');
        liveDrops = await response.json();
    } catch (error) {
        liveDrops = generateMockLiveDrops();
    }
    updateLiveDropsUI();
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/weekly-leaderboard');
        leaderboard = await response.json();
    } catch (error) {
        leaderboard = generateMockLeaderboard();
    }
    updateLeaderboardUI();
}

async function loadInventory() {
    try {
        const response = await fetch(`/api/inventory/${currentUser.id}`);
        userInventory = await response.json();
    } catch (error) {
        userInventory = [];
    }
    updateInventoryUI();
}

function generateMockLiveDrops() {
    const users = ['Alex', 'Maria', 'John', 'Sarah', 'Mike'];
    const items = [
        { name: "Common NFT", rarity: "common", image: "items/drops/common/nft1.jpg" },
        { name: "Rare Shard", rarity: "rare", image: "items/drops/rare/shard1.jpg" },
        { name: "Epic NFT", rarity: "epic", image: "items/drops/epic/nft1.jpg" }
    ];
    
    return Array.from({ length: 8 }, (_, i) => ({
        user: users[i % users.length],
        avatar: 'icons/default-avatar.jpg',
        item: items[i % items.length],
        timestamp: Date.now() - i * 100000
    }));
}

function generateMockLeaderboard() {
    return [
        { rank: 1, name: "CryptoKing", amount: 12500, avatar: "icons/default-avatar.jpg" },
        { rank: 2, name: "NFTHunter", amount: 9800, avatar: "icons/default-avatar.jpg" },
        { rank: 3, name: "BlockMaster", amount: 7650, avatar: "icons/default-avatar.jpg" },
        { rank: 4, name: currentUser.firstName, amount: currentUser.balance, avatar: currentUser.photoUrl, isCurrent: true }
    ];
}

function updateLeaderboardUI() {
    const container = document.getElementById('leaderboard');
    if (!container) return;
    
    container.innerHTML = leaderboard.map(player => `
        <div class="leaderboard-item ${player.isCurrent ? 'current-user' : ''}">
            <div class="leaderboard-rank">#${player.rank}</div>
            <div class="leaderboard-user">
                <img src="${player.avatar}" alt="${player.name}" class="leaderboard-avatar">
                <span>${player.name}</span>
            </div>
            <div class="leaderboard-amount">${player.amount} ⭐</div>
        </div>
    `).join('');
}

function connectWallet() {
    showNotification('Wallet connection feature coming soon!', 'info');
}

function copyReferral() {
    const referralLink = `https://t.me/${CONFIG.BOT_USERNAME}?start=ref_${currentUser.id}`;
    navigator.clipboard.writeText(referralLink);
    showNotification('Referral link copied to clipboard!', 'success');
}

function showTopUpOptions() {
    tg.showPopup({
        title: 'Top Up Balance',
        message: 'Choose top-up method:',
        buttons: [
            { id: 'ton', type: 'default', text: 'With TON' },
            { id: 'card', type: 'default', text: 'With Card' },
            { type: 'cancel' }
        ]
    }, (buttonId) => {
        if (buttonId === 'ton') showTonTopUp();
        else if (buttonId === 'card') showCardTopUp();
    });
}

function showTonTopUp() {
    tg.showPopup({
        title: 'TON Deposit',
        message: 'Send TON to this address:\n\n' + generateTonAddress(),
        buttons: [{ type: 'ok' }]
    });
}

function showCardTopUp() {
    tg.showPopup({
        title: 'Card Payment',
        message: 'Card payments coming soon!',
        buttons: [{ type: 'ok' }]
    });
}

function generateTonAddress() {
    return 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N';
}

async function sendWelcomeMessage() {
    const message = `
🎉 Добро пожаловать в FiatValue NFT Gifts!

Спасибо, что присоединились к нашему сообществу! Вот важные ссылки:

🔗 Веб-приложение: https://t.me/fiatvalue_bot/app
📋 Правила использования: https://telegram.org/tos
🔒 Политика конфиденциальности: https://telegram.org/privacy

Важные правила:
- Звезды, использованные для пополнения баланса, не возвращаются
- Каждый бесплатный кейс требует активной подписки на канал
- Удачи и приятной игры! 🍀

Нужна помощь? Пишите @fiatvalue_support
    `.trim();

    showNotification('Добро пожаловать! Проверьте личные сообщения от бота.', 'success');
    
    try {
        await fetch('/api/send-welcome-message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: currentUser.id,
                message: message
            })
        });
    } catch (error) {
        console.log('Welcome message sent to console (mock)');
    }
}

async function checkSubscription() {
    const isSubscribed = await checkSubscriptionStatus();
    if (isSubscribed) {
        closeModal('subscription-modal');
        showNotification('Subscription verified! You can now open the case.', 'success');
        updateFreeCaseUI();
        return true;
    } else {
        showNotification('Please subscribe to the channel first!', 'error');
        return false;
    }
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        gsap.fromTo(modal.querySelector('.modal-content'), 
            { scale: 0.8, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3 }
        );
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        gsap.to(modal.querySelector('.modal-content'), {
            scale: 0.8,
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
                modal.classList.remove('active');
            }
        });
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    gsap.to(notification, {
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
    
    setTimeout(() => {
        gsap.to(notification, {
            y: -100,
            opacity: 0,
            duration: 0.3,
            onComplete: () => notification.remove()
        });
    }, 3000);
}

function getCaseImage(caseType) {
    const images = {
        'free': 'items/cases/free-case.jpg',
        'basic': 'items/cases/basic-case.jpg',
        'premium': 'items/cases/premium-case.jpg'
    };
    return images[caseType] || images.free;
}

function startTimers() {
    setInterval(updateFreeCaseTimer, 1000);
    setInterval(updateLiveDropsUI, 5000);
}

tg.BackButton.onClick(() => {
    const activeModals = document.querySelectorAll('.modal.active');
    if (activeModals.length > 0) {
        closeModal(activeModals[0].id);
    } else {
        tg.close();
    }
});