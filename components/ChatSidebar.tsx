
import React, { useRef, useEffect } from 'react';
import { ChatMessage, GamePhase } from '../types';
import { multiplayer } from '../services/multiplayer';

interface ChatSidebarProps {
  roomCode: string;
  messages: ChatMessage[];
  inputMessage: string;
  setInputMessage: (msg: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  isMyTurn: boolean;
  phase: GamePhase;
  isMobileCompact?: boolean; // For Skribbl.io-style mobile layout
}

const REACTIONS = ['❤️', '😂', '😲', '🔥', '💩', '👏'];

// Easter egg: Transform "tea" mentions to include ☕ emoji
const transformTeaMentions = (text: string): string => {
  // Case-insensitive replace, preserves original casing
  return text.replace(/\btea\b/gi, (match) => `${match} ☕`);
};

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ 
  roomCode, 
  messages, 
  inputMessage, 
  setInputMessage, 
  onSendMessage, 
  isMyTurn,
  phase,
  isMobileCompact = false
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendReaction = (emoji: string) => {
      multiplayer.send({
          type: 'EMOJI_REACTION',
          payload: { emoji, senderId: multiplayer.playerId }
      });
  };

  // Mobile compact version (Skribbl.io style)
  if (isMobileCompact) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
        <div className="px-2 py-1.5 bg-white border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chat</span>
          <div className="flex gap-1">
            {REACTIONS.slice(0, 4).map(emoji => (
              <button 
                key={emoji}
                onClick={() => sendReaction(emoji)}
                className="hover:scale-110 transition-transform active:scale-95 text-sm"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 bg-slate-100">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-[10px] italic mt-2">Type a guess!</div>
          )}
          {messages.slice(-15).map(msg => (
            <div key={msg.id} className={`text-xs p-1 rounded flex items-start gap-1 
              ${msg.isSystem ? 'justify-center text-[10px] text-slate-500 italic bg-transparent' : 
                msg.isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 
                msg.isClose ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                'bg-white border border-slate-200 text-slate-800'}`}>
                {!msg.isSystem && (
                  msg.senderCustomAvatar ? (
                    <img src={msg.senderCustomAvatar} alt="" className="w-5 h-5 rounded-full border border-slate-200 object-cover shrink-0" />
                  ) : (
                    <span className="text-sm select-none">{msg.senderAvatar}</span>
                  )
                )}
                <div className="break-all leading-tight">
                  {!msg.isSystem && <span className="font-bold text-slate-600 mr-1">{msg.sender}:</span>}
                  {transformTeaMentions(msg.text)}
                </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>
    );
  }

  // Desktop full version
  return (
      <aside className="hidden md:flex w-80 bg-slate-50 border-l border-slate-200 flex-col h-full shrink-0 z-20 shadow-sm">
          <div className="p-2 border-b border-slate-200 bg-white font-marker text-sm text-slate-500 flex justify-between items-center">
            <span className="flex items-center gap-1">Chat</span>
            <span className="text-slate-300 text-xs">Room: {roomCode.split('-')[0]}</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-100 relative">
              {messages.length === 0 && (
                  <div className="text-center text-slate-400 text-xs italic mt-4">No messages yet. Say hi!</div>
              )}
              {messages.map(msg => (
                  <div key={msg.id} className={`text-sm p-1.5 rounded flex items-start gap-1.5 
                    ${msg.isSystem ? 'justify-center text-xs text-slate-500 italic bg-transparent' : 
                      msg.isCorrect ? 'bg-green-100 text-green-800 border border-green-200' : 
                      msg.isClose ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                      'bg-white border border-slate-200 text-slate-800 shadow-sm'}`}>
                      {!msg.isSystem && (
                        msg.senderCustomAvatar ? (
                          <img src={msg.senderCustomAvatar} alt="" className="w-6 h-6 rounded-full border border-slate-200 object-cover shrink-0" />
                        ) : (
                          <span className="text-base select-none">{msg.senderAvatar}</span>
                        )
                      )}
                      <div className="break-all">
                        {!msg.isSystem && <span className="font-bold text-slate-600 mr-1">{msg.sender}:</span>}
                        {transformTeaMentions(msg.text)}
                      </div>
                  </div>
              ))}
              <div ref={chatEndRef} />
          </div>

          {/* Reaction Bar */}
          <div className="bg-white px-2 py-1.5 border-t border-slate-100 flex justify-around">
            {REACTIONS.map(emoji => (
                <button 
                    key={emoji}
                    onClick={() => sendReaction(emoji)}
                    className="hover:scale-125 transition-transform active:scale-95 text-lg cursor-pointer"
                >
                    {emoji}
                </button>
            ))}
          </div>

          <form onSubmit={onSendMessage} className="p-2 bg-white border-t border-slate-200 flex gap-2">
              <input 
                 className="flex-1 border border-slate-300 rounded px-2 py-1 outline-none focus:border-blue-400 bg-white text-slate-900 placeholder:text-slate-400 text-base"
                 placeholder={isMyTurn ? "You are drawing..." : "Type a guess..."}
                 value={inputMessage}
                 onChange={e => setInputMessage(e.target.value)}
                 disabled={isMyTurn || phase === GamePhase.ROUND_OVER}
              />
              <button disabled={isMyTurn} className="bg-blue-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-blue-600 disabled:opacity-50 shadow-sm">Send</button>
          </form>
      </aside>
  );
};
