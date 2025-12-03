import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

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
    origin: "*", // Allow connections from anywhere (for now)
    methods: ["GET", "POST"]
  }
});

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
  }

  addPlayer(player) {
    this.players.push(player);
  }

  removePlayer(socketId) {
    const index = this.players.findIndex(p => p.socketId === socketId);
    if (index !== -1) {
      const wasHost = this.players[index].isHost;
      const wasDrawer = this.players[index].isDrawer;
      this.players.splice(index, 1);

      // Migrate Host
      if (wasHost && this.players.length > 0) {
        this.players[0].isHost = true;
      }
      
      // Handle Drawer Disconnect
      if (wasDrawer && this.players.length > 0 && this.phase !== 'LOBBY') {
         this.endRound(); // End round immediately if drawer leaves
      }
    }
  }

  broadcast(event, payload) {
    io.to(this.id).emit('game_event', { type: event, payload });
  }

  broadcastState() {
    this.broadcast('SYNC_STATE', {
        phase: this.phase,
        currentWord: this.currentWord, // Client hides this if not drawer
        maskedWord: this.getMaskedWord(),
        timeLeft: this.timeLeft,
        drawerId: this.players[this.currentDrawerIndex]?.id
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
      const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
      const room = new GameRoom(roomId);
      
      const player = {
          id: socket.id,
          socketId: socket.id,
          name,
          avatar,
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
      const room = rooms.get(roomId);
      if (!room) {
          socket.emit('error_message', 'Room not found');
          return;
      }

      const player = {
          id: socket.id,
          socketId: socket.id,
          name,
          avatar,
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
      
      if (room.gallery.length > 0) {
          socket.emit('game_event', { type: 'SYNC_GALLERY', payload: room.gallery });
      }
  });

  socket.on('update_settings', (settings) => {
      const room = rooms.get(currentRoomId);
      if (room) {
          room.settings = { ...room.settings, ...settings };
          room.broadcast('SYNC_SETTINGS', room.settings);
      }
  });

  socket.on('start_game', () => {
      const room = rooms.get(currentRoomId);
      if (room) room.startGame();
  });

  socket.on('get_words', (callback) => {
      const room = rooms.get(currentRoomId);
      if (room) callback(room.getWordOptions());
  });

  socket.on('select_word', (word) => {
      const room = rooms.get(currentRoomId);
      if (room) room.selectWord(word);
  });

  // Relay Drawing Events
  socket.on('game_event', (event) => {
      const room = rooms.get(currentRoomId);
      if (!room) return;

      // Handle Special Events that affect State
      if (event.type === 'CHAT_MESSAGE') {
          const msg = event.payload;
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
      if (currentRoomId) {
          const room = rooms.get(currentRoomId);
          if (room) {
              room.removePlayer(socket.id);
              if (room.players.length === 0) {
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
