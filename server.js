// server.js — production-ready baseline (sqlite) with Telegram initData validation + socket.io
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const http = require('http');
const { Server } = require('socket.io');
const crypto = require('crypto');

const BOT_TOKEN = process.env.BOT_TOKEN || '';
if (!BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN not set in .env - required for initData validation');
  // we still continue in dev but will reject initData requests
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- sqlite db init
const DB_FILE = path.join(__dirname, 'data.sqlite');
const dbExists = fs.existsSync(DB_FILE);
const db = new sqlite3.Database(DB_FILE);

function run(sql, params = []) {
  return new Promise((res, rej) => db.run(sql, params, function (err) {
    if (err) rej(err); else res(this);
  }));
}
function get(sql, params = []) {
  return new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row)));
}
function all(sql, params = []) {
  return new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows)));
}

async function initDb() {
  if (!dbExists) {
    await run(`CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tg_id TEXT UNIQUE,
      username TEXT,
      first_name TEXT,
      avatar_url TEXT,
      wallet_address TEXT,
      balance_stars REAL DEFAULT 0,
      balance_ton REAL DEFAULT 0,
      last_free_claim INTEGER DEFAULT 0,
      total_spent_ton REAL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);
    await run(`CREATE TABLE drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      case_slug TEXT,
      item_name TEXT,
      stars REAL DEFAULT 0,
      ton REAL DEFAULT 0,
      spent_ton REAL DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);
    await run(`CREATE TABLE inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      item_json TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    )`);
    console.log('DB initialized');
  }
}
initDb().catch(console.error);

// ---------------- CASES (server-side, weights represent relative rarity) ----------------
// We implement distributions you specified (free daily: mostly +1, then +3, +5; rare gifts + TON ~ total 3%).
const CASES = {
  free_daily: {
    slug: 'free_daily',
    price_ton: 0,
    items: [
      { name: '+1 ⭐', stars: 1, weight: 700, img: 'items/star1.jpg' },     // ~70%
      { name: '+3 ⭐', stars: 3, weight: 200, img: 'items/star3.jpg' },     // ~20%
      { name: '+5 ⭐', stars: 5, weight: 70, img: 'items/star5.jpg' },      // ~7%
      // gifts (rare, decreasing)
      { name: 'Gift (15 ⭐)', stars: 15, weight: 15, img: 'items/gift15.jpg' },
      { name: 'Gift (30 ⭐)', stars: 30, weight: 10, img: 'items/gift30.jpg' },
      // TON small rare (total ~3% weights)
      { name: 'Tiny TON 0.01', ton: 0.01, weight: 3, img: 'items/ton_001.jpg' },
      { name: 'Small TON 0.05', ton: 0.05, weight: 2, img: 'items/ton_005.jpg' }
    ]
  },

  case_0_1_ton: {
    slug: 'case_0_1_ton',
    price_ton: 0.1,
    items: [
      // extremely rare events (weights chosen to reflect extremely small chances)
      { name: 'Durov Cap', ton: 0, stars: 0, weight: 0.001, img: 'items/durov_cap.jpg' }, // ~0.001
      { name: 'Pepe', ton: 0, stars: 0, weight: 0.0001, img: 'items/pepe.jpg' }, // ~0.0001
      { name: 'Nothing', weight: 999999, img: 'items/nothing.jpg' }
    ]
  },

  case_0_5_ton: {
    slug: 'case_0_5_ton',
    price_ton: 0.5,
    items: [
      { name: '+0.05 TON', ton: 0.05, weight: 15, img: 'items/ton_005.jpg' },
      { name: '+0.4 TON', ton: 0.4, weight: 20, img: 'items/ton_04.jpg' },
      { name: '+0.77 TON', ton: 0.77, weight: 37, img: 'items/ton_077.jpg' },
      { name: 'Calendar +1.43 TON', ton: 1.43, weight: 8, img: 'items/calendar.jpg' },
      { name: 'Lollipop +1.54 TON', ton: 1.54, weight: 7, img: 'items/lollipop.jpg' },
      { name: 'Hex Pot +3.12 TON', ton: 3.12, weight: 6, img: 'items/hexpot.jpg' },
      { name: 'Berry Box +4.05 TON', ton: 4.05, weight: 4, img: 'items/berrybox.jpg' },
      { name: 'Flower +5.13 TON', ton: 5.13, weight: 3, img: 'items/flower.jpg' },
      { name: 'Skull Ball +7.81 TON', ton: 7.81, weight: 0.5, img: 'items/skullball.jpg' },
      { name: 'NFT Ring +18.15 TON', ton: 18.15, weight: 0.1, img: 'items/nftring.jpg' },
      { name: 'Nothing', weight: 100 - (15 + 20 + 37 + 8 + 7 + 6 + 4 + 3 + 0.5 + 0.1), img: 'items/nothing.jpg' }
    ]
  }
};

