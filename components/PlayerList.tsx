
import React from 'react';
import { Player } from '../types';
import { multiplayer } from '../services/multiplayer';

interface PlayerListProps {
  players: Player[];
  drawerId: string;
  onLeave: () => void;
  feedbackMap: Record<string, string>; // PlayerID -> Message (e.g. "+100")
  isMobileCompact?: boolean; // For Skribbl.io-style mobile layout
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, drawerId, onLeave, feedbackMap, isMobileCompact = false }) => {
  const sortedPlayers = [...players].sort((a,b) => b.score - a.score);
  
  // Mobile compact version (Skribbl.io style - shows in bottom panel)
  if (isMobileCompact) {
    return (
      <div className="flex flex-col h-full bg-white overflow-hidden">
        <div className="px-2 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Players</span>
          <span className="text-xs text-slate-400">{players.length}/12</span>
        </div>
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
          {sortedPlayers.slice(0, 8).map((p, i) => {
            const isMe = p.id === multiplayer.playerId;
            const isDrawer = p.id === drawerId;
            const feedback = feedbackMap[p.id];

            return (
              <div 
                key={p.id} 
                className={`relative flex items-center gap-2 p-1.5 rounded-lg border transition-all
                  ${isDrawer ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}
                  ${isMe ? 'ring-1 ring-blue-300' : ''}`}
              >
                <span className={`font-bold text-xs w-4 ${i < 3 ? 'text-yellow-500' : 'text-slate-400'}`}>#{i+1}</span>
                <div className="relative w-6 h-6 shrink-0">
                  {p.customAvatar ? (
                    <img 
                      src={p.customAvatar} 
                      alt={`${p.name}'s avatar`}
                      className="w-6 h-6 rounded-full border border-slate-200 object-cover bg-white"
                    />
                  ) : (
                    <span className="text-lg leading-none">{p.avatar}</span>
                  )}
                  {isDrawer && <span className="absolute -bottom-0.5 -right-0.5 text-[10px]">✏️</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-700 truncate text-xs leading-tight">
                    {p.name}
                    {isMe && <span className="text-blue-500 ml-1">(You)</span>}
                  </div>
                  <div className="text-green-600 text-[10px] font-bold">{p.score} pts</div>
                </div>
                {feedback && (
                  <div className="absolute right-1 -top-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow animate-bounce z-50">
                    {feedback}
                  </div>
                )}
              </div>
            );
          })}
          {sortedPlayers.length > 8 && (
            <div className="text-center text-xs text-slate-400 py-1">+{sortedPlayers.length - 8} more</div>
          )}
        </div>
      </div>
    );
  }

  // Desktop full version
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-full shrink-0 z-20 shadow-sm relative">
      <div className="p-4 border-b border-slate-100 bg-slate-50">
        <div className="flex justify-between items-center mb-1">
            <h3 className="font-marker text-2xl text-slate-800">SketchLink</h3>
            <button onClick={onLeave} className="text-xs font-bold text-red-400 hover:text-red-600 border border-red-200 px-2 py-1 rounded">EXIT</button>
        </div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Leaderboard</div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {sortedPlayers.map((p, i) => {
          const isMe = p.id === multiplayer.playerId;
          const isDrawer = p.id === drawerId;
          const feedback = feedbackMap[p.id];

          return (
            <div key={p.id} className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isDrawer ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-slate-100'}`}>
               <div className={`font-bold w-5 text-center text-sm ${i < 3 ? 'text-yellow-500' : 'text-slate-400'}`}>#{i+1}</div>
               <div className="relative w-8 h-8 shrink-0 flex items-center justify-center">
                 {p.customAvatar ? (
                   <img 
                     src={p.customAvatar} 
                     alt={`${p.name}'s avatar`}
                     className="w-8 h-8 rounded-full border-2 border-slate-200 object-cover bg-white"
                   />
                 ) : (
                   <span className="text-2xl">{p.avatar}</span>
                 )}
                 {isDrawer && <div className="absolute -bottom-1 -right-1 text-sm drop-shadow-md">✏️</div>}
               </div>
               <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-700 truncate text-sm flex items-center gap-1">
                    {p.name}
                    {isMe && <span className="text-blue-500 text-[10px] bg-blue-50 px-1 rounded border border-blue-100">(You)</span>}
                  </div>
                  <div className="text-green-600 text-xs font-bold">{p.score} pts</div>
               </div>
               
               {/* Floating Feedback Animation */}
               {feedback && (
                   <div className="absolute right-2 -top-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-bounce z-50 whitespace-nowrap">
                       {feedback}
                   </div>
               )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};
