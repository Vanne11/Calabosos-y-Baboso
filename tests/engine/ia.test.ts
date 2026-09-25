// IA en el motor: modos chat (ai_chat), narración con IA, respaldo por dados, perfil y eventos.

import { describe, it, expect } from 'vitest';
import type { AiProvider } from '../../src/engine/AiProvider';
import type { GameEvent } from '../../src/engine/AiProvider';
import type { StepResult } from '../../src/types/engine';
import { baseManifest, makeEngine, drive, dialogLines } from '../helpers';

const manifest = baseManifest({
  characters: { narrator: { name: 'N', description: '', role: 'narrator' }, guardia: { name: 'Guardia', description: 'aburrido' } },
  initialStats: { sexi: 50, nombre_jugador: 'BOB', nombre_real: 'Pepe' },
  linePools: { burla: ['del pool'] },
});
const chatStep = {
  type: 'ai_chat' as const, mode: 'persuadir' as const, npc: 'guardia', intro: ['Alto.'], vars: { objetivo: 'pasar {nombre_jugador}' },
  fallback: { stat: 'sexi', difficulty: 1 },
  outcomes: { success: { text: 'pasas', goto: 'dentro' }, failure: { text: 'no pasas', goto: 'fuera' } },
};
const scenes = {
  start: { sequence: [{ type: 'choice' as const, options: [{ text: 'huir', tags: ['cobarde'], goto: 'chat' }] }] },
  chat: { sequence: [chatStep] },
  narr: { sequence: [{ type: 'dialog' as const, character: 'narrator', lines: [], pool: 'burla', ai: { prompt: 'muerte', vars: { causa: 'x' } } }] },
  cond: { sequence: [{ type: 'dialog' as const, character: 'narrator', lines: ['cobarde!'], condition: { profile: { cobarde: '>=1' } } }] },
  dentro: { sequence: [] }, fuera: { sequence: [] },
};

type Call = [string, ...unknown[]];
function fakeAi(opts: { available?: boolean; failSayAt?: number; scores?: number[] } = {}): AiProvider & { calls: Call[] } {
  const calls: Call[] = [];
  let turn = 0;
  return {
    calls,
    available: () => opts.available ?? true,
    narrate: async (p, v) => { calls.push(['narrate', p, v]); return { text: 'burla [red]generada{x}', tone: 'burla' }; },
    chatStart: async (mode, npc, vars, max) => { calls.push(['start', mode, npc, vars, max]); return { chatId: 'c1', maxTurns: 3, score: 0, maxInputChars: 100 }; },
    chatSay: async (_id, msg) => {
      turn++;
      calls.push(['say', msg]);
      if (opts.failSayAt === turn) return null;
      const score = (opts.scores ?? [30, 80])[turn - 1] ?? 0;
      return { reply: `r${turn}`, score, done: score >= 70, verdict: score >= 70 ? 'success' : null, turnsLeft: 3 - turn, tone: turn === 1 ? 'incomodo' : null };
    },
    chatGiveUp: async (id) => { calls.push(['giveup', id]); },
  };
}
const types = (out: StepResult[]) => out.map((r) => r.type);
const last = (out: StepResult[]) => out[out.length - 1];

