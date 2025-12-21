
import { io, Socket } from 'socket.io-client';
import { GameEvent, GameSettings, GalleryItem } from '../types';

type Listener = (event: GameEvent) => void;

// Get server URL from environment variable
// Vite exposes env vars with import.meta.env
const getServerUrl = () => {
  // Check for environment variable first
  const envUrl = import.meta.env.VITE_SERVER_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback: localhost for development
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3001';
    }
  }
  
  // No env var set and not localhost - warn developer
  console.warn('VITE_SERVER_URL not set! Set it in .env or Vercel/Netlify dashboard.');
  return 'http://localhost:3001';
};

const SERVER_URL = getServerUrl();

// For wake up server, check hostname at call time
const isLocalhost = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1';
  }
  return false;
};

// Wake up the server (Render free tier sleeps after 15 min)
export async function wakeUpServer(): Promise<boolean> {
  if (isLocalhost()) return true; // No need to wake up localhost
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch(`${SERVER_URL}/health`, { 
      signal: controller.signal,
      mode: 'cors'
    });
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Server wake-up attempt:', error);
    // Even if fetch fails, the server might be waking up
    // Socket.io will retry connection anyway
    return false;
  }
}

class MultiplayerService {
  private socket: Socket | null = null;
  private listeners: Listener[] = [];
  
  public playerId: string = '';
  public isHost: boolean = false;

  constructor() {}

  public connect(name: string, avatar: string, roomId?: string, customAvatar?: string | null): Promise<string> {
    return new Promise((resolve, reject) => {
      // Disconnect any existing connection first
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }

      // Configure Socket.io for better mobile compatibility
      this.socket = io(SERVER_URL, {
        transports: ['polling', 'websocket'], // Start with polling, upgrade to websocket
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true, // Force a new connection
      });

      let resolved = false;

      // Add timeout for initial connection
      const connectionTimeout = setTimeout(() => {
        if (!resolved && this.socket && !this.socket.connected) {
          this.socket.disconnect();
          reject("Connection timeout - server may be waking up. Please try again.");
        }
      }, 25000);

      this.socket.on('connect', () => {
        clearTimeout(connectionTimeout);
        console.log('Socket connected:', this.socket?.id);
        this.playerId = this.socket?.id || '';
        
        // Build payload with optional customAvatar
        const payload = { name, avatar, customAvatar: customAvatar || undefined };
        
        if (roomId) {
            this.socket?.emit('join_room', { roomId, ...payload });
        } else {
            this.socket?.emit('create_room', payload);
        }
      });

      this.socket.on('room_joined', ({ roomId: joinedRoomId, playerId }) => {
          resolved = true;
          this.playerId = playerId;
          resolve(joinedRoomId);
      });

      this.socket.on('game_event', (event: GameEvent) => {
          this.notify(event);
      });

      this.socket.on('error_message', (msg: string) => {
          console.error('Server error:', msg);
          resolved = true;
          clearTimeout(connectionTimeout);
          reject(msg);
      });

      this.socket.on('connect_error', (err) => {
          console.error('Connection error:', err);
          if (!resolved) {
            clearTimeout(connectionTimeout);
            reject("Could not connect to server. Please check your internet connection.");
          }
      });
    });
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public send(event: GameEvent) {
    if (this.socket) {
      this.socket.emit('game_event', event);
    }
  }

  // --- Server Actions ---

  public updateSettings(settings: GameSettings) {
      this.socket?.emit('update_settings', settings);
  }

  public startGame() {
      this.socket?.emit('start_game');
  }

  public getWordOptions(): Promise<string[]> {
      return new Promise((resolve) => {
          this.socket?.emit('get_words', (words: string[]) => {
              resolve(words);
          });
      });
  }

  public selectWord(word: string) {
      this.socket?.emit('select_word', word);
  }

  public addToGallery(item: GalleryItem) {
      // We send a special event type for the server to intercept
      // @ts-ignore - hacking the type system slightly for internal server event
      this.socket?.emit('game_event', { type: 'ADD_GALLERY_ITEM', payload: item });
  }

  // --- Event System ---

  public onEvent(callback: Listener) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notify(event: GameEvent) {
    this.listeners.forEach(l => l(event));
  }
}

export const multiplayer = new MultiplayerService();
