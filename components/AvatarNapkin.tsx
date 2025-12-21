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
        className="border-2 border-dashed border-slate-300 rounded-lg bg-white cursor-crosshair touch-none"
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
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 hover:bg-red-200 text-red-600 rounded-full text-xs font-bold border border-red-300 shadow-sm"
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
  serverStatus = 'ready'
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
    <img src={customAvatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
  ) : (
    <span className="text-2xl">{playerAvatar}</span>
  );

  // --- CORNER MODE: Small pinned napkin ---
  if (mode === 'corner' && !isEditing) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="group relative flex items-center gap-2 px-3 py-2 bg-amber-50 border-2 border-amber-200 rounded-lg shadow-md hover:shadow-lg transition-all transform hover:scale-105 rotate-1 hover:rotate-0"
        title="Edit your profile"
      >
        {/* Tape effect */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-3 bg-amber-100/80 rounded-sm border border-amber-200" />
        
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden">
          {displayAvatar}
        </div>
        
        {/* Name */}
        <span className="font-marker text-slate-700 text-sm max-w-[80px] truncate">
          {playerName || 'You'}
        </span>
        
        {/* Edit hint */}
        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">✏️</span>
      </button>
    );
  }

  // --- CENTER MODE or EDITING: Full napkin editor ---
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${mode === 'corner' ? 'bg-black/40 backdrop-blur-sm' : 'bg-amber-50'}`}>
      {/* Desk texture background (only in center mode) */}
      {mode === 'center' && (
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      )}

      {/* The Napkin */}
      <div className={`relative bg-white rounded-lg shadow-2xl transform transition-all duration-500 ${mode === 'center' ? 'rotate-1 scale-100' : 'rotate-0 scale-100'}`}
           style={{ 
             boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
             background: '#fffdf8'
           }}>
        
        {/* Tape strips */}
        <div className="absolute -top-3 left-6 w-12 h-5 bg-amber-100/90 rounded-sm border border-amber-200 transform -rotate-6" />
        <div className="absolute -top-3 right-6 w-12 h-5 bg-amber-100/90 rounded-sm border border-amber-200 transform rotate-6" />
        
        {/* Close button (only in modal/corner mode) */}
        {mode === 'corner' && (
          <button
            onClick={() => setIsEditing(false)}
            className="absolute -top-2 -right-2 w-8 h-8 bg-white border-2 border-slate-200 rounded-full shadow-md hover:bg-slate-50 flex items-center justify-center text-slate-500 hover:text-slate-700 z-10"
          >
            ✕
          </button>
        )}

        <div className="p-8 pt-10">
          {/* Title */}
          <h2 className="font-marker text-3xl text-center text-slate-800 mb-1">
            SketchLink
          </h2>
          <p className="text-center text-slate-500 text-sm mb-6">
            {mode === 'center' && serverStatus === 'waking' 
              ? "Draw yourself while we wake up the server..." 
              : "Your game identity"}
          </p>

          {/* Progress bar (only during wake-up) */}
          {mode === 'center' && serverStatus === 'waking' && (
            <div className="mb-6">
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 transition-all duration-300 ease-out"
                  style={{ width: `${serverProgress}%` }}/>
              </div>
              <p className="text-center text-xs text-slate-400 mt-1">
                {serverProgress < 30 ? "Waking up server..." : 
                 serverProgress < 70 ? "Almost there..." : 
                 serverProgress < 95 ? "Finalizing..." : "Ready!"}
              </p>
            </div>
          )}

          {/* Name Input */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter name..."
              maxLength={20}
              className="w-full px-4 py-3 text-lg font-marker border-2 border-dashed border-slate-300 rounded-lg bg-white/50 focus:border-amber-400 focus:outline-none transition-colors text-center"
            />
          </div>

          {/* Avatar Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Your Avatar
              </label>
              <div className="flex gap-1">
                <button
                  onClick={() => setUseCustom(false)}
                  className={`px-2 py-1 text-xs rounded ${!useCustom ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                >
                  Emoji
                </button>
                <button
                  onClick={() => setUseCustom(true)}
                  className={`px-2 py-1 text-xs rounded ${useCustom ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
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
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`text-2xl p-2 rounded-lg transition-all hover:scale-110 ${
                      playerAvatar === emoji && !useCustom
                        ? 'bg-amber-200 ring-2 ring-amber-400'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
            <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center overflow-hidden shadow-inner">
              {displayAvatar}
            </div>
            <div>
              <div className="font-marker text-lg text-slate-800">{playerName || 'Your Name'}</div>
              <div className="text-xs text-slate-400">Ready to play!</div>
            </div>
          </div>

          {/* Done button (only in modal mode) */}
          {mode === 'corner' && (
            <button
              onClick={() => setIsEditing(false)}
              className="w-full mt-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-sm transition-colors"
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
