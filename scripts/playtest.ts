// scripts/playtest.ts
// Bot de playtest: juega muchas partidas al azar con el motor real y los datos del juego.
// Detecta errores, escenas atascadas, variables {…} sin resolver y mide la cobertura.
//
// Uso:
//   npm run playtest -- calabosos            → 300 partidas
//   npm run playtest -- calabosos 1000       → 1000 partidas
//   npm run playtest -- calabosos 200 --seed=42
//
// Sin IA: los modos chat se resuelven con su tirada de respaldo (como en el juego sin servidor).
//
// Simular jugadores para la analítica del admin (manda los eventos al servidor):
//   npm run playtest -- calabosos 200 --send-events=http://127.0.0.1:8099/api/events.php

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { GameEngine } from '../src/engine/GameEngine';
import type { GameManifest, ScenesFile } from '../src/types/game';
import type { StepResult, PlayerAction } from '../src/types/engine';
import type { GameEvent } from '../src/engine/AiProvider';

const MAX_STEPS = 1500;
const MAX_SCENE_ENTRIES = 400;
const NAMES = ['Pepe', 'bob', 'Takashi', '', 'Link', 'Narrador', 'Juanito Pérez de la Rosa Sánchez', 'culo'];
const SPECIAL = new Set(['_quit', '_restart', '_game_over', '_age_accept']);
const MAX_CHECKPOINT_RETRIES = 3; // el bot reintenta desde el punto seguro, como haría un jugador

// --- Azar reproducible (mulberry32) ---
const seedArg = process.argv.find((a) => a.startsWith('--seed='));
let seed = seedArg ? Number(seedArg.split('=')[1]) : Date.now() % 1e9;
const initialSeed = seed;
function rand(): number {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
Math.random = rand; // dados, pools y eventos aleatorios del motor usan la misma semilla
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

// --- Carga del juego desde disco (igual que GameLoader, sin fetch) ---
function loadFromDisk(game: string): { manifest: GameManifest; scenes: ScenesFile } {
  const base = resolve(process.cwd(), 'public', 'games', game);
  if (!existsSync(join(base, 'game.json'))) throw new Error(`No existe public/games/${game}/game.json`);
  const manifest = JSON.parse(readFileSync(join(base, 'game.json'), 'utf8')) as GameManifest;
  const files = manifest.sceneFiles?.length ? manifest.sceneFiles : ['scenes.json'];
  const scenes: ScenesFile = { scenes: {} };
  for (const f of files) {
    const part = JSON.parse(readFileSync(join(base, f), 'utf8')) as ScenesFile;
    Object.assign(scenes.scenes, part.scenes);
  }
  return { manifest, scenes };
}

interface RunResult {
  steps: number;
  end: string; // _quit | _restart | _game_over | stuck:<escena> | limit | error
  scenes: string[];
  deaths: number;
  error?: string;
}

const sendArg = process.argv.find((a) => a.startsWith('--send-events='));
const sendUrl = sendArg ? sendArg.slice('--send-events='.length) : null;
let sentEvents = 0;

/** Manda los eventos de una partida simulada al servidor, en lotes */
async function sendEvents(events: (GameEvent & { t: number })[]): Promise<void> {
  if (!sendUrl || !events.length) return;
  const sessionId = crypto.randomUUID();
  for (let i = 0; i < events.length; i += 50) {
    let res: Response;
    for (let attempt = 0; ; attempt++) {
      res = await fetch(sendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, game, events: events.slice(i, i + 50) }),
      });
      // Límite por minuto del servidor: esperar y reintentar
      if (res.status !== 429 || attempt >= 30) break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    const data = (await res.json().catch(() => ({}))) as { stored?: number; error?: string };
    if (!res.ok) throw new Error(`El servidor rechazó los eventos: ${res.status} ${data.error ?? ''}`);
    sentEvents += data.stored ?? 0;
  }
}

const game = process.argv[2];
const runs = Number(process.argv[3]) || 300;
if (!game) {
  console.error('Uso: npm run playtest -- <juego> [partidas] [--seed=N]');
  process.exit(1);
}
const { manifest, scenes } = loadFromDisk(game);
const allScenes = Object.keys(scenes.scenes);
const coverage = new Map<string, number>();
const leaks = new Map<string, string>(); // texto con {variable} sin resolver → escena
const stuck = new Map<string, number>();
const ends = new Map<string, number>();
const errors: string[] = [];
const deathCauses = new Map<string, number>();
const loopScenes = new Map<string, number>(); // escenas más repetidas en partidas que llegan al límite

function checkText(text: string | undefined, scene: string): void {
  if (!text) return;
  const m = text.match(/\{[a-zA-Z0-9_.]+\}/);
  if (m && !leaks.has(m[0])) leaks.set(m[0], scene);
}

