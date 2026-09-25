// Texto narrativo: variables, pools sin repetición, contadores meta, reglas automáticas,
// límites de stats, modificadores y reacciones a dados, condiciones y códice.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { interpolate, pickFromPool, sanitizeAiText } from '../../src/engine/NarrativeText';
import { applyEffects } from '../../src/engine/EffectsApplier';
import { evaluateCondition } from '../../src/engine/ConditionEvaluator';
import type { PlayerState } from '../../src/types/engine';
import type { GameManifest } from '../../src/types/game';
import { baseManifest, makeEngine, internals, collect, dialogLines, drive } from '../helpers';

afterEach(() => vi.restoreAllMocks());

const emptyState = (extra: Partial<PlayerState> = {}): PlayerState => ({
  stats: {}, flags: {}, inventory: [], visitedScenes: [], time: { phase: 'm', actions: 0, cycles: 0 },
  characters: {}, relationships: {}, activeTraits: [], sceneCount: 0, ...extra,
});

describe('interpolate', () => {
  it('reemplaza stats y contadores meta', () => {
    const st = emptyState({ stats: { nombre_jugador: 'Pepe' }, meta: { muertes: 3 } });
    expect(interpolate('Hola {nombre_jugador} ({meta.muertes})', st)).toBe('Hola Pepe (3)');
  });
  it('meta inexistente vale 0 y las variables desconocidas quedan tal cual', () => {
    expect(interpolate('{meta.nada} {nose}', emptyState())).toBe('0 {nose}');
  });
});

describe('sanitizeAiText', () => {
  it('convierte corchetes en «» y quita llaves', () => {
    expect(sanitizeAiText('burla [red]generada{x}')).toBe('burla «red»generadax');
  });
});

describe('pickFromPool', () => {
  it('no repite hasta agotar y luego rebaraja', () => {
    const st = emptyState();
    let used: number[] = [];
    const seen: string[] = [];
    for (let i = 0; i < 3; i++) {
      const p = pickFromPool(['x', 'y', 'z'], used, st);
      used = p.used;
      seen.push(p.lines[0]);
    }
    expect(new Set(seen).size).toBe(3);
    expect(pickFromPool(['x', 'y', 'z'], used, st).lines).toHaveLength(1);
  });
  it('filtra por condición', () => {
    const pool = [{ text: 'novato', condition: { meta: { muertes: '<=1' } } }, { text: 'veterano', condition: { meta: { muertes: '>=2' } } }];
    expect(pickFromPool(pool, [], emptyState({ meta: { muertes: 5 } })).lines).toEqual(['veterano']);
  });
});

describe('efectos y condiciones', () => {
  it('effects.meta suma y condition.meta compara', () => {
    const st = applyEffects(emptyState({ meta: { muertes: 1 } }), { meta: { muertes: 1 } });
    expect(st.meta?.muertes).toBe(2);
    expect(evaluateCondition({ meta: { muertes: '>=2' } }, st)).toBe(true);
  });
  it('textMatches es regex sin distinguir mayúsculas', () => {
    const st = emptyState({ stats: { nombre_real: 'TAKASHI' } });
    expect(evaluateCondition({ textMatches: { nombre_real: 'takashi|komuro' } }, st)).toBe(true);
    expect(evaluateCondition({ textMatches: { nombre_real: '^bob$' } }, st)).toBe(false);
  });
  it('notInventory', () => {
    const st = emptyState({ inventory: ['sal'] });
    expect(evaluateCondition({ notInventory: ['sal'] }, st)).toBe(false);
    expect(evaluateCondition({ notInventory: ['pañal'] }, st)).toBe(true);
  });
  it('unlockCodex sin duplicados y condition.codex', () => {
    let st = applyEffects(emptyState(), { unlockCodex: ['a', 'b'] });
    st = applyEffects(st, { unlockCodex: ['b', 'c'] });
    expect(st.codex).toEqual(['a', 'b', 'c']);
    expect(evaluateCondition({ codex: ['a', 'c'] }, st)).toBe(true);
    expect(evaluateCondition({ codex: ['z'] }, st)).toBe(false);
  });
});

