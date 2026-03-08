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
  | GameEndResult
  | CheckResult
  | RandomResult
  | ShopPrompt
  | CombatPrompt
  | CombatTurnResult
  | CombatEndResult
  | NotifyResult
  | WaitResult
  | SoundResult
  | CraftPrompt
  | CraftResult
  | PuzzlePrompt
  | PuzzleAttemptResult
  | ExaminePrompt
  | ExamineResult
  | UseItemPrompt
  | UseItemResult
  | TimedChoicePrompt;

export interface ScenarioResult {
  type: 'scenario';
  name: string;
  description: string;
  image?: string;
  music?: string;
}

export interface DialogResult {
  type: 'dialog';
  character: string;
  characterName: string;
  characterImage?: string;
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
  setStats?: Record<string, number | string>;
  flags?: Record<string, boolean>;
  inventory?: string[];
  removeInventory?: string[];
  clearInventory?: boolean;
}

export interface NavigateResult {
  type: 'navigate';
  scene: string;
}

export interface GameEndResult {
  type: 'game_end';
}

export interface CheckResult {
  type: 'check_result';
  description: string;
  stat: string;
  statValue: number | string;
  threshold: string;
  passed: boolean;
  text: string;
}

export interface RandomResult {
  type: 'random_result';
  text: string;
}

export interface ShopPrompt {
  type: 'shop_prompt';
  title: string;
  currency: string;
  currentMoney: number;
  items: { id: string; name: string; price: number; description?: string; canAfford: boolean }[];
  sellable: boolean;
  playerInventory: string[];
  sellRatio: number;
}

export interface CombatPrompt {
  type: 'combat_prompt';
  enemyName: string;
  enemyImage?: string;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  actions: string[];
  round: number;
  /** Items del inventario que se pueden usar en este combate */
  usableItems?: { itemId: string; name: string }[];
}

export interface CombatTurnResult {
  type: 'combat_turn';
  playerAction: string;
  playerDamage: number;
  enemyDamage: number;
  enemyHp: number;
  playerHp: number;
  text: string;
}

export interface CombatEndResult {
  type: 'combat_end';
  outcome: 'victory' | 'defeat' | 'flee';
  text: string;
}

export interface NotifyResult {
  type: 'notify';
  style: 'achievement' | 'warning' | 'info' | 'discovery';
  title: string;
  text: string;
  icon?: string;
}

export interface WaitResult {
  type: 'wait';
  text: string;
  duration: number;
  style: 'typing' | 'fade' | 'dots';
}

export interface SoundResult {
  type: 'sound';
  src: string;
  volume: number;
}

// --- Craft ---

export interface CraftPrompt {
  type: 'craft_prompt';
  description?: string;
  playerInventory: string[];
  recipes: { ingredients: string[]; resultName: string }[];
  failText: string;
}

export interface CraftResult {
  type: 'craft_result';
  success: boolean;
  text: string;
}

// --- Puzzle ---

export interface PuzzlePrompt {
  type: 'puzzle_prompt';
  puzzleType: 'code' | 'sequence' | 'riddle' | 'lock';
  description: string;
  prompt?: string;
  question?: string;
  hint?: string;
  elements?: { id: string; label: string }[];
  digits?: number;
  attemptsLeft?: number;
}

export interface PuzzleAttemptResult {
  type: 'puzzle_attempt';
  correct: boolean;
  text: string;
  attemptsLeft?: number;
}

// --- Examine ---

export interface ExaminePrompt {
  type: 'examine_prompt';
  description?: string;
  subjects: { id: string; label: string }[];
  exitText: string;
}

export interface ExamineResult {
  type: 'examine_result';
  subjectLabel: string;
  text: string;
}

// --- UseItem ---

export interface UseItemPrompt {
  type: 'use_item_prompt';
  description?: string;
  targets: { id: string; label: string }[];
  playerInventory: string[];
  exitText: string;
}

export interface UseItemResult {
  type: 'use_item_result';
  targetLabel: string;
  itemId: string;
  text: string;
  success: boolean;
}

// --- TimedChoice ---

export interface TimedChoicePrompt {
  type: 'timed_choice_prompt';
  options: { text: string; index: number }[];
  duration: number;
  defaultIndex: number;
  timeoutText?: string;
}

// Acciones del jugador enviadas al motor
export type PlayerAction =
  | { type: 'choose'; index: number }
  | { type: 'roll_dice' }
  | { type: 'submit_input'; value: string }
  | { type: 'continue' }
  | { type: 'shop_buy'; itemIndex: number }
  | { type: 'shop_sell'; itemId: string }
  | { type: 'shop_exit' }
  | { type: 'combat_action'; action: string }
  | { type: 'craft_combine'; items: string[] }
  | { type: 'craft_exit' }
  | { type: 'puzzle_attempt'; answer: string | string[] }
  | { type: 'puzzle_exit' }
  | { type: 'examine_select'; subjectId: string }
  | { type: 'examine_exit' }
  | { type: 'use_item_on'; itemId: string; targetId: string }
  | { type: 'use_item_exit' };
