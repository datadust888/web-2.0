// Wallet copy
function copyWallet() {
  const wallet = document.getElementById("wallet").innerText;
  navigator.clipboard.writeText(wallet).then(() => {
    alert("Адрес кошелька скопирован!");
  });
}

// FREE CASE TIMER
let freeTimer = 24 * 60 * 60; // 24 часа
const freeTimerEl = document.getElementById("free-timer");

function updateFreeTimer() {
  if (!freeTimerEl) return;
  if (freeTimer > 0) {
    const hours = String(Math.floor(freeTimer / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((freeTimer % 3600) / 60)).padStart(2, "0");
    const seconds = String(freeTimer % 60).padStart(2, "0");
    freeTimerEl.innerHTML = `
      <span class="pill">0 ⭐️</span>
      <span>Откроется через ${hours}:${minutes}:${seconds}</span>
    `;
  } else {
    freeTimerEl.innerHTML = `
      <span class="pill">0 ⭐️</span>
      <span>Доступен!</span>
    `;
  }
}

updateFreeTimer();

setInterval(() => {
  if (freeTimer > 0) {
    freeTimer--;
  }
  updateFreeTimer();
}, 1000);