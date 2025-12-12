import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://sketchlinks.vercel.app',
  'https://sketchlink.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.) in dev
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.send('SketchLink Server is running! 🎨');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', rooms: rooms.size });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"]
  }
});

// --- Security: Rate Limiting ---
const rateLimitMap = new Map(); // socketId -> { count, lastReset }
const RATE_LIMIT = 100; // max events per second (drawing needs high limit)
const RATE_WINDOW = 1000; // 1 second window

function checkRateLimit(socketId) {
  const now = Date.now();
  let entry = rateLimitMap.get(socketId);
  
  if (!entry || now - entry.lastReset > RATE_WINDOW) {
    entry = { count: 0, lastReset: now };
    rateLimitMap.set(socketId, entry);
  }
  
  entry.count++;
  return entry.count <= RATE_LIMIT;
}

// --- Security: Input Sanitization ---
function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str
    .slice(0, maxLength)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function validatePlayerName(name) {
  if (typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 1 || trimmed.length > 20) return false;
  // Allow most characters but block obvious XSS patterns
  // The sanitizeString function will escape HTML entities anyway
  if (/<|>|script|javascript:/i.test(trimmed)) return false;
  return true;
}

// --- Game Constants (Moved from Frontend) ---
const WORD_LIBRARY = {
  Easy: [
    'Apple', 'Sun', 'House', 'Tree', 'Car', 'Book', 'Chair', 'Fish', 'Bird', 'Moon',
    'Ball', 'Smile', 'Cloud', 'Star', 'Cat', 'Dog', 'Hat', 'Eye', 'Mouth', 'Door'
  ],
  Medium: [
    'Pizza', 'Ice Cream', 'Boat', 'Plane', 'Clock', 'Phone', 'Computer', 'Guitar',
    'Robot', 'Alien', 'Ghost', 'Spider', 'Turtle', 'Rabbit', 'Duck', 'Horse', 
    'Camera', 'Watch', 'Lamp', 'Shoes'
  ],
  Hard: [
    'Astronaut', 'Playground', 'Waterfall', 'Hurricane', 'Hospital', 'Library',
    'Dragon', 'Unicorn', 'Dinosaur', 'Pyramid', 'Sphinx', 'Volcano', 'Tornado',
    'Cactus', 'Kangaroo', 'Octopus', 'Penguin', 'Giraffe', 'Zebra', 'Elephant'
  ]
};

// --- Room State Management ---
const rooms = new Map();

