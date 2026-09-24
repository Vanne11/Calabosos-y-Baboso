// scripts/shared/game-data.mjs
// Utilidades compartidas por los scripts de juegos: carga de manifiesto/escenas y referencias a assets.

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

export const GAMES_DIR = resolve(import.meta.dirname, '..', '..', 'public', 'games');
export const PLACEHOLDERS_FILE = 'images/.placeholders.json';

export function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Nombres de juegos registrados en public/games/index.json */
export function listGameNames() {
  return readJson(join(GAMES_DIR, 'index.json')).games;
}

/**
 * Carga un juego desde disco. No lanza: acumula problemas en `errors`.
 * @returns {{ base: string, manifest: object|null, scenes: Record<string, object>, origin: Record<string, string>, files: string[], errors: string[] }}
 */
export function loadGameFromDisk(gameName) {
  const base = join(GAMES_DIR, gameName);
  const errors = [];
  const scenes = {};
  const origin = {};

  const manifestPath = join(base, 'game.json');
  if (!existsSync(manifestPath)) {
    errors.push('No existe game.json');
    return { base, manifest: null, scenes, origin, files: [], errors };
  }

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (e) {
    errors.push(`game.json inválido: ${e.message}`);
    return { base, manifest: null, scenes, origin, files: [], errors };
  }

  const files = manifest.sceneFiles?.length ? manifest.sceneFiles : ['scenes.json'];
  for (const file of files) {
    const path = join(base, file);
    if (!existsSync(path)) {
      errors.push(`No existe el archivo de escenas "${file}"`);
      continue;
    }
    let data;
    try {
      data = readJson(path);
    } catch (e) {
      errors.push(`${file} inválido: ${e.message}`);
      continue;
    }
    for (const [id, scene] of Object.entries(data.scenes ?? {})) {
      if (origin[id]) {
        errors.push(`Escena "${id}" duplicada en ${origin[id]} y ${file}`);
        continue;
      }
      origin[id] = file;
      scenes[id] = scene;
    }
  }

  return { base, manifest, scenes, origin, files, errors };
}

/** Si una ruta de asset es local al juego (no asset: ni URL) */
export function isLocalAsset(rel) {
  return typeof rel === 'string' && rel !== '' && !rel.startsWith('asset:') && !/^https?:/.test(rel);
}

/**
 * Referencias a assets del juego.
 * @returns {{ path: string, context: string }[]}
 */
export function collectAssetRefs(manifest, scenes) {
  const refs = [];
  const add = (path, context) => {
    if (isLocalAsset(path)) refs.push({ path, context });
  };
  for (const [id, scene] of Object.entries(scenes)) {
    add(scene.scenario?.image, `escena ${id}`);
    add(scene.scenario?.music, `escena ${id}`);
  }
  for (const [cid, c] of Object.entries(manifest.characters ?? {})) {
    add(c.image, `personaje ${cid}`);
    for (const alt of Object.values(c.altImages ?? {})) add(alt, `personaje ${cid}`);
  }
  for (const [iid, it] of Object.entries(manifest.items ?? {})) add(it.image, `item ${iid}`);
  return refs;
}

/** Lista de imágenes provisorias del juego: { [ruta]: sha256 } */
export function readPlaceholders(base) {
  const path = join(base, PLACEHOLDERS_FILE);
  if (!existsSync(path)) return {};
  try {
    return readJson(path);
  } catch {
    return {};
  }
}
