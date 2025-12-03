
import React from 'react';
import { TOOLS, ToolType, COLORS, STROKE_WIDTHS } from '../types';

interface GameToolbarProps {
  selectedColor: string;
  setSelectedColor: (c: string) => void;
  selectedWidth: number;
  setSelectedWidth: (w: number) => void;
  activeTool: ToolType;
  setActiveTool: (t: ToolType) => void;
  onUndo: () => void;
  onClear: () => void;
  isMyTurn: boolean;
}

export const GameToolbar: React.FC<GameToolbarProps> = ({
  selectedColor, setSelectedColor,
  selectedWidth, setSelectedWidth,
  activeTool, setActiveTool,
  onUndo, onClear, isMyTurn
}) => {
  return (
    <div className={`
        bg-white border-t border-slate-200
        flex flex-row items-center justify-start md:justify-center
        py-2 px-3 gap-3 md:gap-8 shrink-0 z-10 w-full overflow-x-auto shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]
        ${!isMyTurn ? 'opacity-50 pointer-events-none grayscale' : ''}
    `} style={{ scrollbarWidth: 'none' }}>
        {/* Color Palette */}
        <div className="flex flex-col gap-1.5 shrink-0">
             <div className="flex gap-1.5">
                {COLORS.slice(0, 7).map(c => (
                    <button
                        key={c}
                        onClick={() => { setSelectedColor(c); if(activeTool === TOOLS.ERASER) setActiveTool(TOOLS.PENCIL); }}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full border border-slate-300 transition-all ${selectedColor === c && activeTool !== TOOLS.ERASER ? 'ring-2 ring-slate-800 ring-offset-2 scale-110 z-10' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
             </div>
             <div className="flex gap-1.5">
                {COLORS.slice(7).map(c => (
                    <button
                        key={c}
                        onClick={() => { setSelectedColor(c); if(activeTool === TOOLS.ERASER) setActiveTool(TOOLS.PENCIL); }}
                        className={`w-7 h-7 md:w-9 md:h-9 rounded-full border border-slate-300 transition-all ${selectedColor === c && activeTool !== TOOLS.ERASER ? 'ring-2 ring-slate-800 ring-offset-2 scale-110 z-10' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                        title={c}
                    />
                ))}
             </div>
        </div>

        <div className="w-px h-10 bg-slate-200 mx-1 shrink-0"></div>

        {/* Brush Size */}
        <div className="flex flex-row gap-3 items-center shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-100">
            {STROKE_WIDTHS.map(w => (
                <button
                    key={w}
                    onClick={() => setSelectedWidth(w)}
                    className={`rounded-full bg-slate-800 transition-all ${selectedWidth === w ? 'bg-blue-600 ring-2 ring-blue-300 ring-offset-2' : 'bg-slate-300 hover:bg-slate-400'}`}
                    style={{ width: Math.max(8, w + 2), height: Math.max(8, w + 2) }}
                    title={`Size ${w}`}
                />
            ))}
        </div>

        <div className="w-px h-10 bg-slate-200 mx-1 shrink-0"></div>

        {/* Tools */}
        <div className="flex flex-row gap-2 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
             <button onClick={() => setActiveTool(TOOLS.PENCIL)} className={`p-2 rounded-lg transition-all ${activeTool === TOOLS.PENCIL ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100' : 'text-slate-400 hover:bg-slate-100'}`} title="Pencil">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
             </button>
             
             <button onClick={() => setActiveTool(TOOLS.FILL)} className={`p-2 rounded-lg transition-all ${activeTool === TOOLS.FILL ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100' : 'text-slate-400 hover:bg-slate-100'}`} title="Fill">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
             </button>

             <button onClick={() => setActiveTool(TOOLS.ERASER)} className={`p-2 rounded-lg transition-all ${activeTool === TOOLS.ERASER ? 'bg-white text-blue-600 shadow-md ring-1 ring-blue-100' : 'text-slate-400 hover:bg-slate-100'}`} title="Eraser">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                   <rect x="4" y="4" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.2" />
                   <path d="M4 14h16v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4z" />
                </svg>
             </button>
        </div>

        <div className="w-px h-10 bg-slate-200 mx-1 shrink-0"></div>

        {/* Actions */}
        <div className="flex flex-row gap-1 shrink-0">
             <button onClick={onUndo} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 active:scale-90 transition-transform" title="Undo (Ctrl+Z)">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
             </button>

             <button onClick={onClear} className="p-2 rounded-lg text-red-400 hover:bg-red-50 active:scale-90 transition-transform" title="Clear Canvas">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
             </button>
        </div>
    </div>
  );
};
