// Проверяем Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const nameEl = document.getElementById("name");
const balanceEl = document.getElementById("balance");
const liveDrop = document.getElementById("live-drop");
const result = document.getElementById("result");

// Устанавливаем имя пользователя
nameEl.innerText = "Привет, " + (tg?.initDataUnsafe?.user?.first_name || "Гость");

// Заглушки для кнопок, чтобы они точно работали
document.getElementById("btn-open").onclick = () => {
  result.innerText = "Open Case clicked!";
};

document.getElementById("btn-top").onclick = () => {
  result.innerText = "Top 100 clicked!";
};

document.getElementById("btn-ref").onclick = () => {
  result.innerText = "Referral clicked!";
};