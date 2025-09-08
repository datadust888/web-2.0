// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg?.ready) tg.ready();
if (tg?.expand) try{ tg.expand(); }catch(e){/*ignore*/}

// Fallback mock for local dev (if not in telegram)
if (!tg) {
  window.Telegram = { WebApp: {
    MainButton: {
      visible: false,
      text: '',
      show(){ this.visible = true; console.log('MainButton.show'); },
      hide(){ this.visible = false; console.log('MainButton.hide'); },
      onClick(cb){ this._cb = cb; },
      click(){ if (this._cb) this._cb(); }
    },
    ready(){ console.log('WebApp: ready (mock)'); },
    close(){ alert('WebApp.close() called (mock)'); }
  }};
}

// --- DOM
const balanceEl = document.getElementById('balance');
const profileBalanceEl = document.getElementById('profile-balance');
const profileNameEl = document.getElementById('profile-name');
const avatarEl = document.getElementById('avatar');
const profileAvatarEl = document.getElementById('profile-avatar');
const freeCaseResult = document.getElementById('free-case-result');
const liveDropLine = document.getElementById('live-drop-line');
const casesGrid = document.getElementById('casesGrid');

const navMain = document.getElementById('nav-main');
const navTop = document.getElementById('nav-top');
const navProfile = document.getElementById('nav-profile');
const pages = {
  main: document.getElementById('page-main'),
  top: document.getElementById('page-top'),
  profile: document.getElementById('page-profile')
};

const btnClose = document.getElementById('btnClose');
const btnAddTop = document.getElementById('btn-add-balance-top');
const btnDepositProfile = document.getElementById('btn-deposit-profile');
const btnConnectWallet = document.getElementById('btn-connect-wallet');
const btnDisconnectWallet = document.getElementById('btn-disconnect-wallet');
const btnCopyRef = document.getElementById('btn-copy-ref');
const refLinkInput = document.getElementById('ref-link');

// demo: takeBtn
const takeBtn = document.getElementById('takeBtn');

// --- APP STATE
let currentBalance = 0.00;
let inventory = [];
// FREE DAILY кейс предметы (теперь с .jpg)
const freeDailyItems = [
  { name: "+1 ⭐️", stars: 1, img: "items/star1.jpg" },
  { name: "+3 ⭐️", stars: 3, img: "items/star3.jpg" },
  { name: "+5 ⭐️", stars: 5, img: "items/star5.jpg" },
  { name: "+10 ⭐️", stars: 10, img: "items/star10.jpg" },
  { name: "+15 ⭐️", stars: 15, img: "items/telegram_gift1.jpg" },
  { name: "+20 ⭐️", stars: 20, img: "items/telegram_gift2.jpg" },
  { name: "+30 ⭐️", stars: 30, img: "items/telegram_gift3.jpg" },
  { name: "+35 ⭐️", stars: 35, img: "items/star35.jpg" },
  { name: "+60 ⭐️", stars: 60, img: "items/telegram_cake.jpg" },
  { name: "+80 ⭐️", stars: 80, img: "items/telegram_rocket.jpg" },
  { name: "+120 ⭐️", stars: 120, img: "items/telegram_diamond.jpg" },
  { name: "+4.94 TON (~1547 ⭐️)", stars: 1547, ton: 4.94, img: "items/snoop_cigar.jpg" },
  { name: "+10 TON (~3212 ⭐️)", stars: 3212, ton: 10, img: "items/top_hat.jpg" },
  { name: "+20 TON (~6893 ⭐️)", stars: 6893, ton: 20, img: "items/vintage_cigar.jpg" }
];

// Leaderboard (mock)
const leaderboard = [
  { name: 'Alice', avatar:'default-avatar.png', amount: 15200 },
  { name: 'Bob', avatar:'default-avatar.png', amount: 12050 },
  { name: 'Charlie', avatar:'default-avatar.png', amount: 10120 },
  { name: 'Dmitry', avatar:'default-avatar.png', amount: 9020 },
  { name: 'Eve', avatar:'default-avatar.png', amount: 8000 }
];

// --- HELPERS
function updateBalanceUI(){
  balanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
  profileBalanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
}

function addLiveDropItem(imgUrl, text){
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.innerHTML = <div style="display:flex;flex-direction:column;align-items:center;gap:4px"><img src="${imgUrl}" style="width:36px;height:36px;border-radius:8px"/><div style="font-size:11px;color:var(--muted)">${text || ''}</div></div>;
  liveDropLine.appendChild(el);
  // keep max
  while(liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
  // auto-scroll to end
  liveDropLine.scrollLeft = liveDropLine.scrollWidth;
}

// inventory UI
function updateInventoryUI(){
  const cont = document.getElementById('inventory-items');
  cont.innerHTML = '';
  inventory.forEach(it=>{
    const img = document.createElement('img');
    img.src = it.img;
    img.title = it.name;
    img.addEventListener('click', ()=> alert(`Item: ${it.name}`));
    cont.appendChild(img);
  });
}

// render leaderboard
function renderLeaderboard(){const root = document.getElementById('leaderboardList');
  root.innerHTML = '';
  leaderboard.forEach((u, idx)=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = <div style="display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;border-radius:10px;overflow:hidden"><img src="${u.avatar}" style="width:100%;height:100%;object-fit:cover" /></div><div><div style="font-weight:700">${idx+1}. ${u.name}</div><div style="font-size:12px;color:var(--muted)">spent: ${u.amount} ⭐️</div></div></div><div style="font-weight:800">${u.amount} ⭐️</div>;
    root.appendChild(row);
  });
}

