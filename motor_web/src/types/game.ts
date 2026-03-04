// types/game.ts
// Tipos para el formato de datos JSON del juego

export interface GameManifest {
  name: string;
  description: string;
  author: string;
  version: string;
  characters: Record<string, CharacterDef>;
  initialStats: Record<string, number | string>;
  initialFlags: Record<string, boolean>;
  initialInventory: string[];
  time: TimeCycle;
}

export interface CharacterDef {
  name: string;
  description: string;
  image?: string;
}

export interface TimeCycle {
  duration: number;
  phases: string[];
  initial: string;
}

// --- Scenes ---

export interface ScenesFile {
  scenes: Record<string, Scene>;
}

export interface Scene {
  scenario?: ScenarioDef;
  sequence: SequenceStep[];
}

export interface ScenarioDef {
  name: string;
  image?: string;
  description?: string;
  variants?: Record<string, string>;
}

// --- Sequence Steps ---

export type SequenceStep =
  | DialogStep
  | ChoiceStep
  | DiceStep
  | InputStep
  | EffectsStep;

export interface StepCondition {
  stats?: Record<string, string>; // e.g. { "perception": ">=50" }
  flags?: Record<string, boolean>;
  inventory?: string[];
  visitedScenes?: string[];
  unvisitedScenes?: string[];
}

export interface DialogStep {
  type: 'dialog';
  character: string;
  lines: string[];
  condition?: StepCondition;
}

export interface ChoiceOption {
  text: string;
  effects?: Effects;
  goto?: string;
  condition?: StepCondition;
}

export interface ChoiceStep {
  type: 'choice';
  options: ChoiceOption[];
  condition?: StepCondition;
}

export interface DiceResults {
  critical_success?: DiceOutcome;
  success: DiceOutcome;
  failure: DiceOutcome;
  critical_failure?: DiceOutcome;
}

export interface DiceOutcome {
  text: string;
  effects?: Effects;
  goto?: string;
}

export interface DiceStep {
  type: 'dice';
  stat: string;
  difficulty: number;
  faces: number;
  description: string;
  results: DiceResults;
  condition?: StepCondition;
}

export interface InputStep {
  type: 'input';
  prompt: string;
  saveAs: string;
  goto?: string;
  condition?: StepCondition;
}

export interface EffectsStep {
  type: 'effects';
  effects: Effects;
  condition?: StepCondition;
}

// --- Effects ---

export interface Effects {
  stats?: Record<string, number | string>;
  flags?: Record<string, boolean>;
  inventory?: string[];
  removeInventory?: string[];
}

// --- Conditions file ---

export interface ConditionsFile {
  conditions: ConditionDef[];
}

export interface ConditionDef {
  id: string;
  description: string;
  criteria: StepCondition & { always?: boolean };
  failure?: {
    message: string;
    alternativeScene?: string;
  };
}
