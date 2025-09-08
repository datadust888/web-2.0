const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const liveDrop = document.getElementById("live-drop");
const result = document.getElementById("result");
const background = document.getElementById("background");

const user = tg?.initDataUnsafe?.user;
const userId = user?.id || 0;

if (user) {
  nameEl.innerText = user.first_name || "Guest";
  if (user.photo_url) avatarEl.src = user.photo_url;
}
balanceEl.innerText = "0 ⭐️";

// Кнопки
document.getElementById("btn-open").onclick = () => {
  result.innerText = "Кейс открыт!";
  liveDrop.innerText = "Последний дроп: ⭐️";
};
document.getElementById("btn-top").onclick = () => result.innerText = "Топ 100 показан!";
document.getElementById("btn-ref").onclick = () => {
  if (userId) {
    result.innerText = Ваша реферальная ссылка:\nhttps://t.me/fiatvalue_bot?start=${userId};
  } else result.innerText = "Реферальная ссылка недоступна";
};

// Параллакс фона
if (background) {
  document.addEventListener("mousemove", e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    background.style.transform = translate(${x}px, ${y}px);
  });
}