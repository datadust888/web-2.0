// web/app.js
const tg = window.Telegram.WebApp;
tg.expand();

// DOM
const avatarEl = document.getElementById("avatar");
const nameEl = document.getElementById("name");
const balanceEl = document.getElementById("balance");
const btnOpen = document.getElementById("btn-open");
const freeTimerEl = document.getElementById("free-timer");
const caseImg = document.getElementById("case-img");
const caseTitle = document.getElementById("case-title");

const btnTop = document.getElementById("btn-top");
const btnRef = document.getElementById("btn-ref");
const topScreen = document.getElementById("top-screen");
const btnWeekly = document.getElementById("btn-weekly");
const btnFriends = document.getElementById("btn-friends");
const topList = document.getElementById("top-list");
const topBack = document.getElementById("top-back");

const resultEl = document.getElementById("result");
const liveDropEl = document.getElementById("live-drop");

const TG_USER = tg.initDataUnsafe?.user;
const USER_ID = TG_USER?.id;

async function postJson(path, body) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) { console.error(e); return { ok:false, error:"network" }; }
}
async function getJson(path) {
  try {
    const res = await fetch(path);
    return await res.json();
  } catch (e) { console.error(e); return { ok:false, error:"network" }; }
}

async function loadProfile() {
  if (!USER_ID) {
    nameEl.innerText = "Guest"; balanceEl.innerText = "0 ⭐"; return;
  }
  const resp = await postJson("/api/profile", { init_data: tg.initData, user_id: USER_ID, username: TG_USER?.username, display_name: TG_USER?.first_name + (TG_USER?.last_name?(" "+TG_USER.last_name):""), avatar_url: null });
  if (resp.ok && resp.profile) {
    const p = resp.profile;
    nameEl.innerText = p.display_name  p.username  "Guest";
    balanceEl.innerText = (p.balance || 0) + " ⭐";
    if (p.avatar_url) avatarEl.src = p.avatar_url;
    initFreeTimer(p.last_free || 0);
  } else {
    nameEl.innerText = TG_USER?.first_name || "Guest";
  }
}

// FREE timer
let timerInterval = null;
function initFreeTimer(lastFreeUnix) {
  updateTimer(lastFreeUnix);
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(()=> updateTimer(lastFreeUnix), 1000);
}
function updateTimer(lastFreeUnix) {
  const now = Math.floor(Date.now()/1000);
  const cooldown = 24*3600;
  const nextAvailable = (lastFreeUnix||0) + cooldown;
  const remain = nextAvailable - now;
  if (remain <= 0) {
    freeTimerEl.innerText = "Free case available ✔";
    btnOpen.disabled = false; btnOpen.classList.remove("disabled");
  } else {
    btnOpen.disabled = true; btnOpen.classList.add("disabled");
    const h = Math.floor(remain/3600); const m = Math.floor((remain%3600)/60); const s = remain%60;
    freeTimerEl.innerText = Next free in ${h}h ${m}m ${s}s;
  }
}

// OPEN case
btnOpen.addEventListener("click", async () => {
  if (!USER_ID) { resultEl.innerText = "Open this inside Telegram."; return; }
  btnOpen.disabled = true; resultEl.innerText = "Opening...";
  const resp = await postJson("/api/open_case", { init_data: tg.initData, user_id: USER_ID, case_slug: "free" });
  if (!resp.ok) { resultEl.innerText = "Error: " + (resp.error||"unknown"); await loadProfile(); return; }
  const prize = resp.prize;
  if (prize.type === "stars") {
    resultEl.innerText = You won ${prize.amount} ⭐;
    liveDropEl.innerText = Last drop: +${prize.amount} ⭐;
  } else {
    resultEl.innerText = You won: ${prize.item_name};
    liveDropEl.innerText = Last drop: ${prize.item_name};
  }
  try { tg.sendData(JSON.stringify({ action: "open_case", prize })); } catch(e){}
  await loadProfile();
});

// TOP UI
btnTop.addEventListener("click", ()=> { document.querySelector(".tiles").style.display="none"; topScreen.style.display="block"; loadWeeklyTop(); });
topBack.addEventListener("click", ()=> { topScreen.style.display="none"; document.querySelector(".tiles").style.display="flex"; });

btnWeekly.addEventListener("click", ()=> { btnWeekly.classList.add("active"); btnFriends.classList.remove("active"); loadWeeklyTop(); });
btnFriends.addEventListener("click", ()=> { btnFriends.classList.add("active"); btnWeekly.classList.remove("active"); loadFriendsTop(); });

function renderTop(items, kind="weekly") {
  topList.innerHTML = "";
  if (!items || !items.length) { topList.innerText = "No data"; return; }
  items.forEach(u => {
    const div = document.createElement("div"); div.className = "top-item";
    const img = document.createElement("img"); img.className = "avatar"; img.src = u.avatar_url || "/static/default-avatar.png";
    const meta = document.createElement("div"); meta.className="meta";
    const nm = document.createElement("div"); nm.className="name"; nm.innerText = u.display_name  u.username  u.id;
    const sub = document.createElement("div"); sub.className="sub"; sub.innerText = (kind==="weekly")?`Spent this week: ${u.spent_week||0}`:`Referred: ${u.referred_count||0}`;
    meta.appendChild(nm); meta.appendChild(sub);
    const val = document.createElement("div"); val.className="value"; val.innerText = (kind==="weekly")? (u.spent_week||0):(u.referred_count||0);
    div.appendChild(img); div.appendChild(meta); div.appendChild(val);
    topList.appendChild(div);
  });
}

async function loadWeeklyTop() {
  topList.innerText = "Loading weekly top...";
  const resp = await getJson("/api/top100?period=weekly");
  if (resp.ok) renderTop(resp.top, "weekly"); else topList.innerText="Error";
}
async function loadFriendsTop() {
  topList.innerText = "Loading friends top...";
  const resp = await getJson("/api/topreferrals");
  if (resp.ok) renderTop(resp.top, "ref"); else topList.innerText="Error";
}

// Referral button
btnRef.addEventListener("click", ()=> {
  if (!TG_USER) { resultEl.innerText = "Open this page from Telegram to see referral link."; return; }
  const botUsername = "fiatvalue_bot"; // <-- replace with your bot username
  const link = https://t.me/${botUsername}?start=${TG_USER.id};
  resultEl.innerText = Share this link: ${link};
});

// init
(async function init() {
  caseTitle.innerText = "Basic Case";
  await loadProfile();
  loadWeeklyTop();
})();