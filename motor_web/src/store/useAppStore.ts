// store/useAppStore.ts
// Store principal con Zustand - reemplaza todos los useState dispersos

import { create } from 'zustand';
import type { TerminalEntry } from '../types/terminal';
import type { PlayerState, StepResult } from '../types/engine';
import type { GameEngine } from '../engine/GameEngine';
import type { GameManifest } from '../types/game';
import { audioManager } from '../engine/AudioManager';

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

  // Game base path (e.g. "games/demo")
  gameBasePath: string;
  setGameBasePath: (path: string) => void;

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

  // Fade old entries
  fadeBeforeIndex: number;
  fadeOldEntries: () => void;

  // Seen characters (for first-time image display)
  seenCharacters: Set<string>;
  markCharacterSeen: (id: string) => void;

  // UI states
  showEnterPrompt: boolean;
  setShowEnterPrompt: (show: boolean) => void;
  showMobileWarning: boolean;
  setShowMobileWarning: (show: boolean) => void;

  // Return to editor flag (for test mode)
  returnToEditor: boolean;
  setReturnToEditor: (val: boolean) => void;

  // Pending slot action (for /save and /load menus)
  pendingSlotAction: { type: 'save' | 'load'; slots: number } | null;
  setPendingSlotAction: (action: { type: 'save' | 'load'; slots: number } | null) => void;

  // Reset everything for quit/restart
  resetGame: () => void;
}

const SESSION_KEY = 'babosos_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24h

function getStoredSession(): { username: string; password: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return { username: data.username, password: data.password };
  } catch {
    return null;
  }
}

export function getStoredCredentials(): { username: string; password: string } | null {
  return getStoredSession();
}

export function saveSession(username: string, password: string) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username, password, timestamp: Date.now() }));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

const restoredSession = getStoredSession();

export const useAppStore = create<AppStore>((set) => ({
  // Phase — skip boot/login if session is valid
  phase: restoredSession ? 'shell' : 'boot',
  setPhase: (phase) => set({ phase }),

  // Login
  username: restoredSession?.username ?? '',
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

  // Game base path
  gameBasePath: '',
  setGameBasePath: (gameBasePath) => set({ gameBasePath }),

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

  // Fade old entries
  fadeBeforeIndex: 0,
  fadeOldEntries: () => set((s) => ({ fadeBeforeIndex: s.history.length })),

  // Seen characters
  seenCharacters: new Set<string>(),
  markCharacterSeen: (id) =>
    set((s) => {
      if (s.seenCharacters.has(id)) return s;
      const next = new Set(s.seenCharacters);
      next.add(id);
      return { seenCharacters: next };
    }),

  // UI
  showEnterPrompt: false,
  setShowEnterPrompt: (showEnterPrompt) => set({ showEnterPrompt }),
  showMobileWarning: false,
  setShowMobileWarning: (showMobileWarning) => set({ showMobileWarning }),

  // Return to editor
  returnToEditor: false,
  setReturnToEditor: (returnToEditor) => set({ returnToEditor }),

  // Pending slot action
  pendingSlotAction: null,
  setPendingSlotAction: (pendingSlotAction) => set({ pendingSlotAction }),

  // Reset
  resetGame: () =>
    set((s) => ({
      engine: null,
      playerState: null,
      gameManifest: null,
      gameBasePath: '',
      currentScene: '',
      pendingResult: null,
      pendingSlotAction: null,
      currentImage: null,
      fadeBeforeIndex: 0,
      seenCharacters: new Set<string>(),
      phase: s.returnToEditor ? 'editor' : 'shell',
      returnToEditor: false,
    })),
}));

// Stop music whenever we leave the game phase
let prevPhase: AppPhase = useAppStore.getState().phase;
useAppStore.subscribe((state) => {
  if (prevPhase === 'game' && state.phase !== 'game') {
    audioManager.stop();
  }
  prevPhase = state.phase;
});
