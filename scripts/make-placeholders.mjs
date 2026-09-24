#!/usr/bin/env node
// scripts/make-placeholders.mjs
// Genera imágenes provisorias para toda imagen referenciada por un juego que aún no exista.
// Las registra en images/.placeholders.json (ruta → sha256). Si luego reemplazas una por el
// arte final, la próxima ejecución la saca de la lista automáticamente.
//
// Uso:
//   npm run placeholders -- calabosos

import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import {
  loadGameFromDisk,
  collectAssetRefs,
  readPlaceholders,
  PLACEHOLDERS_FILE,
} from './shared/game-data.mjs';

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);

/** Tamaños según la carpeta (ver IMAGENES.md) */
function sizeFor(path) {
  if (path.includes('/scenarios/')) return { width: 768, height: 432, kind: 'ESCENARIO' };
  if (path.includes('/dialogs/')) return { width: 256, height: 256, kind: 'RETRATO' };
  if (path.includes('/items/')) return { width: 256, height: 256, kind: 'ITEM' };
  return { width: 512, height: 512, kind: 'IMAGEN' };
}

function escapeXml(s) {
  return s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

function placeholderSvg(path, context) {
  const { width, height, kind } = sizeFor(path);
  const name = basename(path, extname(path));
  const small = width < 400;
  const titleSize = small ? 18 : 34;
  const textSize = small ? 11 : 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <pattern id="p" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="8" height="16" fill="#241436"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#1a0f29"/>
  <rect width="100%" height="100%" fill="url(#p)"/>
  <rect x="6" y="6" width="${width - 12}" height="${height - 12}" fill="none" stroke="#bd93f9" stroke-width="3" stroke-dasharray="12 8"/>
  <g font-family="monospace" text-anchor="middle" fill="#f8f8f2">
    <text x="50%" y="${height / 2 - titleSize}" font-size="${textSize}" fill="#50fa7b">${kind} PROVISORIO</text>
    <text x="50%" y="${height / 2 + titleSize / 3}" font-size="${titleSize}" font-weight="bold">${escapeXml(name)}</text>
    <text x="50%" y="${height / 2 + titleSize + textSize}" font-size="${textSize}" fill="#bd93f9">${escapeXml(context)}</text>
  </g>
</svg>`;
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

const gameName = process.argv[2];
if (!gameName) {
  console.error('Uso: npm run placeholders -- <juego>');
  process.exit(1);
}

const { base, manifest, scenes, errors } = loadGameFromDisk(gameName);
if (!manifest) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const registry = readPlaceholders(base);

// 1. Sacar de la lista las que ya fueron reemplazadas por arte final (o borradas)
let replaced = 0;
for (const [rel, hash] of Object.entries(registry)) {
  const abs = join(base, rel);
  if (!existsSync(abs) || sha256(readFileSync(abs)) !== hash) {
    delete registry[rel];
    replaced++;
  }
}

// 2. Generar las que faltan
const seen = new Set();
let created = 0;
const skippedAudio = [];
for (const { path, context } of collectAssetRefs(manifest, scenes)) {
  if (seen.has(path)) continue;
  seen.add(path);
  const abs = join(base, path);
  if (existsSync(abs)) continue;
  const ext = extname(path).toLowerCase();
  if (!IMAGE_EXT.has(ext)) {
    skippedAudio.push(path);
    continue;
  }
  mkdirSync(dirname(abs), { recursive: true });
  const img = sharp(Buffer.from(placeholderSvg(path, context)));
  const buf = await (ext === '.webp' ? img.webp() : ext === '.png' ? img.png() : img.jpeg()).toBuffer();
  writeFileSync(abs, buf);
  registry[path] = sha256(buf);
  created++;
  console.log(`  + ${path}`);
}

const sorted = Object.fromEntries(Object.entries(registry).sort(([a], [b]) => a.localeCompare(b)));
const registryPath = join(base, PLACEHOLDERS_FILE);
mkdirSync(dirname(registryPath), { recursive: true });
writeFileSync(registryPath, JSON.stringify(sorted, null, 2) + '\n');

console.log(`\n${gameName}: ${created} creada(s), ${replaced} reemplazada(s) por arte final, ${Object.keys(sorted).length} provisoria(s) en total.`);
if (skippedAudio.length) {
  console.log(`Audio faltante (no se generan provisorios):\n  ${skippedAudio.join('\n  ')}`);
}
