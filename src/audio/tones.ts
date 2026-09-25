// audio/tones.ts
// Tono que marca la IA en sus respuestas → efecto de sonido de reacción.
// Un juego puede cambiar cualquiera en game.json → audio.toneSfx ("none" = silencio).

import type { Tone } from '../engine/AiProvider';

export const DEFAULT_TONE_SFX: Record<Tone, string | null> = {
  neutral: null,
  burla: 'risa',
  chiste: 'badum_tss',
  incomodo: 'grillo',
  enojo: 'rugido',
  impresionado: 'aplauso',
  asco: 'baba',
  miedo: 'miedo',
  ternura: 'amor',
  triste: 'derrota',
  drama: 'tension',
};

/** Efecto para un tono, o null si no suena nada */
export function toneSfx(tone: Tone | undefined | null, overrides?: Record<string, string>): string | null {
  if (!tone) return null;
  const name = overrides?.[tone] ?? DEFAULT_TONE_SFX[tone];
  return name && name !== 'none' ? name : null;
}

/** Sonido al empezar cada modo de conversación con IA */
export const CHAT_START_SFX: Record<string, string> = {
  persuadir: 'misterio',
  negociar: 'monedas',
  cancion: 'magia',
  rap: 'tambor',
  insultos: 'combate',
  confesion: 'misterio',
};
