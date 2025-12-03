
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface ConfettiHandle {
  explode: () => void;
}

export const Confetti = forwardRef<ConfettiHandle, {}>((props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<any[]>([]);
  const animationFrame = useRef<number>(0);

  const colors = ['#ef4444', '#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6'];

  const createParticle = (x: number, y: number) => {
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 1.5) * 15,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 100,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    };
  };

  const update = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.5; // Gravity
      p.life--;
      p.rotation += p.rotationSpeed;

      if (p.life <= 0) {
        particles.current.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 100;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }

    if (particles.current.length > 0) {
      animationFrame.current = requestAnimationFrame(update);
    }
  };

  useImperativeHandle(ref, () => ({
    explode: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      for (let i = 0; i < 100; i++) {
        particles.current.push(createParticle(centerX, centerY));
      }
      
      cancelAnimationFrame(animationFrame.current);
      update();
    }
  }));

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

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 pointer-events-none z-50"
    />
  );
});

Confetti.displayName = 'Confetti';
