// Combate por especie, armas, dados por tramos, multiplicadores de precio y puntos seguros.

import { describe, it, expect, vi, afterEach } from 'vitest';
import type { CombatEnemy } from '../../src/types/game';
import type { PlayerAction, StepResult } from '../../src/types/engine';
import { baseManifest, makeEngine, internals, drive, collect } from '../helpers';

afterEach(() => vi.restoreAllMocks());

const manifest = baseManifest({
  statDefs: { vida: { label: 'Vida', min: 0, max: 100 } },
  initialStats: { vida: 100, fuerza: 50 },
});

async function fight(enemy: Partial<CombatEnemy>, actions: string[], inventory: string[] = []) {
  const engine = makeEngine(manifest, {
    start: { sequence: [{
      type: 'combat', enemy: { name: 'X', hp: 10, attack: 1, defense: 0, ...enemy }, playerStat: 'vida', attackStat: 'fuerza',
      actions: ['attack', 'defend', 'use_item'],
      weapons: [{ itemId: 'espada', name: 'la espada', bonus: 4 }, { itemId: 'bate', name: 'el bate', bonus: 3 }],
      combatItems: [
        { itemId: 'sal', name: 'sal', damage: 50, consume: false, preventSplit: true, text: 'sal' },
        { itemId: 'luz', name: 'luz', consume: false, reveal: true, text: 'luz' },
      ],
      results: { victory: { text: 'gana' }, defeat: { text: 'pierde' } },
    }] },
  });
  internals(engine)._state.inventory = [...inventory];
  const out = await drive(engine, 'start', actions.map((a): PlayerAction => ({ type: 'combat_action', action: a })));
  return { out, engine };
}
const turns = (out: StepResult[]) => out.filter((r): r is Extract<StepResult, { type: 'combat_turn' }> => r.type === 'combat_turn');
const won = (out: StepResult[]) => out.some((r) => r.type === 'combat_end' && r.outcome === 'victory');

describe('rasgos de combate', () => {
  it('firstStrike ataca antes del primer turno', async () => {
    const { out } = await fight({ hp: 5, firstStrike: true }, ['attack']);
    expect(turns(out)[0].playerAction).toBe('ambush');
    expect(out.findIndex((r) => r.type === 'combat_turn')).toBeLessThan(out.findIndex((r) => r.type === 'combat_prompt'));
  });

  it('damagePerTurn quema cada ronda', async () => {
    const { out } = await fight({ hp: 100, damagePerTurn: 3 }, ['defend']);
    expect(turns(out)[0].text).toMatch(/\(-3\)/);
  });

  it('corrodes derrite la espada y el ataque pasa a la siguiente mejor arma', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { out, engine } = await fight({ hp: 100, corrodes: ['espada'], corrodeChance: 1 }, ['attack', 'attack'], ['espada', 'bate']);
    expect(engine.state.inventory).toEqual(['bate']);
    expect(turns(out)[0].text).toMatch(/la espada/);
    expect(turns(out)[1].text).toMatch(/el bate/);
  });

  it('dodgeChance esquiva hasta que un item con reveal la anula', async () => {
    const { out } = await fight({ hp: 100, dodgeChance: 1 }, ['attack', 'use_item:luz', 'attack'], ['luz']);
    const t = turns(out);
    expect(t[0].playerDamage).toBe(0);
    expect(t[2].playerDamage).toBeGreaterThan(0);
  });

  it('split se divide una vez; con preventSplit muere sin dividirse', async () => {
    const split = { hp: 1, split: { hp: 7, text: 'SPLIT' } };
    const melee = await fight(split, ['attack', 'attack', 'attack']);
    expect(turns(melee.out).some((t) => t.text.includes('SPLIT'))).toBe(true);
    expect(won(melee.out)).toBe(true);
    const salt = await fight(split, ['use_item:sal'], ['sal']);
    expect(turns(salt.out).some((t) => t.text.includes('SPLIT'))).toBe(false);
    expect(won(salt.out)).toBe(true);
  });

  it('deathDamage explota si muere cuerpo a cuerpo, no a distancia', async () => {
    const melee = await fight({ hp: 1, deathDamage: 20 }, ['attack']);
    expect(melee.engine.state.stats.vida).toBe(80);
    const ranged = await fight({ hp: 1, deathDamage: 20 }, ['use_item:sal'], ['sal']);
    expect(ranged.engine.state.stats.vida).toBe(100);
  });
});

