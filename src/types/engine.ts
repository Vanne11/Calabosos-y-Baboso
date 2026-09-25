// types/engine.ts
// Tipos para el motor del juego y comunicación motor↔UI

import type { Tone } from '../engine/AiProvider';

export interface CharacterState {
  level: number;
  xp: number;
  skillPoints: number;
  skills: Record<string, number>; // skillId → nivel actual
  traits: string[]; // IDs de traits activos
  stats: Record<string, number>; // Stats propias del personaje (HP, ataque, etc.)
}

export interface RelationshipState {
  affinity: number; // -100 a 100
}

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
  /** Estado por personaje (protagonista, compañeros, NPCs) */
  characters: Record<string, CharacterState>;
  /** Relaciones con NPCs */
  relationships: Record<string, RelationshipState>;
  /** Rasgos activos globales (del protagonista) */
  activeTraits: string[];
  /** Contador de escenas para expiración de traits temporales */
  sceneCount: number;
  /** Contadores meta: persisten entre partidas (los carga/guarda el game loop) */
  meta?: Record<string, number>;
  /** Índices ya usados por pool (para no repetir frases) */
  pools?: Record<string, number[]>;
  /** Reglas "once" ya disparadas en esta partida */
  rulesFired?: string[];
  /** Perfil del jugador: etiquetas acumuladas por sus decisiones */
  profile?: Record<string, number>;
  /** Memoria de la partida para la IA: hechos en orden (effects.memo y resultados de los chats) */
  memoria?: string[];
  /** Decisiones con significado (opciones con tags), con la escena donde las tomó */
  decisiones?: string[];
  /** Frases textuales del jugador en los chats (la mejor de cada conversación) */
  citas?: string[];
  /** Últimas líneas del narrador con IA (para que no se repita) */
  iaDijo?: string[];
  /** Últimos mensajes del jugador tal cual los escribió (modismos, faltas): la IA imita y se burla */
  habla?: string[];
  /** Lo que cada personaje recuerda de Alex (chats anteriores, effects.npcMemo, gestos) */
  npcMemoria?: Record<string, string[]>;
  /** Charla libre: usadas en la partida, y en la escena actual (sceneCount de esa escena) */
  charla?: { usos: number; escena: number; enEscena: number };
  /** Entradas del códice desbloqueadas (en orden) */
  codex?: string[];
  /** Último punto de control: escena y copia del estado en ese momento */
  checkpoint?: { scene: string; state: Omit<PlayerState, 'checkpoint'> };
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
  | ShopDicePrompt
  | ShopDiceResult
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
  | TimedChoicePrompt
  | LevelUpPrompt
  | LevelUpResult
  | RelationshipChangeResult
  | TraitChangeResult
  | XpGainResult
  | ChatStartResult
  | ChatPrompt
  | ChatReplyResult
  | ChatEndResult;

// --- Modos chat (ai_chat) ---

export interface ChatStartResult {
  type: 'chat_start';
  mode: string;
  npcName: string;
  maxTurns: number;
  meterLabel: string;
  score: number;
}

export interface ChatPrompt {
  type: 'chat_prompt';
  npcName: string;
  turnsLeft: number;
  score: number;
  meterLabel: string;
  maxInputChars: number;
}

export interface ChatReplyResult {
  type: 'chat_reply';
  character: string;
  characterName: string;
  characterImage?: string;
  text: string;
  score: number;
  delta: number;
  meterLabel: string;
  turnsLeft: number;
  /** Tono de la respuesta, marcado por la IA */
  tone?: Tone;
  /** Id de la línea en el servidor (para calificarla con /bien, /mal) */
  aiLineId?: number;
}

export interface ChatEndResult {
  type: 'chat_end';
  verdict: 'success' | 'partial' | 'failure' | null;
  score: number;
  meterLabel: string;
  gaveUp: boolean;
  text?: string;
}

export interface ScenarioResult {
  type: 'scenario';
  name: string;
  description: string;
  image?: string;
  music?: string;
  /** Ambiente a poner: nombre, null = apagar, undefined = mantener el actual */
  ambience?: string | null;
  sfx?: string[];
}

export interface DialogResult {
  type: 'dialog';
  character: string;
  characterName: string;
  characterImage?: string;
  lines: string[];
  /** Tono marcado por la IA (solo en líneas generadas) */
  tone?: Tone;
  /** Id de la línea generada en el servidor (para calificarla con /bien, /mal) */
  aiLineId?: number;
}

export interface ChoicePrompt {
  type: 'choice_prompt';
  options: { text: string; index: number }[];
  /** Índice de la opción "Hacer otra cosa…" (acción libre). Si está, también se puede escribir texto directo */
  freeIndex?: number;
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
  sfx?: string;
}

export interface InputPrompt {
  type: 'input_prompt';
  prompt: string;
  /** Aviso mientras la IA procesa lo escrito ("El narrador está pensando...") */
  thinking?: string;
}

export interface EffectsResult {
  type: 'effects';
  stats?: Record<string, number | string>;
  setStats?: Record<string, number | string>;
  flags?: Record<string, boolean>;
  inventory?: string[];
  removeInventory?: string[];
  clearInventory?: boolean;
  unlockCodex?: string[];
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
  sfx?: string;
}

export interface ShopPrompt {
  type: 'shop_prompt';
  title: string;
  currency: string;
  currentMoney: number;
  items: { id: string; name: string; price: number; description?: string; canAfford: boolean; haggled?: boolean }[];
  sellable: boolean;
  /** Lo que el jugador puede vender aquí, con el precio que le pagan (sin los objetos keep) */
  playerInventory: { id: string; name: string; count: number; sellPrice?: number }[];
  sellRatio: number;
  canHaggle: boolean;
  canSteal: boolean;
  canDeceive: boolean;
  haggleLeft?: number;  // intentos restantes (undefined = ilimitado)
  stealLeft?: number;
  deceiveLeft?: number;
  lastMessage?: string; // último comentario del vendedor
}

