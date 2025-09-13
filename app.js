// NAVIGATION
document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    btn.classList.add('active');

    const page = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    if (page === 'main') document.getElementById('page-main').classList.add('active-page');
    if (page === 'top') document.getElementById('page-top').classList.add('active-page');
    if (page === 'profile') document.getElementById('page-profile').classList.add('active-page');
  });
});

// BALANCE
let balance = 0.0;
const balanceEl = document.getElementById("balance");

function updateBalance() {
  balanceEl.textContent = balance.toFixed(2) + " TON";
}

document.getElementById("addBalance").addEventListener("click", () => {
  alert("Redirecting to balance top-up page...");
});

// FREE CASE TIMER
let freeTimer = 24 * 60 * 60; // 24h
const freeTimerEl = document.getElementById("free-timer");

function updateFreeTimer() {
  const hours = Math.floor(freeTimer / 3600);
  const minutes = Math.floor((freeTimer % 3600) / 60);
  const seconds = freeTimer % 60;
  freeTimerEl.textContent = Available in: ${hours}:${minutes}:${seconds};
}

setInterval(() => {
  if (freeTimer > 0) {
    freeTimer--;
    updateFreeTimer();
  } else {
    freeTimerEl.textContent = "Ready to open!";
  }
}, 1000);

// CASE OPENING
document.querySelectorAll(".open-case").forEach(btn => {
  btn.addEventListener("click", () => {
    const caseType = btn.dataset.case;
    if (caseType === "free" && freeTimer === 0) {
      const prize = Math.random();
      let stars = 1;
      if (prize > 0.7) stars = 3;
      if (prize > 0.9) stars = 5;
      balance += stars;
      updateBalance();
      alert(`You won +${stars} ⭐️`);
      freeTimer = 24 * 60 * 60; // reset timer
    } else if (caseType === "free") {
      alert("Free case not ready yet!");
    }
  });
});

// LEADERBOARD DEMO
const leaderboard = document.getElementById("leaderboard");
leaderboard.innerHTML = `
  <ol>
    <li>User1 — 120 TON</li>
    <li>User2 — 90 TON</li>
    <li>User3 — 50 TON</li>
  </ol>
`;

// PROFILE DEMO
document.getElementById("profile-name").textContent = "FiatValueUser";