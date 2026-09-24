// utils/metaStorage.ts
// Persistencia meta por juego (fuera de los slots de guardado):
// aceptación del control de edad, contadores entre partidas, etc.

import localforage from 'localforage';

const store = localforage.createInstance({
  name: 'calabosos-y-babosos',
  storeName: 'meta',
});

function metaKey(gameName: string, key: string): string {
  return `${gameName}:${key}`;
}

export async function getMeta<T>(gameName: string, key: string): Promise<T | null> {
  try {
    return await store.getItem<T>(metaKey(gameName, key));
  } catch {
    return null;
  }
}

export async function setMeta<T>(gameName: string, key: string, value: T): Promise<void> {
  try {
    await store.setItem(metaKey(gameName, key), value);
  } catch {
    // Sin almacenamiento (modo privado, etc.): el juego sigue funcionando
  }
}

export async function removeMeta(gameName: string, key: string): Promise<void> {
  try {
    await store.removeItem(metaKey(gameName, key));
  } catch {
    // ignorar
  }
}

/** Clave de los contadores meta del juego (muertes, partidas...) */
export const META_COUNTERS_KEY = 'counters';

/** Clave de aceptación del control de edad (incluye la edad para re-preguntar si sube) */
export function ageGateKey(minAge: number): string {
  return `age_gate:${minAge}`;
}
