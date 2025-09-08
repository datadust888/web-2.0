const tg = window.Telegram.WebApp;
tg.expand();

const nameEl = document.getElementById("name");
const balanceEl = document.getElementById("balance");
const liveDrop = document.getElementById("live-drop");
const result = document.getElementById("result");

// 👤 Имя пользователя сразу
nameEl.innerText = "Привет, " + (tg.initDataUnsafe?.user?.first_name || "Гость");

// 🔗 Запросы к API
async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}

// 📌 Загрузка профиля
async function loadProfile() {
  const r = await post("/api/profile", { init_data: tg.initData });
  if (r.ok) {
    nameEl.innerText =
      r.profile.display_name  r.profile.username  "Guest";
    balanceEl.innerText = (r.profile.balance || 0) + " ⭐️";
  }
}

// 🎁 Открыть кейс
document.getElementById("btn-open").onclick = async () => {
  const r = await post("/api/open_case", { init_data: tg.initData, case_slug: "free" });
  if (r.ok) {
    if (r.prize.type === "stars") {
      result.innerText = You won ${r.prize.amount} ⭐️;
      liveDrop.innerText = Last drop: ${r.prize.amount} ⭐️;
    } else {
      result.innerText = You won ${r.prize.item_name};
      liveDrop.innerText = Last drop: ${r.prize.item_name};
    }
  } else {
    result.innerText = "Error: " + r.error;
  }
};

// 🏆 Топ 100
document.getElementById("btn-top").onclick = async () => {
  const r = await post("/api/top100", {});
  if (r.ok) {
    result.innerText = r.top
      .map((u, i) => `${i + 1}. ${u.display_name  u.username  u.id} — spent ${u.spent}`)
      .join("\n");
  }
};

// 👥 Реферал
document.getElementById("btn-ref").onclick = () => {
  const me = tg.initDataUnsafe?.user;
  if (me) {
    result.innerText = Your referral: https://t.me/fiatvalue_bot?start=${me.id};
  }
};

// 🚀 Загружаем профиль при старте
loadProfile();

// 🌌 Эффект параллакса фона
document.addEventListener("mousemove", (event) => {
  const x = (event.clientX / window.innerWidth - 0.5) * 30;  
  const y = (event.clientY / window.innerHeight - 0.5) * 30;
  document.getElementById("background").style.transform = translate(${x}px, ${y}px);
});