// app.js

// Проверяем Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg?.ready) tg.ready();
if (tg?.expand) tg.expand();

// --- DOM элементы
const balanceEl = document.getElementById('balance');
const profileBalanceEl = document.getElementById('profile-balance');
const profileNameEl = document.getElementById('profile-name');
const avatarEl = document.getElementById('avatar');
const profileAvatarEl = document.getElementById('profile-avatar');
const walletAddressEl = document.getElementById('wallet-address');
const refLinkInput = document.getElementById('ref-link');

const freeCaseBtn = document.getElementById('takeBtn');
const freeCaseResult = document.getElementById('free-case-result');
const liveDropLine = document.getElementById('live-drop-line');
const casesGrid = document.getElementById('casesGrid');

// Навигация
const navMain = document.getElementById('nav-main');
const navTop = document.getElementById('nav-top');
const navProfile = document.getElementById('nav-profile');
const pages = {
  main: document.getElementById('page-main'),
  top: document.getElementById('page-top'),
  profile: document.getElementById('page-profile')
};

// --- Состояние
let currentBalance = 0.00;
let inventory = [];
let subscribed = false;

// --- Кейсы
const freeDailyItems = [
  { name: "+1 ⭐️", stars: 1, img: "items/star1.jpg", weight: 50 },
  { name: "+3 ⭐️", stars: 3, img: "items/star3.jpg", weight: 30 },
  { name: "+5 ⭐️", stars: 5, img: "items/star5.jpg", weight: 15 },
  { name: "+10 ⭐️", stars: 10, img: "items/star10.jpg", weight: 4 },
  { name: "🎁 Gift", stars: 15, img: "items/telegram_gift1.jpg", weight: 1 }
];

// Кейсы за TON
const case01Items = [
  { name: "+0.001 TON", ton: 0.001, stars: 10, img: "items/case01_1.jpg", weight: 90 },
  { name: "🧢 Durov Cap", ton: 0.001, stars: 50, img: "items/case01_cap.jpg", weight: 0.0001 },
  { name: "🐸 Pepe", ton: 0.001, stars: 100, img: "items/case01_pepe.jpg", weight: 0.00001 }
];

const case05Items = [
  { name: "+0.05 TON", ton: 0.05, stars: 50, img: "items/case05_1.jpg", weight: 15 },
  { name: "+0.4 TON", ton: 0.4, stars: 400, img: "items/case05_2.jpg", weight: 20 },
  { name: "+0.77 TON", ton: 0.77, stars: 770, img: "items/case05_3.jpg", weight: 37 },
  { name: "🎄 Calendar", ton: 1.43, stars: 1430, img: "items/case05_calendar.jpg", weight: 8 },
  { name: "🍭 Lollipop", ton: 1.54, stars: 1540, img: "items/case05_lollipop.jpg", weight: 7 },
  { name: "🧪 Hex Pot", ton: 3.12, stars: 3120, img: "items/case05_hex.jpg", weight: 6 },
  { name: "📦 Berry Box", ton: 4.05, stars: 4050, img: "items/case05_berry.jpg", weight: 4 },
  { name: "🌸 Flower", ton: 5.13, stars: 5130, img: "items/case05_flower.jpg", weight: 3 },
  { name: "💀 Skull Ball", ton: 7.81, stars: 7810, img: "items/case05_skull.jpg", weight: 0.5 },
  { name: "💍 NFT Ring", ton: 18.15, stars: 18150, img: "items/case05_ring.jpg", weight: 0.1 }
];

// --- Функции
function updateBalanceUI() {
  balanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
  profileBalanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
}

function addLiveDropItem(imgUrl, text){
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
      <img src="${imgUrl}" style="width:36px;height:36px;border-radius:8px"/>
      <div style="font-size:11px;color:#aaa">${text || ''}</div>
    </div>`;
  liveDropLine.appendChild(el);
  if(liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
}

function chooseWeightedRandom(items){
  const total = items.reduce((sum,i)=>sum+i.weight,0);
  let r = Math.random()*total;
  for(let i=0;i<items.length;i++){
    r -= items[i].weight;
    if(r<=0) return items[i];
  }
  return items[items.length-1];
}

function openFreeCase(){
  const item = chooseWeightedRandom(freeDailyItems);
  currentBalance += item.stars;
  inventory.push(item);
  addLiveDropItem(item.img, item.name);
  freeCaseResult.innerText = Ты получил: ${item.name};
  updateBalanceUI();
}// --- Подписка на канал для бесплатного кейса
const subscribeBtn = document.createElement('button');
subscribeBtn.textContent = "Subscribe to @fiatvalue_bot";
subscribeBtn.className = 'btn-primary';
subscribeBtn.addEventListener('click', () => {
  subscribed = true;
  subscribeBtn.remove();
  alert('Спасибо за подписку! Теперь можно открыть бесплатный кейс.');
});
freeCaseBtn.before(subscribeBtn);

freeCaseBtn.addEventListener('click', () => {
  if(!subscribed){
    alert('Подпишись на канал, чтобы открыть кейс');
    return;
  }
  openFreeCase();
});

// --- Навигация
navMain.addEventListener('click', ()=> showPage('main'));
navTop.addEventListener('click', ()=> showPage('top'));
navProfile.addEventListener('click', ()=> showPage('profile'));

function showPage(page){
  for(const key in pages) pages[key].classList.remove('active-page');
  pages[page].classList.add('active-page');
  navMain.classList.toggle('active', page==='main');
  navTop.classList.toggle('active', page==='top');
  navProfile.classList.toggle('active', page==='profile');
}

// --- Иконки и имя из Telegram
if(tg?.initDataUnsafe?.user){
  const user = tg.initDataUnsafe.user;
  avatarEl.src = user.photo_url || 'default-avatar.png';
  profileAvatarEl.src = user.photo_url || 'default-avatar.png';
  profileNameEl.innerText = user.first_name || 'Guest';
}

// --- Инициализация Live Drop
setInterval(()=>{
  if(inventory.length>0){
    const item = inventory[Math.floor(Math.random()*inventory.length)];
    addLiveDropItem(item.img,item.name);
  }
},5000);

// --- Инициализация UI
updateBalanceUI();
showPage('main');