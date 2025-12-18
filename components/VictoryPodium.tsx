import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Player } from '../types';

export interface VictoryPodiumHandle {
  show: (players: Player[]) => void;
  showDemo: () => void;
  hide: () => void;
}

interface VictoryPodiumProps {
  onComplete?: () => void;
}

interface PodiumPlayer {
  name: string;
  avatar: string;
  score: number;
  rank: number;
}

// Enhanced confetti particle
class ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  friction: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'square' | 'circle' | 'star';

  constructor(canvasWidth: number, canvasHeight: number) {
    // Spawn from multiple positions for more dramatic effect
    const spawnX = canvasWidth / 2 + (Math.random() - 0.5) * 200;
    this.x = spawnX;
    this.y = canvasHeight * 0.3;
    
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 18 + 8;
    
    this.vx = Math.cos(angle) * velocity;
    this.vy = Math.sin(angle) * velocity - 5;
    
    this.gravity = 0.35;
    this.friction = 0.98;
    
    // Golden and celebratory colors
    const colorPalettes = [
      `hsl(${Math.random() * 50 + 35}, 100%, 50%)`, // Golds
      `hsl(${Math.random() * 360}, 80%, 60%)`, // Rainbow
      '#FFD700', '#FFC107', '#FF9800', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4'
    ];
    this.color = colorPalettes[Math.floor(Math.random() * colorPalettes.length)];
    
    this.size = Math.random() * 10 + 5;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 15;
    this.opacity = 1;
    this.shape = ['square', 'circle', 'star'][Math.floor(Math.random() * 3)] as any;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.rotation += this.rotationSpeed;
    this.opacity -= 0.004;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation * Math.PI / 180);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    
    if (this.shape === 'square') {
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Star shape
      this.drawStar(ctx, 0, 0, 5, this.size / 2, this.size / 4);
    }
    ctx.restore();
  }

  drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}

