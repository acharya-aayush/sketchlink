import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

// --- Mini Canvas for Avatar Drawing ---
interface MiniCanvasProps {
  initialImage?: string | null;
  onDraw: (dataUrl: string) => void;
  size?: number;
}

const MiniCanvas: React.FC<MiniCanvasProps> = ({ initialImage, onDraw, size = 100 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);

    // Load existing image if available
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, size, size);
      };
      img.src = initialImage;
    }
  }, [initialImage, size]);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scale = size / rect.width;
    
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scale,
        y: (e.touches[0].clientY - rect.top) * scale
      };
    }
    return {
      x: (e.clientX - rect.left) * scale,
      y: (e.clientY - rect.top) * scale
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !lastPos.current) return;

    const pos = getPos(e);
    
    ctx.beginPath();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (isDrawing) {
      setIsDrawing(false);
      lastPos.current = null;
      // Save to parent on every stroke end
      const canvas = canvasRef.current;
      if (canvas) {
        onDraw(canvas.toDataURL('image/png', 0.8));
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, size, size);
    onDraw(canvas!.toDataURL('image/png', 0.8));
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="bg-white border-2 border-dashed rounded-lg border-slate-300 cursor-crosshair touch-none"
        style={{ width: size, height: size }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      <button
        onClick={clearCanvas}
        className="absolute w-6 h-6 text-xs font-bold text-red-600 bg-red-100 border border-red-300 rounded-full shadow-sm -top-2 -right-2 hover:bg-red-200"
        title="Clear"
      >
        ✕
      </button>
    </div>
  );
};

// --- Avatar Napkin Component ---
export interface AvatarNapkinRef {
  openEditor: () => void;
}

interface FunFact {
  category: string;
  text: string;
}

interface AvatarNapkinProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  playerAvatar: string;
  setPlayerAvatar: (avatar: string) => void;
  customAvatar: string | null;
  setCustomAvatar: (avatar: string | null) => void;
  mode: 'center' | 'corner'; // center = wake-up screen, corner = pinned in header
  serverProgress?: number;
  serverStatus?: 'sleeping' | 'waking' | 'ready';
  // Fun fact support
  currentFact?: FunFact;
  // Easter egg support
  teaMode?: boolean;
  gomuStretch?: boolean;
  onProgressClick?: () => void;
}

const EMOJI_OPTIONS = ['😀', '😎', '🤠', '👻', '🎨', '🦊', '🐱', '🐶', '🦁', '🐸', '🐵', '🐼', '🐷', '🐨', '🦄', '🐲'];

