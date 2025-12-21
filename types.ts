
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

// Curated "Ink & Paper" color palette - natural, sketch-friendly colors
export const COLORS = [
  '#2C2C2C', // Ink Black (soft black)
  '#5A5A5A', // Pencil Lead
  '#8B7355', // Sepia
  '#1A4593', // Blue Pen
  '#2D5016', // Forest Green
  '#8B1538', // Burgundy
  '#6B3FA0', // Violet
  '#C65102', // Rust Orange
  '#B8860B', // Dark Goldenrod
  '#20B2AA', // Teal
  '#CD5C5C', // Indian Red
  '#F9F7F2', // Paper White (creamy)
];

// Highlighter colors (semi-transparent)
export const HIGHLIGHTERS = [
  '#FDFD9666', // Yellow
  '#90EE9066', // Light Green
  '#FFB6C166', // Pink
  '#87CEEB66', // Sky Blue
];

export const STROKE_WIDTHS = [3, 8, 16, 28];