describe('ai_chat con IA', () => {
  it('conversa, mide el puntaje y aplica el resultado del veredicto', async () => {
    const engine = makeEngine(manifest, scenes);
    const ai = fakeAi();
    const events: GameEvent[] = [];
    engine.setAiProvider(ai);
    engine.setEventSink((ev) => events.push(ev));

    await drive(engine, 'start', [{ type: 'choose', index: 0 }]);
    expect(engine.state.profile?.cobarde).toBe(1);

    const out = await drive(engine, 'chat', [{ type: 'chat_message', text: 'hola' }, { type: 'chat_message', text: 'por favor' }]);
    expect(types(out)).toEqual(['chat_start', 'dialog', 'chat_prompt', 'chat_reply', 'chat_prompt', 'chat_reply', 'chat_end', 'navigate']);
    const vars = ai.calls[0][3] as Record<string, string>;
    expect(vars).toMatchObject({ objetivo: 'pasar BOB', npc_nombre: 'Guardia', nombre_real: 'Pepe' });
    expect(vars.perfil).toContain('cobarde');
    const replies = out.filter((r) => r.type === 'chat_reply');
    expect(replies[1]).toMatchObject({ delta: 50 });
    // El tono marcado por la IA llega a la UI (se convierte en sonido)
    expect(replies[0]).toMatchObject({ tone: 'incomodo' });
    expect(replies[1]).not.toHaveProperty('tone', expect.anything());
    expect(out.find((r) => r.type === 'chat_end')).toMatchObject({ verdict: 'success', text: 'pasas' });
    expect(last(out)).toMatchObject({ type: 'navigate', scene: 'dentro' });
    expect(engine.state.profile?.chat_persuadir).toBe(1);
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(['choice', 'chat', 'scene']));
  });

  it('condición de perfil', async () => {
    const engine = makeEngine(manifest, scenes);
    await drive(engine, 'start', [{ type: 'choose', index: 0 }]);
    expect(dialogLines(await drive(engine, 'cond', []))).toEqual(['cobarde!']);
  });

  it('rendirse → failure, avisa al servidor y suma se_rinde', async () => {
    const engine = makeEngine(manifest, scenes);
    const ai = fakeAi();
    engine.setAiProvider(ai);
    const out = await drive(engine, 'chat', [{ type: 'chat_giveup' }]);
    expect(out.find((r) => r.type === 'chat_end')).toMatchObject({ gaveUp: true, verdict: 'failure' });
    expect(last(out)).toMatchObject({ scene: 'fuera' });
    expect(ai.calls.some((c) => c[0] === 'giveup')).toBe(true);
    expect(engine.state.profile?.se_rinde).toBe(1);
  });
});

describe('ai_chat sin IA: respaldo por dados', () => {
  it('sin proveedor muestra la intro y tira el dado', async () => {
    const engine = makeEngine(manifest, scenes);
    const out = await drive(engine, 'chat', [{ type: 'roll_dice' }]);
    expect(types(out)).toEqual(['dialog', 'dice_prompt', 'dice_result', 'navigate']);
    expect(dialogLines(out)).toEqual(['Alto.']);
  });

  it('con el modo apagado no llama a la IA', async () => {
    const engine = makeEngine(manifest, scenes);
    const ai = fakeAi({ available: false });
    engine.setAiProvider(ai);
    const out = await drive(engine, 'chat', [{ type: 'roll_dice' }]);
    expect(ai.calls).toHaveLength(0);
    expect(types(out)).toContain('dice_result');
  });

  it('si la IA falla a mitad, avisa y decide con dados sin repetir la intro', async () => {
    const engine = makeEngine(manifest, scenes);
    engine.setAiProvider(fakeAi({ failSayAt: 1 }));
    const out = await drive(engine, 'chat', [{ type: 'chat_message', text: 'hola' }, { type: 'roll_dice' }]);
    expect(types(out)).toEqual(['chat_start', 'dialog', 'chat_prompt', 'notify', 'dice_prompt', 'dice_result', 'navigate']);
    expect(dialogLines(out).filter((l) => l === 'Alto.')).toHaveLength(1);
  });
});

describe('narración con IA (dialog.ai)', () => {
  it('reemplaza al pool, sanea el texto y manda el contexto', async () => {
    const engine = makeEngine(manifest, scenes);
    const ai = fakeAi();
    engine.setAiProvider(ai);
    const out = await drive(engine, 'narr', []);
    expect(dialogLines(out)).toEqual(['burla «red»generadax']);
    expect(out[0]).toMatchObject({ type: 'dialog', tone: 'burla' });
    expect(ai.calls[0][2]).toMatchObject({ nombre_real: 'Pepe', causa: 'x' });
  });
  it('sin IA usa el pool', async () => {
    const engine = makeEngine(manifest, scenes);
    expect(dialogLines(await drive(engine, 'narr', []))).toEqual(['del pool']);
  });
});

