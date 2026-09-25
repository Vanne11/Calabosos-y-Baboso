// utils/sudo.ts
// Modo superpoderes (sudo) para probar el juego: volver atrás, saltar a escenas, darse objetos...
// La contraseña no está en el código: solo su hash SHA-256. No es seguridad real (el juego corre en el
// navegador del jugador), solo evita que cualquiera haga trampa por accidente.

const SUDO_HASH = 'd0cdb1ec710b4d7a64afb9b79161c61189e0473acd08bb1b4fd495ece78f7859';

/** SHA-256 en hexadecimal. Usa crypto.subtle si existe (solo en HTTPS/localhost) y si no, una versión propia */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Fallback(bytes);
}

export async function checkSudoPassword(password: string): Promise<boolean> {
  return (await sha256Hex(password)) === SUDO_HASH;
}

/** SHA-256 sin crypto.subtle (hostings sin HTTPS) */
export function sha256Fallback(data: Uint8Array): string {
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01,
    0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08,
    0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bitLen = data.length * 8;
  const padded = new Uint8Array(((data.length + 9 + 63) >> 6) << 6);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 2 ** 32));
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0; H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0; H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
  }
  return H.map((x) => x.toString(16).padStart(8, '0')).join('');
}

/** Comentarios del narrador (resignado) cada vez que usas un superpoder. Uno al azar por uso */
export const SUDO_QUIPS = {
  volver: [
    'El narrador finge no haberte visto.',
    'Otra vez tú. Escondo mis cosas.',
    'Ah, la contraseña. Qué sorpresa. Nadie la sabe. Salvo tú. Y ahora todo el que miró por encima de tu hombro.',
    'El narrador suspira en un idioma muerto.',
    'De vuelta la pequeña deidad de pacotilla.',
  ],
  atras: [
    'El narrador se marea. Las babosas del fondo vuelven a sus posiciones iniciales, molestas.',
    'Nadie se acuerda de nada. Salvo yo. Yo me acuerdo de todo. Es mi maldición.',
    'Como si esa decisión horrible nunca hubiera pasado. Pero pasó. Yo la vi.',
    'Técnicamente esto es hacer trampa. Técnicamente todo en tu vida lo es.',
    'El universo cruje un poco. No pasa nada. Seguramente.',
  ],
  ir: [
    'Las babosas no están hechas para esto. Tú tampoco.',
    'Llegas hecho un nudo de moléculas. Con suerte en el orden correcto.',
    'El guion llora en una esquina. Yo lo consuelo.',
    'Te saltaste un montón de mi mejor material. Espero que estés orgullos{o|a|x}.',
  ],
  dar: [
    'Aparece de la nada. Como los problemas.',
    'Sacado directamente del bolsillo del universo. Ni pediste permiso.',
    'Alguien, en algún lugar, acaba de perder eso. No te importa.',
    'Magia. O robo cósmico. Legalmente es lo mismo.',
  ],
  quitar: [
    'Desaparece. Como mi respeto por ti.',
    'Se evapora con un «pof» bastante triste.',
    'Al vacío. El vacío dice gracias.',
  ],
  dinero: [
    'La economía del reino acaba de colapsar. Felicidades.',
    'El Tendero siente un escalofrío y no sabe por qué.',
    'Dinero de la nada. Eres básicamente un banco.',
    'Imprimir dinero nunca salió mal en la historia. Nunca.',
  ],
  stat: [
    'Tu cuerpo obedece. Tu dignidad no se enteró.',
    'Reescribes la realidad a tu gusto. Qué madurez.',
    'Hecho. La ciencia no puede explicarlo. Yo sí: trampa.',
  ],
  flag: [
    'El destino se ajusta con un clic. Qué poético. Qué barato.',
    'Ahora el mundo cree que eso pasó. El mundo es bastante crédulo.',
  ],
  curar: [
    'Sin miedo, sin ganas de mear, con ganas de vivir. Un milagro. Uno barato.',
    'Te sientes como nuev{o|a|x}. Mentira, pero funciona.',
    'Tu vejiga y tu autoestima, restauradas. Solo una de las dos durará.',
  ],
} as const;

export function sudoQuip(kind: keyof typeof SUDO_QUIPS): string {
  const list = SUDO_QUIPS[kind];
  return list[Math.floor(Math.random() * list.length)];
}
