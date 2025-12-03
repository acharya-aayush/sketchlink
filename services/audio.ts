
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private initialized = false;

  constructor() {
    // Lazy initialization
  }

  public init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = 0.3; // Global volume
      this.initialized = true;
    } catch (e) {
      console.error("Audio init failed", e);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOscillator(type: OscillatorType, freq: number, duration: number, startTime: number = 0) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + startTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  public playDraw() {
    if (!this.initialized) return;
    // Short noise-like pop for drawing
    this.createOscillator('triangle', 400 + Math.random() * 200, 0.05);
  }

  public playChat() {
    if (!this.initialized) return;
    // Soft bubble pop
    this.createOscillator('sine', 800, 0.1);
  }

  public playTick() {
    if (!this.initialized) return;
    // Woodblock tick
    this.createOscillator('square', 1200, 0.03);
  }

  public playCorrect() {
    if (!this.initialized) return;
    // Major Arpeggio
    const now = 0;
    this.createOscillator('sine', 523.25, 0.2, now); // C5
    this.createOscillator('sine', 659.25, 0.2, now + 0.1); // E5
    this.createOscillator('sine', 783.99, 0.4, now + 0.2); // G5
  }

  public playWin() {
    if (!this.initialized) return;
    // Fanfare
    const now = 0;
    this.createOscillator('triangle', 523.25, 0.4, now);
    this.createOscillator('triangle', 523.25, 0.2, now + 0.2);
    this.createOscillator('triangle', 523.25, 0.2, now + 0.3);
    this.createOscillator('triangle', 659.25, 0.6, now + 0.4);
  }
}

export const audioService = new AudioService();
