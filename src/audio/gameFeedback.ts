// audio/gameFeedback.ts
// Respuesta audiovisual a los cambios de estado del jugador: compara con la última
// observación y dispara efectos (sonido, sacudida, destello, cifras flotantes).

import type { PlayerState } from '../types/engine';
import type { AudioConfig } from '../types/game';
import { snapshot, diffState, cueFor, type StateSnapshot } from './feedback';
import { sfx } from './SfxPlayer';
import { SFX } from './sfxCatalog';
import { useFxStore, type FlashKind } from '../store/useFxStore';
import { useAppStore } from '../store/useAppStore';

let base: StateSnapshot | null = null;
/** Separación entre efectos disparados por el mismo cambio de estado */
const CUE_GAP = 220; // ms

/** Toma el estado como nueva base sin sonar nada (inicio, carga, reinicio) */
export function rebaseFeedback(state: PlayerState | null): void {
  base = state ? snapshot(state) : null;
}

/** Compara con la observación anterior y responde a lo que cambió. Devuelve si hubo cambios. */
export function observeState(state: PlayerState, config: AudioConfig | undefined): boolean {
  const next = snapshot(state);
  const events = diffState(base, next);
  base = next;
  if (!events?.length) return false;

  const fx = useFxStore.getState();
  const played = new Set<string>();
  let delay = 0;
  for (const ev of events) {
    if (ev.kind === 'stat') fx.pop(ev.stat, ev.delta);
    const cue = cueFor(ev, config);
    if (!cue) continue;
    if (cue.sfx && !played.has(cue.sfx)) {
      // Varios cambios a la vez (daño + miedo + objeto) suenan escalonados, no encimados
      const name = cue.sfx;
      if (delay === 0) sfx.play(name);
      else setTimeout(() => sfx.play(name), delay);
      played.add(name);
      delay += CUE_GAP;
    }
    screenFx(cue.flash, cue.shake);
  }
  return true;
}

/** Destello y/o sacudida de pantalla, si el jugador no los desactivó */
export function screenFx(flash?: FlashKind, shake?: number): void {
  if (!useAppStore.getState().screenFx) return;
  const fx = useFxStore.getState();
  if (flash) fx.flash(flash);
  if (shake) fx.shake(shake);
}

/** Efecto pedido por el guion: suena y aplica su efecto de pantalla (explosión → sacudida). */
export function playSfx(name: string, volume = 1): number {
  const seconds = sfx.play(name, volume);
  const fx = SFX[name]?.fx;
  if (seconds > 0 && fx) screenFx(fx.flash, fx.shake);
  return seconds;
}
