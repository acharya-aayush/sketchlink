import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();

// Allowed origins for CORS - includes Vercel preview URLs
const ALLOWED_ORIGINS = [
  'https://sketchlinks.vercel.app',
  'https://sketchlink.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

// Function to check if origin is allowed (includes Vercel preview deployments)
function isOriginAllowed(origin) {
  if (!origin) return true; // Allow requests with no origin (mobile apps, curl, etc.)
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow all Vercel preview deployments (*.vercel.app)
  if (origin.endsWith('.vercel.app')) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
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
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
    // Basic Objects
    'Apple', 'Sun', 'House', 'Tree', 'Car', 'Book', 'Chair', 'Fish', 'Bird', 'Moon',
    'Ball', 'Smile', 'Cloud', 'Star', 'Cat', 'Dog', 'Hat', 'Eye', 'Mouth', 'Door',
    'Pizza Slice', 'Donut', 'Cactus', 'Sunglasses', 'Ghost', 'Taco', 'Sword', 'Snail',
    'Tooth', 'Mountains', 'Popsicle', 'Lightbulb', 'Stick Man', 'Envelope', 'Snake',
    'Coffee Mug', 'Butterfly', 'Key', 'Balloon', 'Umbrella', 'Cupcake', 'Rainbow',
    'Mushroom', 'Candle', 'Snowman', 'Heart', 'Flower', 'Banana', 'Ladybug', 'Bee'
  ],
  Medium: [
    // Food & Objects
    'Campfire', 'Scuba Diver', 'Skateboard', 'Broken Heart', 'Stinky Sock', 'Ice Cube',
    'Sandwich', 'Bathtub', 'Jellyfish', 'Flying Saucer', 'Treasure Map', 'Brain Freeze',
    'Melting Snowman', 'Angry Cloud', 'Hammer', 'Spider Web', 'Baguette', 'Rocket Ship',
    'Windmill', 'Popcorn', 'Ninja', 'Pirate Ship', 'Wizard Hat', 'Magic Wand',
    'Headphones', 'Microphone', 'Bowling Pin', 'Anchor', 'Compass', 'Treasure Chest',
    // Pop Culture - Easy References
    'Lightsaber', 'Pokeball', 'Mario Mushroom', 'Minecraft Creeper', 'Among Us',
    'Baby Yoda', 'Pikachu', 'SpongeBob', 'Patrick Star', 'Shrek', 'Minion',
    'Bart Simpson', 'Homer Simpson', 'Mickey Mouse', 'Sonic', 'Pac-Man',
    'Thor Hammer', 'Captain America Shield', 'Batman Logo', 'Superman Logo'
  ],
  Hard: [
    // Challenging Objects
    'Roller Coaster', 'Time Machine', 'Electric Guitar', 'Haunted House', 'Solar System',
    'Underwater Party', 'Invisible Man', 'Rainy Day', 'Dragon Fire', 'Construction Site',
    'Eiffel Tower', 'Limousine', 'Diving Board', 'Backpack', 'Firetruck',
    'Statue of Liberty', 'Microscope', 'Trombone', 'Video Game Controller',
    // Dinosaurs & Creatures
    'Tyrannosaurus Rex', 'Velociraptor', 'Pterodactyl', 'Triceratops', 'Stegosaurus',
    'Kraken', 'Werewolf', 'Medusa', 'Centaur', 'Phoenix', 'Griffin',
    // Pop Culture - Harder References  
    'Thanos Snap', 'Infinity Gauntlet', 'Death Star', 'Millennium Falcon', 'TARDIS',
    'Iron Man Suit', 'Straw Hat Luffy', 'Kamehameha', 'Naruto Running',
    'One Punch Man', 'Attack on Titan', 'Demon Slayer Sword', 'Jujutsu Kaisen',
    'Walter White', 'The Mandalorian', 'Squid Game Guard', 'Wednesday Addams',
    // Medical/Scientific (Challenging)
    'Stethoscope', 'DNA Helix', 'Atom Model', 'Black Hole', 'Space Station',
    'Brain Surgery', 'X-Ray Skeleton', 'Chemical Reaction', 'Telescope',
    // Abstract/Actions
    'Monday Morning', 'Awkward Silence', 'Deja Vu', 'Plot Twist', 'Cliffhanger',
    'Photobomb', 'Selfie Stick', 'Binge Watching', 'Brain Fart', 'Food Coma',
    // Sports References
    'Ronaldo Celebration', 'Messi Dribbling', 'LeBron Dunk', 'Tiger Woods Swing',
    'Olympic Rings', 'World Cup Trophy', 'Slam Dunk', 'Hole in One'
  ]
};

