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
}

/** Línea generada por el narrador */
export interface NarrateReply {
  text: string;
  tone?: Tone | null;
}

export interface AiProvider {
  /** Si una función de IA está disponible ahora (config del servidor + preferencia del jugador) */
  available(feature: 'narrate' | ChatMode): boolean;
  narrate(prompt: string, vars: Record<string, string>): Promise<NarrateReply | null>;
  chatStart(mode: ChatMode, npc: string, vars: Record<string, string>, maxTurns?: number): Promise<ChatStartInfo | null>;
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
