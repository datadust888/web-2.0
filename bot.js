alert('После подписки нажмите Open. Для реальной проверки задайте BOT token в сервере.');
  subscribed = true;
});

btnOpenFree.addEventListener('click', async ()=> {
  if (!subscribed) return alert('Please subscribe to @fiatvalue first.');
  await openCase('free');
});

casesGrid.addEventListener('click', (e)=> {
  const btn = e.target.closest('.btn-open-case');
  if (!btn) return;
  const card = btn.closest('.case');
  const type = card.dataset.type;
  const name = card.dataset.name;
  activeCase = { type, name };
  openModalForCase(activeCase);
});

function openModalForCase(c) {
  modalTitle.innerText = c.name;
  modalCarousel.innerHTML = '';
  // create empty slots
  for (let i=0;i<8;i++) {
    const slot = document.createElement('div');
    slot.className = 'slot';
    slot.innerHTML = <img src="items/default-item.png" style="width:56px;height:56px;border-radius:8px">;
    modalCarousel.appendChild(slot);
  }
  modal.classList.remove('hidden');
  // slide animation with GSAP
  if (window.gsap) {
    gsap.fromTo('.modal-content', { scale:0.95, autoAlpha:0 }, { scale:1, autoAlpha:1, duration:0.3 });
  }
}

modalCloseBtn.addEventListener('click', ()=> modal.classList.add('hidden'));

modalOpenBtn.addEventListener('click', async ()=> {
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
    // animate modal carousel to reveal item
    revealItem(item);
    await loadUser(); // refresh
    resultArea.innerText = You got: ${item.name};
  } catch (e) {
    console.error(e);
    alert('Failed to open case (network).');
  }
}

