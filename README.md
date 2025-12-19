# SketchLink

Multiplayer drawing game. Draw, guess, have fun with friends.

**[Play Now →](https://sketchlink.netlify.app)**

## What is this?

A real-time Skribbl-style game where players take turns drawing while others guess. Built with React + Socket.io.

## Run Locally

```bash
npm install
npm run dev          # Frontend at localhost:5173
node server.js       # Backend at localhost:3001
```

## Environment Variables

Create `.env` file (see `.env.example`):

```env
VITE_SERVER_URL=https://your-server.onrender.com
```

## Deploy

- **Frontend**: Push to GitHub → auto-deploys to Netlify/Vercel
- **Backend**: Push to GitHub → auto-deploys to Render

See [documentation.md](./documentation.md) for setup details.

## Tech

React, TypeScript, Vite, Tailwind, Socket.io, Node.js

## Author

**Aayush Acharya** - [@acharya-aayush](https://github.com/acharya-aayush)
