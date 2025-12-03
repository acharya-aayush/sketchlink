
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
  avatar: string;
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
  | { type: 'DRAW_POINT'; payload: DrawPoint }
  | { type: 'END_STROKE' }
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
  ERASER: 'eraser',
  FILL: 'fill',
} as const;

export type ToolType = typeof TOOLS[keyof typeof TOOLS];

export const COLORS = [
  '#000000', // Black
  '#475569', // Slate
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#78350f', // Brown
  '#ffffff', // White
];

export const STROKE_WIDTHS = [2, 5, 10, 20];
