// audio/ambience.ts
// Ambientes en bucle sintetizados (lluvia, viento, cueva...). Suenan debajo de la música.
// Cada ambiente tiene una capa continua (ruido filtrado, drones) y eventos al azar
// (gotas, pájaros, crujidos) que se programan con un pequeño planificador.

import { noiseBuffer, tone, noise, rnd, at, type Voice } from './synth';

export interface AmbienceDef {
  desc: string;
  /** Crea las capas continuas conectadas a `out`. Devuelve una función que las detiene. */
  bed: (ctx: AudioContext, out: AudioNode) => () => void;
  /** Eventos sueltos: se llama cada ~250 ms y decide si programar algo */
  tick?: (v: Voice) => void;
}

/** Ruido continuo filtrado, con volumen y filtro opcionalmente modulados por LFOs lentos */
function noiseBed(
  ctx: AudioContext,
  out: AudioNode,
  o: {
    color?: 'white' | 'brown';
    vol: number;
    filter: { type: BiquadFilterType; freq: number; q?: number };
    lfoFreq?: { rate: number; depth: number };
    lfoVol?: { rate: number; depth: number };
  }
): () => void {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, o.color ?? 'white');
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = o.filter.type;
  filter.frequency.value = o.filter.freq;
  filter.Q.value = o.filter.q ?? 1;
  const g = ctx.createGain();
  g.gain.value = o.vol;
  src.connect(filter).connect(g).connect(out);
  const lfos: OscillatorNode[] = [];
  const addLfo = (param: AudioParam, l: { rate: number; depth: number }) => {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = l.rate;
    depth.gain.value = l.depth;
    lfo.connect(depth).connect(param);
    lfo.start();
    lfos.push(lfo);
  };
  if (o.lfoFreq) addLfo(filter.frequency, o.lfoFreq);
  if (o.lfoVol) addLfo(g.gain, o.lfoVol);
  src.start(0, Math.random() * 1.5);
  return () => {
    src.stop();
    lfos.forEach((l) => l.stop());
  };
}

/** Drone grave continuo */
function drone(ctx: AudioContext, out: AudioNode, freqs: number[], vol: number, wave: OscillatorType = 'sine', lowpass = 400): () => void {
  const g = ctx.createGain();
  g.gain.value = vol;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  filter.connect(g).connect(out);
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    o.type = wave;
    o.frequency.value = f;
    o.detune.value = i * 7 - 5;
    o.connect(filter);
    o.start();
    return o;
  });
  return () => oscs.forEach((o) => o.stop());
}

const combine = (...stops: (() => void)[]) => () => stops.forEach((s) => s());

function drip(v: Voice, vol = 0.05) {
  const f = rnd(900, 1600);
  tone(v, { wave: 'sine', freq: f, to: f * 2.2, dur: 0.05, vol });
  // Eco de caverna
  tone(at(v, 0.22), { wave: 'sine', freq: f, to: f * 2.2, dur: 0.05, vol: vol * 0.3 });
}

function bird(v: Voice) {
  const f = rnd(2600, 3800);
  const n = Math.floor(rnd(2, 5));
  for (let i = 0; i < n; i++) {
    tone(v, { wave: 'sine', freq: f, path: [[0.04, f * 1.3], [0.08, f * 0.95]], dur: 0.09, vol: 0.025, delay: i * 0.12 });
  }
}

function cricket(v: Voice) {
  const f = rnd(4200, 4800);
  for (let p = 0; p < 3; p++) tone(v, { wave: 'sine', freq: f, dur: 0.018, vol: 0.02, delay: p * 0.035 });
}

