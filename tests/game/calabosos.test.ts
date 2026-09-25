// Datos reales de Calabosos: reglas del juego, finales y validación completa.

import { describe, it, expect, vi, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { StepResult } from '../../src/types/engine';
import { makeEngine, internals, loadGameFromDisk, dialogLines } from '../helpers';

const { manifest, scenes } = loadGameFromDisk('calabosos');

afterEach(() => vi.restoreAllMocks());

describe('validación', () => {
  it('npm run validate pasa sin errores', () => {
    const root = join(__dirname, '..', '..');
    expect(() => execFileSync('node', ['scripts/validate-game.mjs', 'calabosos'], { cwd: root, stdio: 'pipe' })).not.toThrow();
  });

  it('toda la música referenciada existe (escenas, combates, game.json → audio)', () => {
    const base = join(__dirname, '..', '..', 'public', 'games', 'calabosos');
    const refs = new Set<string>([manifest.audio?.combatMusic, manifest.audio?.gameOverMusic].filter((m): m is string => !!m));
    for (const scene of Object.values(scenes)) {
      if (scene.scenario?.music) refs.add(scene.scenario.music);
      for (const step of scene.sequence) if (step.type === 'combat' && step.music && step.music !== 'none') refs.add(step.music);
    }
    const missing = [...refs].filter((m) => !existsSync(join(base, m)));
    expect(missing).toEqual([]);
    expect(refs.size).toBeGreaterThan(20);
  });
});

describe('reglas del juego', () => {
  const engine = () => internals(makeEngine(manifest, scenes));

  it('bolsillos rotos: sin el bolso de escroto no pasas de 60 monedas', () => {
    const e = engine();
    e._state.stats.dinero = 100;
    [...e.runStatRules()];
    expect(e._state.stats.dinero).toBe(60);
    e._state.inventory = ['escroto_elefante'];
    e._state.stats.dinero = 100;
    [...e.runStatRules()];
    expect(e._state.stats.dinero).toBe(100);
  });

  it('el pañal salva la dignidad y se gasta', () => {
    const e = engine();
    Object.assign(e._state.stats, { pis: 100, sexi: 50 });
    e._state.inventory = ['panal'];
    [...e.runStatRules()];
    expect(e._state.stats).toMatchObject({ pis: 0, sexi: 50 });
    expect(e._state.inventory).not.toContain('panal');
  });

  it('accidente de pis: -15 sexi y cuenta en meta', () => {
    const e = engine();
    Object.assign(e._state.stats, { pis: 100, sexi: 50 });
    const out = [...e.runStatRules()];
    expect(out.some((r: StepResult) => r.type === 'dialog')).toBe(true);
    expect(e._state.stats).toMatchObject({ pis: 0, sexi: 35 });
    expect(e._state.meta).toMatchObject({ meadas: 1 });
  });

  it('pánico: el miedo al máximo sube el pis', () => {
    const e = engine();
    Object.assign(e._state.stats, { miedo: 100, pis: 0 });
    [...e.runStatRules()];
    expect(e._state.stats).toMatchObject({ miedo: 60, pis: 30 });
  });

  it('la humedad sospechosa se comenta una sola vez', () => {
    const e = engine();
    e._state.stats.pis = 75;
    expect([...e.runStatRules()]).toHaveLength(1);
    expect([...e.runStatRules()]).toHaveLength(0);
  });
});

describe('finales', () => {
  async function run(scene: string, setup: (st: ReturnType<typeof internals>['_state']) => void) {
    const engine = makeEngine(manifest, scenes);
    engine.loadMeta({ muertes: 4, partidas: 5 });
    setup(internals(engine)._state);
    const out: StepResult[] = [];
    const it = engine.enterScene(scene);
    for (let r = await it.next(); !r.done; r = await it.next()) {
      out.push(r.value);
      if (r.value.type === 'choice_prompt') break;
      if (r.value.type === 'dice_prompt') engine.sendAction({ type: 'roll_dice' });
    }
    return out;
  }
  const options = (out: StepResult[]) => {
    const c = out.find((r) => r.type === 'choice_prompt');
    return c && c.type === 'choice_prompt' ? c.options.map((o) => o.text) : [];
  };

  it('Nerly canta la canción compuesta en la fogata', async () => {
    // El recap elige al azar entre las frases que aplican; con azar 0 sale la primera (la del cobarde)
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const song = 'BOB: verso uno\nNerly: «verso dos»';
    const out = await run('final_heroico', (st) => { st.stats.cancion_nerly = song; st.profile = { cobarde: 4 }; });
    expect(dialogLines(out)).toContain(song);
    expect(dialogLines(out).some((l) => l.includes('sendero de baba brillante'))).toBe(false);
    expect(dialogLines(out).some((l) => l.includes('cobarde con estilo'))).toBe(true);
    expect(options(out).some((t) => t.includes('presencia'))).toBe(false);
  });

  it('sin letra guardada, Nerly canta la canción genérica', async () => {
    const out = await run('final_heroico', (st) => { st.stats.cancion_nerly = ''; });
    expect(dialogLines(out).some((l) => l.includes('sendero de baba brillante'))).toBe(true);
  });

  it('el final secreto aparece con Nerly leal, la Lágrima y el pasaje secreto', async () => {
    const out = await run('final_retiro', (st) => {
      st.relationships = { nerly: { affinity: 85 } };
      Object.assign(st.flags, { toco_lagrima: true, uso_pasaje_secreto: true });
    });
    expect(options(out).some((t) => t.includes('presencia'))).toBe(true);
    expect(out.some((r) => r.type === 'notify' && /Muertes totales: 4/.test(r.text))).toBe(true);
  });

  it('el final secreto se completa sin IA (confesión por dados)', async () => {
    const out = await run('final_secreto', () => {});
    expect(out.some((r) => r.type === 'dice_prompt')).toBe(true);
    expect(out.some((r) => r.type === 'notify' && /Verdadero Narrador/.test(r.title))).toBe(true);
  });
});
