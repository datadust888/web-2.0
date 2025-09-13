const balanceEl = document.getElementById("balance");
const profileBalanceEl = document.getElementById("profile-balance");
const liveDropLine = document.getElementById("live-drop-line");
const freeCaseEl = document.getElementById("free-case");
const freeTimerEl = document.getElementById("free-timer");

let balance = 0;
let lastFreeOpen = null;

// обновление UI баланса
function updateBalance() {
  balanceEl.textContent = balance.toFixed(2) + " ⭐️";
  if (profileBalanceEl) profileBalanceEl.textContent = balance.toFixed(2) + " ⭐️";
}

// live drop
function addLiveDrop(item) {
  const el = document.createElement("div");
  el.className = "drop-item";
  el.innerHTML = <img src="${item.img}" style="width:36px;height:36px;border-radius:6px"/>;
  liveDropLine.prepend(el);
  while (liveDropLine.children.length > 15) {
    liveDropLine.removeChild(liveDropLine.lastChild);
  }
}

// free daily case
const freeItems = [
  { name: "+1 ⭐️", stars: 1, chance: 40, img: "items/star1.jpg" },
  { name: "+3 ⭐️", stars: 3, chance: 25, img: "items/star3.jpg" },
  { name: "+5 ⭐️", stars: 5, chance: 15, img: "items/star5.jpg" },
  { name: "🎁 Gift", stars: 20, chance: 3, img: "items/gift.jpg" },
  { name: "💎 Rare", stars: 120, chance: 1, img: "items/diamond.jpg" },
];

// выбор предмета по шансам
function getRandomItem(pool) {
  let total = pool.reduce((s, i) => s + i.chance, 0);
  let r = Math.random() * total;
  for (let i of pool) {
    if ((r -= i.chance) <= 0) return i;
  }
}

// таймер для free кейса
function updateFreeTimer() {
  if (!lastFreeOpen) {
    freeTimerEl.textContent = "Открыть";
    return;
  }
  const diff = Date.now() - lastFreeOpen;
  const remain = 24 * 60 * 60 * 1000 - diff;
  if (remain <= 0) {
    freeTimerEl.textContent = "Открыть";
    lastFreeOpen = null;
  } else {
    const h = Math.floor(remain / 3600000);
    const m = Math.floor((remain % 3600000) / 60000);
    freeTimerEl.textContent = ${h}ч ${m}м;
  }
}
setInterval(updateFreeTimer, 1000);

// обработка free кейса
freeCaseEl.addEventListener("click", () => {
  if (lastFreeOpen) return alert("Уже открыт, жди таймер");
  const item = getRandomItem(freeItems);
  balance += item.stars;
  updateBalance();
  addLiveDrop(item);
  lastFreeOpen = Date.now();
});

// init
updateBalance();