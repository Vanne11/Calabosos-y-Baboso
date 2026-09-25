// audio/sfxCatalog.ts
// Catálogo de efectos de sonido sintetizados (estética 8-bit, a juego con la música chiptune).
// Se usan por nombre: { "type": "sound", "sfx": "puerta" }, scenario.sfx, game.json → audio.statSfx.
// Los nombres deben coincidir con sfx-names.json (lo verifica un test; el validador lo usa).

import { tone, noise, seq, at, rnd, type Voice } from './synth';

export interface SfxDef {
  /** Programa el sonido desde v.t y devuelve el momento en que termina */
  play: (v: Voice) => number;
  /** Jingle musical: baja la música mientras suena */
  jingle?: boolean;
  /** Descripción corta (documentación y editor) */
  desc: string;
  /** Efecto de pantalla que lo acompaña cuando lo pide el guion (explosiones, derrumbes, muerte) */
  fx?: { shake?: number; flash?: 'damage' | 'heal' | 'gold' | 'level' | 'death' };
}

// --- Piezas reutilizables ---

function thud(v: Voice, vol = 0.5, freq = 90): number {
  tone(v, { wave: 'sine', freq, to: 40, dur: 0.25, vol });
  return noise(v, { dur: 0.12, vol: vol * 0.5, color: 'brown', filter: { type: 'lowpass', freq: 500 } });
}

function click(v: Voice, freq = 2200, vol = 0.2): number {
  noise(v, { dur: 0.015, vol: vol * 0.7, filter: { type: 'highpass', freq: 3000 } });
  return tone(v, { wave: 'square', freq, dur: 0.02, vol: vol * 0.5 });
}

function whoosh(v: Voice, dur = 0.2, from = 600, to = 3000, vol = 0.25): number {
  return noise(v, { dur, vol, attack: dur * 0.4, filter: { type: 'bandpass', freq: from, to, q: 1.5 } });
}

function metal(v: Voice, base: number, dur = 0.5, vol = 0.12): number {
  for (const ratio of [1, 1.47, 1.93, 2.61]) {
    tone(v, { wave: 'sine', freq: base * ratio, dur: dur / ratio ** 0.3, vol: vol / ratio });
  }
  return v.t + dur;
}

function coin(v: Voice, vol = 0.18, pitch = 1): number {
  tone(v, { wave: 'square', freq: 988 * pitch, dur: 0.07, vol, env: 'hold' });
  return tone(v, { wave: 'square', freq: 1319 * pitch, dur: 0.3, vol, delay: 0.07 });
}

function bubble(v: Voice, vol = 0.15): number {
  const f = rnd(250, 500);
  return tone(v, { wave: 'sine', freq: f, to: f * rnd(2.2, 3.2), dur: rnd(0.05, 0.09), vol });
}

function crash(v: Voice, vol = 0.25, dur = 0.9): number {
  return noise(v, { dur, vol, filter: { type: 'highpass', freq: 5000 } });
}

function snare(v: Voice, vol = 0.25): number {
  tone(v, { wave: 'triangle', freq: 220, to: 120, dur: 0.08, vol: vol * 0.6 });
  return noise(v, { dur: 0.12, vol, filter: { type: 'bandpass', freq: 2500, q: 0.8 } });
}

/** Sílaba sintética (risas, gritos): diente de sierra con formante */
function syllable(v: Voice, freq: number, to: number, dur: number, formant: number, vol = 0.18): number {
  return tone(v, {
    wave: 'sawtooth', freq, to, dur, vol, env: 'hold', release: dur * 0.4,
    filter: { type: 'bandpass', freq: formant, q: 2.5 },
  });
}