export const AvatarNapkin = forwardRef<AvatarNapkinRef, AvatarNapkinProps>(({
  playerName,
  setPlayerName,
  playerAvatar,
  setPlayerAvatar,
  customAvatar,
  setCustomAvatar,
  mode,
  serverProgress = 0,
  serverStatus = 'ready',
  currentFact,
  teaMode = false,
  gomuStretch = false,
  onProgressClick
}, ref) => {
  const [isEditing, setIsEditing] = useState(mode === 'center');
  const [useCustom, setUseCustom] = useState(!!customAvatar);

  // Expose openEditor method to parent
  useImperativeHandle(ref, () => ({
    openEditor: () => setIsEditing(true)
  }));

  // Auto-close editor when transitioning from center to corner
  useEffect(() => {
    if (mode === 'corner' && serverStatus === 'ready') {
      // Small delay for smooth transition feel
      const timer = setTimeout(() => setIsEditing(false), 300);
      return () => clearTimeout(timer);
    }
  }, [mode, serverStatus]);

  const handleAvatarDraw = (dataUrl: string) => {
    setCustomAvatar(dataUrl);
    setUseCustom(true);
  };

  const handleEmojiSelect = (emoji: string) => {
    setPlayerAvatar(emoji);
    setUseCustom(false);
  };

  const displayAvatar = useCustom && customAvatar ? (
    <img src={customAvatar} alt="avatar" className="object-cover w-full h-full rounded-full" />
  ) : (
    <span className="text-2xl">{playerAvatar}</span>
  );

  // --- CORNER MODE: Small pinned napkin ---
  if (mode === 'corner' && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="relative flex items-center gap-2 px-3 py-2 transition-all transform border-2 rounded-lg shadow-md group bg-amber-50 border-amber-200 hover:shadow-lg hover:scale-105 rotate-1 hover:rotate-0"
        title="Edit your profile"
      >
        {/* Tape effect */}
        <div className="absolute w-8 h-3 -translate-x-1/2 border rounded-sm -top-2 left-1/2 bg-amber-100/80 border-amber-200" />
        
        {/* Avatar */}
        <div className="flex items-center justify-center w-8 h-8 overflow-hidden bg-white border-2 rounded-full border-slate-200">
          {displayAvatar}
        </div>
        
        {/* Name */}
        <span className="font-marker text-slate-700 text-sm max-w-[80px] truncate">
          {playerName || 'You'}
        </span>
        
        {/* Edit hint */}
        <span className="text-xs transition-opacity opacity-0 group-hover:opacity-100">✏️</span>
      </button>
    );
  }

  // --- CENTER MODE or EDITING: Full napkin editor ---
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${mode === 'corner' ? 'bg-black/40 backdrop-blur-sm' : 'bg-slate-50'}`}>
      {/* Subtle grid texture background (only in center mode) - matches main menu */}
      {mode === 'center' && (
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23334155' fill-opacity='0.3'%3E%3Cpath d='M0 0h1v40H0V0zm39 0h1v40h-1V0zM0 0h40v1H0V0zm0 39h40v1H0v-1z'/%3E%3C/g%3E%3C/svg%3E")`
        }} />
      )}

      {/* The Napkin */}
      <div className={`relative bg-white rounded-xl shadow-2xl transform transition-all duration-500 ${mode === 'center' ? 'rotate-0 scale-100' : 'rotate-0 scale-100'} border-2 border-slate-200`}
           style={{ 
             boxShadow: '0 8px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.06)',
             background: '#ffffff'
           }}>
        
        {/* Decorative accent strips */}
        <div className="absolute w-12 h-5 transform border border-blue-200 rounded-sm -top-3 left-6 bg-blue-100/90 -rotate-6" />
        <div className="absolute w-12 h-5 transform border border-blue-200 rounded-sm -top-3 right-6 bg-blue-100/90 rotate-6" />
        
        {/* Close button (only in modal/corner mode) */}
        {mode === 'corner' && (
          <button
            onClick={() => setIsEditing(false)}
            className="absolute z-10 flex items-center justify-center w-8 h-8 bg-white border-2 rounded-full shadow-md -top-2 -right-2 border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700"
          >
            ✕
          </button>
        )}

        <div className="p-8 pt-10">
          {/* Title */}
          <h2 className="mb-1 text-3xl text-center font-marker text-slate-800">
            SketchLink
          </h2>
          <p className="mb-6 text-sm text-center text-slate-500">
            {mode === 'center' && serverStatus === 'waking' 
              ? "Draw yourself while we wake up the server..." 
              : "Your game identity"}
          </p>

          {/* Progress bar (only during wake-up) */}
          {mode === 'center' && serverStatus === 'waking' && (
            <div className="mb-6">
              <div 
                className={`h-3 bg-slate-200 rounded-full overflow-hidden cursor-pointer transition-transform ${gomuStretch ? 'animate-rubber-stretch scale-x-110' : ''}`}
                onClick={onProgressClick}
                title="Click me!"
              >
                <div 
                  className="h-full transition-all duration-300 ease-out bg-gradient-to-r from-blue-400 to-blue-500"
                  style={{ width: `${serverProgress}%` }}/>
              </div>
              <p className="mt-2 text-xs text-center text-slate-400">
                {teaMode ? '🍵' : '☕'} {serverProgress < 30 ? "Waking up server..." : 
                 serverProgress < 70 ? "Almost there..." : 
                 serverProgress < 95 ? "Finalizing..." : "Ready!"}
              </p>
              {/* Fun fact display */}
              {currentFact && (
                <div className="p-3 mt-4 border-2 border-blue-200 border-dashed rounded-lg bg-blue-50 animate-fade-in">
                  <div className="mb-1 text-xs font-bold tracking-wider text-blue-600 uppercase">
                    {currentFact.category}
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {currentFact.text}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Name Input */}
          <div className="mb-6">
            <label className="block mb-2 text-xs font-bold tracking-wider uppercase text-slate-500">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter name..."
              maxLength={20}
              className="w-full px-4 py-3 text-lg text-center transition-colors bg-white border-2 rounded-lg font-marker border-slate-300 focus:border-blue-400 focus:outline-none"
            />
          </div>

          {/* Avatar Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold tracking-wider uppercase text-slate-500">
                Your Avatar
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setUseCustom(false)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${!useCustom ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Emoji
                </button>
                <button
                  onClick={() => setUseCustom(true)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${useCustom ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Draw ✏️
                </button>
              </div>
            </div>

            {useCustom ? (
              <div className="flex justify-center">
                <MiniCanvas
                  initialImage={customAvatar}
                  onDraw={handleAvatarDraw}
                  size={180}
/>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8 sm:gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`text-3xl sm:text-2xl p-3 sm:p-2 rounded-xl sm:rounded-lg transition-all hover:scale-110 active:scale-95 touch-manipulation ${
                      playerAvatar === emoji && !useCustom
                        ? 'bg-blue-100 ring-2 ring-blue-400 shadow-md'
                        : 'bg-white hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center gap-3 p-4 border-2 border-dashed rounded-lg bg-slate-50 border-slate-200">
            <div className="flex items-center justify-center w-12 h-12 overflow-hidden bg-white border-2 rounded-full shadow-inner border-slate-300">
              {displayAvatar}
            </div>
            <div>
              <div className="text-lg font-marker text-slate-800">{playerName || 'Your Name'}</div>
              <div className="text-xs text-slate-400">Ready to play!</div>
            </div>
          </div>

          {/* Done button (only in modal mode) */}
          {mode === 'corner' && (
            <button
              onClick={() => setIsEditing(false)}
              className="w-full py-3 mt-4 font-bold text-white transition-colors bg-blue-500 rounded-lg shadow-sm hover:bg-blue-600"
            >
              Done ✓
            </button>
          )}
        </div>

        {/* Paper texture lines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 27px, #000 28px)'
        }} />
      </div>
    </div>
  );
});

AvatarNapkin.displayName = 'AvatarNapkin';
