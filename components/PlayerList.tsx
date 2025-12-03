
import React from 'react';
import { Player } from '../types';
import { multiplayer } from '../services/multiplayer';

interface PlayerListProps {
  players: Player[];
  drawerId: string;
  onLeave: () => void;
  feedbackMap: Record<string, string>; // PlayerID -> Message (e.g. "+100")
}

export const PlayerList: React.FC<PlayerListProps> = ({ players, drawerId, onLeave, feedbackMap }) => {
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
        {[...players].sort((a,b) => b.score - a.score).map((p, i) => {
          const isMe = p.id === multiplayer.playerId;
          const isDrawer = p.id === drawerId;
          const feedback = feedbackMap[p.id];

          return (
            <div key={p.id} className={`relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${isDrawer ? 'bg-amber-50 border-amber-300 shadow-sm' : 'bg-white border-slate-100'}`}>
               <div className={`font-bold w-5 text-center text-sm ${i < 3 ? 'text-yellow-500' : 'text-slate-400'}`}>#{i+1}</div>
               <div className="text-2xl relative">
                 {p.avatar}
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
