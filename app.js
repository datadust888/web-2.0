img || 'default-avatar.png'}" alt="item"/><div style="font-size:11px;margin-top:6px;color:var(--muted)">${item.name || ''}</div>;
  liveDropEl.prepend(d);
  requestAnimationFrame(() => d.classList.add('show'));
  while (liveDropEl.children.length > 30) liveDropEl.removeChild(liveDropEl.lastChild);
}

// update free timer
function updateTimer() {
  if (!profile) return;
  const now = Math.floor(Date.now() / 1000);
  const next = profile.next_free_claim || 0;
  if (next <= now) {
    freeTimer.innerText = 'Ready';
    openFreeBtn.disabled = false;
  } else {
    const s = next - now;
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    freeTimer.innerText = ${h}h ${m}m ${sec}s;
    openFreeBtn.disabled = true;
  }
}

// open free daily
openFreeBtn.addEventListener('click', async () => {
  if (!initPayload) return alert('Open in Telegram WebApp to play');
  openFreeBtn.disabled = true;
  freeCaseResult.innerText = 'Opening...';
  const resp = await api('open_case', initPayload ? { init_data: initPayload.init_data, case_slug: 'free_daily' } : { init_data: '' , case_slug:'free_daily'});
  if (!resp.ok) {
    alert(resp.error || 'Open failed');
    openFreeBtn.disabled = false;
    return;
  }
  // update balances
  balanceStars.innerText = (resp.new_balance.stars || 0).toFixed(2) + ' ⭐';
  balanceTon.innerText = (resp.new_balance.ton || 0).toFixed(4) + ' TON';
  // show result
  freeCaseResult.innerHTML = You got: <strong>${resp.item.name}</strong>;
  // add to live
  addLiveDrop(resp.item);
  // special celebration for rare ton/high items
  if ((resp.item.ton && resp.item.ton >= 1) || (resp.item.name && /NFT|Ring|Skull/i.test(resp.item.name))) {
    try { confetti({ particleCount: 120, spread: 80 }); } catch (e) { /* ignore */ }
  }
  // refresh profile
  await init();
});

// open paid
document.querySelectorAll('.open-paid').forEach(btn => {
  btn.addEventListener('click', async (e) => {
    const slug = e.currentTarget.dataset.slug;
    if (!initPayload) return alert('Open in Telegram WebApp to use paid cases');
    const resp = await api('open_case', { init_data: initPayload.init_data, case_slug: slug });
    if (!resp.ok) return alert(resp.error || 'Open failed');
    balanceStars.innerText = (resp.new_balance.stars || 0).toFixed(2) + ' ⭐';
    balanceTon.innerText = (resp.new_balance.ton || 0).toFixed(4) + ' TON';
    addLiveDrop(resp.item);
    if ((resp.item.ton && resp.item.ton >= 1) || (resp.item.name && /NFT|Ring|Skull/i.test(resp.item.name))) {
      try { confetti({ particleCount: 180, spread: 100 }); } catch (e) {}
    }
    await init();
  });
});

// bottom nav
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');
    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    if (page === 'main') document.getElementById('page-main').classList.add('active');
    if (page === 'top') document.getElementById('page-top').classList.add('active');
    if (page === 'profile') document.getElementById('page-profile').classList.add('active');
  });
});

// top weekly/friends toggle (basic)
document.getElementById('topToggle').addEventListener('click', (e) => {
  if (!e.target.classList.contains('toggle')) return;
  document.querySelectorAll('#topToggle .toggle').forEach(t => t.classList.remove('active'));
  e.target.classList.add('active');
});

// leaderboard fetch
async function loadTop() {
  const resp = await api('top100');
  if (!resp.ok) return;
  const list = document.getElementById('topList');
  list.innerHTML = '';
  resp.top.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'leader-row';
    div.innerText = ${i + 1}. ${r.username || r.first_name} — ${(Number(r.spent) || 0).toFixed(4)} TON;
    list.appendChild(div);
  });
}
document.getElementById('navTop').addEventListener('click', () => loadTop());

// copy ref/wallet// public/app.js — frontend logic polished
const socket = io();

