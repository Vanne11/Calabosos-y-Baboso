// tests/audio/feedback.test.ts
// Detección de cambios de estado (vida, monedas, objetos) y qué respuesta audiovisual les toca.

import { describe, it, expect } from 'vitest';
import { snapshot, diffState, cueFor, type StateSnapshot } from '../../src/audio/feedback';
import type { AudioConfig } from '../../src/types/game';
import type { PlayerState } from '../../src/types/engine';

const snap = (stats: Record<string, number>, inventory: string[] = [], visited = 5): StateSnapshot => ({ stats, inventory, visited });

const CONFIG: AudioConfig = {
  statSfx: {
    vida: { down: 'dano', bigDown: { amount: 20, sfx: 'dano_fuerte' }, up: 'curar', shake: true, flashUp: 'heal' },
    oro: { up: 'moneda', bigUp: { amount: 15, sfx: 'monedas' }, down: 'pagar' },
    miedo: { up: 'miedo' },
  },
  removeItemSfx: 'soltar',
};

describe('diffState', () => {
  it('sin base previa no suena nada', () => {
    expect(diffState(null, snap({ vida: 50 }))).toBeNull();
  });

  it('detecta subidas y bajadas de stats', () => {
    const ev = diffState(snap({ vida: 100, oro: 0 }), snap({ vida: 80, oro: 5 }));
    expect(ev).toEqual([
      { kind: 'stat', stat: 'vida', delta: -20, from: 100, to: 80 },
      { kind: 'stat', stat: 'oro', delta: 5, from: 0, to: 5 },
    ]);
  });

  it('cuenta objetos repetidos', () => {
    const ev = diffState(snap({}, ['sal']), snap({}, ['sal', 'sal', 'espada']));
    expect(ev).toEqual([
      { kind: 'item', id: 'sal', added: true },
      { kind: 'item', id: 'espada', added: true },
    ]);
    expect(diffState(snap({}, ['sal', 'sal']), snap({}, ['sal']))).toEqual([{ kind: 'item', id: 'sal', added: false }]);
  });

  it('reinicio, punto de control o partida cargada: nueva base en silencio', () => {
    expect(diffState(snap({ vida: 10 }, [], 20), snap({ vida: 100 }, [], 3))).toBeNull();
    expect(diffState(snap({ vida: 10 }, [], 5), snap({ vida: 100 }, [], 40))).toBeNull();
  });

  it('snapshot ignora stats de texto y copia el inventario', () => {
    const state = { stats: { vida: 3, nombre: 'BOB' }, inventory: ['x'], visitedScenes: ['a', 'b'] } as unknown as PlayerState;
    const s = snapshot(state);
    state.inventory.push('y');
    expect(s).toEqual({ stats: { vida: 3 }, inventory: ['x'], visited: 2 });
  });
});

describe('cueFor', () => {
  const stat = (name: string, delta: number) => ({ kind: 'stat' as const, stat: name, delta, from: 50, to: 50 + delta });

  it('daño: sonido, sacudida proporcional y destello rojo', () => {
    expect(cueFor(stat('vida', -5), CONFIG)).toEqual({ sfx: 'dano', shake: 1, flash: 'damage' });
    expect(cueFor(stat('vida', -30), CONFIG)).toEqual({ sfx: 'dano_fuerte', shake: 3, flash: 'damage' });
  });

  it('curación y monedas', () => {
    expect(cueFor(stat('vida', 10), CONFIG)).toEqual({ sfx: 'curar', flash: 'heal' });
    expect(cueFor(stat('oro', 3), CONFIG)?.sfx).toBe('moneda');
    expect(cueFor(stat('oro', 40), CONFIG)?.sfx).toBe('monedas');
    expect(cueFor(stat('oro', -3), CONFIG)).toEqual({ sfx: 'pagar', shake: 0, flash: undefined });
  });

  it('stats sin regla o sin sonido en esa dirección no hacen nada', () => {
    expect(cueFor(stat('sexi', 5), CONFIG)).toBeNull();
    expect(cueFor(stat('miedo', -10), CONFIG)).toBeNull();
  });

  it('objetos: jingle por defecto al ganar, sonido configurable al perder', () => {
    expect(cueFor({ kind: 'item', id: 'a', added: true }, CONFIG)).toEqual({ sfx: 'objeto' });
    expect(cueFor({ kind: 'item', id: 'a', added: false }, CONFIG)).toEqual({ sfx: 'soltar' });
    expect(cueFor({ kind: 'item', id: 'a', added: false }, undefined)).toBeNull();
  });
});