// --- Room State Management ---
const rooms = new Map();
const pendingRoomDeletions = new Map(); // roomId -> timeoutId (for 2-minute grace period)

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
    
    // Track which players have guessed correctly this round
    this.playersGuessed = new Set();
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
      const playerId = this.players[index].id;
      
      // Remove from guessed set if they guessed
      this.playersGuessed.delete(playerId);
      
      this.players.splice(index, 1);

      // Migrate Host to next available player
      if (wasHost && this.players.length > 0) {
        this.players[0].isHost = true;
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
      
      // If no players left, clean up timers
      if (this.players.length === 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.nextTurnTimeout) clearTimeout(this.nextTurnTimeout);
        return;
      }
      
      // If only 1 player left during active game, go back to lobby
      if (this.players.length === 1 && this.phase !== 'LOBBY' && this.phase !== 'GAME_OVER') {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.nextTurnTimeout) clearTimeout(this.nextTurnTimeout);
        this.phase = 'LOBBY';
        this.players[0].isDrawer = false;
        this.currentWord = '';
        this.broadcast('CHAT_MESSAGE', {
          id: Date.now().toString(),
          sender: 'System',
          text: `Not enough players. Returning to lobby.`,
          isSystem: true,
          timestamp: Date.now()
        });
        this.broadcastState();
        this.broadcast('SYNC_PLAYERS', this.players);
        return;
      }
      
      // Handle Drawer/Word-Selector Disconnect
      if (wasDrawer && this.phase !== 'LOBBY' && this.phase !== 'GAME_OVER') {
        // Clear timers
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.nextTurnTimeout) clearTimeout(this.nextTurnTimeout);
        
        // Adjust currentDrawerIndex if needed
        if (this.currentDrawerIndex >= this.players.length) {
          this.currentDrawerIndex = this.players.length - 1;
        }
        // If the removed player was before current index, adjust
        if (index < this.currentDrawerIndex) {
          this.currentDrawerIndex--;
        }
        
        this.currentDrawing = []; // Clear drawing state
        
        // Notify and skip to next turn
        this.broadcast('CHAT_MESSAGE', {
          id: Date.now().toString(),
          sender: 'System',
          text: `Drawer left! Skipping to next turn...`,
          isSystem: true,
          timestamp: Date.now()
        });
        
        // Clear canvas for everyone
        this.broadcast('CLEAR_CANVAS');
        
        // Move to next turn after short delay
        this.nextTurnTimeout = setTimeout(() => this.nextTurn(), 2000);
      } else {
        // Non-drawer left - check if all remaining players have guessed
        if (this.phase === 'DRAWING') {
          const nonDrawerPlayers = this.players.filter(p => !p.isDrawer);
          if (nonDrawerPlayers.length > 0 && this.playersGuessed.size >= nonDrawerPlayers.length) {
            this.endRound('Everyone');
          }
        }
      }
      
      this.broadcast('SYNC_PLAYERS', this.players);
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
    this.playersGuessed.clear(); // Reset guessed players for new round
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
    
    // Generate appropriate message
    let text;
    if (winnerName === 'Everyone') {
      text = `Everyone guessed the word! 🎉`;
    } else if (winnerName) {
      text = `${winnerName} guessed the word!`;
    } else {
      const guessedCount = this.playersGuessed.size;
      const totalGuessers = this.players.filter(p => !p.isDrawer).length;
      text = `Time's up! ${guessedCount}/${totalGuessers} guessed. The word was "${this.currentWord}"`;
    }
    
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
  // Always includes at least 1 Hard word for variety
  getWordOptions() {
      const difficulty = this.settings.difficulty || 'Medium';
      let mainLibrary = [...WORD_LIBRARY[difficulty] || WORD_LIBRARY.Medium];
      let hardLibrary = [...WORD_LIBRARY.Hard];
      
      // Add custom words if provided
      if (this.settings.customWords) {
          const custom = this.settings.customWords.split(',').map(w => w.trim()).filter(w => w);
          mainLibrary = [...custom, ...mainLibrary];
      }
      
      // Shuffle both libraries
      mainLibrary.sort(() => 0.5 - Math.random());
      hardLibrary.sort(() => 0.5 - Math.random());
      
      // Get 2 words from main difficulty
      const mainWords = mainLibrary.slice(0, 2);
      
      // Always include 1 Hard word (if not already on Hard difficulty)
      let hardWord = null;
      if (difficulty !== 'Hard') {
          // Find a hard word that's not in mainWords
          hardWord = hardLibrary.find(w => !mainWords.includes(w));
      } else {
          // On Hard mode, just get 3 hard words
          return mainLibrary.slice(0, 3);
      }
      
      // Combine and shuffle final options
      const options = hardWord ? [...mainWords, hardWord] : mainLibrary.slice(0, 3);
      return options.sort(() => 0.5 - Math.random());
  }
}

