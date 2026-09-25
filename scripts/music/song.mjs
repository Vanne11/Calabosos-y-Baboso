// scripts/music/song.mjs
// Constructor de canciones: se escribe la progresión de acordes y la melodía;
// bajo, acompañamiento y batería se generan con estilos predefinidos.
//
// Melodías: tokens separados por espacios. "E5:4" = nota de 4 pasos, ".:2" = silencio de 2,
// "G5:8~-5" = nota con glissando de -5 semitonos. "|" separa compases (se ignora).
// Acordes: uno por compás ("Am") o varios que se reparten el compás ("Em A").

import { midi, chord } from './tracker.mjs';

function parseMelody(text) {
  const out = [];
  for (const tok of text.trim().split(/\s+/)) {
    if (tok === '|' || tok === '') continue;
    const m = /^([A-G][#b]?-?\d|\.)(?::(\d+))?(?:~(-?\d+))?$/.exec(tok);
    if (!m) throw new Error(`Token de melodía inválido: "${tok}"`);
    out.push({ note: m[1] === '.' ? null : m[1], len: Number(m[2] ?? 1), slide: m[3] ? Number(m[3]) : 0 });
  }
  return out;
}

// ─── Bajos: (song, start, len, chord, beat) → eventos ───
const BASS = {
  none: () => {},
  long: (s, at, len, c) => s.note('bass', at, len, c.root - 12),
  root4: (s, at, len, c, beat) => {
    for (let t = 0; t < len; t += beat) s.note('bass', at + t, beat, c.root - 12, { legato: 0.8 });
  },
  rootfifth: (s, at, len, c, beat) => {
    for (let t = 0, i = 0; t < len; t += beat, i++) s.note('bass', at + t, beat, c.root - 12 + (i % 2 ? 7 : 0), { legato: 0.8 });
  },
  oompah: (s, at, len, c, beat) => {
    for (let t = 0, i = 0; t < len; t += beat * 2, i++) s.note('bass', at + t, beat, c.root - 12 + (i % 2 ? 7 : 0), { legato: 0.7 });
  },
  half: (s, at, len, c, beat) => {
    for (let t = 0, i = 0; t < len; t += beat * 2, i++) s.note('bass', at + t, Math.min(beat * 2, len - t), c.root - 12 + (i % 2 ? 7 : 0));
  },
  eighths: (s, at, len, c, beat) => {
    const step = beat / 2;
    for (let t = 0; t < len; t += step) s.note('bass', at + t, step, c.root - 12, { legato: 0.7 });
  },
  octave: (s, at, len, c, beat) => {
    const step = beat / 2;
    for (let t = 0, i = 0; t < len; t += step, i++) s.note('bass', at + t, step, c.root - 12 + (i % 2 ? 12 : 0), { legato: 0.7 });
  },
  staccato: (s, at, len, c, beat) => {
    const seq = [0, 7, 12, 7];
    for (let t = 0, i = 0; t < len; t += beat, i++) s.note('bass', at + t, beat, c.root - 12 + seq[i % 4], { legato: 0.35 });
  },
  boombap: (s, at, len, c) => {
    // Sincopado: 1, "a" del 2, "y" del 3 (en 16 pasos)
    for (const [p, l] of [[0, 3], [7, 2], [10, 4]]) if (p < len) s.note('bass', at + p, Math.min(l, len - p), c.root - 12, { legato: 0.85 });
  },
  waltz: (s, at, len, c, beat) => s.note('bass', at, beat, c.root - 12, { legato: 0.9 }),
};

// ─── Acompañamientos ───
const tonesOf = (c, octave) => c.tones.slice(0, 3).map((t) => c.root + 12 * octave + t);
const HARM = {
  none: () => {},
  arp16: (s, at, len, c, beat, ch = 'harm') => {
    const n = tonesOf(c, 1);
    const order = [0, 1, 2, 1];
    const step = beat / 4;
    for (let t = 0, i = 0; t < len; t += step, i++) s.note(ch, at + t, step, n[order[i % 4]] + (i % 8 >= 4 ? 12 : 0));
  },
  arp8: (s, at, len, c, beat, ch = 'pluck') => {
    const n = tonesOf(c, 1);
    const step = beat / 2;
    for (let t = 0, i = 0; t < len; t += step, i++) s.note(ch, at + t, step, n[i % 3] + 12 * Math.floor((i % 6) / 3));
  },
  broken: (s, at, len, c, beat, ch = 'pluck') => {
    const [r, th, f] = tonesOf(c, 1);
    const order = [r, f, th, f];
    const step = beat / 2;
    for (let t = 0, i = 0; t < len; t += step, i++) s.note(ch, at + t, step, order[i % 4], { vol: 0.8 });
  },
  offbeat: (s, at, len, c, beat, ch = 'harm') => {
    // "pa" de la polca: acorde (arpegio de tracker) en los contratiempos
    for (let t = beat; t < len; t += beat * 2) s.note(ch, at + t, beat / 2, c.root + 12, { arp: c.tones, legato: 0.8 });
  },
  hold: (s, at, len, c, beat, ch = 'pad') => s.note(ch, at, len, c.root + 12, { arp: c.tones }),
  waltzchord: (s, at, len, c, beat, ch = 'pluck') => {
    for (const t of [beat, beat * 2]) if (t < len) s.note(ch, at + t, beat, c.root + 12, { arp: c.tones, legato: 0.6 });
  },
  musicbox: (s, at, len, c, beat, ch = 'bell') => {
    const n = tonesOf(c, 2);
    const step = beat / 2;
    for (let t = 0, i = 0; t < len; t += step, i++) s.note(ch, at + t, step, n[i % 3], { vol: 0.35 });
  },
};

// ─── Baterías (patrones de 16 pasos; los de 12 son para 3/4) ───
const DRUMS = {
  none: {},
  rock: { k: [0, 8], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
  polka: { k: [0, 8], s: [4, 12], h: [] },
  march: { k: [0, 8], s: [4, 12, 14, 15], h: [2, 6, 10] },
  boombap: { k: [0, 7, 10], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12], o: [14] },
  fast: { k: [0, 4, 8, 12], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
  soft: { k: [0], h: [0, 4, 8, 12], p: [8] },
  sneak: { k: [0], h: [2, 6, 10, 14] },
  epic: { k: [0, 3, 6, 8, 11, 14], s: [4, 12], h: [2, 6, 10, 14] },
  doom: { k: [0], t: [8, 10] },
};
const DRUM_VOL = { k: 1, s: 0.8, h: 0.5, o: 0.6, p: 0.7, t: 0.8, c: 1 };

export class Song {
  constructor({ name, bpm, stepsPerBeat = 4, beatsPerBar = 4 }) {
    Object.assign(this, { name, bpm, stepsPerBeat, beatsPerBar });
    this.barSteps = stepsPerBeat * beatsPerBar;
    this.events = [];
    this.drums = [];
    this.steps = 0;
  }

  note(ch, start, len, midiNote, opts = {}) {
    this.events.push({ ch, start, len, midi: midiNote, ...opts });
  }

  /**
   * Agrega una sección.
   * o.chords: acordes por compás; o.lead / o.lead2 / o.counter: melodías (texto);
   * o.bass / o.harm / o.drums: estilos; o.harmCh: canal del acompañamiento; o.crash: platillo al inicio
   */
  section(o) {
    const start = this.steps;
    const bars = o.chords.length;
    const beat = this.stepsPerBeat;
    o.chords.forEach((bar, b) => {
      const names = bar.split(/\s+/);
      const each = this.barSteps / names.length;
      names.forEach((name, i) => {
        const c = chord(name);
        const at = start + b * this.barSteps + i * each;
        BASS[o.bass ?? 'root4'](this, at, each, c, beat);
        HARM[o.harm ?? 'none'](this, at, each, c, beat, o.harmCh);
        if (o.harm2) HARM[o.harm2](this, at, each, c, beat, o.harm2Ch);
      });
      const pattern = DRUMS[o.drums ?? 'none'];
      const isFill = o.fill && b === bars - 1;
      for (const [kind, positions] of Object.entries(pattern)) {
        for (const p of positions) {
          if (p >= this.barSteps || (isFill && p >= 8)) continue;
          this.drums.push({ start: start + b * this.barSteps + p, kind, vol: (DRUM_VOL[kind] ?? 1) * (o.drumVol ?? 1) });
        }
      }
      if (isFill) {
        for (let p = 8; p < this.barSteps; p++) {
          this.drums.push({ start: start + b * this.barSteps + p, kind: p % 2 ? 's' : 't', vol: 0.4 + (p - 8) * 0.06 });
        }
      }
    });
    if (o.crash) this.drums.push({ start, kind: 'c', vol: 1 });

    for (const [key, ch] of [['lead', o.leadCh ?? 'lead'], ['lead2', 'lead2'], ['counter', 'harm']]) {
      if (!o[key]) continue;
      const notes = parseMelody(o[key]);
      const total = notes.reduce((n, x) => n + x.len, 0);
      if (total !== bars * this.barSteps) {
        throw new Error(`${this.name}: la melodía "${key}" dura ${total} pasos y la sección ${bars * this.barSteps}`);
      }
      let at = start;
      for (const n of notes) {
        if (n.note) {
          this.note(ch, at, n.len, midi(n.note) + (o.transpose ?? 0), {
            slide: n.slide || undefined,
            legato: o.legato,
            vol: o.leadVol,
          });
        }
        at += n.len;
      }
    }
    this.steps += bars * this.barSteps;
    return this;
  }

  get seconds() {
    return (this.steps / this.stepsPerBeat) * (60 / this.bpm);
  }
}
