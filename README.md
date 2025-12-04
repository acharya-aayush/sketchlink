# SketchLink

A real-time multiplayer drawing and guessing game built with React, Socket.io, and Node.js. Play with friends, draw creative sketches, and guess what others are drawing!

![SketchLink](https://img.shields.io/badge/SketchLink-Play%20Now-6366f1?style=for-the-badge)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)
![Socket.io](https://img.shields.io/badge/Socket.io-4.x-010101?style=flat-square&logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)

## Features

- 🎮 **Real-time Multiplayer** - Play with friends in the same room
- 🖌️ **Drawing Canvas** - Smooth drawing experience with multiple colors and brush sizes
- 💬 **Live Chat** - Chat and guess while others draw
- 🏆 **Scoring System** - Earn points for correct guesses and good drawings
- 📱 **Mobile Friendly** - Works on desktop and mobile browsers
- 🎨 **Custom Avatars** - Choose fun avatars for your player
- ⚙️ **Game Settings** - Customize rounds, draw time, and difficulty
- 🖼️ **Gallery** - View saved drawings from completed rounds
- 😄 **Emoji Reactions** - React to drawings with floating emojis

## How to Play

1. **Create or Join a Room** - Enter your name and create a new room or join with a room code
2. **Wait for Players** - Share the room code with friends
3. **Start the Game** - Host starts the game when everyone's ready
4. **Draw & Guess** - Take turns drawing words while others guess
5. **Score Points** - Faster guesses = more points!

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/acharya-aayush/sketchlink.git
cd sketchlink

# Install dependencies
npm install

# Start the development server
npm run dev

# In a separate terminal, start the game server
node server.js
```

### Environment Setup

Copy the example environment file:
```bash
cp .env.example .env
```

See [documentation.md](./documentation.md) for detailed configuration options.

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Real-time | Socket.io |
| Hosting | Netlify (Frontend), Render (Backend) |

## Project Structure

```
SketchLink/
├── components/          # React components
│   ├── CanvasBoard.tsx  # Drawing canvas
│   ├── ChatSidebar.tsx  # Chat & guessing
│   ├── LobbyScreen.tsx  # Room management
│   ├── PlayerList.tsx   # Player display
│   └── ...
├── services/
│   ├── multiplayer.ts   # Socket.io client
│   └── audio.ts         # Sound effects
├── server.js            # Game server
├── App.tsx              # Main app component
├── types.ts             # TypeScript types
└── constants.ts         # Game constants
```

## Game Modes & Settings

| Setting | Options | Default |
|---------|---------|---------|
| Rounds | 1-10 | 3 |
| Draw Time | 30-180 seconds | 60s |
| Difficulty | Easy, Medium, Hard | Medium |
| Custom Words | Comma-separated list | - |

## Deployment

### Frontend (Netlify)
The frontend auto-deploys from GitHub to Netlify.

### Backend (Render)
The game server runs on Render's free tier.

> **Note**: Free tier servers may sleep after 15 minutes of inactivity. The app includes an auto-wake feature.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author
**Aayush Acharya**
- GitHub: [@acharya-aayush](https://github.com/acharya-aayush)
-Linkedin: [acharyaaayush](https://linkedin.com/in/acharyaaayush)

## Acknowledgments
- Inspired by Skribbl.io and similar drawing games

---

<p align="center">
  <b>🎨 Draw, Guess, Have Fun! 🎮</b>
</p>
