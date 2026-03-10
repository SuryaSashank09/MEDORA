// routes/stats.js — Save mission results, fetch dashboard data
const express = require('express');
const { stmts }    = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All stats routes require auth
router.use(verifyToken);

// ── GET /api/stats/dashboard ─────────────────────────
router.get('/dashboard', (req, res) => {
  try {
    const uid = req.user.id;
    stmts.createStats.run(uid);

    const statsRow  = stmts.getStats.get(uid);
    const badgeRows = stmts.getBadges.all(uid);
    const actRows   = stmts.getActivity.all(uid);

    res.json({
      stats: {
        best_score:  statsRow.best_score,
        total_saved: statsRow.total_saved,
        total_plays: statsRow.total_plays,
        total_kp:    statsRow.total_kp,
        updated_at:  statsRow.updated_at
      },
      badges:   badgeRows.map(r => r.badge_id),
      activity: actRows.map(r => ({
        id:         r.id,
        icon:       r.icon,
        title:      r.title,
        score:      r.score,
        grade:      r.grade,
        saved:      r.saved,
        total_npcs: r.total_npcs,
        kp:         r.kp,
        played_at:  r.played_at
      }))
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

// ── POST /api/stats/mission ──────────────────────────
router.post('/mission', (req, res) => {
  try {
    const uid = req.user.id;
    const {
      score      = 0,
      saved      = 0,
      total_npcs = 0,
      kp         = 0,
      grade      = 'F',
      victory    = false,
      wrong      = 0,
      best_combo = 0,
      diff       = 'normal',
      badges     = []
    } = req.body;

    const safeScore    = Math.min(Math.max(parseInt(score)    || 0, 0), 999999);
    const safeSaved    = Math.min(Math.max(parseInt(saved)    || 0, 0), 50);
    const safeNpcs     = Math.min(Math.max(parseInt(total_npcs)|| 0, 0), 50);
    const safeKp       = Math.min(Math.max(parseInt(kp)       || 0, 0), 9999);
    const safeGrade    = ['S','A','B','C','F'].includes(grade) ? grade : 'F';
    const safeIcon     = victory ? (safeGrade === 'S' ? '⭐' : '✅') : '❌';
    const safeTitle    = `${victory ? 'Mission Complete' : 'Game Over'} — Grade ${safeGrade} | ${safeSaved}/${safeNpcs} healed`;

    stmts.createStats.run(uid);
    stmts.updateStats.run(safeScore, safeSaved, safeKp, uid);

    if (Array.isArray(badges)) {
      badges.forEach(bid => {
        if (typeof bid === 'string' && bid.length < 50) {
          stmts.addBadge.run(uid, bid);
        }
      });
    }

    stmts.addActivity.run(uid, safeIcon, safeTitle, safeScore, safeGrade, safeSaved, safeNpcs, safeKp);

    const statsRow  = stmts.getStats.get(uid);
    const badgeRows = stmts.getBadges.all(uid);
    const actRows   = stmts.getActivity.all(uid);

    res.json({
      saved: true,
      stats: {
        best_score:  statsRow.best_score,
        total_saved: statsRow.total_saved,
        total_plays: statsRow.total_plays,
        total_kp:    statsRow.total_kp
      },
      badges:   badgeRows.map(r => r.badge_id),
      activity: actRows.map(r => ({
        id:         r.id,
        icon:       r.icon,
        title:      r.title,
        score:      r.score,
        grade:      r.grade,
        saved:      r.saved,
        total_npcs: r.total_npcs,
        kp:         r.kp,
        played_at:  r.played_at
      }))
    });
  } catch (err) {
    console.error('Save mission error:', err);
    res.status(500).json({ error: 'Failed to save mission' });
  }
});

// ── GET /api/stats/leaderboard ───────────────────────
router.get('/leaderboard', (req, res) => {
  try {
    const { db } = require('../db');
    const rows = db.prepare(`
      SELECT u.username, s.best_score, s.total_saved, s.total_plays,
             (SELECT COUNT(*) FROM badges WHERE user_id = u.id) as badge_count
      FROM users u
      JOIN stats s ON s.user_id = u.id
      ORDER BY s.best_score DESC
      LIMIT 20
    `).all();
    res.json({ leaderboard: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

module.exports = router;