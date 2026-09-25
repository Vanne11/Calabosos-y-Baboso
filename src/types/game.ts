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
  /** Configuración del sistema de guardado */
  saveSystem?: SaveSystemConfig;
  /** Definición de stats visibles en la barra de estado (si no se define, usa etiquetas por defecto) */
  statDefs?: Record<string, StatDef>;
  /** Archivos de escenas (relativos al juego). Si no se define, se usa scenes.json */
  sceneFiles?: string[];
  /** Clasificación de contenido: activa el control de edad antes de "start" */
  contentRating?: ContentRating;
  /** Listas de frases reutilizables (burlas, reacciones) para dialog.pool y hooks */
  linePools?: Record<string, PoolLine[]>;
  /** Reglas automáticas por umbral de stats/flags/meta */
  statRules?: StatRule[];
  /** Reacciones del narrador a resultados de dados */
  diceHooks?: Partial<Record<'critical_success' | 'success' | 'failure' | 'critical_failure', DiceHook>>;
  /** Modificadores globales de tiradas (ej: el miedo resta) */
  diceModifiers?: DiceModifierDef[];
  /** Servidor de IA (narración y modos chat). Sin esto el juego no usa IA */
  ai?: AiConfig;
  /** Códice (bestiario, diario...): entradas que se desbloquean con effects.unlockCodex */
  codex?: CodexConfig;
  /** Música de situaciones y efectos automáticos (ver docs/audio.md) */
  audio?: AudioConfig;
  /** Género del protagonista para los textos {masculino|femenino|neutro} (ver docs/narrativa.md) */
  gender?: GenderConfig;
}

/**
 * Formas de género en los textos: "{héroe|heroína|heroe}", "elegid{o|a|e}". La stat elige la forma:
 * forms = { "masculino": 0, "femenino": 1, "no_binario": 2 }. Sin valor (o con uno desconocido) se usa la 0;
 * si el texto trae menos formas que el índice, también la 0.
 */
export interface GenderConfig {
  stat: string;
  forms: Record<string, number>;
  /** Cómo se lo explica el servidor a la IA, por valor de la stat ("Alex es mujer: háblale en femenino...") */
  ai?: Record<string, string>;
}

export interface AudioConfig {
  /** Música por defecto de los combates (un paso combat puede traer la suya en `music`) */
  combatMusic?: string;
  /** Música al llegar a _game_over */
  gameOverMusic?: string;
  /** Efecto al cambiar cada stat: { "ganas_de_vivir": { "down": "dano", "up": "curar", "shake": true } } */
  statSfx?: Record<string, StatSfxRule>;
  /** Efecto al conseguir un objeto (por defecto "objeto") */
  itemSfx?: string;
  /** Efecto al perder un objeto (por defecto ninguno) */
  removeItemSfx?: string;
  /** Tono marcado por la IA → efecto (cambia los de src/audio/tones.ts; "none" = silencio) */
  toneSfx?: Record<string, string>;
}

export interface StatSfxRule {
  up?: string;
  down?: string;
  /** Una bajada de al menos `amount` usa este efecto en vez de `down` */
  bigDown?: { amount: number; sfx: string };
  /** Una subida de al menos `amount` usa este efecto en vez de `up` */
  bigUp?: { amount: number; sfx: string };
  /** Bajar sacude la pantalla y la tiñe de rojo (la vida) */
  shake?: boolean;
  /** Destello al subir */
  flashUp?: 'heal' | 'gold';
}

export interface CodexConfig {
  /** Comando in-game para abrirlo, sin "/" (ej: "bestiario") */
  command: string;
  /** Título que se muestra (ej: "Bestiario Baboso") */
  title: string;
  entries: Record<string, CodexEntry>;
}

export interface CodexEntry {
  title: string;
  text: string;
  icon?: string;
  /** Agrupa entradas en la vista (ej: "Especies", "Personajes") */
  category?: string;
}

