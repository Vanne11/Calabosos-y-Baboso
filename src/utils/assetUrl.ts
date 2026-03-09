/**
 * En producción, las imágenes PNG/JPG se convierten a WebP en el build.
 * Esta función resuelve la extensión correcta según el entorno.
 */
const isProd = import.meta.env.PROD

export function assetUrl(path: string): string {
  if (isProd) {
    return path.replace(/\.(png|jpe?g)$/i, '.webp')
  }
  return path
}
