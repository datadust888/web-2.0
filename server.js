const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("web")); // чтобы раздавать файлы из папки web

// --- Mock Database ---
let users = {}; // key: telegramId, value: { balance, inventory, weeklySpent }
let weeklyTop = []; // массив объектов {telegramId, name, amount}

// --- Items ---
const freeDailyItems = [
  { name: "+1 ⭐️", stars: 1 },
  { name: "+3 ⭐️", stars: 3 },
  { name: "+5 ⭐️", stars: 5 },
  { name: "+10 ⭐️", stars: 10 },
  { name: "+15 ⭐️", stars: 15 },
  { name: "+20 ⭐️", stars: 20 },
];

const case01TONItems = [
  { name: "Nothing", chance: 80 },
  { name: "Frog Pepe", chance: 0.0001 },
  { name: "Durov Hat", chance: 0.001 },
];

const case05TONItems = [
  { name: "+0.05 TON", chance: 15 },
  { name: "+0.4 TON", chance: 20 },
  { name: "+0.77 TON", chance: 37 },
  { name: "Calendar Gift +1.43 TON", chance: 8 },
  { name: "Lollipop +1.54 TON", chance: 7 },
  { name: "Hex Pot +3.12 TON", chance: 6 },
  { name: "Berry Box +4.05 TON", chance: 4 },
  { name: "Flower +5.13 TON", chance: 3 },
  { name: "Skull Ball +7.81 TON", chance: 0.5 },
  { name: "NFT Ring +18.15 TON", chance: 0.1 },
];

// --- Helpers ---
function getUser(telegramId) {
  if (!users[telegramId]) {
    users[telegramId] = { balance: 0, inventory: [], weeklySpent: 0, name: Guest${telegramId} };
  }
  return users[telegramId];
}

function pickItem(items) {
  const total = items.reduce((acc, i) => acc + (i.chance || 1), 0);
  let rand = Math.random() * total;
  for (let i of items) {
    const chance = i.chance || 1;
    if (rand < chance) return i;
    rand -= chance;
  }
  return items[0];
}

// --- Routes ---

// Get user info
app.get("/api/user/:id", (req, res) => {
  const user = getUser(req.params.id);
  res.json(user);
});

// Open Free Daily Case
app.post("/api/case/free/:id", (req, res) => {
  const user = getUser(req.params.id);
  const item = pickItem(freeDailyItems);
  user.balance += item.stars;
  user.inventory.push(item.name);
  res.json({ item, balance: user.balance });
});

// Open 0.1 TON Case
app.post("/api/case/0.1/:id", (req, res) => {
  const user = getUser(req.params.id);
  const item = pickItem(case01TONItems);
  if (item.name.includes("TON")) {
    user.balance += parseFloat(item.name.match(/([\d\.]+)/)[0]) * 1000; // пересчет TON в "звезды"
    user.weeklySpent += parseFloat(item.name.match(/([\d\.]+)/)[0]);
  }
  user.inventory.push(item.name);
  res.json({ item, balance: user.balance });
});

// Open 0.5 TON Case
app.post("/api/case/0.5/:id", (req, res) => {
  const user = getUser(req.params.id);
  const item = pickItem(case05TONItems);
  if (item.name.includes("TON")) {
    user.balance += parseFloat(item.name.match(/([\d\.]+)/)[0]) * 1000;
    user.weeklySpent += parseFloat(item.name.match(/([\d\.]+)/)[0]);
  }
  user.inventory.push(item.name);
  res.json({ item, balance: user.balance });
});

// Get Weekly Top
app.get("/api/weekly-top", (req, res) => {
  const top = Object.entries(users)
    .map(([id, u]) => ({ id, name: u.name, spent: u.weeklySpent }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 10);
  res.json(top);
});

// Connect Wallet
app.post("/api/connect-wallet/:id", (req, res) => {
  const user = getUser(req.params.id);
  const { wallet } = req.body;
  user.wallet = wallet;
  res.json({ wallet });
});

// Disconnect Wallet
app.post("/api/disconnect-wallet/:id", (req, res) => {
  const user = getUser(req.params.id);
  delete user.wallet;
  res.json({ success: true });
});

// Server start
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});