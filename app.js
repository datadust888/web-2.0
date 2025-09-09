const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let balance = 0;
let inventory = [];

const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".bottom-nav button");

function navigate(pageId) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  navButtons.forEach(btn => btn.classList.remove("active"));
  event.target.classList.add("active");
}

// Баланс
function updateBalance() {
  document.getElementById("balance").innerText = ${balance} ★;
  document.getElementById("profile-balance").innerText = ${balance} ★;
}

// Лайв-дроп
function addLiveDrop(item) {
  const drop = document.getElementById("live-drop");
  const img = document.createElement("img");
  img.src = item.img;
  drop.prepend(img);

  if (drop.childElementCount > 15) {
    drop.removeChild(drop.lastChild);
  }
}

// Инвентарь
function updateInventory() {
  const inv = document.getElementById("inventory");
  inv.innerHTML = "";
  inventory.forEach(item => {
    const img = document.createElement("img");
    img.src = item.img;
    inv.appendChild(img);
  });
}

// Открытие кейса
function openCase(caseId) {
  if (caseId === "free-daily") {
    const rewards = [
      { name: "+1 Star", value: 1, img: "items/star1.jpg" },
      { name: "+3 Stars", value: 3, img: "items/star3.jpg" },
      { name: "+5 Stars", value: 5, img: "items/star5.jpg" },
      { name: "+10 Stars", value: 10, img: "items/star10.jpg" },
      { name: "Telegram Gift", value: 20, img: "items/telegram_gift1.jpg" },
      { name: "Telegram Gift", value: 30, img: "items/telegram_gift2.jpg" },
      { name: "Telegram Gift", value: 60, img: "items/telegram_gift3.jpg" },
      { name: "Cake", value: 60, img: "items/telegram_cake.jpg" },
      { name: "Rocket", value: 80, img: "items/telegram_rocket.jpg" },
      { name: "Diamond", value: 120, img: "items/telegram_diamond.jpg" },
      { name: "Snoop Cigar", value: 1547, img: "items/snoop_cigar.jpg" },
      { name: "Top Hat", value: 3212, img: "items/top_hat.jpg" },
      { name: "Vintage Cigar", value: 6893, img: "items/vintage_cigar.jpg" }
    ];

    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    balance += reward.value;
    inventory.push(reward);
    updateBalance();
    updateInventory();
    addLiveDrop(reward);
    alert(`You won: ${reward.name}`);
  }
}

// Telegram user
if (tg?.initDataUnsafe?.user) {
  const user = tg.initDataUnsafe.user;
  document.getElementById("username").innerText = user.first_name;
  document.getElementById("profile-username").innerText = user.first_name;

  if (user.photo_url) {
    document.getElementById("avatar").src = user.photo_url;
    document.getElementById("profile-avatar").src = user.photo_url;
  }
}

updateBalance();
navigate("page-main");