// Modo superpoderes: la contraseña se verifica por hash (con crypto.subtle o con la versión propia).

import { describe, it, expect } from 'vitest';
import { checkSudoPassword, sha256Fallback, sha256Hex } from '../../src/utils/sudo';

describe('sudo', () => {
  it('la versión propia de SHA-256 coincide con la estándar', async () => {
    for (const text of ['', 'abc', 'babosa123', 'ñandú 🐌 con tildes', 'x'.repeat(200)]) {
      expect(sha256Fallback(new TextEncoder().encode(text))).toBe(await sha256Hex(text));
    }
    expect(sha256Fallback(new TextEncoder().encode('abc'))).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('solo acepta la contraseña correcta', async () => {
    expect(await checkSudoPassword('babosa123')).toBe(true);
    expect(await checkSudoPassword('Babosa123')).toBe(false);
    expect(await checkSudoPassword('')).toBe(false);
  });
});
