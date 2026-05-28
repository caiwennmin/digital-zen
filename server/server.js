/* ============================================
   server.js — Digital Zen Backend
   Express + sql.js (WebAssembly SQLite) + JWT
   ============================================ */

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3456;
const JWT_SECRET = process.env.JWT_SECRET || "digital-zen-secret-change-in-production";
const DB_PATH = path.join(__dirname, "digital_zen.db");

let db;

// ---- Database init ----
async function initDB() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }
  db.run("PRAGMA foreign_keys = ON");
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS user_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      data_key TEXT NOT NULL,
      data_value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, data_key)
    )
  `);
  saveDB();
}

function saveDB() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// ---- Middleware ----
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "未登录" });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "登录已过期" });
  }
}

// ---- Routes ----

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// Register
app.post("/api/auth/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "邮箱和密码不能为空" });
  if (password.length < 6) return res.status(400).json({ error: "密码至少 6 位" });

  const exists = db.exec("SELECT id FROM users WHERE email = ?", [email]);
  if (exists.length && exists[0].values.length) {
    return res.status(409).json({ error: "该邮箱已注册" });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (email, password) VALUES (?, ?)", [email, hash]);
  saveDB();

  const result = db.exec("SELECT last_insert_rowid()");
  const userId = result[0].values[0][0];
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, userId });
});

// Login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "邮箱和密码不能为空" });

  const result = db.exec("SELECT id, password FROM users WHERE email = ?", [email]);
  if (!result.length || !result[0].values.length) {
    return res.status(401).json({ error: "邮箱或密码错误" });
  }
  const [id, hash] = result[0].values[0];
  if (!bcrypt.compareSync(password, String(hash))) {
    return res.status(401).json({ error: "邮箱或密码错误" });
  }

  const token = jwt.sign({ userId: id }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, userId: id });
});

// Me
app.get("/api/auth/me", auth, (req, res) => {
  const result = db.exec("SELECT id, email, created_at FROM users WHERE id = ?", [req.userId]);
  if (!result.length || !result[0].values.length) return res.status(404).json({ error: "用户不存在" });
  const [id, email, created] = result[0].values[0];
  res.json({ id, email, created_at: created });
});

// Sync save
app.post("/api/sync/save", auth, (req, res) => {
  const { data } = req.body;
  if (!data || typeof data !== "object") return res.status(400).json({ error: "数据格式错误" });

  for (const [key, value] of Object.entries(data)) {
    db.run(
      `INSERT INTO user_data (user_id, data_key, data_value, updated_at)
       VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, data_key)
       DO UPDATE SET data_value = excluded.data_value, updated_at = datetime('now')`,
      [req.userId, key, JSON.stringify(value)]
    );
  }
  saveDB();
  res.json({ saved: Object.keys(data).length });
});

// Sync load
app.get("/api/sync/load", auth, (req, res) => {
  const result = db.exec("SELECT data_key, data_value FROM user_data WHERE user_id = ?", [req.userId]);
  const data = {};
  if (result.length) {
    for (const [key, value] of result[0].values) {
      try { data[key] = JSON.parse(String(value)); }
      catch { data[key] = value; }
    }
  }
  res.json(data);
});

// Delete account
app.delete("/api/auth/delete", auth, (req, res) => {
  db.run("DELETE FROM user_data WHERE user_id = ?", [req.userId]);
  db.run("DELETE FROM users WHERE id = ?", [req.userId]);
  saveDB();
  res.json({ deleted: true });
});

// Serve frontend
app.use(express.static(path.join(__dirname, "..")));

// ---- Start ----
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Digital Zen: http://localhost:${PORT}`);
  });
});
