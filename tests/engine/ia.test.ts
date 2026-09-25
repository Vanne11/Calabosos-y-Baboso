// IA en el motor: modos chat (ai_chat), narración con IA, respaldo por dados, perfil y eventos.

import { describe, it, expect } from 'vitest';
import type { AiProvider, FreeActionReply, NarrateReply } from '../../src/engine/AiProvider';
import type { GameEvent } from '../../src/engine/AiProvider';
import type { StepResult } from '../../src/types/engine';
import { baseManifest, makeEngine, drive, dialogLines, internals } from '../helpers';

const manifest = baseManifest({
  characters: { narrator: { name: 'N', description: '', role: 'narrator' }, guardia: { name: 'Guardia', description: 'aburrido' } },
  initialStats: { sexi: 50, nombre_jugador: 'Alex', nombre_real: 'Pepe' },
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
    freeAction: async (p, req) => { calls.push(['free', p, req]); return null; },
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
    expect(vars).toMatchObject({ objetivo: 'pasar Alex', npc_nombre: 'Guardia', nombre_real: 'Pepe' });
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
    initialStats: { sexi: 50, nombre_jugador: 'Alex', animo_narrador: 'resacoso' },
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
    expect(engine.state.decisiones).toEqual(['«Huyo», dice Alex (en Plaza)']);
    expect(engine.state.memoria).toEqual(['Alex rompió la estatua', 'se asustó (en Pantano)']);
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
    expect(first).toMatchObject({ memoria: '- Alex rompió la estatua', animo: 'resacoso', ya_dijiste: '' });
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

describe('acción libre en decisiones (choice.freeText)', () => {
  const freeManifest = baseManifest({
    characters: { narrator: { name: 'N', description: '', role: 'narrator' } },
    initialStats: { sexi: 50, pis: 90, dinero: 0 },
    ai: { freeText: { consequences: { ridiculo: { hint: 'hace el ridículo', effects: { stats: { sexi: -5 } } } } } },
    statRules: [{ id: 'meada', condition: { stats: { pis: '>=100' } }, goto: 'mojado' }],
  });
  const freeScenes = {
    decide: {
      scenario: { name: 'Plaza', description: 'huele a pescado' },
      sequence: [{
        type: 'choice' as const,
        freeText: { consequences: { vejiga: { hint: 'le dan ganas', effects: { stats: { pis: 20 } } } }, maxUses: 2 },
        options: [{ text: 'Aceptar', goto: 'si' }, { text: 'Huir', tags: ['cobarde'], goto: 'no' }],
      }],
    },
    si: { sequence: [] }, no: { sequence: [] }, mojado: { sequence: [] },
  };
  type Reply = FreeActionReply | null;
  function freeAi(replies: Reply[], opts: { libre?: boolean } = {}): AiProvider & { calls: Call[] } {
    const calls: Call[] = [];
    return {
      calls,
      available: (f) => (f === 'libre' ? opts.libre ?? true : true),
      narrate: async () => null,
      freeAction: async (p, req) => { calls.push(['free', p, req]); return replies.shift() ?? null; },
      chatStart: async () => null,
      chatSay: async () => null,
      chatGiveUp: async () => {},
    };
  }
  const prompts = (out: StepResult[]) => out.filter((r) => r.type === 'choice_prompt');

  it('ofrece "Hacer otra cosa…" y lleva lo escrito a una opción, con las palabras del jugador', async () => {
    const engine = makeEngine(freeManifest, freeScenes);
    const ai = freeAi([{ text: 'Sales corriendo, [cobarde].', tone: 'burla', option: 1, consequence: null }]);
    engine.setAiProvider(ai);
    const out = await drive(engine, 'decide', [{ type: 'choice_free', text: 'me voi corriendo' }]);
    expect(prompts(out)[0]).toMatchObject({ freeIndex: 2, options: [{ index: 0 }, { index: 1 }, { text: '✍️ Hacer otra cosa…', index: 2 }] });
    const req = ai.calls[0][2] as { action: string; options: string[]; consequences: Record<string, string>; vars: Record<string, string> };
    expect(req).toMatchObject({ action: 'me voi corriendo', options: ['Aceptar', 'Huir'], consequences: { ridiculo: 'hace el ridículo', vejiga: 'le dan ganas' } });
    expect(req.vars.situacion).toBe('Plaza: huele a pescado');
    expect(dialogLines(out)).toEqual(['Sales corriendo, «cobarde».']);
    expect(last(out)).toMatchObject({ type: 'navigate', scene: 'no' });
    expect(engine.state.profile?.cobarde).toBe(1);
    expect(engine.state.decisiones).toEqual(['«me voi corriendo» (= Huir) (en Plaza)']);
    expect(engine.state.habla).toEqual(['me voi corriendo']);
  });

  it('elegir la opción extra pide el texto; una consecuencia aplica efectos y vuelve a preguntar', async () => {
    const engine = makeEngine(freeManifest, freeScenes);
    engine.setAiProvider(freeAi([{ text: 'Bailas. Nadie aplaude.', option: null, consequence: 'ridiculo' }]));
    const out = await drive(engine, 'decide', [
      { type: 'choose', index: 2 },
      { type: 'submit_input', value: 'bailo' },
      { type: 'choose', index: 0 },
    ]);
    expect(types(out)).toEqual(['scenario', 'choice_prompt', 'input_prompt', 'dialog', 'effects', 'choice_prompt', 'navigate']);
    expect(engine.state.stats.sexi).toBe(45);
    expect(engine.state.decisiones?.[0]).toBe('«bailo» (hace el ridículo) (en Plaza)');
  });

  it('las reglas se disparan tras una consecuencia; tras maxUses la opción extra desaparece', async () => {
    const engine = makeEngine(freeManifest, freeScenes);
    engine.setAiProvider(freeAi([{ text: 'Glu glu.', option: null, consequence: 'vejiga' }]));
    const out = await drive(engine, 'decide', [{ type: 'choice_free', text: 'me tomo el agua del pilón' }]);
    expect(last(out)).toMatchObject({ type: 'navigate', scene: 'mojado' });

    const engine2 = makeEngine(freeManifest, freeScenes);
    engine2.setAiProvider(freeAi([{ text: 'a', option: null, consequence: null }, { text: 'b', option: null, consequence: null }]));
    const out2 = await drive(engine2, 'decide', [
      { type: 'choice_free', text: 'uno' }, { type: 'choice_free', text: 'dos' }, { type: 'choose', index: 0 },
    ]);
    const shown = prompts(out2) as { freeIndex?: number; options: unknown[] }[];
    expect(shown.map((p) => p.options.length)).toEqual([3, 3, 2]);
    expect(shown[2].freeIndex).toBeUndefined();
  });

  it('si la IA falla avisa y no vuelve a ofrecerla; sin la función activa no aparece', async () => {
    const engine = makeEngine(freeManifest, freeScenes);
    engine.setAiProvider(freeAi([null]));
    const out = await drive(engine, 'decide', [{ type: 'choice_free', text: 'algo' }, { type: 'choose', index: 0 }]);
    expect(types(out)).toContain('notify');
    expect((prompts(out)[1] as { options: unknown[] }).options).toHaveLength(2);

    const off = makeEngine(freeManifest, freeScenes);
    off.setAiProvider(freeAi([], { libre: false }));
    const out2 = await drive(off, 'decide', [{ type: 'choose', index: 0 }]);
    expect(prompts(out2)[0]).not.toHaveProperty('freeIndex');
  });
});

describe('narración: reacción a decisiones y pedido adelantado', () => {
  const m = baseManifest({
    characters: { narrator: { name: 'N', description: '', role: 'narrator' } },
    initialStats: { sexi: 50 },
    ai: { reactChance: 1 },
  });
  function narrAi(): AiProvider & { calls: Call[]; resolveAll: () => void } {
    const calls: Call[] = [];
    const pending: ((r: NarrateReply) => void)[] = [];
    return {
      calls,
      resolveAll: () => pending.splice(0).forEach((r, i) => r({ text: `línea ${i}` })),
      available: () => true,
      narrate: (p, v) => { calls.push(['narrate', p, v]); return Promise.resolve({ text: `sobre ${v.decision ?? p}` }); },
      freeAction: async () => null,
      chatStart: async () => null,
      chatSay: async () => null,
      chatGiveUp: async () => {},
    };
  }

  it('comenta decisiones con tags según ai.reactChance; aiReact: 0 lo apaga', async () => {
    const engine = makeEngine(m, {
      a: { sequence: [{ type: 'choice' as const, options: [{ text: 'Robar', tags: ['ladron'], goto: 'b' }] }] },
      b: { sequence: [{ type: 'choice' as const, options: [{ text: 'Huir', tags: ['cobarde'], aiReact: 0, goto: 'a' }, { text: 'Mirar', goto: 'a' }] }] },
    });
    const ai = narrAi();
    engine.setAiProvider(ai);
    expect(dialogLines(await drive(engine, 'a', [{ type: 'choose', index: 0 }]))).toEqual(['sobre Robar']);
    expect(dialogLines(await drive(engine, 'b', [{ type: 'choose', index: 0 }]))).toEqual([]);
    expect(dialogLines(await drive(engine, 'b', [{ type: 'choose', index: 1 }]))).toEqual([]);
    expect(ai.calls.map((c) => c[1])).toEqual(['reaccion']);
  });

  it('pide la narración antes de llegar al paso, pero no si antes hay un paso que cambia el estado', async () => {
    const engine = makeEngine(m, {
      pasiva: { sequence: [
        { type: 'dialog' as const, character: 'narrator', lines: ['hola'] },
        { type: 'dialog' as const, character: 'narrator', lines: ['x'], ai: { prompt: 'muerte' } },
      ] },
      activa: { sequence: [
        { type: 'effects' as const, effects: { memo: 'murió' } },
        { type: 'dialog' as const, character: 'narrator', lines: ['x'], ai: { prompt: 'muerte' } },
      ] },
    });
    const ai = narrAi();
    engine.setAiProvider(ai);
    const gen = engine.enterScene('pasiva');
    await gen.next();
    // Mientras se muestra la primera línea ya se pidió la narración
    expect(ai.calls).toHaveLength(1);
    const rest: StepResult[] = [];
    for (let r = await gen.next(); !r.done; r = await gen.next()) rest.push(r.value);
    expect(dialogLines(rest)).toEqual(['sobre muerte']);
    expect(ai.calls).toHaveLength(1);

    ai.calls.length = 0;
    await drive(engine, 'activa', []);
    // Se pidió después del efecto: la IA ya conoce el memo
    expect((ai.calls[0][2] as Record<string, string>).memoria).toBe('- murió');
  });
});

describe('chats con consecuencias: gestos, recuerdo y memoria por personaje', () => {
  const m = baseManifest({
    characters: { narrator: { name: 'N', description: '', role: 'narrator' }, bardo: { name: 'Bardo', description: 'rapero' } },
    initialStats: { sexi: 50, nombre_jugador: 'Alex', causa_muerte: 'un tomate' },
    linePools: { epi: ['Aquí yace Alex.'] },
  });
  const rap = {
    type: 'ai_chat' as const, mode: 'rap' as const, npc: 'bardo',
    gestures: { cerveza: { hint: 'le tira la cerveza encima a Alex', text: 'Te tiran cerveza.', effects: { stats: { sexi: -5 } } } },
    fallback: { stat: 'sexi', difficulty: 1 },
    outcomes: { success: { goto: 'fin' }, failure: { goto: 'fin' } },
  };
  const sc = {
    antes: { sequence: [{ type: 'effects' as const, effects: { npcMemo: { bardo: '{nombre_jugador} le robó el público' } } }] },
    rap: { scenario: { name: 'Taberna' }, sequence: [rap] },
    lapida: { sequence: [{ type: 'dialog' as const, character: 'narrator', lines: [], pool: 'epi', ai: { prompt: 'epitafio', vars: { causa: '{causa_muerte}' }, remember: 'su lápida decía' } }] },
    fin: { sequence: [] },
  };
  function chatAi(): AiProvider & { calls: Call[] } {
    const calls: Call[] = [];
    let turn = 0;
    return {
      calls,
      available: () => true,
      narrate: async (p, v) => { calls.push(['narrate', p, v]); return { text: 'Aquí yace Alex, que rimó «pan» con «pan».', lineId: 7 }; },
      freeAction: async () => null,
      chatStart: async (mode, npc, vars, max, gestures) => { calls.push(['start', vars, gestures]); return { chatId: 'c', maxTurns: 2, score: 50, maxInputChars: 100 }; },
      chatSay: async () => {
        turn++;
        return turn === 1
          ? { reply: 'Toma', score: 40, done: false, verdict: null, turnsLeft: 1, gesture: 'cerveza', lineId: 11 }
          : { reply: 'Fin', score: 30, done: true, verdict: 'failure', turnsLeft: 0, gesture: 'inventado', memory: 'Alex rimó «pan» con «pan» y lo abuchearon', lineId: 12 };
      },
      chatGiveUp: async () => {},
    };
  }

  it('manda gestos e historial con el NPC; aplica el gesto y guarda el recuerdo', async () => {
    const engine = makeEngine(m, sc);
    const ai = chatAi();
    engine.setAiProvider(ai);
    await drive(engine, 'antes', []);
    const out = await drive(engine, 'rap', [{ type: 'chat_message', text: 'pan pan' }, { type: 'chat_message', text: 'pan' }]);
    const [, vars, gestures] = ai.calls[0] as [string, Record<string, string>, Record<string, string>];
    expect(vars.historial_npc).toBe('- Alex le robó el público');
    expect(gestures).toEqual({ cerveza: 'le tira la cerveza encima a Alex' });
    expect(out.find((r) => r.type === 'notify')).toMatchObject({ title: 'Bardo', text: 'Te tiran cerveza.' });
    expect(engine.state.stats.sexi).toBe(45);
    // El gesto inventado por la IA se ignora; el recuerdo va a la memoria general y a la del Bardo
    expect(out.filter((r) => r.type === 'notify')).toHaveLength(1);
    expect(engine.state.memoria).toEqual(['se batió a rap contra Bardo y perdió: Alex rimó «pan» con «pan» y lo abuchearon (en Taberna)']);
    expect(engine.state.npcMemoria?.bardo).toEqual([
      'Alex le robó el público',
      'le tira la cerveza encima a Alex',
      'Alex rimó «pan» con «pan» y lo abuchearon (se batió a rap contra Bardo y perdió)',
    ]);
    expect(out.filter((r) => r.type === 'chat_reply').map((r) => (r as { aiLineId?: number }).aiLineId)).toEqual([11, 12]);
  });

  it('la lápida recibe la última decisión y frase, y se recuerda', async () => {
    const engine = makeEngine(m, sc);
    const ai = chatAi();
    engine.setAiProvider(ai);
    await drive(engine, 'rap', [{ type: 'chat_message', text: 'pan pan' }, { type: 'chat_message', text: 'ke onda' }]);
    const out = await drive(engine, 'lapida', []);
    const vars = ai.calls.find((c) => c[0] === 'narrate')![2] as Record<string, string>;
    expect(vars).toMatchObject({ causa: 'un tomate', ultima_frase: 'ke onda' });
    expect(out[0]).toMatchObject({ type: 'dialog', aiLineId: 7 });
    expect(engine.state.memoria?.at(-1)).toBe('su lápida decía «Aquí yace Alex, que rimó «pan» con «pan».»');
  });
});

describe('charla libre: contesta quien esté', () => {
  const m = baseManifest({
    characters: {
      narrator: { name: 'Narrador', description: '', role: 'narrator' },
      nerly: { name: 'Nerly', description: 'babosa azul', role: 'companion', joinFlag: 'nerly_joined', ai: { muletillas: ['¡Ay, Alex!'] } },
      bardo: { name: 'Bardo Babosa', description: 'rapero', role: 'npc' },
      lapida: { name: 'Lápida', description: '', role: 'npc', talkable: false },
    },
    initialStats: { sexi: 50 },
    ai: { talk: { perScene: 2, maxUses: 3 } },
  });
  const sc = {
    solo: { scenario: { name: 'Plaza', description: 'huele a pescado' }, sequence: [{ type: 'effects' as const, effects: { checkpoint: true } }] },
    taberna: { scenario: { name: 'Taberna' }, sequence: [{ type: 'dialog' as const, character: 'bardo', lines: ['¡Yo rapeo!'] }] },
    barra: { scenario: { name: 'Taberna' }, sequence: [] },
    lapida: { scenario: { name: 'Cementerio' }, sequence: [{ type: 'dialog' as const, character: 'lapida', lines: ['Aquí yace'] }] },
    unirse: { sequence: [{ type: 'effects' as const, effects: { flags: { nerly_joined: true } } }] },
  };
  function talkAi(reply: NarrateReply | null = { text: 'Déjame [trabajar].', tone: 'enojo', lineId: 3 }): AiProvider & { calls: Call[] } {
    const calls: Call[] = [];
    return {
      calls,
      available: () => true,
      narrate: async (p, v, msg) => { calls.push(['narrate', p, v, msg]); return reply; },
      freeAction: async () => null,
      chatStart: async () => null,
      chatSay: async () => null,
      chatGiveUp: async () => {},
    };
  }
  const who = (r: Awaited<ReturnType<ReturnType<typeof makeEngine>['talk']>>) => (r.ok ? r.speaker.id : r.reason);

  it('sin nadie en escena contesta el narrador, con la situación y el mensaje aparte', async () => {
    const engine = makeEngine(m, sc);
    const ai = talkAi();
    engine.setAiProvider(ai);
    await drive(engine, 'solo', []);
    expect(await engine.talk('  ola narrador ke onda  ')).toMatchObject({ ok: true, speaker: { id: 'narrator' }, text: 'Déjame «trabajar».', tone: 'enojo', lineId: 3 });
    expect(ai.calls[0]).toMatchObject(['narrate', 'charla', { situacion: 'Plaza: huele a pescado' }, 'ola narrador ke onda']);
    expect(engine.state.habla).toEqual(['ola narrador ke onda']);
    expect(engine.state.npcMemoria?.narrator).toEqual(['Alex le dijo «ola narrador ke onda»']);
  });

  it('contesta el último personaje de la escena; se puede nombrar a otro; la lápida no cuenta', async () => {
    const engine = makeEngine(m, sc);
    const ai = talkAi();
    engine.setAiProvider(ai);
    await drive(engine, 'unirse', []);
    await drive(engine, 'taberna', []);
    expect(who(await engine.talk('tu rap es malo'))).toBe('bardo');
    const [, prompt, vars, msg] = ai.calls[0] as [string, string, Record<string, string>, string];
    expect(prompt).toBe('charla_npc');
    expect(vars).toMatchObject({ npc_nombre: 'Bardo Babosa', npc_descripcion: 'rapero' });
    expect(msg).toBe('tu rap es malo');
    expect(engine.talkSpeaker('Nérly, ¿tienes miedo?').id).toBe('nerly');
    expect(who(await engine.talk('Nérly, ¿tienes miedo?'))).toBe('nerly');
    expect(ai.calls[1][3]).toBe('¿tienes miedo?');
    expect((ai.calls[1][2] as Record<string, string>).npc_ficha).toContain('¡Ay, Alex!');

    // Otra escena en el mismo lugar: el Bardo sigue ahí
    await drive(engine, 'barra', []);
    expect(engine.talkSpeaker('hola').id).toBe('bardo');
    await drive(engine, 'lapida', []);
    // Otro lugar: sin personaje de enfrente contesta el acompañante; la lápida no charla
    expect(engine.talkSpeaker('hola').id).toBe('nerly');
    expect(engine.talkSpeaker('narrador: hola', 'narrator').id).toBe('narrator');
  });

  it('límite por escena y por partida; no se recupera con el checkpoint', async () => {
    const engine = makeEngine(m, sc);
    engine.setAiProvider(talkAi());
    await drive(engine, 'solo', []);
    expect((await engine.talk('uno')).ok).toBe(true);
    expect((await engine.talk('dos')).ok).toBe(true);
    expect(engine.canTalk).toBe(false);
    expect(who(await engine.talk('tres'))).toBe('scene_limit');
    await drive(engine, 'taberna', []);
    expect((await engine.talk('tres')).ok).toBe(true);
    expect(who(await engine.talk('cuatro'))).toBe('limit');
    engine.restoreCheckpoint();
    expect(engine.state.charla?.usos).toBe(3);
  });

  it('sin IA, desactivada o si falla no gasta charlas', async () => {
    const engine = makeEngine(m, sc);
    expect(who(await engine.talk('hola'))).toBe('no_ai');
    engine.setAiProvider(talkAi(null));
    await drive(engine, 'solo', []);
    expect(who(await engine.talk('hola'))).toBe('failed');
    expect(engine.state.charla).toBeUndefined();

    const off = makeEngine(baseManifest({ ...m, ai: { talk: false } }), sc);
    off.setAiProvider(talkAi());
    expect(who(await off.talk('hola'))).toBe('no_ai');
  });
});

describe('los personajes recuerdan lo que hiciste con ellos (no solo lo que hablaron)', () => {
  const m = baseManifest({
    characters: {
      narrator: { name: 'Narrador', description: '', role: 'narrator' },
      tendero: { name: 'Tendero', description: 'borracho', role: 'npc' },
      prestamista: { name: 'Prestamista', description: 'usurero', role: 'npc' },
    },
    initialStats: { dinero: 100, nombre_jugador: 'Alex' },
    items: { espada: { name: 'Espada oxidada', description: '' }, sal: { name: 'Saco de sal', description: '' } },
  });
  const sc = {
    tienda: {
      scenario: { name: 'Tienda' },
      sequence: [
        { type: 'dialog' as const, character: 'tendero', lines: ['¿Qué te vendo? *hic*'] },
        { type: 'shop' as const, title: 'Tienda del Tendero', currency: 'dinero', items: [{ id: 'espada', name: 'Espada oxidada', price: 40 }, { id: 'sal', name: 'Saco de sal', price: 10 }] },
      ],
    },
    empenos: {
      scenario: { name: 'Casa de Empeños' },
      sequence: [
        { type: 'dialog' as const, character: 'prestamista', lines: ['Te presto 50.'] },
        { type: 'choice' as const, options: [{ text: 'Aceptar el préstamo', tags: ['endeudado'], goto: 'tienda' }] },
      ],
    },
  };

  it('la tienda anota las compras en la memoria del dueño y en la general', async () => {
    const engine = makeEngine(m, sc);
    await drive(engine, 'tienda', [
      { type: 'shop_buy', itemIndex: 0 }, { type: 'shop_buy', itemIndex: 1 }, { type: 'shop_buy', itemIndex: 1 }, { type: 'shop_exit' },
    ]);
    expect(engine.state.npcMemoria?.tendero).toEqual(['Alex compró Espada oxidada, Saco de sal ×2 (60 dinero en total)']);
    expect(engine.state.memoria?.at(-1)).toBe('en Tienda del Tendero: Alex compró Espada oxidada, Saco de sal ×2 (60 dinero en total) (en Tienda)');
    // Y cualquiera sabe lo que lleva
    expect(internals(engine).aiVars().lleva).toBe('Espada oxidada, Saco de sal ×2. Monedas: 40');
  });

  it('quien está delante recuerda la decisión; salir de la tienda sin hacer nada no anota', async () => {
    const engine = makeEngine(m, sc);
    await drive(engine, 'empenos', [{ type: 'choose', index: 0 }]);
    expect(engine.state.npcMemoria?.prestamista).toEqual(['Alex eligió: «Aceptar el préstamo»']);
    await drive(engine, 'tienda', [{ type: 'shop_exit' }]);
    expect(engine.state.npcMemoria?.tendero).toBeUndefined();
  });
});

describe('ficha de personaje', () => {
  it('la regla obligatoria va primero y marcada como obligatoria', async () => {
    const { characterSheet } = await import('../../src/engine/AiContext');
    const sheet = characterSheet({ name: 'Bardo', description: '', ai: { regla: 'Hablas siempre en rima.', voz: 'arrogante' } });
    expect(sheet.split('\n')[0]).toBe('REGLA OBLIGATORIA (en todas tus intervenciones, sin excepción): Hablas siempre en rima.');
    expect(sheet).toContain('Voz: arrogante');
  });
});
