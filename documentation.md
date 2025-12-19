# SketchLink Docs

## Environment Setup

### Environment Variables

Create `.env` in root:

```env
# Server port (local dev)
PORT=3001

# Production server URL (set in Vercel/Netlify)
VITE_SERVER_URL=https://your-server.onrender.com
```

### Local Dev

```bash
npm install
npm run dev       # Vite dev server
node server.js    # Socket server
```

---

## Deployment

### Frontend (Vercel/Netlify)

**Build settings:**
- Build: `npm run build`
- Output: `dist`

**Environment variables to set:**
| Variable | Value |
|----------|-------|
| `VITE_SERVER_URL` | `https://your-render-app.onrender.com` |

### Backend (Render)

**Settings:**
- Build: `npm install`
- Start: `node server.js`

**Environment variables:**
| Variable | Value |
|----------|-------|
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

> Free tier sleeps after 15min. App has auto-wake feature.

---

## Architecture

```
Client (Netlify/Vercel)  ←→  Socket Server (Render)
        ↓                           ↓
   React + Vite              Node + Socket.io
```

**Game flow:** Create room → Share code → Start game → Draw/Guess → Score

---

## Socket Events

| Event | Direction | Purpose |
|-------|-----------|---------|
| `create_room` | Client→Server | Make new room |
| `join_room` | Client→Server | Join with code |
| `game_event` | Both | Drawing, chat, sync |
| `room_joined` | Server→Client | Confirm join |

---

## Troubleshooting

**Can't connect?** Server sleeping. Wait 30s.

**Room not found?** Room expired. Make new one.

**Drawing not syncing?** Refresh page.

---

## Console Cheats (Dev)

Open browser console:
```js
victorymation()     // Victory animation
cheats.confetti()   // Confetti
cheats.help()       // All commands
```
