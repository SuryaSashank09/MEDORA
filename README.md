# 🏥 Medora — The Realm of Healing

> A 3D medical knowledge game with real user accounts, dashboard tracking, and a Node.js backend.

---

## 📁 Project Structure

```
medora/
├── backend/                  ← Node.js + Express + SQLite API
│   ├── data/                 ← Auto-created; medora.db lives here
│   ├── middleware/
│   │   └── auth.js           ← JWT verification middleware
│   ├── routes/
│   │   ├── auth.js           ← /api/auth/register, /login, /me
│   │   └── stats.js          ← /api/stats/dashboard, /mission, /leaderboard
│   ├── db.js                 ← SQLite schema + prepared statements
│   ├── server.js             ← Express app entry point
│   └── package.json
│
└── frontend/
    └── public/
        └── index.html        ← Complete single-file game (HTML + CSS + JS + Three.js)
```

---

## 🚀 Quick Start

### Step 1 — Backend (run these EXACTLY in order)

```powershell
cd medora\backend
npm install
npm start
```

If you see any `better-sqlite3` build errors on Windows, run:
```powershell
npm install --ignore-scripts
npm start
```

Server starts at → **http://localhost:3001**  
Test it: open http://localhost:3001/api/health in browser ✅

### Step 2 — Frontend

Open `frontend/public/index.html` directly in your browser, **or** serve it:

```bash
# Option A: VS Code Live Server (recommended)
# Right-click index.html → "Open with Live Server"
# It will run on http://localhost:5500

# Option B: npx serve
cd medora/frontend/public
npx serve .
# Runs on http://localhost:3000
```

> ⚠️ The frontend calls `http://localhost:3001` for the API.
> Make sure the backend is running before playing.

---

## 🎮 How to Play

1. Open the game → Login or Register (or play as Guest)
2. Dashboard shows your stats, rank, badges, and mission history
3. Click **▶ PLAY NOW** → Choose difficulty
4. Navigate the 3D world with **WASD** or **Arrow Keys**
5. Approach glowing patients → Answer medical questions
6. Earn XP, badges, and climb the healer ranks!

---

## 🔌 API Endpoints

| Method | Endpoint                  | Auth | Description              |
|--------|---------------------------|------|--------------------------|
| POST   | /api/auth/register        | ❌   | Create new account       |
| POST   | /api/auth/login           | ❌   | Login, get JWT           |
| GET    | /api/auth/me              | ✅   | Verify session           |
| GET    | /api/stats/dashboard      | ✅   | All dashboard data       |
| POST   | /api/stats/mission        | ✅   | Save mission results     |
| GET    | /api/stats/leaderboard    | ✅   | Top 20 players           |

---

## 🛡️ Features

- ✅ Secure password hashing (bcrypt)
- ✅ JWT session tokens (30-day expiry)
- ✅ Auto session restore on revisit
- ✅ Guest mode (no account needed)
- ✅ Dashboard updates **live** after every mission
- ✅ Badge system synced to server
- ✅ Offline fallback (localStorage) if server is down
- ✅ Input validation on both frontend and backend
- ✅ Custom ✚ cursor with trail particles
- ✅ Ripple animations on all buttons
- ✅ Page transition veil between screens
- ✅ 3D world with Three.js

---

## ⚙️ Environment Variables (Optional)

Create `backend/.env`:

```env
PORT=3001
JWT_SECRET=your-super-secret-key-here
```

---

## 🔧 Troubleshooting

| Problem | Fix |
|---------|-----|
| "Failed to fetch" in game | Make sure backend is running (`npm start` in `/backend`) |
| Cursor not visible | The custom ✚ cursor replaces the system cursor — move mouse inside window |
| Dashboard shows `…` | Backend not connected; game falls back to local data |
| "Username taken" on register | Choose a different username or login instead |
