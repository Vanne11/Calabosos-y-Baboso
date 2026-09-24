// engine/NarrativeText.ts
// Texto narrativo: variables en textos y pools de frases sin repetición - puro TypeScript

import type { PoolLine } from '../types/game';
import type { PlayerState } from '../types/engine';
import { evaluateCondition } from './ConditionEvaluator';

const VARIABLE_RE = /\{(meta\.)?([a-zA-Z0-9_]+)\}/g;

/**
 * Reemplaza variables en un texto:
 * - {stat}       → valor de la stat (ej: {nombre_jugador}, {dinero})
 * - {meta.clave} → contador meta (0 si no existe)
 * Las variables desconocidas se dejan tal cual.
 */
export function interpolate(text: string, state: PlayerState): string {
  if (!text || !text.includes('{')) return text;
  return text.replace(VARIABLE_RE, (match, isMeta: string | undefined, key: string) => {
    if (isMeta) return String(state.meta?.[key] ?? 0);
    const value = state.stats[key];
    return value === undefined ? match : String(value);
  });
}

function lineText(line: PoolLine): string {
  return typeof line === 'string' ? line : line.text;
}

function lineWeight(line: PoolLine): number {
  return typeof line === 'string' ? 1 : Math.max(line.weight ?? 1, 0);
}

export interface PoolPick {
  lines: string[];
  /** Índices usados actualizados para este pool */
  used: number[];
}

/**
 * Saca `count` líneas de un pool sin repetir hasta agotar las elegibles
 * (las que cumplen su condición). Al agotarse, el pool se rebaraja.
 */
export function pickFromPool(
  pool: PoolLine[],
  used: number[] = [],
  state: PlayerState,
  count: number = 1
): PoolPick {
  const eligible = pool
    .map((line, i) => ({ line, i }))
    .filter(({ line }) => typeof line === 'string' || evaluateCondition(line.condition, state))
    .map(({ i }) => i);

  let usedSet = new Set(used);
  const picked: string[] = [];

  for (let n = 0; n < count && eligible.length > 0; n++) {
    let available = eligible.filter((i) => !usedSet.has(i) && !picked.includes(lineText(pool[i])));
    if (available.length === 0) {
      // Rebarajar: liberar las elegibles (sin repetir dentro de esta misma selección)
      usedSet = new Set([...usedSet].filter((i) => !eligible.includes(i)));
      available = eligible.filter((i) => !picked.includes(lineText(pool[i])));
      if (available.length === 0) break;
    }

    const total = available.reduce((sum, i) => sum + lineWeight(pool[i]), 0);
    let rand = Math.random() * total;
    let chosen = available[available.length - 1];
    for (const i of available) {
      rand -= lineWeight(pool[i]);
      if (rand <= 0) {
        chosen = i;
        break;
      }
    }

    usedSet.add(chosen);
    picked.push(lineText(pool[chosen]));
  }

  return { lines: picked, used: [...usedSet] };
}
