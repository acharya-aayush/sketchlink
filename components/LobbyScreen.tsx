
import React from 'react';
import { Button } from './Button';
import { GameSettings, Player } from '../types';
import { AVATARS } from '../constants';

interface LobbyScreenProps {
  lobbyMode: 'HOME' | 'HOST' | 'JOIN' | 'LOADING' | 'WAKING_SERVER';
  setLobbyMode: (mode: 'HOME' | 'HOST' | 'JOIN' | 'LOADING' | 'WAKING_SERVER') => void;
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
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
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  lobbyMode, setLobbyMode,
  playerName, setPlayerName,
  playerAvatar, setPlayerAvatar,
  roomCode, setRoomCode,
  gameSettings, setGameSettings,
  joinError, players, isHost,
  onCreateLobby, onHostStart, onJoin, onStartGame
}) => {

  const AvatarSelector = () => (
      <div className="mb-3 md:mb-4">
          <label className="block text-slate-600 font-bold mb-1 md:mb-2 text-sm md:text-base">Choose Avatar</label>
          <div className="grid grid-cols-8 gap-1 md:gap-2">
              {AVATARS.map(avatar => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setPlayerAvatar(avatar)}
                    className={`text-xl md:text-2xl p-1 rounded hover:bg-blue-50 transition-colors ${playerAvatar === avatar ? 'bg-blue-100 ring-2 ring-blue-400' : ''}`}
                  >
                      {avatar}
                  </button>
              ))}
          </div>
      </div>
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
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in max-w-sm text-center">
        <div className="text-6xl animate-bounce">☕</div>
        <p className="text-2xl font-marker text-slate-700">Waking up server...</p>
        <p className="text-slate-500 text-sm">Free servers sleep after 15 min of inactivity.<br/>This takes about 30 seconds, hang tight!</p>
        <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{width: '60%', animation: 'loading 2s ease-in-out infinite'}}></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { width: 0%; }
            50% { width: 80%; }
            100% { width: 100%; }
          }
        `}</style>
    </div>
  );

  const renderHostForm = () => (
    <div className="w-full max-w-md bg-white p-4 md:p-6 rounded-lg shadow-lg border-2 border-slate-200 animate-slide-up flex flex-col max-h-[85vh] md:max-h-none overflow-y-auto">
        <h3 className="text-xl md:text-2xl font-marker mb-3 md:mb-4 text-center">Game Settings</h3>
        
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
            <div>
                <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Your Name</label>
                <input 
                    type="text" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 font-handwritten text-lg md:text-xl bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="Enter your name"
                />
            </div>

            <AvatarSelector />
            
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
            <div>
                <label className="block text-slate-600 font-bold mb-1 text-sm md:text-base">Your Name</label>
                <input 
                    type="text" 
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="w-full border-2 border-slate-300 rounded px-3 py-2 font-handwritten text-lg md:text-xl bg-white text-slate-900 placeholder:text-slate-400"
                    placeholder="Enter your name"
                />
            </div>
            
            <AvatarSelector />

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

  return (
    <div className="flex flex-col h-full items-center justify-center p-3 md:p-4 bg-slate-50 overflow-y-auto">
      <div className="text-center space-y-1 md:space-y-2 mb-4 md:mb-8">
        <h1 className="text-4xl md:text-6xl font-marker text-slate-800 -rotate-2">
          Sketch<span className="text-blue-500">Link</span>
        </h1>
        <p className="text-slate-500 font-handwritten text-xl md:text-2xl">Multiplayer Drawing</p>
      </div>

      {lobbyMode === 'WAKING_SERVER' && renderWakingServer()}
      {lobbyMode === 'LOADING' && renderLoading()}
      {lobbyMode === 'HOME' && renderLobbyHome()}
      {lobbyMode === 'HOST' && renderHostForm()}
      {lobbyMode === 'JOIN' && renderJoinForm()}
    </div>
  );
};
