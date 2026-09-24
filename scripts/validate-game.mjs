#!/usr/bin/env node
// scripts/validate-game.mjs
// Valida juegos en public/games/: escenas, destinos, alcanzabilidad, personajes, items y assets.
//
// Uso:
//   npm run validate                        → valida todos los juegos de index.json
//   npm run validate -- calabosos           → valida uno
//   npm run validate -- calabosos --strict  → los avisos también fallan

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  loadGameFromDisk,
  listGameNames,
  collectAssetRefs,
  readPlaceholders,
} from './shared/game-data.mjs';

const SPECIAL_DESTINATIONS = new Set(['_quit', '_game_over', '_restart', '_age_accept']);
const AGE_GATE_SCENE = '_age_gate';

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const names = args.filter((a) => !a.startsWith('--'));

/** Recorre recursivamente un valor y llama a fn(key, value, parent) por cada propiedad */
function walk(value, fn) {
  if (Array.isArray(value)) {
    for (const v of value) walk(v, fn);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      fn(k, v, value);
      walk(v, fn);
    }
  }
}

function validateGame(gameName) {
  const { base, manifest, scenes, origin, files, errors } = loadGameFromDisk(gameName);
  const warnings = [];
  const info = [];
  if (!manifest) return { errors, warnings, info, stats: null };

  const where = (id) => `${id} (${origin[id] ?? '?'})`;

  // --- Manifiesto ---
  if (!manifest.name) errors.push('game.json no tiene "name"');
  if (!manifest.characters || Object.keys(manifest.characters).length === 0) {
    errors.push('game.json no define personajes');
  }
  if (!scenes.start) errors.push('Falta la escena "start"');

  const rating = manifest.contentRating;
  const entryScenes = ['start'];
  if (rating) {
    if (typeof rating.minAge !== 'number') errors.push('contentRating.minAge debe ser un número');
    if (rating.gateScene) {
      if (!scenes[rating.gateScene]) errors.push(`contentRating.gateScene "${rating.gateScene}" no existe`);
      entryScenes.push(rating.gateScene);
    }
  }

  const characters = manifest.characters ?? {};
  const items = manifest.items;
  const validTargets = new Set([...Object.keys(scenes), ...SPECIAL_DESTINATIONS]);
  if (rating && !rating.gateScene) validTargets.add(AGE_GATE_SCENE);

  const checkItem = (id, context) => {
    if (items && typeof id === 'string' && !items[id]) {
      warnings.push(`${context}: item "${id}" no está definido en game.json → items`);
    }
  };

  // --- Por escena ---
  const edges = {};
  for (const id of Object.keys(scenes)) {
    const seq = scenes[id].sequence;
    if (!Array.isArray(seq)) {
      errors.push(`${where(id)}: "sequence" no es una lista`);
      edges[id] = [];
      continue;
    }
    if (seq.length === 0) warnings.push(`${where(id)}: escena sin pasos`);

    const targets = new Set();
    walk(seq, (key, value, parent) => {
      if (key === 'goto' && typeof value === 'string') {
        targets.add(value);
        if (!validTargets.has(value)) errors.push(`${where(id)}: goto a escena inexistente "${value}"`);
      }
      if (key === 'character' && typeof value === 'string' && parent.type === 'dialog') {
        if (!characters[value]) errors.push(`${where(id)}: personaje "${value}" no definido`);
      }
      if ((key === 'inventory' || key === 'removeInventory') && Array.isArray(value)) {
        for (const item of value) checkItem(item, where(id));
      }
    });
    edges[id] = [...targets];

    if (targets.size === 0) {
      warnings.push(`${where(id)}: sin salida (ningún goto); el jugador queda atascado al terminar`);
    }
  }
  for (const item of manifest.initialInventory ?? []) checkItem(item, 'initialInventory');

  // --- Alcanzabilidad desde start (y la escena de edad) ---
  const reached = new Set();
  const queue = entryScenes.filter((s) => scenes[s]);
  while (queue.length) {
    const cur = queue.shift();
    if (reached.has(cur)) continue;
    reached.add(cur);
    for (const t of edges[cur] ?? []) if (scenes[t] && !reached.has(t)) queue.push(t);
  }
  for (const s of Object.keys(scenes).filter((s) => !reached.has(s))) {
    warnings.push(`${where(s)}: inalcanzable desde "start"`);
  }

  // --- Assets ---
  const missing = new Set();
  for (const { path, context } of collectAssetRefs(manifest, scenes)) {
    if (!existsSync(join(base, path))) missing.add(`${path}  ← ${context}`);
  }
  if (missing.size) {
    warnings.push(
      `${missing.size} asset(s) no existen (npm run placeholders -- ${gameName}):\n      ${[...missing].join('\n      ')}`
    );
  }
  const placeholders = Object.keys(readPlaceholders(base));
  if (placeholders.length) {
    info.push(`${placeholders.length} imagen(es) provisoria(s) pendientes de arte final (ver IMAGENES.md)`);
  }

  const stepCount = Object.values(scenes).reduce((n, s) => n + (s.sequence?.length ?? 0), 0);
  return {
    errors,
    warnings,
    info,
    stats: { scenes: Object.keys(scenes).length, steps: stepCount, files: files.length },
  };
}

// --- Main ---
let targets = names;
if (targets.length === 0) {
  try {
    targets = listGameNames();
  } catch {
    console.error('No se pudo leer public/games/index.json');
    process.exit(1);
  }
}

let failed = false;
for (const name of targets) {
  const { errors, warnings, info, stats } = validateGame(name);
  const summary = stats ? ` — ${stats.scenes} escenas, ${stats.steps} pasos, ${stats.files} archivo(s)` : '';
  const ok = errors.length === 0 && (!strict || warnings.length === 0);
  console.log(`\n${ok ? '✔' : '✘'} ${name}${summary}`);
  for (const e of errors) console.log(`  ERROR    ${e}`);
  for (const w of warnings) console.log(`  aviso    ${w}`);
  for (const i of info) console.log(`  info     ${i}`);
  if (!ok) failed = true;
}
console.log('');
process.exit(failed ? 1 : 0);
