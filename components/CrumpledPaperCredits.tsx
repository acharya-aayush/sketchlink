
import React, { useState } from 'react';

interface CrumpledPaperCreditsProps {
  show?: boolean; // Only show on certain screens (lobby)
}

// SVG Icons for social links
const GitHubIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

// Easter egg crumpled paper credits - unfolds on click
export const CrumpledPaperCredits: React.FC<CrumpledPaperCreditsProps> = ({ show = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const socialLinks = [
    { icon: <GitHubIcon />, label: 'GitHub', url: 'https://github.com/acharya-aayush' },
    { icon: <InstagramIcon />, label: 'Instagram', url: 'https://www.instagram.com/acharya.404/' },
    { icon: <LinkedInIcon />, label: 'LinkedIn', url: 'https://www.linkedin.com/in/acharyaaayush/' },
    { icon: <GlobeIcon />, label: 'Portfolio', url: 'https://acharyaaayush8080.vercel.app/' },
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
        <span className="text-sm font-medium tracking-wide select-none text-slate-500 hover:text-slate-700">Credits</span>
      </button>

      {/* Unfolding credits panel - Slate/Blue theme to match app */}
      <div
        className={`absolute bottom-10 left-0 bg-white border border-slate-200 rounded-lg shadow-lg
          transition-all duration-500 ease-out origin-bottom-left
          ${isOpen 
            ? 'opacity-100 scale-100 translate-y-0' 
            : 'opacity-0 scale-50 translate-y-4 pointer-events-none'
          }`}
      >
        <div className="p-4 min-w-56">
          <div className="space-y-3 text-slate-700">
            <div className="pb-2 mb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold tracking-wide text-center text-slate-800">Credits</h3>
            </div>
            
            <p className="text-sm leading-relaxed">
              Crafted by{' '}
              <span className="font-semibold text-blue-600">Aayush Acharya</span>
            </p>
            
            <p className="text-xs italic text-slate-400">
              "One Piece is Real"
            </p>
            
            {/* Social Links */}
            <div className="pt-3 mt-3 border-t border-slate-100">
              <div className="flex flex-wrap gap-2">
                {socialLinks.map(link => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-colors bg-slate-50 border rounded border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 text-slate-600"
                    title={link.label}
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Secret message */}
            <p className="mt-2 text-[10px] text-slate-400 text-center">
              Try typing "TEA" during loading
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
