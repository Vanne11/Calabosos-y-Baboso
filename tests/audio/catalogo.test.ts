// tests/audio/catalogo.test.ts
// El catálogo de efectos sintetizados: cada receta se ejecuta contra un AudioContext falso
// que valida los parámetros como lo haría el navegador (rampas exponenciales > 0, tiempos finitos...).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { SFX, voiceBlips } from '../../src/audio/sfxCatalog';
import { AMBIENCES } from '../../src/audio/ambience';
import { noteFreq, type Voice } from '../../src/audio/synth';

const names = JSON.parse(readFileSync('src/audio/sfx-names.json', 'utf8'));

/** AudioParam que falla como WebAudio ante valores inválidos */
class FakeParam {
  value = 0;
  events: [string, number, number][] = [];
  private check(v: number, t: number, name: string) {
    if (!Number.isFinite(v) || !Number.isFinite(t) || t < 0) throw new RangeError(`${name}(${v}, ${t}) inválido`);
  }
  setValueAtTime(v: number, t: number) { this.check(v, t, 'setValueAtTime'); this.events.push(['set', v, t]); return this; }
  linearRampToValueAtTime(v: number, t: number) { this.check(v, t, 'linearRamp'); this.events.push(['lin', v, t]); return this; }
  exponentialRampToValueAtTime(v: number, t: number) {
    this.check(v, t, 'exponentialRamp');
    if (v <= 0) throw new RangeError(`exponentialRamp a ${v} (debe ser > 0)`);
    this.events.push(['exp', v, t]);
    return this;
  }
  setTargetAtTime(v: number, t: number) { this.check(v, t, 'setTargetAtTime'); return this; }
  cancelScheduledValues() { return this; }
}

class FakeNode {
  connected: FakeNode[] = [];
  connect<T extends FakeNode>(n: T): T { this.connected.push(n); return n; }
  disconnect() {}
}
class FakeSource extends FakeNode {
  frequency = new FakeParam();
  detune = new FakeParam();
  type = 'sine';
  buffer: unknown = null;
  loop = false;
  started = -1;
  stopped = -1;
  setPeriodicWave() {}
  start(t = 0) { if (!Number.isFinite(t) || t < 0) throw new RangeError('start inválido'); this.started = t; }
  stop(t = 0) {
    if (!Number.isFinite(t) || t < 0) throw new RangeError('stop inválido');
    if (this.started >= 0 && t < this.started) throw new RangeError('stop antes de start');
    this.stopped = t;
  }
}

function fakeContext() {
  const sources: FakeSource[] = [];
  const ctx = {
    currentTime: 1,
    sampleRate: 8000,
    state: 'running',
    createOscillator: () => { const s = new FakeSource(); sources.push(s); return s; },
    createBufferSource: () => { const s = new FakeSource(); sources.push(s); return s; },
    createGain: () => Object.assign(new FakeNode(), { gain: new FakeParam() }),
    createBiquadFilter: () => Object.assign(new FakeNode(), { type: 'lowpass', frequency: new FakeParam(), Q: new FakeParam() }),
    createPeriodicWave: () => ({}),
    createBuffer: (_c: number, len: number) => ({ getChannelData: () => new Float32Array(len) }),
  };
  return { ctx, sources };
}

function voice() {
  const { ctx, sources } = fakeContext();
  const out = ctx.createGain();
  const v = { ctx, out, t: 1 } as unknown as Voice;
  return { v, sources };
}

describe('catálogo de efectos', () => {
  it('sfx-names.json coincide con el catálogo (si falla: npm run sfx-names)', () => {
    expect(names.sfx).toEqual(Object.keys(SFX).sort());
    expect(names.ambience).toEqual(Object.keys(AMBIENCES).sort());
  });

  it.each(Object.keys(SFX))('"%s" se sintetiza con parámetros válidos', (name) => {
    const { v, sources } = voice();
    const end = SFX[name].play(v);
    expect(SFX[name].desc.length).toBeGreaterThan(3);
    expect(Number.isFinite(end)).toBe(true);
    expect(end).toBeGreaterThan(v.t);
    expect(end - v.t).toBeLessThan(6); // ningún efecto dura más de 6 s
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) {
      expect(s.started).toBeGreaterThanOrEqual(v.t);
      expect(s.stopped).toBeGreaterThan(s.started);
    }
  });

  it('las voces de diálogo varían por personaje y respetan el largo', () => {
    const a = voice();
    const b = voice();
    voiceBlips(a.v, 'narrator', 'Hola');
    voiceBlips(b.v, 'nerly', 'Una línea bastante larga para que suenen varios blips seguidos, muchos');
    expect(a.sources.length).toBe(2); // mínimo 2 blips
    expect(b.sources.length).toBeGreaterThan(2);
    expect(b.sources.length).toBeLessThanOrEqual(7);
  });

  it.each(Object.keys(AMBIENCES))('ambiente "%s": capas y eventos válidos', (name) => {
    const { ctx } = fakeContext();
    const out = ctx.createGain();
    const stop = AMBIENCES[name].bed(ctx as unknown as AudioContext, out as unknown as AudioNode);
    for (let i = 0; i < 200; i++) AMBIENCES[name].tick?.({ ctx, out, t: 1 + i * 0.25 } as unknown as Voice);
    expect(() => stop()).not.toThrow();
  });

  it('notas', () => {
    expect(noteFreq('A4')).toBeCloseTo(440);
    expect(noteFreq('C4')).toBeCloseTo(261.63, 1);
    expect(noteFreq('F#3')).toBeCloseTo(185, 0);
    expect(noteFreq('Bb2')).toBeCloseTo(116.54, 1);
    expect(() => noteFreq('H2')).toThrow();
  });
});
