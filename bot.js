// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // node-fetch v2
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || '@fiatvalue';
const TON_TO_STARS = Number(process.env.TON_TO_STARS || 1000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// Ensure data dir and files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const WEEKLY_FILE = path.join(DATA_DIR, 'weeklyTop.json');

function readJSONSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    console.error('readJSONSafe error', e);
    return fallback;
  }
}
function writeJSONSafe(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

let USERS = readJSONSafe(USERS_FILE, {}); // { userId: { id, name, balance, inventory:[], lastFreeClaim, weeklySpent, wallet } }
let WEEKLY = readJSONSafe(WEEKLY_FILE, []);

// Helpers
function getUser(userId) {
  if (!USERS[userId]) {
    USERS[userId] = {
      id: userId,
      name: Guest_${userId},
      balance: 0,
      inventory: [],
      lastFreeClaim: 0,
      weeklySpent: 0,
      wallet: null,
      referral: null // will set when user connects wallet/referral
    };
    writeJSONSafe(USERS_FILE, USERS);
  }
  return USERS[userId];
}

function saveUsers() {
  writeJSONSafe(USERS_FILE, USERS);
}

// Weighted random helper
function weightedPick(items) {
  const total = items.reduce((s, it) => s + (it.weight || 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= (it.weight || 1);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// Item sets (you can expand)
const FREE_DAILY_ITEMS = [
  { name: '+1 ⭐️', stars: 1, img: 'items/star1.jpg', weight: 50 },
  { name: '+3 ⭐️', stars: 3, img: 'items/star3.jpg', weight: 30 },
  { name: '+5 ⭐️', stars: 5, img: 'items/star5.jpg', weight: 15 },
  { name: '🎁 Gift', stars: 12, img: 'items/gift.jpg', weight: 4 },
  { name: '🎉 Big Gift', stars: 30, img: 'items/big_gift.jpg', weight: 1 }
];

const CASE_0_1_ITEMS = [
  { name: 'Nothing', stars: 0, img: 'items/nothing.jpg', weight: 60 },
  { name: '+0.001 TON (~1⭐)', ton: 0.001, stars: 1, img: 'items/ton_small.jpg', weight: 30 },
  { name: '🧢 Durov Cap', stars: 5000, img: 'items/durov_cap.jpg', weight: 0.001 },
  { name: '🐸 Pepe', stars: 10000, img: 'items/pepe.jpg', weight: 0.0001 }
];

const CASE_0_5_ITEMS = [
  { name: '+0.05 TON', ton: 0.05, stars: 0.05 * TON_TO_STARS, img: 'items/ton_0_05.jpg', weight: 15 },
  { name: '+0.4 TON', ton: 0.4, stars: 0.4 * TON_TO_STARS, img: 'items/ton_0_4.jpg', weight: 20 },
  { name: '+0.77 TON', ton: 0.77, stars: 0.77 * TON_TO_STARS, img: 'items/ton_0_77.jpg', weight: 37 },
  { name: 'Calendar Gift +1.43 TON', ton: 1.43, stars: 1.43 * TON_TO_STARS, img: 'items/calendar.jpg', weight: 8 },
  { name: 'Lollipop +1.54 TON', ton: 1.54, stars: 1.54 * TON_TO_STARS, img: 'items/lollipop.jpg', weight: 7 },
  { name: 'Hex Pot +3.12 TON', ton: 3.12, stars: 3.12 * TON_TO_STARS, img: 'items/hexpot.jpg', weight: 6 },
  { name: 'Berry Box +4.05 TON', ton: 4.05, stars: 4.05 * TON_TO_STARS, img: 'items/berry.jpg', weight: 4 },
  { name: 'Flower +5.13 TON', ton: 5.13, stars: 5.13 * TON_TO_STARS, img: 'items/flower.jpg', weight: 3 },
  { name: 'Skull Ball +7.81 TON', ton: 7.81, stars: 7.81 * TON_TO_STARS, img: 'items/skull.jpg', weight: 0.5 },
  { name: 'NFT Ring +18.15 TON', ton: 18.15, stars: 18.15 * TON_TO_STARS, img: 'items/ring.jpg', weight: 0.1 }
];

// API routes

// Health
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Get user (create if missing)
app.get('/api/user/:id', (req, res) => {
  const id = req.params.id;
  const user = getUser(id);
  res.json({ ok: true, user });
});

// Top weekly
app.get('/api/weekly-top', (req, res) => {
  // compute from USERS weeklySpent
  const top = Object.values(USERS)
    .map(u => ({ id: u.id, name: u.name, spent: u.weeklySpent || 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 100);
  res.json({ ok: true, top });
});

// Connect wallet
app.post('/api/connect-wallet/:id', (req, res) => {
  const id = req.params.id;
  const { wallet } = req.body;
  const user = getUser(id);
  user.wallet = wallet || null;
  saveUsers();
  res.json({ ok: true, wallet: user.wallet });
});

// Disconnect wallet
app.post('/api/disconnect-wallet/:id', (req, res) => {
  const id = req.params.id;
  const user = getUser(id);
  delete user.wallet;
  saveUsers();
  res.json({ ok: true });
});

// Top-up (mock)
app.post('/api/topup/:id', (req, res) => {
  const id = req.params.id;
  const { amount } = req.body; // amount in stars, or in TON if you prefer
  const user = getUser(id);
  const add = Number(amount) || 0;
  user.balance = (user.balance || 0) + add;
  user.weeklySpent = (user.weeklySpent || 0) + 0; // if top-up not counted as spent; adjust accordingly
  saveUsers();
  res.json({ ok: true, balance: user.balance });
});

// Check subscription to channel (requires TELEGRAM_BOT_TOKEN). If missing, return mock true.
app.get('/api/check_sub/:id', async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_USERNAME) {
    // In dev without token, we return true for convenience.
    return res.json({ ok: true, subscribed: true, note: 'no bot token, returning mock true' });
  }
  try {
    const userId = req.params.id;
    // getChatMember: https://api.telegram.org/bot<token>/getChatMember?chat_id=@channel&user_id=<user>
    const url = https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(TELEGRAM_CHANNEL_USERNAME)}&user_id=${userId};
    const r = await fetch(url);
    const j = await r.json();
    // according to API, result.status = "left"|"member"|"administrator" etc.
    const status = j?.result?.status;
    const subscribed = status && status !== 'left' && status !== 'kicked';
    res.json({ ok: true, subscribed: !!subscribed, status: status || null });
  } catch (e) {
    console.error('check_sub error', e);
    res.json({ ok: false, error: 'failed to check subscription' });
  }
});

// Open case endpoint (handles free, 0.1, 0.5)
app.post('/api/case/:type/:id', (req, res) => {
  const userId = req.params.id;
  const type = req.params.type; // 'free' | '0.1' | '0.5'
  const user = getUser(userId);

  try {
    if (type === 'free') {
      // cooldown 24h
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      if (user.lastFreeClaim && (now - user.lastFreeClaim) < DAY) {
        return res.json({ ok: false, error: 'free_cooldown', nextAvailableAt: user.lastFreeClaim + DAY });
      }
      const item = weightedPick(FREE_DAILY_ITEMS);
      user.balance = (user.balance  0) + (item.stars  0);
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: now });
      user.lastFreeClaim = now;
      saveUsers();
      return res.json({ ok: true, item, balance: user.balance });
    }

    if (type === '0.1') {
      const costTON = 0.1;
      // In real app you'll charge TON via blockchain; here we simulate using stars cost conversion
      // For demo, require user to have enough stars to "buy" or allow purchase via topup
      // We'll just simulate drop: pick item; update balance if item contains stars/ton
      const item = weightedPick(CASE_0_1_ITEMS);
      if (item.ton) {
        user.balance += (item.ton * TON_TO_STARS);
      } else {
        user.balance += (item.stars || 0);
      }
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: Date.now() });
      user.weeklySpent = (user.weeklySpent || 0) + costTON;
      saveUsers();
      return res.json({ ok: true, item, balance: user.balance });
    }

    if (type === '0.5') {
      const costTON = 0.5;
      const item = weightedPick(CASE_0_5_ITEMS);
      if (item.ton) {
        user.balance += (item.ton * TON_TO_STARS);
      } else {
        user.balance += (item.stars || 0);
      }
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: Date.now() });
      user.weeklySpent = (user.weeklySpent || 0) + costTON;
      saveUsers();
      return res.json({ ok: true, item, balance: user.balance });
    }

    return res.json({ ok: false, error: 'unknown_case_type' });
  } catch (e) {
    console.error('open case error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// Get inventory
app.get('/api/inventory/:id', (req, res) => {
  const id = req.params.id;
  const user = getUser(id);
  res.json({ ok: true, inventory: user.inventory || [] });
});

// Simple endpoint for top-100 (spent)
app.get('/api/top100', (req, res) => {
  const top = Object.values(USERS)
    .map(u => ({ id: u.id, name: u.name, spent: u.weeklySpent || 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 100);
  res.json({ ok: true, top });
});

// reset weekly (admin) - simple endpoint for demo
app.post('/api/reset-weekly', (req, res) => {
  Object.values(USERS).forEach(u => { u.weeklySpent = 0; });
  saveUsers();
  res.json({ ok: true });
});

// Serve static (already configured above)
app.get('*', (req, res) => {
  // serve index.html for unmatched routes (SPA)
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`FiatValue WebApp server listening on http://localhost:${PORT}`);
});