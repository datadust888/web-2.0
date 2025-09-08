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
nameEl.innerText = "Привет, " + (tg?.initDataUnsafe?.user?.first_name || "Гость");

// Заглушки для кнопок
document.getElementById("btn-open").onclick = () => {
  result.innerText = "Кейс открыт!";
  liveDrop.innerText = "Последний дроп: ⭐️";
};

document.getElementById("btn-top").onclick = () => {
  result.innerText = "Топ 100 показан!";
};

document.getElementById("btn-ref").onclick = () => {
  result.innerText = "Ссылка на реферал: https://t.me/fiatvalue_bot?start=12345";
};

// Параллакс фонового изображения
if (background) {
  document.addEventListener("mousemove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 30; // чем больше число, тем сильнее сдвиг
    const y = (event.clientY / window.innerHeight - 0.5) * 30;
    background.style.transform = translate(${x}px, ${y}px);
  });

  // Плавность через CSS transition
  background.style.transition = "transform 0.1s linear";
}