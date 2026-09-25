#!/usr/bin/env node
// scripts/compose-music.mjs
// Renderiza las pistas chiptune compuestas en scripts/music/songs.mjs a .ogg (necesita ffmpeg).
//
// Uso:
//   npm run music                 → todas
//   npm run music -- taberna jefe → algunas
//   npm run music -- --wav        → deja también el .wav (para revisar)

import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { render, toWav, SAMPLE_RATE } from './music/tracker.mjs';
import { SONGS } from './music/songs.mjs';

const OUT_DIR = resolve(import.meta.dirname, '..', 'public', 'games', 'calabosos', 'audio');
const args = process.argv.slice(2);
const keepWav = args.includes('--wav');
const names = args.filter((a) => !a.startsWith('--'));
const targets = names.length ? names : Object.keys(SONGS);

const tmp = mkdtempSync(join(tmpdir(), 'cyb-music-'));
try {
  for (const name of targets) {
    const make = SONGS[name];
    if (!make) {
      console.error(`✘ No existe la canción "${name}". Disponibles: ${Object.keys(SONGS).join(', ')}`);
      process.exitCode = 1;
      continue;
    }
    const song = make();
    const pcm = render(song);
    let peak = 0;
    let sum = 0;
    for (const v of pcm) {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    const rms = Math.sqrt(sum / pcm.length);
    const wav = join(keepWav ? OUT_DIR : tmp, `cyb_${name}.wav`);
    writeFileSync(wav, toWav(pcm));
    const ogg = join(OUT_DIR, `cyb_${name}.ogg`);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', wav, '-c:a', 'libvorbis', '-q:a', '3', '-ar', String(SAMPLE_RATE), ogg]);
    console.log(`✔ cyb_${name}.ogg  ${song.seconds.toFixed(1)} s  pico ${peak.toFixed(2)}  rms ${rms.toFixed(3)}`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
