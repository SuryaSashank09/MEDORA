// db.js — SQLite database setup and helpers
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'medora.db'));

// Enable WAL for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── SCHEMA ───────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    UNIQUE NOT NULL COLLATE NOCASE,
    password    TEXT    NOT NULL,
    created_at  TEXT    DEFAULT (datetime('now')),
    last_login  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS stats (
    user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    best_score  INTEGER DEFAULT 0,
    total_saved INTEGER DEFAULT 0,
    total_plays INTEGER DEFAULT 0,
    total_kp    INTEGER DEFAULT 0,
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS badges (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
    badge_id  TEXT    NOT NULL,
    earned_at TEXT    DEFAULT (datetime('now')),
    UNIQUE(user_id, badge_id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    icon       TEXT    DEFAULT '🚑',
    title      TEXT    NOT NULL,
    score      INTEGER DEFAULT 0,
    grade      TEXT    DEFAULT 'C',
    saved      INTEGER DEFAULT 0,
    total_npcs INTEGER DEFAULT 0,
    kp         INTEGER DEFAULT 0,
    played_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_activity_user ON activity(user_id);
  CREATE INDEX IF NOT EXISTS idx_badges_user   ON badges(user_id);
`);

// ─── HELPERS ──────────────────────────────────────────
const stmts = {
  // Users
  createUser:     db.prepare(`INSERT INTO users (username, password) VALUES (?, ?)`),
  findByUsername: db.prepare(`SELECT * FROM users WHERE username = ? COLLATE NOCASE`),
  findById:       db.prepare(`SELECT id, username, created_at, last_login FROM users WHERE id = ?`),
  updateLastLogin:db.prepare(`UPDATE users SET last_login = datetime('now') WHERE id = ?`),

  // Stats
  createStats:    db.prepare(`INSERT OR IGNORE INTO stats (user_id) VALUES (?)`),
  getStats:       db.prepare(`SELECT * FROM stats WHERE user_id = ?`),
  updateStats:    db.prepare(`
    UPDATE stats SET
      best_score  = MAX(best_score, ?),
      total_saved = total_saved + ?,
      total_plays = total_plays + 1,
      total_kp    = total_kp + ?,
      updated_at  = datetime('now')
    WHERE user_id = ?
  `),

  // Badges
  addBadge:       db.prepare(`INSERT OR IGNORE INTO badges (user_id, badge_id) VALUES (?, ?)`),
  getBadges:      db.prepare(`SELECT badge_id FROM badges WHERE user_id = ? ORDER BY earned_at ASC`),

  // Activity
  addActivity:    db.prepare(`
    INSERT INTO activity (user_id, icon, title, score, grade, saved, total_npcs, kp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getActivity:    db.prepare(`
    SELECT * FROM activity WHERE user_id = ?
    ORDER BY played_at DESC LIMIT 10
  `),
  countActivity:  db.prepare(`SELECT COUNT(*) as c FROM activity WHERE user_id = ?`),
};

module.exports = { db, stmts };
