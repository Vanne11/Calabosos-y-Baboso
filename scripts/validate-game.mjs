#!/usr/bin/env node
// scripts/validate-game.mjs
// Valida juegos en public/games/: escenas, destinos, alcanzabilidad, personajes, items y assets.
//
// Uso:
//   npm run validate                        → valida todos los juegos de index.json
//   npm run validate -- calabosos           → valida uno
//   npm run validate -- calabosos --strict  → los avisos también fallan

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  loadGameFromDisk,
  listGameNames,
  collectAssetRefs,
  readPlaceholders,
} from './shared/game-data.mjs';

// Catálogo de efectos sintetizados y ambientes del motor (src/audio)
const AUDIO_NAMES = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'src', 'audio', 'sfx-names.json'), 'utf8'));
const SFX_NAMES = new Set(AUDIO_NAMES.sfx);
const AMBIENCE_NAMES = new Set(AUDIO_NAMES.ambience);

const SPECIAL_DESTINATIONS = new Set(['_quit', '_game_over', '_restart', '_age_accept', '_checkpoint']);
const CHAT_MODES = new Set(['persuadir', 'negociar', 'cancion', 'rap', 'insultos', 'confesion']);
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

  const pools = manifest.linePools ?? {};
  const checkPool = (id, context) => {
    if (typeof id === 'string' && !pools[id]) errors.push(`${context}: pool "${id}" no existe en game.json → linePools`);
  };

  const checkItem = (id, context) => {
    if (items && typeof id === 'string' && !items[id]) {
      warnings.push(`${context}: item "${id}" no está definido en game.json → items`);
    }
  };

  const checkSfx = (name, context) => {
    if (typeof name === 'string' && name !== 'none' && !SFX_NAMES.has(name)) {
      errors.push(`${context}: efecto "${name}" no existe (lista: /debug sfx o src/audio/sfx-names.json)`);
    }
  };

  // --- Audio del juego ---
  const audio = manifest.audio ?? {};
  for (const [stat, rule] of Object.entries(audio.statSfx ?? {})) {
    const ctx = `audio.statSfx.${stat}`;
    if (!(stat in (manifest.initialStats ?? {}))) warnings.push(`${ctx}: el stat no está en initialStats`);
    checkSfx(rule.up, ctx);
    checkSfx(rule.down, ctx);
    checkSfx(rule.bigUp?.sfx, ctx);
    checkSfx(rule.bigDown?.sfx, ctx);
  }
  const TONES = new Set(AUDIO_NAMES.tones);
  for (const [tone, name] of Object.entries(audio.toneSfx ?? {})) {
    if (!TONES.has(tone)) errors.push(`audio.toneSfx: tono "${tone}" no existe (${[...TONES].join(', ')})`);
    checkSfx(name, `audio.toneSfx.${tone}`);
  }
  checkSfx(audio.itemSfx, 'audio.itemSfx');
  checkSfx(audio.removeItemSfx, 'audio.removeItemSfx');

  // --- Consecuencias de la acción libre y gestos de los chats (el servidor descarta ids inválidos y se queda con 10) ---
  function checkConsequences(consequences, ctx, inherited = 0) {
    if (!consequences) return;
    const entries = Object.entries(consequences);
    const total = entries.length + inherited;
    if (total > 10) warnings.push(`${ctx}: ${total} en total; la IA solo recibe las primeras 10`);
    for (const [cid, c] of entries) {
      if (!/^[a-z0-9_]{1,30}$/.test(cid)) errors.push(`${ctx}: id de consecuencia "${cid}" inválido (a-z, 0-9, _)`);
      if (!c?.hint) errors.push(`${ctx}.${cid}: falta "hint" (la IA lo usa para elegirla)`);
      for (const stat of Object.keys({ ...(c?.effects?.stats ?? {}), ...(c?.effects?.setStats ?? {}) })) {
        if (!(stat in (manifest.initialStats ?? {}))) warnings.push(`${ctx}.${cid}: el stat "${stat}" no está en initialStats`);
      }
      for (const item of [...(c?.effects?.inventory ?? []), ...(c?.effects?.removeInventory ?? [])]) checkItem(item, `${ctx}.${cid}`);
    }
  }
  checkConsequences(manifest.ai?.freeText?.consequences, 'ai.freeText');
  // --- Formas de género: {masculino|femenino|neutro} ---
  const GENDER_RE = /\{([^{}|]*(?:\|[^{}|]*)+)\}/g;
  const gender = manifest.gender;
  const neededForms = gender ? Math.max(0, ...Object.values(gender.forms ?? {})) + 1 : 0;
  if (gender) {
    if (!(gender.stat in (manifest.initialStats ?? {})) && gender.stat !== 'genero') {
      warnings.push(`gender.stat "${gender.stat}" no está en initialStats`);
    }
  }
  const genderIssues = new Map();
  const checkGender = (text, ctx) => {
    if (typeof text !== 'string' || !text.includes('|')) return;
    for (const m of text.matchAll(GENDER_RE)) {
      if (!gender) genderIssues.set(ctx, `usa formas de género ({${m[1]}}) pero game.json no tiene "gender"`);
      else if (m[1].split('|').length < neededForms) genderIssues.set(ctx, `"{${m[1]}}" tiene menos formas que las que usa gender.forms (${neededForms})`);
    }
  };
  for (const [id, scene] of Object.entries(scenes)) walk(scene, (_k, v) => checkGender(v, where(id)));
  for (const key of ['linePools', 'statRules', 'diceHooks']) walk(manifest[key], (_k, v) => checkGender(v, key));
  for (const [ctx, msg] of genderIssues) warnings.push(`${ctx}: ${msg}`);
  // La UI muestra estos textos directo del manifiesto: ahí las formas se verían crudas
  for (const key of ['codex', 'items', 'traits', 'characters']) {
    walk(manifest[key], (_k, v) => {
      if (typeof v === 'string' && GENDER_RE.test(v)) errors.push(`${key}: las formas de género no funcionan aquí (la pantalla las muestra tal cual): "${v.slice(0, 60)}"`);
      GENDER_RE.lastIndex = 0;
    });
  }

  const talk = manifest.ai?.talk;
  if (talk) {
    for (const key of ['perScene', 'maxUses']) {
      const v = talk[key];
      if (v !== undefined && (!Number.isInteger(v) || v < 0)) errors.push(`ai.talk.${key} debe ser un entero >= 0`);
    }
  }
  if (manifest.ai?.narratorChat !== undefined) warnings.push('ai.narratorChat ya no se usa: ahora es ai.talk { perScene, maxUses }');
  const reactChance = manifest.ai?.reactChance;
  if (reactChance !== undefined && (typeof reactChance !== 'number' || reactChance < 0 || reactChance > 1)) {
    errors.push('ai.reactChance debe ser un número entre 0 y 1');
  }

  // --- Por escena ---
  const edges = {};
  for (const id of Object.keys(scenes)) {
    const scenario = scenes[id].scenario;
    for (const name of [scenario?.sfx ?? []].flat()) checkSfx(name, `${where(id)} scenario.sfx`);
    if (scenario?.ambience && scenario.ambience !== 'none' && !AMBIENCE_NAMES.has(scenario.ambience)) {
      errors.push(`${where(id)}: ambiente "${scenario.ambience}" no existe (${[...AMBIENCE_NAMES].join(', ')})`);
    }
    const seq = scenes[id].sequence;
    if (!Array.isArray(seq)) {
      errors.push(`${where(id)}: "sequence" no es una lista`);
      edges[id] = [];
      continue;
    }
    if (seq.length === 0) warnings.push(`${where(id)}: escena sin pasos`);

    const targets = new Set();
    walk(seq, (key, value, parent) => {
      // goto y variantes como bustGoto (tienda) cuentan como destinos
      if ((key === 'goto' || /Goto$/.test(key)) && typeof value === 'string' && value !== '') {
        targets.add(value);
        if (!validTargets.has(value)) errors.push(`${where(id)}: goto a escena inexistente "${value}"`);
      }
      if (key === 'character' && typeof value === 'string' && parent.type === 'dialog') {
        if (!characters[value]) errors.push(`${where(id)}: personaje "${value}" no definido`);
        if (!parent.lines?.length && !parent.pool) {
          if (parent.ai) warnings.push(`${where(id)}: dialog solo con "ai" (sin lines/pool): si la IA falla no se muestra nada`);
          else errors.push(`${where(id)}: dialog sin "lines" ni "pool"`);
        }
        if (parent.ai && !parent.ai.prompt) errors.push(`${where(id)}: dialog.ai sin "prompt"`);
      }
      if (key === 'pool' && parent.type === 'dialog') checkPool(value, where(id));
      // sfx en pasos sound/notify, opciones, cosas examinables, usos de objeto y enemigos ({ hit, death })
      if (key === 'sfx') {
        if (typeof value === 'string') checkSfx(value, where(id));
        else if (value && typeof value === 'object') for (const v of Object.values(value)) checkSfx(v, where(id));
      }
      if (key === 'type' && value === 'sound' && !parent.sfx && !parent.src) errors.push(`${where(id)}: paso sound sin "sfx" ni "src"`);
      if ((key === 'inventory' || key === 'removeInventory') && Array.isArray(value)) {
        for (const item of value) checkItem(item, where(id));
      }
      if ((key === 'unlockCodex' || (key === 'codex' && !parent.command)) && Array.isArray(value)) {
        for (const entry of value) {
          if (!manifest.codex?.entries?.[entry]) errors.push(`${where(id)}: entrada de códice "${entry}" no existe en game.json → codex.entries`);
        }
      }
    });
    edges[id] = [...targets];

    // La escena actual ya cuenta como visitada al entrar: estas condiciones nunca se comportan como se espera
    walk(seq, (key, value) => {
      if ((key === 'unvisitedScenes' || key === 'visitedScenes') && Array.isArray(value) && value.includes(id)) {
        warnings.push(`${where(id)}: ${key} incluye la propia escena (ya está visitada al entrar); usa un flag`);
      }
    });

    // Modos chat
    for (const [i, step] of seq.entries()) {
      if (step?.type !== 'ai_chat') continue;
      const ctx = `${where(id)} paso ${i + 1} (ai_chat)`;
      if (!CHAT_MODES.has(step.mode)) errors.push(`${ctx}: modo "${step.mode}" desconocido`);
      if (!characters[step.npc]) errors.push(`${ctx}: npc "${step.npc}" no definido`);
      if (!step.fallback?.stat || typeof step.fallback?.difficulty !== 'number') {
        errors.push(`${ctx}: falta "fallback" { stat, difficulty } (se usa si no hay IA)`);
      }
      const outcomes = Object.keys(step.outcomes ?? {});
      if (!outcomes.length) errors.push(`${ctx}: sin "outcomes"`);
      if (step.mode !== 'confesion' && !step.outcomes?.success) warnings.push(`${ctx}: sin outcome "success"`);
      if (step.mode !== 'confesion' && !step.outcomes?.failure) warnings.push(`${ctx}: sin outcome "failure"`);
      checkConsequences(step.gestures, `${ctx} gestures`);
    }

    // Acción libre y reacciones del narrador
    for (const [i, step] of seq.entries()) {
      if (step?.type === 'shop' && step.npc && !characters[step.npc]) errors.push(`${where(id)} paso ${i + 1} (shop): npc "${step.npc}" no definido`);
      if (step?.type !== 'choice') continue;
      const ctx = `${where(id)} paso ${i + 1} (choice)`;
      if (step.freeText) {
        if (!manifest.ai) warnings.push(`${ctx}: "freeText" sin "ai" en game.json: nunca se ofrece`);
        if (typeof step.freeText === 'object') {
          checkConsequences(step.freeText.consequences, `${ctx} freeText`, Object.keys(manifest.ai?.freeText?.consequences ?? {}).length);
        }
      }
      for (const [j, value] of [step.aiReact, ...(step.options ?? []).map((o) => o.aiReact)].entries()) {
        if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 1)) {
          errors.push(`${ctx}: aiReact${j ? ` de la opción ${j}` : ''} debe ser un número entre 0 y 1`);
        }
      }
    }

    if (targets.size === 0) {
      warnings.push(`${where(id)}: sin salida (ningún goto); el jugador queda atascado al terminar`);
    }
  }
  for (const item of manifest.initialInventory ?? []) checkItem(item, 'initialInventory');

  // --- Reglas automáticas y hooks de dados ---
  const ruleTargets = [];
  const ruleIds = new Set();
  for (const [i, rule] of (manifest.statRules ?? []).entries()) {
    const ctx = `statRules[${rule.id ?? i}]`;
    if (!rule.id) errors.push(`${ctx}: falta "id"`);
    else if (ruleIds.has(rule.id)) errors.push(`${ctx}: id duplicado`);
    ruleIds.add(rule.id);
    if (!rule.condition) errors.push(`${ctx}: falta "condition"`);
    if (rule.pool) checkPool(rule.pool, ctx);
    if (rule.character && !characters[rule.character]) errors.push(`${ctx}: personaje "${rule.character}" no definido`);
    if (rule.goto) {
      if (!validTargets.has(rule.goto)) errors.push(`${ctx}: goto a escena inexistente "${rule.goto}"`);
      ruleTargets.push(rule.goto);
    }
    if (!rule.once && !rule.goto && !rule.effects) {
      warnings.push(`${ctx}: sin "once", "goto" ni "effects"; se disparará después de cada paso mientras se cumpla`);
    }
  }
  for (const [outcome, hook] of Object.entries(manifest.diceHooks ?? {})) {
    checkPool(hook.pool, `diceHooks.${outcome}`);
  }
  for (const [pid, lines] of Object.entries(pools)) {
    if (!Array.isArray(lines) || lines.length === 0) warnings.push(`linePools.${pid}: vacío`);
  }

  // --- Alcanzabilidad desde start (y la escena de edad) ---
  const reached = new Set();
  // Las reglas pueden disparar en cualquier escena: sus destinos son alcanzables
  const queue = [...entryScenes, ...ruleTargets].filter((s) => scenes[s]);
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