export const AMBIENCES: Record<string, AmbienceDef> = {
  lluvia: {
    desc: 'Lluvia constante con gotas',
    bed: (ctx, out) => combine(
      noiseBed(ctx, out, { vol: 0.07, filter: { type: 'bandpass', freq: 2500, q: 0.4 }, lfoVol: { rate: 0.15, depth: 0.015 } }),
      noiseBed(ctx, out, { color: 'brown', vol: 0.05, filter: { type: 'lowpass', freq: 500 } }),
    ),
    tick: (v) => {
      if (Math.random() < 0.6) noise(at(v, rnd(0, 0.25)), { dur: 0.012, vol: 0.03, filter: { type: 'highpass', freq: 4000 } });
      if (Math.random() < 0.02) noise(v, { dur: 3, vol: 0.12, color: 'brown', attack: 0.4, filter: { type: 'lowpass', freq: 200 } }); // trueno lejano
    },
  },
  viento: {
    desc: 'Viento que sopla a rachas',
    bed: (ctx, out) => noiseBed(ctx, out, {
      color: 'brown', vol: 0.1, filter: { type: 'bandpass', freq: 600, q: 2 },
      lfoFreq: { rate: 0.13, depth: 350 }, lfoVol: { rate: 0.07, depth: 0.05 },
    }),
  },
  bosque: {
    desc: 'Bosque de día: brisa y pájaros',
    bed: (ctx, out) => noiseBed(ctx, out, { color: 'brown', vol: 0.05, filter: { type: 'bandpass', freq: 800, q: 1 }, lfoVol: { rate: 0.1, depth: 0.02 } }),
    tick: (v) => {
      if (Math.random() < 0.05) bird(at(v, rnd(0, 0.25)));
    },
  },
  noche: {
    desc: 'Noche en el campo: grillos',
    bed: (ctx, out) => noiseBed(ctx, out, { color: 'brown', vol: 0.03, filter: { type: 'lowpass', freq: 400 } }),
    tick: (v) => {
      if (Math.random() < 0.35) cricket(at(v, rnd(0, 0.25)));
    },
  },
  fogata: {
    desc: 'Fogata crepitando',
    bed: (ctx, out) => noiseBed(ctx, out, { color: 'brown', vol: 0.08, filter: { type: 'lowpass', freq: 700 }, lfoVol: { rate: 0.4, depth: 0.03 } }),
    tick: (v) => {
      const n = Math.random() < 0.5 ? 1 : Math.floor(rnd(2, 5));
      for (let i = 0; i < n; i++) {
        noise(at(v, rnd(0, 0.25)), { dur: rnd(0.005, 0.02), vol: rnd(0.02, 0.07), filter: { type: 'highpass', freq: rnd(1500, 4000) } });
      }
      if (Math.random() < 0.08) cricket(at(v, rnd(0, 0.25)));
    },
  },
  cueva: {
    desc: 'Cueva: zumbido grave y goteras con eco',
    bed: (ctx, out) => combine(
      drone(ctx, out, [55, 82.5], 0.05),
      noiseBed(ctx, out, { color: 'brown', vol: 0.03, filter: { type: 'lowpass', freq: 250 }, lfoVol: { rate: 0.05, depth: 0.015 } }),
    ),
    tick: (v) => {
      if (Math.random() < 0.12) drip(at(v, rnd(0, 0.25)));
    },
  },
  abismo: {
    desc: 'Abismo babosil: drone ominoso y burbujeo de baba',
    bed: (ctx, out) => combine(
      drone(ctx, out, [41, 61.5, 82], 0.06, 'sawtooth', 160),
      noiseBed(ctx, out, { color: 'brown', vol: 0.04, filter: { type: 'lowpass', freq: 300 }, lfoVol: { rate: 0.08, depth: 0.02 } }),
    ),
    tick: (v) => {
      if (Math.random() < 0.15) {
        const f = rnd(120, 260);
        tone(at(v, rnd(0, 0.25)), { wave: 'sine', freq: f, to: f * rnd(2, 3), dur: rnd(0.06, 0.12), vol: 0.06 });
      }
      if (Math.random() < 0.012) {
        // Gruñido lejano de algo grande
        tone(v, { wave: 'sawtooth', freq: 60, to: 45, dur: 2, vol: 0.05, attack: 0.5, vibrato: { rate: 12, depth: 6 }, filter: { type: 'lowpass', freq: 250 } });
      }
    },
  },
  taberna: {
    desc: 'Taberna llena: murmullo y jarras',
    bed: (ctx, out) => combine(
      noiseBed(ctx, out, { color: 'brown', vol: 0.09, filter: { type: 'bandpass', freq: 450, q: 1.2 }, lfoVol: { rate: 0.6, depth: 0.03 }, lfoFreq: { rate: 0.9, depth: 120 } }),
      noiseBed(ctx, out, { vol: 0.012, filter: { type: 'bandpass', freq: 1200, q: 2 }, lfoVol: { rate: 1.3, depth: 0.008 } }),
    ),
    tick: (v) => {
      if (Math.random() < 0.06) {
        // Choque de jarras
        const f = rnd(1800, 2600);
        for (const r of [1, 1.5, 2.1]) tone(at(v, rnd(0, 0.2)), { wave: 'sine', freq: f * r, dur: 0.25, vol: 0.025 / r });
      }
    },
  },
  pueblo: {
    desc: 'Pueblo: gente a lo lejos y algún pájaro',
    bed: (ctx, out) => noiseBed(ctx, out, { color: 'brown', vol: 0.05, filter: { type: 'bandpass', freq: 500, q: 1 }, lfoVol: { rate: 0.4, depth: 0.02 } }),
    tick: (v) => {
      if (Math.random() < 0.025) bird(at(v, rnd(0, 0.25)));
    },
  },
};

export type AmbienceName = keyof typeof AMBIENCES;
