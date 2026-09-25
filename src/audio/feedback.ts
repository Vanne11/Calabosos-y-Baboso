// audio/feedback.ts
// Detecta cambios del estado del jugador entre dos momentos (stats, inventario) para
// darles respuesta audiovisual. Lógica pura: sin audio ni DOM (se prueba con Vitest).

import type { PlayerState } from '../types/engine';
import type { AudioConfig } from '../types/game';

export interface StateSnapshot {
  stats: Record<string, number>;
  inventory: string[];
  visited: number;
}

export type FeedbackEvent =
  | { kind: 'stat'; stat: string; delta: number; from: number; to: number }
  | { kind: 'item'; id: string; added: boolean };

/** Si entre dos observaciones se visitan más escenas que esto, fue una carga de partida */
const MAX_SCENES_BETWEEN = 3;

export function snapshot(state: PlayerState): StateSnapshot {
  const stats: Record<string, number> = {};
  for (const [k, v] of Object.entries(state.stats)) if (typeof v === 'number') stats[k] = v;
  return { stats, inventory: [...state.inventory], visited: state.visitedScenes.length };
}

/**
 * Cambios entre `prev` y `next`. Devuelve null si el salto no es jugable
 * (reinicio, punto de control, partida cargada): hay que tomar `next` como nueva base sin sonar nada.
 */
export function diffState(prev: StateSnapshot | null, next: StateSnapshot): FeedbackEvent[] | null {
  if (!prev) return null;
  if (next.visited < prev.visited || next.visited > prev.visited + MAX_SCENES_BETWEEN) return null;

  const events: FeedbackEvent[] = [];
  for (const [stat, to] of Object.entries(next.stats)) {
    const from = prev.stats[stat];
    if (from === undefined || from === to) continue;
    events.push({ kind: 'stat', stat, delta: to - from, from, to });
  }

  const before = countItems(prev.inventory);
  const after = countItems(next.inventory);
  for (const [id, n] of after) {
    if (n > (before.get(id) ?? 0)) events.push({ kind: 'item', id, added: true });
  }
  for (const [id, n] of before) {
    if (n > (after.get(id) ?? 0)) events.push({ kind: 'item', id, added: false });
  }
  return events;
}

function countItems(list: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const id of list) m.set(id, (m.get(id) ?? 0) + 1);
  return m;
}

export interface FeedbackCue {
  sfx?: string;
  /** Intensidad de sacudida de pantalla (0 = no) */
  shake?: number;
  flash?: 'damage' | 'heal' | 'gold';
}

/** Qué hacer ante un evento según la configuración de audio del juego */
export function cueFor(event: FeedbackEvent, config: AudioConfig | undefined): FeedbackCue | null {
  if (event.kind === 'item') {
    const sfx = event.added ? config?.itemSfx ?? 'objeto' : config?.removeItemSfx;
    return sfx ? { sfx } : null;
  }
  const rule = config?.statSfx?.[event.stat];
  if (!rule) return null;
  if (event.delta < 0) {
    const big = rule.bigDown && -event.delta >= rule.bigDown.amount;
    const sfx = big ? rule.bigDown!.sfx : rule.down;
    if (!sfx && !rule.shake) return null;
    return {
      sfx,
      shake: rule.shake ? Math.min(3, Math.max(1, Math.round(-event.delta / 10))) : 0,
      flash: rule.shake ? 'damage' : undefined,
    };
  }
  const sfx = rule.bigUp && event.delta >= rule.bigUp.amount ? rule.bigUp.sfx : rule.up;
  if (!sfx) return null;
  return { sfx, flash: rule.flashUp };
}
