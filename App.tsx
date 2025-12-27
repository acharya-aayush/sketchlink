
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GamePhase, ChatMessage, TOOLS, ToolType, COLORS, STROKE_WIDTHS, DrawPoint, GameEvent, FillAction, Player, GameSettings, GalleryItem } from './types';
import { CanvasBoard, CanvasBoardHandle } from './components/CanvasBoard';
import { Button } from './components/Button';
import { multiplayer, wakeUpServer } from './services/multiplayer';
import { AVATARS, FUN_FACTS } from './constants';
import { PlayerList } from './components/PlayerList';
import { ChatSidebar } from './components/ChatSidebar';
import { GameToolbar } from './components/GameToolbar';
import { LobbyScreen } from './components/LobbyScreen';
import { audioService } from './services/audio';
import { Confetti, ConfettiHandle } from './components/Confetti';
import { ReactionOverlay, ReactionOverlayHandle } from './components/ReactionOverlay';
import { Gallery } from './components/Gallery';
import { VictoryPodium, VictoryPodiumHandle } from './components/VictoryPodium';
import { CrumpledPaperCredits } from './components/CrumpledPaperCredits';

const App: React.FC = () => {
  // Track if we're on mobile (state-based for proper re-render)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  
  // Listen for resize to update mobile state
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Multiplayer State
  const [isConnected, setIsConnected] = useState(false);
  
  // Persist User Preferences
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('sketchlink_name') || '');
  const [playerAvatar, setPlayerAvatar] = useState(() => localStorage.getItem('sketchlink_avatar') || AVATARS[0]);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [drawerId, setDrawerId] = useState<string>('');
  const [roomCode, setRoomCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // Host Settings State
  const [lobbyMode, setLobbyMode] = useState<'HOME' | 'HOST' | 'JOIN' | 'LOADING' | 'WAKING_SERVER'>('WAKING_SERVER');
  const [serverReady, setServerReady] = useState(false);
  const [serverStatus, setServerStatus] = useState<'sleeping' | 'waking' | 'ready'>('sleeping');
  const [serverProgress, setServerProgress] = useState(0);
  const [gameSettings, setGameSettings] = useState<GameSettings>({
      rounds: 3,
      drawTime: 60,
      difficulty: 'Medium',
      customWords: ''
  });

  // Custom Avatar State
  const [customAvatar, setCustomAvatar] = useState<string | null>(() => {
    return localStorage.getItem('sketchlink_custom_avatar');
  });

  // Game State
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [currentWord, setCurrentWord] = useState<string>('');
  const [maskedWord, setMaskedWord] = useState<string>(''); // For hints
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  
  // Drawing State
  const canvasRef = useRef<CanvasBoardHandle>(null);
  const [selectedColor, setSelectedColor] = useState<string>(COLORS[0]);
  const [selectedWidth, setSelectedWidth] = useState<number>(STROKE_WIDTHS[1]);
  const [activeTool, setActiveTool] = useState<ToolType>(TOOLS.PENCIL);

  // Juice State
  const confettiRef = useRef<ConfettiHandle>(null);
  const reactionRef = useRef<ReactionOverlayHandle>(null);
  const victoryPodiumRef = useRef<VictoryPodiumHandle>(null);
  const [playerFeedback, setPlayerFeedback] = useState<Record<string, string>>({});
  
  // Cheat code state for "Victorymation"
  const [cheatBuffer, setCheatBuffer] = useState('');
  
  // Fact Runner state (cycles fun facts during loading)
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  
  // Copy Link feedback
  const [linkCopied, setLinkCopied] = useState(false);
  
  // Easter egg states
  const [teaMode, setTeaMode] = useState(false); // TEA -> switches coffee to tea emoji
  const [messiMode, setMessiMode] = useState(false); // MESSI -> gold cursor
  const [gomuClicks, setGomuClicks] = useState(0); // Track rapid clicks for Gomu Gomu stretch
  const [gomuStretch, setGomuStretch] = useState(false);
  
  // Room creation lock
  const [isCreating, setIsCreating] = useState(false);

  // Computed
  const isMe = players.find(p => p.id === multiplayer.playerId);
  const isHost = isMe?.isHost || false;
  const isMyTurn = drawerId === multiplayer.playerId;
  const currentDrawer = players.find(p => p.id === drawerId);
  // Display word logic: If it's my turn OR round over, show real word. Otherwise, show masked/hint word.
  const displayWord = (isMyTurn || phase === GamePhase.ROUND_OVER) ? currentWord : maskedWord;

  // --- Initialization & URL Handling ---
  useEffect(() => {
    // Wake up the server with progress tracking (Render free tier sleeps ~50s)
    const initServer = async () => {
      setServerStatus('waking');
      setServerProgress(0);
      
      // Simulate progress while waiting (Render cold start is ~30-50s)
      let progress = 0;
      const progressInterval = setInterval(() => {
        // Slow down as we get closer to 100
        const increment = progress < 60 ? 3 : progress < 85 ? 1.5 : 0.3;
        progress = Math.min(progress + increment, 95);
        setServerProgress(progress);
      }, 500);
      
      const success = await wakeUpServer();
      clearInterval(progressInterval);
      
      if (success) {
        setServerProgress(100);
        setServerStatus('ready');
        setServerReady(true);
      } else {
        // Even if health check failed, try to proceed (socket.io will retry)
        setServerProgress(100);
        setServerStatus('ready');
        setServerReady(true);
      }
      
      // Check for room code in URL
      const hash = window.location.hash;
      if (hash.startsWith('#room=')) {
        const code = hash.replace('#room=', '');
        setRoomCode(code);
        setLobbyMode('JOIN');
      } else {
        setLobbyMode('HOME');
      }
    };
    
    initServer();
    audioService.init();
  }, []);

  // Fact Runner: Cycle through fun facts every 4 seconds during wake-up
  useEffect(() => {
    if (serverStatus !== 'waking') return;
    
    const factInterval = setInterval(() => {
      setCurrentFactIndex(prev => (prev + 1) % FUN_FACTS.length);
    }, 4000);
    
    return () => clearInterval(factInterval);
  }, [serverStatus]);

  // Easter Egg keyboard listener
  useEffect(() => {
    let keyBuffer = '';
    const handleKeyPress = (e: KeyboardEvent) => {
      keyBuffer += e.key.toUpperCase();
      // Keep only last 10 characters
      if (keyBuffer.length > 10) keyBuffer = keyBuffer.slice(-10);
      
      // TEA easter egg - swap coffee to tea during loading
      if (keyBuffer.includes('TEA') && !teaMode) {
        setTeaMode(true);
        keyBuffer = '';
      }
      
      // MESSI easter egg - gold cursor mode
      if (keyBuffer.includes('MESSI') && !messiMode) {
        setMessiMode(true);
        keyBuffer = '';
      }
    };
    
    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [teaMode, messiMode]);

  useEffect(() => {
    localStorage.setItem('sketchlink_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('sketchlink_avatar', playerAvatar);
  }, [playerAvatar]);

  // Save custom avatar to localStorage
  useEffect(() => {
    if (customAvatar) {
      localStorage.setItem('sketchlink_custom_avatar', customAvatar);
    } else {
      localStorage.removeItem('sketchlink_custom_avatar');
    }
  }, [customAvatar]);

  // --- Network Event Handling ---
  useEffect(() => {
    const unsubscribe = multiplayer.onEvent((event: GameEvent) => {
      // Filter echoes for drawing events
      if (isMyTurn) {
        const echoEvents = ['DRAW', 'DRAW_POINT', 'STROKE_END', 'END_STROKE', 'FILL', 'FILL_CANVAS', 'UNDO_ACTION', 'CLEAR_CANVAS'];
        // @ts-ignore
        if (echoEvents.includes(event.type)) return;
      }

      switch (event.type) {
        case 'SYNC_STATE':
          if (event.payload.phase) {
             const oldPhase = phase;
             setPhase(event.payload.phase);
             // Play win sound on round over
             if (event.payload.phase === GamePhase.ROUND_OVER && oldPhase !== GamePhase.ROUND_OVER) {
                 audioService.playWin();
                 confettiRef.current?.explode();
             }
          }
          if (event.payload.timeLeft !== undefined) {
             setTimeLeft(event.payload.timeLeft);
             if (event.payload.timeLeft <= 10 && event.payload.timeLeft > 0 && phase === GamePhase.DRAWING) {
                 audioService.playTick();
             }
          }
          // IMPORTANT: Server sends full word to drawer, but might send empty to others if implemented strictly
          // Here we trust the server to send the right data to the right socket
          if (event.payload.currentWord) setCurrentWord(event.payload.currentWord);
          if (event.payload.maskedWord !== undefined) setMaskedWord(event.payload.maskedWord);
          if (event.payload.drawerId) setDrawerId(event.payload.drawerId);
          break;
        case 'SYNC_PLAYERS':
          setPlayers(event.payload);
          break;
        case 'SYNC_SETTINGS':
          setGameSettings(event.payload);
          break;
        case 'SYNC_GALLERY':
          setGallery(event.payload);
          break;
        case 'SYNC_DRAWING':
          // Late joiner: replay all drawing events
          console.log('Replaying drawing for late joiner:', event.payload.length, 'events');
          if (event.payload && event.payload.length > 0) {
            event.payload.forEach((drawEvent: GameEvent) => {
              if (drawEvent.type === 'DRAW' || drawEvent.type === 'DRAW_POINT') {
                canvasRef.current?.drawRemotePoint(drawEvent.payload);
              } else if (drawEvent.type === 'STROKE_END' || drawEvent.type === 'END_STROKE') {
                canvasRef.current?.endRemoteStroke();
              } else if (drawEvent.type === 'FILL' || drawEvent.type === 'FILL_CANVAS') {
                canvasRef.current?.fill(drawEvent.payload.x, drawEvent.payload.y, drawEvent.payload.color);
              }
            });
          }
          break;
        case 'DRAW':
        case 'DRAW_POINT':
          canvasRef.current?.drawRemotePoint(event.payload);
          break;
        case 'STROKE_END':
        case 'END_STROKE':
          canvasRef.current?.endRemoteStroke();
          break;
        case 'FILL':
        case 'FILL_CANVAS':
          canvasRef.current?.fill(event.payload.x, event.payload.y, event.payload.color);
          break;
        case 'UNDO_ACTION':
          canvasRef.current?.undo();
          break;
        case 'CLEAR_CANVAS':
          canvasRef.current?.clear();
          break;
        case 'CHAT_MESSAGE':
          setChatMessages(prev => [...prev, event.payload]);
          if (!event.payload.isSystem && !event.payload.isCorrect) {
              audioService.playChat();
          }
          if (event.payload.isCorrect) {
              audioService.playCorrect();
              confettiRef.current?.explode();
              triggerFeedback(event.payload.sender);
          }
          break;
        case 'EMOJI_REACTION':
          reactionRef.current?.addReaction(event.payload.emoji);
          break;
      }
    });
    return unsubscribe;
  }, [isMyTurn, phase]);

  // --- HOST CANVAS CAPTURE ---
  // When phase changes to ROUND_OVER, if I am drawer, capture the canvas
  // Note: Only Drawer captures now, not Host (to avoid lag/latency of host rendering)
  useEffect(() => {
    if (isMyTurn && phase === GamePhase.ROUND_OVER) {
       const dataUrl = canvasRef.current?.getDataURL();
       if (dataUrl && currentWord) {
           const item: GalleryItem = {
               id: Date.now().toString(),
               word: currentWord,
               drawer: playerName,
               drawerAvatar: playerAvatar,
               drawerCustomAvatar: customAvatar || undefined,
               image: dataUrl
           };
           multiplayer.addToGallery(item);
       }
    }
  }, [phase, isMyTurn, currentWord, playerName, playerAvatar, customAvatar]);

  const triggerFeedback = (playerName: string) => {
      const player = players.find(p => p.name === playerName);
      if (player) {
          const msg = "+pts"; // Logic moved to server, so we just show generic happy message or wait for Sync
          setPlayerFeedback(prev => ({ ...prev, [player.id]: msg }));
          setTimeout(() => {
              setPlayerFeedback(prev => {
                  const next = { ...prev };
                  delete next[player.id];
                  return next;
              });
          }, 2000);
      }
  };

  // Cheat code detection effect - triggers victory when buffer matches
  useEffect(() => {
    if (cheatBuffer === 'victorymation') {
      console.log('🎉 Cheat code activated: VICTORYMATION!');
      victoryPodiumRef.current?.showDemo();
      setCheatBuffer(''); // Reset buffer
    }
  }, [cheatBuffer]);

  // Expose cheat commands to browser console
  useEffect(() => {
    // @ts-ignore - Exposing to window for console access
    window.victorymation = () => {
      console.log('🎉 Victory animation triggered from console!');
      victoryPodiumRef.current?.showDemo();
    };
    
    // @ts-ignore
    window.cheats = {
      victorymation: () => {
        console.log('🎉 Victory animation triggered!');
        victoryPodiumRef.current?.showDemo();
      },
      confetti: () => {
        console.log('🎊 Confetti explosion!');
        confettiRef.current?.explode();
      },
      help: () => {
        console.log(`
🎮 SketchLink Cheat Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  victorymation()     - Play victory podium animation
  cheats.victorymation() - Same as above
  cheats.confetti()   - Trigger confetti explosion
  cheats.help()       - Show this help message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
      }
    };
    
    console.log('🎮 SketchLink cheats loaded! Type victorymation() or cheats.help() in console.');
    
    return () => {
      // @ts-ignore
      delete window.victorymation;
      // @ts-ignore
      delete window.cheats;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Undo functionality for drawing
        if (isMyTurn && (e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
            return;
        }
        
        // Cheat code detection: "victorymation" (12 characters)
        // Works everywhere - even when typing in inputs!
        const key = e.key.toLowerCase();
        if (key.length === 1 && /[a-z]/.test(key)) {
            setCheatBuffer(prev => (prev + key).slice(-12));
        }
    };
    
    // Use capture phase to ensure we get the event before inputs consume it
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isMyTurn]);

  // Fetch words when it becomes my turn to select
  useEffect(() => {
      const fetchWords = async () => {
          if (phase === GamePhase.WORD_SELECT && isMyTurn) {
              const words = await multiplayer.getWordOptions();
              setWordOptions(words);
          }
      };
      fetchWords();
  }, [phase, isMyTurn]);

  // --- Actions ---

  const initAudio = () => {
      audioService.init();
      audioService.resume();
  }

  // Just show the host settings form (don't create room yet)
  const handleShowHostSettings = () => {
      setLobbyMode('HOST');
  };

  // Actually create the room after user configures settings
  const handleCreateRoom = async () => {
      if (isCreating) return; // Prevent double-clicks
      initAudio();
      setIsCreating(true);
      setLobbyMode('LOADING');
      try {
        const roomId = await multiplayer.connect(playerName, playerAvatar, undefined, customAvatar);
        setRoomCode(roomId);
        window.location.hash = `room=${roomId}`;
        
        // Push initial settings
        multiplayer.updateSettings(gameSettings);
        
        // Now go to in-game lobby (isConnected=true shows game view with LOBBY phase)
        setIsConnected(true);
      } catch (err) {
          console.error(err);
          setJoinError('Could not connect to server.');
          setLobbyMode('HOME');
      } finally {
          setIsCreating(false);
      }
  };

  const handleStartGame = () => {
      // Send start signal
      multiplayer.startGame();
  };

  const handleJoin = async () => {
    initAudio();
    if (!playerName || !roomCode) return;
    setJoinError('');
    setLobbyMode('LOADING');
    
    try {
        await multiplayer.connect(playerName, playerAvatar, roomCode, customAvatar);
        setIsConnected(true);
    } catch (err) {
        console.error(err);
        setJoinError("Could not connect to room. Check the code.");
        setLobbyMode('JOIN');
    }
  };

  const handleLeave = () => {
    multiplayer.disconnect();
    
    setIsConnected(false);
    setPlayers([]);
    setDrawerId('');
    setRoomCode('');
    setJoinError('');
    setLobbyMode('HOME');
    setGallery([]);
    setPhase(GamePhase.LOBBY);
    setCurrentWord('');
    setMaskedWord('');
    setWordOptions([]);
    setTimeLeft(0);
    setChatMessages([]);
    setInputMessage('');
    
    // Clear URL
    window.history.replaceState(null, '', window.location.pathname);
  };

  const finalHandleWordSelect = (word: string) => {
      multiplayer.selectWord(word);
      setCurrentWord(word);
      canvasRef.current?.clear();
  };

  const handleDrawPoint = (point: DrawPoint) => {
    if (isMyTurn) multiplayer.send({ type: 'DRAW_POINT', payload: point });
  };

  const handleStrokeEnd = () => {
    if (isMyTurn) multiplayer.send({ type: 'END_STROKE' });
  };

  const handleFill = (action: FillAction) => {
    if (isMyTurn) multiplayer.send({ type: 'FILL_CANVAS', payload: action });
  };

  const handleUndo = () => {
    if (isMyTurn) {
      canvasRef.current?.undo();
      multiplayer.send({ type: 'UNDO_ACTION' });
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    // Note: We don't check correctness here anymore. Server does it.
    // We just send the text.
    
    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: playerName,
      senderAvatar: playerAvatar,
      senderCustomAvatar: customAvatar || undefined,
      text: inputMessage,
      isCorrect: false, // Server will validate
      timestamp: Date.now()
    };

    multiplayer.send({ type: 'CHAT_MESSAGE', payload: msg });
    setInputMessage('');
  };

  const handleClearCanvas = () => {
    canvasRef.current?.clear();
    multiplayer.send({ type: 'CLEAR_CANVAS' });
  };

  const handlePlayAgain = () => {
      // Just reset the UI state, keep connection
      setPhase(GamePhase.LOBBY);
      // If host, they can start again
  };

  // --- Renders (Mostly Unchanged) ---
  
  const renderScoreboard = () => (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-2 bg-slate-900/40 backdrop-blur-sm md:p-4 animate-fade-in rounded-xl">
        <div className="bg-white p-4 md:p-8 wobbly-border shadow-2xl border-2 md:border-4 border-slate-300 w-full max-w-lg z-10 animate-bounce-in max-h-[85vh] overflow-y-auto">
            <h2 className="mb-1 text-2xl text-center md:text-4xl font-marker md:mb-2">Round Over!</h2>
            <div className="mb-3 text-base text-center md:mb-6 md:text-xl text-slate-600">
                The word was: <span className="font-bold text-blue-600 uppercase">{currentWord}</span>
            </div>
            
            <div className="mb-4 space-y-2 md:space-y-3 md:mb-8">
                {players.sort((a,b) => b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center p-2 md:p-3 rounded-lg border-2 ${p.id === drawerId ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 md:gap-3">
                            <span className="w-5 text-sm font-bold text-slate-400 md:w-6 md:text-base">#{i+1}</span>
                            {p.customAvatar ? (
                              <img src={p.customAvatar} alt="" className="object-cover w-8 h-8 border-2 rounded-full md:w-10 md:h-10 border-slate-200" />
                            ) : (
                              <span className="text-lg md:text-2xl">{p.avatar}</span>
                            )}
                            <span className="font-handwritten text-base md:text-xl truncate max-w-[100px] md:max-w-none">{p.name} {p.id === drawerId && '✏️'}</span>
                        </div>
                        <span className="text-base font-bold text-green-600 md:text-xl">{p.score}pts</span>
                    </div>
                ))}
            </div>

            <div className="text-sm font-bold text-center text-slate-400 animate-pulse md:text-base">
                Next round starting soon...
            </div>
        </div>
    </div>
  );

  const renderWordSelect = () => {
    if (!isMyTurn) {
      const drawer = players.find(p => p.id === drawerId);
      const drawerName = drawer?.name || 'Unknown';
      const drawerCustomAvatar = drawer?.customAvatar;
      const drawerAvatar = drawer?.avatar || '👤';
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 text-center bg-slate-100/90 backdrop-blur-sm rounded-xl">
           <div className="mb-2 text-2xl md:text-4xl font-marker animate-pulse text-slate-600 md:mb-4">Waiting...</div>
           <p className="flex items-center justify-center gap-2 text-base text-slate-500 md:text-xl">
             {drawerCustomAvatar ? (
               <img src={drawerCustomAvatar} alt="" className="inline-block object-cover w-8 h-8 border-2 rounded-full border-slate-300" />
             ) : (
               <span>{drawerAvatar}</span>
             )}
             {drawerName} is choosing a word.
           </p>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 space-y-4 bg-slate-100/95 backdrop-blur-sm md:space-y-8 rounded-xl">
        <h2 className="text-xl text-center md:text-4xl font-marker text-slate-700">Your Turn! Choose a Word:</h2>
        <div className="grid w-full max-w-sm grid-cols-1 gap-2 md:gap-4">
          {wordOptions.map((word) => (
            <button
              key={word}
              onClick={() => finalHandleWordSelect(word)}
              className="p-3 text-lg transition-all transform bg-white border-2 border-dashed shadow-lg hover:bg-amber-50 md:border-4 border-slate-300 rounded-xl md:p-6 md:text-3xl hover:-translate-y-1 text-slate-800"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Copy room link with feedback
  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, []);

  const renderLobbyWaiting = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-3 bg-slate-50 md:p-4 rounded-xl">
        <div className="w-full max-w-md p-4 text-center bg-white border-2 shadow-lg md:p-8 rounded-xl border-slate-200">
             <div className="mb-2 text-2xl font-marker md:text-3xl text-slate-700">Lobby</div>
             <div className="flex flex-col items-center gap-1 mb-4 text-sm text-slate-500 md:mb-6 md:text-base">
                <span>Room Link:</span>
                <button 
                  onClick={handleCopyLink}
                  className={`max-w-full px-3 py-2 font-mono text-xs font-bold break-all transition-all rounded select-all md:text-sm ${
                    linkCopied 
                      ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                      : 'text-slate-800 bg-slate-100 hover:bg-blue-50 border-2 border-transparent'
                  }`}
                  title="Click to copy link"
                >
                    {linkCopied ? 'Copied!' : roomCode || "Connecting..."}
                </button>
             </div>
             
             {isHost ? (
                 <div className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${players.length >= 2 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {players.length} / 2+ players
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 md:text-base">
                        {players.length >= 2 ? "Ready to start!" : "Waiting for friends to join..."}
                    </p>
                    <Button onClick={handleStartGame} disabled={players.length < 2} className="w-full">
                        {players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
                    </Button>
                    <p className="text-xs text-slate-400">Share the room link with your friends!</p>
                 </div>
             ) : (
                <div className="space-y-3 md:space-y-4">
                    <div className="text-lg font-bold text-blue-500 animate-pulse md:text-xl">Waiting for host to start...</div>
                    <p className="text-sm text-slate-500 md:text-base">Sit tight! The game will begin soon.</p>
                </div>
             )}
        </div>
    </div>
  );

  const renderMobileHeader = () => (
      <div className="z-30 flex items-center justify-between p-2 bg-white border-b shadow-sm md:hidden border-slate-200 shrink-0">
        <div className="flex items-center gap-2">
           <button onClick={handleLeave} className="px-2 py-1 text-xs font-bold text-red-400 transition-transform border border-red-200 rounded active:scale-95">EXIT</button>
        </div>
        <div className="flex flex-col items-center flex-1 mx-2">
             <div className="text-xs tracking-wide uppercase text-slate-400">
                {phase === GamePhase.DRAWING ? 'Guess the word' : phase === GamePhase.WORD_SELECT ? 'Choosing...' : ''}
             </div>
             <div className="text-lg leading-tight tracking-widest font-marker text-slate-900">
                {isMyTurn ? currentWord : (phase === GamePhase.DRAWING ? displayWord : (phase === GamePhase.ROUND_OVER ? currentWord : '...'))}
             </div>
        </div>
        <div className="flex items-center gap-2">
            {phase === GamePhase.DRAWING && (
                <div className={`font-marker text-xl leading-none px-2 py-1 rounded-lg ${timeLeft <= 10 ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-700 bg-slate-100'}`}>
                  {timeLeft}s
                </div>
            )}
        </div>
      </div>
  );

  return (
    <div className="h-[100dvh] w-full overflow-hidden text-slate-800 bg-slate-50 relative">
       <Confetti ref={confettiRef} />
       <ReactionOverlay ref={reactionRef} />
       <VictoryPodium ref={victoryPodiumRef} />
       
       {phase === GamePhase.GAME_OVER && (
           <Gallery 
             items={gallery} 
             onPlayAgain={handlePlayAgain} 
             onGoHome={handleLeave}
             onUpdateSettings={(settings) => {
               setGameSettings(settings);
               multiplayer.send({ type: 'UPDATE_SETTINGS', payload: settings });
             }}
             isHost={isHost} 
             players={players} 
             victoryPodiumRef={victoryPodiumRef}
             currentSettings={gameSettings}
           />
       )}

       {!isConnected ? (
           <LobbyScreen 
             lobbyMode={lobbyMode} setLobbyMode={setLobbyMode}
             playerName={playerName} setPlayerName={setPlayerName}
             playerAvatar={playerAvatar} setPlayerAvatar={setPlayerAvatar}
             customAvatar={customAvatar} setCustomAvatar={setCustomAvatar}
             roomCode={roomCode} setRoomCode={setRoomCode}
             gameSettings={gameSettings} setGameSettings={setGameSettings}
             joinError={joinError} players={players} isHost={isHost}
             serverStatus={serverStatus} serverProgress={serverProgress}
             onCreateLobby={handleShowHostSettings} onHostStart={handleCreateRoom}
             onJoin={handleJoin} onStartGame={handleStartGame}
             isCreating={isCreating}
             currentFact={FUN_FACTS[currentFactIndex]}
             teaMode={teaMode}
             gomuStretch={gomuStretch}
             onProgressClick={() => {
               // Gomu Gomu stretch easter egg - 5 rapid clicks
               setGomuClicks(prev => prev + 1);
               setTimeout(() => setGomuClicks(prev => Math.max(0, prev - 1)), 2000);
               if (gomuClicks >= 4) {
                 setGomuStretch(true);
                 setTimeout(() => setGomuStretch(false), 1000);
                 setGomuClicks(0);
               }
             }}
           />
       ) : (
           <div className="relative z-10 flex flex-col h-full">
               {/* Conditionally render ONLY ONE layout to ensure single canvas instance */}
               {isMobile ? (
               /* MOBILE LAYOUT (Skribbl.io style) */
               <div className="flex flex-col h-full">
                   {/* Mobile Header */}
                   {renderMobileHeader()}
                   
                   {/* Canvas Area - takes most of the screen */}
                   <div className="relative flex items-center justify-center flex-1 min-h-0 p-2">
                       {/* Canvas wrapper with aspect ratio */}
                       <div className={`relative w-full max-h-full overflow-hidden bg-white border-2 shadow-lg rounded-xl ${messiMode ? 'border-yellow-400 ring-4 ring-yellow-300/50 animate-glow' : 'border-slate-200'}`} style={{ aspectRatio: '16/9' }}>
                           <CanvasBoard 
                               ref={canvasRef} 
                               color={selectedColor} 
                               strokeWidth={selectedWidth} 
                               tool={activeTool}
                               disabled={!isMyTurn || phase !== GamePhase.DRAWING}
                               onDrawPoint={handleDrawPoint}
                               onStrokeEnd={handleStrokeEnd}
                               onFill={handleFill}
                           />
                           
                           {/* Messi Mode indicator */}
                           {messiMode && (
                               <div className="absolute z-20 px-2 py-1 text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-full shadow-sm top-2 right-2 animate-pulse">
                                   ⚽ GOAT Mode
                               </div>
                           )}
                           
                           {/* Drawer indicator - small overlay is fine inside canvas */}
                           {phase === GamePhase.DRAWING && (
                               <div className="absolute z-10 flex items-center gap-1 px-2 py-1 text-xs border rounded-full shadow-sm top-2 left-2 bg-white/90 backdrop-blur border-slate-200">
                                   {currentDrawer?.customAvatar ? (
                                     <img src={currentDrawer.customAvatar} alt="" className="object-cover w-5 h-5 rounded-full" />
                                   ) : (
                                     <span>{currentDrawer?.avatar || '?'}</span>
                                   )}
                                   <span className="font-bold text-slate-600 truncate max-w-[60px]">{currentDrawer?.name}</span>
                                   <span className="text-slate-400">is drawing</span>
                               </div>
                           )}
                       </div>
                       
                       {/* Full-screen overlays rendered OUTSIDE canvas but centered over the whole area */}
                       {phase === GamePhase.LOBBY && renderLobbyWaiting()}
                       {phase === GamePhase.WORD_SELECT && renderWordSelect()}
                       {phase === GamePhase.ROUND_OVER && renderScoreboard()}
                   </div>
                   
                   {/* Drawing Toolbar (only when it's my turn) */}
                   {phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER && (
                       <GameToolbar 
                         selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                         selectedWidth={selectedWidth} setSelectedWidth={setSelectedWidth}
                         activeTool={activeTool} setActiveTool={setActiveTool}
                         onUndo={handleUndo} onClear={handleClearCanvas}
                         isMyTurn={isMyTurn}
                       />
                   )}
                   
                   {/* Bottom Panel: Leaderboard + Chat side by side */}
                   <div className="flex flex-row h-40 border-t border-slate-200 shrink-0">
                       {/* Compact Leaderboard */}
                       <div className="w-2/5 border-r border-slate-200">
                           <PlayerList 
                             players={players} 
                             drawerId={drawerId} 
                             onLeave={handleLeave} 
                             feedbackMap={playerFeedback}
                             isMobileCompact={true}
                           />
                       </div>
                       {/* Compact Chat */}
                       <div className="w-3/5">
                           <ChatSidebar 
                             roomCode={roomCode}
                             messages={chatMessages}
                             inputMessage={inputMessage}
                             setInputMessage={setInputMessage}
                             onSendMessage={handleSendMessage}
                             isMyTurn={isMyTurn}
                             phase={phase}
                             isMobileCompact={true}
                           />
                       </div>
                   </div>
                   
                   {/* Guess Input - Fixed at bottom */}
                   <form onSubmit={handleSendMessage} className="flex gap-2 p-2 bg-white border-t border-slate-200 shrink-0 safe-area-bottom">
                       <input 
                         className="flex-1 px-3 py-2 text-base bg-white border rounded-lg outline-none border-slate-300 focus:border-blue-400 text-slate-900 placeholder:text-slate-400"
                         placeholder={isMyTurn ? "You are drawing..." : "Type your guess here..."}
                         value={inputMessage}
                         onChange={e => setInputMessage(e.target.value)}
                         disabled={isMyTurn || phase === GamePhase.ROUND_OVER}
                       />
                       <button 
                         disabled={isMyTurn} 
                         className="px-4 py-2 font-bold text-white transition-transform bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600 disabled:opacity-50 active:scale-95"
                       >
                         Send
                       </button>
                   </form>
               </div>
               ) : (
               /* DESKTOP LAYOUT */
               <div className="flex flex-row h-full">
                   {/* 1. LEFT SIDEBAR (LEADERBOARD) */}
                   <PlayerList 
                     players={players} 
                     drawerId={drawerId} 
                     onLeave={handleLeave} 
                     feedbackMap={playerFeedback}
                   />

                   {/* 2. CENTER AREA */}
                   <main className="relative flex flex-col flex-1 min-w-0 bg-slate-200">
                       <div className="relative flex flex-col flex-1 min-h-0 p-4">
                            {/* Desktop Game Info Header */}
                            {phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER && (
                                 <div className="absolute z-20 flex justify-between pointer-events-none top-6 left-6 right-6">
                                     <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-md bg-white/90 backdrop-blur border-slate-300">
                                        <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Word</span>
                                        <span className="font-marker text-xl text-slate-900 tracking-widest min-w-[100px] text-center">
                                            {displayWord || '...'}
                                        </span>
                                     </div>
                                     <div className="flex gap-2">
                                         <div className="flex items-center gap-2 px-4 py-2 border rounded-full shadow-md bg-white/90 backdrop-blur border-slate-300">
                                            {currentDrawer?.customAvatar ? (
                                              <img src={currentDrawer.customAvatar} alt="" className="object-cover w-8 h-8 rounded-full" />
                                            ) : (
                                              <span className="text-xl">{currentDrawer?.avatar || '⏳'}</span>
                                            )}
                                            <span className="text-sm font-bold text-slate-700">{currentDrawer?.name ? `${currentDrawer.name}'s Turn` : 'Waiting...'}</span>
                                         </div>
                                         {phase === GamePhase.DRAWING && (
                                             <div className={`bg-white/90 backdrop-blur w-12 h-10 flex items-center justify-center rounded-full shadow-md border border-slate-300 font-marker text-xl ${timeLeft < 10 ? 'text-red-500' : 'text-slate-700'}`}>
                                                {timeLeft}
                                             </div>
                                         )}
                                     </div>
                                 </div>
                            )}

                            <div className={`relative w-full h-full overflow-hidden bg-white border-4 shadow-lg wobbly-border ${messiMode ? 'border-yellow-400 ring-4 ring-yellow-300/50 animate-glow' : 'border-slate-300'}`} style={{ aspectRatio: '16/9' }}>
                                <CanvasBoard 
                                    ref={canvasRef} 
                                    color={selectedColor} 
                                    strokeWidth={selectedWidth} 
                                    tool={activeTool}
                                    disabled={!isMyTurn || phase !== GamePhase.DRAWING}
                                    onDrawPoint={handleDrawPoint}
                                    onStrokeEnd={handleStrokeEnd}
                                    onFill={handleFill}
                                />
                                
                                {/* Messi Mode indicator (desktop) */}
                                {messiMode && (
                                    <div className="absolute z-20 px-3 py-1 text-sm font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-full shadow-sm top-4 right-4 animate-pulse">
                                        ⚽ GOAT Mode Activated
                                    </div>
                                )}
                                
                                {phase === GamePhase.LOBBY && renderLobbyWaiting()}
                                {phase === GamePhase.WORD_SELECT && renderWordSelect()}
                                {phase === GamePhase.ROUND_OVER && renderScoreboard()}
                                
                                {phase === GamePhase.DRAWING && !isMyTurn && (
                                    <div className="absolute z-10 px-3 py-1 text-xs font-bold text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-full shadow-sm pointer-events-none bottom-4 right-4 opacity-80">
                                        You are guessing
                                    </div>
                                )}
                            </div>
                       </div>

                       {phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER && (
                           <GameToolbar 
                             selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                             selectedWidth={selectedWidth} setSelectedWidth={setSelectedWidth}
                             activeTool={activeTool} setActiveTool={setActiveTool}
                             onUndo={handleUndo} onClear={handleClearCanvas}
                             isMyTurn={isMyTurn}
                           />
                       )}
                   </main>

                   <ChatSidebar 
                     roomCode={roomCode}
                     messages={chatMessages}
                     inputMessage={inputMessage}
                     setInputMessage={setInputMessage}
                     onSendMessage={handleSendMessage}
                     isMyTurn={isMyTurn}
                     phase={phase}
                   />
               </div>
               )}
           </div>
       )}
       
       {/* Easter egg crumpled paper credits - only show on lobby (desktop only) */}
       <CrumpledPaperCredits show={!isConnected || phase === GamePhase.LOBBY} />
    </div>
  );
};

export default App;