export interface StatDef {
  /** Nombre visible */
  label: string;
  /** Emoji opcional antes del nombre */
  icon?: string;
  /** Ocultar de la barra de estado (sigue usable en condiciones/dados) */
  hidden?: boolean;
  /** Valor mínimo: el motor recorta la stat tras cada efecto */
  min?: number;
  /** Valor máximo: el motor recorta la stat tras cada efecto */
  max?: number;
}

/** Línea de un pool: texto simple o texto con condición/peso */
export type PoolLine = string | { text: string; condition?: StepCondition; weight?: number };

/** Regla automática: se evalúa después de cada paso (ej: pis >= 100 → accidente) */
export interface StatRule {
  id: string;
  condition: StepCondition;
  /** Solo una vez por partida (default: false; la regla debe desactivarse con sus efectos) */
  once?: boolean;
  /** Personaje que habla (default: el narrador) */
  character?: string;
  lines?: string[];
  pool?: string;
  effects?: Effects;
  goto?: string;
}

/** Reacción del narrador a un resultado de dado */
export interface DiceHook {
  pool: string;
  /** Probabilidad de que se dispare (0-1, default: 1) */
  chance?: number;
  character?: string;
}

/** Modificador global de tiradas según una stat: floor(stat / per) * amount */
export interface DiceModifierDef {
  stat: string;
  per: number;
  amount: number;
}

export type ChatMode = 'persuadir' | 'negociar' | 'cancion' | 'rap' | 'insultos' | 'confesion';

/** Resultado de un modo chat (o de su tirada de respaldo) */
export interface ChatOutcome {
  text?: string;
  effects?: Effects;
  goto?: string;
}

/** Modo chat: el jugador escribe libremente y un NPC responde (IA en el servidor) */
export interface AiChatStep {
  type: 'ai_chat';
  mode: ChatMode;
  /** Personaje que habla (id en characters) */
  npc: string;
  /** Líneas fijas del NPC antes de que el jugador escriba */
  intro?: string[];
  /** Variables para el prompt del modo. Admiten {stat} y {meta.clave} */
  vars?: Record<string, string>;
  maxTurns?: number;
  /** Nombre del medidor (default según el modo) */
  meterLabel?: string;
  /** Guarda la conversación como texto en esta stat (ej: la canción con Nerly) */
  saveAs?: string;
  /** success/partial/failure según el veredicto; done para modos sin veredicto */
  outcomes: Partial<Record<'success' | 'partial' | 'failure' | 'done', ChatOutcome>>;
  /** Tirada que decide si no hay IA (éxito → success, fallo → failure) */
  fallback: { stat: string; difficulty: number; faces?: number; description?: string };
  /** Gestos que el NPC puede hacer a mitad de la conversación (la IA elige; cada uno una vez) */
  gestures?: Record<string, ChatGesture>;
  condition?: StepCondition;
}

/** Gesto de un NPC en un chat: la IA decide cuándo, el juego define qué pasa */
export interface ChatGesture {
  /** Cuándo hacerlo (lo lee la IA, desde el NPC): "le tira la cerveza encima a Alex" */
  hint: string;
  /** Aviso en pantalla (default: el hint) */
  text?: string;
  effects?: Effects;
}

/** Configuración de IA del juego */
export interface AiConfig {
  /** URL base del servidor de IA (default: la carpeta api/ dentro del juego, ej. "/cyb/api/") */
  endpoint?: string;
  /** Valores por defecto de la acción libre (cada choice.freeText puede cambiarlos) */
  freeText?: FreeTextDef;
  /** Probabilidad (0-1) de que el narrador comente una decisión con tags (default: 0) */
  reactChance?: number;
  /**
   * Charla libre: lo que el jugador escribe que no es comando lo contesta quien esté (el nombrado, el último
   * personaje que habló en la escena, el acompañante o el narrador). No avanza la historia. false = desactivada
   */
  talk?: false | TalkDef;
}

export interface TalkDef {
  /** Charlas por escena (default: 3) */
  perScene?: number;
  /** Charlas por partida (default: 40) */
  maxUses?: number;
  /** Prompt del narrador (narrate.<prompt>, default: "charla") */
  prompt?: string;
  /** Prompt de los demás personajes (default: "charla_npc") */
  npcPrompt?: string;
}

