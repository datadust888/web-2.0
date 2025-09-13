// Telegram WebApp
const tg = window.Telegram?.WebApp;
if(tg?.ready) tg.ready();
if(tg?.expand) tg.expand();

// DOM
const pages = {
  main: document.getElementById('page-main'),
  weekly: document.getElementById('page-weekly'),
  profile: document.getElementById('page-profile')
};
const navMain = document.getElementById('nav-main');
const navWeekly = document.getElementById('nav-weekly');
const navProfile = document.getElementById('nav-profile');
const casesGrid = document.getElementById('casesGrid');
const caseResult = document.getElementById('case-result');
const liveDropLine = document.getElementById('live-drop-line');
const balanceEl = document.getElementById('balance');
const profileBalanceEl = document.getElementById('profile-balance');
const usernameEl = document.getElementById('username');
const avatarEl = document.getElementById('avatar');
const profileNameEl = document.getElementById('profile-name');

let currentBalance = 0;
let inventory = [];

// MOCK: Leaderboard
const leaderboard = [
  {name:'Alice',amount:15200},{name:'Bob',amount:12050},{name:'Charlie',amount:10120}
];

// NAVIGATION
function showPage(page){
  Object.values(pages).forEach(p=>p.classList.remove('active-page'));
  page.classList.add('active-page');
}
navMain.onclick = ()=>showPage(pages.main);
navWeekly.onclick = ()=>showPage(pages.weekly);
navProfile.onclick = ()=>showPage(pages.profile);

// INIT UI
function updateBalance(){
  balanceEl.innerText = currentBalance.toFixed(2)+" ⭐️";
  profileBalanceEl.innerText = currentBalance.toFixed(2)+" ⭐️";
}
function renderLeaderboard(){
  const container = document.getElementById('leaderboardList');
  container.innerHTML='';
  leaderboard.forEach(u=>{
    const row=document.createElement('div');
    row.className='row';
    row.innerText