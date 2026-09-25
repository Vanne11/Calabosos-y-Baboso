// audio/SfxPlayer.ts
// Reproductor de efectos sintetizados, ambientes en bucle y voces de diálogo.
// Singleton `sfx`. El AudioContext se crea al primer uso y se reanuda con la primera interacción.

import { SFX, voiceBlips } from './sfxCatalog';
import { AMBIENCES } from './ambience';
import { audioManager } from '../engine/AudioManager';

const AMBIENCE_FADE = 2; // s
const AMBIENCE_TICK = 250; // ms
/** No repetir el mismo efecto más seguido que esto (evita "metralletas" de monedas) */
const MIN_REPEAT = 0.06; // s

interface ActiveAmbience {
  name: string;
  gain: GainNode;
  stop: () => void;
  timer: ReturnType<typeof setInterval> | null;
}

export class SfxPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambienceBus: GainNode | null = null;
  private ambience: ActiveAmbience | null = null;
  private wantedAmbience: string | null = null;
  private lastPlayed = new Map<string, number>();
  private _volume = 0.7;
  private _voices = true;

  constructor() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      const ctx = this.ensure();
      if (!ctx) return;
      // Un ambiente pedido antes de que el navegador dejara sonar audio arranca ahora
      const retry = () => {
        if (this.wantedAmbience && !this.ambience) this.setAmbience(this.wantedAmbience);
      };
      if (ctx.state === 'running') retry();
      else ctx.resume().then(retry).catch(() => {});
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  get volume(): number {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
  }

  /** Voces (blips) al mostrar líneas de diálogo */
  get voices(): boolean {
    return this._voices;
  }

  set voices(on: boolean) {
    this._voices = on;
  }

  /** Si el nombre existe en el catálogo */
  has(name: string): boolean {
    return name in SFX;
  }

  private ensure(): AudioContext | null {
    if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        return null;
      }
      this.master = this.ctx.createGain();
      this.master.gain.value = this._volume;
      // Compresor suave: varios efectos a la vez no saturan
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      this.master.connect(comp).connect(this.ctx.destination);
      this.ambienceBus = this.ctx.createGain();
      this.ambienceBus.gain.value = 0.8;
      this.ambienceBus.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  /**
   * Reproduce un efecto del catálogo. Devuelve su duración en segundos (0 si no sonó).
   * `volume` escala el efecto (0-1+).
   */
  play(name: string, volume = 1): number {
    const def = SFX[name];
    if (!def) {
      console.warn(`[sfx] Efecto desconocido: ${name}`);
      return 0;
    }
    if (this._volume <= 0) return 0;
    const ctx = this.ensure();
    if (!ctx || !this.master || ctx.state !== 'running') return 0;
    const now = ctx.currentTime;
    if (now - (this.lastPlayed.get(name) ?? -1) < MIN_REPEAT) return 0;
    this.lastPlayed.set(name, now);

    const out = ctx.createGain();
    out.gain.value = volume;
    out.connect(this.master);
    const t = now + 0.01;
    let end = t;
    try {
      end = def.play({ ctx, out, t });
    } catch (e) {
      console.warn(`[sfx] Error al sintetizar ${name}`, e);
    }
    const duration = Math.max(0, end - t);
    setTimeout(() => out.disconnect(), (duration + 0.5) * 1000);
    if (def.jingle) audioManager.duck(duration + 0.2);
    return duration;
  }

  /** Blips de voz para una línea de diálogo */
  voice(character: string, text: string): void {
    if (!this._voices || this._volume <= 0) return;
    const ctx = this.ensure();
    if (!ctx || !this.master || ctx.state !== 'running') return;
    voiceBlips({ ctx, out: this.master, t: ctx.currentTime + 0.01 }, character, text);
  }

  /**
   * Cambia el ambiente en bucle con fundido. null lo apaga.
   * Si el navegador aún no deja sonar audio, queda pendiente hasta la primera interacción.
   */
  setAmbience(name: string | null): void {
    this.wantedAmbience = name;
    if (this.ambience?.name === name) return;
    const ctx = this.ensure();
    if (!ctx || !this.ambienceBus) return;

    if (this.ambience) {
      const old = this.ambience;
      this.ambience = null;
      if (old.timer) clearInterval(old.timer);
      old.gain.gain.cancelScheduledValues(ctx.currentTime);
      old.gain.gain.setValueAtTime(old.gain.gain.value, ctx.currentTime);
      old.gain.gain.linearRampToValueAtTime(0, ctx.currentTime + AMBIENCE_FADE);
      setTimeout(() => {
        old.stop();
        old.gain.disconnect();
      }, AMBIENCE_FADE * 1000 + 100);
    }

    if (!name) return;
    const def = AMBIENCES[name];
    if (!def) {
      console.warn(`[sfx] Ambiente desconocido: ${name}`);
      return;
    }
    if (ctx.state !== 'running') return; // se reintenta en la primera interacción

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + AMBIENCE_FADE);
    gain.connect(this.ambienceBus);
    const stop = def.bed(ctx, gain);
    const timer = def.tick
      ? setInterval(() => {
          if (ctx.state === 'running') def.tick!({ ctx, out: gain, t: ctx.currentTime + 0.05 });
        }, AMBIENCE_TICK)
      : null;
    this.ambience = { name, gain, stop, timer };
  }

  get currentAmbience(): string | null {
    return this.wantedAmbience;
  }

  /** Apaga el ambiente (salir del juego) */
  stopAll(): void {
    this.setAmbience(null);
  }
}

export const sfx = new SfxPlayer();
