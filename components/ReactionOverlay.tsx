
import React, { useState, useImperativeHandle, forwardRef, useEffect, useRef } from 'react';

export interface ReactionOverlayHandle {
  addReaction: (emoji: string) => void;
}

interface Reaction {
  id: number;
  emoji: string;
  left: number; // Percentage 0-100
}

export const ReactionOverlay = forwardRef<ReactionOverlayHandle, {}>((props, ref) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const idCounter = useRef(0);

  useImperativeHandle(ref, () => ({
    addReaction: (emoji: string) => {
      const id = idCounter.current++;
      // Random position roughly on the right side (60% to 90% of screen width)
      const left = 60 + Math.random() * 30;
      
      setReactions(prev => [...prev, { id, emoji, left }]);

      // Remove after animation (2s)
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 2000);
    }
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {reactions.map(r => (
        <div
          key={r.id}
          className="absolute text-4xl animate-float-up opacity-0"
          style={{
            left: `${r.left}%`,
            bottom: '0',
          }}
        >
          {r.emoji}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          10% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { transform: translateY(-300px) scale(1); opacity: 0; }
        }
        .animate-float-up {
          animation: floatUp 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
});

ReactionOverlay.displayName = 'ReactionOverlay';
