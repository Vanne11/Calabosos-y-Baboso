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

export interface ChatSayInfo {
  reply: string;
  score: number;
  done: boolean;
  verdict: 'success' | 'partial' | 'failure' | null;
  turnsLeft: number;
}

export interface AiProvider {
  /** Si una función de IA está disponible ahora (config del servidor + preferencia del jugador) */
  available(feature: 'narrate' | ChatMode): boolean;
  narrate(prompt: string, vars: Record<string, string>): Promise<string | null>;
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