describe('dados por tramos', () => {
  const tiers = [
    { natural: 1, text: 'pifia' }, { natural: 20, text: 'critico' },
    { max: 5, text: 'muy mal' }, { min: 6, max: 10, text: 'mal' }, { min: 11, max: 15, text: 'bien' }, { min: 16, text: 'muy bien' },
  ];
  const pick = (roll: number, total: number) => internals(makeEngine(manifest, {})).pickDiceTier({ tiers }, roll, total);

  it.each([
    [1, 6, 'pifia'], [20, 25, 'critico'], [3, 3, 'muy mal'], [2, 0, 'muy mal'], [8, 12, 'bien'], [19, 24, 'muy bien'],
  ])('dado %i, total %i → %s', (roll, total, text) => {
    expect(pick(roll, total).text).toBe(text);
  });
  it('sin tramos devuelve null (se usan los results clásicos)', () => {
    expect(internals(makeEngine(manifest, {})).pickDiceTier({}, 5, 5)).toBeNull();
  });
});

describe('tienda: multiplicadores de precio', () => {
  it('aplica el primero que se cumple y avisa', async () => {
    const engine = makeEngine(manifest, {
      start: { sequence: [{ type: 'shop', title: 't', currency: 'vida', items: [{ id: 'a', name: 'A', price: 15 }],
        priceMultipliers: [{ condition: { flags: { desc: true } }, multiplier: 0.5, text: 'mitad' }] }] },
    });
    internals(engine)._state.flags.desc = true;
    const out: StepResult[] = [];
    const it = engine.enterScene('start');
    for (let r = await it.next(); !r.done; r = await it.next()) {
      out.push(r.value);
      if (r.value.type === 'shop_prompt') break;
    }
    expect(out.some((r) => r.type === 'notify' && r.text === 'mitad')).toBe(true);
    const shop = out.find((r) => r.type === 'shop_prompt');
    expect(shop && shop.type === 'shop_prompt' && shop.items[0].price).toBe(8);
  });
});

describe('puntos seguros', () => {
  it('restoreCheckpoint vuelve al estado guardado conservando meta', async () => {
    const engine = makeEngine(manifest, { a: { sequence: [{ type: 'effects', effects: { checkpoint: true } }] } });
    engine.loadMeta({ muertes: 1 });
    await collect(engine.enterScene('a'));
    const e = internals(engine);
    e._state.stats.vida = 0;
    e._state.inventory = ['basura'];
    e._state.meta = { muertes: 2 };
    expect(engine.restoreCheckpoint()).toBe('a');
    expect(engine.state.stats.vida).toBe(100);
    expect(engine.state.inventory).toEqual([]);
    expect(engine.state.meta?.muertes).toBe(2);
    expect(engine.state.checkpoint?.scene).toBe('a');
  });
  it('sin punto seguro devuelve null', () => {
    expect(makeEngine(manifest, {}).restoreCheckpoint()).toBeNull();
  });
});

describe('protección de objetos (items.armor)', () => {
  it('los objetos con armor restan daño a cada golpe (mínimo 1) y se avisa al empezar', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const m = baseManifest({
      statDefs: { vida: { label: 'Vida', min: 0, max: 100 } },
      initialStats: { vida: 100, fuerza: 50 },
      items: { amuleto: { name: 'Amuleto', description: '', armor: 2 }, piedra: { name: 'Piedra', description: '' } },
    });
    const engine = makeEngine(m, {
      start: { sequence: [{
        type: 'combat', enemy: { name: 'X', hp: 100, attack: 5, defense: 0 }, playerStat: 'vida', attackStat: 'fuerza',
        actions: ['attack', 'defend'], results: { victory: { text: 'gana' }, defeat: { text: 'pierde' } },
      }] },
    });
    internals(engine)._state.inventory = ['amuleto', 'amuleto', 'piedra'];
    const out = await drive(engine, 'start', [{ type: 'combat_action', action: 'defend' }]);
    expect(out.find((r) => r.type === 'notify')).toMatchObject({ title: 'Protección', text: 'Amuleto: cada golpe te hace 2 menos de daño.' });
    // defender: floor(5 * 0.5) = 2, menos 2 de protección → mínimo 1
    expect(engine.state.stats.vida).toBe(99);
  });
});