export interface ShopDicePrompt {
  type: 'shop_dice_prompt';
  action: 'haggle' | 'steal' | 'deceive';
  description: string;
  stat: string;
  difficulty: number;
  faces: number;
}

export interface ShopDiceResult {
  type: 'shop_dice_result';
  action: 'haggle' | 'steal' | 'deceive';
  success: boolean;
  roll: number;
  modifier: number;
  total: number;
  difficulty: number;
  text: string;
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
  /** Música del combate (ruta resuelta); undefined = no cambiar la música */
  music?: string;
  /** Items del inventario que se pueden usar en este combate */
  usableItems?: { itemId: string; name: string }[];
  /** Objetos del inventario que se pueden lanzar como arma (acción "use_item:throw:<id>") */
  throwables?: { itemId: string; name: string }[];
}

export interface CombatTurnResult {
  type: 'combat_turn';
  playerAction: string;
  /** Solo en el ataque sorpresa (llega antes del primer combat_prompt): música del combate */
  music?: string;
  playerDamage: number;
  enemyDamage: number;
  enemyHp: number;
  playerHp: number;
  text: string;
  /** Sonido del golpe del jugador (propio del enemigo, o explosión al morir) */
  sfx?: string;
}

export interface CombatEndResult {
  type: 'combat_end';
  outcome: 'victory' | 'defeat' | 'flee';
  text: string;
  /** Sonido de muerte del enemigo (victoria) */
  sfx?: string;
}

export interface NotifyResult {
  type: 'notify';
  style: 'achievement' | 'warning' | 'info' | 'discovery';
  title: string;
  text: string;
  icon?: string;
  sfx?: string;
}

export interface WaitResult {
  type: 'wait';
  text: string;
  duration: number;
  style: 'typing' | 'fade' | 'dots';
}

export interface SoundResult {
  type: 'sound';
  src?: string;
  sfx?: string;
  volume: number;
  wait: boolean;
}

// --- Craft ---

export interface CraftPrompt {
  type: 'craft_prompt';
  description?: string;
  /** Items sobre la mesa: herramientas fijas + subproductos recogibles */
  tableItems: { id: string; name: string; description?: string; isFixed: boolean }[];
  /** Acciones disponibles en esta estación de crafteo */
  availableActions: import('./game').CraftAction[];
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
  sfx?: string;
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
  sfx?: string;
}

// --- TimedChoice ---

export interface TimedChoicePrompt {
  type: 'timed_choice_prompt';
  options: { text: string; index: number }[];
  duration: number;
  defaultIndex: number;
  timeoutText?: string;
}

// --- LevelUp ---

export interface LevelUpPrompt {
  type: 'level_up_prompt';
  characterId: string;
  characterName: string;
  newLevel: number;
  skillPoints: number;
  availableSkills: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    currentLevel: number;
    maxLevel: number;
    cost: number;
    canLearn: boolean; // tiene suficientes puntos y prereqs
    prerequisites?: string[];
    passiveBonus?: Record<string, number>;
  }[];
  description?: string;
}

export interface LevelUpResult {
  type: 'level_up_result';
  characterName: string;
  newLevel: number;
  skillsLearned: { name: string; level: number }[];
}

export interface RelationshipChangeResult {
  type: 'relationship_change';
  characterId: string;
  characterName: string;
  oldAffinity: number;
  newAffinity: number;
  tier: string;
  tierChanged: boolean;
}

export interface TraitChangeResult {
  type: 'trait_change';
  added: { id: string; name: string; icon?: string }[];
  removed: { id: string; name: string }[];
}

export interface XpGainResult {
  type: 'xp_gain';
  characterId: string;
  characterName: string;
  amount: number;
  totalXp: number;
  leveledUp: boolean;
  newLevel?: number;
}

// Acciones del jugador enviadas al motor
export type PlayerAction =
  | { type: 'choose'; index: number }
  | { type: 'roll_dice' }
  | { type: 'submit_input'; value: string }
  /** Acción libre escrita directamente en una decisión con freeIndex */
  | { type: 'choice_free'; text: string }
  | { type: 'continue' }
  | { type: 'shop_buy'; itemIndex: number }
  | { type: 'shop_sell'; itemId: string }
  | { type: 'shop_haggle'; itemIndex: number }
  | { type: 'shop_steal'; itemIndex: number }
  | { type: 'shop_deceive'; itemId: string }
  | { type: 'shop_exit' }
  | { type: 'combat_action'; action: string }
  | { type: 'craft_combine'; items: string[] }
  | { type: 'craft_use'; tool: string; ingredients: string[] }
  | { type: 'craft_apply'; substance: string; target: string }
  | { type: 'craft_cut'; tool: string; target: string }
  | { type: 'craft_chop'; tool: string; target: string }
  | { type: 'craft_pickup'; index: number }
  | { type: 'craft_exit' }
  | { type: 'puzzle_attempt'; answer: string | string[] }
  | { type: 'puzzle_exit' }
  | { type: 'examine_select'; subjectId: string }
  | { type: 'examine_exit' }
  | { type: 'use_item_on'; itemId: string; targetId: string }
  | { type: 'use_item_exit' }
  | { type: 'level_up_skill'; skillId: string }
  | { type: 'level_up_done' }
  | { type: 'chat_message'; text: string }
  | { type: 'chat_giveup' };
