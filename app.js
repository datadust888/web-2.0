// Telegram WebApp
const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

// DOM элементы
const nameEl = document.getElementById("name");
const avatarEl = document.getElementById("avatar");
const balanceEl = document.getElementById("balance");
const liveDropLine = document.getElementById("live-drop-line");
const result = document.getElementById("result");
const background = document.getElementById("background");

// Пользователь
const user = tg?.initDataUnsafe?.user;
const userId = user?.id || 0;

// Устанавливаем имя, аватар и баланс
if (user) {
  nameEl.innerText = user.first_name || "Guest";
  if (user.photo_url) avatarEl.src = user.photo_url;
}
balanceEl.innerText = "0 ⭐️";

// Параллакс фона
if (background) {
  document.addEventListener("mousemove", e => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    background.style.transform = translate(${x}px, ${y}px);
  });
}

// Мерцание звёзд
function twinkleStars() {
  if (!background) return;
  const opacity = 0.05 + Math.random() * 0.1;
  background.style.backgroundColor = rgba(255,255,255,${opacity});
  requestAnimationFrame(twinkleStars);
}
twinkleStars();

// Нижние надписи кликабельные
document.getElementById("bottom-top").onclick = () => result.innerText = "Top-100 selected!";
document.getElementById("bottom-cases").onclick = () => result.innerText = "Cases selected!";
document.getElementById("bottom-profile").onclick = () => {
  if(userId) {
    result.innerText = Profile selected!\nРеферальная ссылка:\nhttps://t.me/fiatvalue_bot?start=${userId};
  } else result.innerText = "Profile selected!";
};

// Лайв-дроп: функция добавления предмета
function addLiveDropItem(imgUrl) {
  const img = document.createElement("img");
  img.src = imgUrl;
  liveDropLine.appendChild(img);

  // Если больше 15 элементов – удаляем первый
  if (liveDropLine.children.length > 15) {
    liveDropLine.removeChild(liveDropLine.children[0]);
  }
}

// Пример добавления предметов каждые 2 секунды
const sampleItems = [
  "item1.png","item2.png","item3.png","item4.png","item5.png"
];
let counter = 0;
setInterval(() => {
  const item = sampleItems[counter % sampleItems.length];
  addLiveDropItem(item);
  counter++;
}, 2000);