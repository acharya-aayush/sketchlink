
export enum GamePhase {
  LOBBY = 'LOBBY',
  WORD_SELECT = 'WORD_SELECT',
  DRAWING = 'DRAWING',
  ROUND_OVER = 'ROUND_OVER',
  GAME_OVER = 'GAME_OVER',
}

export interface GameSettings {
  rounds: number;
  drawTime: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  customWords: string; // Comma separated
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawPoint extends Point {
  color: string;
  width: number;
  isStarting: boolean; // True if this is a new stroke
  isEraser: boolean;
}

export interface FillAction {
  type: 'FILL';
  x: number;
  y: number;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderAvatar?: string; // Optional for system messages
  text: string;
  isSystem?: boolean;
  isCorrect?: boolean;
  isClose?: boolean; // New: For close calls
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string; // Emoji avatar (fallback)
  customAvatar?: string; // Base64 PNG of hand-drawn avatar
  score: number;
  isHost: boolean;
  isDrawer: boolean;
}

export interface GalleryItem {
  id: string;
  word: string;
  drawer: string;
  image: string; // Base64 data URL
}

// Events sent over the network
export type GameEvent = 
  | { type: 'SYNC_STATE'; payload: any }
  | { type: 'SYNC_PLAYERS'; payload: Player[] }
  | { type: 'SYNC_SETTINGS'; payload: GameSettings }
  | { type: 'SYNC_GALLERY'; payload: GalleryItem[] }
  | { type: 'SYNC_DRAWING'; payload: GameEvent[] }
  | { type: 'DRAW'; payload: DrawPoint }
  | { type: 'DRAW_POINT'; payload: DrawPoint }
  | { type: 'STROKE_END' }
  | { type: 'END_STROKE' }
  | { type: 'FILL'; payload: FillAction }
  | { type: 'FILL_CANVAS'; payload: FillAction }
  | { type: 'UNDO_ACTION' }
  | { type: 'CLEAR_CANVAS' }
  | { type: 'CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'PLAYER_JOINED'; payload: Player }
  | { type: 'START_ROUND'; payload: { wordLength: number; drawerId: string } }
  | { type: 'WORD_SELECTED'; payload: { duration: number } }
  | { type: 'EMOJI_REACTION'; payload: { emoji: string; senderId: string } };

export const TOOLS = {
  PENCIL: 'pencil',
  MARKER: 'marker',
  ERASER: 'eraser',
  FILL: 'fill',
} as const;

export type ToolType = typeof TOOLS[keyof typeof TOOLS];

// Expanded color palette - vibrant + classic + essentials
export const COLORS = [
  // Row 1: Basics
  '#000000', // Pure Black
  '#4A4A4A', // Dark Gray
  '#9E9E9E', // Medium Gray  
  '#FFFFFF', // White
  // Row 2: Warm colors
  '#FF0000', // Red
  '#FF5722', // Deep Orange
  '#FF9800', // Orange
  '#FFEB3B', // Yellow
  // Row 3: Cool colors
  '#4CAF50', // Green
  '#00BCD4', // Cyan
  '#2196F3', // Blue
  '#9C27B0', // Purple
  // Row 4: Pastels & extras
  '#E91E63', // Pink
  '#8BC34A', // Light Green
  '#03A9F4', // Light Blue
  '#795548', // Brown
];

// Alternative skin tones (for avatars etc)
export const SKIN_TONES = [
  '#FFDFC4', // Light
  '#F0C08A', // Medium-light
  '#D4A574', // Medium
  '#8D5524', // Medium-dark
  '#5C4033', // Dark
];

export const STROKE_WIDTHS = [3, 8, 16, 28];
