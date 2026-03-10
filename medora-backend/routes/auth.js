// routes/auth.js — Register, Login, Me
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { stmts }    = require('../db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();
const SALT_ROUNDS = 10;

// ── POST /api/auth/register ──────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    if (username.trim().length > 20) {
      return res.status(400).json({ error: 'Username must be 20 characters or fewer' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ error: 'Username may only contain letters, numbers, underscores' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check duplicate
    const existing = stmts.findByUsername.get(username.trim());
    if (existing) {
      return res.status(409).json({ error: 'Username already taken. Please choose another.' });
    }

    // Hash & create
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const info = stmts.createUser.run(username.trim(), hashed);
    stmts.createStats.run(info.lastInsertRowid);

    // Issue token
    const token = jwt.sign({ id: info.lastInsertRowid, username: username.trim() }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: info.lastInsertRowid, username: username.trim() }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ── POST /api/auth/login ─────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = stmts.findByUsername.get(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect username or password' });
    }

    stmts.updateLastLogin.run(user.id);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      message: 'Welcome back, Healer!',
      token,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;