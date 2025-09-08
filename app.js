// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// DOM элементы
const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const addBalanceBtn = document.getElementById("btn-add-balance");
const liveDropLine = document.createElement("div");
liveDropLine.id = "live-drop-line";
document.getElementById("page-main").appendChild(liveDropLine);

const pages = {
  main: document.getElementById("page-main"),
  top: document.getElementById("page-top"),
  profile: document.getElementById("page-profile")
};

const navItems = {
  main: document.getElementById("nav-main"),
  top: document.getElementById("nav-top"),
  profile: document.getElementById("nav-profile")
};

// Пользователь
const user = tg?.initDataUnsafe?.user;
if(user){
  nameEl.innerText = user.first_name || "Guest";
  document.getElementById("profile-name").innerText = user.first_name || "Guest";
  if(user.photo_url) {
    avatarEl.src = user.photo_url;
    document.getElementById("profile-avatar").src = user.photo_url;
  }
}

// Начальный баланс
let currentBalance = 0.00;
balanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
document.getElementById("profile-balance").innerText = currentBalance.toFixed(2) + " ⭐️";

// FREE DAILY кейс предметы
const freeDailyItems = [
  { name: "+1 ⭐️", stars: 1, img: "items/star1.png" },
  { name: "+3 ⭐️", stars: 3, img: "items/star3.png" },
  { name: "+5 ⭐️", stars: 5, img: "items/star5.png" },
  { name: "+10 ⭐️", stars: 10, img: "items/star10.png" },
  { name: "+15 ⭐️", stars: 15, img: "items/telegram_gift1.png" },
  { name: "+20 ⭐️", stars: 20, img: "items/telegram_gift2.png" },
  { name: "+30 ⭐️", stars: 30, img: "items/telegram_gift3.png" },
  { name: "+35 ⭐️", stars: 35, img: "items/star35.png" },
  { name: "+60 ⭐️", stars: 60, img: "items/telegram_cake.png" },
  { name: "+80 ⭐️", stars: 80, img: "items/telegram_rocket.png" },
  { name: "+120 ⭐️", stars: 120, img: "items/telegram_diamond.png" },
  { name: "+4.94 TON (~1547 ⭐️)", stars: 1547, ton: 4.94, img: "items/snoop_cigar.png" },
  { name: "+10 TON (~3212 ⭐️)", stars: 3212, ton: 10, img: "items/top_hat.png" },
  { name: "+20 TON (~6893 ⭐️)", stars: 6893, ton: 20, img: "items/vintage_cigar.png" }
];

// Inventory
let inventory = [];

// Функция добавления предмета в лайв-дроп
function addLiveDropItem(imgUrl){
  const img = document.createElement("img");
  img.src = imgUrl;
  liveDropLine.appendChild(img);

  // максимум 15 элементов
  if(liveDropLine.children.length > 15){
    liveDropLine.removeChild(liveDropLine.children[0]);
  }
}

// Открытие FREE DAILY кейса
document.getElementById("open-free-case").onclick = () => {
  const item = freeDailyItems[Math.floor(Math.random()*freeDailyItems.length)];

  // Обновляем баланс
  currentBalance += item.stars;
  balanceEl.innerText = currentBalance.toFixed(2) + " ⭐️";
  document.getElementById("profile-balance").innerText = currentBalance.toFixed(2) + " ⭐️";

  // Добавляем в inventory
  inventory.push(item);
  updateInventory();

  // Добавляем в лайв-дроп
  addLiveDropItem(item.img);

  // Результат
  document.getElementById("free-case-result").innerText = Вы получили: ${item.name};
};

// Обновление inventory на странице профиля
function updateInventory(){
  const inventoryContainer = document.getElementById("inventory-items");
  inventoryContainer.innerHTML = "";
  inventory.forEach(it=>{
    const img = document.createElement("img");
    img.src = it.img;
    img.title = it.name;
    inventoryContainer.appendChild(img);
  });
}

// Добавление баланса вручную (кнопка +)
addBalanceBtn.onclick = () => {
  alert("Функция пополнения пока не реализована, сюда будет редирект на платежную страницу");
};

// SPA навигация
Object.keys(navItems).forEach(key=>{
  navItems[key].onclick = ()=>{
    Object.values(pages).forEach(p=>p.classList.remove("active-page"));
    pages[key].classList.add("active-page");
    Object.values(navItems).forEach(n=>n.classList.remove("active"));
    navItems[key].classList.add("active");
  }
});

// Начальное выделение Main
navItems.main.classList.add("active");
pages.main.classList.add("active-page");