function weightedPick(items) {
  const total = items.reduce((s, it) => s + (it.weight || 0), 0);
  if (total <= 0) return null;
  let r = Math.random() * total;
  for (const it of items) {
    r -= (it.weight || 0);
    if (r <= 0) return it;
  }
  return items[items.length - 1];
}

// ---------------- Telegram initData validation (HMAC SHA256) ----------------
// Based on Telegram docs: compute secret = HMAC_SHA256("WebAppData", BOT_TOKEN) as bytes,
// then HMAC_SHA256(secret, data_check_string) should equal hex hash in initData (field "hash").
// initDataString is the raw string from window.Telegram.WebApp.initData
function parseQueryString(str) {
  const obj = {};
  str.split('&').forEach(pair => {
    if (!pair) return;
    const idx = pair.indexOf('=');
    if (idx >= 0) {
      const key = decodeURIComponent(pair.slice(0, idx));
      const val = decodeURIComponent(pair.slice(idx + 1));
      obj[key] = val;
    } else {
      obj[decodeURIComponent(pair)] = '';
    }
  });
  return obj;
}

function validateInitData(initDataString) {
  if (!BOT_TOKEN) return null;
  try {
    const params = parseQueryString(initDataString);
    const hash = params.hash;
    if (!hash) return null;
    const keys = Object.keys(params).filter(k => k !== 'hash').sort();
    const arr = keys.map(k => `${k}=${params[k]}`);
    const data_check_string = arr.join('\n');
    const secret = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const hmac = crypto.createHmac('sha256', secret).update(data_check_string).digest('hex');
    if (hmac === hash) {
      // parse into object values (user is JSON)
      const out = {};
      keys.forEach(k => {
        try { out[k] = JSON.parse(params[k]); } catch (e) { out[k] = params[k]; }
      });
      return out;
    } else {
      return null;
    }
  } catch (e) {
    console.error('validateInitData error', e);
    return null;
  }
}

// ---------------- helper user functions (use parsed initData object) ----------------
async function findOrCreateUserFromInit(parsedInit) {
  // parsedInit should include user object as parsed by validateInitData
  const tg_user = parsedInit && parsedInit.user ? parsedInit.user : null;
  if (!tg_user) {
    // create guest id
    const guestId = 'guest_' + Math.random().toString(36).slice(2, 10);
    await run(`INSERT OR IGNORE INTO users (tg_id, first_name) VALUES (?, ?)`, [guestId, 'Guest']);
    return await get(`SELECT * FROM users WHERE tg_id = ?`, [guestId]);
  }
  const tg_id = String(tg_user.id);
  let u = await get(`SELECT * FROM users WHERE tg_id = ?`, [tg_id]);
  if (!u) {
    await run(`INSERT INTO users (tg_id, username, first_name, avatar_url) VALUES (?,?,?,?)`, [tg_id, tg_user.username  null, tg_user.first_name  null, tg_user.photo_url || null]);
    u = await get(`SELECT * FROM users WHERE tg_id = ?`, [tg_id]);
  } else {
    // update profile info
    await run(`UPDATE users SET username = ?, first_name = ?, avatar_url = ? WHERE tg_id = ?`, [tg_user.username  u.username, tg_user.first_name  u.first_name, tg_user.photo_url || u.avatar_url, tg_id]);
    u = await get(`SELECT * FROM users WHERE tg_id = ?`, [tg_id]);
  }
  return u;
}

async function getInventoryForUser(user_id) {
  const rows = await all(`SELECT * FROM inventory WHERE user_id = ? ORDER BY created_at DESC`, [user_id]);return rows.map(r => JSON.parse(r.item_json));
}

// ---------------- API endpoints ----------------

