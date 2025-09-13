// Проверяем Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// Элементы
const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const liveDropList = document.getElementById("live-drop-list");
const freeDaily = document.getElementById("free-daily");
const freeDailyTimer = document.getElementById("free-daily-timer");

let balance = 0;
let inventory = [];
let cooldown = 24 * 60 * 60 * 1000; // 24 часа
let lastOpened = null;

// Имя и аватар
if (tg?.initDataUnsafe?.user) {
  const user = tg.initDataUnsafe.user;
  nameEl.innerText = user.first_name || "Guest";
  avatarEl.src = user.photo_url || "default-avatar.png";
}

// Обновление баланса
function updateBalance() {
  balanceEl.innerText = balance.toFixed(2) + " ⭐";
}

// Лайв-дроп
function addToLiveDrop(item) {
  const div = document.createElement("div");
  div.className = "drop-item";
  div.innerText = item.name;
  liveDropList.prepend(div);
  if (liveDropList.children.length > 15) {
    liveDropList.removeChild(liveDropList.lastChild);
  }
}

// Шансы Free Daily
const freeDailyItems = [
  { name: "+1 ⭐", reward: 1, chance: 50 },
  { name: "+3 ⭐", reward: 3, chance: 25 },
  { name: "+5 ⭐", reward: 5, chance: 15 },
  { name: "🎁 Gift", reward: 20, chance: 5 },
  { name: "💎 Big Gift", reward: 100, chance: 3 },
  { name: "TON Prize", reward: 1000, chance: 2 }
];

// Выбор случайного предмета
function getRandomItem(items) {
  const total = items.reduce((acc, it) => acc + it.chance, 0);
  let rand = Math.random() * total;
  for (let it of items) {
    if (rand < it.chance) return it;
    rand -= it.chance;
  }
  return items[0];
}

// Таймер
function updateTimer() {
  if (!lastOpened) return;
  const diff = Date.now() - lastOpened;
  if (diff < cooldown) {
    const remain = cooldown - diff;
    const h = Math.floor(remain / 3600000);
    const m = Math.floor((remain % 3600000) / 60000);
    freeDailyTimer.innerText = ${h}h ${m}m left;
    setTimeout(updateTimer, 1000);
  } else {
    freeDailyTimer.innerText = "Available now";
    lastOpened = null;
  }
}

// Открытие free daily
freeDaily.addEventListener("click", () => {
  if (lastOpened && Date.now() - lastOpened < cooldown) {
    alert("Подожди до следующего кейса!");
    return;
  }
  const item = getRandomItem(freeDailyItems);
  balance += item.reward;
  inventory.push(item);
  addToLiveDrop(item);
  updateBalance();
  lastOpened = Date.now();
  updateTimer();
});

updateBalance();