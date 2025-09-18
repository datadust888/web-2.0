// server.js
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MONGO_URL = process.env.MONGO_URL || '';
const MONGO_DB = process.env.MONGO_DB || 'fiatvalue';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || '@fiatvalue';
const TON_TO_STARS = Number(process.env.TON_TO_STARS || 1000);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

let useMongo = false;
let UserModel = null;

// If MONGO_URL provided — connect and use Mongo
async function initMongo() {
  if (!MONGO_URL) return;
  try {
    await mongoose.connect(MONGO_URL, { dbName: MONGO_DB });
    useMongo = true;
    const userSchema = new mongoose.Schema({
      id: { type: String, index: true, unique: true },
      name: String,
      balance: { type: Number, default: 0 },
      inventory: { type: Array, default: [] },
      lastFreeClaim: { type: Number, default: 0 },
      weeklySpent: { type: Number, default: 0 },
      wallet: { type: String, default: null },
      referral: { type: String, default: null }
    }, { timestamps: true });
    UserModel = mongoose.model('User', userSchema);
    console.log('Connected to MongoDB');
  } catch (e) {
    console.error('Mongo connection failed:', e);
    useMongo = false;
  }
}

// JSON fallback helpers
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
let USERS_JSON = readJSONSafe(USERS_FILE, {});
let WEEKLY_JSON = readJSONSafe(WEEKLY_FILE, []);

function ensureUserJson(userId) {
  if (!USERS_JSON[userId]) {
    USERS_JSON[userId] = {
      id: userId,
      name: Guest_${userId},
      balance: 0,
      inventory: [],
      lastFreeClaim: 0,
      weeklySpent: 0,
      wallet: null,
      referral: null
    };
    writeJSONSafe(USERS_FILE, USERS_JSON);
  }
  return USERS_JSON[userId];
}