describe('acciones de combate que cuestan monedas (combatItems.cost)', () => {
  it('se ofrecen solo si alcanza, se cobran y no piden objeto', async () => {
    const m = baseManifest({ statDefs: { vida: { label: 'Vida', min: 0, max: 100 } }, initialStats: { vida: 100, fuerza: 50, dinero: 15 } });
    const engine = makeEngine(m, {
      start: { sequence: [{
        type: 'combat', enemy: { name: 'X', hp: 100, attack: 1, defense: 0 }, playerStat: 'vida', attackStat: 'fuerza',
        actions: ['attack', 'defend', 'use_item'],
        combatItems: [{ itemId: 'lanzar_monedas', name: 'Lanzar monedas (10)', text: 'plin', damage: 7, cost: { dinero: 10 } }],
        results: { victory: { text: 'gana' }, defeat: { text: 'pierde' } },
      }] },
    });
    const out = await drive(engine, 'start', [{ type: 'combat_action', action: 'use_item:lanzar_monedas' }, { type: 'combat_action', action: 'defend' }]);
    const prompts = out.filter((r): r is Extract<StepResult, { type: 'combat_prompt' }> => r.type === 'combat_prompt');
    expect(prompts[0].usableItems).toEqual([{ itemId: 'lanzar_monedas', name: 'Lanzar monedas (10)' }]);
    expect(engine.state.stats.dinero).toBe(5);
    // Con 5 monedas ya no alcanza
    expect(prompts[1].usableItems).toBeUndefined();
  });
});

describe('lanzar objetos y tirarlos', () => {
  const m = baseManifest({
    statDefs: { vida: { label: 'Vida', min: 0, max: 100 } },
    initialStats: { vida: 100, fuerza: 50 },
    items: {
      basura: { name: 'Monedas dobladas', description: '', throw: { damage: 6, text: 'shuriken' } },
      piedra: { name: 'Piedra', description: '' },
      llave: { name: 'Llave', description: '', keep: true },
      sal: { name: 'Sal', description: '' },
      espada: { name: 'Espada', description: '' },
    },
  });
  const combat = {
    start: { sequence: [{
      type: 'combat' as const, enemy: { name: 'X', hp: 100, attack: 1, defense: 0 }, playerStat: 'vida', attackStat: 'fuerza',
      actions: ['attack', 'defend', 'use_item'],
      weapons: [{ itemId: 'espada', name: 'la espada', bonus: 4 }],
      combatItems: [{ itemId: 'sal', name: 'Sal', text: 'sal', damage: 12 }],
      results: { victory: { text: 'gana' }, defeat: { text: 'pierde' } },
    }] },
  };

  it('se puede lanzar cualquier objeto salvo los que se guardan, las armas y los objetos de combate; gasta una unidad', async () => {
    const engine = makeEngine(m, combat);
    internals(engine)._state.inventory = ['basura', 'basura', 'piedra', 'llave', 'sal', 'espada'];
    const out = await drive(engine, 'start', [{ type: 'combat_action', action: 'use_item:throw:basura' }]);
    const prompt = out.find((r): r is Extract<StepResult, { type: 'combat_prompt' }> => r.type === 'combat_prompt')!;
    expect(prompt.throwables).toEqual([{ itemId: 'throw:basura', name: 'Monedas dobladas' }, { itemId: 'throw:piedra', name: 'Piedra' }]);
    const turn = out.find((r): r is Extract<StepResult, { type: 'combat_turn' }> => r.type === 'combat_turn')!;
    expect(turn.text).toContain('shuriken');
    expect(turn.playerDamage).toBe(6);
    expect(engine.state.inventory.filter((i) => i === 'basura')).toHaveLength(1);
  });

  it('/tirar quita una unidad, pero no lo que se guarda', () => {
    const engine = makeEngine(m, combat);
    internals(engine)._state.inventory = ['piedra', 'piedra', 'llave'];
    expect(engine.discardItem('piedra')).toBe('ok');
    expect(engine.discardItem('llave')).toBe('keep');
    expect(engine.discardItem('nada')).toBe('missing');
    expect(engine.state.inventory).toEqual(['piedra', 'llave']);
  });
});