describe('motor: diálogos, reglas y meta', () => {
  const manifest: GameManifest = baseManifest({
    statDefs: { vida: { label: 'Vida', min: 0, max: 100 }, pis: { label: 'Pis', min: 0, max: 100 }, miedo: { label: 'Miedo', min: 0, max: 100 } },
    initialStats: { vida: 100, pis: 0, miedo: 0, nombre_jugador: 'Pepe' },
    linePools: {
      burla: ['a', 'b', 'c'],
      muerte: [{ text: 'primera', condition: { meta: { muertes: '<=1' } } }, { text: 'veterano {meta.muertes}', condition: { meta: { muertes: '>=2' } } }],
    },
    statRules: [
      { id: 'accidente', condition: { stats: { pis: '>=100' } }, lines: ['Te measte, {nombre_jugador}.'], effects: { setStats: { pis: 0 } } },
      { id: 'muerte', condition: { stats: { vida: '<=0' } }, goto: 'muerte' },
    ],
    diceModifiers: [{ stat: 'miedo', per: 20, amount: -1 }],
  });
  const scenes = {
    start: { sequence: [
      { type: 'dialog' as const, character: 'narrator', lines: ['Hola {nombre_jugador} ({meta.muertes})'], pool: 'burla', count: 2 },
      { type: 'effects' as const, effects: { stats: { pis: 150, vida: 50 } } },
      { type: 'effects' as const, effects: { stats: { vida: -500 } } },
      { type: 'dialog' as const, character: 'narrator', lines: ['no debería verse'] },
    ] },
    muerte: { sequence: [
      { type: 'effects' as const, effects: { meta: { muertes: 1 } } },
      { type: 'dialog' as const, character: 'narrator', lines: [], pool: 'muerte' },
      { type: 'dialog' as const, character: 'narrator', lines: ['fin de muerte'] },
    ] },
  };

  it('interpola, usa pools, dispara reglas, recorta stats y navega a la muerte', async () => {
    const engine = makeEngine(manifest, scenes);
    engine.loadMeta({ muertes: 1 });
    const out = await collect(engine.enterScene('start'));
    const lines = dialogLines(out);
    expect(lines[0]).toBe('Hola Pepe (1)');
    expect(new Set(lines.slice(1, 3)).size).toBe(2);
    expect(lines).toContain('Te measte, Pepe.');
    expect(engine.state.stats.pis).toBe(0);
    expect(engine.state.stats.vida).toBe(0);
    expect(out.find((r) => r.type === 'navigate')).toMatchObject({ scene: 'muerte' });
    expect(lines).not.toContain('no debería verse');
  });

  it('la regla no hace bucle en su escena destino y el listener persiste meta', async () => {
    const engine = makeEngine(manifest, scenes);
    engine.loadMeta({ muertes: 1 });
    const persisted: Record<string, number>[] = [];
    engine.setMetaListener((m) => persisted.push(m));
    internals(engine)._state.stats.vida = 0;
    const out = await collect(engine.enterScene('muerte'));
    expect(dialogLines(out)).toEqual(['veterano 2', 'fin de muerte']);
    expect(out.some((r) => r.type === 'navigate')).toBe(false);
    expect(persisted.at(-1)).toEqual({ muertes: 2 });
  });

  it('reset y restoreState conservan los contadores meta actuales', () => {
    const engine = makeEngine(manifest, scenes);
    engine.loadMeta({ muertes: 2 });
    engine.reset();
    expect(engine.state.meta?.muertes).toBe(2);
    engine.restoreState({ ...engine.state, meta: { muertes: 0 } });
    expect(engine.state.meta?.muertes).toBe(2);
  });

  it('modificador global de dados por miedo', () => {
    const engine = makeEngine(manifest, scenes);
    internals(engine)._state.stats.miedo = 60;
    expect(internals(engine).globalDiceModifier()).toBe(-3);
  });
});

describe('reacciones a dados (diceHooks)', () => {
  const manifest = baseManifest({
    linePools: { pifia: ['estamos jodidos'], fracaso: ['mmm, no'] },
    diceHooks: { critical_failure: { pool: 'pifia' }, failure: { pool: 'fracaso', chance: 0.35 } },
  });
  it('dispara el pool del resultado', () => {
    const e = internals(makeEngine(manifest, {}));
    expect([...e.diceHook('critical_failure')][0].lines).toEqual(['estamos jodidos']);
    expect([...e.diceHook('success')]).toHaveLength(0);
  });
  it('respeta la probabilidad', () => {
    const e = internals(makeEngine(manifest, {}));
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect([...e.diceHook('failure')]).toHaveLength(0);
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    expect([...e.diceHook('failure')]).toHaveLength(1);
  });
});

describe('formas de género del protagonista', () => {
  const gender = { stat: 'genero', forms: { masculino: 0, femenino: 1, no_binario: 2, misterioso: 2 }, ai: { femenino: 'BOB es mujer' } };
  const st = (genero?: string) => ({ stats: genero ? { genero, nombre_jugador: 'BOB' } : { nombre_jugador: 'BOB' } }) as unknown as PlayerState;

  it('elige la forma según la stat; sin valor o con menos formas usa la primera', () => {
    const t = 'Bienvenid{o|a|e}, {héroe|heroína|heroe} {nombre_jugador}. {El|La} que manda.';
    expect(interpolate(t, st('masculino'), gender)).toBe('Bienvenido, héroe BOB. El que manda.');
    expect(interpolate(t, st('femenino'), gender)).toBe('Bienvenida, heroína BOB. La que manda.');
    expect(interpolate(t, st('no_binario'), gender)).toBe('Bienvenide, heroe BOB. El que manda.');
    expect(interpolate(t, st(), gender)).toBe('Bienvenido, héroe BOB. El que manda.');
    expect(interpolate(t, st('femenino'))).toBe('Bienvenido, héroe BOB. El que manda.');
  });

  it('el motor resuelve el género en cualquier texto que produce (notify, opciones) y avisa a la IA', async () => {
    const manifest = baseManifest({ gender, initialStats: { genero: 'femenino' } } as Partial<GameManifest>);
    const engine = makeEngine(manifest, {
      a: { sequence: [
        { type: 'notify' as const, title: '¡Bienvenid{o|a|e}!', text: 'Eres {el elegido|la elegida|le elegide}.' },
        { type: 'choice' as const, options: [{ text: 'Seguir, {cansado|cansada|cansade}', goto: 'a' }] },
      ] },
    });
    const out = await drive(engine, 'a', []);
    expect(out.find((r) => r.type === 'notify')).toMatchObject({ title: '¡Bienvenida!', text: 'Eres la elegida.' });
    expect(out.find((r) => r.type === 'choice_prompt')).toMatchObject({ options: [{ text: 'Seguir, cansada' }] });
    expect(internals(engine).aiVars().genero).toBe('BOB es mujer');
  });
});
