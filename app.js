liveDropEl.scrollLeft = liveDropEl.scrollWidth;
  }

  function renderInventory(){
    inventoryGrid.innerHTML = '';
    inventory.forEach((it, idx) => {
      const img = el('img', { src: it.img, title: it.name });
      img.addEventListener('click', ()=> {
        // placeholder action: sell
        if(confirm(`Продать ${it.name} за ${it.stars} ⭐️?`)){
          setBalance(balance + it.stars);
          inventory.splice(idx,1);
          renderInventory();
        }
      });
      inventoryGrid.appendChild(img);
    });
  }

  function renderLeaderboard(){
    leaderboardEl.innerHTML = '';
    leaderboard.forEach(l => {
      const row = el('div',{class:'row'});
      const left = el('div',{class:'left', html:`<div style="display:flex;align-items:center;gap:10px"><img src="${l.avatar}" style="width:36px;height:36px;border-radius:8px"/><div><div style="font-weight:700">${l.name}</div><div style="font-size:12px;color:var(--muted)">${fmtStars(l.amount)}</div></div></div>`});
      const right = el('div',{html:`<div style="font-weight:700">${Math.floor(l.amount)}</div>`});
      row.appendChild(left);
      row.appendChild(right);
      leaderboardEl.appendChild(row);
    });
  }

  // Open free daily (local RNG if server not present)
  function openFreeDaily(){
    // if you have a backend, replace below RNG with a POST to /api/case/open and use server response
    const item = freeDailyItems[Math.floor(Math.random() * freeDailyItems.length)];
    // update balance
    setBalance((balance  0) + (item.stars  0));
    // add to inventory
    inventory.unshift(item);
    if(inventory.length > 200) inventory.pop();
    renderInventory();
    // add to live-drop
    addLiveDrop(item.img, item.name);
    // show result
    freeCaseResult.textContent = Вы получили: ${item.name};
  }

  // SPA nav
  function gotoPage(pageId){
    pages.forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
    navBtns.forEach(b => b.classList.toggle('active', b.dataset.page === pageId));
  }

  // Parallax background (throttled via rAF)
  (function setupParallax(){
    const bg = document.getElementById('background');
    let rx=0, ry=0, tx=0, ty=0, rafId = null;
    window.addEventListener('mousemove', e => {
      rx = (e.clientX / window.innerWidth - 0.5) * 20;
      ry = (e.clientY / window.innerHeight - 0.5) * 20;
      if(!rafId) rafId = requestAnimationFrame(animate);
    });
    function animate(){
      tx += (rx - tx) * 0.12;
      ty += (ry - ty) * 0.12;
      bg.style.transform = translate(${tx}px, ${ty}px) scale(1.02);
      rafId = null;
    }
    // respect reduced motion
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      window.removeEventListener('mousemove', ()=>{});
      bg.style.transform = 'none';
    }
  })();

  // Wire events
  openFreeBtn?.addEventListener('click', openFreeDaily);

  // nav buttons
  navBtns.forEach(btn => btn.addEventListener('click', () => gotoPage(btn.dataset.page)));

  // connect mock wallet
  qs('#nav-main').addEventListener('click', ()=> gotoPage('page-main'));
  qs('#nav-top').addEventListener('click', ()=> gotoPage('page-top'));
  qs('#nav-profile').addEventListener('click', ()=> gotoPage('page-profile'));

  qs('#btn-add-balance')?.addEventListener('click', () => alert('Пополнение пока не привязано — реализовать через платежный шлюз'));
  qs('#btn-deposit')?.addEventListener('click', () => alert('Deposit page (to implement)'));
  qs('#btn-disconnect-wallet')?.addEventListener('click', () => {
    walletAddr = null;
    qs('#wallet-address').textContent = '—';
    qs('#wallet-address-short').textContent = '—';
    alert('Кошелёк отключён (mock)');
  });

  // copy referral (uses Telegram ID as referral token if present)
  const refInput = qs('#ref-link');
  const copyRefBtn = qs('#btn-copy-ref');
  if(refInput && copyRefBtn){
    const refUrl = https://t.me/fiatvalue_bot?start=${userId || 'guest'};
    refInput.value = refUrl;
    copyRefBtn.// app.js — современная, аккуратная версия
(() => {
  'use strict';

  // Telegram WebApp safe access
  const tg = window.Telegram?.WebApp;
  try{ if (tg?.ready) tg.ready(); if (tg?.expand) tg.expand(); } catch(e){ /*ignore*/ }

  // DOM refs
  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));

  const balanceEl = qs('#balance');
  const profileBalanceEl = qs('#profile-balance');
  const profileNameEl = qs('#profile-name');
  const avatarEl = qs('#avatar');
  const profileAvatarEl = qs('#profile-avatar');
  const freeCaseResult = qs('#free-case-result');
  const liveDropEl = qs('#live-drop');
  const casesGrid = qs('#casesGrid');
  const inventoryGrid = qs('#inventory-items');
  const leaderboardEl = qs('#leaderboard');

  const navBtns = qsa('.nav-btn');
  const pages = qsa('.page');

  // buttons
  const openFreeBtn = qs('#open-free-case');
  const addBalanceBtn = qs('#btn-add-balance');
  const depositBtn = qs('#btn-deposit');
  const btnConnectWallet = qs('#btn-connect-wallet');
  const btnDisconnectWallet = qs('#btn-disconnect-wallet');
  const btnCopyRef = qs('#btn-copy-ref');

  // app state
  let balance = 0.00;
  let inventory = [];
  let walletAddr = null;
  const user = tg?.initDataUnsafe?.user || null;
  const userId = user?.id || null;

  // free daily items (assets path must exist)
  const freeDailyItems = [
    { name: "+1 ⭐️", stars: 1, img: "assets/items/star1.jpg" },
    { name: "+3 ⭐️", stars: 3, img: "assets/items/star3.jpg" },
    { name: "+5 ⭐️", stars: 5, img: "assets/items/star5.jpg" },
    { name: "+10 ⭐️", stars: 10, img: "assets/items/star10.jpg" },
    { name: "+15 ⭐️", stars: 15, img: "assets/items/telegram_gift1.jpg" },
    { name: "+20 ⭐️", stars: 20, img: "assets/items/telegram_gift2.jpg" },
    { name: "+30 ⭐️", stars: 30, img: "assets/items/telegram_gift3.jpg" },
    { name: "+35 ⭐️", stars: 35, img: "assets/items/star35.jpg" },
    { name: "+60 ⭐️", stars: 60, img: "assets/items/telegram_cake.jpg" },
    { name: "+80 ⭐️", stars: 80, img: "assets/items/telegram_rocket.jpg" },
    { name: "+120 ⭐️", stars: 120, img: "assets/items/telegram_diamond.jpg" },
    { name: "+4.94 TON (~1547 ⭐️)", stars: 1547, ton: 4.94, img: "assets/items/snoop_cigar.jpg" },
    { name: "+10 TON (~3212 ⭐️)", stars: 3212, ton: 10, img: "assets/items/top_hat.jpg" },
    { name: "+20 TON (~6893 ⭐️)", stars: 6893, ton: 20, img: "assets/items/vintage_cigar.jpg" }
  ];

  // Sample leaderboard (mock)
  const leaderboard = [
    { name: 'Alice', avatar: 'assets/default-avatar.png', amount: 15200 },
    { name: 'Bob', avatar: 'assets/default-avatar.png', amount: 12050 },
    { name: 'Charlie', avatar: 'assets/default-avatar.png', amount: 10120 },
    { name: 'Dmitry', avatar: 'assets/default-avatar.png', amount: 9020 },
    { name: 'Eve', avatar: 'assets/default-avatar.png', amount: 8000 },
  ];

  // Helpers
  function fmtStars(v){ return Number(v).toFixed(2) + ' ⭐️'; }
  function el(tag, props = {}, children = []) {
    const e = document.createElement(tag);
    Object.entries(props).forEach(([k,v]) => { if (k === 'class') e.className = v; else if (k==='html') e.innerHTML = v; else e.setAttribute(k,v)} );
    (Array.isArray(children) ? children : [children]).forEach(ch => { if (!ch) return; e.appendChild(typeof ch === 'string' ? document.createTextNode(ch) : ch); });
    return e;
  }

  function setBalance(v){
    balance = Number(v);
    balanceEl.textContent = fmtStars(balance);
    if(profileBalanceEl) profileBalanceEl.textContent = fmtStars(balance);
  }

  function addLiveDrop(img, label){
    const item = el('div',{class:'drop-item', html: `<div style="display:flex;flex-direction:column;align-items:center;gap:4px"><img src="${img}" style="width:36px;height:36px;border-radius:8px"/><div style="font-size:11px;color:var(--muted)">${label||''}</div></div>`});
    liveDropEl.appendChild(item);
    // keep only last 20
    while(liveDropEl.children.length > 20) liveDropEl.removeChild(liveDropEl.firstChild);
    // scroll to end for visibilityaddEventListener('click', async () => {
      try{
        await navigator.clipboard.writeText(refInput.value);
        alert('Скопировано');
      }catch(e){
        prompt('Скопируйте ссылку вручную:', refInput.value);
      }
    });
  }

  // init UI values
  setBalance(0.00);
  renderInventory();
  renderLeaderboard();
  // fill profile from Telegram (if available)
  if(user){
    profileNameEl.textContent = user.first_name  user.username  'Guest';
    avatarEl.src = user.photo_url || 'assets/default-avatar.png';
    profileAvatarEl.src = user.photo_url || 'assets/default-avatar.png';
    // referral input already handled
  }

  // simulated live-drops for demo
  setInterval(() => {
    const item = freeDailyItems[Math.floor(Math.random()*freeDailyItems.length)];
    addLiveDrop(item.img, item.name);
  }, 5000);

  // expose small API for debug
  window.__fiat = { openFreeDaily, setBalance, addLiveDrop, freeDailyItems, inventory };

})(); 