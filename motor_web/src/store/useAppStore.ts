// store/useAppStore.ts
// Store principal con Zustand - reemplaza todos los useState dispersos

import { create } from 'zustand';
import type { TerminalEntry } from '../types/terminal';
import type { PlayerState, StepResult } from '../types/engine';
import type { GameEngine } from '../engine/GameEngine';
import type { GameManifest } from '../types/game';

export type AppPhase = 'boot' | 'login' | 'shell' | 'game' | 'editor';

interface AppStore {
  // App phase
  phase: AppPhase;
  setPhase: (phase: AppPhase) => void;

  // Login
  username: string;
  setUsername: (name: string) => void;

  // Terminal
  history: TerminalEntry[];
  addEntry: (entry: TerminalEntry) => void;
  addEntries: (entries: TerminalEntry[]) => void;
  clearHistory: () => void;
  setHistory: (entries: TerminalEntry[]) => void;
  replaceLastEntries: (removeCount: number, newEntries: TerminalEntry[]) => void;

  // Command history (for arrow navigation)
  commandHistory: string[];
  addCommandToHistory: (cmd: string) => void;

  // Game engine
  engine: GameEngine | null;
  setEngine: (engine: GameEngine | null) => void;

  // Player state (synced from engine)
  playerState: PlayerState | null;
  setPlayerState: (state: PlayerState) => void;

  // Game manifest
  gameManifest: GameManifest | null;
  setGameManifest: (manifest: GameManifest | null) => void;

  // Current scene
  currentScene: string;
  setCurrentScene: (scene: string) => void;

  // Current pending result (choices, dice, input)
  pendingResult: StepResult | null;
  setPendingResult: (result: StepResult | null) => void;

  // Image panel
  currentImage: string | null;
  setCurrentImage: (image: string | null) => void;

  // Speed & volume
  speed: number;
  setSpeed: (speed: number) => void;
  volume: number;
  setVolume: (volume: number) => void;

  // UI states
  showEnterPrompt: boolean;
  setShowEnterPrompt: (show: boolean) => void;
  showMobileWarning: boolean;
  setShowMobileWarning: (show: boolean) => void;

  // Return to editor flag (for test mode)
  returnToEditor: boolean;
  setReturnToEditor: (val: boolean) => void;

  // Reset everything for quit/restart
  resetGame: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  // Phase
  phase: 'boot',
  setPhase: (phase) => set({ phase }),

  // Login
  username: '',
  setUsername: (username) => set({ username }),

  // Terminal
  history: [],
  addEntry: (entry) =>
    set((s) => ({ history: [...s.history, entry] })),
  addEntries: (entries) =>
    set((s) => ({ history: [...s.history, ...entries] })),
  clearHistory: () => set({ history: [] }),
  setHistory: (entries) => set({ history: entries }),
  replaceLastEntries: (removeCount, newEntries) =>
    set((s) => ({ history: [...s.history.slice(0, -removeCount), ...newEntries] })),

  // Command history
  commandHistory: [],
  addCommandToHistory: (cmd) =>
    set((s) => {
      const last = s.commandHistory[s.commandHistory.length - 1];
      if (last === cmd) return s;
      return { commandHistory: [...s.commandHistory, cmd] };
    }),

  // Engine
  engine: null,
  setEngine: (engine) => set({ engine }),

  // Player state
  playerState: null,
  setPlayerState: (playerState) => set({ playerState }),

  // Game manifest
  gameManifest: null,
  setGameManifest: (gameManifest) => set({ gameManifest }),

  // Scene
  currentScene: '',
  setCurrentScene: (currentScene) => set({ currentScene }),

  // Pending result
  pendingResult: null,
  setPendingResult: (pendingResult) => set({ pendingResult }),

  // Image
  currentImage: null,
  setCurrentImage: (currentImage) => set({ currentImage }),

  // Speed & volume
  speed: 1,
  setSpeed: (speed) => set({ speed }),
  volume: 50,
  setVolume: (volume) => set({ volume }),

  // UI
  showEnterPrompt: false,
  setShowEnterPrompt: (showEnterPrompt) => set({ showEnterPrompt }),
  showMobileWarning: false,
  setShowMobileWarning: (showMobileWarning) => set({ showMobileWarning }),

  // Return to editor
  returnToEditor: false,
  setReturnToEditor: (returnToEditor) => set({ returnToEditor }),

  // Reset
  resetGame: () =>
    set((s) => ({
      engine: null,
      playerState: null,
      gameManifest: null,
      currentScene: '',
      pendingResult: null,
      currentImage: null,
      phase: s.returnToEditor ? 'editor' : 'shell',
      returnToEditor: false,
    })),
}));
