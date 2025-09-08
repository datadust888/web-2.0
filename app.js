const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// DOM
const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const addBalanceBtn = document.getElementById("btn-add-balance");
const liveDropLine = document.getElementById("live-drop-line");
const result = document.getElementById("result");

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
const userId = user?.id || 0;

// Устанавливаем имя, аватар и баланс
if(user){
  nameEl.innerText = user.first_name || "Guest";
  if(user.photo_url) avatarEl.src = user.photo_url;
}
balanceEl.innerText = "0.00 ⭐️";
document.getElementById("