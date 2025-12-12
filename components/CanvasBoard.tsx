
import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { TOOLS, ToolType, Point, DrawPoint, FillAction } from '../types';
import { audioService } from '../services/audio';

// FIXED INTERNAL RESOLUTION - This never changes!
// All coordinates are normalized to this resolution for consistency across devices
const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 900;

interface CanvasBoardProps {
  color: string;
  strokeWidth: number;
  tool: ToolType;
  disabled?: boolean;
  onDrawPoint?: (point: DrawPoint) => void;
  onStrokeEnd?: () => void;
  onFill?: (action: FillAction) => void;
}

export interface CanvasBoardHandle {
  clear: () => void;
  undo: () => void;
  fill: (x: number, y: number, color: string) => void;
  drawRemotePoint: (point: DrawPoint) => void;
  endRemoteStroke: () => void;
  getDataURL: () => string;
}

type HistoryItem = 
  | { type: 'STROKE'; points: DrawPoint[]; }
  | { type: 'FILL'; x: number; y: number; color: string; };

export const CanvasBoard = forwardRef<CanvasBoardHandle, CanvasBoardProps>(({ 
  color, 
  strokeWidth, 
  tool, 
  disabled = false,
  onDrawPoint,
  onStrokeEnd,
  onFill
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<Point | null>(null);
  
  // History Management
  const history = useRef<HistoryItem[]>([]);
  const currentStroke = useRef<DrawPoint[]>([]);
  
  // Remote state
  const currentRemoteStroke = useRef<DrawPoint[]>([]);

  // Helpers
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const floodFill = (startX: number, startY: number, fillColorStr: string) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const fillColor = hexToRgb(fillColorStr);
    const startPos = (Math.floor(startY) * width + Math.floor(startX)) * 4;
    const startR = data[startPos];
    const startG = data[startPos + 1];
    const startB = data[startPos + 2];
    const startA = data[startPos + 3];

    if (startR === fillColor.r && startG === fillColor.g && startB === fillColor.b) return;

    const stack = [[Math.floor(startX), Math.floor(startY)]];

    while (stack.length) {
      const pos = stack.pop();
      if (!pos) continue;
      const [x, y] = pos;

      const pixelPos = (y * width + x) * 4;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (data[pixelPos] !== startR || data[pixelPos + 1] !== startG || data[pixelPos + 2] !== startB) continue;

      data[pixelPos] = fillColor.r;
      data[pixelPos + 1] = fillColor.g;
      data[pixelPos + 2] = fillColor.b;
      data[pixelPos + 3] = 255;

      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Helper to ensure canvas is initialized with correct dimensions
  const ensureCanvasReady = () => {
    const canvas = canvasRef.current;
    if (!canvas) return false;
    
    if (canvas.width !== CANVAS_WIDTH || canvas.height !== CANVAS_HEIGHT) {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    return true;
  };

  const redrawHistory = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (!canvas || !ctx) return;
    
    ensureCanvasReady();

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    history.current.forEach(item => {
      if (item.type === 'FILL') {
        floodFill(item.x, item.y, item.color);
      } else if (item.type === 'STROKE') {
        if (item.points.length === 0) return;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = item.points[0].width;
        ctx.strokeStyle = item.points[0].isEraser ? '#ffffff' : item.points[0].color;
        
        ctx.beginPath();
        let p0 = item.points[0];
        ctx.moveTo(p0.x, p0.y);
        for (let i = 1; i < item.points.length; i++) {
           ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        if (item.points.length === 1) {
             ctx.lineTo(p0.x + 0.1, p0.y);
        }
        ctx.stroke();
      }
    });
  };

  const clearCanvas = () => {
      history.current = [];
      ensureCanvasReady();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });
      if (canvas && ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
  };

  const performUndo = () => {
    history.current.pop();
    redrawHistory();
  };

  useImperativeHandle(ref, () => ({
    clear: clearCanvas,
    undo: performUndo,
    fill: (x, y, c) => {
        ensureCanvasReady();
        history.current.push({ type: 'FILL', x, y, color: c });
        redrawHistory();
    },
    drawRemotePoint: (p: DrawPoint) => {
      if (p.isStarting) {
        currentRemoteStroke.current = [];
      }
      currentRemoteStroke.current.push(p);

      ensureCanvasReady();
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = p.width;
      ctx.strokeStyle = p.isEraser ? '#ffffff' : p.color;

      ctx.beginPath();
      const stroke = currentRemoteStroke.current;
      const len = stroke.length;

      if (len <= 1) {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + 0.1, p.y); 
      } else {
        const prev = stroke[len - 2];
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    },
    endRemoteStroke: () => {
      if (currentRemoteStroke.current.length > 0) {
        history.current.push({ type: 'STROKE', points: [...currentRemoteStroke.current] });
        currentRemoteStroke.current = [];
      }
    },
    getDataURL: () => {
        if (!canvasRef.current) return '';
        // Create a temporary canvas to composite against white background (handle transparency if any)
        const canvas = canvasRef.current;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return '';
        
        // Fill white first
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        // Draw original canvas over it
        ctx.drawImage(canvas, 0, 0);
        
        return tempCanvas.toDataURL('image/jpeg', 0.8);
    }
  }));

  // Initialize canvas with fixed resolution (only once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set fixed internal resolution - this is the "game world" size
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Initialize with white background
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // COORDINATE TRANSLATOR: Maps screen coordinates to canvas coordinates
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    // Get the visual size of the canvas on screen (CSS size, not internal resolution)
    const rect = canvas.getBoundingClientRect();
    
    // Calculate scale factors between CSS size and internal resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) {
        if ('changedTouches' in e && e.changedTouches.length > 0) {
          clientX = e.changedTouches[0].clientX;
          clientY = e.changedTouches[0].clientY;
        } else {
          return null;
        }
      } else {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    
    // Map screen coordinates to internal canvas coordinates
    return { 
      x: (clientX - rect.left) * scaleX, 
      y: (clientY - rect.top) * scaleY 
    };
  };

  // Get screen position for cursor display (inverse of getCoordinates)
  const getScreenPosition = (canvasPoint: Point): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    
    return {
      x: canvasPoint.x * scaleX + rect.left,
      y: canvasPoint.y * scaleY + rect.top
    };
  };
    
  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    
    if (disabled) return;
    const point = getCoordinates(e);
    if (!point) return;

    if (tool === TOOLS.FILL) {
      if (onFill) {
        onFill({ type: 'FILL', x: point.x, y: point.y, color });
      }
      history.current.push({ type: 'FILL', x: point.x, y: point.y, color });
      floodFill(point.x, point.y, color);
      audioService.playDraw(); // Play Sound
      return;
    }

    setIsDrawing(true);
    audioService.playDraw(); // Play Sound

    const startPoint: DrawPoint = {
        x: point.x,
        y: point.y,
        color,
        width: strokeWidth,
        isEraser: tool === TOOLS.ERASER,
        isStarting: true
    };
    
    currentStroke.current = [startPoint];
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    if (canvas && ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = tool === TOOLS.ERASER ? '#ffffff' : color;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(point.x + 0.1, point.y);
        ctx.stroke();
    }

    if (onDrawPoint) onDrawPoint(startPoint);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    // Cursor update
    if (!disabled && !('touches' in e)) {
        const point = getCoordinates(e);
        if (point) setCursorPos(point);
    }

    if (!isDrawing || disabled) return;
    const point = getCoordinates(e);
    if (!point) return;

    const newPoint: DrawPoint = {
        x: point.x,
        y: point.y,
        color,
        width: strokeWidth,
        isEraser: tool === TOOLS.ERASER,
        isStarting: false
    };

    currentStroke.current.push(newPoint);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d', { willReadFrequently: true });
    const stroke = currentStroke.current;
    const len = stroke.length;

    if (canvas && ctx && len > 1) {
      const prev = stroke[len - 2];
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = tool === TOOLS.ERASER ? '#ffffff' : color;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      if (onDrawPoint) onDrawPoint(newPoint);
    }
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (currentStroke.current.length > 0) {
        history.current.push({ type: 'STROKE', points: [...currentStroke.current] });
        if (onStrokeEnd) onStrokeEnd();
      }
      currentStroke.current = [];
    }
  };

  // Calculate cursor screen position for display
  const cursorScreenPos = cursorPos ? getScreenPosition(cursorPos) : null;

  return (
    <div 
        ref={containerRef} 
        className={`w-full h-full relative bg-white overflow-hidden touch-none select-none ${disabled ? 'cursor-default' : 'cursor-none'}`}
        onMouseLeave={() => setCursorPos(null)}
        style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="w-full h-full block touch-none"
        style={{ imageRendering: 'auto' }}
      />
      
      {/* Brush Cursor */}
      {!disabled && cursorScreenPos && tool !== TOOLS.FILL && (
          <div 
            className="pointer-events-none fixed rounded-full border border-slate-400 z-50 transform -translate-x-1/2 -translate-y-1/2"
            style={{ 
                left: cursorScreenPos.x, 
                top: cursorScreenPos.y,
                width: strokeWidth, 
                height: strokeWidth,
                backgroundColor: tool === TOOLS.ERASER ? 'white' : color,
                opacity: 0.8,
                boxShadow: '0 0 2px rgba(0,0,0,0.5)'
            }}
          />
      )}
    </div>
  );
});

CanvasBoard.displayName = 'CanvasBoard';
