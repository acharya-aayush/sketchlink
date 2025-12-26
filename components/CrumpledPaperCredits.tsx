
import React, { useState } from 'react';

interface CrumpledPaperCreditsProps {
  show?: boolean; // Only show on certain screens (lobby)
}

// Easter egg crumpled paper credits - unfolds on click
export const CrumpledPaperCredits: React.FC<CrumpledPaperCreditsProps> = ({ show = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const socialLinks = [
    { icon: '🐙', label: 'GitHub', url: 'https://github.com/acharya-aayush' },
    { icon: '📸', label: 'Insta', url: 'https://www.instagram.com/acharya.404/' },
    { icon: '💼', label: 'LinkedIn', url: 'https://www.linkedin.com/in/acharyaaayush/' },
    { icon: '🌐', label: 'Portfolio', url: 'https://acharyaaayush8080.vercel.app/' },
  ];

  // Don't render if not on appropriate screen
  if (!show) return null;

  return (
    <div className="fixed z-50 hidden bottom-4 left-4 md:block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`transition-all duration-500 ease-out cursor-pointer hover:scale-110 ${
          isOpen ? 'rotate-0' : 'rotate-12 hover:rotate-6'
        }`}
        title="Click me!"
      >
        <span className="text-2xl select-none drop-shadow-md">📜</span>
      </button>

      {/* Unfolding credits panel - Slate/Blue theme to match app */}
      <div
        className={`absolute bottom-10 left-0 bg-slate-50 border-2 border-slate-300 rounded-xl shadow-xl
          transition-all duration-500 ease-out origin-bottom-left
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-50 translate-y-4 pointer-events-none'
          }`}
        style={{
          boxShadow: isOpen 
            ? '4px 4px 0 rgba(100, 116, 139, 0.2), inset 0 0 20px rgba(255,255,255,0.5)' 
            : 'none',
        }}
      >
        <div className="p-4 min-w-52">
          <div className="space-y-2 font-marker text-slate-700">
            <div className="flex items-center justify-center gap-2 pb-2 mb-3 text-base font-bold text-center border-b-2 border-dashed border-slate-200">
              <span>✏️</span> Credits
            </div>
            
            <p className="text-sm leading-relaxed">
              Made with <span className="animate-pulse">☕</span> by{' '}
              <span className="font-bold text-blue-600">Aayush</span>
            </p>
            
            <p className="mt-2 text-xs italic text-slate-500">
              One Piece is Real😌✌️
            </p>
            
            {/* Social Links */}
            <div className="pt-2 mt-3 border-t-2 border-dashed border-slate-200">
              <div className="flex flex-wrap gap-1.5">
                {socialLinks.map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-1.5 py-0.5 text-[11px] transition-colors bg-white border rounded-md border-slate-200 hover:bg-blue-50 hover:border-blue-300"
                    title={link.label}
                  >
                    <span>{link.icon}</span>
                    <span className="text-slate-600">{link.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Secret message */}
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              Try typing "TEA" during loading 🤫
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