// --- Socket Handlers ---

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  let currentRoomId = null;

  socket.on('create_room', ({ name, avatar, customAvatar }) => {
      // SECURITY: Validate player name
      if (!validatePlayerName(name)) {
        socket.emit('error_message', 'Invalid name. Use 1-20 alphanumeric characters.');
        return;
      }
      
      const sanitizedName = sanitizeString(name.trim(), 20);
      const sanitizedAvatar = sanitizeString(avatar, 10);
      // Custom avatar is a base64 data URL - validate it loosely
      const sanitizedCustomAvatar = customAvatar && typeof customAvatar === 'string' && customAvatar.startsWith('data:image/') 
        ? customAvatar.slice(0, 50000) // Limit to ~50KB
        : null;
      
      const roomId = Math.random().toString(36).substr(2, 8).toUpperCase(); // 8 chars for better security
      const room = new GameRoom(roomId);
      
      const player = {
          id: socket.id,
          socketId: socket.id,
          name: sanitizedName,
          avatar: sanitizedAvatar,
          customAvatar: sanitizedCustomAvatar,
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

  socket.on('join_room', ({ roomId, name, avatar, customAvatar }) => {
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
      
      // Cancel pending deletion if someone is rejoining an empty room
      if (pendingRoomDeletions.has(roomId)) {
          clearTimeout(pendingRoomDeletions.get(roomId));
          pendingRoomDeletions.delete(roomId);
          console.log(`Room ${roomId} deletion cancelled - player rejoining!`);
      }
      
      // SECURITY: Limit players per room
      if (room.players.length >= 12) {
          socket.emit('error_message', 'Room is full (max 12 players)');
          return;
      }

      const sanitizedName = sanitizeString(name.trim(), 20);
      const sanitizedAvatar = sanitizeString(avatar, 10);
      // Custom avatar is a base64 data URL - validate it loosely
      const sanitizedCustomAvatar = customAvatar && typeof customAvatar === 'string' && customAvatar.startsWith('data:image/') 
        ? customAvatar.slice(0, 50000) // Limit to ~50KB
        : null;

      const player = {
          id: socket.id,
          socketId: socket.id,
          name: sanitizedName,
          avatar: sanitizedAvatar,
          customAvatar: sanitizedCustomAvatar,
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
                 // Check if player already guessed
                 if (room.playersGuessed.has(player.id)) {
                     return; // Already guessed, ignore
                 }
                 
                 // Correct Guess!
                 room.playersGuessed.add(player.id);
                 
                 // Calculate score (earlier guesses = more points)
                 const guessOrder = room.playersGuessed.size;
                 const basePoints = 100 + Math.floor(room.timeLeft * 2);
                 const orderBonus = Math.max(0, 50 - (guessOrder - 1) * 10); // First guesser gets +50, decreases
                 player.score += basePoints + orderBonus;
                 
                 const drawer = room.players[room.currentDrawerIndex];
                 if (drawer) drawer.score += 25; // Drawer gets points for each correct guess

                 // Mark message as correct and hide the actual word
                 msg.isCorrect = true;
                 msg.text = `${player.name} guessed the word! 🎉`;
                 room.broadcast('CHAT_MESSAGE', msg);
                 room.broadcastState(); // Sync scores
                 
                 // Check if all non-drawer players have guessed
                 const nonDrawerPlayers = room.players.filter(p => !p.isDrawer);
                 if (room.playersGuessed.size >= nonDrawerPlayers.length) {
                     // Everyone guessed! End round
                     room.endRound('Everyone');
                 }
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
      
      // Update Settings (host only, during LOBBY or GAME_OVER)
      if (event.type === 'UPDATE_SETTINGS') {
          const player = room.players.find(p => p.id === socket.id);
          if (player && player.isHost && (room.phase === 'LOBBY' || room.phase === 'GAME_OVER')) {
              const newSettings = event.payload;
              // Validate settings
              if (newSettings.rounds) room.settings.rounds = Math.min(10, Math.max(1, parseInt(newSettings.rounds) || 3));
              if (newSettings.drawTime) room.settings.drawTime = Math.min(180, Math.max(15, parseInt(newSettings.drawTime) || 60));
              if (newSettings.difficulty) room.settings.difficulty = ['Easy', 'Medium', 'Hard'].includes(newSettings.difficulty) ? newSettings.difficulty : 'Medium';
              if (typeof newSettings.customWords === 'string') room.settings.customWords = sanitizeString(newSettings.customWords, 500);
              
              room.broadcast('SYNC_SETTINGS', room.settings);
          }
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
                  // Clean up timers before scheduling deletion
                  if (room.timerInterval) clearInterval(room.timerInterval);
                  if (room.nextTurnTimeout) clearTimeout(room.nextTurnTimeout);
                  
                  // 2-minute grace period instead of immediate deletion
                  // This allows players to rejoin if they accidentally refreshed
                  console.log(`Room ${currentRoomId} is empty. Starting 2-minute grace period...`);
                  
                  const deletionTimeout = setTimeout(() => {
                      // Double-check room is still empty
                      const roomCheck = rooms.get(currentRoomId);
                      if (roomCheck && roomCheck.players.length === 0) {
                          rooms.delete(currentRoomId);
                          console.log(`Room ${currentRoomId} deleted after grace period.`);
                      }
                      pendingRoomDeletions.delete(currentRoomId);
                  }, 120000); // 2 minutes = 120,000ms
                  
                  pendingRoomDeletions.set(currentRoomId, deletionTimeout);
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