// open case (core logic kept)
function openCaseRandom(items){
  const item = items[Math.floor(Math.random()*items.length)];
  // update balance & inventory
  currentBalance += item.stars || 0;
  inventory.push(item);
  updateInventoryUI();
  updateBalanceUI();
  addLiveDropItem(item.img || 'items/star1.png', item.name);
  freeCaseResult.innerText = Вы получили: ${item.name};
}

// --- EVENTS & INIT

// fix: profile name/avatar if Telegram user present
const user = tg?.initDataUnsafe?.user;
if(user){
  profileNameEl.innerText = user.first_name || 'User';
  if(user.photo_url){
    avatarEl.src = user.photo_url;
    profileAvatarEl.src = user.photo_url;
  }
}

// free case click
document.getElementById('free-case-card').addEventListener('click', ()=>{
  openCaseRandom(freeDailyItems);
});

// sample: other cases (delegation)
casesGrid.addEventListener('click', (e)=>{
  const card = e.target.closest('.case');
  if(!card) return;
  if(card.id === 'free-case-card') return; // handled above
  const price = Number(card.dataset.price || 0);
  const name = card.dataset.name || 'Case';
  if(price > currentBalance){
    if(confirm('Недостаточно средств. Пополнить?')) {
      // show deposit flow
      if (tg?.MainButton) {
        tg.MainButton.text = 'Pay';
        tg.MainButton.show();
        tg.MainButton.onClick(()=> {
          alert('Имитация покупки (MainButton click)');
          tg.MainButton.hide();
        });
      } else alert('Откройте в Telegram для оплаты');
    }
    return;
  }
  // subtract currency and open (demo: price -> stars)
  currentBalance -= price;
  updateBalanceUI();
  const reward = { name: Prize from ${name}, stars: Math.round(price*6), img: 'items/star1.png' };
  inventory.push(reward);
  updateInventoryUI();
  addLiveDropItem(reward.img, reward.name);
  alert(`Вы открыли ${name} и получили: ${reward.name}`);
});

// nav
function showPage(key){
  Object.values(pages).forEach(p=>p.classList.remove('active-page'));
  pages[key].classList.add('active-page');
  [navMain,navTop,navProfile].forEach(n=>n.classList.remove('active'));
  if(key === 'main') navMain.classList.add('active');
  if(key === 'top') navTop.classList.add('active');
  if(key === 'profile') navProfile.classList.add('active');
}
navMain.addEventListener('click', ()=> showPage('main'));
navTop.addEventListener('click', ()=> { showPage('top'); renderLeaderboard(); });
navProfile.addEventListener('click', ()=> { showPage('profile'); });

// close button
btnClose.addEventListener('click', ()=> {
  if (tg?.close) tg.close();
  else alert('Close (not in Telegram)');
});

// deposit top
btnAddTop.addEventListener('click', ()=> {
  if (tg?.MainButton) {
    tg.MainButton.text = 'Пополнить';
    tg.MainButton.show();
    tg.MainButton.onClick(()=> {
      alert('Deposit pressed (simulate)');
      tg.MainButton.hide();
    });
  } else alert('Откройте в Telegram для пополнения');
});

// deposit from profile
btnDepositProfile.addEventListener('click', ()=> {
  btnAddTop.click();
});

// wallet connect/disconnect (mock)
let walletAddr = null;
btnConnectWallet.addEventListener('click', ()=> {
  walletAddr = 'UQBS6...k5qv'; // demo: in real scenario call wallet connect
  document.getElementById('wallet-address').innerText = walletAddr;
  // generate referral
  refLinkInput.value = https://t.me/case_official_bot?start=${walletAddr.slice(-6)};
  alert('Wallet connected (mock)');
});
btnDisconnectWallet.addEventListener('click', ()=> {
  walletAddr = null;
  document.getElementById('wallet-address').innerText = '—';
  refLinkInput.value = '';
  alert('Wallet disconnected (mock)');
});

// copy referral
btnCopyRef.addEventListener('click', async ()=>{
  const v = refLinkInput.value;
  if(!v) return alert('Сначала подключите кошелёк');
  try{
    await navigator.clipboard.writeText(v);
    alert('Ссылка скопирована');
  }catch(e){
    prompt('Copy manually:', v);
  }
});

// banner take btn (use MainButton)
takeBtn.addEventListener('click', ()=>{
  if (tg?.MainButton) {
    tg.MainButton.text = 'Получить'; tg.MainButton.show();
    tg.MainButton.onClick(()=> {
      alert('You clicked Telegram MainButton: Получить (mock)');
      tg.MainButton.hide();
    });
  } else {
    alert('Take pressed (not in Telegram)');
  }
});

// simulate live drops (demo) - in real use: subscribe to websocket/event-stream
setInterval(()=>{
  const item = freeDailyItems[Math.floor(Math.random()*freeDailyItems.length)];
  addLiveDropItem(item.img || 'items/star1.png', item.name);
}, 5000);

// init UI
updateInventoryUI();
updateBalanceUI();
renderLeaderboard();