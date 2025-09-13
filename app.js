// web/app.js — safe init, show/hide screens, load profile, free timer, top lists
(function(){
  const tg = window.Telegram?.WebApp;
  try { tg?.expand(); } catch(e){ console.warn("tg expand failed", e); }

  // helpers
  const $ = id => document.getElementById(id);
  const safeFetch = async (path, opts) => {
    try {
      const res = await fetch(path, opts);
      return await res.json();
    } catch(err) {
      console.error("fetch error", path, err);
      return { ok:false, error:"network" };
    }
  };

  // elements (may be null — check)
  const navMain = $('nav-main'), navWeekly = $('nav-weekly'), navProfile = $('nav-profile');
  const screens = { main: $('main-screen'), weekly: $('weekly-screen'), profile: $('profile-screen') };
  const nameEl = $('name'), avatarEl = $('avatar'), balanceEl = $('balance');
  const btnOpen = $('btn-open'), freeTimer = $('free-timer');
  const btnTop = $('btn-top'), btnRef = $('btn-ref');
  const btnWeekly = $('btn-weekly'), btnFriends = $('btn-friends'), topList = $('top-list'), topBack = $('top-back');
  const profileName = $('profile-name'), profileAvatar = $('profile-avatar'), profileSpent = $('profile-spent'), profileBalance = $('profile-balance');
  const resultEl = $('result'), liveDrop = $('live-drop');

  function showScreen(name){
    Object.keys(screens).forEach(k => {
      const el = screens[k];
      if (!el) return;
      if (k === name) el.classList.remove('hidden'); else el.classList.add('hidden');
    });
    // update nav active
    if (navMain) navMain.classList.toggle('active', name === 'main');
    if (navWeekly) navWeekly.classList.toggle('active', name === 'weekly');
    if (navProfile) navProfile.classList.toggle('active', name === 'profile');
  }

  // nav handlers (safe)
  navMain?.addEventListener('click', ()=> showScreen('main'));
  navWeekly?.addEventListener('click', ()=> showScreen('weekly'));
  navProfile?.addEventListener('click', ()=> showScreen('profile'));

  // top/weekly navigation
  btnTop?.addEventListener('click', ()=> { showScreen('weekly'); loadWeeklyTop(); });
  topBack?.addEventListener('click', ()=> { showScreen('main'); });

  btnWeekly?.addEventListener('click', ()=> { btnWeekly.classList.add('active'); btnFriends.classList.remove('active'); loadWeeklyTop(); });
  btnFriends?.addEventListener('click', ()=> { btnFriends.classList.add('active'); btnWeekly.classList.remove('active'); loadFriendsTop(); });

  // profile/referral
  btnRef?.addEventListener('click', ()=> {
    const unsafeUser = tg?.initDataUnsafe?.user;
    if (!unsafeUser) { resultEl && (resultEl.innerText = "Open from Telegram to get referral link."); return; }
    const botUsername = "fiatvalue_bot"; // <- change to your bot username
    const link = https://t.me/${botUsername}?start=${unsafeUser.id};
    resultEl && (resultEl.innerText = `Your referral: ${link}`);
  });

  // load profile from server
  const TG_USER = tg?.initDataUnsafe?.user;
  const USER_ID = TG_USER?.id;

  async function loadProfile(){
    if (!USER_ID) {
      if (nameEl) nameEl.innerText = "Guest";
      if (balanceEl) balanceEl.innerText = "0 ⭐";
      return;
    }
    const payload = { user_id: USER_ID, username: TG_USER?.username, display_name: (TG_USER?.first_name||"")+" "+(TG_USER?.last_name||"") };
    const resp = await safeFetch('/api/profile', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (resp && resp.ok && resp.profile) {
      const p = resp.profile;
      nameEl && (nameEl.innerText = p.display_name  p.username  'Guest');
      balanceEl && (balanceEl.innerText = (p.balance||0) + ' ⭐');
      avatarEl && p.avatar_url && (avatarEl.src = p.avatar_url);
      // profile screen
      profileName && (profileName.innerText = p.display_name  p.username  'Guest');
      profileAvatar && p.avatar_url && (profileAvatar.src = p.avatar_url);
      profileSpent && (profileSpent.innerText = p.spent || 0);
      profileBalance && (profileBalance.innerText = p.balance || 0);
      initFreeTimer(p.last_free || 0);
    } else {if (nameEl) nameEl.innerText = TG_USER?.first_name || 'Guest';
    }
  }

  // free timer
  let timerInterval = null;
  function initFreeTimer(lastFreeUnix){
    updateTimer(lastFreeUnix);
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(()=> updateTimer(lastFreeUnix), 1000);
  }
  function updateTimer(lastFreeUnix){
    const now = Math.floor(Date.now()/1000);
    const cooldown = 24*3600;
    const next = (lastFreeUnix||0) + cooldown;
    const remain = next - now;
    if (remain <= 0) {
      freeTimer && (freeTimer.innerText = "Free case available ✔");
      btnOpen && (btnOpen.disabled = false);
    } else {
      btnOpen && (btnOpen.disabled = true);
      const h = Math.floor(remain/3600), m = Math.floor((remain%3600)/60), s = remain%60;
      freeTimer && (freeTimer.innerText = `Next free in ${h}h ${m}m ${s}s`);
    }
  }

  // open case
  btnOpen?.addEventListener('click', async ()=>{
    if (!USER_ID) { resultEl && (resultEl.innerText = "Open inside Telegram app"); return; }
    btnOpen.disabled = true;
    resultEl && (resultEl.innerText = "Opening...");
    const resp = await safeFetch('/api/open_case', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ user_id: USER_ID, case_slug: 'free' }) });
    if (!resp || !resp.ok) {
      resultEl && (resultEl.innerText = "Error: " + (resp && resp.error || "unknown"));
      await loadProfile();
      return;
    }
    const prize = resp.prize;
    if (prize.type === 'stars') {
      resultEl && (resultEl.innerText = `You won ${prize.amount} ⭐`);
      liveDrop && (liveDrop.innerText = `Last drop: +${prize.amount} ⭐`);
    } else {
      resultEl && (resultEl.innerText = `You won: ${prize.item_name}`);
      liveDrop && (liveDrop.innerText = `Last drop: ${prize.item_name}`);
    }
    try { tg?.sendData(JSON.stringify({ action:'open_case', prize })); } catch(e){}
    await loadProfile();
  });

  // TOP lists
  function renderTop(items, kind='weekly'){
    topList && (topList.innerHTML = '');
    if (!items || !items.length) { topList && (topList.innerText = 'No data'); return; }
    items.forEach(u=>{
      const row = document.createElement('div'); row.className = 'top-item';
      const img = document.createElement('img'); img.className='avatar'; img.src = u.avatar_url || '/static/default-avatar.png';
      const meta = document.createElement('div'); meta.className='meta';
      const name = document.createElement('div'); name.className='name'; name.innerText = u.display_name  u.username  u.id;
      const sub = document.createElement('div'); sub.className='sub'; sub.innerText = kind==='weekly'? Spent: ${u.spent_week||0} : Refs: ${u.referred_count||0};
      meta.appendChild(name); meta.appendChild(sub);
      const val = document.createElement('div'); val.className='value'; val.innerText = kind==='weekly' ? (u.spent_week||0) : (u.referred_count||0);
      row.appendChild(img); row.appendChild(meta); row.appendChild(val);
      topList && topList.appendChild(row);
    });
  }

  async function loadWeeklyTop(){
    topList && (topList.innerText = 'Loading...');
    const resp = await safeFetch('/api/top100?period=weekly');
    if (resp && resp.ok) renderTop(resp.top, 'weekly'); else topList && (topList.innerText = 'Error');
  }
  async function loadFriendsTop(){
    topList && (topList.innerText = 'Loading...');
    const resp = await safeFetch('/api/topreferrals');
    if (resp && resp.ok) renderTop(resp.top, 'ref'); else topList && (topList.innerText = 'Error');
  }

  // init
  (async function init(){
    showScreen('main');
    await loadProfile();
    // initial top list
    loadWeeklyTop();
  })();

  // expose minimal debug
  window.__fv = { showScreen, loadProfile, loadWeeklyTop, loadFriendsTop };

})();