class GameRoom {
  constructor(roomId, hostId) {
    this.id = roomId;
    this.players = []; // { id, name, avatar, score, isHost, isDrawer, socketId }
    this.settings = {
        rounds: 3,
        drawTime: 60,
        difficulty: 'Medium',
        customWords: ''
    };
    this.phase = 'LOBBY';
    this.currentRound = 1;
    this.currentWord = '';
    this.timeLeft = 0;
    this.revealedIndices = new Set();
    this.gallery = [];
    this.timerInterval = null;
    this.nextTurnTimeout = null;
    this.currentDrawerIndex = 0;
    
    // Store current drawing for late joiners
    this.currentDrawing = []; // Array of draw events (strokes, fills, clears)
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      const wasHost = this.players[index].isHost;
      const wasDrawer = this.players[index].isDrawer;
      const playerName = this.players[index].name;
      this.players.splice(index, 1);

      // Migrate Host to next available player
      if (wasHost && this.players.length > 0) {
        this.players[0].isHost = true;
        // Notify room about host change
        this.broadcast('CHAT_MESSAGE', {
          id: Date.now().toString(),
          sender: 'System',
          text: `${this.players[0].name} is now the host`,
          isSystem: true,
          timestamp: Date.now()
        });
        console.log(`Host migrated to ${this.players[0].name} in room ${this.id}`);
      }
      
      // Notify about player leaving
      if (this.players.length > 0) {
        this.broadcast('CHAT_MESSAGE', {
          id: Date.now().toString(),
          sender: 'System',
          text: `${playerName} left the game`,
          isSystem: true,
          timestamp: Date.now()
        });
      }
      
      // Handle Drawer Disconnect - adjust drawer index
      if (wasDrawer && this.players.length > 0 && this.phase !== 'LOBBY') {
        // Adjust currentDrawerIndex if needed
        if (this.currentDrawerIndex >= this.players.length) {
          this.currentDrawerIndex = 0;
        }
        this.currentDrawing = []; // Clear drawing state
        this.endRound(); // End round immediately if drawer leaves
      }
    }
  }

  broadcast(event, payload) {
    io.to(this.id).emit('game_event', { type: event, payload });
  }

  broadcastState() {
    const drawer = this.players[this.currentDrawerIndex];
    const baseState = {
        phase: this.phase,
        maskedWord: this.getMaskedWord(),
        timeLeft: this.timeLeft,
        drawerId: drawer?.id
    };
    
    // Send to each player individually - drawer gets the word, others don't
    this.players.forEach(player => {
      const socket = io.sockets.sockets.get(player.socketId);
      if (socket) {
        socket.emit('game_event', {
          type: 'SYNC_STATE',
          payload: {
            ...baseState,
            // SECURITY: Only send currentWord to the drawer
            currentWord: (player.id === drawer?.id) ? this.currentWord : ''
          }
        });
      }
    });
    
    this.broadcast('SYNC_PLAYERS', this.players);
  }

  getMaskedWord() {
      if (!this.currentWord) return '';
      return this.currentWord.split('').map((char, index) => {
          if (char === ' ') return ' ';
          if (this.revealedIndices.has(index)) return char;
          return '_';
      }).join('');
  }

  startGame() {
    this.phase = 'WORD_SELECT';
    this.currentRound = 1;
    this.gallery = [];
    this.currentDrawerIndex = 0;
    
    // Reset Scores
    this.players.forEach(p => { p.score = 0; p.isDrawer = false; });
    this.players[0].isDrawer = true;

    this.broadcastState();
  }

  selectWord(word) {
    this.currentWord = word;
    this.revealedIndices.clear();
    this.phase = 'DRAWING';
    this.timeLeft = this.settings.drawTime;
    this.currentDrawing = []; // Clear drawing state for new round
    
    this.broadcast('CLEAR_CANVAS');
    this.broadcastState();
    this.startTimer();
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    const hintTime1 = Math.floor(this.settings.drawTime * 0.5);
    const hintTime2 = Math.floor(this.settings.drawTime * 0.25);

    this.timerInterval = setInterval(() => {
        this.timeLeft--;
        
        // Hints
        if (this.timeLeft === hintTime1 || this.timeLeft === hintTime2) {
            this.revealRandomHint();
        }

        if (this.timeLeft <= 0) {
            this.endRound();
        } else {
            this.broadcast('SYNC_STATE', { timeLeft: this.timeLeft });
        }
    }, 1000);
  }

  revealRandomHint() {
      if (!this.currentWord) return;
      const unrevealed = [];
      for (let i = 0; i < this.currentWord.length; i++) {
          if (this.currentWord[i] !== ' ' && !this.revealedIndices.has(i)) {
              unrevealed.push(i);
          }
      }
      if (unrevealed.length > 0) {
          const idx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
          this.revealedIndices.add(idx);
          this.broadcastState();
      }
  }

  endRound(winnerName) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    
    this.phase = 'ROUND_OVER';
    this.timeLeft = 0;
    
    const text = winnerName ? `${winnerName} guessed the word!` : `Time's up! The word was ${this.currentWord}`;
    
    this.broadcast('CHAT_MESSAGE', {
        id: Date.now().toString(),
        sender: 'System',
        text: text,
        isSystem: true,
        timestamp: Date.now()
    });

    this.broadcastState();

    if (this.nextTurnTimeout) clearTimeout(this.nextTurnTimeout);
    this.nextTurnTimeout = setTimeout(() => this.nextTurn(), 5000);
  }

  nextTurn() {
      if (this.players.length === 0) return;

      const isLastPlayer = this.currentDrawerIndex >= this.players.length - 1;
      
      if (isLastPlayer) {
          if (this.currentRound >= this.settings.rounds) {
              this.phase = 'GAME_OVER';
              this.broadcastState();
              return;
          }
          this.currentRound++;
      }

      this.players[this.currentDrawerIndex].isDrawer = false;
      this.currentDrawerIndex = (this.currentDrawerIndex + 1) % this.players.length;
      this.players[this.currentDrawerIndex].isDrawer = true;

      this.phase = 'WORD_SELECT';
      this.currentWord = '';
      this.revealedIndices.clear();
      this.currentDrawing = []; // Clear drawing state for next turn
      
      this.broadcast('CLEAR_CANVAS');
      this.broadcastState();
  }

  // --- Helper: Word Generation ---
  getWordOptions() {
      let library = [...WORD_LIBRARY[this.settings.difficulty] || WORD_LIBRARY.Medium];
      if (this.settings.customWords) {
          const custom = this.settings.customWords.split(',').map(w => w.trim()).filter(w => w);
          library = [...custom, ...library];
      }
      return library.sort(() => 0.5 - Math.random()).slice(0, 3);
  }
}