/** Decide la acción para un prompt (null = no sabe responder) */
function answer(r: StepResult, examined: Set<string>): PlayerAction | null {
  switch (r.type) {
    case 'choice_prompt':
    case 'timed_choice_prompt':
      return r.options.length ? { type: 'choose', index: pick(r.options).index } : null;
    case 'dice_prompt':
    case 'shop_dice_prompt':
      return { type: 'roll_dice' };
    case 'input_prompt':
      return { type: 'submit_input', value: pick(NAMES) };
    case 'examine_prompt': {
      // Como un jugador curioso: revisa lo que no ha revisado; a veces se va antes
      const fresh = r.subjects.filter((s) => !examined.has(s.id));
      if (!fresh.length || rand() < 0.1) return { type: 'examine_exit' };
      const chosen = pick(fresh);
      examined.add(chosen.id);
      return { type: 'examine_select', subjectId: chosen.id };
    }
    case 'use_item_prompt':
      if (!r.playerInventory.length || !r.targets.length || rand() < 0.1) return { type: 'use_item_exit' };
      return { type: 'use_item_on', itemId: pick(r.playerInventory), targetId: pick(r.targets).id };
    case 'shop_prompt': {
      const affordable = r.items.map((it, i) => ({ it, i })).filter(({ it }) => it.canAfford);
      if (affordable.length && rand() < 0.6) return { type: 'shop_buy', itemIndex: pick(affordable).i };
      if (r.canHaggle && r.items.length && rand() < 0.2) return { type: 'shop_haggle', itemIndex: Math.floor(rand() * r.items.length) };
      if (r.canSteal && r.items.length && rand() < 0.05) return { type: 'shop_steal', itemIndex: Math.floor(rand() * r.items.length) };
      return { type: 'shop_exit' };
    }
    case 'combat_prompt': {
      // Jugador razonable: se cura con poca vida, usa sal y luz, a veces defiende o huye
      const items = r.usableItems ?? [];
      const has = (re: RegExp) => items.find((i) => re.test(i.itemId));
      const heal = has(/pocion|corazon/);
      if (heal && r.playerHp < 35) return { type: 'combat_action', action: `use_item:${heal.itemId}` };
      const smart = has(/^sal$|antorcha|lampara|boton/);
      if (smart && rand() < 0.5) return { type: 'combat_action', action: `use_item:${smart.itemId}` };
      if (r.actions.includes('flee') && r.playerHp < 20 && rand() < 0.5) return { type: 'combat_action', action: 'flee' };
      if (rand() < 0.15) return { type: 'combat_action', action: 'defend' };
      return { type: 'combat_action', action: 'attack' };
    }
    case 'puzzle_prompt':
      return { type: 'puzzle_exit' };
    case 'craft_prompt':
      return { type: 'craft_exit' };
    case 'level_up_prompt':
      return { type: 'level_up_done' };
    case 'chat_prompt':
      return { type: 'chat_giveup' };
    default:
      return null;
  }
}

const PROMPTS = new Set([
  'choice_prompt', 'timed_choice_prompt', 'dice_prompt', 'shop_dice_prompt', 'input_prompt', 'examine_prompt',
  'use_item_prompt', 'shop_prompt', 'combat_prompt', 'puzzle_prompt', 'craft_prompt', 'level_up_prompt', 'chat_prompt',
]);

async function playOnce(): Promise<RunResult & { events: (GameEvent & { t: number })[] }> {
  const engine = new GameEngine(structuredClone(manifest), structuredClone(scenes));
  engine.loadMeta({});
  // Reloj simulado: cada evento avanza entre 2 y 12 segundos (duraciones realistas en la analítica)
  const events: (GameEvent & { t: number })[] = [];
  let clock = Date.now() - 3 * 3600 * 1000;
  if (sendUrl) engine.setEventSink((ev) => { clock += 2000 + Math.floor(rand() * 10000); events.push({ ...ev, t: clock }); });
  const result = { steps: 0, end: 'limit', scenes: [] as string[], deaths: 0, events };
  let scene = 'start';
  let entries = 0;
  let retries = 0;
  const examined = new Set<string>();

  while (entries++ < MAX_SCENE_ENTRIES) {
    result.scenes.push(scene);
    if (scene === 'muerte') {
      result.deaths++;
      const cause = String(engine.state.stats.causa_muerte ?? '?') + ` (desde ${result.scenes[result.scenes.length - 2] ?? '?'})`;
      deathCauses.set(cause, (deathCauses.get(cause) ?? 0) + 1);
    }
    const it = engine.enterScene(scene);
    let next: string | null = null;
    let r = await it.next();
    while (!r.done) {
      if (++result.steps > MAX_STEPS) return result;
      const v = r.value;
      if (v.type === 'dialog') v.lines.forEach((l) => checkText(l, scene));
      if (v.type === 'choice_prompt') v.options.forEach((o) => checkText(o.text, scene));
      if (v.type === 'dice_result' || v.type === 'random_result' || v.type === 'check_result') checkText(v.text, scene);
      if (v.type === 'notify') { checkText(v.title, scene); checkText(v.text, scene); }
      if (v.type === 'chat_end') checkText(v.text, scene);
      if (v.type === 'navigate') {
        next = v.scene;
        break;
      }
      if (PROMPTS.has(v.type)) {
        const action = answer(v, examined);
        if (!action) {
          result.end = `sin-respuesta:${v.type}@${scene}`;
          return result;
        }
        engine.sendAction(action);
      }
      r = await it.next();
    }
    if (!next) {
      result.end = `atascado:${scene}`;
      return result;
    }
    if (next === '_checkpoint') {
      const cp = retries++ < MAX_CHECKPOINT_RETRIES ? engine.restoreCheckpoint() : null;
      if (!cp) {
        result.end = 'se rinde tras morir';
        return result;
      }
      next = cp;
    }
    if (SPECIAL.has(next)) {
      result.end = next;
      return result;
    }
    if (!scenes.scenes[next]) {
      result.end = `escena-inexistente:${next}`;
      return result;
    }
    scene = next;
  }
  return result;
}

