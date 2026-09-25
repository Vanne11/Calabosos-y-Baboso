#!/usr/bin/env node
// scripts/package-release.mjs
// Genera un paquete listo para subir al servidor (una sola carpeta):
//   release/calabosos-v<versión>/
//   ├── cyb/           el juego compilado → https://tudominio/cyb/
//   │   └── api/       el servidor de IA en PHP → https://tudominio/cyb/api/ (sin config.php ni base de datos)
//   └── DEPLOY.md      guía de instalación
// Actualizar = subir cyb/ ENCIMA de la anterior: nunca trae config.php ni data/, así que no pisa nada.
//
// Uso:
//   npm run package                 → juego completo + demos del motor (demo, demo2)
//   npm run package -- --sin-demos  → solo Calabosos (mucho más liviano)

import { execSync } from 'node:child_process';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const game = JSON.parse(readFileSync(join(ROOT, 'public/games/calabosos/game.json'), 'utf8'));
const version = game.version || '0.0.0';
const name = `calabosos-v${version}`;
const OUT = join(ROOT, 'release', name);

const withoutDemos = process.argv.includes('--sin-demos');
const run = (cmd) => execSync(cmd, { cwd: ROOT, stdio: 'inherit' });

console.log(`\n📦 Empaquetando ${name}\n`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

// 1. Validar y probar antes de empaquetar
run('node scripts/validate-game.mjs calabosos');
run('npx vitest run');

// 2. Juego compilado (base /cyb/) + imágenes a WebP
run(`npx vite build --outDir "${join(OUT, 'cyb')}" --emptyOutDir`);
run(`node scripts/optimize-images.mjs "${join(OUT, 'cyb')}"`);
// El guion en bruto no hace falta en producción
rmSync(join(OUT, 'cyb', 'games', 'Calabosos y Babosos'), { recursive: true, force: true });
if (withoutDemos) {
  for (const demo of ['demo', 'demo2']) rmSync(join(OUT, 'cyb', 'games', demo), { recursive: true, force: true });
  writeFileSync(join(OUT, 'cyb', 'games', 'index.json'), JSON.stringify({ games: ['calabosos'] }, null, 2) + '\n');
  console.log('\n(sin demos: solo se publica calabosos)');
}

// 3. Servidor PHP dentro del juego (cyb/api/), sin configuración ni datos
const API = join(OUT, 'cyb', 'api');
if (existsSync(API)) {
  // public/api/games.php es un listador viejo que el juego ya no usa (lee games/index.json): se descarta
  const extra = readdirSync(API).filter((f) => f !== 'games.php');
  if (extra.length) throw new Error(`El build del juego trae public/api/ con ${extra.join(', ')}: chocaría con la carpeta de la IA`);
  rmSync(API, { recursive: true, force: true });
  console.log('\n(se descartó public/api/games.php: listador viejo que el juego ya no usa)');
}
cpSync(join(ROOT, 'server'), API, {
  recursive: true,
  filter: (src) => {
    const rel = relative(join(ROOT, 'server'), src);
    if (rel === 'config.php') return false;
    if (rel.startsWith('data') && rel !== 'data' && !/data[\\/]\.(htaccess|gitkeep)$/.test(rel)) return false;
    return true;
  },
});

// 4. Guía
cpSync(join(ROOT, 'docs', 'DEPLOY.md'), join(OUT, 'DEPLOY.md'));

// 5. Comprimir
run(`tar -czf "release/${name}.tar.gz" -C release "${name}"`);

const size = (p) => {
  let total = 0;
  const walk = (d) => readdirSync(d).forEach((f) => { const fp = join(d, f); const s = statSync(fp); s.isDirectory() ? walk(fp) : (total += s.size); });
  walk(p);
  return total;
};
const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
if (existsSync(join(API, 'config.php'))) throw new Error('config.php no debería estar en el paquete');
console.log(`\n✔ release/${name}.tar.gz`);
console.log(`   cyb/     ${mb(size(join(OUT, 'cyb')))} (incluye cyb/api/: ${mb(size(API))})`);
console.log(`   Comprimido: ${mb(statSync(join(ROOT, 'release', `${name}.tar.gz`)).size)}\n`);
console.log('Siguiente paso: sube la carpeta cyb/ y abre https://tudominio/cyb/api/admin/ para instalar (usuario + key de DeepSeek).');
console.log('Guía paso a paso: DEPLOY.md, sección «Subir por FTP».\n');
