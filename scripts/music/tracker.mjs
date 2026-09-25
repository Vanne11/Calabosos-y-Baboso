// scripts/music/tracker.mjs
// Mini tracker chiptune: convierte canciones descritas con acordes + melodías en PCM.
// Canales estilo NES: dos pulsos (melodía, armonía/acordes), triángulo (bajo) y ruido (batería).
// Sin dependencias: síntesis por muestra con acumuladores de fase.

export const SAMPLE_RATE = 32000;
/** RMS objetivo de cada pista (≈ -15.5 dBFS) */
const TARGET_RMS = 0.165;

// ─── Notas y acordes ───

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "A4" → número MIDI (69) */
export function midi(note) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(note);
  if (!m) throw new Error(`Nota inválida: ${note}`);
  return 12 * (Number(m[3]) + 1) + SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const QUALITIES = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11],
  dim: [0, 3, 6], aug: [0, 4, 8], sus4: [0, 5, 7], sus2: [0, 2, 7], 5: [0, 7, 12], m6: [0, 3, 7, 9], 6: [0, 4, 7, 9],
};

/** "F#m7" → { root: midi en octava 3, tones: [semitonos] } */
export function chord(name) {
  const m = /^([A-G][#b]?)(.*)$/.exec(name);
  if (!m || !(m[2] in QUALITIES)) throw new Error(`Acorde inválido: ${name}`);
  return { root: midi(`${m[1]}3`), tones: QUALITIES[m[2]] };
}

// ─── Eventos ───
// Un evento: { ch, start (pasos), len (pasos), midi, arp?: [semitonos], vol?, drum? }

/** Melodía en texto: "E5 - - . G5 . A5 -" ('-' sostiene, '.' silencio). Un token por paso. */
export function melody(ch, text, startStep, opts = {}) {
  const tokens = text.trim().split(/\s+/);
  const events = [];
  let cur = null;
  tokens.forEach((tok, i) => {
    if (tok === '-') {
      if (cur) cur.len++;
      return;
    }
    cur = null;
    if (tok === '.') return;
    cur = { ch, start: startStep + i, len: 1, midi: midi(tok), ...opts };
    events.push(cur);
  });
  return { events, steps: tokens.length };
}

// ─── Síntesis por canal ───

function pulse(phase, duty) {
  return phase % 1 < duty ? 1 : -1;
}

function triangle(phase) {
  // Triángulo cuantizado a 16 niveles, como el del NES
  const p = phase % 1;
  const v = p < 0.5 ? p * 4 - 1 : 3 - p * 4;
  return Math.round(v * 7.5) / 7.5;
}

const CHANNELS = {
  lead: { wave: 'pulse', duty: 0.25, vol: 0.2, attack: 0.004, decay: 0.25, sustain: 0.65, release: 0.04, vibrato: 0.12 },
  lead2: { wave: 'pulse', duty: 0.5, vol: 0.17, attack: 0.004, decay: 0.2, sustain: 0.6, release: 0.04, vibrato: 0.12 },
  harm: { wave: 'pulse', duty: 0.125, vol: 0.1, attack: 0.003, decay: 0.12, sustain: 0.45, release: 0.03 },
  pluck: { wave: 'pulse', duty: 0.25, vol: 0.12, attack: 0.002, decay: 0.09, sustain: 0.05, release: 0.02 },
  bell: { wave: 'triangle', vol: 0.3, attack: 0.002, decay: 0.5, sustain: 0.1, release: 0.1 },
  bass: { wave: 'triangle', vol: 0.42, attack: 0.003, decay: 0.2, sustain: 0.85, release: 0.02 },
  pad: { wave: 'pulse', duty: 0.5, vol: 0.06, attack: 0.08, decay: 0.3, sustain: 0.8, release: 0.2, vibrato: 0.08 },
};

/** Sonidos de batería sintetizados */
function drumSample(kind, t, rand) {
  switch (kind) {
    case 'k': { // bombo: seno con caída de tono
      if (t > 0.18) return null;
      const f = 50 + 110 * Math.exp(-t * 35);
      return Math.sin(2 * Math.PI * f * t * (1 + t * 0)) * Math.exp(-t * 18) * 0.9;
    }
    case 's': // caja: ruido + cuerpo
      if (t > 0.16) return null;
      return (rand() * 2 - 1) * Math.exp(-t * 22) * 0.45 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * 0.3;
    case 'h': // charles cerrado
      if (t > 0.04) return null;
      return (rand() * 2 - 1) * Math.exp(-t * 90) * 0.18;
    case 'o': // charles abierto
      if (t > 0.2) return null;
      return (rand() * 2 - 1) * Math.exp(-t * 16) * 0.14;
    case 'c': // platillo
      if (t > 1.2) return null;
      return (rand() * 2 - 1) * Math.exp(-t * 4) * 0.16;
    case 't': // tom
      if (t > 0.25) return null;
      return Math.sin(2 * Math.PI * (90 + 60 * Math.exp(-t * 20)) * t) * Math.exp(-t * 12) * 0.5;
    case 'p': // palmas
      if (t > 0.12) return null;
      return (rand() * 2 - 1) * (Math.exp(-t * 40) + (t > 0.012 ? Math.exp(-(t - 0.012) * 40) : 0)) * 0.22;
    default:
      return null;
  }
}

function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Renderiza una canción a Float32Array mono.
 * song: { bpm, stepsPerBeat, steps, events, drums: [{start, kind, vol}] }
 */
export function render(song) {
  const stepSec = 60 / song.bpm / song.stepsPerBeat;
  const total = Math.ceil(song.steps * stepSec * SAMPLE_RATE);
  const out = new Float32Array(total);
  const rand = lcg(1234);

  for (const ev of song.events) {
    const def = { ...CHANNELS[ev.ch], ...(ev.channel ?? {}) };
    const start = Math.floor(ev.start * stepSec * SAMPLE_RATE);
    const noteSec = ev.len * stepSec * (ev.legato ?? 0.92);
    const endSec = noteSec + def.release;
    const n = Math.ceil(endSec * SAMPLE_RATE);
    const base = hz(ev.midi);
    const vol = def.vol * (ev.vol ?? 1);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      // Canción en bucle: lo que se pasa del final entra por el principio (bucle sin cortes)
      const idx = (start + i) % total;
      const t = i / SAMPLE_RATE;
      // Envolvente ADSR
      let env;
      if (t < def.attack) env = t / def.attack;
      else if (t < noteSec) env = def.sustain + (1 - def.sustain) * Math.exp(-(t - def.attack) / def.decay * 3);
      else env = (def.sustain + (1 - def.sustain) * Math.exp(-(noteSec - def.attack) / def.decay * 3)) * Math.max(0, 1 - (t - noteSec) / def.release);
      // Frecuencia: arpegio de tracker (acordes en un canal) y vibrato tardío
      let f = base;
      if (ev.arp) f = base * Math.pow(2, ev.arp[Math.floor(t * 60) % ev.arp.length] / 12);
      if (def.vibrato && t > 0.18) f *= 1 + def.vibrato * 0.05 * Math.sin(2 * Math.PI * 5.5 * t);
      if (ev.slide) f *= Math.pow(2, (ev.slide * Math.min(1, t / noteSec)) / 12);
      phase += f / SAMPLE_RATE;
      const s = def.wave === 'triangle' ? triangle(phase) : pulse(phase, def.duty);
      out[idx] += s * env * vol;
    }
  }

  for (const d of song.drums) {
    const start = Math.floor(d.start * stepSec * SAMPLE_RATE);
    for (let i = 0; ; i++) {
      const v = drumSample(d.kind, i / SAMPLE_RATE, rand);
      if (v === null) break;
      out[(start + i) % total] += v * (d.vol ?? 1) * 0.8;
    }
  }

  // Filtro paso bajo suave (quita la aspereza del aliasing)
  let lp = 0;
  const a = 0.55;
  let sum = 0;
  for (let i = 0; i < total; i++) {
    lp += a * (out[i] - lp);
    out[i] = lp;
    sum += lp * lp;
  }
  // Sonoridad pareja con las pistas rpgchip (≈ -15 dB de media) y picos redondeados
  const rms = Math.sqrt(sum / total) || 1;
  const gain = TARGET_RMS / rms;
  for (let i = 0; i < total; i++) {
    const v = out[i] * gain;
    out[i] = Math.abs(v) < 0.6 ? v : Math.sign(v) * (0.6 + 0.35 * Math.tanh((Math.abs(v) - 0.6) / 0.35));
  }
  return out;
}

/** PCM float → WAV 16 bits mono */
export function toWav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(samples[i] * 32767))), 44 + i * 2);
  }
  return buf;
}