export const SFX: Record<string, SfxDef> = {
  // ─── Interfaz ───
  click: { desc: 'Clic de interfaz', play: (v) => tone(v, { wave: 'square', freq: 1200, to: 900, dur: 0.035, vol: 0.08 }) },
  seleccion: {
    desc: 'Elegir una opción',
    play: (v) => {
      tone(v, { wave: 'pulse25', freq: 'E6', dur: 0.05, vol: 0.08, env: 'hold' });
      return tone(v, { wave: 'pulse25', freq: 'A6', dur: 0.09, vol: 0.08, delay: 0.05 });
    },
  },
  error: {
    desc: 'Zumbido de error',
    play: (v) => {
      tone(v, { wave: 'square', freq: 140, dur: 0.12, vol: 0.12, env: 'hold' });
      return tone(v, { wave: 'square', freq: 120, dur: 0.18, vol: 0.12, env: 'hold', delay: 0.14 });
    },
  },
  notificacion: {
    desc: 'Aviso suave',
    play: (v) => {
      tone(v, { wave: 'sine', freq: 'D6', dur: 0.15, vol: 0.15 });
      return tone(v, { wave: 'sine', freq: 'A6', dur: 0.35, vol: 0.15, delay: 0.1 });
    },
  },
  alerta: {
    desc: 'Doble pitido de advertencia',
    play: (v) => {
      tone(v, { wave: 'square', freq: 'A5', dur: 0.08, vol: 0.1, env: 'hold' });
      return tone(v, { wave: 'square', freq: 'A5', dur: 0.08, vol: 0.1, env: 'hold', delay: 0.13 });
    },
  },
  descubrimiento: {
    desc: 'Algo nuevo y misterioso',
    play: (v) => {
      const end = seq(v, [['E5', 0.5], ['G#5', 0.5], ['B5', 0.5], ['D#6', 1.5]], { bpm: 300, wave: 'triangle', vol: 0.2 });
      seq(at(v, 0.12), [['E5', 0.5], ['G#5', 0.5], ['B5', 0.5], ['D#6', 1.5]], { bpm: 300, wave: 'sine', vol: 0.06 });
      return end;
    },
  },
  guardar: {
    desc: 'Partida guardada',
    play: (v) => {
      tone(v, { wave: 'sine', freq: 'E6', dur: 0.1, vol: 0.12, env: 'hold' });
      return tone(v, { wave: 'sine', freq: 'B6', dur: 0.3, vol: 0.12, delay: 0.1 });
    },
  },
  rebobinar: {
    desc: 'Cinta rebobinando (volver al punto de control)',
    play: (v) => tone(v, { wave: 'square', freq: 200, to: 2400, dur: 0.9, vol: 0.08, env: 'hold', vibrato: { rate: 28, depth: 120 } }),
  },
  tic: { desc: 'Tic de reloj', play: (v) => click(v, 2400, 0.12) },
  tac: { desc: 'Tac de reloj', play: (v) => click(v, 1500, 0.12) },
  xp: { desc: 'Destello de experiencia', play: (v) => tone(v, { wave: 'sine', freq: 1200, to: 2600, dur: 0.14, vol: 0.12 }) },

  // ─── Dados ───
  dados: {
    desc: 'Dados rodando en la mesa (≈1.4 s)',
    play: (v) => {
      let t = 0;
      let gap = 0.03;
      while (t < 1.35) {
        noise(v, { dur: 0.02, vol: rnd(0.12, 0.25), delay: t, filter: { type: 'bandpass', freq: rnd(2500, 4500), q: 4 } });
        tone(v, { wave: 'triangle', freq: rnd(900, 1600), dur: 0.02, vol: 0.05, delay: t });
        t += gap + rnd(0, 0.04);
        gap *= 1.12;
      }
      return v.t + 1.4;
    },
  },
  critico: {
    desc: 'Éxito crítico: fanfarria corta',
    jingle: true,
    play: (v) => {
      const notes: [string, number][] = [['C5', 0.5], ['E5', 0.5], ['G5', 0.5], ['C6', 0.5], ['E6', 0.5], ['G6', 0.5], ['C7', 3]];
      seq(v, notes, { bpm: 520, wave: 'pulse25', vol: 0.16 });
      seq(at(v, 0.01), notes, { bpm: 520, wave: 'triangle', vol: 0.1, detune: -1200 });
      return tone(v, { wave: 'sine', freq: 'C8', dur: 0.6, vol: 0.05, delay: 0.35, vibrato: { rate: 12, depth: 40 } });
    },
  },
  exito: {
    desc: 'Tirada o acción lograda',
    play: (v) => {
      tone(v, { wave: 'pulse25', freq: 'G5', dur: 0.08, vol: 0.14, env: 'hold' });
      return tone(v, { wave: 'pulse25', freq: 'C6', dur: 0.3, vol: 0.14, delay: 0.08 });
    },
  },
  fallo: {
    desc: 'Tirada o acción fallida',
    play: (v) => {
      tone(v, { wave: 'square', freq: 'E4', dur: 0.12, vol: 0.12, env: 'hold' });
      return tone(v, { wave: 'square', freq: 'C4', to: 'A3', dur: 0.35, vol: 0.12, delay: 0.13, env: 'hold' });
    },
  },
  pifia: {
    desc: 'Trombón triste (wah wah wah wahhh)',
    jingle: true,
    play: (v) => {
      const filter = { type: 'lowpass' as BiquadFilterType, freq: 1400, q: 3 };
      tone(v, { wave: 'sawtooth', freq: 'G3', to: 'F#3', dur: 0.38, vol: 0.2, env: 'hold', filter });
      tone(v, { wave: 'sawtooth', freq: 'F#3', to: 'F3', dur: 0.38, vol: 0.2, env: 'hold', filter, delay: 0.42 });
      tone(v, { wave: 'sawtooth', freq: 'F3', to: 'E3', dur: 0.38, vol: 0.2, env: 'hold', filter, delay: 0.84 });
      return tone(v, {
        wave: 'sawtooth', freq: 'E3', to: 'D#3', dur: 1.3, vol: 0.2, env: 'hold', release: 0.4, filter, delay: 1.26,
        vibrato: { rate: 6, depth: 6 },
      });
    },
  },

  // ─── Stats y objetos ───
  dano: {
    desc: 'Recibir daño',
    play: (v) => {
      noise(v, { dur: 0.2, vol: 0.3, filter: { type: 'lowpass', freq: 2500, to: 300 } });
      return tone(v, { wave: 'square', freq: 220, to: 60, dur: 0.22, vol: 0.18 });
    },
  },
  dano_fuerte: {
    desc: 'Daño grande',
    play: (v) => {
      noise(v, { dur: 0.45, vol: 0.4, color: 'brown', filter: { type: 'lowpass', freq: 3000, to: 150 } });
      tone(v, { wave: 'sine', freq: 90, to: 35, dur: 0.5, vol: 0.5 });
      return tone(v, { wave: 'square', freq: 300, to: 50, dur: 0.4, vol: 0.16 });
    },
  },
  curar: {
    desc: 'Recuperar vida',
    play: (v) => {
      seq(v, [['C5', 1], ['E5', 1], ['G5', 1], ['C6', 2]], { bpm: 600, wave: 'triangle', vol: 0.2 });
      return tone(v, { wave: 'sine', freq: 2000, dur: 0.5, vol: 0.06, delay: 0.2, vibrato: { rate: 14, depth: 60 } });
    },
  },
  moneda: { desc: 'Ganar una moneda', play: (v) => coin(v) },
  monedas: {
    desc: 'Lluvia de monedas',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 5; i++) end = coin(at(v, i * 0.09 + rnd(0, 0.03)), 0.12, rnd(0.97, 1.08));
      return end;
    },
  },
  pagar: {
    desc: 'Gastar monedas',
    play: (v) => {
      for (let i = 0; i < 3; i++) metal(at(v, i * 0.08), rnd(2600, 3400), 0.18, 0.06);
      return tone(at(v, 0.25), { wave: 'square', freq: 'C5', to: 'G4', dur: 0.15, vol: 0.07 });
    },
  },
  objeto: {
    desc: 'Conseguir un objeto',
    jingle: true,
    play: (v) => {
      seq(v, [['G4', 1], ['C5', 1], ['E5', 1], ['G5', 1], ['C6', 4]], { bpm: 560, wave: 'pulse25', vol: 0.15 });
      return seq(v, [['E4', 1], ['G4', 1], ['C5', 1], ['E5', 1], ['G5', 4]], { bpm: 560, wave: 'pulse12', vol: 0.08 });
    },
  },
  soltar: { desc: 'Perder o entregar un objeto', play: (v) => tone(v, { wave: 'triangle', freq: 'G4', to: 'C4', dur: 0.2, vol: 0.12 }) },
  miedo: {
    desc: 'Latido de miedo (bum-bum)',
    play: (v) => {
      for (const d of [0, 0.18, 0.75, 0.93]) tone(v, { wave: 'sine', freq: 70, to: 40, dur: 0.16, vol: d % 0.75 ? 0.3 : 0.4, delay: d });
      return tone(v, { wave: 'sawtooth', freq: 55, dur: 1.4, vol: 0.04, attack: 0.3, filter: { type: 'lowpass', freq: 200 } });
    },
  },
  pis: {
    desc: 'Chorrito (sube el pis)',
    play: (v) => {
      noise(v, { dur: 0.9, vol: 0.06, attack: 0.1, env: 'hold', filter: { type: 'bandpass', freq: 3500, q: 1 } });
      for (let t = 0; t < 0.85; t += rnd(0.03, 0.07)) tone(v, { wave: 'sine', freq: rnd(1400, 2800), dur: 0.03, vol: 0.05, delay: t });
      return v.t + 0.9;
    },
  },
  sexi: {
    desc: 'Silbido de piropo (fiu fiuuu)',
    play: (v) => {
      tone(v, { wave: 'sine', freq: 900, to: 2300, dur: 0.22, vol: 0.14, env: 'hold' });
      return tone(v, { wave: 'sine', freq: 800, path: [[0.25, 2500], [0.6, 700]], dur: 0.6, vol: 0.14, env: 'hold', delay: 0.32 });
    },
  },
  desinfle: {
    desc: 'Globo desinflándose (baja el ego)',
    play: (v) => tone(v, {
      wave: 'sawtooth', freq: 520, to: 70, dur: 1.1, vol: 0.14, env: 'hold',
      vibrato: { rate: 22, depth: 30 }, filter: { type: 'lowpass', freq: 1500, to: 300 },
    }),
  },
  afinidad_sube: {
    desc: 'Le caes mejor a alguien',
    play: (v) => {
      tone(v, { wave: 'sine', freq: 'A5', dur: 0.12, vol: 0.12, env: 'hold', vibrato: { rate: 8, depth: 8 } });
      return tone(v, { wave: 'sine', freq: 'E6', dur: 0.35, vol: 0.12, delay: 0.12, vibrato: { rate: 8, depth: 10 } });
    },
  },
  afinidad_baja: {
    desc: 'Le caes peor a alguien',
    play: (v) => {
      tone(v, { wave: 'triangle', freq: 'E5', dur: 0.12, vol: 0.14, env: 'hold' });
      return tone(v, { wave: 'triangle', freq: 'A4', to: 'G4', dur: 0.35, vol: 0.14, delay: 0.12 });
    },
  },
  rasgo: {
    desc: 'Nuevo rasgo o estado',
    play: (v) => {
      whoosh(v, 0.3, 400, 2500, 0.12);
      return seq(at(v, 0.15), [['D5', 1], ['F#5', 1], ['A5', 1], ['D6', 3]], { bpm: 500, wave: 'triangle', vol: 0.15 });
    },
  },
  subir: { desc: 'Medidor sube (conversaciones)', play: (v) => tone(v, { wave: 'pulse25', freq: 'C5', to: 'G5', dur: 0.12, vol: 0.1 }) },
  bajar: { desc: 'Medidor baja (conversaciones)', play: (v) => tone(v, { wave: 'pulse25', freq: 'G4', to: 'C4', dur: 0.14, vol: 0.1 }) },

  // ─── Jingles ───
  logro: {
    desc: 'Logro desbloqueado',
    jingle: true,
    play: (v) => {
      const lead: [string, number][] = [['C5', 1], ['C5', 1], ['C5', 1], ['C5', 3], ['G#4', 3], ['A#4', 3], ['C5', 2], ['A#4', 1], ['C5', 6]];
      seq(v, lead, { bpm: 900, wave: 'pulse25', vol: 0.15 });
      return seq(v, [['E4', 6], ['C4', 3], ['D4', 3], ['E4', 3], ['E4', 6]], { bpm: 900, wave: 'triangle', vol: 0.18 });
    },
  },
  nivel: {
    desc: 'Subir de nivel',
    jingle: true,
    play: (v) => {
      seq(v, [['C5', 1], ['G5', 1], ['C6', 1], ['E5', 1], ['B5', 1], ['E6', 1], ['G5', 1], ['D6', 1], ['G6', 4]], { bpm: 700, wave: 'pulse25', vol: 0.14 });
      return seq(v, [['C3', 3], ['E3', 3], ['G3', 4]], { bpm: 700, wave: 'triangle', vol: 0.22 });
    },
  },
  victoria: {
    desc: 'Victoria en combate',
    jingle: true,
    play: (v) => {
      const lead: [string | null, number][] = [['C5', 1], ['C5', 1], ['C5', 1], ['C5', 3], ['G#4', 3], ['A#4', 3], ['C5', 2], [null, 1], ['A#4', 1], ['C5', 8]];
      seq(v, lead, { bpm: 820, wave: 'pulse25', vol: 0.15 });
      seq(v, lead, { bpm: 820, wave: 'pulse12', vol: 0.06, detune: -500 });
      return seq(v, [['C3', 6], ['G#2', 3], ['A#2', 3], ['C3', 3], ['C3', 8]], { bpm: 820, wave: 'triangle', vol: 0.25 });
    },
  },
  derrota: {
    desc: 'Derrota o huida',
    jingle: true,
    play: (v) => {
      seq(v, [['G4', 2], ['F#4', 2], ['F4', 2], ['E4', 6]], { bpm: 360, wave: 'pulse25', vol: 0.14 });
      return seq(v, [['C3', 6], ['B2', 6]], { bpm: 360, wave: 'triangle', vol: 0.22 });
    },
  },
  muerte: {
    desc: 'Muerte del protagonista',
    fx: { flash: 'death' },
    jingle: true,
    play: (v) => {
      seq(v, [['A4', 2], ['E4', 2], ['C4', 2], ['A3', 2], ['G#3', 8]], { bpm: 240, wave: 'pulse25', vol: 0.14, vibrato: { rate: 5, depth: 4 } });
      seq(v, [['A2', 8], ['E2', 8]], { bpm: 240, wave: 'triangle', vol: 0.25 });
      return noise(at(v, 2), { dur: 2.5, vol: 0.06, color: 'brown', attack: 0.5, filter: { type: 'lowpass', freq: 300 } });
    },
  },
  tension: {
    desc: 'Golpe dramático (dun dun DUNNN)',
    jingle: true,
    play: (v) => {
      const filter = { type: 'lowpass' as BiquadFilterType, freq: 900 };
      tone(v, { wave: 'sawtooth', freq: 'D3', dur: 0.3, vol: 0.2, filter });
      tone(v, { wave: 'sawtooth', freq: 'D2', dur: 0.3, vol: 0.2, filter });
      tone(v, { wave: 'sawtooth', freq: 'D3', dur: 0.3, vol: 0.2, filter, delay: 0.4 });
      tone(v, { wave: 'sawtooth', freq: 'D2', dur: 0.3, vol: 0.2, filter, delay: 0.4 });
      tone(v, { wave: 'sawtooth', freq: 'A#2', dur: 2, vol: 0.22, filter, delay: 0.8, vibrato: { rate: 5, depth: 3 } });
      tone(v, { wave: 'sawtooth', freq: 'A#1', dur: 2, vol: 0.22, filter, delay: 0.8 });
      return noise(at(v, 0.8), { dur: 1.5, vol: 0.12, color: 'brown', filter: { type: 'lowpass', freq: 400 } });
    },
  },
  misterio: {
    desc: 'Algo raro está pasando',
    jingle: true,
    play: (v) => {
      seq(v, [['C5', 1], ['D5', 1], ['E5', 1], ['F#5', 1], ['G#5', 1], ['A#5', 4]], { bpm: 420, wave: 'sine', vol: 0.14, vibrato: { rate: 6, depth: 8 } });
      return seq(at(v, 0.18), [['C5', 1], ['D5', 1], ['E5', 1], ['F#5', 1], ['G#5', 1], ['A#5', 4]], { bpm: 420, wave: 'triangle', vol: 0.05 });
    },
  },
  amor: {
    desc: 'Momento romántico (cursi a propósito)',
    jingle: true,
    play: (v) => {
      const vib = { rate: 6, depth: 10 };
      seq(v, [['E5', 2], ['G5', 1], ['C6', 3], ['B5', 1], ['A5', 1], ['G5', 4]], { bpm: 300, wave: 'sine', vol: 0.16, vibrato: vib });
      return seq(v, [['C5', 2], ['E5', 1], ['G5', 3], ['F5', 1], ['E5', 1], ['E5', 4]], { bpm: 300, wave: 'sine', vol: 0.1, vibrato: vib });
    },
  },
  final: {
    desc: 'Final del juego (fanfarria larga)',
    fx: { flash: 'gold' },
    jingle: true,
    play: (v) => {
      const lead: [string | null, number][] = [
        ['G4', 1], ['C5', 1], ['E5', 1], ['G5', 3], ['E5', 1], ['G5', 4],
        ['A4', 1], ['C5', 1], ['F5', 1], ['A5', 3], ['F5', 1], ['A5', 4],
        ['B4', 1], ['D5', 1], ['G5', 1], ['B5', 3], ['B5', 1], ['B5', 1], ['B5', 1], ['C6', 8],
      ];
      seq(v, lead, { bpm: 640, wave: 'pulse25', vol: 0.14 });
      return seq(v, [['C3', 10], ['F3', 10], ['G3', 10], ['C3', 8]], { bpm: 640, wave: 'triangle', vol: 0.25 });
    },
  },
  exito_chat: {
    desc: 'Ta-dá (conversación ganada)',
    jingle: true,
    play: (v) => {
      tone(v, { wave: 'pulse25', freq: 'G5', dur: 0.1, vol: 0.14, env: 'hold' });
      tone(v, { wave: 'pulse25', freq: 'C6', dur: 0.6, vol: 0.14, delay: 0.12, vibrato: { rate: 7, depth: 12 } });
      return tone(v, { wave: 'triangle', freq: 'C4', dur: 0.7, vol: 0.2, delay: 0.12 });
    },
  },
  combate: {
    desc: 'Empieza un combate',
    play: (v) => {
      seq(v, [['A3', 1], ['A4', 1], ['A3', 1], ['A4', 1], ['E5', 3]], { bpm: 700, wave: 'square', vol: 0.12 });
      return crash(at(v, 0.34), 0.18, 0.8);
    },
  },

  // ─── Combate ───
  golpe: {
    desc: 'Puñetazo o impacto',
    play: (v) => {
      noise(v, { dur: 0.12, vol: 0.35, filter: { type: 'lowpass', freq: 1200 } });
      return tone(v, { wave: 'sine', freq: 160, to: 50, dur: 0.15, vol: 0.45 });
    },
  },
  espada: {
    desc: 'Tajo de espada con choque metálico',
    play: (v) => {
      whoosh(v, 0.16, 800, 4000, 0.2);
      noise(at(v, 0.15), { dur: 0.04, vol: 0.2, filter: { type: 'highpass', freq: 3000 } });
      return metal(at(v, 0.15), 1900, 0.5, 0.1);
    },
  },
  esquiva: { desc: 'Esquivar (zas)', play: (v) => whoosh(v, 0.14, 1500, 5000, 0.18) },
  bloqueo: {
    desc: 'Bloquear con escudo',
    play: (v) => {
      noise(v, { dur: 0.06, vol: 0.2, filter: { type: 'bandpass', freq: 1500 } });
      return metal(v, 700, 0.35, 0.12);
    },
  },
  huida: {
    desc: 'Salir corriendo',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 8; i++) {
        end = noise(v, { dur: 0.05, vol: 0.25 * (1 - i / 10), delay: i * 0.09, filter: { type: 'lowpass', freq: i % 2 ? 500 : 650 } });
      }
      return end;
    },
  },
  acido: {
    desc: 'Chisporroteo de ácido',
    play: (v) => noise(v, { dur: 0.9, vol: 0.12, env: 'hold', release: 0.3, filter: { type: 'highpass', freq: 3500 }, tremolo: { rate: 23, depth: 0.7 } }),
  },
  muere_enemigo: {
    desc: 'Enemigo derrotado (se deshace)',
    play: (v) => {
      tone(v, { wave: 'square', freq: 600, to: 60, dur: 0.6, vol: 0.12, vibrato: { rate: 30, depth: 60 } });
      return noise(v, { dur: 0.5, vol: 0.15, filter: { type: 'lowpass', freq: 2000, to: 200 } });
    },
  },

  // ─── Objetos y lugares ───
  puerta: {
    desc: 'Puerta de madera que chirría al abrirse',
    play: (v) => {
      tone(v, {
        wave: 'sawtooth', freq: 110, path: [[0.2, 150], [0.45, 95], [0.7, 170], [0.9, 120]], dur: 0.95, vol: 0.14, env: 'hold',
        vibrato: { rate: 35, depth: 12 }, filter: { type: 'bandpass', freq: 1100, q: 6 },
      });
      return thud(at(v, 0.95), 0.35, 80);
    },
  },
  campanilla: {
    desc: 'Campanilla de tienda (ding-ding)',
    play: (v) => {
      for (const d of [0, 0.14]) {
        for (const [r, g] of [[1, 0.1], [2.4, 0.04], [3.9, 0.02]]) tone(at(v, d), { wave: 'sine', freq: 1750 * r, dur: 0.6, vol: g });
      }
      return v.t + 0.8;
    },
  },
  puerta_cerrada: {
    desc: 'Forcejear con una puerta cerrada con llave',
    play: (v) => {
      for (const d of [0, 0.16, 0.34]) {
        click(at(v, d), 1400, 0.18);
        thud(at(v, d + 0.02), 0.18, 110);
      }
      return v.t + 0.6;
    },
  },
  portazo: {
    desc: 'Puerta que se cierra de golpe',
    fx: { shake: 1 },
    play: (v) => {
      thud(v, 0.6, 70);
      noise(v, { dur: 0.4, vol: 0.15, filter: { type: 'bandpass', freq: 400, q: 2 }, tremolo: { rate: 30, depth: 0.8 } });
      return v.t + 0.45;
    },
  },
  cerradura: {
    desc: 'Cerradura que cede (clic-clac)',
    play: (v) => {
      click(v, 2500, 0.2);
      click(at(v, 0.18), 1700, 0.25);
      return metal(at(v, 0.2), 1300, 0.25, 0.06);
    },
  },
  llave: {
    desc: 'Tintineo de llaves',
    play: (v) => {
      for (let t = 0; t < 0.45; t += rnd(0.04, 0.08)) metal(at(v, t), rnd(2800, 5000), 0.15, 0.05);
      return v.t + 0.5;
    },
  },
  explosion: {
    desc: 'Explosión',
    fx: { shake: 3, flash: 'gold' },
    play: (v) => {
      noise(v, { dur: 1.6, vol: 0.5, color: 'brown', attack: 0.005, filter: { type: 'lowpass', freq: 2000, to: 90 } });
      noise(v, { dur: 0.3, vol: 0.3, filter: { type: 'lowpass', freq: 5000, to: 500 } });
      tone(v, { wave: 'sine', freq: 70, to: 25, dur: 1, vol: 0.55 });
      for (let t = 0.3; t < 1.2; t += rnd(0.05, 0.15)) noise(v, { dur: 0.02, vol: 0.08, delay: t, filter: { type: 'highpass', freq: 2500 } });
      return v.t + 1.6;
    },
  },
  explosion_baba: {
    desc: 'Babosa que revienta (splash asqueroso)',
    fx: { shake: 2 },
    play: (v) => {
      noise(v, { dur: 0.8, vol: 0.35, color: 'brown', filter: { type: 'lowpass', freq: 1500, to: 100 } });
      tone(v, { wave: 'sine', freq: 300, path: [[0.08, 90], [0.2, 200], [0.4, 60]], dur: 0.45, vol: 0.4 });
      for (let i = 0; i < 6; i++) bubble(at(v, 0.3 + rnd(0, 0.6)), 0.08);
      return v.t + 1;
    },
  },
  baba: {
    desc: 'Chapoteo viscoso (splorch)',
    play: (v) => {
      tone(v, { wave: 'sine', freq: 420, path: [[0.08, 120], [0.2, 280], [0.32, 90]], dur: 0.35, vol: 0.35 });
      tone(v, { wave: 'square', freq: 210, path: [[0.08, 60], [0.2, 140]], dur: 0.25, vol: 0.06, filter: { type: 'lowpass', freq: 600 } });
      return noise(v, { dur: 0.3, vol: 0.12, filter: { type: 'bandpass', freq: 700, q: 2 } });
    },
  },
  burbujas: {
    desc: 'Burbujeo',
    play: (v) => {
      for (let i = 0; i < 9; i++) bubble(at(v, rnd(0, 0.8)));
      return v.t + 0.9;
    },
  },
  chapoteo: {
    desc: 'Algo cae al agua',
    play: (v) => {
      noise(v, { dur: 0.45, vol: 0.3, filter: { type: 'lowpass', freq: 3000, to: 300 } });
      for (let i = 0; i < 5; i++) bubble(at(v, 0.15 + rnd(0, 0.4)), 0.1);
      return v.t + 0.6;
    },
  },
  cristal: {
    desc: 'Vidrio o cristal que se rompe',
    play: (v) => {
      noise(v, { dur: 0.25, vol: 0.3, filter: { type: 'highpass', freq: 3000 } });
      for (let i = 0; i < 14; i++) tone(v, { wave: 'sine', freq: rnd(2500, 7500), dur: rnd(0.08, 0.3), vol: 0.05, delay: rnd(0, 0.5) });
      return v.t + 0.8;
    },
  },
  pasos: {
    desc: 'Pasos',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 4; i++) end = noise(v, { dur: 0.06, vol: 0.2, delay: i * 0.33, filter: { type: 'lowpass', freq: i % 2 ? 450 : 600 } });
      return end;
    },
  },
  trampa: {
    desc: 'Trampa que salta (clac)',
    play: (v) => {
      noise(v, { dur: 0.03, vol: 0.4, filter: { type: 'highpass', freq: 2000 } });
      metal(v, 1100, 0.3, 0.1);
      return thud(at(v, 0.05), 0.3);
    },
  },
  cadena: {
    desc: 'Cadenas que se arrastran',
    play: (v) => {
      for (let i = 0; i < 9; i++) metal(at(v, i * 0.07 + rnd(0, 0.03)), rnd(1600, 2600), 0.12, 0.05);
      return v.t + 0.8;
    },
  },
  campana: {
    desc: 'Campanada',
    play: (v) => {
      for (const [r, g] of [[1, 0.18], [2.76, 0.08], [5.4, 0.05], [8.93, 0.03]]) tone(v, { wave: 'sine', freq: 523 * r, dur: 2.2 / Math.sqrt(r), vol: g });
      return v.t + 2.2;
    },
  },
  gong: {
    desc: 'Gong solemne',
    play: (v) => {
      for (const [r, g] of [[1, 0.25], [1.5, 0.1], [2.1, 0.08], [2.7, 0.06], [3.3, 0.04]]) {
        tone(v, { wave: 'sine', freq: 110 * r, dur: 3, vol: g, attack: 0.02, vibrato: { rate: 3, depth: r * 1.5 } });
      }
      noise(v, { dur: 0.15, vol: 0.15, filter: { type: 'lowpass', freq: 800 } });
      return v.t + 3;
    },
  },
  magia: {
    desc: 'Hechizo brillante',
    play: (v) => {
      for (let i = 0; i < 10; i++) {
        tone(v, { wave: 'sine', freq: 880 * Math.pow(2, i / 5), dur: 0.25, vol: 0.08, delay: i * 0.05 });
        tone(v, { wave: 'sine', freq: 880 * Math.pow(2, i / 5), dur: 0.25, vol: 0.03, delay: i * 0.05 + 0.15 });
      }
      return v.t + 0.9;
    },
  },
  magia_oscura: {
    desc: 'Magia oscura, ominosa',
    play: (v) => {
      for (const d of [-14, 0, 11]) {
        tone(v, { wave: 'sawtooth', freq: 65, detune: d, dur: 1.6, vol: 0.12, attack: 0.3, env: 'hold', release: 0.5, filter: { type: 'lowpass', freq: 200, to: 1400, q: 6 } });
      }
      return v.t + 1.6;
    },
  },
  teletransporte: {
    desc: 'Desaparecer o aparecer de golpe',
    fx: { flash: 'level' },
    play: (v) => tone(v, { wave: 'square', freq: 300, to: 3000, dur: 0.5, vol: 0.09, vibrato: { rate: 40, depth: 200 } }),
  },
  fuego: {
    desc: 'Llamarada',
    play: (v) => {
      noise(v, { dur: 1, vol: 0.3, color: 'brown', attack: 0.15, filter: { type: 'lowpass', freq: 300, to: 2500 } });
      for (let t = 0.1; t < 0.9; t += rnd(0.04, 0.1)) noise(v, { dur: 0.015, vol: 0.12, delay: t, filter: { type: 'highpass', freq: 3000 } });
      return v.t + 1;
    },
  },
  trueno: {
    desc: 'Trueno',
    fx: { flash: 'level', shake: 1 },
    play: (v) => {
      noise(v, { dur: 0.08, vol: 0.4, filter: { type: 'highpass', freq: 1500 } });
      return noise(v, { dur: 2.6, vol: 0.45, color: 'brown', attack: 0.05, filter: { type: 'lowpass', freq: 500, to: 80 }, tremolo: { rate: 7, depth: 0.5 } });
    },
  },
  temblor: {
    desc: 'La tierra tiembla',
    fx: { shake: 2 },
    play: (v) => noise(v, { dur: 2, vol: 0.5, color: 'brown', attack: 0.4, env: 'hold', release: 0.6, filter: { type: 'lowpass', freq: 150 }, tremolo: { rate: 11, depth: 0.6 } }),
  },
  derrumbe: {
    desc: 'Derrumbe de rocas',
    fx: { shake: 3 },
    play: (v) => {
      noise(v, { dur: 2, vol: 0.4, color: 'brown', attack: 0.1, filter: { type: 'lowpass', freq: 250 }, tremolo: { rate: 9, depth: 0.5 } });
      for (let t = 0; t < 1.8; t += rnd(0.08, 0.2)) thud(at(v, t), rnd(0.15, 0.35), rnd(70, 140));
      return v.t + 2;
    },
  },
  caida: {
    desc: 'Caída cómica (silbido y golpe)',
    fx: { shake: 1 },
    play: (v) => {
      tone(v, { wave: 'sine', freq: 1600, to: 300, dur: 0.9, vol: 0.12, env: 'hold' });
      return thud(at(v, 0.95), 0.6, 100);
    },
  },
  latigo: {
    desc: 'Latigazo',
    play: (v) => {
      whoosh(v, 0.12, 1000, 7000, 0.15);
      return noise(at(v, 0.12), { dur: 0.04, vol: 0.4, filter: { type: 'highpass', freq: 2500 } });
    },
  },
  bofetada: {
    desc: 'Cachetada',
    play: (v) => {
      noise(v, { dur: 0.07, vol: 0.45, filter: { type: 'highpass', freq: 1200 } });
      return tone(v, { wave: 'sine', freq: 500, to: 200, dur: 0.06, vol: 0.2 });
    },
  },
  huevo: {
    desc: 'Cáscara que se quiebra',
    play: (v) => {
      for (let i = 0; i < 4; i++) noise(v, { dur: 0.02, vol: 0.2, delay: i * 0.06 + rnd(0, 0.02), filter: { type: 'bandpass', freq: rnd(2000, 4000), q: 3 } });
      return baba(at(v, 0.3));
    },
  },
  libro: { desc: 'Pasar página', play: (v) => noise(v, { dur: 0.22, vol: 0.12, attack: 0.08, filter: { type: 'bandpass', freq: 2500, to: 4500, q: 1 } }) },
  cuerno: {
    desc: 'Cuerno de guerra',
    play: (v) => {
      const filter = { type: 'lowpass' as BiquadFilterType, freq: 900, q: 2 };
      tone(v, { wave: 'sawtooth', freq: 'D3', dur: 0.7, vol: 0.2, attack: 0.08, env: 'hold', filter });
      return tone(v, { wave: 'sawtooth', freq: 'A3', dur: 1.2, vol: 0.2, attack: 0.05, env: 'hold', release: 0.4, filter, delay: 0.75, vibrato: { rate: 5, depth: 3 } });
    },
  },
  trompeta: {
    desc: 'Fanfarria de trompeta (ta-ta-ta-táaa)',
    jingle: true,
    play: (v) => {
      seq(v, [['C5', 1], ['C5', 1], ['C5', 1], ['G5', 5]], { bpm: 480, wave: 'pulse25', vol: 0.16 });
      return seq(v, [['E4', 1], ['E4', 1], ['E4', 1], ['B4', 5]], { bpm: 480, wave: 'square', vol: 0.06 });
    },
  },
  tambor: {
    desc: 'Redoble de tambor con platillo',
    play: (v) => {
      let t = 0;
      for (; t < 1.3; t += 0.045) noise(v, { dur: 0.04, vol: 0.05 + t * 0.12, delay: t, filter: { type: 'bandpass', freq: 2200, q: 0.8 } });
      snare(at(v, t), 0.3);
      return crash(at(v, t), 0.25, 1.2);
    },
  },
  badum_tss: {
    desc: 'Remate de chiste (ba-dum tss)',
    play: (v) => {
      snare(v, 0.22);
      tone(v, { wave: 'sine', freq: 180, to: 120, dur: 0.15, vol: 0.3 });
      snare(at(v, 0.18), 0.22);
      tone(v, { wave: 'sine', freq: 130, to: 80, dur: 0.2, vol: 0.35, delay: 0.18 });
      return crash(at(v, 0.42), 0.2, 1);
    },
  },
  grillo: {
    desc: 'Grillos (silencio incómodo)',
    play: (v) => {
      for (const c of [0, 0.5, 1.0, 1.5]) {
        for (let p = 0; p < 4; p++) tone(v, { wave: 'sine', freq: 4600, dur: 0.018, vol: 0.06, delay: c + p * 0.035 });
      }
      return v.t + 1.7;
    },
  },

  // ─── Cuerpo y voces sintéticas ───
  risa: {
    desc: 'Risa burlona (ja ja ja)',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 5; i++) end = syllable(at(v, i * 0.14), 330 - i * 15, 270 - i * 15, 0.1, 1000);
      return end;
    },
  },
  risa_malvada: {
    desc: 'Risa malvada grave (muajaja)',
    play: (v) => {
      syllable(v, 110, 90, 0.45, 600, 0.2);
      let end = v.t;
      for (let i = 0; i < 5; i++) end = syllable(at(v, 0.55 + i * 0.16), 140 - i * 6, 115 - i * 6, 0.12, 700, 0.2);
      return end;
    },
  },
  grito: {
    desc: 'Grito de pánico',
    play: (v) => tone(v, {
      wave: 'sawtooth', freq: 500, path: [[0.15, 950], [0.6, 820], [0.9, 500]], dur: 0.9, vol: 0.16, env: 'hold', release: 0.3,
      vibrato: { rate: 8, depth: 30 }, filter: { type: 'bandpass', freq: 1200, q: 2 },
    }),
  },
  abucheo: {
    desc: 'Abucheo del público',
    play: (v) => {
      for (let i = 0; i < 6; i++) syllable(at(v, rnd(0, 0.3)), rnd(110, 180), rnd(90, 150), 1.3, 500, 0.06);
      return v.t + 1.6;
    },
  },
  aplauso: {
    desc: 'Aplausos',
    play: (v) => {
      for (let t = 0; t < 1.6; t += rnd(0.01, 0.03)) {
        noise(v, { dur: 0.02, vol: 0.12 * (t < 1.2 ? 1 : (1.6 - t) / 0.4), delay: t, filter: { type: 'bandpass', freq: rnd(1200, 3000), q: 2 } });
      }
      return v.t + 1.6;
    },
  },
  rugido: {
    desc: 'Rugido de bestia',
    fx: { shake: 1 },
    play: (v) => {
      tone(v, { wave: 'sawtooth', freq: 80, path: [[0.3, 95], [1.2, 50]], dur: 1.3, vol: 0.25, attack: 0.1, env: 'hold', release: 0.4, vibrato: { rate: 17, depth: 12 }, filter: { type: 'lowpass', freq: 600 } });
      return noise(v, { dur: 1.3, vol: 0.15, color: 'brown', attack: 0.1, filter: { type: 'lowpass', freq: 900 }, tremolo: { rate: 17, depth: 0.5 } });
    },
  },
  hipo: {
    desc: 'Hipo de borracho (¡hic!)',
    play: (v) => {
      noise(v, { dur: 0.03, vol: 0.12, filter: { type: 'bandpass', freq: 1500, q: 2 } });
      return tone(v, { wave: 'square', freq: 380, to: 900, dur: 0.07, vol: 0.12, filter: { type: 'lowpass', freq: 2200 } });
    },
  },
  llanto: {
    desc: 'Sollozos (snif, snif)',
    play: (v) => {
      let end = v.t;
      for (const d of [0, 0.45]) {
        noise(at(v, d), { dur: 0.18, vol: 0.12, attack: 0.08, filter: { type: 'bandpass', freq: 2500, q: 3 } });
        end = syllable(at(v, d + 0.2), 520, 380, 0.2, 1300, 0.08);
      }
      for (let i = 0; i < 3; i++) end = syllable(at(v, 0.95 + i * 0.16), 560 - i * 30, 460 - i * 30, 0.12, 1200, 0.1);
      return end;
    },
  },
  tos: {
    desc: 'Tos (cof, cof)',
    play: (v) => {
      let end = v.t;
      for (const d of [0, 0.28]) {
        end = noise(at(v, d), { dur: 0.16, vol: 0.3, attack: 0.005, color: 'brown', filter: { type: 'bandpass', freq: 700, q: 1.2 } });
        tone(at(v, d), { wave: 'sawtooth', freq: 160, to: 110, dur: 0.12, vol: 0.06, filter: { type: 'lowpass', freq: 800 } });
      }
      return end;
    },
  },
  canto_horrible: {
    desc: 'Alguien cantando fatal (desafinado a propósito)',
    play: (v) => {
      // Una melodía conocida... cada nota un poco fuera de tono y con un gallo al final
      const notes: [number, number][] = [[262, 0.3], [277, 0.3], [311, 0.3], [262, 0.3], [349, 0.5], [340, 0.6]];
      let t = 0;
      for (const [f, d] of notes) {
        syllable(at(v, t), f * rnd(0.97, 1.04), f * rnd(0.95, 1.05), d, 900, 0.16);
        t += d + 0.02;
      }
      return tone(at(v, t), { wave: 'square', freq: 700, to: 1400, dur: 0.35, vol: 0.1, vibrato: { rate: 14, depth: 60 } });
    },
  },
  eructo: {
    desc: 'Eructo',
    play: (v) => tone(v, {
      wave: 'sawtooth', freq: 95, path: [[0.2, 85], [0.6, 70]], dur: 0.7, vol: 0.3, attack: 0.02, env: 'hold', release: 0.15,
      vibrato: { rate: 31, depth: 18 }, filter: { type: 'lowpass', freq: 700, q: 3 },
    }),
  },
  pedo: {
    desc: 'Pedo (sí, hay uno)',
    play: (v) => tone(v, {
      wave: 'sawtooth', freq: 110, path: [[0.3, 85], [0.6, 60]], dur: 0.65, vol: 0.3, env: 'hold', release: 0.1,
      vibrato: { rate: 42, depth: 28 }, filter: { type: 'lowpass', freq: 450, q: 4 },
    }),
  },
  vomito: {
    desc: 'Vómito',
    play: (v) => {
      syllable(v, 260, 110, 0.6, 500, 0.2);
      return noise(at(v, 0.4), { dur: 0.8, vol: 0.3, color: 'brown', filter: { type: 'lowpass', freq: 1200, to: 300 }, tremolo: { rate: 13, depth: 0.6 } });
    },
  },
  beber: {
    desc: 'Tragos (glu glu)',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 4; i++) end = tone(v, { wave: 'sine', freq: 180, to: 380, dur: 0.1, vol: 0.3, delay: i * 0.2, filter: { type: 'lowpass', freq: 800 } });
      return end;
    },
  },
  comer: {
    desc: 'Mordisco crujiente',
    play: (v) => {
      let end = v.t;
      for (let i = 0; i < 3; i++) end = noise(v, { dur: 0.08, vol: 0.25, delay: i * 0.22, filter: { type: 'bandpass', freq: rnd(1500, 3000), q: 1.5 }, tremolo: { rate: 90, depth: 0.8 } });
      return end;
    },
  },
  beso: {
    desc: 'Beso (mua)',
    play: (v) => {
      tone(v, { wave: 'square', freq: 250, to: 420, dur: 0.14, vol: 0.06, filter: { type: 'lowpass', freq: 900 } });
      noise(at(v, 0.14), { dur: 0.03, vol: 0.3, filter: { type: 'bandpass', freq: 2000, q: 3 } });
      return tone(at(v, 0.14), { wave: 'sine', freq: 1800, to: 700, dur: 0.05, vol: 0.2 });
    },
  },
  ronquido: {
    desc: 'Ronquido',
    play: (v) => {
      noise(v, { dur: 1.2, vol: 0.15, color: 'brown', attack: 0.6, filter: { type: 'lowpass', freq: 500 }, tremolo: { rate: 26, depth: 0.7 } });
      return noise(at(v, 1.4), { dur: 0.8, vol: 0.06, attack: 0.3, filter: { type: 'bandpass', freq: 1500, q: 1 } });
    },
  },
  gallo: {
    desc: 'Canto de gallo',
    play: (v) => {
      const f = { type: 'bandpass' as BiquadFilterType, freq: 1400, q: 1.5 };
      syllable(v, 600, 700, 0.15, 1400);
      syllable(at(v, 0.18), 750, 700, 0.15, 1400);
      return tone(at(v, 0.38), { wave: 'sawtooth', freq: 800, path: [[0.2, 1000], [0.6, 950], [0.9, 600]], dur: 0.9, vol: 0.18, env: 'hold', vibrato: { rate: 9, depth: 25 }, filter: f });
    },
  },
};

/** Sonido de "baba" reutilizable desde otras recetas */
function baba(v: Voice): number {
  return SFX.baba.play(v);
}

export type SfxName = keyof typeof SFX;

/** Voz corta para cada línea de diálogo: blips con timbre y altura según el personaje */
export function voiceBlips(v: Voice, character: string, text: string): number {
  let h = 0;
  for (const ch of character) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const narrator = character === 'narrator' || character === 'narrador';
  const base = narrator ? 150 : 220 + (h % 9) * 45;
  const waves = ['pulse12', 'pulse25', 'square', 'triangle'] as const;
  const wave = narrator ? 'triangle' : waves[h % waves.length];
  const scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3];
  const plain = text.replace(/\[[^\]]*\]/g, '');
  const count = Math.max(2, Math.min(7, Math.ceil(plain.length / 14)));
  let end = v.t;
  for (let i = 0; i < count; i++) {
    const f = base * scale[Math.floor(Math.random() * scale.length)];
    end = tone(v, { wave, freq: f, dur: 0.045, vol: narrator ? 0.07 : 0.045, delay: i * 0.065, env: 'hold', release: 0.015 });
  }
  return end;
}
