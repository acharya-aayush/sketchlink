
import React, { useEffect, useRef, useState } from 'react';
import { GalleryItem, Player, GameSettings } from '../types';
import { Button } from './Button';
import { VictoryPodiumHandle } from './VictoryPodium';

interface GalleryProps {
  items: GalleryItem[];
  onPlayAgain: () => void;
  onGoHome: () => void;
  onUpdateSettings?: (settings: GameSettings) => void;
  isHost: boolean;
  players?: Player[];
  victoryPodiumRef?: React.RefObject<VictoryPodiumHandle>;
  currentSettings?: GameSettings;
}

export const Gallery: React.FC<GalleryProps> = ({ 
  items, 
  onPlayAgain, 
  onGoHome,
  onUpdateSettings,
  isHost, 
  players, 
  victoryPodiumRef,
  currentSettings
}) => {
  const [showGallery, setShowGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<GameSettings>(currentSettings || {
    rounds: 3,
    drawTime: 60,
    difficulty: 'Medium',
    customWords: ''
  });
  const hasShownVictory = useRef(false);
  
  // Update temp settings when currentSettings changes
  useEffect(() => {
    if (currentSettings) {
      setTempSettings(currentSettings);
    }
  }, [currentSettings]);
  
  // Show victory podium first, then gallery
  useEffect(() => {
    if (players && players.length > 0 && victoryPodiumRef?.current && !hasShownVictory.current) {
      hasShownVictory.current = true;
      victoryPodiumRef.current.show(players);
      // Show gallery after a delay to let people enjoy the podium
      const timer = setTimeout(() => {
        setShowGallery(true);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      // No victory animation, show gallery immediately
      setShowGallery(true);
    }
  }, [players, victoryPodiumRef]);
  
  const downloadImage = (item: GalleryItem) => {
      const link = document.createElement('a');
      link.href = item.image;
      link.download = `sketchlink-${item.word}-${item.drawer}.png`;
      link.click();
  };

  const handleSaveSettings = () => {
    if (onUpdateSettings) {
      onUpdateSettings(tempSettings);
    }
    setShowSettings(false);
  };

  if (!showGallery) {
    return null; // Victory podium is showing
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col items-center p-4 overflow-y-auto bg-slate-50 md:p-8">
        <h1 className="mt-4 mb-2 text-4xl md:text-5xl font-marker text-slate-800 animate-bounce-in">🎨 Gallery</h1>
        <p className="mb-6 text-lg md:text-xl text-slate-500 font-handwritten md:mb-8">What a masterpiece collection!</p>

        {items.length === 0 ? (
            <div className="italic text-slate-400">No drawings saved this session.</div>
        ) : (
            <div className="grid w-full max-w-6xl grid-cols-1 gap-6 pb-32 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
                {items.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="relative p-4 pb-12 transition-all duration-300 transform bg-white shadow-lg cursor-pointer group rotate-1 hover:rotate-0 hover:scale-105"
                        style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}
                        onClick={() => downloadImage(item)}
                    >
                        <div className="relative mb-4 overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
                            <img src={item.image} alt={item.word} className="object-contain w-full h-full" />
                             <div className="absolute inset-0 flex items-center justify-center font-bold text-white transition-opacity opacity-0 bg-black/50 group-hover:opacity-100">
                                 Click to Download
                             </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <h3 className="text-xl capitalize md:text-2xl font-marker text-slate-800">{item.word}</h3>
                            <div className="flex items-center justify-center gap-1 text-base md:text-lg font-handwritten text-slate-500">
                              {item.drawerAvatar && (
                                item.drawerCustomAvatar ? (
                                  <img src={item.drawerCustomAvatar} alt="" className="object-cover w-5 h-5 rounded-full" />
                                ) : (
                                  <span className="text-sm">{item.drawerAvatar}</span>
                                )
                              )}
                              <span>by {item.drawer}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Settings Modal for Host */}
        {showSettings && isHost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 bg-white shadow-2xl rounded-xl">
              <h3 className="mb-4 text-2xl font-marker text-slate-800">Game Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-600">Rounds</label>
                  <div className="flex gap-2">
                    {[2, 3, 5, 7].map(r => (
                      <button
                        key={r}
                        onClick={() => setTempSettings(s => ({ ...s, rounds: r }))}
                        className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                          tempSettings.rounds === r 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-600">Draw Time (seconds)</label>
                  <div className="flex gap-2">
                    {[30, 45, 60, 90, 120].map(t => (
                      <button
                        key={t}
                        onClick={() => setTempSettings(s => ({ ...s, drawTime: t }))}
                        className={`flex-1 py-2 rounded-lg font-bold transition-colors text-sm ${
                          tempSettings.drawTime === t 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t}s
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block mb-1 text-sm font-bold text-slate-600">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button
                        key={d}
                        onClick={() => setTempSettings(s => ({ ...s, difficulty: d as 'Easy' | 'Medium' | 'Hard' }))}
                        className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                          tempSettings.difficulty === d 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-2 font-bold transition-colors border-2 rounded-lg text-slate-600 border-slate-200 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 py-2 font-bold text-white transition-colors bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-3 p-4 border-t bg-white/90 backdrop-blur border-slate-200 shadow-up">
            {isHost ? (
                <>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2 font-bold transition-colors border-2 rounded-lg text-slate-600 border-slate-300 hover:bg-slate-50"
                  >
                    ⚙️ Settings
                  </button>
                  <Button onClick={onPlayAgain} className="shadow-xl">🔁 Play Again</Button>
                  <button
                    onClick={onGoHome}
                    className="px-4 py-2 font-bold text-red-500 transition-colors border-2 border-red-200 rounded-lg hover:bg-red-50"
                  >
                    🏠 Leave
                  </button>
                </>
            ) : (
                <>
                  <div className="flex items-center px-4 py-2 font-bold rounded-lg text-slate-500 bg-slate-100 animate-pulse">
                    Waiting for host...
                  </div>
                  <button
                    onClick={onGoHome}
                    className="px-6 py-2 font-bold text-white transition-colors bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600"
                  >
                    🏠 Go Home
                  </button>
                </>
            )}
        </div>
    </div>
  );
};
