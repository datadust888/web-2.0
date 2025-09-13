// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "web")));

const DB_FILE = path.join(__dirname, "db.sqlite");

let db;
(async () => {
  db = await open({ filename: DB_FILE, driver: sqlite3.Database });
  await db.exec("PRAGMA journal_mode=WAL;");
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT,
      display_name TEXT,
      avatar_url TEXT,
      balance INTEGER DEFAULT 0,
      spent INTEGER DEFAULT 0,
      referrer INTEGER,
      last_free INTEGER DEFAULT 0,
      last_reminder INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      kind TEXT,
      amount INTEGER,
      meta TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      item_key TEXT,
      item_name TEXT,
      meta TEXT,
      created_at INTEGER DEFAULT (strftime('%s','now'))
    );
  `);
  console.log("DB ready");
})();

function asInt(v){ const n = parseInt(v); return Number.isFinite(n) ? n : 0; }

// POST /api/profile { init_data?, user_id?, username?, display_name?, avatar_url? }
app.post("/api/profile", async (req, res) => {
  try {
    const uid = asInt(req.body.user_id || 0);
    if (!uid) return res.json({ ok:false, error: "no user_id" });
    const username = req.body.username || null;
    const display_name = req.body.display_name || null;
    const avatar_url = req.body.avatar_url || null;

    const row = await db.get("SELECT id, username, display_name, avatar_url, balance, spent, last_free FROM users WHERE id = ?", uid);
    if (!row) {
      await db.run("INSERT INTO users (id, username, display_name, avatar_url) VALUES (?,?,?,?)", uid, username, display_name, avatar_url);
      return res.json({ ok:true, profile: { id: uid, username, display_name, avatar_url, balance:0, spent:0, last_free:0 }});
    } else {
      if (username  display_name  avatar_url) {
        await db.run("UPDATE users SET username = COALESCE(?, username), display_name = COALESCE(?, display_name), avatar_url = COALESCE(?, avatar_url) WHERE id = ?",
                     username, display_name, avatar_url, uid);
      }
      const fresh = await db.get("SELECT id, username, display_name, avatar_url, balance, spent, last_free FROM users WHERE id = ?", uid);
      return res.json({ ok:true, profile: fresh });
    }
  } catch(e){ console.error(e); res.status(500).json({ ok:false, error: e.message }); }
});

// POST /api/register_ref { referrer, referred }
app.post("/api/register_ref", async (req, res) => {
  try {
    const ref = asInt(req.body.referrer);
    const referred = asInt(req.body.referred);
    if (!ref || !referred) return res.json({ ok:false, error:"need referrer and referred" });
    const r = await db.get("SELECT referrer FROM users WHERE id = ?", referred);
    if (r && r.referrer) return res.json({ ok:false, error:"already has referrer" });
    await db.run("UPDATE users SET referrer = ? WHERE id = ?", ref, referred);
    return res.json({ ok:true });
  } catch(e){ console.error(e); res.status(500).json({ok:false, error:e.message}); }
});

// POST /api/open_case { user_id, case_slug }
app.post("/api/open_case", async (req, res) => {
  try {
    const uid = asInt(req.body.user_id || 0);
    const slug = req.body.case_slug || "free";
    if (!uid) return res.json({ ok:false, error: "no user_id" });

    const now = Math.floor(Date.now()/1000);
    const row = await db.get("SELECT last_free FROM users WHERE id = ?", uid);
    const last_free = row ? (row.last_free || 0) : 0;if (slug === "free" && (now - last_free) < 24*3600) {
      return res.json({ ok:false, error: "cooldown" });
    }

    // drop table (example weights) — customize
    const drops = [
      { type: "stars", amount: 1, weight: 3000 },
      { type: "stars", amount: 5, weight: 2000 },
      { type: "stars", amount: 10, weight: 1000 },
      { type: "item", item_key: "bear", item_name: "Telegram Bear", weight: 500 },
      { type: "item", item_key: "nft_cigar", item_name: "NFT Cigar (20 TON)", weight: 5 }
    ];
    const total = drops.reduce((s,d)=>s+d.weight,0);
    let r = Math.random()*total, upto=0, pick=null;
    for (const d of drops) { upto += d.weight; if (r <= upto) { pick = d; break; } }

    if (!pick) return res.json({ ok:false, error: "no prize" });

    if (pick.type === "stars") {
      const amt = asInt(pick.amount);
      await db.run("INSERT INTO transactions (user_id, kind, amount, meta) VALUES (?,?,?,?)", uid, "case", amt, JSON.stringify(pick));
      await db.run("UPDATE users SET balance = balance + ?, spent = spent + ?, last_free = ? WHERE id = ?", amt, amt, now, uid);
      return res.json({ ok:true, prize: { type:"stars", amount: amt } });
    } else {
      await db.run("INSERT INTO transactions (user_id, kind, amount, meta) VALUES (?,?,?,?)", uid, "case_item", 0, JSON.stringify(pick));
      await db.run("INSERT INTO inventory (user_id, item_key, item_name, meta) VALUES (?,?,?,?)", uid, pick.item_key, pick.item_name, JSON.stringify(pick));
      await db.run("UPDATE users SET last_free = ? WHERE id = ?", now, uid);
      return res.json({ ok:true, prize: { type:"item", item_name: pick.item_name } });
    }

  } catch(e){ console.error(e); res.status(500).json({ ok:false, error: e.message }); }
});

// GET /api/top100?period=weekly
app.get("/api/top100", async (req, res) => {
  try {
    const period = req.query.period || "all";
    if (period === "weekly") {
      const since = Math.floor((Date.now()/1000) - 7*24*3600);
      const rows = await db.all(`
        SELECT u.id, u.username, u.display_name, u.avatar_url,
               IFNULL(SUM(t.amount),0) as spent_week
        FROM users u
        LEFT JOIN transactions t ON t.user_id = u.id AND t.kind='case' AND t.created_at >= ?
        GROUP BY u.id
        ORDER BY spent_week DESC
        LIMIT 100
      `, since);
      return res.json({ ok:true, top: rows.map(r=>({...r, spent_week: r.spent_week || 0})) });
    } else {
      const rows = await db.all("SELECT id, username, display_name, avatar_url, spent FROM users ORDER BY spent DESC LIMIT 100");
      return res.json({ ok:true, top: rows });
    }
  } catch(e){ console.error(e); res.status(500).json({ok:false, error:e.message}); }
});

// GET /api/topreferrals
app.get("/api/topreferrals", async (req, res) => {
  try {
    const rows = await db.all(`
      SELECT u.id, u.username, u.display_name, u.avatar_url, COUNT(r.id) as referred_count
      FROM users u
      LEFT JOIN users r ON r.referrer = u.id
      GROUP BY u.id
      ORDER BY referred_count DESC
      LIMIT 100
    `);
    return res.json({ ok:true, top: rows.map(r=>({...r, referred_count: r.referred_count || 0})) });
  } catch(e){ console.error(e); res.status(500).json({ok:false, error:e.message}); }
});

// GET /api/due_reminders -> mark and return users to notify
app.get("/api/due_reminders", async (req, res) => {
  try {
    const now = Math.floor(Date.now()/1000);
    const rows = await db.all("SELECT id, last_free, last_reminder FROM users");
    const toNotify = [];
    for (const r of rows) {
      const lastfree = r.last_free || 0;
      const lastrem = r.last_reminder || 0;
      if (now - lastfree >= 24*3600 && now - lastrem >= 12*3600) {
        toNotify.push(r.id);
        await db.run("UPDATE users SET last_reminder = ? WHERE id = ?", now, r.id);
      }
    }
    return res.json({ ok:true, users: toNotify });
  } catch(e){ console.error(e); res.status(500).json({ok:false, error:e.message}); }
});

app.get("/health", (req,res)=>res.json({ ok:true }));

app.get("/", (req,res) => res.sendFile(path.join(__dirname, "web", "index.html")));

const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=>console.log("Server listening on", PORT));