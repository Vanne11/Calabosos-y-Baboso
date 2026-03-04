// utils/storage.ts
// Persistencia con localforage

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
}

export async function saveGame(slot: string, data: SaveData): Promise<void> {
  await store.setItem(slot, data);
}

export async function loadSave(slot: string): Promise<SaveData | null> {
  return store.getItem<SaveData>(slot);
}

export async function deleteSave(slot: string): Promise<void> {
  await store.removeItem(slot);
}

export async function listSaves(): Promise<string[]> {
  return store.keys();
}
