// audio/synth.ts
// Primitivas de síntesis 8-bit sobre WebAudio: tonos con envolvente y glissando,
// ondas de pulso tipo NES, ruido filtrado y secuencias de notas.
// Todo se programa sobre el reloj del AudioContext (no bloquea el hilo).

export type Wave = OscillatorType | 'pulse12' | 'pulse25';

export interface FilterDef {
  type: BiquadFilterType;
  freq: number;
  /** Frecuencia final (barrido exponencial durante `dur`) */
  to?: number;
  q?: number;
}

/** Destino y momento de inicio de un sonido */
export interface Voice {
  ctx: BaseAudioContext;
  out: AudioNode;
  t: number;
}

export interface ToneOpts {
  wave?: Wave;
  /** Frecuencia en Hz o nombre de nota ("C5", "F#3") */
  freq: number | string;
  /** Frecuencia final: glissando exponencial durante `dur` (o `glide`) */
  to?: number | string;
  glide?: number;
  /** Recorrido libre de frecuencia: [[segundos, Hz], ...] (reemplaza a `to`) */
  path?: [number, number][];
  dur: number;
  vol?: number;
  attack?: number;
  /** 'exp' = decae durante toda la nota (percusivo); 'hold' = sostiene y suelta al final */
  env?: 'exp' | 'hold';
  release?: number;
  delay?: number;
  vibrato?: { rate: number; depth: number };
  filter?: FilterDef;
  detune?: number;
}

export interface NoiseOpts {
  dur: number;
  vol?: number;
  color?: 'white' | 'brown';
  filter?: FilterDef;
  attack?: number;
  env?: 'exp' | 'hold';
  release?: number;
  delay?: number;
  /** Trémolo: modulación de volumen (ondas de ruido "vivas": fuego, ronquido) */
  tremolo?: { rate: number; depth: number };
}

const SILENCE = 0.0001;
const NOTE_RE = /^([A-Ga-g])([#b]?)(-?\d)$/;
const SEMITONES: Record<string, number> = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 };

/** "A4" → 440. Acepta números tal cual. */
export function noteFreq(note: number | string): number {
  if (typeof note === 'number') return note;
  const m = NOTE_RE.exec(note);
  if (!m) throw new Error(`Nota inválida: ${note}`);
  const semis = SEMITONES[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12;
  return 440 * Math.pow(2, semis / 12);
}

// --- Cachés por contexto (ondas de pulso y buffers de ruido) ---

const pulseCache = new WeakMap<BaseAudioContext, Map<number, PeriodicWave>>();
const noiseCache = new WeakMap<BaseAudioContext, Record<string, AudioBuffer>>();

function pulseWave(ctx: BaseAudioContext, duty: number): PeriodicWave {
  let byDuty = pulseCache.get(ctx);
  if (!byDuty) pulseCache.set(ctx, (byDuty = new Map()));
  let wave = byDuty.get(duty);
  if (!wave) {
    const n = 48;
    const real = new Float32Array(n);
    const imag = new Float32Array(n);
    for (let k = 1; k < n; k++) {
      // Serie de Fourier de un tren de pulsos con ciclo de trabajo `duty`
      real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty);
    }
    wave = ctx.createPeriodicWave(real, imag);
    byDuty.set(duty, wave);
  }
  return wave;
}

export function noiseBuffer(ctx: BaseAudioContext, color: 'white' | 'brown'): AudioBuffer {
  let bufs = noiseCache.get(ctx);
  if (!bufs) noiseCache.set(ctx, (bufs = {}));
  if (!bufs[color]) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (color === 'white') {
        data[i] = white;
      } else {
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5;
      }
    }
    bufs[color] = buf;
  }
  return bufs[color];
}

function makeFilter(ctx: BaseAudioContext, f: FilterDef, t: number, dur: number): BiquadFilterNode {
  const node = ctx.createBiquadFilter();
  node.type = f.type;
  node.frequency.setValueAtTime(f.freq, t);
  if (f.to !== undefined) node.frequency.exponentialRampToValueAtTime(Math.max(20, f.to), t + dur);
  node.Q.value = f.q ?? 1;
  return node;
}