/** Acción libre en una decisión: la IA lleva lo escrito a una opción o a una consecuencia de la lista */
export interface FreeTextDef {
  /** Texto de la opción extra (default: "✍️ Hacer otra cosa…") */
  label?: string;
  /** Pregunta al pedir el texto (default: "¿Qué haces? Escríbelo con tus palabras.") */
  prompt?: string;
  /** Situación para la IA. Admite {variables}. Default: nombre y descripción del escenario */
  situation?: string;
  /** Consecuencias que puede elegir la IA si no es ninguna opción (se suman a las de ai.freeText) */
  consequences?: Record<string, FreeTextConsequence>;
  /** Cuántas acciones libres se permiten en esta decisión (default: 2) */
  maxUses?: number;
  /** Prompt del servidor (libre.<prompt>, default: "accion") */
  aiPrompt?: string;
}

export interface FreeTextConsequence {
  /** Cuándo aplica (lo lee la IA): "hace el ridículo delante de todos" */
  hint: string;
  effects?: Effects;
}

export interface ContentRating {
  /** Edad mínima requerida (ej: 18) */
  minAge: number;
  /** Advertencias que el narrador menciona en el control de edad */
  warnings?: string[];
  /** Escena propia del juego para el control de edad (default: "_age_gate" genérica).
   *  Debe navegar a "_age_accept" para aceptar. */
  gateScene?: string;
}

export interface SaveSystemConfig {
  /** Modo de guardado: "free" (manual) o "checkpoint" (automático en escenas clave) */
  mode?: 'free' | 'checkpoint';
  /** Número de slots disponibles (1-10, default: 3) */
  slots?: number;
  /** Permitir sobreescribir slots ocupados (default: true) */
  allowOverwrite?: boolean;
  /** Escenas donde se autoguarda (solo en modo checkpoint) */
  checkpointScenes?: string[];
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
  /** Ficha para la IA: cómo habla y qué lo mueve (ver docs/ia.md) */
  ai?: CharacterAi;
  /** false = no contesta en la charla libre aunque aparezca en la escena (ej. una lápida) */
  talkable?: boolean;
}

