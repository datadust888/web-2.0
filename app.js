const tg = window.Telegram?.WebApp;
if(tg?.expand) tg.expand();

const usernameEl = document.getElementById('username');
const avatarEl = document.getElementById('avatar');
const balanceEl = document.getElementById('balance');
const profileNameEl = document.getElementById('profile-name');
const profileAvatarEl = document.getElementById('profile-avatar');
const profileBalanceEl = document.getElementById('profile-balance');
const liveDropLine = document.getElementById('live-drop-line');
const freeCase = document.getElementById('free-case');
const freeCaseTimer = document.getElementById('free-case-timer');

let currentBalance = 0;
let freeCaseAvailable = true;

// Отображение Telegram данных
if(tg?.initDataUnsafe?.user){
  const user = tg.initDataUnsafe.user;
  usernameEl.innerText = user.first_name || 'Guest';
  profileNameEl.innerText = user.first_name || 'Guest';
  if(user.photo_url){avatarEl.src = user.photo_url; profileAvatarEl.src = user.photo_url;}
}

// Навигация
const pages = {
  main: document.getElementById('page-main'),
  weekly: document.getElementById('page-weekly'),
  profile: document.getElementById('page-profile')
};
document.getElementById('nav-main').onclick = ()=>{showPage('main')};
document.getElementById('nav-weekly').onclick = ()=>{showPage('weekly')};
document.getElementById('nav-profile-btn').onclick = ()=>{showPage('profile')};
function showPage(page){for(let p in pages){pages[p].classList.remove('active-page');} pages[page].classList.add('active-page');}

// FREE CASE открытие
freeCase.onclick = ()=>{
  if(!freeCaseAvailable){
    alert('Free case already opened today!');
    return;
  }
  // Проверка подписки на канал
  const confirmSub = confirm('Подпишитесь на канал @fiatvalue чтобы открыть кейс.');
  if(!confirmSub) return;

  // Генерация дропа
  const rewards = [
    {name:"+1 ⭐️", amount:1}, {name:"+3 ⭐️", amount:3}, {name:"+5 ⭐️", amount:5},
    {name:"Telegram Gift 🎁", amount:10}, {name:"Snoop Cigar", amount:1547}
  ];
  const reward = rewards[Math.floor(Math.random()*rewards.length)];
  alert(`Вы получили: ${reward.name}`);
  currentBalance += reward.amount;
  updateBalanceUI();
  freeCaseAvailable=false;
}

// Баланс
function updateBalanceUI(){
  balanceEl.innerText = currentBalance.toFixed(2)+" ⭐️";
  profileBalanceEl.innerText = currentBalance.toFixed(2)+" ⭐️";
}

// Лайв-дроп (пример)
setInterval(()=>{
  const icons = ["items/star1.jpg","items/star3.jpg","items/star5.jpg"];
  const img = icons[Math.floor(Math.random()*icons.length)];
  const el = document.createElement('div');
  el.className='drop-item';
  el.innerHTML=`<img src="${img}" style="width:36px;height:36px;border-radius:8px">`;
  liveDropLine.appendChild(el);
  if(liveDropLine.children.length>15) liveDropLine.removeChild(liveDropLine.children[0]);
},4000);