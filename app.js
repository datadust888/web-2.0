// Проверяем Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// Элементы DOM
const nameEl = document.getElementById("name");
const balanceEl = document.getElementById("balance");
const liveDrop = document.getElementById("live-drop");
const result = document.getElementById("result");
const background = document.getElementById("background");

// Устанавливаем имя пользователя
const user = tg?.initDataUnsafe?.user;
const userId = user?.id || 0;
nameEl.innerText = "Привет, " + (user?.first_name || "Гость");

// Заглушки для кнопок
document.getElementById("btn-open").onclick = () => {
  result.innerText = "Кейс открыт!";
  liveDrop.innerText = "Последний дроп: ⭐️";
};

document.getElementById("btn-top").onclick = () => {
  result.innerText = "Топ 100 показан!";
};

document.getElementById("btn-ref").onclick = () => {
  if (userId) {
    const referralLink = https://t.me/fiatvalue_bot?start=${userId};
    result.innerText = Ваша реферальная ссылка:\n${referralLink};
  } else {
    result.innerText = "Реферальная ссылка недоступна";
  }
};

// Параллакс фона (по желанию)
if (background) {
  document.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    background.style.transform = translate(${x}px, ${y}px);
  });
}