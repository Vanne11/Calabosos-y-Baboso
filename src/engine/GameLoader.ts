// engine/GameLoader.ts
// Cargador de juegos desde archivos JSON - puro TypeScript

import type { GameManifest, ScenesFile, Scene } from '../types/game';

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

/** Escena genérica del control de edad (si el juego no define una propia) */
export const AGE_GATE_SCENE = '_age_gate';
/** Destino especial: el jugador aceptó el control de edad */
export const AGE_ACCEPT = '_age_accept';

/**
 * Carga las escenas de un juego. Si el manifiesto define `sceneFiles`,
 * las fusiona en orden; si no, usa `scenes.json`.
 * Lanza error si una escena se repite entre archivos.
 */
export async function fetchScenes(basePath: string, manifest: GameManifest): Promise<ScenesFile> {
  const files = manifest.sceneFiles?.length ? manifest.sceneFiles : ['scenes.json'];
  const parts = await Promise.all(
    files.map((file) => fetchJson<ScenesFile>(`${basePath}/${file}`))
  );

  const merged: ScenesFile = { scenes: {} };
  const origin: Record<string, string> = {};
  parts.forEach((part, i) => {
    for (const [id, scene] of Object.entries(part.scenes ?? {})) {
      if (origin[id]) {
        throw new Error(`Escena "${id}" duplicada en ${origin[id]} y ${files[i]}`);
      }
      origin[id] = files[i];
      merged.scenes[id] = scene;
    }
  });
  return merged;
}

/** Construye la escena genérica de control de edad a partir de contentRating */
export function buildAgeGateScene(manifest: GameManifest): Scene {
  const rating = manifest.contentRating!;
  const narratorId =
    Object.entries(manifest.characters).find(([, c]) => c.role === 'narrator')?.[0] ??
    Object.keys(manifest.characters)[0];
  const warnings = rating.warnings?.length
    ? `Aquí hay ${rating.warnings.join(', ')}.`
    : 'Este juego no es para todo público.';

  return {
    scenario: { name: 'Antes de empezar' },
    sequence: [
      {
        type: 'dialog',
        character: narratorId,
        lines: [warnings, `¿Tienes ${rating.minAge} años o más?`],
      },
      {
        type: 'choice',
        options: [
          { text: `Sí, tengo ${rating.minAge} o más`, goto: AGE_ACCEPT },
          { text: 'No', goto: '_quit' },
        ],
      },
    ],
  };
}

export async function loadGame(gameName: string): Promise<LoadedGame> {
  const basePath = `games/${gameName}`;

  const manifest = await fetchJson<GameManifest>(`${basePath}/game.json`);
  const scenes = await fetchScenes(basePath, manifest);

  // Validate
  if (!manifest.name) {
    throw new Error(`Juego "${gameName}" no tiene nombre en game.json`);
  }
  if (!scenes.scenes || Object.keys(scenes.scenes).length === 0) {
    throw new Error(`Juego "${gameName}" no tiene escenas`);
  }
  if (!scenes.scenes['start']) {
    throw new Error(`Juego "${gameName}" no tiene escena "start"`);
  }

  // Control de edad: escena propia o genérica
  const rating = manifest.contentRating;
  if (rating) {
    const gate = rating.gateScene ?? AGE_GATE_SCENE;
    if (!scenes.scenes[gate]) {
      if (rating.gateScene) {
        throw new Error(`Juego "${gameName}" define gateScene "${gate}" pero la escena no existe`);
      }
      scenes.scenes[gate] = buildAgeGateScene(manifest);
    }
  }

  // Resolve relative image paths to full paths
  resolveImagePaths(scenes, basePath);
  resolveManifestImagePaths(manifest, basePath);

  return { manifest, scenes };
}

function resolveImagePaths(scenes: ScenesFile, basePath: string): void {
  for (const scene of Object.values(scenes.scenes)) {
    if (scene.scenario?.image) {
      scene.scenario.image = `${basePath}/${scene.scenario.image}`;
    }
    if (scene.scenario?.music) {
      scene.scenario.music = `${basePath}/${scene.scenario.music}`;
    }
  }
}

function resolveManifestImagePaths(manifest: GameManifest, basePath: string): void {
  for (const char of Object.values(manifest.characters)) {
    if (char.image) {
      char.image = `${basePath}/${char.image}`;
    }
  }
}

export async function listGames(): Promise<{ name: string; description: string; author: string; version: string }[]> {
  // Intentar cargar índice dinámico
  let gameNames: string[];
  try {
    const index = await fetchJson<{ games: string[] }>('games/index.json');
    gameNames = index.games;
  } catch {
    // Fallback a lista conocida
    gameNames = ['demo', 'Calabosos y Babosos'];
  }

  const results = await Promise.all(
    gameNames.map(async (name) => {
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