// POST /api/profile  body: { init_data: "<initData string>" }
app.post('/api/profile', async (req, res) => {
  try {
    const initDataString = req.body.init_data || req.body.initData;
    if (!initDataString) return res.status(400).json({ ok: false, error: 'init_data required' });
    const parsed = validateInitData(initDataString);
    if (!parsed) return res.status(400).json({ ok: false, error: 'invalid init_data' });
    const user = await findOrCreateUserFromInit(parsed);
    const inv = await getInventoryForUser(user.id);
    const next_free = (user.last_free_claim || 0) + 24 * 3600;
    res.json({
      ok: true,
      profile: {
        id: user.id,
        tg_id: user.tg_id,
        username: user.username,
        first_name: user.first_name,
        avatar_url: user.avatar_url,
        balance_stars: Number(user.balance_stars || 0),
        balance_ton: Number(user.balance_ton || 0),
        last_free_claim: user.last_free_claim || 0,
        next_free_claim: next_free,
        total_spent_ton: Number(user.total_spent_ton || 0),
        wallet_address: user.wallet_address || null
      },
      inventory: inv
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/open_case  body: { init_data: "<...>", case_slug: "free_daily" }
app.post('/api/open_case', async (req, res) => {
  try {
    const initDataString = req.body.init_data || req.body.initData;
    const caseSlug = req.body.case_slug;
    if (!initDataString) return res.status(400).json({ ok: false, error: 'init_data required' });
    const parsed = validateInitData(initDataString);
    if (!parsed) return res.status(400).json({ ok: false, error: 'invalid init_data' });
    if (!caseSlug || !CASES[caseSlug]) return res.status(400).json({ ok: false, error: 'unknown case' });

    const user = await findOrCreateUserFromInit(parsed);
    const theCase = CASES[caseSlug];
    const now = Math.floor(Date.now() / 1000);

    // free_daily cooldown
    if (caseSlug === 'free_daily') {
      if ((user.last_free_claim || 0) + 24 * 3600 > now) {
        return res.json({ ok: false, error: 'free_daily_cooldown', next_free: (user.last_free_claim || 0) + 24 * 3600 });
      }
    }

    // paid case balance
    if (theCase.price_ton > 0) {
      if ((user.balance_ton || 0) < theCase.price_ton) return res.json({ ok: false, error: 'insufficient_ton' });
    }

    const picked = weightedPick(theCase.items);
    if (!picked) return res.status(500).json({ ok: false, error: 'pick_failed' });

    // transaction: update DB atomically
    await run('BEGIN TRANSACTION');
    try {
      if (theCase.price_ton > 0) {
        await run(`UPDATE users SET balance_ton = balance_ton - ?, total_spent_ton = total_spent_ton + ? WHERE id = ?`, [theCase.price_ton, theCase.price_ton, user.id]);
      }
      let addedStars = 0, addedTon = 0;
      if (picked.stars) {
        addedStars = picked.stars;
        await run(`UPDATE users SET balance_stars = balance_stars + ? WHERE id = ?`, [addedStars, user.id]);
      }
      if (picked.ton) {
        addedTon = picked.ton;
        await run(`UPDATE users SET balance_ton = balance_ton + ? WHERE id = ?`, [addedTon, user.id]);
      }

      await run(`INSERT INTO drops (user_id, case_slug, item_name, stars, ton, spent_ton) VALUES (?,?,?,?,?,?)`, [user.id, caseSlug, picked.name  '', addedStars  0, addedTon  0, theCase.price_ton  0]);
      const snap = JSON.stringify({ name: picked.name, stars: picked.stars  0, ton: picked.ton  0, img: picked.img || null, ts: now });
      await run(`INSERT INTO inventory (user_id, item_json) VALUES (?,?)`, [user.id, snap]);

      if (caseSlug === 'free_daily') {
        await run(`UPDATE users SET last_free_claim = ? WHERE id = ?`, [now, user.id]);
      }

      await run('COMMIT');

      const updatedUser = await get(`SELECT * FROM users WHERE id = ?`, [user.id]);
      const broadcast = { user_id: user.id, username: updatedUser.username  updatedUser.first_name  'User', item: { name: picked.name, stars: picked.stars  0, ton: picked.ton  0, img: picked.img || null }, ts: now };
      io.emit('new_drop', broadcast);

      res.json({ ok: true, item: broadcast.item, new_balance: { stars: Number(updatedUser.balance_stars  0), ton: Number(updatedUser.balance_ton  0) } });
    } catch (e) {
      await run('ROLLBACK');
      throw e;
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/top100 — weekly (7 days)
app.get('/api/top100', async (req, res) => {
  try {
    const since = Math.floor(Date.now() / 1000) - 7 * 24 * 3600;
    const rows = await all(`SELECT u.id, u.username, u.first_name, SUM(d.spent_ton) as spent
      FROM users u JOIN drops d ON d.user_id = u.id
      WHERE d.created_at >= ?
      GROUP BY u.id ORDER BY spent DESC LIMIT 100`, [since]);
    res.json({ ok: true, top: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/live — last drops
app.get('/api/live', async (req, res) => {
  try {
    const rows = await all(`SELECT d.*, u.username FROM drops d JOIN users u ON u.id = d.user_id ORDER BY d.created_at DESC LIMIT 50`);
    res.json({ ok: true, drops: rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/connect_wallet { init_data, address }
app.post('/api/connect_wallet', async (req, res) => {
  try {
    const initDataString = req.body.init_data;
    const address = req.body.address;
    if (!initDataString || !address) return res.status(400).json({ ok: false, error: 'init_data+address required' });
    const parsed = validateInitData(initDataString);
    if (!parsed) return res.status(400).json({ ok: false, error: 'invalid init_data' });
    const user = await findOrCreateUserFromInit(parsed);
    await run(`UPDATE users SET wallet_address = ? WHERE id = ?`, [address, user.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Socket.io
io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => { console.log('socket disconnected', socket.id); });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));