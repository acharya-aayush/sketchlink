# 📚 SketchLink Documentation

Complete technical documentation for SketchLink multiplayer drawing game.

## Table of Contents

- [Environment Setup](#environment-setup)
- [Architecture Overview](#architecture-overview)
- [API Reference](#api-reference)
- [Socket Events](#socket-events)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)

---

## Environment Setup

### .env.example

Create a `.env` file in the root directory with the following variables:

```env
# ===========================================
# SERVER CONFIGURATION
# ===========================================

# Port for the game server (default: 3001)
PORT=3001

# Node environment (development | production)
NODE_ENV=development

# ===========================================
# CLIENT CONFIGURATION  
# ===========================================

# Backend server URL (for production)
VITE_SERVER_URL=https://your-server.onrender.com

# ===========================================
# OPTIONAL: FUTURE FEATURES
# ===========================================

# Database URL (if adding persistence)
# DATABASE_URL=mongodb://localhost:27017/sketchlink

# Redis URL (if adding session management)
# REDIS_URL=redis://localhost:6379

# JWT Secret (if adding authentication)
# JWT_SECRET=your-super-secret-jwt-key

# ===========================================
# RATE LIMITING (Optional)
# ===========================================

# Max connections per IP
# MAX_CONNECTIONS_PER_IP=5

# Max rooms per server
# MAX_ROOMS=100
```

### Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Modify values as needed for your setup

3. The app will automatically use `localhost:3001` in development

---

## Architecture Overview

### System Architecture

```
┌─────────────────┐         ┌─────────────────┐
│                 │         │                 │
│  React Client   │◄───────►│  Socket.io      │
│  (Netlify)      │   WS    │  Server         │
│                 │         │  (Render)       │
└─────────────────┘         └─────────────────┘
        │                           │
        │                           │
        ▼                           ▼
┌─────────────────┐         ┌─────────────────┐
│  Vite Build     │         │  In-Memory      │
│  Static Assets  │         │  Game Rooms     │
└─────────────────┘         └─────────────────┘
```

### Data Flow

1. **Room Creation**: Host creates room → Server generates room ID → Host joins room
2. **Player Joining**: Player enters room ID → Server validates → Player joins room
3. **Game Loop**: Word selection → Drawing phase → Guessing → Scoring → Next turn
4. **Real-time Sync**: All game events broadcast via Socket.io to room members

### Key Components

| Component | Purpose |
|-----------|---------|
| `App.tsx` | Main state management, game phases |
| `CanvasBoard.tsx` | Drawing canvas with touch support |
| `ChatSidebar.tsx` | Chat messages, guessing interface |
| `LobbyScreen.tsx` | Room creation/joining UI |
| `multiplayer.ts` | Socket.io client service |
| `server.js` | Game server, room management |

---

## API Reference

### REST Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server status message |
| `/health` | GET | Health check with room count |

### Health Check Response

```json
{
  "status": "ok",
  "rooms": 3
}
```

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `create_room` | `{ name, avatar }` | Create new game room |
| `join_room` | `{ roomId, name, avatar }` | Join existing room |
| `update_settings` | `GameSettings` | Update room settings (host only) |
| `start_game` | - | Start the game (host only) |
| `get_words` | callback | Request word options |
| `select_word` | `word: string` | Select word to draw |
| `game_event` | `GameEvent` | Drawing, chat, reactions |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `room_joined` | `{ roomId, playerId }` | Confirmation of room join |
| `error_message` | `string` | Error notification |
| `game_event` | `GameEvent` | Broadcast game events |

### Game Event Types

```typescript
type GameEventType = 
  | 'DRAW'           // Drawing data
  | 'CLEAR_CANVAS'   // Clear the canvas
  | 'CHAT_MESSAGE'   // Chat/guess message
  | 'EMOJI_REACTION' // Floating emoji
  | 'SYNC_STATE'     // Game state sync
  | 'SYNC_PLAYERS'   // Player list sync
  | 'SYNC_SETTINGS'  // Settings sync
  | 'SYNC_GALLERY'   // Gallery sync
```

---

## Deployment Guide

### Frontend Deployment (Netlify)

1. **Connect Repository**
   - Log in to Netlify
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Environment Variables**
   - Add `VITE_SERVER_URL` if using custom server URL

4. **Auto Deploy**
   - Pushes to `main` branch trigger automatic deploys

### Backend Deployment (Render)

1. **Create Web Service**
   - Log in to Render
   - New → Web Service
   - Connect GitHub repository

2. **Settings**
   ```
   Name: sketchlink-server
   Environment: Node
   Build Command: npm install
   Start Command: node server.js
   ```

3. **Environment Variables**
   ```
   PORT=3001
   NODE_ENV=production
   ```

4. **Important Notes**
   - Free tier sleeps after 15 min inactivity
   - First request after sleep takes ~30s
   - App includes auto-wake feature


## Troubleshooting

### Common Issues

#### "Could not connect to server"
- **Cause**: Server is sleeping (Render free tier)
- **Solution**: Wait 30 seconds for server to wake up, retry

#### "Room not found"
- **Cause**: Room expired or invalid code
- **Solution**: Create a new room, share the new code

#### Mobile connection issues
- **Cause**: WebSocket blocked or network issues
- **Solution**: App uses polling fallback, try refreshing

#### Drawing not syncing
- **Cause**: Socket disconnected
- **Solution**: Check network, refresh page


### Debug Mode

Open browser console to see:
- Socket connection status
- Game event logs
- Error messages

### Server Logs (Render)

1. Go to Render Dashboard
2. Select your service
3. Click "Logs" tab
4. Filter by time or search

---

## Performance Considerations

### Optimizations Implemented

1. **Debounced Drawing**: Batches draw events to reduce network traffic
2. **Polling Fallback**: Uses HTTP polling if WebSocket fails
3. **Lazy Loading**: Components load on demand
4. **SVG Favicon**: Smaller than PNG alternatives

### Future Optimizations

- [ ] Add Redis for multi-instance support
- [ ] Implement drawing compression
- [ ] Add CDN for static assets
- [ ] WebSocket binary protocol

---

## Security Notes

⚠️ **For Production Use:**

1. **CORS**: Currently allows all origins (`*`). Restrict in production:
   ```javascript
   cors: {
     origin: ["https://your-domain.netlify.app"],
     methods: ["GET", "POST"]
   }
   ```

2. **Rate Limiting**: Add rate limiting to prevent abuse

3. **Input Validation**: Validate all user inputs on server

4. **Room Cleanup**: Implement automatic room expiration

---

## Contributing

See [README.md](./README.md) for contribution guidelines.

---

*Last updated: December 2024*