function revealItem(item) {
  // simple GSAP reveal animation: highlight a random slot then show item moving to live-drop
  const slots = modalCarousel.querySelectorAll('.slot');
  const idx = Math.floor(Math.random()*slots.length);
  const chosen = slots[idx];
  chosen.innerHTML = <img src="${item.img || 'items/default-item.png'}" style="width:56px;height:56px;border-radius:8px">;
  if (window.gsap) {
    gsap.fromTo(chosen, { scale:0.6, rotation: -10 }, { scale:1, rotation:0, duration:0.6, ease:'back.out(1.7)' });
    // fly to liveDropLine
    const clone = chosen.cloneNode(true);
    clone.style.position = 'absolute';
    document.body.appendChild(clone);
    const from = chosen.getBoundingClientRect();
    const toTarget = liveDropLine;
    const to = { x: toTarget.getBoundingClientRect().left + 20, y: toTarget.getBoundingClientRect().top + 10 };
    clone.style.left = from.left + 'px';
    clone.style.top = from.top + 'px';
    clone.style.zIndex = 99;
    gsap.to(clone, { x: to.x - from.left, y: to.y - from.top, scale:0.6, duration:0.9, onComplete: ()=> { 
      const d = document.createElement('div'); d.className='drop-item'; d.innerHTML = chosen.innerHTML;
      liveDropLine.appendChild(d);
      if (liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
      document.body.removeChild(clone);
    }});
  } else {
    // fallback immediate add
    const d = document.createElement('div'); d.className='drop-item'; d.innerHTML = <img src="${item.img || 'items/default-item.png'}" style="width:36px;height:36px;border-radius:6px"><div style="font-size:11px">${item.name}</div>;
    liveDropLine.appendChild(d);
  }
}

// wallet connect via TonConnect stub (replace with real TonConnect integration)
document.getElementById('btn-connect-wallet').addEventListener('click', async ()=> {
  if (window.TonConnectStub && window.TonConnectStub.isAvailable) {
    try {
      const r = await window.TonConnectStub.connect();// web/app.js
const API_ROOT = '';

const tg = window.Telegram?.WebApp;
try { tg?.ready?.(); tg?.expand?.(); } catch(e){}

let TELEGRAM_USER_ID = null;
let TELEGRAM_NAME = 'Guest';
let TELEGRAM_AVATAR = 'items/default-avatar.png';

if (tg?.initDataUnsafe?.user) {
  TELEGRAM_USER_ID = tg.initDataUnsafe.user.id?.toString() || local-${Date.now()};
  TELEGRAM_NAME = tg.initDataUnsafe.user.first_name || 'Guest';
  TELEGRAM_AVATAR = tg.initDataUnsafe.user.photo_url || TELEGRAM_AVATAR;
} else {
  TELEGRAM_USER_ID = localStorage.getItem('demo_user_id') || guest_${Math.floor(Math.random()*100000)};
  localStorage.setItem('demo_user_id', TELEGRAM_USER_ID);
}

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
const modalCarousel = document.getElementById('modal-carousel');
const modalOpenBtn = document.getElementById('modal-open-btn');
const modalCloseBtn = document.getElementById('modal-close-btn');
const resultArea = document.getElementById('free-case-result');
const weeklyContainer = document.getElementById('weekly-leaderboard');
const inventoryGrid = document.getElementById('inventory-items');

profileNameEl.innerText = TELEGRAM_NAME;
profileAvatarEl.src = TELEGRAM_AVATAR;

let user = null;
let subscribed = false;
let activeCase = null;

const CASES = [
  { id: 'free', name: 'Free Daily', price: 0, img: 'items/free-case.jpg', type: 'free' },
  { id: 'case_0_1', name: 'Bronze Case', price: 0.1, img: 'items/bronze-case.jpg', type: '0.1' },
  { id: 'case_0_5', name: 'Silver Case', price: 0.5, img: 'items/silver-case.jpg', type: '0.5' }
];

function renderCases() {
  casesGrid.innerHTML = '';
  CASES.forEach(c => {
    const el = document.createElement('div');
    el.className = 'case';
    el.dataset.type = c.type;
    el.dataset.name = c.name;
    el.innerHTML = `<div class="badge">${c.price === 0 ? 'FREE' : c.price + ' TON'}</div>
      <img class="case-preview" src="${c.img}" alt="${c.name}" />
      <div class="case-footer"><span class="pill">${c.name}</span>
      <button class="btn-open-case btn-ghost">Open</button></div>`;
    casesGrid.appendChild(el);
  });
}

async function loadUser() {
  const id = TELEGRAM_USER_ID;
  const res = await fetch(`${API_ROOT}/api/user/${encodeURIComponent(id)}`);
  const j = await res.json();
  if (j.ok) {
    user = j.user;
    profileNameEl.innerText = user.name || TELEGRAM_NAME;
    profileAvatarEl.src = TELEGRAM_AVATAR || 'items/default-avatar.png';
    balanceEl.innerText = (user.balance || 0).toFixed(2) + ' ⭐️';
    document.getElementById('profile-balance') && (document.getElementById('profile-balance').innerText = (user.balance || 0).toFixed(2) + ' ⭐️');
    walletAddressEl.innerText = user.wallet || '—';
    renderInventory(user.inventory || []);
    if (user.lastFreeClaim) showFreeCooldown(user.lastFreeClaim);
  }
}

function renderInventory(items) {
  if (!inventoryGrid) return;
  inventoryGrid.innerHTML = '';
  (items || []).slice().reverse().forEach(it => {
    const el = document.createElement('div');
    el.className = 'item';
    el.title = it.name || it;
    el.innerHTML = <div>${it.name || it}</div>;
    inventoryGrid.appendChild(el);
  });
}

function showFreeCooldown(ts) {
  const next = new Date(ts + 24*60*60*1000);
  const el = document.getElementById('daily-sub');
  if (el) el.innerText = Next at ${next.toLocaleString()};
}

btnSubscribe.addEventListener('click', ()=> {
  if (tg?.openLink) tg.openLink('https://t.me/fiatvalue');
  else window.open('https://t.me/fiatvalue', '_blank');const wallet = r.account  r.address  r;
      await fetch(`${API_ROOT}/api/connect-wallet/${encodeURIComponent(TELEGRAM_USER_ID)}`, { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ wallet }) });
      await loadUser();
      alert('Wallet connected: ' + wallet);
    } catch (e) {
      console.error(e);
      alert('Wallet connect failed');
    }
  } else alert('TonConnect not available');
});

document.getElementById('btn-disconnect-wallet').addEventListener('click', async ()=> {
  await fetch(`${API_ROOT}/api/disconnect-wallet/${encodeURIComponent(TELEGRAM_USER_ID)}`, { method:'POST' });
  await loadUser();
  alert('Wallet disconnected');
});

async function loadWeeklyTop(){
  const res = await fetch(`${API_ROOT}/api/weekly-top`);
  const j = await res.json();
  if (j.ok) {
    const container = document.getElementById('weekly-leaderboard');
    container.innerHTML = '';
    j.top.forEach((u, idx)=> {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = <div>${idx+1}. ${u.name}</div><div style="font-weight:700">${(u.spent||0).toFixed(2)} TON</div>;
      container.appendChild(row);
    });
  }
}

// nav
document.getElementById('nav-main').addEventListener('click', ()=> switchPage('main'));
document.getElementById('nav-weekly').addEventListener('click', ()=> switchPage('weekly'));
document.getElementById('nav-profile-btn').addEventListener('click', ()=> switchPage('profile'));
function switchPage(p) {
  document.querySelectorAll('.page').forEach(el=>el.classList.remove('active-page'));
  document.getElementById('page-' + p).classList.add('active-page');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('nav-' + p).classList.add('active');
}

// demo live drop filler
setInterval(()=>{
  const sample = ['+1 ⭐️','+3 ⭐️','+5 ⭐️','🎁 Gift'];
  const name = sample[Math.floor(Math.random()*sample.length)];
  const el = document.createElement('div');
  el.className = 'drop-item';
  el.textContent = name;
  liveDropLine.appendChild(el);
  if (liveDropLine.children.length > 20) liveDropLine.removeChild(liveDropLine.children[0]);
}, 4000);

// init
async function init(){
  renderCases();
  await loadUser();
  await loadWeeklyTop();
}
init();