/** Envolvente de volumen: ataque lineal y caída exponencial (o sostenida) */
function envelope(
  ctx: BaseAudioContext,
  t: number,
  dur: number,
  vol: number,
  attack: number,
  env: 'exp' | 'hold',
  release: number
): GainNode {
  const g = ctx.createGain();
  g.gain.setValueAtTime(SILENCE, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  if (env === 'hold') {
    g.gain.setValueAtTime(vol, t + Math.max(attack, dur - release));
  }
  g.gain.exponentialRampToValueAtTime(SILENCE, t + dur);
  return g;
}

/** Tono con envolvente. Devuelve el momento en que termina. */
export function tone(v: Voice, o: ToneOpts): number {
  const { ctx } = v;
  const t = v.t + (o.delay ?? 0);
  const dur = o.dur;
  const osc = ctx.createOscillator();
  const wave = o.wave ?? 'square';
  if (wave === 'pulse12') osc.setPeriodicWave(pulseWave(ctx, 0.125));
  else if (wave === 'pulse25') osc.setPeriodicWave(pulseWave(ctx, 0.25));
  else osc.type = wave;
  if (o.detune) osc.detune.value = o.detune;

  const f0 = noteFreq(o.freq);
  osc.frequency.setValueAtTime(f0, t);
  if (o.path) {
    for (const [at, hz] of o.path) osc.frequency.exponentialRampToValueAtTime(Math.max(20, hz), t + at);
  } else if (o.to !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, noteFreq(o.to)), t + (o.glide ?? dur));
  }

  if (o.vibrato) {
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.vibrato.rate;
    depth.gain.value = o.vibrato.depth;
    lfo.connect(depth).connect(osc.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }

  const g = envelope(ctx, t, dur, o.vol ?? 0.3, o.attack ?? 0.005, o.env ?? 'exp', o.release ?? 0.05);
  let node: AudioNode = osc;
  if (o.filter) node = node.connect(makeFilter(ctx, o.filter, t, dur));
  node.connect(g).connect(v.out);
  osc.start(t);
  osc.stop(t + dur + 0.05);
  return t + dur;
}

/** Ráfaga de ruido filtrado. Devuelve el momento en que termina. */
export function noise(v: Voice, o: NoiseOpts): number {
  const { ctx } = v;
  const t = v.t + (o.delay ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, o.color ?? 'white');
  src.loop = true;
  // Arranca en un punto al azar del buffer para que dos ráfagas no suenen idénticas
  const offset = Math.random() * 1.5;

  const g = envelope(ctx, t, o.dur, o.vol ?? 0.3, o.attack ?? 0.003, o.env ?? 'exp', o.release ?? 0.05);
  let node: AudioNode = src;
  if (o.filter) node = node.connect(makeFilter(ctx, o.filter, t, o.dur));
  if (o.tremolo) {
    const trem = ctx.createGain();
    trem.gain.value = 1 - o.tremolo.depth;
    const lfo = ctx.createOscillator();
    const depth = ctx.createGain();
    lfo.frequency.value = o.tremolo.rate;
    depth.gain.value = o.tremolo.depth;
    lfo.connect(depth).connect(trem.gain);
    lfo.start(t);
    lfo.stop(t + o.dur + 0.05);
    node = node.connect(trem);
  }
  node.connect(g).connect(v.out);
  src.start(t, offset);
  src.stop(t + o.dur + 0.05);
  return t + o.dur;
}

/** Nota de una secuencia: [nota o null (silencio), duración en pulsos] */
export type SeqNote = [string | number | null, number];

export interface SeqOpts {
  bpm: number;
  wave?: Wave;
  vol?: number;
  /** Fracción del pulso que suena (0-1) */
  legato?: number;
  delay?: number;
  env?: 'exp' | 'hold';
  vibrato?: { rate: number; depth: number };
  filter?: FilterDef;
  detune?: number;
}

/** Toca una melodía. Devuelve el momento en que termina. */
export function seq(v: Voice, notes: SeqNote[], o: SeqOpts): number {
  const beat = 60 / o.bpm;
  let at = o.delay ?? 0;
  for (const [note, beats] of notes) {
    const len = beats * beat;
    if (note !== null) {
      tone(v, {
        wave: o.wave ?? 'pulse25',
        freq: note,
        dur: Math.max(0.03, len * (o.legato ?? 0.9)),
        vol: o.vol ?? 0.2,
        env: o.env ?? 'hold',
        release: Math.min(0.08, len * 0.3),
        delay: at,
        vibrato: o.vibrato,
        filter: o.filter,
        detune: o.detune,
      });
    }
    at += len;
  }
  return v.t + at;
}

/** Voz desplazada en el tiempo (para encadenar capas de un mismo sonido) */
export function at(v: Voice, seconds: number): Voice {
  return { ...v, t: v.t + seconds };
}

/** Aleatorio en [a, b) */
export function rnd(a: number, b: number): number {
  return a + Math.random() * (b - a);
}
