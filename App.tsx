
import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, ChatMessage, TOOLS, ToolType, COLORS, STROKE_WIDTHS, DrawPoint, GameEvent, FillAction, Player, GameSettings, GalleryItem } from './types';
import { CanvasBoard, CanvasBoardHandle } from './components/CanvasBoard';
import { Button } from './components/Button';
import { multiplayer, wakeUpServer } from './services/multiplayer';
import { AVATARS } from './constants';
import { PlayerList } from './components/PlayerList';
import { ChatSidebar } from './components/ChatSidebar';
import { GameToolbar } from './components/GameToolbar';
import { LobbyScreen } from './components/LobbyScreen';
import { audioService } from './services/audio';
import { Confetti, ConfettiHandle } from './components/Confetti';
import { ReactionOverlay, ReactionOverlayHandle } from './components/ReactionOverlay';
import { Gallery } from './components/Gallery';

const App: React.FC = () => {
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
  const [gameSettings, setGameSettings] = useState<GameSettings>({
      rounds: 3,
      drawTime: 60,
      difficulty: 'Medium',
      customWords: ''
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
  const [playerFeedback, setPlayerFeedback] = useState<Record<string, string>>({});

  // Computed
  const isMe = players.find(p => p.id === multiplayer.playerId);
  const isHost = isMe?.isHost || false;
  const isMyTurn = drawerId === multiplayer.playerId;
  const currentDrawer = players.find(p => p.id === drawerId);
  // Display word logic: If it's my turn OR round over, show real word. Otherwise, show masked/hint word.
  const displayWord = (isMyTurn || phase === GamePhase.ROUND_OVER) ? currentWord : maskedWord;

  // --- Initialization & URL Handling ---
  useEffect(() => {
    // Wake up the server first (Render free tier sleeps)
    const initServer = async () => {
      await wakeUpServer();
      setServerReady(true);
      
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

  useEffect(() => {
    localStorage.setItem('sketchlink_name', playerName);
  }, [playerName]);

  useEffect(() => {
    localStorage.setItem('sketchlink_avatar', playerAvatar);
  }, [playerAvatar]);

  // --- Network Event Handling ---
  useEffect(() => {
    const unsubscribe = multiplayer.onEvent((event: GameEvent) => {
      // Filter echoes for drawing events
      if (isMyTurn) {
        const echoEvents = ['DRAW_POINT', 'END_STROKE', 'FILL_CANVAS', 'UNDO_ACTION', 'CLEAR_CANVAS'];
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
        case 'DRAW_POINT':
          canvasRef.current?.drawRemotePoint(event.payload);
          break;
        case 'END_STROKE':
          canvasRef.current?.endRemoteStroke();
          break;
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
               image: dataUrl
           };
           multiplayer.addToGallery(item);
       }
    }
  }, [phase, isMyTurn, currentWord, playerName]);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isMyTurn) return;
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            handleUndo();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  const handleCreateLobby = async () => {
      initAudio();
      setLobbyMode('LOADING');
      try {
        const roomId = await multiplayer.connect(playerName, playerAvatar);
        setRoomCode(roomId);
        setIsConnected(true);
        setLobbyMode('HOST');
        window.location.hash = `room=${roomId}`;
        
        // Push initial settings
        multiplayer.updateSettings(gameSettings);
      } catch (err) {
          console.error(err);
          setJoinError('Could not connect to server.');
          setLobbyMode('HOME');
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
        await multiplayer.connect(playerName, playerAvatar, roomCode);
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
    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-30 flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl border-4 border-slate-300 w-full max-w-lg z-10 animate-bounce-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-4xl font-marker text-center mb-2">Round Over!</h2>
            <div className="text-center mb-6 text-xl text-slate-600">
                The word was: <span className="font-bold text-blue-600 uppercase">{currentWord}</span>
            </div>
            
            <div className="space-y-3 mb-8">
                {players.sort((a,b) => b.score - a.score).map((p, i) => (
                    <div key={p.id} className={`flex justify-between items-center p-3 rounded-lg border-2 ${p.id === drawerId ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-400 w-6">#{i+1}</span>
                            <span className="text-2xl">{p.avatar}</span>
                            <span className="font-handwritten text-xl">{p.name} {p.id === drawerId && '✏️'}</span>
                        </div>
                        <span className="font-bold text-green-600 text-xl">{p.score}pts</span>
                    </div>
                ))}
            </div>

            <div className="text-center text-slate-400 font-bold animate-pulse">
                Next round starting soon...
            </div>
        </div>
    </div>
  );

  const renderWordSelect = () => {
    if (!isMyTurn) {
      const drawerName = players.find(p => p.id === drawerId)?.name || 'Unknown';
      const drawerAvatar = players.find(p => p.id === drawerId)?.avatar || '👤';
      return (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/90 backdrop-blur-sm p-4 text-center">
           <div className="text-4xl font-marker animate-pulse text-slate-600 mb-4">Waiting...</div>
           <p className="text-slate-500 text-xl">{drawerAvatar} {drawerName} is choosing a word.</p>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-100/95 backdrop-blur-sm space-y-8 p-4">
        <h2 className="text-3xl md:text-4xl font-marker text-slate-700 text-center">Your Turn! Choose a Word:</h2>
        <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
          {wordOptions.map((word) => (
            <button
              key={word}
              onClick={() => finalHandleWordSelect(word)}
              className="bg-white hover:bg-amber-50 border-4 border-slate-300 border-dashed rounded-xl p-6 text-2xl md:text-3xl shadow-lg transform hover:-translate-y-1 transition-all text-slate-800"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderLobbyWaiting = () => (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-slate-200 text-center max-w-md w-full">
             <div className="font-marker text-3xl text-slate-700 mb-2">Lobby</div>
             <div className="text-slate-500 mb-6 flex flex-col gap-1 items-center">
                <span>Room Code:</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded select-all text-sm break-all max-w-full hover:bg-blue-50 transition-colors"
                  title="Click to copy link"
                >
                    {roomCode || "Connecting..."}
                </button>
             </div>
             
             {isHost ? (
                 <div className="space-y-4">
                    <p className="text-slate-600">
                        {players.length > 1 ? "Ready to start?" : "Waiting for friends to join..."}
                    </p>
                    <Button onClick={handleStartGame} disabled={players.length < 1} className="w-full">
                        Start Game
                    </Button>
                    <p className="text-xs text-slate-400">Share the room link with your friends!</p>
                 </div>
             ) : (
                <div className="space-y-4">
                    <div className="animate-pulse text-xl text-blue-500 font-bold">Waiting for host to start...</div>
                    <p className="text-slate-500">Sit tight! The game will begin soon.</p>
                </div>
             )}
        </div>
    </div>
  );

  const renderMobileHeader = () => (
      <div className="md:hidden flex justify-between items-center p-3 bg-white border-b border-slate-200 shrink-0 shadow-sm z-30">
        <div className="flex items-center gap-2">
           <button onClick={handleLeave} className="text-red-400 font-bold text-xs border border-red-200 px-2 py-1 rounded">EXIT</button>
           <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
             <span className="text-lg leading-none">{currentDrawer?.avatar || '?'}</span>
             <span className="text-xs font-bold text-slate-600 max-w-[80px] truncate">{currentDrawer?.name || 'Waiting'}</span>
           </div>
        </div>
        <div className="flex flex-col items-end">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isMyTurn ? currentWord : (phase === GamePhase.DRAWING ? displayWord : (phase === GamePhase.ROUND_OVER ? currentWord : '...'))}
             </div>
             {phase === GamePhase.DRAWING && (
                 <div className={`font-marker text-xl leading-none ${timeLeft < 10 ? 'text-red-500' : 'text-slate-700'}`}>{timeLeft}s</div>
             )}
        </div>
      </div>
  );

  return (
    <div className="h-[100dvh] w-full overflow-hidden text-slate-800 bg-slate-50 relative">
       <Confetti ref={confettiRef} />
       <ReactionOverlay ref={reactionRef} />
       
       {phase === GamePhase.GAME_OVER && (
           <Gallery items={gallery} onPlayAgain={handlePlayAgain} isHost={isHost} />
       )}

       {!isConnected ? (
           <LobbyScreen 
             lobbyMode={lobbyMode} setLobbyMode={setLobbyMode}
             playerName={playerName} setPlayerName={setPlayerName}
             playerAvatar={playerAvatar} setPlayerAvatar={setPlayerAvatar}
             roomCode={roomCode} setRoomCode={setRoomCode}
             gameSettings={gameSettings} setGameSettings={setGameSettings}
             joinError={joinError} players={players} isHost={isHost}
             onCreateLobby={handleCreateLobby} onHostStart={handleCreateLobby} // Host start now just creates room
             onJoin={handleJoin} onStartGame={handleStartGame}
           />
       ) : (
           <div className="flex flex-col md:flex-row h-full relative z-10">
               {/* 1. LEFT SIDEBAR (LEADERBOARD) - Desktop */}
               <PlayerList 
                 players={players} 
                 drawerId={drawerId} 
                 onLeave={handleLeave} 
                 feedbackMap={playerFeedback}
               />

               {/* 2. CENTER AREA */}
               <main className="flex-1 flex flex-col min-w-0 bg-slate-200 relative">
                   {renderMobileHeader()}
                   
                   <div className="flex-1 relative p-2 md:p-4 flex flex-col min-h-0">
                        {/* Desktop Game Info Header */}
                        {phase !== GamePhase.LOBBY && phase !== GamePhase.GAME_OVER && (
                             <div className="hidden md:flex absolute top-6 left-6 right-6 justify-between pointer-events-none z-20">
                                 <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md border border-slate-300 flex items-center gap-2">
                                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider">Word</span>
                                    <span className="font-marker text-xl text-slate-900 tracking-widest min-w-[100px] text-center">
                                        {displayWord || '...'}
                                    </span>
                                 </div>
                                 <div className="flex gap-2">
                                     <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-md border border-slate-300 flex items-center gap-2">
                                        <span className="text-xl">{currentDrawer?.avatar || '⏳'}</span>
                                        <span className="font-bold text-slate-700 text-sm">{currentDrawer?.name ? `${currentDrawer.name}'s Turn` : 'Waiting...'}</span>
                                     </div>
                                     {phase === GamePhase.DRAWING && (
                                         <div className={`bg-white/90 backdrop-blur w-12 h-10 flex items-center justify-center rounded-full shadow-md border border-slate-300 font-marker text-xl ${timeLeft < 10 ? 'text-red-500' : 'text-slate-700'}`}>
                                            {timeLeft}
                                         </div>
                                     )}
                                 </div>
                             </div>
                        )}

                        <div className="flex-1 w-full bg-white rounded-xl shadow-lg border-4 border-slate-300 overflow-hidden relative">
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
                            
                            {phase === GamePhase.LOBBY && renderLobbyWaiting()}
                            {phase === GamePhase.WORD_SELECT && renderWordSelect()}
                            {phase === GamePhase.ROUND_OVER && renderScoreboard()}
                            
                            {phase === GamePhase.DRAWING && !isMyTurn && (
                                <div className="absolute bottom-4 right-4 bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full border border-yellow-300 pointer-events-none opacity-80 z-10 font-bold shadow-sm">
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
  );
};

export default App;
