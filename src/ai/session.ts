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
}
