
import { io, Socket } from 'socket.io-client';
import { GameEvent, GameSettings, GalleryItem } from '../types';

type Listener = (event: GameEvent) => void;

// Detect if running on localhost or deployed
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const SERVER_URL = isLocalhost 
  ? 'http://localhost:3001' 
  : 'https://sketchlink-server.onrender.com'; 

class MultiplayerService {
  private socket: Socket | null = null;
  private listeners: Listener[] = [];
  
  public playerId: string = '';
  public isHost: boolean = false;

  constructor() {}

  public connect(name: string, avatar: string, roomId?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket = io(SERVER_URL);

      this.socket.on('connect', () => {
        this.playerId = this.socket?.id || '';
        
        if (roomId) {
            this.socket?.emit('join_room', { roomId, name, avatar });
        } else {
            this.socket?.emit('create_room', { name, avatar });
        }
      });

      this.socket.on('room_joined', ({ roomId, playerId }) => {
          this.playerId = playerId;
          resolve(roomId);
      });

      this.socket.on('game_event', (event: GameEvent) => {
          this.notify(event);
      });

      this.socket.on('error_message', (msg: string) => {
          console.error(msg);
          reject(msg);
      });

      this.socket.on('connect_error', (err) => {
          reject("Could not connect to server");
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
