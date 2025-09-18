// Проверяем Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// Элементы DOM
const pages = {
  main: document.getElementById("page-main"),
  weekly: document.getElementById("page-weekly"),
  profile: document.getElementById("page-profile")
};

const navButtons = {
  main: document.getElementById("nav-main"),
  weekly: document.getElementById("nav-weekly"),
  profile: document.getElementById("nav-profile")
};

const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const liveDrop = document.getElementById("live-drop");

let balance = 0;

// Устанавливаем имя и аватар из Telegram
if (tg?.initDataUnsafe?.user) {
  const user = tg.initDataUnsafe.user;
  nameEl.innerText = user.first_name;
  if (user.photo_url) avatarEl.src = user.photo_url;
} else {
  nameEl.innerText = "Guest";
}

// Обновление баланса
function updateBalance(amount) {
  balance += amount;
  balanceEl.innerText = balance.toFixed(2) + " ⭐️";
}

// Лайв-дроп (макс 15 предметов)
function addLiveDrop(itemImg) {
  const img = document.createElement("img");
  img.src = itemImg;
  img.style.width = "40px";
  img.style.height = "40px";
  img.style.borderRadius = "6px";
  liveDrop.prepend(img);

  if (liveDrop.children.length > 15) {
    liveDrop.removeChild(liveDrop.lastChild);
  }
}

// Навигация между страницами
function showPage(page) {
  Object.values(pages).forEach(p => p.classList.remove("active"));
  Object.values(navButtons).forEach(b => b.classList.remove("active"));
  pages[page].classList.add("active");
  navButtons[page].classList.add("active");
}

navButtons.main.onclick = () => showPage("main");
navButtons.weekly.onclick = () => showPage("weekly");
navButtons.profile.onclick = () => showPage("profile");

// Первоначальная страница
showPage("main");

// Кейсы
document.querySelectorAll(".case").forEach(caseEl => {
  caseEl.addEventListener("click", () => {
    const caseId = caseEl.dataset.case;
    openCase(caseId);
  });
});

// Логика открытия кейсов
function openCase(caseId) {
  if (caseId === "free") {
    updateBalance(1); // временно +1 звезда
    addLiveDrop("./items/free-case.jpg");
    alert("Вы открыли FREE DAILY и получили +1 ⭐️!");
  }
  if (caseId === "ton01") {
    updateBalance(10);
    addLiveDrop("./items/ton01-case.jpg");
    alert("Вы открыли 0.1 TON Case и получили дроп!");
  }
  if (caseId === "ton05") {
    updateBalance(50);
    addLiveDrop("./items/ton05-case.jpg");
    alert("Вы открыли 0.5 TON Case и получили дроп!");
  }
}