// web/app.js
const API_ROOT = '';

const tg = window.Telegram?.WebApp;
try { tg?.ready?.(); tg?.expand?.(); } catch(e){/*ignore*/}

let TELEGRAM_USER_ID = null;
let TELEGRAM_NAME = 'Guest';
let TELEGRAM_AVATAR = 'items/default-avatar.png';

if (tg?.initDataUnsafe?.user) {
  TELEGRAM_USER_ID = tg.initDataUnsafe.user.id?.toString() || local-${Date.now()};
  TELEGRAM_NAME = tg.initDataUnsafe.user.first_name || 'Guest';
  TELEGRAM_AVATAR = tg.initDataUnsafe.user.photo_url || TELEGRAM_AVATAR;
} else {
  // fallback to local testing id stored in localStorage
  TELEGRAM_USER_ID = localStorage.getItem('demo_user_id') || guest_${Math.floor(Math.random()*100000)};
  localStorage.setItem('demo_user_id', TELEGRAM_USER_ID);
}

// DOM refs
const profileNameEl = document.getElementById('profile-name');
const profileAvatarEl = document.getElementById('profile-avatar');
const balanceEl = document.getElementById('balance');
const walletAddressEl = document.getElementById('wallet-address');
const casesGrid = document.getElementById('casesGrid');
const liveDropLine = document.getElementById('live-drop-line');
const btnSubscribe = document.getElementById('btn-subscribe');
const btnOpenFree = document.getElementById('btn-open-free');
const modal = document.getElementById('case-modal');
const modalTitle = document.getElementById('modal-case-name');
const modalItems = document.getElementById('modal-items');
const modalOpenBtn = document.getElementById('modal-open-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const resultArea = document.getElementById('free-case-result');
const weeklyContainer = document.getElementById('weekly-leaderboard');
const inventoryGrid = document.getElementById('inventory-items');

profileNameEl.innerText = TELEGRAM_NAME;
profileAvatarEl.src = TELEGRAM_AVATAR;

// state
let user = null;
let subscribed = false;
let activeCase = null;

// Cases config (must match server types)
const CASES = [
  { id: 'free', name: 'Free Daily', price: 0, img: 'items/free-case.jpg', type: 'free' },
  { id: 'case_0_1', name: 'Bronze Case', price: 0.1, img: 'items/bronze-case.jpg', type: '0.1' },
  { id: 'case_0_5', name: 'Silver Case', price: 0.5, img: 'items/silver-case.jpg', type: '0.5' }
];

// render cases
function renderCases() {
  casesGrid.innerHTML = '';
  CASES.forEach(c => {
    const el = document.createElement('div');
    el.className = 'case';
    el.dataset.type = c.type;
    el.dataset.name = c.name;
    el.innerHTML = `
      <div class="badge">${c.price === 0 ? 'FREE' : c.price + ' TON'}</div>
      <img class="case-preview" src="${c.img}" alt="${c.name}" />
      <div class="case-footer">
        <span class="pill">${c.name}</span>
        <button class="btn-open-case btn-ghost">Open</button>
      </div>
    `;
    casesGrid.appendChild(el);
  });
}

function toFixed2(v){ return Number(v || 0).toFixed(2); }

// fetch user from server
async function loadUser() {
  const id = TELEGRAM_USER_ID;
  const res = await fetch(`${API_ROOT}/api/user/${encodeURIComponent(id)}`);
  const j = await res.json();
  if (j.ok) {
    user = j.user;
    profileNameEl.innerText = user.name || TELEGRAM_NAME;
    profileAvatarEl.src = TELEGRAM_AVATAR || 'items/default-avatar.png';
    balanceEl.innerText = toFixed2(user.balance) + ' ⭐️';
    profileBalanceEl && (profileBalanceEl.innerText = toFixed2(user.balance) + ' ⭐️');
    walletAddressEl.innerText = user.wallet || '—';
    renderInventory(user.inventory || []);
    if (user.lastFreeClaim) showFreeCooldown(user.lastFreeClaim);
  } else {
    console.error('failed to load user', j);
  }
}

function renderInventory(items){
  inventoryGrid.innerHTML = '';
  (items || []).slice().reverse().forEach(it=>{
    const d = document.createElement('div');
    d.className = 'item';
    d.title = it.name || it;
    d.innerHTML = <div>${it.name || it}</div>;
    inventoryGrid.appendChild(d);
  });
}

// subscribe button - open channel link via tg or normal link
btnSubscribe.addEventListener('click', ()=>{
  const ch = '/'+(window.location.hostname || '') // fallback; better use tg.openLink
  if (tg?.openLink) {
    tg.openLink('https://t.me/fiatvalue'); // opens channel
  } else {
    window.open('https://t.me/fiatvalue', '_blank');
  }
  alert('После подписки нажмите Open. Для реальной проверки требуется предоставить Bot token (see README).');
  subscribed = true; // optimistic; server-side check available if BOT token configured
});

// open free case button (quick)
btnOpenFree.addEventListener('click', async ()=>{
  if (!subscribed) return alert('Please subscribe to @fiatvalue before opening the free case.');
  await openCase('free');
});

// click on any case open button -> open modal for case
casesGrid.addEventListener('click', (e)=>{
  const btn = e.target.closest('.btn-open-case');
  if (!btn) return;
  const caseCard = btn.closest('.case');
  const type = caseCard.dataset.type;
  const name = caseCard.dataset.name;
  activeCase = { type, name };
  modalTitle.innerText = name;
  modalItems.innerHTML = <div>Preview items will appear here</div>;
  modal.classList.remove('hidden');
});

// modal buttons
modalCloseBtn.addEventListener('click', ()=> modal.classList.add('hidden'));
modalOpenBtn.addEventListener('click', async ()=>{
  if (!activeCase) return;
  await openCase(activeCase.type);
  modal.classList.add('hidden');
});

async function openCase(type) {
  try {
    const res = await fetch(`${API_ROOT}/api/case/${encodeURIComponent(type)}/${encodeURIComponent(TELEGRAM_USER_ID)}`, { method: 'POST' });
    const j = await res.json();
    if (!j.ok) {
      if (j.error === 'free_cooldown') {
        const next = new Date(j.nextAvailableAt);
        return alert(`Free case already claimed. Next at ${next.toLocaleString()}`);
      }
      return alert('Open case failed: ' + (j.error || 'unknown'));
    }
    const item = j.item;
    // update UI
    await loadUser(); // refresh
    showDrop(item);
    resultArea.innerText = You got: ${item.name};
  } catch (e) {
    console.error(e);
    alert('Failed to open case (network).');
  }
}

function showDrop(item) {
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center">
    <img src="${item.img || 'items/default-item.png'}" style="width:44px;height:44px;border-radius:8px"/>
    <div style="font-size:12px;margin-top:6px">${item.name}</div>
  </div>`;
  liveDropLine.appendChild(el);
  if (liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
}

// weekly top
async function loadWeeklyTop(){
  const res = await fetch(`${API_ROOT}/api/weekly-top`);
  const j = await res.json();
  if (j.ok) {
    weeklyContainer = document.getElementById('weekly-leaderboard');
    weeklyContainer.innerHTML = '';
    j.top.forEach((u, idx)=>{
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = <div>${idx+1}. ${u.name}</div><div style="font-weight:700">${(u.spent||0).toFixed(2)} TON</div>;
      weeklyContainer.appendChild(row);
    });
  }
}

// live drop demo filler
setInterval(()=>{
  // pick random sample items from server config (static names)
  const sample = ['+1 ⭐️','+3 ⭐️','+5 ⭐️','🎁 Gift'];
  const name = sample[Math.floor(Math.random()*sample.length)];
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.textContent = name;
  liveDropLine.appendChild(el);
  if (liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
}, 4000);

// nav
document.getElementById('nav-main').addEventListener('click', ()=> switchPage('main'));
document.getElementById('nav-weekly').addEventListener('click', ()=> switchPage('weekly'));
document.getElementById('nav-profile-btn').addEventListener('click', ()=> switchPage('profile'));
function switchPage(p) {
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active-page'));
  document.getElementById('page-'+p).classList.add('active-page');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('nav-'+p).classList.add('active');
}

// init
async function init() {
  renderCases();
  await loadUser();
  await loadWeeklyTop();
}
init();