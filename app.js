// Telegram WebApp
const tg = window.Telegram?.WebApp;
if(tg?.ready) tg.ready();
if(tg?.expand) try { tg.expand(); } catch(e){}

// DOM Elements
const balanceEl = document.getElementById('balance');
const profileBalanceEl = document.getElementById('profile-balance');
const avatarEl = document.getElementById('avatar');
const profileAvatarEl = document.getElementById('profile-avatar');
const profileNameEl = document.getElementById('profile-name');
const liveDropLine = document.getElementById('live-drop-line');
const freeCaseResult = document.getElementById('free-case-result');

const navMain = document.getElementById('nav-main');
const navTop = document.getElementById('nav-top');
const navProfile = document.getElementById('nav-profile');
const pages = {
  main: document.getElementById('page-main'),
  top: document.getElementById('page-top'),
  profile: document.getElementById('page-profile')
};

// App state
let currentBalance = 0.00;
let inventory = [];

// FREE DAILY кейс
const freeDailyItems = [
  { name: "+1 ⭐️", stars:1, img:"items/star1.jpg" },
  { name: "+3 ⭐️", stars:3, img:"items/star3.jpg" },
  { name: "+5 ⭐️", stars:5, img:"items/star5.jpg" },
  { name: "+10 ⭐️", stars:10, img:"items/star10.jpg" },
  { name: "+15 ⭐️", stars:15, img:"items/telegram_gift1.jpg" }
];

// Update balance
function updateBalanceUI(){
  balanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
  profileBalanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
}

// Open free case
document.getElementById('free-case-card').addEventListener('click', ()=>{
  const item = freeDailyItems[Math.floor(Math.random()*freeDailyItems.length)];
  currentBalance += item.stars;
  updateBalanceUI();
  addLiveDropItem(item.img, item.name);
  freeCaseResult.innerText = Вы получили ${item.name};
  inventory.push(item);
  updateInventoryUI();
});

// Live drop
function addLiveDropItem(imgUrl, text){
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.innerHTML = <img src="${imgUrl}" style="width:36px;height:36px;border-radius:6px"><span style="font-size:10px">${text}</span>;
  liveDropLine.appendChild(el);
  if(liveDropLine.children.length > 15) liveDropLine.removeChild(liveDropLine.children[0]);
}

// Inventory UI
function updateInventoryUI(){
  const invGrid = document.getElementById('inventory-items');
  invGrid.innerHTML = '';
  inventory.forEach(item=>{
    const el = document.createElement('img');
    el.src = item.img;
    el.title = item.name;
    invGrid.appendChild(el);
  });
}

// Nav buttons
navMain.addEventListener('click', ()=> switchPage('main'));
navTop.addEventListener('click', ()=> switchPage('top'));
navProfile.addEventListener('click', ()=> switchPage('profile'));

function switchPage(page){
  Object.values(pages).forEach(p=>p.classList.remove('active-page'));
  pages[page].classList.add('active-page');
  document.querySelectorAll('.nav-item').forEach(nav=>nav.classList.remove('active'));
  if(page==='main') navMain.classList.add('active');
  if(page==='top') navTop.classList.add('active');
  if(page==='profile') navProfile.classList.add('active');
}

// Set Telegram user info
if(tg?.initDataUnsafe?.user){
  const user = tg.initDataUnsafe.user;
  profileNameEl.innerText = user.first_name || 'Guest';
  avatarEl.src = profileAvatarEl.src = user.photo_url || 'default-avatar.png';
}

// Referral link
document.getElementById('btn-copy-ref').addEventListener('click', ()=>{
  const walletAddr = 'UQBS6...k5qv';
  const ref = https://t.me/fiatvalue_bot?start=${walletAddr.slice(-6)};
  navigator.clipboard.writeText(ref).then(()=>alert('Ссылка скопирована'));
});

// Deposit button
document.getElementById('btn-add-balance-top').addEventListener('click', ()=>{
  alert('Пополнение баланса будет реализовано позже');
});
document.getElementById('btn-deposit-profile').addEventListener('click', ()=>{
  alert('Пополнение баланса будет реализовано позже');
});