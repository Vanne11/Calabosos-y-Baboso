// scripts/music/songs.mjs
// Las pistas compuestas para Calabosos y Babosos. Se renderizan con `npm run music`.

import { Song } from './song.mjs';

// ─── Taberna «La Babosa Ebria»: polca borracha (con hipo) ───
function taberna() {
  const s = new Song({ name: 'taberna', bpm: 132 });
  const A = {
    chords: ['G', 'G', 'D7', 'G', 'G', 'C', 'D7', 'G'],
    lead: `D5:2 B4:2 G4:2 B4:2 D5:2 G5:2 D5:2 B4:2 | C5:2 B4:2 A4:2 G4:2 A4:4 .:4 |
           A4:2 F#4:2 D4:2 F#4:2 A4:2 C5:2 A4:2 F#4:2 | G4:2 B4:2 D5:2 B4:2 G4:4 .:4 |
           D5:2 E5:2 D5:2 B4:2 G5:4 D5:4 | E5:2 G5:2 E5:2 C5:2 G4:4 E4:4 |
           F#4:2 A4:2 C5:2 E5:2 D5:2 C5:2 A4:2 F#4:2 | G4:4 D4:2 G4:2 G4:4 .:4`,
    bass: 'oompah', harm: 'offbeat', drums: 'polka',
  };
  const B = {
    chords: ['C', 'C', 'G', 'G', 'D7', 'D7', 'G', 'G'],
    lead: `E5:2 E5:2 E5:2 D5:2 C5:4 E5:4 | G5:6 F5:2 E5:4 .:4 |
           D5:2 D5:2 D5:2 C5:2 B4:4 D5:4 | G5:8~-5 .:8 |
           F#5:2 E5:2 D5:2 C5:2 A4:4 C5:4 | D5:2 C5:2 A4:2 F#4:2 D4:4 .:4 |
           B4:2 D5:2 G5:2 D5:2 B4:2 D5:2 G5:4 | G4:4 .:2 D4:2 G4:4 .:4`,
    bass: 'oompah', harm: 'offbeat', drums: 'polka', fill: true,
  };
  return s.section(A).section({ ...A, counter: A.lead.replace(/([A-G][#b]?)(\d)/g, (_, n, o) => `${n}${Number(o) - 1}`) }).section(B).section(A);
}

// ─── Duelo de rap: base boom-bap ───
function rap() {
  const s = new Song({ name: 'rap', bpm: 90 });
  const chords = ['Am', 'Am', 'F', 'G'];
  const hook = `A4:2 .:2 C5:2 .:2 E5:3 D5:1 C5:2 A4:2 | .:16 |
                F4:2 .:2 A4:2 .:2 C5:3 A4:1 G4:2 F4:2 | .:8 G4:2 A4:2 B4:2 D5:2`;
  const base = { chords, bass: 'boombap', harm: 'hold', drums: 'boombap' };
  return s
    .section({ ...base })
    .section({ ...base, lead: hook, leadCh: 'pluck', leadVol: 1.6 })
    .section({ ...base, fill: true })
    .section({ ...base, lead: hook, leadCh: 'pluck', leadVol: 1.6 });
}

// ─── El Camino: marcha de viaje ───
function camino() {
  const s = new Song({ name: 'camino', bpm: 116 });
  const A = {
    chords: ['D', 'G', 'D', 'A', 'D', 'G', 'A', 'D'],
    lead: `A4:4 D5:2 E5:2 F#5:4 E5:2 D5:2 | B4:4 D5:2 G5:2 G5:4 F#5:2 E5:2 |
           F#5:4 A5:2 F#5:2 D5:4 E5:2 F#5:2 | E5:8 C#5:4 A4:4 |
           A4:4 D5:2 E5:2 F#5:4 A5:4 | B5:4 A5:2 G5:2 F#5:4 E5:4 |
           E5:4 F#5:2 G5:2 A5:4 C#5:4 | D5:8 .:4 A4:4`,
    bass: 'rootfifth', harm: 'arp8', drums: 'march',
  };
  const B = {
    chords: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em A', 'D'],
    lead: `F#5:4 D5:2 B4:2 F#4:4 B4:4 | G4:4 B4:2 D5:2 G5:8 |
           F#5:4 E5:2 D5:2 A4:4 D5:4 | C#5:4 E5:2 A5:2 E5:8 |
           B5:4 A5:2 F#5:2 D5:4 B4:4 | D5:4 G5:2 B5:2 A5:4 G5:4 |
           G5:4 F#5:2 E5:2 E5:4 C#5:4 | D5:12 .:4`,
    bass: 'rootfifth', harm: 'arp8', drums: 'march', fill: true,
  };
  return s.section(A).section(A).section(B).section(A);
}

// ─── Charlas por el camino: tranquila ───
function charla() {
  const s = new Song({ name: 'charla', bpm: 92 });
  const A = {
    chords: ['F', 'Am', 'Bb', 'C', 'F', 'Dm', 'Gm C', 'F'],
    lead: `C5:6 A4:2 F4:4 A4:4 | E5:6 C5:2 A4:8 | D5:4 F5:4 D5:4 Bb4:4 | C5:8 G4:4 .:4 |
           A4:4 C5:4 F5:6 E5:2 | D5:6 F5:2 A5:8 | G5:4 F5:2 D5:2 E5:4 C5:4 | F5:12 .:4`,
    bass: 'half', harm: 'broken', drums: 'soft', drumVol: 0.6, leadCh: 'lead2', leadVol: 0.8,
  };
  const B = {
    chords: ['Bb', 'C', 'Am', 'Dm', 'Gm', 'C7', 'F', 'F'],
    lead: `F5:4 D5:4 Bb4:4 D5:4 | E5:4 G5:4 E5:4 C5:4 | C5:6 E5:2 A5:8 | A5:4 F5:4 D5:8 |
           Bb4:4 D5:4 G5:4 F5:4 | E5:4 G5:4 Bb5:4 G5:4 | A5:6 G5:2 F5:4 C5:4 | F5:8 .:8`,
    bass: 'half', harm: 'broken', drums: 'soft', drumVol: 0.6, leadCh: 'lead2', leadVol: 0.8,
  };
  return s.section(A).section(B).section(A).section(B);
}

// ─── Takashi: opening de anime equivocado de juego ───
function takashi() {
  const s = new Song({ name: 'takashi', bpm: 168 });
  const verse = {
    chords: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'A', 'E'],
    lead: `C#5:2 C#5:2 E5:2 F#5:2 .:2 F#5:2 E5:2 C#5:2 | D5:4 F#5:4 A5:4 F#5:4 |
           E5:2 E5:2 C#5:2 E5:2 .:2 A5:2 G#5:2 E5:2 | G#5:8 E5:4 B4:4 |
           C#5:2 C#5:2 E5:2 F#5:2 .:2 A5:2 G#5:2 F#5:2 | F#5:4 A5:4 D6:4 C#6:2 B5:2 |
           C#6:4 A5:4 E5:4 A5:4 | B5:8 G#5:4 E5:4`,
    bass: 'octave', harm: 'arp16', drums: 'rock', crash: true,
  };
  const chorus = {
    chords: ['D', 'E', 'C#m', 'F#m', 'D', 'E', 'A', 'A'],
    lead: `F#5:2 E5:2 F#5:2 A5:4 F#5:2 E5:2 D5:2 | E5:4 G#5:2 B5:2 B5:4 A5:2 G#5:2 |
           G#5:4 E5:2 C#5:2 E5:4 G#5:2 A5:2 | A5:6 G#5:2 F#5:8 |
           F#5:2 E5:2 F#5:2 A5:4 B5:2 A5:2 F#5:2 | G#5:4 B5:4 E6:6 D6:2 |
           C#6:4 B5:2 A5:2 E5:4 C#6:4 | A5:12 .:4`,
    bass: 'octave', harm: 'arp16', drums: 'fast', crash: true,
  };
  return s.section(verse).section({ ...chorus, fill: true }).section({ ...chorus, lead2: chorus.lead.replace(/([A-G][#b]?)(\d)/g, (_, n, o) => `${n}${Number(o) - 1}`), fill: true });
}

// ─── Babosita perdida: caja de música (3/4) ───
function babosita() {
  const s = new Song({ name: 'babosita', bpm: 96, beatsPerBar: 3 });
  const A = {
    chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm G', 'C'],
    lead: `E5:4 G5:4 C6:4 | B5:4 A5:4 E5:4 | F5:4 A5:4 C6:4 | B5:8 G5:4 |
           E5:4 G5:4 C6:4 | D6:4 C6:4 A5:4 | F5:2 A5:2 D6:2 B5:6 | C6:8 .:4`,
    bass: 'waltz', harm: 'waltzchord', leadCh: 'bell',
  };
  const B = {
    chords: ['F', 'Fm', 'C', 'Am', 'Dm', 'G7', 'C', 'C'],
    lead: `A5:4 C6:4 F6:4 | Ab5:4 C6:4 F6:4 | G5:4 E5:4 C5:4 | C5:4 E5:4 A5:4 |
           F5:4 A5:4 D6:4 | B5:4 D6:4 F6:4 | E6:6 D6:2 C6:4 | C6:8 .:4`,
    bass: 'waltz', harm: 'waltzchord', leadCh: 'bell',
  };
  return s.section(A).section(B);
}

// ─── Sigilo: de puntillas ───
function sigilo() {
  const s = new Song({ name: 'sigilo', bpm: 112 });
  const A = {
    chords: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'],
    lead: `D5:1 .:1 E5:1 .:1 F5:1 .:3 A4:1 .:1 D5:1 .:5 | .:8 C#5:1 .:1 D5:1 .:1 F5:2 E5:2 |
           D5:1 .:1 F5:1 .:1 Bb5:1 .:3 A5:1 .:1 F5:1 .:5 | .:8 E5:2 C#5:2 A4:4 |
           D5:1 .:1 E5:1 .:1 F5:1 .:3 A5:1 .:1 G5:1 .:1 F5:1 .:3 | E5:1 .:1 D5:1 .:5 .:8 |
           Bb4:2 D5:2 G5:2 F5:2 E5:4 D5:4 | C#5:8 .:4 A4:2 .:2`,
    bass: 'staccato', harm: 'hold', drums: 'sneak', legato: 0.5,
  };
  return s.section(A).section({ ...A, transpose: 12, leadCh: 'pluck', leadVol: 1.3, fill: true });
}

// ─── Nerly: misteriosa, bajo la lluvia ───
function nerly() {
  const s = new Song({ name: 'nerly', bpm: 84 });
  const chords = ['Em', 'Cmaj7', 'Am7', 'B7'];
  return s
    .section({ chords: [...chords, ...chords], bass: 'long', harm: 'arp16', harmCh: 'pluck', harm2: 'hold', drums: 'soft', drumVol: 0.4,
      lead: `.:16 | .:16 | .:16 | .:16 |
             B4:4 E5:4 G5:6 F#5:2 | E5:8 B4:8 | C5:4 E5:4 A5:6 G5:2 | F#5:8 D#5:8`, leadCh: 'lead2', leadVol: 0.75 })
    .section({ chords: [...chords, ...chords], bass: 'long', harm: 'arp16', harmCh: 'pluck', harm2: 'hold', drums: 'soft', drumVol: 0.5,
      lead: `G5:4 F#5:4 E5:4 B4:4 | C5:4 E5:4 G5:4 B5:4 | A5:6 G5:2 E5:8 | D#5:4 F#5:4 A5:4 B5:4 |
             G5:6 F#5:2 E5:8 | E5:4 G5:4 B5:8 | C6:6 B5:2 A5:8 | B5:8 F#5:8`, leadCh: 'lead2', leadVol: 0.75 });
}

// ─── Rey Baboso, fase final: jefe ───
function jefe() {
  const s = new Song({ name: 'jefe', bpm: 160 });
  const A = {
    chords: ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab', 'G'],
    lead: `C5:4 Eb5:4 G5:4 C6:4 | Bb5:2 G5:2 Eb5:2 G5:2 C6:8 | Ab5:4 G5:2 F5:2 Eb5:4 C5:4 | D5:4 F5:4 Bb5:8 |
           C6:2 Bb5:2 G5:2 Eb5:2 C5:4 G5:4 | Eb6:4 D6:2 C6:2 G5:8 | Ab5:4 C6:4 Eb6:4 C6:4 | B5:8 D6:4 B5:4`,
    bass: 'eighths', harm: 'arp16', drums: 'epic', crash: true,
  };
  const B = {
    chords: ['Fm', 'Fm', 'Cm', 'Cm', 'Ab', 'Bb', 'G', 'G7'],
    lead: `F5:4 Ab5:4 C6:6 Bb5:2 | Ab5:4 G5:2 F5:2 C5:8 | Eb5:4 G5:4 C6:6 D6:2 | Eb6:8 D6:4 C6:4 |
           C6:4 Ab5:4 Eb5:4 Ab5:4 | D6:4 Bb5:4 F5:4 Bb5:4 | B5:4 D6:4 G6:8 | F6:4 D6:4 B5:4 G5:4`,
    bass: 'eighths', harm: 'arp16', drums: 'epic', crash: true, fill: true,
  };
  return s.section(A).section(B);
}

// ─── Sala del Trono: órgano ominoso ───
function trono() {
  const s = new Song({ name: 'trono', bpm: 72 });
  const chords = ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'Bb', 'Edim', 'A'];
  return s
    .section({ chords, bass: 'long', harm: 'hold', drums: 'doom' })
    .section({ chords, bass: 'long', harm: 'hold', drums: 'doom', leadCh: 'lead2', leadVol: 0.9,
      lead: `D5:8 F5:4 E5:4 | D5:12 C5:4 | Bb4:8 D5:4 G5:4 | E5:8 C#5:8 |
             F5:8 A5:4 G5:4 | F5:12 D5:4 | G5:8 Bb5:4 G5:4 | A5:8 C#5:4 E5:4` });
}

export const SONGS = { taberna, rap, camino, charla, takashi, babosita, sigilo, nerly, jefe, trono };
