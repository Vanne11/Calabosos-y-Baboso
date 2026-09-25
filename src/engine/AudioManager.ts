// engine/AudioManager.ts
// Gestor de audio del juego: música de fondo con crossfade entre pistas.
// Los efectos sintetizados y ambientes están en src/audio/ (SfxPlayer).

const FADE_DURATION = 1500; // ms
const FADE_STEPS = 30;

export class AudioManager {
  private current: HTMLAudioElement | null = null;
  private currentTrack: string | null = null;
  private _volume: number = 0.3;
  private fading: boolean = false;
  private pendingTrack: string | null = null;
  private unlocked: boolean = false;
  /** Factor temporal (0-1) para bajar la música mientras suena un jingle */
  private duckFactor: number = 1;
  private duckTimer: ReturnType<typeof setTimeout> | null = null;
  private duckFrame: number | null = null;

  constructor() {
    // Unlock audio on first user interaction
    const unlock = () => {
      this.unlocked = true;
      if (this.pendingTrack) {
        const track = this.pendingTrack;
        this.pendingTrack = null;
        this.play(track);
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('pointerdown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
  }

  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.current && !this.fading) {
      this.current.volume = this.target;
    }
  }

  /** Volumen efectivo: el configurado por el jugador, atenuado si hay un jingle sonando */
  private get target(): number {
    return this._volume * this.duckFactor;
  }

  /** Pista que está sonando (ruta) */
  get track(): string | null {
    return this.currentTrack;
  }

  /** Baja la música durante `seconds` (jingles) y la recupera suavemente */
  duck(seconds: number, factor = 0.25): void {
    if (this.duckTimer) clearTimeout(this.duckTimer);
    this.rampDuck(factor, 120);
    this.duckTimer = setTimeout(() => {
      this.duckTimer = null;
      this.rampDuck(1, 800);
    }, seconds * 1000);
  }

  private rampDuck(to: number, ms: number): void {
    if (this.duckFrame !== null) cancelAnimationFrame(this.duckFrame);
    const from = this.duckFactor;
    const start = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - start) / ms);
      this.duckFactor = from + (to - from) * p;
      if (this.current && !this.fading) this.current.volume = this.target;
      this.duckFrame = p < 1 ? requestAnimationFrame(tick) : null;
    };
    this.duckFrame = requestAnimationFrame(tick);
  }

  /** Play a track with crossfade. If same track, do nothing. */
  async play(src: string): Promise<void> {
    if (this.currentTrack === src) return;

    const next = new Audio(src);
    next.loop = true;
    next.preload = 'auto';

    // Wait for the audio to be loadable
    try {
      await new Promise<void>((resolve, reject) => {
        next.addEventListener('canplaythrough', () => resolve(), { once: true });
        next.addEventListener('error', () => reject(new Error(`No se pudo cargar: ${src}`)), { once: true });
        next.load();
      });
    } catch {
      console.warn(`[AudioManager] Audio no disponible: ${src}`);
      return;
    }

    // Set initial volume for crossfade start
    next.volume = 0;

    // Try to play
    try {
      await next.play();
    } catch (e) {
      console.warn('[AudioManager] Autoplay bloqueado, esperando interacción...', e);
      this.pendingTrack = src;
      return;
    }

    // Crossfade
    const old = this.current;
    this.current = next;
    this.currentTrack = src;
    await this.crossfade(old, next);
  }

  /** Stop music with fade out */
  async stop(): Promise<void> {
    this.pendingTrack = null;
    if (this.current) {
      await this.fadeOut(this.current);
      this.current = null;
      this.currentTrack = null;
    }
  }

  /** Pause current track */
  pause(): void {
    if (this.current) {
      this.current.pause();
    }
  }

  /** Resume current track */
  resume(): void {
    if (this.current) {
      this.current.play().catch(() => {});
    }
  }

  private crossfade(
    old: HTMLAudioElement | null,
    next: HTMLAudioElement
  ): Promise<void> {
    return new Promise((resolve) => {
      this.fading = true;
      const start = performance.now();

      const tick = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(1, elapsed / FADE_DURATION);

        if (old) {
          old.volume = Math.max(0, this.target * (1 - progress));
        }
        next.volume = this.target * progress;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          if (old) {
            old.pause();
            old.src = '';
          }
          this.fading = false;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }

  private fadeOut(audio: HTMLAudioElement): Promise<void> {
    return new Promise((resolve) => {
      this.fading = true;
      const start = performance.now();

      const tick = () => {
        const elapsed = performance.now() - start;
        const progress = Math.min(1, elapsed / FADE_DURATION);

        audio.volume = Math.max(0, this.target * (1 - progress));

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          audio.pause();
          audio.src = '';
          this.fading = false;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });
  }
}

// Singleton
export const audioManager = new AudioManager();