// Weighted pick
function weightedPick(items) {
  const total = items.reduce((s, it) => s + (it.weight || 1), 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= (it.weight || 1);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// Items (same as previous)
const FREE_DAILY_ITEMS = [
  { name: '+1 ⭐️', stars: 1, img: 'items/star1.jpg', weight: 50 },
  { name: '+3 ⭐️', stars: 3, img: 'items/star3.jpg', weight: 30 },
  { name: '+5 ⭐️', stars: 5, img: 'items/star5.jpg', weight: 15 },
  { name: '🎁 Gift', stars: 12, img: 'items/gift.jpg', weight: 4 },
  { name: '🎉 Big Gift', stars: 30, img: 'items/big_gift.jpg', weight: 1 }
];

const CASE_0_1_ITEMS = [
  { name: 'Nothing', stars: 0, img: 'items/nothing.jpg', weight: 60 },
  { name: '+0.001 TON', ton: 0.001, stars: 1, img: 'items/ton_small.jpg', weight: 30 },
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

// Helper: getUser (DB or JSON)
async function getUser(userId) {
  if (useMongo && UserModel) {
    let u = await UserModel.findOne({ id: userId }).lean().exec();
    if (!u) {
      await UserModel.create({ id: userId, name: Guest_${userId} });
      u = await UserModel.findOne({ id: userId }).lean().exec();
    }
    return u;
  } else {
    return ensureUserJson(userId);
  }
}
async function saveUserObj(userObj) {
  if (useMongo && UserModel) {
    await UserModel.updateOne({ id: userObj.id }, { $set: userObj }, { upsert: true }).exec();
  } else {
    USERS_JSON[userObj.id] = userObj;
    writeJSONSafe(USERS_FILE, USERS_JSON);
  }
}

// API endpoints
app.get('/api/health', (req, res) => res.json({ ok: true, useMongo }));

app.get('/api/user/:id', async (req, res) => {
  const id = req.params.id;
  const user = await getUser(id);
  res.json({ ok: true, user });
});

app.get('/api/weekly-top', async (req, res) => {
  if (useMongo && UserModel) {
    const docs = await UserModel.find({}).sort({ weeklySpent: -1 }).limit(100).lean().exec();
    const top = docs.map(d => ({ id: d.id, name: d.name, spent: d.weeklySpent || 0 }));
    return res.json({ ok: true, top });
  } else {
    const top = Object.values(USERS_JSON)
      .map(u => ({ id: u.id, name: u.name, spent: u.weeklySpent || 0 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 100);
    return res.json({ ok: true, top });
  }
});

app.post('/api/connect-wallet/:id', async (req, res) => {
  const id = req.params.id;
  const { wallet } = req.body;
  const user = await getUser(id);
  user.wallet = wallet || null;
  await saveUserObj(user);
  res.json({ ok: true, wallet: user.wallet });
});

app.post('/api/disconnect-wallet/:id', async (req, res) => {
  const id = req.params.id;
  const user = await getUser(id);
  delete user.wallet;
  await saveUserObj(user);
  res.json({ ok: true });
});

app.post('/api/topup/:id', async (req, res) => {
  const id = req.params.id;
  const { amount } = req.body;
  const user = await getUser(id);
  const add = Number(amount) || 0;
  user.balance = (user.balance || 0) + add;
  await saveUserObj(user);
  res.json({ ok: true, balance: user.balance });
});

app.get('/api/check_sub/:id', async (req, res) => {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_USERNAME) {
    return res.json({ ok: true, subscribed: true, note: 'mock' });
  }
  try {
    const userId = req.params.id;
    const url = https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getChatMember?chat_id=${encodeURIComponent(TELEGRAM_CHANNEL_USERNAME)}&user_id=${userId};
    const r = await fetch(url);
    const j = await r.json();
    const status = j?.result?.status;
    const subscribed = status && status !== 'left' && status !== 'kicked';
    res.json({ ok: true, subscribed: !!subscribed, status: status || null });
  } catch (e) {
    console.error('check_sub error', e);
    res.json({ ok: false, error: 'failed to check subscription' });
  }
});

app.post('/api/case/:type/:id', async (req, res) => {
  const userId = req.params.id;
  const type = req.params.type;
  let user = await getUser(userId);

  try {
    if (type === 'free') {
      const now = Date.now();
      const DAY = 24 * 60 * 60 * 1000;
      if (user.lastFreeClaim && (now - user.lastFreeClaim) < DAY) {
        return res.json({ ok: false, error: 'free_cooldown', nextAvailableAt: user.lastFreeClaim + DAY });
      }
      const item = weightedPick(FREE_DAILY_ITEMS);
      user.balance = (user.balance  0) + (item.stars  0);
      user.inventory = user.inventory || [];
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: now });
      user.lastFreeClaim = now;
      await saveUserObj(user);
      return res.json({ ok: true, item, balance: user.balance });
    }

    if (type === '0.1') {
      const costTON = 0.1;
      const item = weightedPick(CASE_0_1_ITEMS);
      if (item.ton) user.balance += (item.ton * TON_TO_STARS);
      else user.balance += (item.stars || 0);
      user.inventory = user.inventory || [];
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: Date.now() });
      user.weeklySpent = (user.weeklySpent || 0) + costTON;
      await saveUserObj(user);
      return res.json({ ok: true, item, balance: user.balance });
    }

    if (type === '0.5') {
      const costTON = 0.5;
      const item = weightedPick(CASE_0_5_ITEMS);
      if (item.ton) user.balance += (item.ton * TON_TO_STARS);
      else user.balance += (item.stars || 0);
      user.inventory = user.inventory || [];
      user.inventory.push({ id: uuidv4(), name: item.name, img: item.img, obtainedAt: Date.now() });
      user.weeklySpent = (user.weeklySpent || 0) + costTON;
      await saveUserObj(user);
      return res.json({ ok: true, item, balance: user.balance });
    }

    return res.json({ ok: false, error: 'unknown_case_type' });
  } catch (e) {
    console.error('open case error', e);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

app.get('/api/inventory/:id', async (req, res) => {
  const id = req.params.id;
  const user = await getUser(id);
  res.json({ ok: true, inventory: user.inventory || [] });
});

app.get('/api/top100', async (req, res) => {
  if (useMongo && UserModel) {
    const docs = await UserModel.find({}).sort({ weeklySpent: -1 }).limit(100).lean().exec();
    const top = docs.map(d => ({ id: d.id, name: d.name, spent: d.weeklySpent || 0 }));
    return res.json({ ok: true, top });
  } else {
    const top = Object.values(USERS_JSON)
      .map(u => ({ id: u.id, name: u.name, spent: u.weeklySpent || 0 }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 100);
    return res.json({ ok: true, top });
  }
});

app.post('/api/reset-weekly', async (req, res) => {
  if (useMongo && UserModel) {
    await UserModel.updateMany({}, { $set: { weeklySpent: 0 } }).exec();
    return res.json({ ok: true });
  } else {
    Object.values(USERS_JSON).forEach(u => u.weeklySpent = 0);
    writeJSONSafe(WEEKLY_FILE, []);
    writeJSONSafe(USERS_FILE, USERS_JSON);
    return res.json({ ok: true });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// Start server after optional mongo init
(async () => {
  if (MONGO_URL) await initMongo();
  if (require.main === module) {
    app.listen(PORT, () => console.log(`Server listening at http://localhost:${PORT}, useMongo=${useMongo}`));
  }
})();

module.exports = app;