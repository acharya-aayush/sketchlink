
import React, { useEffect, useRef, useState } from 'react';
import { GalleryItem, Player } from '../types';
import { Button } from './Button';
import { VictoryPodiumHandle } from './VictoryPodium';

interface GalleryProps {
  items: GalleryItem[];
  onPlayAgain: () => void;
  isHost: boolean;
  players?: Player[];
  victoryPodiumRef?: React.RefObject<VictoryPodiumHandle>;
}

export const Gallery: React.FC<GalleryProps> = ({ items, onPlayAgain, isHost, players, victoryPodiumRef }) => {
  const [showGallery, setShowGallery] = useState(false);
  const hasShownVictory = useRef(false);
  
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

  if (!showGallery) {
    return null; // Victory podium is showing
  }

  return (
    <div className="absolute inset-0 bg-slate-50 z-40 overflow-y-auto p-4 md:p-8 flex flex-col items-center">
        <h1 className="text-5xl font-marker text-slate-800 mb-2 mt-4 animate-bounce-in">Game Over!</h1>
        <p className="text-xl text-slate-500 mb-8 font-handwritten">What a masterpiece collection!</p>

        {items.length === 0 ? (
            <div className="text-slate-400 italic">No drawings saved this session.</div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl pb-24">
                {items.map((item, index) => (
                    <div 
                        key={item.id} 
                        className="bg-white p-4 pb-12 shadow-lg transform rotate-1 hover:rotate-0 hover:scale-105 transition-all duration-300 relative group cursor-pointer"
                        style={{ transform: `rotate(${Math.random() * 4 - 2}deg)` }}
                        onClick={() => downloadImage(item)}
                    >
                        <div className="border border-slate-100 bg-slate-50 overflow-hidden aspect-square mb-4 relative">
                            <img src={item.image} alt={item.word} className="w-full h-full object-contain" />
                             <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-bold">
                                 Click to Download
                             </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 text-center">
                            <h3 className="font-marker text-2xl text-slate-800 capitalize">{item.word}</h3>
                            <p className="font-handwritten text-slate-500 text-lg">by {item.drawer}</p>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Footer Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur border-t border-slate-200 flex justify-center gap-4 shadow-up">
            {isHost ? (
                <Button onClick={onPlayAgain} className="w-full max-w-xs shadow-xl">Play Again</Button>
            ) : (
                <div className="text-slate-500 font-bold animate-pulse">Waiting for host...</div>
            )}
        </div>
    </div>
  );
};
