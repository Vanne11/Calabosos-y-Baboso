// types/engine.ts
// Tipos para el motor del juego y comunicación motor↔UI

export interface PlayerState {
  stats: Record<string, number | string>;
  flags: Record<string, boolean>;
  inventory: string[];
  visitedScenes: string[];
  time: {
    phase: string;
    actions: number;
    cycles: number;
  };
}

// Lo que el motor produce paso a paso
export type StepResult =
  | ScenarioResult
  | DialogResult
  | ChoicePrompt
  | DicePrompt
  | DiceResult
  | InputPrompt
  | EffectsResult
  | NavigateResult
  | GameEndResult;

export interface ScenarioResult {
  type: 'scenario';
  name: string;
  description: string;
  image?: string;
}

export interface DialogResult {
  type: 'dialog';
  character: string;
  characterName: string;
  lines: string[];
}

export interface ChoicePrompt {
  type: 'choice_prompt';
  options: { text: string; index: number }[];
}

export interface DicePrompt {
  type: 'dice_prompt';
  description: string;
  stat: string;
  difficulty: number;
  faces: number;
}

export interface DiceResult {
  type: 'dice_result';
  roll: number;
  modifier: number;
  total: number;
  difficulty: number;
  outcome: 'critical_success' | 'success' | 'failure' | 'critical_failure';
  text: string;
}

export interface InputPrompt {
  type: 'input_prompt';
  prompt: string;
}

export interface EffectsResult {
  type: 'effects';
  stats?: Record<string, number | string>;
  flags?: Record<string, boolean>;
  inventory?: string[];
  removeInventory?: string[];
}

export interface NavigateResult {
  type: 'navigate';
  scene: string;
}

export interface GameEndResult {
  type: 'game_end';
}

// Acciones del jugador enviadas al motor
export type PlayerAction =
  | { type: 'choose'; index: number }
  | { type: 'roll_dice' }
  | { type: 'submit_input'; value: string }
  | { type: 'continue' };
