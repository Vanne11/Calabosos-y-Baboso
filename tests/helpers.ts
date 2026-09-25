// tests/helpers.ts
// Utilidades para conducir el motor en las pruebas (sin UI).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameEngine } from '../src/engine/GameEngine';
import type { GameManifest, ScenesFile } from '../src/types/game';
import type { PlayerAction, StepResult } from '../src/types/engine';

/** Manifiesto mínimo para pruebas unitarias */
export function baseManifest(extra: Partial<GameManifest> = {}): GameManifest {
  return {
    name: 't', description: '', author: '', version: '1',
    characters: { narrator: { name: 'N', description: '', role: 'narrator' } },
    initialStats: {}, initialFlags: {}, initialInventory: [],
    time: { duration: 5, phases: ['m'], initial: 'm' },
    ...extra,
  };
}

/** Motor con un manifiesto y escenas (se clonan para no compartir estado entre pruebas) */
export function makeEngine(manifest: GameManifest, scenes: ScenesFile['scenes']): GameEngine {
  return new GameEngine(structuredClone(manifest), structuredClone({ scenes }));
}

/** Acceso a miembros privados del motor (solo para pruebas) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const internals = (engine: GameEngine) => engine as any;

/** Recorre una escena completa sin interacción */
export async function collect(gen: AsyncGenerator<StepResult>): Promise<StepResult[]> {
  const out: StepResult[] = [];
  for await (const r of gen) out.push(r);
  return out;
}

const PROMPTS = new Set(['choice_prompt', 'chat_prompt', 'dice_prompt', 'combat_prompt', 'shop_prompt', 'input_prompt']);

/**
 * Juega una escena respondiendo a cada prompt con la siguiente acción de la lista.
 * Se detiene al quedarse sin respuestas o al terminar la escena.
 */
export async function drive(engine: GameEngine, scene: string, answers: PlayerAction[]): Promise<StepResult[]> {
  const out: StepResult[] = [];
  const queue = [...answers];
  const it = engine.enterScene(scene);
  for (let r = await it.next(); !r.done; r = await it.next()) {
    out.push(r.value);
    if (PROMPTS.has(r.value.type)) {
      const action = queue.shift();
      if (!action) break;
      engine.sendAction(action);
    }
  }
  return out;
}

export const dialogLines = (out: StepResult[]) =>
  out.flatMap((r) => (r.type === 'dialog' ? r.lines : []));

/** Carga el juego real desde public/games (manifiesto + todas las escenas) */
export function loadGameFromDisk(game: string): { manifest: GameManifest; scenes: ScenesFile['scenes'] } {
  const base = join(__dirname, '..', 'public', 'games', game);
  const manifest = JSON.parse(readFileSync(join(base, 'game.json'), 'utf8')) as GameManifest;
  const scenes: ScenesFile['scenes'] = {};
  for (const f of manifest.sceneFiles?.length ? manifest.sceneFiles : ['scenes.json']) {
    Object.assign(scenes, (JSON.parse(readFileSync(join(base, f), 'utf8')) as ScenesFile).scenes);
  }
  return { manifest, scenes };
}