export const VictoryPodium = forwardRef<VictoryPodiumHandle, VictoryPodiumProps>(({ onComplete }, ref) => {
  const [isVisible, setIsVisible] = useState(false);
  const [podiumPlayers, setPodiumPlayers] = useState<PodiumPlayer[]>([]);
  const [activeSlots, setActiveSlots] = useState<number[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationRef = useRef<number>(0);

  // Demo players for "Victorymation" cheat
  const demoPlayers: PodiumPlayer[] = [
    { name: 'King Lion', avatar: '🦁', score: 1500, rank: 1 },
    { name: 'Tiny Mouse', avatar: '🐭', score: 1200, rank: 2 },
    { name: 'Strong Ox', avatar: '🐂', score: 950, rank: 3 },
  ];

  useImperativeHandle(ref, () => ({
    show: (players: Player[]) => {
      const sorted = [...players].sort((a, b) => b.score - a.score);
      const topThree = sorted.slice(0, 3).map((p, i) => ({
        name: p.name,
        avatar: p.avatar,
        score: p.score,
        rank: i + 1
      }));
      setPodiumPlayers(topThree);
      setActiveSlots([]);
      setShowConfetti(false);
      setIsVisible(true);
    },
    showDemo: () => {
      setPodiumPlayers(demoPlayers);
      setActiveSlots([]);
      setShowConfetti(false);
      setIsVisible(true);
    },
    hide: () => {
      setIsVisible(false);
      setActiveSlots([]);
      setShowConfetti(false);
      particlesRef.current = [];
    }
  }));

  // Reveal sequence
  useEffect(() => {
    if (!isVisible || podiumPlayers.length === 0) return;

    const sequence = async () => {
      await new Promise(r => setTimeout(r, 800)); // Initial darkness
      
      // Reveal 3rd place
      if (podiumPlayers.length >= 3) {
        setActiveSlots(prev => [...prev, 3]);
        await new Promise(r => setTimeout(r, 1500));
      }
      
      // Reveal 2nd place
      if (podiumPlayers.length >= 2) {
        setActiveSlots(prev => [...prev, 2]);
        await new Promise(r => setTimeout(r, 1500));
      }
      
      // Reveal 1st place (winner!)
      setActiveSlots(prev => [...prev, 1]);
      await new Promise(r => setTimeout(r, 500));
      
      // CONFETTI EXPLOSION!
      setShowConfetti(true);
      startConfetti();
      
      // Call onComplete after animation finishes
      setTimeout(() => {
        onComplete?.();
      }, 3000);
    };

    sequence();
  }, [isVisible, podiumPlayers]);

  // Confetti animation
  const startConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create multiple bursts
    for (let burst = 0; burst < 3; burst++) {
      setTimeout(() => {
        for (let i = 0; i < 80; i++) {
          particlesRef.current.push(new ConfettiParticle(canvas.width, canvas.height));
        }
      }, burst * 200);
    }

    animateConfetti();
  };

  const animateConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const particle of particlesRef.current) {
      particle.update();
      particle.draw(ctx);
    }

    particlesRef.current = particlesRef.current.filter(
      p => p.opacity > 0 && p.y < canvas.height + 50
    );

    if (particlesRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animateConfetti);
    }
  };

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!isVisible) return null;

  const getPlayerByRank = (rank: number) => podiumPlayers.find(p => p.rank === rank);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 animate-fade-in" />
      
      {/* Stars background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              opacity: Math.random() * 0.7 + 0.3
            }}
          />
        ))}
      </div>

      {/* Title */}
      <div className={`absolute top-8 left-0 right-0 text-center transition-all duration-1000 ${activeSlots.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
        <h1 className="text-4xl md:text-6xl font-marker text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 drop-shadow-lg animate-pulse">
          🏆 VICTORY 🏆
        </h1>
      </div>

      {/* Confetti Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-50"
      />

      {/* Podium Stage */}
      <div className="relative flex items-end justify-center gap-3 md:gap-6 px-4 mt-16 w-full max-w-3xl">
        {/* 2nd Place (Left) */}
        {podiumPlayers.length >= 2 && (
          <div className={`podium-slot w-1/4 md:w-1/3 transition-all duration-700 ${activeSlots.includes(2) ? 'active' : ''}`}>
            {/* Light Cone */}
            <div className={`light-cone light-silver ${activeSlots.includes(2) ? 'active' : ''}`} />
            
            {/* Podium Content */}
            <div className={`podium-content ${activeSlots.includes(2) ? 'revealed' : ''}`}>
              <div className="avatar-container">
                <div className={`avatar text-4xl md:text-6xl ${activeSlots.includes(2) ? 'animate-bounce-avatar' : ''}`}>
                  {getPlayerByRank(2)?.avatar || '🥈'}
                </div>
                <div className="name text-white text-sm md:text-lg font-bold mt-2 truncate max-w-full px-2">
                  {getPlayerByRank(2)?.name || 'Runner Up'}
                </div>
                <div className="score text-yellow-300 text-xs md:text-sm font-bold">
                  {getPlayerByRank(2)?.score || 0} pts
                </div>
              </div>
              <div className="podium-block h-32 md:h-44 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-lg flex items-center justify-center shadow-inner">
                <span className="text-4xl md:text-6xl font-bold text-slate-500/30">2</span>
              </div>
            </div>
          </div>
        )}

        {/* 1st Place (Center) */}
        {podiumPlayers.length >= 1 && (
          <div className={`podium-slot w-1/3 md:w-2/5 transition-all duration-700 ${activeSlots.includes(1) ? 'active' : ''}`}>
            {/* Light Cone - Golden */}
            <div className={`light-cone light-gold ${activeSlots.includes(1) ? 'active' : ''}`} />
            
            {/* Crown animation */}
            <div className={`absolute -top-8 left-1/2 transform -translate-x-1/2 text-4xl md:text-5xl transition-all duration-500 ${activeSlots.includes(1) ? 'opacity-100 scale-100 animate-crown-drop' : 'opacity-0 scale-0'}`}>
              👑
            </div>
            
            {/* Podium Content */}
            <div className={`podium-content ${activeSlots.includes(1) ? 'revealed' : ''}`}>
              <div className="avatar-container">
                <div className={`avatar text-5xl md:text-7xl ${activeSlots.includes(1) ? 'animate-winner-bounce' : ''}`}>
                  {getPlayerByRank(1)?.avatar || '🥇'}
                </div>
                <div className="name text-white text-base md:text-xl font-bold mt-2 truncate max-w-full px-2">
                  {getPlayerByRank(1)?.name || 'Winner'}
                </div>
                <div className="score text-yellow-300 text-sm md:text-base font-bold">
                  {getPlayerByRank(1)?.score || 0} pts
                </div>
              </div>
              <div className="podium-block h-44 md:h-60 bg-gradient-to-b from-yellow-200 via-yellow-300 to-yellow-400 rounded-t-lg flex items-center justify-center shadow-inner border-2 border-yellow-500/30">
                <span className="text-5xl md:text-7xl font-bold text-yellow-600/30">1</span>
              </div>
            </div>

            {/* Glow effect for winner */}
            <div className={`absolute inset-0 -bottom-20 bg-yellow-400/20 blur-3xl rounded-full transition-opacity duration-1000 ${activeSlots.includes(1) ? 'opacity-100' : 'opacity-0'}`} />
          </div>
        )}

        {/* 3rd Place (Right) */}
        {podiumPlayers.length >= 3 && (
          <div className={`podium-slot w-1/4 md:w-1/3 transition-all duration-700 ${activeSlots.includes(3) ? 'active' : ''}`}>
            {/* Light Cone */}
            <div className={`light-cone light-bronze ${activeSlots.includes(3) ? 'active' : ''}`} />
            
            {/* Podium Content */}
            <div className={`podium-content ${activeSlots.includes(3) ? 'revealed' : ''}`}>
              <div className="avatar-container">
                <div className={`avatar text-3xl md:text-5xl ${activeSlots.includes(3) ? 'animate-bounce-avatar' : ''}`}>
                  {getPlayerByRank(3)?.avatar || '🥉'}
                </div>
                <div className="name text-white text-sm md:text-base font-bold mt-2 truncate max-w-full px-2">
                  {getPlayerByRank(3)?.name || 'Third'}
                </div>
                <div className="score text-yellow-300 text-xs md:text-sm font-bold">
                  {getPlayerByRank(3)?.score || 0} pts
                </div>
              </div>
              <div className="podium-block h-24 md:h-36 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg flex items-center justify-center shadow-inner">
                <span className="text-3xl md:text-5xl font-bold text-amber-800/30">3</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <button
        onClick={() => setIsVisible(false)}
        className={`absolute bottom-8 px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur border border-white/30 rounded-full text-white font-bold text-lg transition-all duration-500 ${activeSlots.includes(1) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
      >
        Continue →
      </button>

      <style>{`
        .podium-slot {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .light-cone {
          position: absolute;
          top: -300px;
          left: 50%;
          transform: translateX(-50%);
          width: 250%;
          height: 0;
          opacity: 0;
          pointer-events: none;
          clip-path: polygon(50% 0%, 15% 100%, 85% 100%);
          filter: blur(8px);
          transition: height 1.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 1s ease;
          z-index: 1;
        }

        .light-cone.active {
          height: 600px;
          opacity: 1;
        }

        .light-silver {
          background: linear-gradient(
            180deg,
            rgba(200, 200, 220, 0.6) 0%,
            rgba(200, 200, 220, 0.1) 60%,
            transparent 100%
          );
        }

        .light-gold {
          background: linear-gradient(
            180deg,
            rgba(255, 215, 100, 0.7) 0%,
            rgba(255, 215, 100, 0.2) 60%,
            transparent 100%
          );
        }

        .light-bronze {
          background: linear-gradient(
            180deg,
            rgba(205, 127, 50, 0.5) 0%,
            rgba(205, 127, 50, 0.1) 60%,
            transparent 100%
          );
        }

        .podium-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          opacity: 0;
          filter: grayscale(100%);
          transform: translateY(20px);
          transition: opacity 1.5s ease, filter 1.5s ease, transform 0.8s ease;
          z-index: 10;
        }

        .podium-content.revealed {
          opacity: 1;
          filter: grayscale(0%);
          transform: translateY(0);
        }

        .avatar-container {
          text-align: center;
          margin-bottom: 12px;
        }

        .podium-block {
          width: 100%;
          min-width: 80px;
        }

        @keyframes bounce-avatar {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }

        @keyframes winner-bounce {
          0%, 100% { transform: translateY(0) scale(1); }
          25% { transform: translateY(-15px) scale(1.15); }
          50% { transform: translateY(0) scale(1.05); }
          75% { transform: translateY(-8px) scale(1.1); }
        }

        @keyframes crown-drop {
          0% { transform: translateX(-50%) translateY(-50px) rotate(-20deg); opacity: 0; }
          50% { transform: translateX(-50%) translateY(10px) rotate(10deg); opacity: 1; }
          75% { transform: translateX(-50%) translateY(-5px) rotate(-5deg); }
          100% { transform: translateX(-50%) translateY(0) rotate(0deg); }
        }

        .animate-bounce-avatar {
          animation: bounce-avatar 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-winner-bounce {
          animation: winner-bounce 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .animate-crown-drop {
          animation: crown-drop 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        @media (max-width: 640px) {
          .light-cone {
            width: 200%;
            top: -200px;
          }
          .light-cone.active {
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
});

VictoryPodium.displayName = 'VictoryPodium';
