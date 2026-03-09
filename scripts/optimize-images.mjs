/**
 * Post-build script: convierte imágenes PNG/JPG a WebP en dist/
 * Las referencias se resuelven en runtime via assetUrl().
 *
 * Uso: node scripts/optimize-images.mjs [dist-dir]
 */

import sharp from 'sharp'
import { readdir, readFile, writeFile, unlink, stat } from 'fs/promises'
import { join, extname, relative } from 'path'

const DIST_DIR = process.argv[2] || 'dist'
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg'])
const WEBP_QUALITY = 80

async function findFiles(dir, predicate) {
  const results = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...await findFiles(fullPath, predicate))
    } else if (predicate(entry.name)) {
      results.push(fullPath)
    }
  }
  return results
}

async function convertImage(filePath) {
  const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp')
  const originalSize = (await stat(filePath)).size

  await sharp(filePath)
    .webp({ quality: WEBP_QUALITY })
    .toFile(webpPath)

  const newSize = (await stat(webpPath)).size
  await unlink(filePath)

  return { original: originalSize, webp: newSize }
}

async function main() {
  console.log(`\n🖼️  Optimizando imágenes en ${DIST_DIR}/...\n`)

  const images = await findFiles(DIST_DIR, name =>
    IMAGE_EXTENSIONS.has(extname(name).toLowerCase())
  )

  if (images.length === 0) {
    console.log('  No se encontraron imágenes para convertir.')
    return
  }

  let totalOriginal = 0
  let totalWebp = 0

  for (const img of images) {
    const { original, webp } = await convertImage(img)
    totalOriginal += original
    totalWebp += webp
    const savings = ((1 - webp / original) * 100).toFixed(1)
    console.log(`  ${relative(DIST_DIR, img)} → .webp (${formatBytes(original)} → ${formatBytes(webp)}, -${savings}%)`)
  }

  // Actualizar referencia del favicon en index.html
  const htmlPath = join(DIST_DIR, 'index.html')
  try {
    let html = await readFile(htmlPath, 'utf-8')
    const updated = html.replace(/favicon[^"]*\.png/g, (m) => m.replace(/\.png$/, '.webp'))
    if (updated !== html) {
      await writeFile(htmlPath, updated, 'utf-8')
      console.log('  Actualizado: index.html (favicon)')
    }
  } catch {}

  const totalSavings = ((1 - totalWebp / totalOriginal) * 100).toFixed(1)
  console.log(`\n  Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalWebp)} (-${totalSavings}%)`)
  console.log(`  ${images.length} imágenes convertidas a WebP\n`)
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

main().catch(err => {
  console.error('Error optimizando imágenes:', err)
  process.exit(1)
})
