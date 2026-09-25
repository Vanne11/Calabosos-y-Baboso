// engine/AiProvider.ts
// Contrato entre el motor y la IA. El motor no hace red: recibe un proveedor inyectado
// (ver src/ai/AiClient.ts). Todas las llamadas devuelven null si la IA no está disponible
// o falla, y el motor usa su respaldo (texto fijo o dados).

import type { ChatMode } from '../types/game';

export interface ChatStartInfo {
  chatId: string;
  maxTurns: number;
  score: number;
  maxInputChars: number;
}

/** Tono que la IA marca en su respuesta (lista cerrada; el servidor descarta otros valores) */
export const TONES = ['neutral', 'burla', 'chiste', 'incomodo', 'enojo', 'impresionado', 'asco', 'miedo', 'ternura', 'triste', 'drama'] as const;
export type Tone = (typeof TONES)[number];

export function isTone(value: unknown): value is Tone {
  return typeof value === 'string' && (TONES as readonly string[]).includes(value);
}

export interface ChatSayInfo {
  reply: string;
  score: number;
  done: boolean;
  verdict: 'success' | 'partial' | 'failure' | null;
  turnsLeft: number;
  tone?: Tone | null;
  /** Gesto que hizo el NPC (id de los que mandó el juego), o null */
  gesture?: string | null;
  /** Al terminar: una frase de lo que pasó, para la memoria */
  memory?: string | null;
  lineId?: number;
}

/** Pedido de acción libre: lo que escribió el jugador, las opciones visibles y las consecuencias permitidas */
export interface FreeActionRequest {
  vars: Record<string, string>;
  action: string;
  options: string[];
  /** id → descripción para la IA */
  consequences: Record<string, string>;
}

/** Interpretación de la acción libre (el servidor valida option y consequence) */
export interface FreeActionReply {
  text: string;
  tone?: Tone | null;
  /** Índice (desde 0) de la opción elegida, o null */
  option: number | null;
  /** Consecuencia elegida (id de la lista), o null */
  consequence: string | null;
  lineId?: number;
}

/** Función de IA que se puede consultar con available() */
export type AiFeature = 'narrate' | 'libre' | ChatMode;

/** Línea generada por el narrador */
export interface NarrateReply {
  text: string;
  tone?: Tone | null;
  /** Id de la línea en el servidor (para calificarla) */
  lineId?: number;
}

export interface AiProvider {
  /** Si una función de IA está disponible ahora (config del servidor + preferencia del jugador) */
  available(feature: AiFeature): boolean;
  /** message: lo que escribió el jugador (solo prompts con player_message en el servidor, ej. "charla") */
  narrate(prompt: string, vars: Record<string, string>, message?: string): Promise<NarrateReply | null>;
  /** Interpreta lo que el jugador escribió en una decisión (prompt libre.<prompt> del servidor) */
  freeAction(prompt: string, request: FreeActionRequest): Promise<FreeActionReply | null>;
  chatStart(
    mode: ChatMode,
    npc: string,
    vars: Record<string, string>,
    maxTurns?: number,
    /** Gestos disponibles: id → cuándo hacerlo */
    gestures?: Record<string, string>
  ): Promise<ChatStartInfo | null>;
  chatSay(chatId: string, message: string): Promise<ChatSayInfo | null>;
  chatGiveUp(chatId: string): Promise<void>;
}

/** Evento de juego para la analítica del servidor */
export interface GameEvent {
  type: string;
  scene?: string;
  data?: Record<string, unknown>;
}

export type GameEventSink = (event: GameEvent) => void;