// --- Socket Handlers ---

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentRoomId = null;

  socket.on('create_room', ({ name, avatar }) => {
      // SECURITY: Validate player name
      if (!validatePlayerName(name)) {
        socket.emit('error_message', 'Invalid name. Use 1-20 alphanumeric characters.');
        return;
      }
      
      const sanitizedName = sanitizeString(name.trim(), 20);
      const sanitizedAvatar = sanitizeString(avatar, 10);
      
      const roomId = Math.random().toString(36).substr(2, 8).toUpperCase(); // 8 chars for better security
      const room = new GameRoom(roomId);
      
      const player = {
          id: socket.id,
          socketId: socket.id,
          name: sanitizedName,
          avatar: sanitizedAvatar,
          score: 0,
          isHost: true, // First player is host
          isDrawer: true
      };
      
      room.addPlayer(player);
      rooms.set(roomId, room);
      currentRoomId = roomId;
      
      socket.join(roomId);
      socket.emit('room_joined', { roomId, playerId: socket.id });
      room.broadcastState();
      room.broadcast('SYNC_SETTINGS', room.settings);
  });

  socket.on('join_room', ({ roomId, name, avatar }) => {
      // SECURITY: Validate player name
      if (!validatePlayerName(name)) {
        socket.emit('error_message', 'Invalid name. Use 1-20 alphanumeric characters.');
        return;
      }
      
      const room = rooms.get(roomId);
      if (!room) {
          socket.emit('error_message', 'Room not found');
          return;
      }
      
      // SECURITY: Limit players per room
      if (room.players.length >= 12) {
          socket.emit('error_message', 'Room is full (max 12 players)');
          return;
      }

      const sanitizedName = sanitizeString(name.trim(), 20);
      const sanitizedAvatar = sanitizeString(avatar, 10);

      const player = {
          id: socket.id,
          socketId: socket.id,
          name: sanitizedName,
          avatar: sanitizedAvatar,
          score: 0,
          isHost: false,
          isDrawer: false
      };

      room.addPlayer(player);
      currentRoomId = roomId;
      
      socket.join(roomId);
      socket.emit('room_joined', { roomId, playerId: socket.id });
      room.broadcastState();
      room.broadcast('SYNC_SETTINGS', room.settings);
      
      // Send gallery to late joiner
      if (room.gallery.length > 0) {
          socket.emit('game_event', { type: 'SYNC_GALLERY', payload: room.gallery });
      }
      
      // Send current drawing state to late joiner (if game in progress)
      if (room.phase === 'DRAWING' && room.currentDrawing.length > 0) {
          console.log(`Sending ${room.currentDrawing.length} drawing events to late joiner ${name}`);
          socket.emit('game_event', { type: 'SYNC_DRAWING', payload: room.currentDrawing });
      }
      
      // Notify room about new player
      room.broadcast('CHAT_MESSAGE', {
        id: Date.now().toString(),
        sender: 'System',
        text: `${name} joined the game`,
        isSystem: true,
        timestamp: Date.now()
      });
  });

  socket.on('update_settings', (settings) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      
      // SECURITY: Only host can update settings
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player?.isHost) {
          socket.emit('error_message', 'Only the host can change settings');
          return;
      }
      
      // SECURITY: Validate settings bounds
      const safeSettings = {
          rounds: Math.min(10, Math.max(1, parseInt(settings.rounds) || 3)),
          drawTime: Math.min(180, Math.max(30, parseInt(settings.drawTime) || 60)),
          difficulty: ['Easy', 'Medium', 'Hard'].includes(settings.difficulty) ? settings.difficulty : 'Medium',
          customWords: sanitizeString(settings.customWords || '', 500)
      };
      
      room.settings = { ...room.settings, ...safeSettings };
      room.broadcast('SYNC_SETTINGS', room.settings);
  });

  socket.on('start_game', () => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      
      // SECURITY: Only host can start game
      const player = room.players.find(p => p.socketId === socket.id);
      if (!player?.isHost) {
          socket.emit('error_message', 'Only the host can start the game');
          return;
      }
      
      // Need at least 2 players to play
      if (room.players.length < 2) {
          socket.emit('error_message', 'Need at least 2 players to start');
          return;
      }
      
      room.startGame();
  });

  socket.on('get_words', (callback) => {
      const room = rooms.get(currentRoomId);
      if (room) {
          const words = room.getWordOptions();
          room.pendingWordOptions = words; // Store for validation
          callback(words);
      }
  });

  socket.on('select_word', (word) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;
      
      // SECURITY: Only current drawer can select word
      const player = room.players.find(p => p.socketId === socket.id);
      const drawer = room.players[room.currentDrawerIndex];
      if (!player || player.id !== drawer?.id) {
          socket.emit('error_message', 'Only the drawer can select a word');
          return;
      }
      
      // SECURITY: Validate word is from the provided options
      // Store word options temporarily when get_words is called
      if (room.pendingWordOptions && !room.pendingWordOptions.includes(word)) {
          socket.emit('error_message', 'Invalid word selection');
          return;
      }
      
      room.selectWord(word);
  });

  // Relay Drawing Events
  socket.on('game_event', (event) => {
      // SECURITY: Rate limiting
      if (!checkRateLimit(socket.id)) {
          socket.emit('error_message', 'Slow down! Too many actions.');
          return;
      }
      
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // Handle Special Events that affect State
      if (event.type === 'CHAT_MESSAGE') {
          const msg = event.payload;
          
          // SECURITY: Sanitize chat message
          if (msg.text) {
              msg.text = sanitizeString(msg.text, 200);
          }
          if (msg.sender) {
              msg.sender = sanitizeString(msg.sender, 20);
          }
          
          if (room.phase === 'DRAWING' && !msg.isSystem) {
             const target = room.currentWord.trim().toLowerCase();
             const guess = msg.text.trim().toLowerCase();
             const player = room.players.find(p => p.id === socket.id);

             if (guess === target && player && !player.isDrawer) {
                 // Correct Guess!
                 // Calculate score
                 const points = 100 + Math.floor(room.timeLeft * 2);
                 player.score += points;
                 
                 const drawer = room.players[room.currentDrawerIndex];
                 if (drawer) drawer.score += 50;

                 // Mark message as correct and hide the actual word
                 msg.isCorrect = true;
                 msg.text = `${player.name} guessed the word! 🎉`;
                 room.broadcast('CHAT_MESSAGE', msg);
                 room.broadcastState(); // Sync scores
                 room.endRound(player.name);
                 return;
             }
             
             // Check close call (Levenshtein) - simplified
             if (target.length > 3 && Math.abs(target.length - guess.length) < 2) {
                 // Just a simple check for example
                 // Real implementation needs Levenshtein function here
             }
          }
      }

      // Add to Gallery
      if (event.type === 'ADD_GALLERY_ITEM') {
          room.gallery.push(event.payload);
          room.broadcast('SYNC_GALLERY', room.gallery);
          return;
      }
      
      // Store drawing events for late joiners (with size limit)
      const MAX_DRAWING_EVENTS = 5000;
      
      if (event.type === 'DRAW_POINT') {
          if (room.currentDrawing.length < MAX_DRAWING_EVENTS) {
              room.currentDrawing.push(event);
          }
      }
      
      // Handle FILL events - store for late joiners
      if (event.type === 'FILL_CANVAS') {
          if (room.currentDrawing.length < MAX_DRAWING_EVENTS) {
              room.currentDrawing.push(event);
          }
      }
      
      // Handle END_STROKE - mark the end of a stroke in history
      if (event.type === 'END_STROKE') {
          if (room.currentDrawing.length < MAX_DRAWING_EVENTS) {
              room.currentDrawing.push(event);
          }
      }
      
      // Handle CLEAR_CANVAS from drawer
      if (event.type === 'CLEAR_CANVAS') {
          room.currentDrawing = []; // Clear stored drawing
      }

      // Default: Broadcast to everyone else in room
      socket.to(currentRoomId).emit('game_event', event);
      
      // If Chat, we also send back to sender so they see their own message
      if (event.type === 'CHAT_MESSAGE') {
          socket.emit('game_event', event);
      }
      
      // If Emoji Reaction, also send back to sender so they can see their own reaction
      if (event.type === 'EMOJI_REACTION') {
          socket.emit('game_event', event);
      }
  });

  socket.on('disconnect', () => {
      // Clean up rate limit entry
      rateLimitMap.delete(socket.id);
      
      if (currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
              room.removePlayer(socket.id);
              if (room.players.length === 0) {
                  // Clean up timers before deleting room
                  if (room.timerInterval) clearInterval(room.timerInterval);
                  if (room.nextTurnTimeout) clearTimeout(room.nextTurnTimeout);
                  rooms.delete(currentRoomId);
              } else {
                  room.broadcastState();
              }
          }
      }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
