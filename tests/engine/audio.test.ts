// Audio en el motor: pasos sound con efectos del catálogo, ambientes por escena,
// sonidos en opciones/dados/enemigos y música de combate.

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { StepResult } from '../../src/types/engine';
import { baseManifest, makeEngine, collect, drive } from '../helpers';

afterEach(() => vi.restoreAllMocks());

const of = <T extends StepResult['type']>(out: StepResult[], type: T) =>
  out.filter((r): r is Extract<StepResult, { type: T }> => r.type === type);

describe('pasos y escenarios', () => {
  it('sound con sfx del catálogo; src se resuelve contra la carpeta del juego', async () => {
    const engine = makeEngine(baseManifest(), {
      start: { sequence: [
        { type: 'sound', sfx: 'puerta', wait: true },
        { type: 'sound', src: 'audio/grito.ogg', volume: 0.5 },
      ] },
    });
    (engine as unknown as { _basePath: string })._basePath = 'games/x';
    const [a, b] = of(await collect(engine.enterScene('start')), 'sound');
    expect(a).toMatchObject({ sfx: 'puerta', src: undefined, wait: true, volume: 1 });
    expect(b).toMatchObject({ src: 'games/x/audio/grito.ogg', sfx: undefined, wait: false, volume: 0.5 });
  });

  it('ambiente: explícito, "none" lo apaga, con música propia se apaga, sin música se mantiene', async () => {
    const engine = makeEngine(baseManifest(), {
      a: { scenario: { name: 'A', music: 'm.ogg', ambience: 'lluvia', sfx: 'campana' }, sequence: [] },
      b: { scenario: { name: 'B', ambience: 'none' }, sequence: [] },
      c: { scenario: { name: 'C', music: 'otra.ogg' }, sequence: [] },
      d: { scenario: { name: 'D' }, sequence: [] },
    });
    const scen = async (id: string) => of(await collect(engine.enterScene(id)), 'scenario')[0];
    expect(await scen('a')).toMatchObject({ ambience: 'lluvia', sfx: ['campana'] });
    expect((await scen('b')).ambience).toBeNull();
    expect((await scen('c')).ambience).toBeNull();
    expect((await scen('d')).ambience).toBeUndefined();
  });

  it('una opción con sfx suena al elegirla', async () => {
    const engine = makeEngine(baseManifest(), {
      start: { sequence: [{ type: 'choice', options: [{ text: 'Abrir', sfx: 'puerta', goto: 'b' }] }] },
      b: { sequence: [] },
    });
    const out = await drive(engine, 'start', [{ type: 'choose', index: 0 }]);
    expect(of(out, 'sound')).toEqual([{ type: 'sound', sfx: 'puerta', volume: 1, wait: false }]);
  });

  it('dados y eventos al azar llevan el sfx del resultado', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0); // dado natural 1, primer resultado aleatorio
    const engine = makeEngine(baseManifest({ initialStats: { suerte: 0 } }), {
      start: { sequence: [
        { type: 'random', outcomes: [{ weight: 1, text: 'pluf', sfx: 'chapoteo' }] },
        { type: 'dice', stat: 'suerte', difficulty: 10, faces: 20, description: 'd',
          results: { success: { text: 'ok' }, failure: { text: 'no', sfx: 'caida' } },
          tiers: [{ natural: 1, text: 'pifia', sfx: 'pedo' }] },
      ] },
    });
    const out = await drive(engine, 'start', [{ type: 'roll_dice' }]);
    expect(of(out, 'random_result')[0].sfx).toBe('chapoteo');
    expect(of(out, 'dice_result')[0].sfx).toBe('pedo');
  });
});

describe('combate', () => {
  const manifest = baseManifest({
    initialStats: { vida: 100, fuerza: 50 },
    audio: { combatMusic: 'audio/pelea.ogg' },
  });
  const combat = (extra: object = {}, enemy: object = {}) => makeEngine(manifest, {
    start: { sequence: [{
      type: 'combat', enemy: { name: 'Babosa', hp: 1, attack: 1, defense: 0, sfx: { hit: 'baba', death: 'explosion_baba' }, ...enemy },
      playerStat: 'vida', attackStat: 'fuerza', actions: ['attack'],
      results: { victory: { text: 'gana' }, defeat: { text: 'pierde' } }, ...extra,
    }] },
  });

  it('el combate trae su música (la del juego o la del paso; "none" no la cambia)', async () => {
    const prompt = async (engine: ReturnType<typeof combat>) =>
      of(await drive(engine, 'start', []), 'combat_prompt')[0];
    expect((await prompt(combat())).music).toBe('audio/pelea.ogg');
    expect((await prompt(combat({ music: 'audio/jefe.ogg' }))).music).toBe('audio/jefe.ogg');
    expect((await prompt(combat({ music: 'none' }))).music).toBeUndefined();
  });

  it('sonidos propios del enemigo al golpearlo y al morir', async () => {
    const out = await drive(combat(), 'start', [{ type: 'combat_action', action: 'attack' }]);
    expect(of(out, 'combat_turn')[0].sfx).toBe('baba');
    expect(of(out, 'combat_end')[0]).toMatchObject({ outcome: 'victory', sfx: 'explosion_baba' });
  });

  it('si revienta al morir (deathDamage) suena la explosión', async () => {
    const out = await drive(combat({}, { deathDamage: 5 }), 'start', [{ type: 'combat_action', action: 'attack' }]);
    expect(of(out, 'combat_turn')[0].sfx).toBe('explosion_baba');
  });
});
