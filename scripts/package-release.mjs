#!/usr/bin/env node
// scripts/package-release.mjs
// Genera un paquete listo para subir al servidor:
//   release/calabosos-v<versión>.tar.gz
//   ├── cyb/        juego compilado (va en https://tudominio/cyb/)
//   ├── cyb-api/    servidor PHP (va en https://tudominio/cyb-api/), sin config.php ni base de datos
//   └── DEPLOY.md   guía de instalación
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

// 1. Validar antes de empaquetar
run('node scripts/validate-game.mjs calabosos');

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

// 3. Servidor PHP sin configuración ni datos
cpSync(join(ROOT, 'server'), join(OUT, 'cyb-api'), {
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
if (existsSync(join(OUT, 'cyb-api', 'config.php'))) throw new Error('config.php no debería estar en el paquete');
console.log(`\n✔ release/${name}.tar.gz`);
console.log(`   cyb/     ${mb(size(join(OUT, 'cyb')))}`);
console.log(`   cyb-api/ ${mb(size(join(OUT, 'cyb-api')))}`);
console.log(`   Comprimido: ${mb(statSync(join(ROOT, 'release', `${name}.tar.gz`)).size)}\n`);
