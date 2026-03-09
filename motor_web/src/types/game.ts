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
  /** Árboles de habilidades disponibles en el juego */
  skillTrees?: Record<string, SkillTreeDef>;
  /** Rasgos/estados que pueden aplicarse a personajes */
  traits?: Record<string, TraitDef>;
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
  /** ID del árbol de habilidades asignado a este personaje */
  skillTree?: string;
  /** Stats propias del personaje (HP, ataque, etc.) */
  baseStats?: Record<string, number>;
  /** Nivel máximo alcanzable */
  maxLevel?: number;
  /** XP necesaria por nivel: array[i] = XP para pasar de nivel i a i+1 */
  xpCurve?: number[];
  /** Rasgos iniciales del personaje */
  initialTraits?: string[];
}

// --- Skill Trees ---

export interface SkillTreeDef {
  name: string;
  description?: string;
  skills: Record<string, SkillDef>;
}

export interface SkillDef {
  name: string;
  description: string;
  icon?: string;
  maxLevel: number;
  /** IDs de skills que deben tener nivel >= 1 para desbloquear esta */
  prerequisites?: string[];
  /** Costo en puntos de habilidad por nivel */
  cost?: number;
  /** Bonificadores pasivos por nivel (se aplican como stats) */
  passiveBonus?: Record<string, number>;
  /** Tags para condicionales (ej: "magic", "stealth") */
  tags?: string[];
}

// --- Traits ---

export interface TraitDef {
  name: string;
  description: string;
  icon?: string;
  /** Modificadores de stats mientras el trait esté activo */
  statModifiers?: Record<string, number>;
  /** Modificador a tiradas de dados */
  diceModifier?: number;
  /** ¿Es permanente o temporal? */
  permanent?: boolean;
  /** Duración en número de escenas (solo si temporal) */
  duration?: number;
  /** Tags para condicionales */
  tags?: string[];
}

// --- Relationships ---

export type RelationshipTier = 'hostile' | 'distrustful' | 'neutral' | 'friendly' | 'allied' | 'loyal';

export interface RelationshipThreshold {
  tier: RelationshipTier;
  minAffinity: number;
}

export const DEFAULT_RELATIONSHIP_TIERS: RelationshipThreshold[] = [
  { tier: 'hostile', minAffinity: -100 },
  { tier: 'distrustful', minAffinity: -30 },
  { tier: 'neutral', minAffinity: -10 },
  { tier: 'friendly', minAffinity: 20 },
  { tier: 'allied', minAffinity: 50 },
  { tier: 'loyal', minAffinity: 80 },
];

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
  | TimedChoiceStep
  | LevelUpStep;

export interface StepCondition {
  stats?: Record<string, string>; // e.g. { "perception": ">=50" }
  flags?: Record<string, boolean>;
  inventory?: string[];
  visitedScenes?: string[];
  unvisitedScenes?: string[];
  /** Nivel mínimo de skill: { "fireball": ">=2" } */
  skillLevel?: Record<string, string>;
  /** Afinidad mínima con NPC: { "nerly": ">=50" } */
  affinity?: Record<string, string>;
  /** Rasgos activos requeridos */
  hasTraits?: string[];
  /** Rasgos que NO deben estar activos */
  notTraits?: string[];
  /** Nivel mínimo del personaje: { "_protagonist": ">=3" } */
  characterLevel?: Record<string, string>;
  /** Tier de relación requerido: { "nerly": "friendly" } */
  relationshipTier?: Record<string, RelationshipTier>;
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
  haggle?: ShopDiceAction;    // regatear precios
  steal?: ShopDiceAction;     // intentar robar
  deceive?: ShopDiceAction;   // engañar al vender (precio inflado)
  goto?: string;
  condition?: StepCondition;
}

export interface ShopDiceAction {
  stat: string;           // stat para modificador del dado
  difficulty: number;     // dificultad (DC)
  maxAttempts?: number;   // máximo de intentos (0 o undefined = ilimitado)
  difficultyIncrease?: number; // cuánto sube la DC por cada intento
  successText?: string;
  failText?: string;
  failEffects?: Effects;  // penalización al fallar cada intento
  bustGoto?: string;      // escena al agotar intentos o fallo crítico (cárcel, etc.)
  bustText?: string;      // texto al ser expulsado
  bustEffects?: Effects;  // efectos al ser expulsado (quitar items, etc.)
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

// --- LevelUp: pantalla de subir nivel ---

export interface LevelUpStep {
  type: 'level_up';
  /** ID del personaje que sube de nivel (vacío = protagonista) */
  characterId?: string;
  /** Texto introductorio */
  description?: string;
  /** Forzar subida de nivel sin chequear XP */
  force?: boolean;
  /** Puntos de habilidad a otorgar (default: 1) */
  skillPoints?: number;
  goto?: string;
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
  /** Dar XP a un personaje: { "protagonist": 50, "nerly": 20 } */
  xp?: Record<string, number>;
  /** Modificar afinidad con NPC: { "nerly": 10, "merchant": -5 } */
  affinity?: Record<string, number>;
  /** Añadir rasgos al personaje activo */
  addTraits?: string[];
  /** Quitar rasgos del personaje activo */
  removeTraits?: string[];
  /** Aprender skill directamente: { "fireball": 1 } (skill: niveles a añadir) */
  learnSkill?: Record<string, number>;
  /** Dar puntos de habilidad: { "_protagonist": 2 } */
  giveSkillPoints?: Record<string, number>;
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
