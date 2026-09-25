// store/useFxStore.ts
// Efectos visuales efímeros: sacudida de pantalla, destellos de color y cifras flotantes en la barra de stats.

import { create } from 'zustand';

export type FlashKind = 'damage' | 'heal' | 'gold' | 'level' | 'death';

export interface StatPop {
  id: number;
  stat: string;
  delta: number;
}

interface FxStore {
  /** Cambia en cada sacudida para reiniciar la animación */
  shakeKey: number;
  shakeStrength: number;
  flashKey: number;
  flashKind: FlashKind | null;
  pops: StatPop[];
  shake: (strength?: number) => void;
  flash: (kind: FlashKind) => void;
  pop: (stat: string, delta: number) => void;
}

let popId = 0;
const POP_MS = 1600;

export const useFxStore = create<FxStore>((set) => ({
  shakeKey: 0,
  shakeStrength: 1,
  flashKey: 0,
  flashKind: null,
  pops: [],
  shake: (strength = 1) => set((s) => ({ shakeKey: s.shakeKey + 1, shakeStrength: strength })),
  flash: (kind) => set((s) => ({ flashKey: s.flashKey + 1, flashKind: kind })),
  pop: (stat, delta) => {
    const id = ++popId;
    set((s) => ({ pops: [...s.pops, { id, stat, delta }] }));
    setTimeout(() => set((s) => ({ pops: s.pops.filter((p) => p.id !== id) })), POP_MS);
  },
}));
