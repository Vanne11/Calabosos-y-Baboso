// engine/GameLoader.ts
// Cargador de juegos desde archivos JSON - puro TypeScript

import type { GameManifest, ScenesFile } from '../types/game';

export interface LoadedGame {
  manifest: GameManifest;
  scenes: ScenesFile;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error cargando ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function loadGame(gameName: string): Promise<LoadedGame> {
  const basePath = `games/${gameName}`;

  const [manifest, scenes] = await Promise.all([
    fetchJson<GameManifest>(`${basePath}/game.json`),
    fetchJson<ScenesFile>(`${basePath}/scenes.json`),
  ]);

  // Validate
  if (!manifest.name) {
    throw new Error(`Juego "${gameName}" no tiene nombre en game.json`);
  }
  if (!scenes.scenes || Object.keys(scenes.scenes).length === 0) {
    throw new Error(`Juego "${gameName}" no tiene escenas en scenes.json`);
  }
  if (!scenes.scenes['start']) {
    throw new Error(`Juego "${gameName}" no tiene escena "start" en scenes.json`);
  }

  return { manifest, scenes };
}

export async function listGames(): Promise<{ name: string; description: string; author: string; version: string }[]> {
  const possibleGames = ['demo', 'Calabosos y Babosos'];

  const results = await Promise.all(
    possibleGames.map(async (name) => {
      try {
        const info = await fetchJson<GameManifest>(`games/${name}/game.json`);
        return {
          name,
          description: info.description || 'Sin descripcion',
          author: info.author || 'Anonimo',
          version: info.version || '0.1',
        };
      } catch {
        return null;
      }
    })
  );

  return results.filter((g): g is NonNullable<typeof g> => g !== null);
}
