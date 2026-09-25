// utils/storage.ts
// Persistencia con localforage — sistema de guardado por slots

import localforage from 'localforage';
import type { PlayerState } from '../types/engine';

const store = localforage.createInstance({
  name: 'calabosos-y-babosos',
  storeName: 'saves',
});

export interface SaveData {
  playerState: PlayerState;
  currentScene: string;
  gameName: string;
  timestamp: number;
  /** Nombre legible de la escena (del scenario.name) */
  sceneName?: string;
  /** Si fue guardado automático por checkpoint */
  isCheckpoint?: boolean;
}

/** Genera la clave de un slot: "{gameName}:slot:{n}" */
function slotKey(gameName: string, slotIndex: number): string {
  return `${gameName}:slot:${slotIndex}`;
}

/** Guarda partida en un slot específico */
export async function saveGame(gameName: string, slotIndex: number, data: SaveData): Promise<void> {
  await store.setItem(slotKey(gameName, slotIndex), data);
}

/** Carga partida de un slot específico */
export async function loadSave(gameName: string, slotIndex: number): Promise<SaveData | null> {
  return store.getItem<SaveData>(slotKey(gameName, slotIndex));
}

/** Elimina un slot */
export async function deleteSave(gameName: string, slotIndex: number): Promise<void> {
  await store.removeItem(slotKey(gameName, slotIndex));
}

/** Lista todos los slots de un juego (devuelve array de SaveData | null por cada slot) */
export async function listSlots(gameName: string, totalSlots: number): Promise<(SaveData | null)[]> {
  const results: (SaveData | null)[] = [];
  for (let i = 1; i <= totalSlots; i++) {
    results.push(await store.getItem<SaveData>(slotKey(gameName, i)));
  }
  return results;
}

/** Autoguardado (espacio aparte de los slots): la última escena a la que se entró */
export async function saveAuto(gameName: string, data: SaveData): Promise<void> {
  await store.setItem(`${gameName}:auto`, data);
}

export async function loadAuto(gameName: string): Promise<SaveData | null> {
  return store.getItem<SaveData>(`${gameName}:auto`);
}

/** Borra el autoguardado y todos los slots de un juego (/reiniciar) */
export async function deleteAllSaves(gameName: string, totalSlots: number): Promise<void> {
  await store.removeItem(`${gameName}:auto`);
  for (let i = 1; i <= totalSlots; i++) await store.removeItem(slotKey(gameName, i));
}

/** Lista todas las claves guardadas (para migración/debug) */
export async function listAllKeys(): Promise<string[]> {
  return store.keys();
}
