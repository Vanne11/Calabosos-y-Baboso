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
  /** Definiciones de items del inventario (nombre, descripción, imagen) */
  items?: Record<string, ItemDef>;
}

export interface ItemDef {
  name: string;
  description: string;
  image?: string;
}

export type CharacterRole = 'narrator' | 'protagonist' | 'companion' | 'npc';

export interface CharacterDef {
  name: string;
  description: string;
  image?: string;
  /** Role determines behavior: narrator speaks in system style,
   *  protagonist shows in status bar, companion shows alongside protagonist */
  role?: CharacterRole;
  /** For companions: flag name that activates them (e.g. "nerly_joined") */
  joinFlag?: string;
  /** Alternative images for protagonist selection */
  altImages?: Record<string, string>;
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
  music?: string;
  description?: string;
  variants?: Record<string, string>;
}

// --- Sequence Steps ---

export type SequenceStep =
  | DialogStep
  | ChoiceStep
  | DiceStep
  | InputStep
  | EffectsStep
  | BranchStep
  | RandomStep
  | CheckStep
  | ShopStep
  | CombatStep
  | NotifyStep
  | WaitStep
  | SoundStep
  | CraftStep
  | PuzzleStep
  | ExamineStep
  | UseItemStep
  | TimedChoiceStep;

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

// --- Branch: bifurcación automática condicional ---

export interface BranchStep {
  type: 'branch';
  branches: BranchOption[];
  condition?: StepCondition;
}

export interface BranchOption {
  condition?: StepCondition;
  goto: string;
}

// --- Random: resultado aleatorio con pesos ---

export interface RandomStep {
  type: 'random';
  outcomes: RandomOutcome[];
  condition?: StepCondition;
}

export interface RandomOutcome {
  weight: number;
  text: string;
  effects?: Effects;
  goto?: string;
}

// --- Check: comprobación determinista de stat ---

export interface CheckStep {
  type: 'check';
  stat: string;
  threshold: string; // e.g. ">=60"
  description: string;
  success: CheckOutcome;
  failure: CheckOutcome;
  condition?: StepCondition;
}

export interface CheckOutcome {
  text: string;
  effects?: Effects;
  goto?: string;
}

// --- Shop: interfaz de tienda ---

export interface ShopStep {
  type: 'shop';
  title: string;
  currency: string; // stat usada como moneda
  items: ShopItem[];
  sellable?: boolean;
  sellRatio?: number; // 0-1, porcentaje del precio al vender
  goto?: string;
  condition?: StepCondition;
}

export interface ShopItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  effects?: Effects;
}

// --- Combat: combate por turnos ---

export interface CombatStep {
  type: 'combat';
  enemy: CombatEnemy;
  playerStat: string; // stat del jugador usada como HP
  attackStat: string;  // stat que afecta daño
  defenseStat?: string; // stat que reduce daño recibido
  actions: ('attack' | 'defend' | 'flee' | 'use_item')[];
  /** Items usables durante el combate con efectos especiales */
  combatItems?: CombatItemDef[];
  results: CombatResults;
  condition?: StepCondition;
}

export interface CombatEnemy {
  name: string;
  image?: string;
  hp: number;
  attack: number;
  defense: number;
}

/** Item usable en combate: requiere tenerlo en inventario */
export interface CombatItemDef {
  itemId: string;     // ID del item en inventario
  name: string;       // Nombre a mostrar
  text: string;       // Texto al usarlo ("Lanzas sal al Rey Baboso!")
  damage?: number;    // Daño directo al enemigo
  heal?: number;      // Curación al jugador
  consume?: boolean;  // Si se consume al usar (default true)
  effects?: Effects;  // Efectos adicionales
}

export interface CombatResults {
  victory: CombatOutcome;
  defeat: CombatOutcome;
  flee?: CombatOutcome;
}

export interface CombatOutcome {
  text: string;
  effects?: Effects;
  goto?: string;
}

// --- Notify: notificación/toast ---

export interface NotifyStep {
  type: 'notify';
  style: 'achievement' | 'warning' | 'info' | 'discovery';
  title: string;
  text: string;
  icon?: string;
  effects?: Effects;
  condition?: StepCondition;
}

// --- Wait: pausa dramática ---

export interface WaitStep {
  type: 'wait';
  text: string;
  duration: number; // ms
  style: 'typing' | 'fade' | 'dots';
  condition?: StepCondition;
}

// --- Sound: efecto de sonido puntual ---

export interface SoundStep {
  type: 'sound';
  src: string;
  volume?: number; // 0-1
  condition?: StepCondition;
}

// --- Craft: combinar items del inventario ---

export interface CraftStep {
  type: 'craft';
  description?: string;
  recipes: CraftRecipe[];
  failText?: string;
  goto?: string;
  condition?: StepCondition;
}

export interface CraftRecipe {
  ingredients: string[];
  result: string;
  text: string;
  consume?: boolean;
  effects?: Effects;
  goto?: string;
}

// --- Puzzle: acertijos interactivos ---

export interface PuzzleStep {
  type: 'puzzle';
  puzzleType: 'code' | 'sequence' | 'riddle' | 'lock';
  description: string;
  config: PuzzleConfig;
  maxAttempts?: number;
  hintText?: string;
  success: PuzzleOutcome;
  failure: PuzzleOutcome;
  condition?: StepCondition;
}

export type PuzzleConfig =
  | CodePuzzleConfig
  | SequencePuzzleConfig
  | RiddlePuzzleConfig
  | LockPuzzleConfig;

export interface CodePuzzleConfig {
  type: 'code';
  answers: string[];
  hint?: string;
  prompt?: string;
}

export interface SequencePuzzleConfig {
  type: 'sequence';
  elements: { id: string; label: string }[];
  hint?: string;
}

export interface RiddlePuzzleConfig {
  type: 'riddle';
  question: string;
  answers: string[];
  hint?: string;
}

export interface LockPuzzleConfig {
  type: 'lock';
  digits: number;
  combination: string;
  hint?: string;
}

export interface PuzzleOutcome {
  text: string;
  effects?: Effects;
  goto?: string;
}

// --- Examine: inspeccionar entorno ---

export interface ExamineStep {
  type: 'examine';
  description?: string;
  subjects: ExamineSubject[];
  exitText?: string;
  goto?: string;
  condition?: StepCondition;
}

export interface ExamineSubject {
  id: string;
  label: string;
  text: string;
  effects?: Effects;
  condition?: StepCondition;
  oneTime?: boolean;
}

// --- UseItem: usar item en objetivo del entorno ---

export interface UseItemStep {
  type: 'use_item';
  description?: string;
  targets: UseItemTarget[];
  failText?: string;
  exitText?: string;
  goto?: string;
  condition?: StepCondition;
}

export interface UseItemTarget {
  id: string;
  label: string;
  accepts: UseItemAccept[];
  defaultText?: string;
}

export interface UseItemAccept {
  itemId: string;
  text: string;
  consume?: boolean;
  effects?: Effects;
  goto?: string;
}

// --- TimedChoice: decisión con temporizador ---

export interface TimedChoiceStep {
  type: 'timed_choice';
  duration: number;
  defaultIndex: number;
  timeoutText?: string;
  options: ChoiceOption[];
  condition?: StepCondition;
}

// --- Effects ---

export interface Effects {
  stats?: Record<string, number | string>;
  setStats?: Record<string, number | string>;
  flags?: Record<string, boolean>;
  inventory?: string[];
  removeInventory?: string[];
  clearInventory?: boolean;
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