// helper api
async function api(path, body) {
  const res = await fetch('/api/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  return res.json();
}

// Telegram WebApp initData
const TG = window.Telegram?.WebApp;
let initData = null;
if (TG?.initData) initData = TG.initData;       // raw string (validated server-side)
else if (TG?.initDataUnsafe) initData = TG.initData; // fallback

const initPayload = initData ? { init_data: initData } : null; // send to server

// UI refs
const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const walletAddr = document.getElementById('walletAddr');
const balanceTon = document.getElementById('balanceTon');
const balanceStars = document.getElementById('balanceStars');
const liveDropEl = document.getElementById('liveDrop');
const freeTimer = document.getElementById('freeTimer');
const openFreeBtn = document.getElementById('openFreeBtn');
const freeCaseResult = document.getElementById('freeCaseResult');
const inventoryGrid = document.getElementById('inventory');
const refLinkInput = document.getElementById('refLink');
const profileNameBig = document.getElementById('profileNameBig');
const profileAvatarBig = document.getElementById('profileAvatarBig');
const profileBalanceStars = document.getElementById('profileBalanceStars');
const profileBalanceTon = document.getElementById('profileBalanceTon');
const profileWallet = document.getElementById('profileWallet');

let profile = null;

// init app
async function init() {
  if (!initPayload) {
    // not in Telegram - server requires init_data => can't fetch profile
    // in dev mode some endpoints may still work if you adjust server
    console.warn('No initData found (not in Telegram WebApp). For full features open via Telegram.');
  }
  try {
    const result = initPayload ? await api('profile', initPayload) : await api('profile', { init_data: '' });
    if (!result.ok) { console.error('profile error', result); return; }
    profile = result.profile;
    renderProfile(result);
    // load recent live
    const live = await api('live');
    if (live.ok && live.drops) {
      live.drops.reverse().forEach(d => addLiveDrop({ name: d.item_name, img: d.img }));
    }
    // start timer tick
    setInterval(updateTimer, 1000);
  } catch (e) {
    console.error('init error', e);
  }
}

function renderProfile(data) {
  const p = data.profile;
  profile = p;
  profileName.innerText = p.first_name  p.username  'Guest';
  profileNameBig.innerText = p.first_name  p.username  'Guest';
  profileAvatar.src = profileAvatarBig.src = p.avatar_url || 'default-avatar.png';
  walletAddr.innerText = p.wallet_address || (p.tg_id ? 'tg:' + p.tg_id : '—');
  profileWallet.innerText = p.wallet_address || (p.tg_id ? 'tg:' + p.tg_id : '—');
  balanceTon.innerText = (p.balance_ton || 0).toFixed(4) + ' TON';
  balanceStars.innerText = (p.balance_stars || 0).toFixed(2) + ' ⭐';
  profileBalanceStars.innerText = (p.balance_stars || 0).toFixed(2) + ' ⭐';
  profileBalanceTon.innerText = (p.balance_ton || 0).toFixed(4) + ' TON';
  // inventory
  inventoryGrid.innerHTML = '';
  (data.inventory || []).forEach(it => {
    const img = document.createElement('img');
    const obj = typeof it === 'string' ? JSON.parse(it) : it;
    img.src = obj.img || 'default-avatar.png';
    img.title = ${obj.name} — ${obj.stars || 0}⭐ ${obj.ton || 0}TON;
    img.addEventListener('click', () => {
      if (confirm(`Sell ${obj.name} for ${(obj.stars||0)} ⭐?`)) {
        // TODO: implement server-side sell endpoint
        alert('Sell action (demo)');
      }
    });
    inventoryGrid.appendChild(img);
  });
  // referral
  refLinkInput.value = https://t.me/fiatvalue_bot?start=${p.tg_id || p.id};
  updateTimer();
}

function addLiveDrop(item) {
  const d = document.createElement('div');
  d.className = 'drop';
  d.innerHTML = <img src="${item.document.getElementById('btnCopyRef').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(refLinkInput.value);
    alert('Referral copied');
  } catch { prompt('Copy:', refLinkInput.value); }
});
document.getElementById('btnCopyWallet').addEventListener('click', async () => {
  const v = profileWallet.innerText || '';
  if (!v) return alert('No wallet set');
  try { await navigator.clipboard.writeText(v); alert('Copied') } catch { prompt('Copy:', v); }
});

// socket live drops
socket.on('new_drop', data => {
  addLiveDrop({ name: data.item.name, img: data.item.img });
});

// start
init();