const t0 = Date.now();
let totalSteps = 0;
let totalDeaths = 0;
let reachedLast = 0;
for (let i = 0; i < runs; i++) {
  let res: RunResult;
  try {
    const played = await playOnce();
    res = played;
    if (sendUrl) await sendEvents(played.events);
  } catch (e) {
    const msg = e instanceof Error ? `${e.message}\n${e.stack?.split('\n').slice(1, 4).join('\n')}` : String(e);
    if (errors.length < 5) errors.push(msg);
    res = { steps: 0, end: 'error', scenes: [], deaths: 0 };
  }
  totalSteps += res.steps;
  totalDeaths += res.deaths;
  for (const s of new Set(res.scenes)) coverage.set(s, (coverage.get(s) ?? 0) + 1);
  const endKey = res.end.startsWith('atascado:') || res.end.startsWith('sin-respuesta:') || res.end.startsWith('escena-inexistente:') ? res.end : res.end;
  ends.set(endKey, (ends.get(endKey) ?? 0) + 1);
  if (res.end === 'limit') {
    const counts = new Map<string, number>();
    for (const s of res.scenes) counts.set(s, (counts.get(s) ?? 0) + 1);
    const top = [...counts].sort((a, b) => b[1] - a[1])[0];
    if (top) loopScenes.set(top[0], (loopScenes.get(top[0]) ?? 0) + 1);
  }
  if (res.end.startsWith('atascado:')) stuck.set(res.end.slice(9), (stuck.get(res.end.slice(9)) ?? 0) + 1);
  if (res.scenes.some((s) => s.startsWith('final_'))) reachedLast++;
}

// --- Informe ---
const pct = (n: number) => `${Math.round((n * 100) / runs)}%`;
console.log(`\n🤖 Playtest de "${game}": ${runs} partidas · semilla ${initialSeed} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
console.log(`   Pasos promedio: ${Math.round(totalSteps / runs)} · muertes promedio: ${(totalDeaths / runs).toFixed(2)} · llegan a un final: ${pct(reachedLast)}`);
console.log('\nCómo terminan las partidas:');
for (const [end, n] of [...ends].sort((a, b) => b[1] - a[1])) console.log(`   ${String(n).padStart(5)} (${pct(n).padStart(4)})  ${end}`);

if (loopScenes.size) {
  console.log('\nEn las partidas que llegan al límite, la escena más repetida fue:');
  for (const [s, n] of [...loopScenes].sort((a, b) => b[1] - a[1]).slice(0, 5)) console.log(`   ${s} (${n} partidas)`);
}

if (deathCauses.size) {
  console.log('\nMuertes (causa · escena anterior):');
  for (const [c, n] of [...deathCauses].sort((a, b) => b[1] - a[1]).slice(0, 8)) console.log(`   ${String(n).padStart(5)}  ${c}`);
}

const never = allScenes.filter((s) => !coverage.has(s) && !s.startsWith('edad'));
console.log(`\nCobertura: ${allScenes.length - never.length}/${allScenes.length} escenas visitadas al menos una vez`);
if (never.length) console.log(`   Nunca visitadas: ${never.join(', ')}`);

let problems = 0;
if (leaks.size) {
  problems += leaks.size;
  console.log('\n✘ Variables sin resolver en textos:');
  for (const [v, s] of leaks) console.log(`   ${v}  (escena ${s})`);
}
if (stuck.size) {
  problems += stuck.size;
  console.log('\n✘ Escenas donde el jugador queda atascado (terminan sin navegar):');
  for (const [s, n] of stuck) console.log(`   ${s} (${n} veces)`);
}
const weird = [...ends.keys()].filter((e) => e.startsWith('sin-respuesta:') || e.startsWith('escena-inexistente:') || e === 'error');
if (weird.length || errors.length) {
  problems += weird.length + errors.length;
  console.log('\n✘ Errores:');
  for (const e of weird) console.log(`   ${e}`);
  for (const e of errors) console.log(`   ${e}`);
}
if (sendUrl) console.log(`\n📨 Eventos enviados al servidor: ${sentEvents}`);
console.log(problems ? `\n${problems} problema(s).\n` : '\n✔ Sin problemas.\n');
process.exit(problems ? 1 : 0);
