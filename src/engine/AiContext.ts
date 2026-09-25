// engine/AiContext.ts
// Contexto que acompaña a cada llamada a la IA: memoria de la partida, citas del jugador,
// líneas ya dichas y fichas de personaje. Puro: sin red ni estado propio.

import type { CharacterDef, ChatMode } from '../types/game';
import type { PlayerState } from '../types/engine';

/** Hechos de la memoria que viajan a la IA (los más recientes) */
export const MEMO_FOR_AI = 10;
/** Decisiones guardadas (opciones con tags) y cuántas viajan a la IA */
export const DECISIONES_MAX = 12;
export const DECISIONES_FOR_AI = 6;
/** Campos del estado que forman la memoria de la IA: sobreviven a volver al checkpoint */
export const AI_MEMORY_FIELDS = ['memoria', 'decisiones', 'citas', 'iaDijo', 'habla', 'npcMemoria', 'charla'] as const;
/** Recuerdos por personaje (y cuántos viajan a sus chats) */
export const NPC_MEMO_MAX = 6;
/** Citas guardadas en la partida y cuántas viajan a la IA */
export const CITAS_MAX = 8;
export const CITAS_FOR_AI = 3;
/** Líneas del narrador que se recuerdan para no repetirlas */
export const IA_DIJO_MAX = 5;
/** Mensajes del jugador que se guardan tal cual (cómo escribe) */
export const HABLA_MAX = 4;
/** Largo máximo de una cita o una línea recordada */
const LINE_CHARS = 160;

function clip(text: string, max = LINE_CHARS): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Variables de contexto para la IA a partir del estado (vacías si no hay datos) */
export function contextVars(state: PlayerState): Record<string, string> {
  const list = (items: string[] | undefined, n: number) => (items ?? []).slice(-n).map((i) => `- ${i}`).join('\n');
  const animo = state.stats.animo_narrador;
  return {
    memoria: list(state.memoria, MEMO_FOR_AI),
    decisiones: list(state.decisiones, DECISIONES_FOR_AI),
    citas: list(state.citas, CITAS_FOR_AI),
    ya_dijiste: list(state.iaDijo, IA_DIJO_MAX),
    como_escribe: list(state.habla, HABLA_MAX),
    animo: typeof animo === 'string' ? animo : '',
  };
}

/** Lo que un personaje recuerda de Alex, como lista para el prompt */
export function npcHistory(state: PlayerState, npc: string): string {
  return (state.npcMemoria?.[npc] ?? []).map((i) => `- ${i}`).join('\n');
}

/** Suma un recuerdo a un personaje (sin repetir el último, acotado) */
export function addNpcMemo(state: PlayerState, npc: string, memo: string): PlayerState {
  const list = pushRecent(state.npcMemoria?.[npc], memo, NPC_MEMO_MAX);
  return { ...state, npcMemoria: { ...(state.npcMemoria ?? {}), [npc]: list } };
}

/** Ficha de personaje en texto para el prompt ('' si el personaje no tiene ficha) */
export function characterSheet(def: CharacterDef | undefined): string {
  const ai = def?.ai;
  if (!ai) return '';
  const parts: string[] = [];
  if (ai.regla) parts.push(`REGLA OBLIGATORIA (en todas tus intervenciones, sin excepción): ${ai.regla}`);
  if (ai.voz) parts.push(`Voz: ${ai.voz}`);
  if (ai.muletillas?.length) parts.push(`Muletillas (máximo una por respuesta): ${ai.muletillas.join(', ')}`);
  if (ai.quiere) parts.push(`Quiere: ${ai.quiere}`);
  if (ai.teme) parts.push(`Teme: ${ai.teme}`);
  if (ai.secreto) parts.push(`Secreto (insinúalo, nunca lo digas directo): ${ai.secreto}`);
  if (ai.ejemplos?.length) parts.push(`Así habla: ${ai.ejemplos.map((e) => `«${e}»`).join(' / ')}`);
  return parts.join('\n');
}

/**
 * Agrega una línea al final de una lista acotada (sin repetir la última).
 * El texto se guarda tal cual (solo se compactan espacios): las faltas y modismos del jugador son material.
 */
export function pushRecent(list: string[] | undefined, line: string, max: number): string[] {
  const item = clip(line);
  const out = [...(list ?? [])];
  if (item && out[out.length - 1] !== item) out.push(item);
  return out.slice(-max);
}

/** Cita del jugador para la memoria: «texto» (a quién, en qué modo) */
export function chatQuote(message: string, npcName: string, mode: ChatMode): string {
  return `«${clip(message, LINE_CHARS - 30)}» (a ${npcName}, ${CHAT_ACTION[mode]})`;
}

const CHAT_ACTION: Record<ChatMode, string> = {
  persuadir: 'intentando convencerlo',
  negociar: 'regateando',
  cancion: 'componiendo una canción',
  rap: 'en una batalla de rap',
  insultos: 'en un duelo de insultos',
  confesion: 'sincerándose',
};

const CHAT_MEMO: Record<ChatMode, string> = {
  persuadir: 'intentó convencer a {npc}',
  negociar: 'regateó con {npc}',
  cancion: 'compuso una canción con {npc}',
  rap: 'se batió a rap contra {npc}',
  insultos: 'tuvo un duelo de insultos con {npc}',
  confesion: 'se sinceró con {npc}',
};

const VERDICT_MEMO = { success: 'y ganó', partial: 'y quedó a medias', failure: 'y perdió' } as const;

/** Hecho para la memoria al terminar un chat ("se batió a rap contra el Bardo y perdió") */
export function chatMemo(
  mode: ChatMode,
  npcName: string,
  verdict: 'success' | 'partial' | 'failure' | null,
  how: { gaveUp?: boolean; dice?: boolean } = {}
): string {
  let memo = CHAT_MEMO[mode].replace('{npc}', npcName);
  if (how.dice) memo += ' (lo decidieron los dados)';
  if (how.gaveUp) memo += ' y se rindió';
  else if (verdict) memo += ` ${VERDICT_MEMO[verdict]}`;
  return memo;
}