describe('memoria de la partida para la IA', () => {
  const memManifest = baseManifest({
    characters: {
      narrator: { name: 'N', description: '', role: 'narrator', ai: { voz: 'seco', ejemplos: ['Qué original.'] } },
      guardia: { name: 'Guardia', description: 'aburrido', ai: { muletillas: ['*bostezo*'], secreto: 'canta' } },
    },
    initialStats: { sexi: 50, nombre_jugador: 'BOB', animo_narrador: 'resacoso' },
    linePools: { burla: ['del pool'] },
    statRules: [{ id: 'susto', once: true, condition: { stats: { sexi: '<=10' } }, effects: { memo: 'se asustó' } }],
  });
  const memScenes = {
    ...scenes,
    start: {
      scenario: { name: 'Plaza' },
      sequence: [{ type: 'choice' as const, options: [{ text: '«Huyo», dice {nombre_jugador}', tags: ['cobarde'], goto: 'hecho' }] }],
    },
    hecho: { sequence: [{ type: 'effects' as const, effects: { memo: '{nombre_jugador} rompió la estatua', checkpoint: true } }] },
    feo: { scenario: { name: 'Pantano' }, sequence: [{ type: 'effects' as const, effects: { setStats: { sexi: 0 } } }] },
  };

  it('guarda decisiones con tags, memos con variables y hechos de reglas con la escena', async () => {
    const engine = makeEngine(memManifest, memScenes);
    await drive(engine, 'start', [{ type: 'choose', index: 0 }]);
    await drive(engine, 'hecho', []);
    await drive(engine, 'feo', []);
    expect(engine.state.decisiones).toEqual(['«Huyo», dice BOB (en Plaza)']);
    expect(engine.state.memoria).toEqual(['BOB rompió la estatua', 'se asustó (en Pantano)']);
  });

  it('el chat guarda la mejor frase tal cual, cómo escribe y el resultado; manda la ficha del NPC', async () => {
    const engine = makeEngine(memManifest, memScenes);
    const ai = fakeAi();
    engine.setAiProvider(ai);
    await drive(engine, 'chat', [{ type: 'chat_message', text: 'ola wardia' }, { type: 'chat_message', text: 'porfa dejame pasar weon' }]);
    expect(engine.state.citas).toEqual(['«porfa dejame pasar weon» (a Guardia, intentando convencerlo)']);
    expect(engine.state.habla).toEqual(['ola wardia', 'porfa dejame pasar weon']);
    expect(engine.state.memoria).toEqual(['intentó convencer a Guardia y ganó']);
    const vars = ai.calls[0][3] as Record<string, string>;
    expect(vars.npc_ficha).toContain('*bostezo*');
    expect(vars.npc_ficha).toContain('Secreto');
    expect(vars).not.toHaveProperty('ficha_narrador');
  });

  it('la narración recibe memoria, ánimo y ficha del narrador, y recuerda lo que dijo', async () => {
    const engine = makeEngine(memManifest, memScenes);
    const ai = fakeAi();
    engine.setAiProvider(ai);
    await drive(engine, 'hecho', []);
    await drive(engine, 'narr', []);
    await drive(engine, 'narr', []);
    const first = ai.calls[0][2] as Record<string, string>;
    expect(first).toMatchObject({ memoria: '- BOB rompió la estatua', animo: 'resacoso', ya_dijiste: '' });
    expect(first.ficha_narrador).toContain('«Qué original.»');
    expect((ai.calls[1][2] as Record<string, string>).ya_dijiste).toBe('- burla «red»generadax');
  });

  it('volver al checkpoint no borra la memoria (el narrador no olvida)', async () => {
    const engine = makeEngine(memManifest, memScenes);
    await drive(engine, 'hecho', []);
    await drive(engine, 'feo', []);
    expect(engine.restoreCheckpoint()).toBe('hecho');
    expect(engine.state.stats.sexi).toBe(50);
    expect(engine.state.memoria).toContain('se asustó (en Pantano)');
  });
});
