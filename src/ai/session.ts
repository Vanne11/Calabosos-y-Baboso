// ai/session.ts
// Cliente de IA de la partida actual (para el game loop y el comando /ia)

import type { AiClient } from './AiClient';

let current: AiClient | null = null;

export function getAiClient(): AiClient | null {
  return current;
}

export function setAiClient(client: AiClient | null): void {
  if (current && current !== client) current.dispose();
  current = client;
  lastLine = null;
}

/** Última línea de la IA mostrada (para /bien y /mal) */
export interface LastAiLine {
  id: number;
  text: string;
  rated?: 1 | -1;
}

let lastLine: LastAiLine | null = null;

export function getLastAiLine(): LastAiLine | null {
  return lastLine;
}

export function setLastAiLine(line: LastAiLine | null): void {
  lastLine = line;
}

let rateHintShown = false;

/** Recuerda la línea para /bien y /mal. Devuelve true la primera vez (para mostrar la pista una sola vez) */
export function noteAiLine(id: number | undefined, text: string): boolean {
  if (!id) return false;
  lastLine = { id, text };
  if (rateHintShown) return false;
  rateHintShown = true;
  return true;
}