/** Ficha de personaje para la IA. Todo es opcional; los ejemplos son lo que más define la voz */
export interface CharacterAi {
  /** Cómo habla: registro, ritmo, manías */
  voz?: string;
  /** Palabras o frases que repite */
  muletillas?: string[];
  /** Qué quiere (en general o de Alex) */
  quiere?: string;
  /** A qué le teme o qué lo saca de quicio */
  teme?: string;
  /** Algo que oculta (la IA lo insinúa, no lo dice directo) */
  secreto?: string;
  /** Frases de ejemplo con su voz */
  ejemplos?: string[];
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
  /**
   * Ambiente en bucle bajo la música (lluvia, cueva...). "none" lo apaga.
   * Si no se indica: una escena con `music` propia lo apaga; una sin `music` mantiene el anterior.
   */
  ambience?: string;
  /** Efecto(s) al entrar en la escena (del catálogo: "puerta", "explosion"...) */
  sfx?: string | string[];
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
  | LevelUpStep
  | AiChatStep;

export interface StepCondition {
  stats?: Record<string, string>; // e.g. { "perception": ">=50" }
  flags?: Record<string, boolean>;
  inventory?: string[];
  /** Items que NO deben estar en el inventario */
  notInventory?: string[];
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
  /** Contadores meta (persisten entre partidas): { "muertes": ">=3" } */
  meta?: Record<string, string>;
  /** Stats de texto que coinciden con una expresión regular (sin distinguir mayúsculas):
   *  { "nombre_jugador": "^bob$" } */
  textMatches?: Record<string, string>;
  /** Perfil del jugador (etiquetas acumuladas por decisiones): { "cobarde": ">=3" } */
  profile?: Record<string, string>;
  /** Entradas del códice desbloqueadas */
  codex?: string[];
}

export interface DialogStep {
  type: 'dialog';
  character: string;
  /** Líneas fijas. Admiten variables: {nombre_jugador}, {meta.muertes} */
  lines: string[];
  /** Lista de frases (game.json → linePools) de la que sacar líneas al azar, sin repetir */
  pool?: string;
  /** Cuántas líneas sacar del pool (default: 1). Se muestran después de `lines` */
  count?: number;
  /** Línea generada por IA (reemplaza lines + pool si responde; si no, se usan como respaldo) */
  ai?: DialogAi;
  condition?: StepCondition;
}

/** Narración con IA: nombre del prompt en el servidor (narrate.<prompt>) y variables */
export interface DialogAi {
  prompt: string;
  /** Guarda la línea generada en la memoria de la IA con este prefijo: "su lápida decía" */
  remember?: string;
  /** Variables para el prompt. Admiten {stat} y {meta.clave} */
  vars?: Record<string, string>;
}

export interface ChoiceOption {
  text: string;
  /** Probabilidad (0-1) de que el narrador con IA comente esta decisión (pisa a la del paso y a ai.reactChance) */
  aiReact?: number;
  effects?: Effects;
  goto?: string;
  condition?: StepCondition;
  /** Etiquetas de perfil que suma esta decisión (ej: ["cobarde"]) */
  tags?: string[];
  /** Efecto que suena al elegirla ("puerta", "pedo"...) */
  sfx?: string;
}

export interface ChoiceStep {
  type: 'choice';
  options: ChoiceOption[];
  /** Acción libre: además de las opciones, el jugador puede escribir lo que quiere hacer (con IA) */
  freeText?: boolean | FreeTextDef;
  /** Probabilidad (0-1) de que el narrador comente la decisión elegida (pisa a ai.reactChance) */
  aiReact?: number;
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
  /** Efecto que suena con este resultado (además del de éxito/fallo) */
  sfx?: string;
}

export interface DiceStep {
  type: 'dice';
  stat: string;
  difficulty: number;
  faces: number;
  description: string;
  results: DiceResults;
  /** Tramos por resultado (tienen prioridad sobre results). Se elige el primero que coincida:
   *  `natural` compara el dado sin modificador; `min`/`max` comparan el total (dado + modificador). */
  tiers?: DiceTier[];
  condition?: StepCondition;
}

export interface DiceTier {
  natural?: number;
  min?: number;
  max?: number;
  text: string;
  effects?: Effects;
  goto?: string;
  sfx?: string;
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
  /** Efecto que suena con este resultado */
  sfx?: string;
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
  /** Dueño de la tienda (recuerda lo que compraste, regateaste o robaste). Default: el último que habló en el lugar */
  npc?: string;
  currency: string; // stat usada como moneda
  items: ShopItem[];
  sellable?: boolean;
  sellRatio?: number; // 0-1, porcentaje del precio al vender
  haggle?: ShopDiceAction;    // regatear precios
  steal?: ShopDiceAction;     // intentar robar
  deceive?: ShopDiceAction;   // engañar al vender (precio inflado)
  /** Multiplicador de precios según condición (el primero que se cumpla). Ej: descuento por regateo previo */
  priceMultipliers?: { condition: StepCondition; multiplier: number; text?: string }[];
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
  /** Armas: se usa la de mayor bonus que tenga el jugador (suma daño al atacar) */
  weapons?: CombatWeapon[];
  results: CombatResults;
  /** Música de este combate (si no, audio.combatMusic del juego). "none" = no cambiarla */
  music?: string;
  condition?: StepCondition;
}

export interface CombatEnemy {
  name: string;
  image?: string;
  hp: number;
  attack: number;
  defense: number;
  /** Ataca una vez antes del primer turno del jugador */
  firstStrike?: boolean;
  firstStrikeText?: string;
  /** Probabilidad (0-1) de esquivar ataques normales. Un item con reveal la anula */
  dodgeChance?: number;
  /** Daño extra al jugador cada ronda (ácido, veneno) */
  damagePerTurn?: number;
  damagePerTurnText?: string;
  /** Armas (item ids) que puede destruir cuando la atacas con ellas */
  corrodes?: string[];
  /** Probabilidad (0-1) de destruir el arma en cada ataque (default 0.5) */
  corrodeChance?: number;
  /** Al llegar a 0 HP se divide una vez y vuelve con este HP (salvo item con preventSplit) */
  split?: { hp: number; text: string };
  /** Daño al jugador si muere por un ataque cuerpo a cuerpo (los items la matan sin riesgo) */
  deathDamage?: number;
  deathText?: string;
  /** Sonidos propios: al golpearlo (si no, espada) y al morir (si no, muere_enemigo) */
  sfx?: { hit?: string; death?: string };
}

export interface CombatWeapon {
  itemId: string;
  name: string;
  /** Daño extra al atacar */
  bonus: number;
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
  /** Revela al enemigo: anula su dodgeChance el resto del combate (luz contra fantasmas) */
  reveal?: boolean;
  /** Si mata al enemigo con este item, no se divide (sal contra gemelas) */
  preventSplit?: boolean;
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
  /** Efecto que suena (por defecto uno según el estilo; "none" = silencio) */
  sfx?: string;
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
  /** Archivo de audio del juego (one-shot) */
  src?: string;
  /** Efecto sintetizado del catálogo (alternativa a src): "puerta", "explosion", "pifia"... */
  sfx?: string;
  volume?: number; // 0-1
  /** Esperar a que termine antes de seguir (por defecto no espera) */
  wait?: boolean;
  condition?: StepCondition;
}

// --- Craft: combinar items del inventario/mesa ---

export interface CraftStep {
  type: 'craft';
  description?: string;
  /** Items disponibles sobre la mesa de crafting (IDs de item) */
  tableItems?: string[];
  recipes: CraftRecipe[];
  failText?: string;
  goto?: string;
  condition?: StepCondition;
}

/** Tipos de acción de crafteo */
export type CraftAction = 'combine' | 'use' | 'apply' | 'cut' | 'chop';

export interface CraftRecipe {
  /** Tipo de acción:
   *  combine (+)  — mezclar items
   *  use ()       — meter en herramienta (olla, alambique, desatornillador arma)
   *  apply (>)    — untar/aplicar sustancia sobre objetivo
   *  cut (/)      — cortar/desarmar con herramienta
   *  chop (//)    — picar/triturar con herramienta
   */
  action?: CraftAction;
  /** Para 'use'/'cut'/'chop': ID del item-herramienta */
  tool?: string;
  /** Para 'combine'/'use': IDs de ingredientes */
  ingredients: string[];
  /** Para 'apply': ID de la sustancia (grasa, veneno, pintura...) */
  substance?: string;
  /** Para 'apply'/'cut'/'chop': ID del item objetivo */
  target?: string;
  result: string;
  /** Items adicionales producidos (ej: desarmar un reloj → engranaje + muelle + carcasa) */
  bonusResults?: string[];
  text: string;
  /** Consumir ingredientes/objetivo al craftear (default: true) */
  consume?: boolean;
  /** Consumir la herramienta/sustancia al usarla (default: false) */
  consumeTool?: boolean;
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
  /** Efecto que suena al examinarlo */
  sfx?: string;
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
  /** Efecto que suena al usarlo con éxito (si no, el de éxito genérico) */
  sfx?: string;
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
  /** Sumar a contadores meta que persisten entre partidas: { "muertes": 1 } */
  meta?: Record<string, number>;
  /** Desbloquear entradas del códice (bestiario): ["babosa_acida"] */
  unlockCodex?: string[];
  /** Guardar un punto de control en la escena actual (se vuelve con goto "_checkpoint") */
  checkpoint?: boolean;
  /** Hecho para la memoria de la IA ("se meó frente al rey"). Admite {variables} */
  memo?: string | string[];
  /** Hecho para la memoria de un personaje (lo recuerda en sus chats): { "nerly": "Alex le echó sal" } */
  npcMemo?: Record<string, string>;
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
