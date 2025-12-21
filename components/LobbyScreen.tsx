
import React, { useRef } from 'react';
import { Button } from './Button';
import { GameSettings, Player } from '../types';
import { AvatarNapkin, AvatarNapkinRef } from './AvatarNapkin';

interface LobbyScreenProps {
  lobbyMode: 'HOME' | 'HOST' | 'JOIN' | 'LOADING' | 'WAKING_SERVER';
  setLobbyMode: (mode: 'HOME' | 'HOST' | 'JOIN' | 'LOADING' | 'WAKING_SERVER') => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
  customAvatar: string | null;
  setCustomAvatar: (avatar: string | null) => void;
  roomCode: string;
  setRoomCode: (code: string) => void;
  gameSettings: GameSettings;
  setGameSettings: (settings: GameSettings) => void;
  joinError: string;
  players: Player[];
  isHost: boolean;
  onCreateLobby: () => void;
  onHostStart: () => void;
  onJoin: () => void;
  onStartGame: () => void;
  serverStatus: 'sleeping' | 'waking' | 'ready';
  serverProgress: number;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  lobbyMode, setLobbyMode,
  playerName, setPlayerName,
  playerAvatar, setPlayerAvatar,
  customAvatar, setCustomAvatar,
  roomCode, setRoomCode,
  gameSettings, setGameSettings,
  joinError, players, isHost,
  onCreateLobby, onHostStart, onJoin, onStartGame,
  serverStatus, serverProgress
}) => {
  const napkinRef = useRef<AvatarNapkinRef>(null);

  // Avatar preview button for showing current selection in forms
  const AvatarPreview = () => (
    <button
      onClick={() => napkinRef.current?.openEditor()}
      className="flex items-center gap-2 px-3 py-2 bg-amber-50 border-2 border-amber-200 rounded-lg hover:bg-amber-100 transition-all group w-full justify-center"
    >
      <div className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden">
        {customAvatar ? (
          <img src={customAvatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">{playerAvatar}</span>
        )}
      </div>
      <div className="text-left">
        <div className="text-sm text-slate-700 font-bold">{playerName || 'Enter name...'}</div>
        <div className="text-xs text-slate-400">Tap to edit profile ✏️</div>
      </div>
    </button>
  );

  const renderLobbyHome = () => (
    <div className="flex flex-col gap-4 w-full max-w-sm animate-fade-in">
       <Button onClick={onCreateLobby} className="w-full text-lg py-4">
         ✏️ Create New Game
       </Button>
       <div className="relative flex py-2 items-center">
         <div className="flex-grow border-t border-slate-300"></div>
         <span className="flex-shrink mx-4 text-slate-400">OR</span>
         <div className="flex-grow border-t border-slate-300"></div>
       </div>
       <Button onClick={() => setLobbyMode('JOIN')} variant="secondary" className="w-full text-lg py-4">
         🎮 Join Existing Game
       </Button>
    </div>
  );

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="text-xl font-marker text-slate-600">Connecting to Server...</p>
    </div>
  );

  const renderWakingServer = () => (
    <AvatarNapkin
      ref={napkinRef}
      playerName={playerName}
      setPlayerName={setPlayerName}
      playerAvatar={playerAvatar}
      setPlayerAvatar={setPlayerAvatar}
      customAvatar={customAvatar}
      setCustomAvatar={setCustomAvatar}
      mode="center"
      serverStatus={serverStatus}
      serverProgress={serverProgress}
    />
  );

  const renderHostForm = () => (
    <div className="w-full max-w-md bg-white p-4 md:p-6 rounded-lg shadow-lg border-2 border-slate-200 animate-slide-up flex flex-col max-h-[85vh] md:max-h-none overflow-y-auto">
        <h3 className="text-xl md:text-2xl font-marker mb-3 md:mb-4 text-center">Game Settings</h3>
        
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            {/* Profile Napkin Preview */}
            <div>
                <label className="block text-slate-600 font-bold mb-2 text-sm md:text-base">Your Profile</label>
                <AvatarPreview />
            </div>
            
            <div className="grid grid-cols-2 gap-2 md:gap-4">
                <div>
                    <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Rounds</label>
                    <select 
                        value={gameSettings.rounds}
                        onChange={(e) => setGameSettings({...gameSettings, rounds: Number(e.target.value)})}
                        className="w-full border-2 border-slate-300 rounded px-2 py-2 bg-white text-slate-900 text-sm md:text-base"
                    >
                        <option value={1}>1 Round</option>
                        <option value={3}>3 Rounds</option>
                        <option value={5}>5 Rounds</option>
                        <option value={10}>10 Rounds</option>
                    </select>
                </div>
                <div>
                    <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Draw Time</label>
                    <select 
                        value={gameSettings.drawTime}
                        onChange={(e) => setGameSettings({...gameSettings, drawTime: Number(e.target.value)})}
                        className="w-full border-2 border-slate-300 rounded px-2 py-2 bg-white text-slate-900 text-sm md:text-base"
                    >
                        <option value={30}>30s</option>
                        <option value={45}>45s</option>
                        <option value={60}>60s</option>
                        <option value={90}>90s</option>
                        <option value={120}>120s</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Difficulty</label>
                <div className="flex rounded-md shadow-sm" role="group">
                    {['Easy', 'Medium', 'Hard'].map((diff) => (
                        <button
                            key={diff}
                            type="button"
                            onClick={() => setGameSettings({...gameSettings, difficulty: diff as any})}
                            className={`flex-1 px-2 md:px-4 py-2 text-xs md:text-sm font-medium border border-slate-300 first:rounded-l-lg last:rounded-r-lg 
                                ${gameSettings.difficulty === diff 
                                    ? 'bg-blue-600 text-white border-blue-600 z-10' 
                                    : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Custom Words (Optional)</label>
                <textarea 
                    value={gameSettings.customWords}
                    onChange={(e) => setGameSettings({...gameSettings, customWords: e.target.value})}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 text-sm bg-white text-slate-900 placeholder:text-slate-400 min-h-[50px] md:min-h-[60px]"
                    placeholder="Dog, Cat, Inside Joke..."
                />
            </div>
        </div>

        <div className="flex gap-3 mt-auto md:mt-0">
            <Button onClick={() => setLobbyMode('HOME')} variant="secondary" className="flex-1">Cancel</Button>
            <Button onClick={onHostStart} disabled={!playerName} className="flex-1">Create Room</Button>
        </div>
    </div>
  );

  const renderJoinForm = () => (
      <div className="w-full max-w-md bg-white p-4 md:p-6 rounded-lg shadow-lg border-2 border-slate-200 animate-slide-up flex flex-col max-h-[85vh] md:max-h-none overflow-y-auto">
        <h3 className="text-xl md:text-2xl font-marker mb-3 md:mb-4 text-center">Join Game</h3>
        
        {joinError && (
            <div className="bg-red-50 text-red-600 p-2 md:p-3 rounded mb-3 md:mb-4 text-xs md:text-sm border border-red-200">
                {joinError}
            </div>
        )}

        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            {/* Profile Napkin Preview */}
            <div>
                <label className="block text-slate-600 font-bold mb-2 text-sm md:text-base">Your Profile</label>
                <AvatarPreview />
            </div>

            <div>
                <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Room Link or Code</label>
                <input 
                    type="text" 
                    value={roomCode}
                    onChange={(e) => {
                        // Extract code if user pastes a full URL
                        const val = e.target.value;
                        if (val.includes('#room=')) {
                            setRoomCode(val.split('#room=')[1]);
                        } else {
                            setRoomCode(val);
                        }
                    }}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 font-mono text-sm text-center bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="Paste link here..."
                />
            </div>
        </div>

        <div className="flex gap-2 md:gap-3 mt-auto md:mt-0">
            <Button onClick={() => setLobbyMode('HOME')} variant="secondary" className="flex-1">Back</Button>
            <Button onClick={onJoin} disabled={!playerName || roomCode.length < 4} className="flex-1">Join</Button>
        </div>
      </div>
  );

  // During wake-up: show AvatarNapkin in center mode (full-screen)
  // The transition to HOME is handled by App.tsx when serverStatus becomes 'ready'
  if (lobbyMode === 'WAKING_SERVER') {
    return renderWakingServer();
  }

  return (
    <div className="relative flex flex-col h-full items-center justify-center p-3 md:p-4 bg-slate-50 overflow-y-auto">
      {/* Pinned Napkin in corner - always accessible */}
      <div className="absolute top-4 right-4 z-50">
        <AvatarNapkin
          ref={napkinRef}
          playerName={playerName}
          setPlayerName={setPlayerName}
          playerAvatar={playerAvatar}
          setPlayerAvatar={setPlayerAvatar}
          customAvatar={customAvatar}
          setCustomAvatar={setCustomAvatar}
          mode="corner"
          serverStatus={serverStatus}
          serverProgress={serverProgress}
        />
      </div>

      <div className="text-center space-y-1 md:space-y-2 mb-4 md:mb-8">
        <h1 className="text-4xl md:text-6xl font-marker text-slate-800 -rotate-2">
          Sketch<span className="text-blue-500">Link</span>
        </h1>
        <p className="text-slate-500 font-handwritten text-xl md:text-2xl">Multiplayer Drawing</p>
      </div>

      {lobbyMode === 'LOADING' && renderLoading()}
      {lobbyMode === 'HOME' && renderLobbyHome()}
      {lobbyMode === 'HOST' && renderHostForm()}
      {lobbyMode === 'JOIN' && renderJoinForm()}
    </div>
  );
};
