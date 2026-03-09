// store/useDebugStore.ts
// Store de debug separado con Zustand

import { create } from 'zustand';

export type DebugCategory = 'INFO' | 'ERROR' | 'WARNING' | 'DEBUG' | 'EVENT' | 'TIMER' | 'COMMAND' | 'ROUTE' | 'DIALOG' | 'WIDGET' | 'STATE' | 'SYSTEM';

export interface DebugEntry {
  timestamp: number;
  category: DebugCategory;
  message: string;
}

interface DebugStore {
  active: boolean;
  entries: DebugEntry[];
  toggle: () => void;
  enable: () => void;
  disable: () => void;
  log: (message: string, category?: DebugCategory) => void;
  clear: () => void;
  getReport: () => string;
}

export const useDebugStore = create<DebugStore>((set, get) => ({
  active: false,
  entries: [],

  toggle: () => set((s) => ({ active: !s.active })),
  enable: () => set({ active: true }),
  disable: () => set({ active: false }),

  log: (message, category = 'INFO') => {
    const entry: DebugEntry = {
      timestamp: Date.now(),
      category,
      message,
    };
    set((s) => ({ entries: [...s.entries, entry] }));
  },

  clear: () => set({ entries: [] }),

  getReport: () => {
    const { entries, active } = get();
    const lines = [
      `=== Debug Report ===`,
      `Active: ${active}`,
      `Entries: ${entries.length}`,
      '',
      ...entries.slice(-50).map((e) => {
        const time = new Date(e.timestamp).toLocaleTimeString();
        return `[${time}] [${e.category}] ${e.message}`;
      }),
    ];
    return lines.join('\n');
  },
}));
