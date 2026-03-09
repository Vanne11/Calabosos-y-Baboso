// engine/GameEngine.ts
// Motor del juego puro TypeScript con generadores
// React consume los StepResults a su ritmo

import type {
  GameManifest,
  ScenesFile,
  Scene,
  SequenceStep,
  ChoiceOption,
  DiceStep,
  CombatStep,
  ShopStep,
  CraftStep,
  PuzzleStep,
  ExamineStep,
  UseItemStep,
  TimedChoiceStep,
  LevelUpStep,
  DEFAULT_RELATIONSHIP_TIERS,
} from '../types/game';
import type { PlayerState, StepResult, PlayerAction, CharacterState } from '../types/engine';
import { evaluateCondition } from './ConditionEvaluator';
import { applyEffects } from './EffectsApplier';
import { resolveRoll } from './DiceRoller';

export class GameEngine {
  private manifest: GameManifest;
  private scenes: ScenesFile;
  private _basePath: string;
  private _state: PlayerState;
  private _currentScene: string = '';
  private _pendingAction: PlayerAction | null = null;
  private _actionResolver: ((action: PlayerAction) => void) | null = null;

  constructor(manifest: GameManifest, scenes: ScenesFile, basePath: string = '') {
    this.manifest = manifest;
    this.scenes = scenes;
    this._basePath = basePath;
    this._state = this.createInitialState();
  }

  get state(): PlayerState {
    return this._state;
  }

  /** Reset the engine to initial state (for _restart) */
  reset(): void {
    this._state = this.createInitialState();
    this._currentScene = '';
    this._pendingAction = null;
    this._actionResolver = null;
  }

  get currentScene(): string {
    return this._currentScene;
  }

  get characters() {
    return this.manifest.characters;
  }

  get gameName() {
    return this.manifest.name;
  }

  get items() {
    return this.manifest.items || {};
  }

  get currentSceneImage(): string | undefined {
    return this.scenes.scenes[this._currentScene]?.scenario?.image;
  }

  get currentSceneMusic(): string | undefined {
    return this.scenes.scenes[this._currentScene]?.scenario?.music;
  }

  private createInitialState(): PlayerState {
    // Initialize character states from manifest
    const characters: Record<string, CharacterState> = {};
    for (const [charId, charDef] of Object.entries(this.manifest.characters)) {
      if (charDef.role === 'protagonist' || charDef.role === 'companion') {
        characters[charId] = {
          level: 1,
          xp: 0,
          skillPoints: 0,
          skills: {},
          traits: charDef.initialTraits ? [...charDef.initialTraits] : [],
          stats: charDef.baseStats ? { ...charDef.baseStats } : {},
        };
      }
    }

    return {
      stats: { ...this.manifest.initialStats },
      flags: { ...this.manifest.initialFlags },
      inventory: [...this.manifest.initialInventory],
      visitedScenes: [],
      time: {
        phase: this.manifest.time.initial,
        actions: 0,
        cycles: 0,
      },
      characters,
      relationships: {},
      activeTraits: [],
      sceneCount: 0,
    };
  }

  // Wait for a player action (used by generator)
  private waitForAction(): Promise<PlayerAction> {
    // If an action was buffered before the generator reached this point, resolve immediately
    if (this._pendingAction) {
      const action = this._pendingAction;
      this._pendingAction = null;
      return Promise.resolve(action);
    }
    return new Promise<PlayerAction>((resolve) => {
      this._actionResolver = resolve;
    });
  }

  // Send a player action to the engine
  sendAction(action: PlayerAction): void {
    if (this._actionResolver) {
      const resolver = this._actionResolver;
      this._actionResolver = null;
      resolver(action);
    } else {
      // Buffer the action for when waitForAction() is called
      this._pendingAction = action;
    }
  }

  // Main generator: enter a scene and yield results
  async *enterScene(sceneId: string): AsyncGenerator<StepResult> {
    const scene = this.scenes.scenes[sceneId];
    if (!scene) {
      yield {
        type: 'dialog',
        character: 'sistema',
        characterName: 'SISTEMA',
        lines: [`Error: Escena "${sceneId}" no encontrada.`],
      };
      return;
    }

    this._currentScene = sceneId;
    this._state.visitedScenes = [...this._state.visitedScenes, sceneId];
    this._state.sceneCount = (this._state.sceneCount || 0) + 1;

    // Expire temporary traits
    this.expireTraits();

    // Yield scenario if present
    if (scene.scenario) {
      const description = this.getScenarioDescription(scene);
      yield {
        type: 'scenario',
        name: scene.scenario.name,
        description,
        image: scene.scenario.image,
        music: scene.scenario.music,
      };
    }

    // Process sequence steps
    for (const step of scene.sequence) {
      // Check condition
      if (step.condition && !evaluateCondition(step.condition, this._state)) {
        continue;
      }

      const result = yield* this.processStep(step);

      // If processStep signals navigation, handle it
      if (result && result.type === 'navigate') {
        yield result;
        return; // Stop processing this scene
      }
    }
  }

  private getScenarioDescription(scene: Scene): string {
    if (!scene.scenario) return '';
    if (scene.scenario.variants) {
      const phase = this._state.time.phase;
      return (
        scene.scenario.variants[phase] ||
        scene.scenario.variants[Object.keys(scene.scenario.variants)[0]] ||
        ''
      );
    }
    return scene.scenario.description || '';
  }

  private async *processStep(
    step: SequenceStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    switch (step.type) {
      case 'dialog':
        yield {
          type: 'dialog',
          character: step.character,
          characterName: this.getCharacterName(step.character),
          characterImage: this.manifest.characters[step.character]?.image,
          lines: step.lines,
        };
        break;

      case 'choice': {
        // Filter visible options
        const visibleOptions = step.options.filter(
          (opt) => !opt.condition || evaluateCondition(opt.condition, this._state)
        );

        yield {
          type: 'choice_prompt',
          options: visibleOptions.map((opt, i) => ({
            text: opt.text,
            index: i,
          })),
        };

        // Wait for player choice
        const action = await this.waitForAction();
        if (action.type === 'choose') {
          const chosen = visibleOptions[action.index];
          if (chosen) {
            return yield* this.handleChoiceResult(chosen);
          }
        }
        break;
      }

      case 'dice': {
        yield {
          type: 'dice_prompt',
          description: step.description,
          stat: step.stat,
          difficulty: step.difficulty,
          faces: step.faces,
        };

        // Wait for roll action
        await this.waitForAction();

        // Resolve the roll
        const statVal =
          typeof this._state.stats[step.stat] === 'number'
            ? (this._state.stats[step.stat] as number)
            : 0;
        const result = resolveRoll(step.faces, statVal, step.difficulty);

        // Get outcome text and effects
        const outcomeData = this.getDiceOutcome(step, result.outcome);

        // Apply effects
        if (outcomeData.effects) {
          this._state = applyEffects(this._state, outcomeData.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcomeData.effects };
        }

        yield {
          type: 'dice_result',
          roll: result.roll,
          modifier: result.modifier,
          total: result.total,
          difficulty: step.difficulty,
          outcome: result.outcome,
          text: outcomeData.text,
        };

        // Navigate if needed
        if (outcomeData.goto) {
          return { type: 'navigate' as const, scene: outcomeData.goto };
        }
        break;
      }

      case 'input': {
        yield {
          type: 'input_prompt',
          prompt: step.prompt,
        };

        const inputAction = await this.waitForAction();
        if (inputAction.type === 'submit_input') {
          // Save the input value
          this._state = applyEffects(this._state, {
            stats: { [step.saveAs]: inputAction.value },
          });
          this.syncSpecialStats();
        }

        if (step.goto) {
          return { type: 'navigate' as const, scene: step.goto };
        }
        break;
      }

      case 'effects':
        this._state = applyEffects(this._state, step.effects);
        this.syncSpecialStats();
        yield { type: 'effects', ...step.effects };
        break;

      case 'branch': {
        for (const branch of step.branches) {
          if (!branch.condition || evaluateCondition(branch.condition, this._state)) {
            return { type: 'navigate' as const, scene: branch.goto };
          }
        }
        break;
      }

      case 'random': {
        const totalWeight = step.outcomes.reduce((sum, o) => sum + o.weight, 0);
        let rand = Math.random() * totalWeight;
        let chosen = step.outcomes[0];
        for (const outcome of step.outcomes) {
          rand -= outcome.weight;
          if (rand <= 0) { chosen = outcome; break; }
        }

        yield { type: 'random_result', text: chosen.text };

        if (chosen.effects) {
          this._state = applyEffects(this._state, chosen.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...chosen.effects };
        }
        if (chosen.goto) {
          return { type: 'navigate' as const, scene: chosen.goto };
        }
        break;
      }

      case 'check': {
        const checkVal = typeof this._state.stats[step.stat] === 'number'
          ? (this._state.stats[step.stat] as number) : 0;
        const passed = this.evaluateThreshold(checkVal, step.threshold);
        const outcome = passed ? step.success : step.failure;

        yield {
          type: 'check_result',
          description: step.description,
          stat: step.stat,
          statValue: checkVal,
          threshold: step.threshold,
          passed,
          text: outcome.text,
        };

        if (outcome.effects) {
          this._state = applyEffects(this._state, outcome.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcome.effects };
        }
        if (outcome.goto) {
          return { type: 'navigate' as const, scene: outcome.goto };
        }
        break;
      }

      case 'shop': {
        const result = yield* this.processShop(step);
        if (result) return result;
        break;
      }

      case 'combat': {
        const result = yield* this.processCombat(step);
        if (result) return result;
        break;
      }

      case 'notify': {
        if (step.effects) {
          this._state = applyEffects(this._state, step.effects);
          this.syncSpecialStats();
        }
        yield {
          type: 'notify',
          style: step.style,
          title: step.title,
          text: step.text,
          icon: step.icon,
        };
        break;
      }

      case 'wait':
        yield {
          type: 'wait',
          text: step.text,
          duration: step.duration,
          style: step.style,
        };
        break;

      case 'sound':
        yield {
          type: 'sound',
          src: this._basePath && step.src && !step.src.startsWith(this._basePath)
            ? `${this._basePath}/${step.src}` : step.src,
          volume: step.volume ?? 1,
        };
        break;

      case 'craft': {
        const result = yield* this.processCraft(step);
        if (result) return result;
        break;
      }

      case 'puzzle': {
        const result = yield* this.processPuzzle(step);
        if (result) return result;
        break;
      }

      case 'examine': {
        const result = yield* this.processExamine(step);
        if (result) return result;
        break;
      }

      case 'use_item': {
        const result = yield* this.processUseItem(step);
        if (result) return result;
        break;
      }

      case 'timed_choice': {
        const result = yield* this.processTimedChoice(step);
        if (result) return result;
        break;
      }

      case 'level_up': {
        const result = yield* this.processLevelUp(step);
        if (result) return result;
        break;
      }
    }
  }

  private evaluateThreshold(value: number, threshold: string): boolean {
    const match = threshold.match(/^(>=|<=|>|<|==)\s*(\d+)$/);
    if (!match) return false;
    const [, op, numStr] = match;
    const num = parseInt(numStr, 10);
    switch (op) {
      case '>=': return value >= num;
      case '<=': return value <= num;
      case '>': return value > num;
      case '<': return value < num;
      case '==': return value === num;
      default: return false;
    }
  }

  private async *processShop(
    step: ShopStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const currency = step.currency;
    const sellRatio = step.sellRatio ?? 0.5;

    // Shop loop
    while (true) {
      const currentMoney = typeof this._state.stats[currency] === 'number'
        ? (this._state.stats[currency] as number) : 0;

      yield {
        type: 'shop_prompt',
        title: step.title,
        currency,
        currentMoney,
        items: step.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          description: item.description,
          canAfford: currentMoney >= item.price,
        })),
        sellable: step.sellable ?? false,
        playerInventory: [...this._state.inventory],
        sellRatio,
      };

      const action = await this.waitForAction();

      if (action.type === 'shop_buy') {
        const item = step.items[action.itemIndex];
        if (item && currentMoney >= item.price) {
          this._state = applyEffects(this._state, {
            stats: { [currency]: -item.price },
            inventory: [item.id],
          });
          if (item.effects) {
            this._state = applyEffects(this._state, item.effects);
          }
          this.syncSpecialStats();
          yield { type: 'effects', stats: { [currency]: -item.price }, inventory: [item.id] };
        }
      } else if (action.type === 'shop_sell' && step.sellable) {
        // Find item price from shop items or use a default
        const shopItem = step.items.find((si) => si.id === action.itemId);
        const sellPrice = shopItem ? Math.floor(shopItem.price * sellRatio) : 1;
        if (this._state.inventory.includes(action.itemId)) {
          this._state = applyEffects(this._state, {
            stats: { [currency]: sellPrice },
            removeInventory: [action.itemId],
          });
          this.syncSpecialStats();
          yield { type: 'effects', stats: { [currency]: sellPrice }, removeInventory: [action.itemId] };
        }
      } else if (action.type === 'shop_exit') {
        break;
      }
    }

    if (step.goto) {
      return { type: 'navigate' as const, scene: step.goto };
    }
  }

  private async *processCombat(
    step: CombatStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    let enemyHp = step.enemy.hp;
    const enemyMaxHp = step.enemy.hp;
    let round = 0;

    while (true) {
      round++;
      const playerHp = typeof this._state.stats[step.playerStat] === 'number'
        ? (this._state.stats[step.playerStat] as number) : 0;

      if (playerHp <= 0) {
        // Defeat
        const outcome = step.results.defeat;
        yield { type: 'combat_end', outcome: 'defeat', text: outcome.text };
        if (outcome.effects) {
          this._state = applyEffects(this._state, outcome.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcome.effects };
        }
        if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
        break;
      }

      if (enemyHp <= 0) {
        // Victory
        const outcome = step.results.victory;
        yield { type: 'combat_end', outcome: 'victory', text: outcome.text };
        if (outcome.effects) {
          this._state = applyEffects(this._state, outcome.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcome.effects };
        }
        if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
        break;
      }

      // Build list of usable items for this combat
      const usableItems = (step.combatItems || [])
        .filter((ci) => this._state.inventory.includes(ci.itemId))
        .map((ci) => ({ itemId: ci.itemId, name: ci.name }));

      // Prompt player action
      yield {
        type: 'combat_prompt',
        enemyName: step.enemy.name,
        enemyImage: step.enemy.image,
        enemyHp,
        enemyMaxHp,
        playerHp,
        actions: step.actions,
        round,
        usableItems: usableItems.length > 0 ? usableItems : undefined,
      };

      const action = await this.waitForAction();
      if (action.type !== 'combat_action') continue;

      if (action.action === 'flee' && step.results.flee) {
        const outcome = step.results.flee;
        yield { type: 'combat_end', outcome: 'flee', text: outcome.text };
        if (outcome.effects) {
          this._state = applyEffects(this._state, outcome.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcome.effects };
        }
        if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
        break;
      }

      // Resolve turn
      const attackStat = typeof this._state.stats[step.attackStat] === 'number'
        ? (this._state.stats[step.attackStat] as number) : 10;
      const defenseStat = step.defenseStat && typeof this._state.stats[step.defenseStat] === 'number'
        ? (this._state.stats[step.defenseStat] as number) : 0;

      let playerDamage = 0;
      let enemyDamage = 0;
      let turnText = '';

      if (action.action.startsWith('use_item:')) {
        // Use item in combat
        const itemId = action.action.slice(9); // "use_item:sal_anti_babosas" -> "sal_anti_babosas"
        const combatItem = (step.combatItems || []).find((ci) => ci.itemId === itemId);

        if (combatItem && this._state.inventory.includes(itemId)) {
          // Apply item damage to enemy
          if (combatItem.damage) {
            playerDamage = combatItem.damage;
            enemyHp = Math.max(0, enemyHp - playerDamage);
          }

          // Apply item heal to player
          if (combatItem.heal) {
            this._state = applyEffects(this._state, { stats: { [step.playerStat]: combatItem.heal } });
            this.syncSpecialStats();
          }

          // Consume item (default true)
          if (combatItem.consume !== false) {
            this._state = applyEffects(this._state, { removeInventory: [itemId] });
          }

          // Apply extra effects
          if (combatItem.effects) {
            this._state = applyEffects(this._state, combatItem.effects);
            this.syncSpecialStats();
          }

          turnText = combatItem.text;

          // Enemy still attacks (but doesn't if item killed it)
          if (enemyHp > 0) {
            const enemyBaseDmg = Math.max(1, step.enemy.attack - Math.floor(defenseStat / 20));
            enemyDamage = Math.max(1, enemyBaseDmg + Math.floor(Math.random() * 4));
            this._state = applyEffects(this._state, { stats: { [step.playerStat]: -enemyDamage } });
            this.syncSpecialStats();
            turnText += ` ${step.enemy.name} contraataca por ${enemyDamage}.`;
          }
        }
      } else if (action.action === 'attack') {
        // Player attacks: base damage from attackStat/10 + random
        const baseDmg = Math.max(1, Math.floor(attackStat / 10));
        playerDamage = baseDmg + Math.floor(Math.random() * 6) + 1;
        enemyHp = Math.max(0, enemyHp - playerDamage);

        // Enemy attacks back
        const enemyBaseDmg = Math.max(1, step.enemy.attack - Math.floor(defenseStat / 20));
        enemyDamage = Math.max(1, enemyBaseDmg + Math.floor(Math.random() * 4));
        this._state = applyEffects(this._state, { stats: { [step.playerStat]: -enemyDamage } });
        this.syncSpecialStats();

        turnText = `Atacas por ${playerDamage} de daño. ${step.enemy.name} contraataca por ${enemyDamage}.`;
      } else if (action.action === 'defend') {
        // Defend: reduced incoming damage
        const enemyBaseDmg = Math.max(1, step.enemy.attack - Math.floor(defenseStat / 10));
        enemyDamage = Math.max(1, Math.floor(enemyBaseDmg * 0.5));
        this._state = applyEffects(this._state, { stats: { [step.playerStat]: -enemyDamage } });
        this.syncSpecialStats();

        turnText = `Te defiendes. ${step.enemy.name} te causa solo ${enemyDamage} de daño.`;
      }

      yield {
        type: 'combat_turn',
        playerAction: action.action,
        playerDamage,
        enemyDamage,
        enemyHp,
        playerHp: typeof this._state.stats[step.playerStat] === 'number'
          ? (this._state.stats[step.playerStat] as number) : 0,
        text: turnText,
      };
    }
  }

  // --- Craft: combinar items ---
  private async *processCraft(
    step: CraftStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const items = this.manifest.items || {};
    const failText = step.failText || 'Eso no tiene ningún sentido...';

    while (true) {
      yield {
        type: 'craft_prompt',
        description: step.description,
        playerInventory: [...this._state.inventory],
        recipes: step.recipes.map((r) => ({
          ingredients: r.ingredients,
          resultName: items[r.result]?.name || r.result,
        })),
        failText,
      };

      const action = await this.waitForAction();

      if (action.type === 'craft_exit') break;

      if (action.type === 'craft_combine') {
        // Find matching recipe (order-independent)
        const sorted = [...action.items].sort();
        const recipe = step.recipes.find((r) => {
          const rSorted = [...r.ingredients].sort();
          return rSorted.length === sorted.length &&
            rSorted.every((ing, i) => ing === sorted[i]);
        });

        if (recipe) {
          // Check player has all ingredients
          const hasAll = recipe.ingredients.every((ing) =>
            this._state.inventory.includes(ing)
          );
          if (hasAll) {
            // Remove ingredients (if consume)
            if (recipe.consume !== false) {
              this._state = applyEffects(this._state, {
                removeInventory: recipe.ingredients,
              });
            }
            // Add result item
            this._state = applyEffects(this._state, {
              inventory: [recipe.result],
            });
            // Extra effects
            if (recipe.effects) {
              this._state = applyEffects(this._state, recipe.effects);
            }
            this.syncSpecialStats();
            yield { type: 'craft_result', success: true, text: recipe.text };
            yield { type: 'effects', inventory: [recipe.result], removeInventory: recipe.consume !== false ? recipe.ingredients : undefined };

            if (recipe.goto) {
              return { type: 'navigate' as const, scene: recipe.goto };
            }
            break; // Exit craft after success
          }
        }

        // No matching recipe
        yield { type: 'craft_result', success: false, text: failText };
      }
    }

    if (step.goto) {
      return { type: 'navigate' as const, scene: step.goto };
    }
  }

  // --- Puzzle: acertijos interactivos ---
  private async *processPuzzle(
    step: PuzzleStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const maxAttempts = step.maxAttempts || 0; // 0 = infinite
    let attemptsUsed = 0;

    while (true) {
      const attemptsLeft = maxAttempts > 0 ? maxAttempts - attemptsUsed : undefined;

      yield {
        type: 'puzzle_prompt',
        puzzleType: step.puzzleType,
        description: step.description,
        prompt: step.config.type === 'code' ? step.config.prompt : undefined,
        question: step.config.type === 'riddle' ? step.config.question : undefined,
        hint: step.config.hint || step.hintText,
        elements: step.config.type === 'sequence' ? step.config.elements : undefined,
        digits: step.config.type === 'lock' ? step.config.digits : undefined,
        attemptsLeft,
      };

      const action = await this.waitForAction();

      if (action.type === 'puzzle_exit') {
        // Treat exit as failure
        const outcome = step.failure;
        yield { type: 'puzzle_attempt', correct: false, text: outcome.text };
        if (outcome.effects) {
          this._state = applyEffects(this._state, outcome.effects);
          this.syncSpecialStats();
          yield { type: 'effects', ...outcome.effects };
        }
        if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
        return;
      }

      if (action.type === 'puzzle_attempt') {
        attemptsUsed++;
        const correct = this.checkPuzzleAnswer(step, action.answer);

        if (correct) {
          const outcome = step.success;
          yield { type: 'puzzle_attempt', correct: true, text: outcome.text };
          if (outcome.effects) {
            this._state = applyEffects(this._state, outcome.effects);
            this.syncSpecialStats();
            yield { type: 'effects', ...outcome.effects };
          }
          if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
          return;
        }

        // Wrong answer
        const newAttemptsLeft = maxAttempts > 0 ? maxAttempts - attemptsUsed : undefined;

        if (maxAttempts > 0 && attemptsUsed >= maxAttempts) {
          // Out of attempts
          const outcome = step.failure;
          yield { type: 'puzzle_attempt', correct: false, text: outcome.text, attemptsLeft: 0 };
          if (outcome.effects) {
            this._state = applyEffects(this._state, outcome.effects);
            this.syncSpecialStats();
            yield { type: 'effects', ...outcome.effects };
          }
          if (outcome.goto) return { type: 'navigate' as const, scene: outcome.goto };
          return;
        }

        yield { type: 'puzzle_attempt', correct: false, text: 'Incorrecto...', attemptsLeft: newAttemptsLeft };
      }
    }
  }

  private checkPuzzleAnswer(step: PuzzleStep, answer: string | string[]): boolean {
    const config = step.config;
    switch (config.type) {
      case 'code': {
        const ans = (typeof answer === 'string' ? answer : answer[0] || '').toLowerCase().trim();
        return config.answers.some((a) => a.toLowerCase().trim() === ans);
      }
      case 'riddle': {
        const ans = (typeof answer === 'string' ? answer : answer[0] || '').toLowerCase().trim();
        return config.answers.some((a) => ans.includes(a.toLowerCase().trim()) || a.toLowerCase().trim().includes(ans));
      }
      case 'lock': {
        const ans = typeof answer === 'string' ? answer : answer[0] || '';
        return ans === config.combination;
      }
      case 'sequence': {
        const correctOrder = config.elements.map((e) => e.id);
        const submitted = Array.isArray(answer) ? answer : [answer];
        return correctOrder.length === submitted.length &&
          correctOrder.every((id, i) => id === submitted[i]);
      }
      default:
        return false;
    }
  }

  // --- Examine: inspeccionar entorno ---
  private async *processExamine(
    step: ExamineStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const examined = new Set<string>();
    const exitText = step.exitText || 'Seguir adelante';

    while (true) {
      // Filter visible subjects
      const visible = step.subjects.filter((s) => {
        if (s.condition && !evaluateCondition(s.condition, this._state)) return false;
        if (s.oneTime && examined.has(s.id)) return false;
        return true;
      });

      yield {
        type: 'examine_prompt',
        description: step.description,
        subjects: visible.map((s) => ({ id: s.id, label: s.label })),
        exitText,
      };

      const action = await this.waitForAction();

      if (action.type === 'examine_exit') break;

      if (action.type === 'examine_select') {
        const subject = step.subjects.find((s) => s.id === action.subjectId);
        if (subject) {
          examined.add(subject.id);
          yield { type: 'examine_result', subjectLabel: subject.label, text: subject.text };

          if (subject.effects) {
            this._state = applyEffects(this._state, subject.effects);
            this.syncSpecialStats();
            yield { type: 'effects', ...subject.effects };
          }
        }
      }
    }

    if (step.goto) {
      return { type: 'navigate' as const, scene: step.goto };
    }
  }

  // --- UseItem: usar item en objetivo ---
  private async *processUseItem(
    step: UseItemStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const exitText = step.exitText || 'Dejar de intentar';
    const failText = step.failText || 'No puedes usar eso aquí.';

    while (true) {
      yield {
        type: 'use_item_prompt',
        description: step.description,
        targets: step.targets.map((t) => ({ id: t.id, label: t.label })),
        playerInventory: [...this._state.inventory],
        exitText,
      };

      const action = await this.waitForAction();

      if (action.type === 'use_item_exit') break;

      if (action.type === 'use_item_on') {
        const target = step.targets.find((t) => t.id === action.targetId);
        if (!target) continue;

        // Check if item is accepted
        const accept = target.accepts.find((a) => a.itemId === action.itemId);

        if (accept && this._state.inventory.includes(action.itemId)) {
          // Success
          if (accept.consume !== false) {
            this._state = applyEffects(this._state, { removeInventory: [action.itemId] });
          }
          if (accept.effects) {
            this._state = applyEffects(this._state, accept.effects);
          }
          this.syncSpecialStats();

          yield {
            type: 'use_item_result',
            targetLabel: target.label,
            itemId: action.itemId,
            text: accept.text,
            success: true,
          };
          if (accept.effects) {
            yield { type: 'effects', ...accept.effects };
          }

          if (accept.goto) {
            return { type: 'navigate' as const, scene: accept.goto };
          }
          break; // Exit after successful use
        } else {
          // Item not accepted
          yield {
            type: 'use_item_result',
            targetLabel: target.label,
            itemId: action.itemId,
            text: target.defaultText || failText,
            success: false,
          };
        }
      }
    }

    if (step.goto) {
      return { type: 'navigate' as const, scene: step.goto };
    }
  }

  // --- TimedChoice: decisión con temporizador ---
  private async *processTimedChoice(
    step: TimedChoiceStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    const visibleOptions = step.options.filter(
      (opt) => !opt.condition || evaluateCondition(opt.condition, this._state)
    );

    yield {
      type: 'timed_choice_prompt',
      options: visibleOptions.map((opt, i) => ({ text: opt.text, index: i })),
      duration: step.duration,
      defaultIndex: step.defaultIndex,
      timeoutText: step.timeoutText,
    };

    const action = await this.waitForAction();

    let chosenIndex = step.defaultIndex;
    if (action.type === 'choose') {
      chosenIndex = action.index;
    }

    const chosen = visibleOptions[chosenIndex] || visibleOptions[0];
    if (chosen) {
      return yield* this.handleChoiceResult(chosen);
    }
  }

  private async *handleChoiceResult(
    chosen: ChoiceOption
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    if (chosen.effects) {
      this._state = applyEffects(this._state, chosen.effects);
      this.syncSpecialStats();
      yield { type: 'effects', ...chosen.effects };
    }
    if (chosen.goto) {
      return { type: 'navigate' as const, scene: chosen.goto };
    }
  }

  private getDiceOutcome(step: DiceStep, outcome: string) {
    const results = step.results;
    switch (outcome) {
      case 'critical_success':
        return results.critical_success || results.success;
      case 'success':
        return results.success;
      case 'failure':
        return results.failure;
      case 'critical_failure':
        return results.critical_failure || results.failure;
      default:
        return results.failure;
    }
  }

  private syncSpecialStats(): void {
    const img = this._state.stats._protagonist_image;
    if (typeof img === 'string') {
      // Find the protagonist character by role, fallback to 'protagonist' key
      const protagonistId = Object.keys(this.manifest.characters).find(
        (id) => this.manifest.characters[id].role === 'protagonist'
      ) || 'protagonist';
      const protagonist = this.manifest.characters[protagonistId];
      if (protagonist) {
        const resolved = this._basePath && !img.startsWith(this._basePath)
          ? `${this._basePath}/${img}`
          : img;
        protagonist.image = resolved;
      }
    }
  }

  /** Get all companions that have joined (joinFlag is true in state) */
  getActiveCompanions(): { id: string; name: string; image?: string }[] {
    return Object.entries(this.manifest.characters)
      .filter(([_, char]) => char.role === 'companion' && char.joinFlag && this._state.flags[char.joinFlag])
      .map(([id, char]) => ({ id, name: char.name, image: char.image }));
  }

  /** Get the protagonist character entry */
  getProtagonist(): { id: string; name: string; image?: string } | null {
    const entry = Object.entries(this.manifest.characters).find(
      ([_, char]) => char.role === 'protagonist'
    );
    if (!entry) {
      // Fallback: look for key 'protagonist'
      const fallback = this.manifest.characters.protagonist;
      if (fallback) return { id: 'protagonist', name: fallback.name, image: fallback.image };
      return null;
    }
    return { id: entry[0], name: entry[1].name, image: entry[1].image };
  }

  private getCharacterName(id: string): string {
    const char = this.manifest.characters[id];
    return char?.name || id;
  }

  // --- LevelUp ---
  private async *processLevelUp(
    step: LevelUpStep
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    // Determine character
    const charId = step.characterId || this.getProtagonistId();
    const charDef = this.manifest.characters[charId];
    if (!charDef) return;

    // Ensure character state exists
    if (!this._state.characters[charId]) {
      this._state.characters[charId] = { level: 1, xp: 0, skillPoints: 0, skills: {}, traits: [], stats: {} };
    }

    const charState = this._state.characters[charId];
    const xpCurve = charDef.xpCurve || [100, 200, 400, 800, 1600];
    const maxLevel = charDef.maxLevel || xpCurve.length + 1;

    // Check if can level up
    if (!step.force) {
      const xpNeeded = xpCurve[charState.level - 1] ?? xpCurve[xpCurve.length - 1];
      if (charState.xp < xpNeeded || charState.level >= maxLevel) return;
    }

    // Level up!
    const newLevel = Math.min(charState.level + 1, maxLevel);
    const pointsGained = step.skillPoints ?? 1;
    this._state.characters[charId] = {
      ...charState,
      level: newLevel,
      skillPoints: charState.skillPoints + pointsGained,
    };

    // Get skill tree
    const treeId = charDef.skillTree;
    const tree = treeId ? this.manifest.skillTrees?.[treeId] : undefined;

    if (!tree) {
      // No skill tree, just show level up notification
      yield {
        type: 'level_up_result',
        characterName: charDef.name,
        newLevel,
        skillsLearned: [],
      };
      if (step.goto) return { type: 'navigate' as const, scene: step.goto };
      return;
    }

    // Build available skills for UI
    const updatedCharState = this._state.characters[charId];
    const availableSkills = Object.entries(tree.skills).map(([skillId, skillDef]) => {
      const currentLevel = updatedCharState.skills[skillId] || 0;
      const cost = skillDef.cost ?? 1;
      const prereqsMet = !skillDef.prerequisites || skillDef.prerequisites.every(
        (prereq) => (updatedCharState.skills[prereq] || 0) >= 1
      );
      return {
        id: skillId,
        name: skillDef.name,
        description: skillDef.description,
        icon: skillDef.icon,
        currentLevel,
        maxLevel: skillDef.maxLevel,
        cost,
        canLearn: currentLevel < skillDef.maxLevel && updatedCharState.skillPoints >= cost && prereqsMet,
        prerequisites: skillDef.prerequisites,
        passiveBonus: skillDef.passiveBonus,
      };
    });

    const skillsLearned: { name: string; level: number }[] = [];

    // Skill selection loop
    while (this._state.characters[charId].skillPoints > 0) {
      const cs = this._state.characters[charId];
      // Refresh canLearn
      for (const skill of availableSkills) {
        const currentLevel = cs.skills[skill.id] || 0;
        const skillDef = tree.skills[skill.id];
        const prereqsMet = !skillDef.prerequisites || skillDef.prerequisites.every(
          (prereq) => (cs.skills[prereq] || 0) >= 1
        );
        skill.currentLevel = currentLevel;
        skill.canLearn = currentLevel < skill.maxLevel && cs.skillPoints >= skill.cost && prereqsMet;
      }

      const anyLearnable = availableSkills.some((s) => s.canLearn);
      if (!anyLearnable) break;

      yield {
        type: 'level_up_prompt',
        characterId: charId,
        characterName: charDef.name,
        newLevel: this._state.characters[charId].level,
        skillPoints: cs.skillPoints,
        availableSkills,
        description: step.description,
      };

      const action = await this.waitForAction();

      if (action.type === 'level_up_done') break;

      if (action.type === 'level_up_skill') {
        const skill = availableSkills.find((s) => s.id === action.skillId);
        if (skill && skill.canLearn) {
          const skillDef = tree.skills[skill.id];
          const newCharState = { ...this._state.characters[charId] };
          newCharState.skills = { ...newCharState.skills };
          newCharState.skills[skill.id] = (newCharState.skills[skill.id] || 0) + 1;
          newCharState.skillPoints -= skill.cost;

          // Apply passive bonuses to character stats
          if (skillDef.passiveBonus) {
            newCharState.stats = { ...newCharState.stats };
            for (const [stat, bonus] of Object.entries(skillDef.passiveBonus)) {
              newCharState.stats[stat] = (newCharState.stats[stat] || 0) + bonus;
            }
          }

          this._state.characters[charId] = newCharState;
          skillsLearned.push({ name: skillDef.name, level: newCharState.skills[skill.id] });
        }
      }
    }

    yield {
      type: 'level_up_result',
      characterName: charDef.name,
      newLevel: this._state.characters[charId].level,
      skillsLearned,
    };

    if (step.goto) {
      return { type: 'navigate' as const, scene: step.goto };
    }
  }

  private getProtagonistId(): string {
    return Object.keys(this.manifest.characters).find(
      (id) => this.manifest.characters[id].role === 'protagonist'
    ) || 'protagonist';
  }

  /** Apply XP and check for level ups, yielding results */
  async *applyXpAndYield(
    xpMap: Record<string, number>
  ): AsyncGenerator<StepResult> {
    for (const [charId, amount] of Object.entries(xpMap)) {
      const charDef = this.manifest.characters[charId];
      if (!charDef) continue;

      if (!this._state.characters[charId]) {
        this._state.characters[charId] = { level: 1, xp: 0, skillPoints: 0, skills: {}, traits: [], stats: {} };
      }

      const charState = this._state.characters[charId];
      const newXp = charState.xp + amount;
      const xpCurve = charDef.xpCurve || [100, 200, 400, 800, 1600];
      const maxLevel = charDef.maxLevel || xpCurve.length + 1;
      const xpNeeded = xpCurve[charState.level - 1] ?? xpCurve[xpCurve.length - 1];
      const leveledUp = newXp >= xpNeeded && charState.level < maxLevel;

      this._state.characters[charId] = { ...charState, xp: newXp };

      yield {
        type: 'xp_gain',
        characterId: charId,
        characterName: charDef.name,
        amount,
        totalXp: newXp,
        leveledUp,
        newLevel: leveledUp ? charState.level + 1 : undefined,
      };
    }
  }

  /** Apply affinity changes and yield results */
  async *applyAffinityAndYield(
    affinityMap: Record<string, number>
  ): AsyncGenerator<StepResult> {
    for (const [charId, delta] of Object.entries(affinityMap)) {
      const charDef = this.manifest.characters[charId];
      if (!charDef) continue;

      if (!this._state.relationships[charId]) {
        this._state.relationships[charId] = { affinity: 0 };
      }

      const oldAffinity = this._state.relationships[charId].affinity;
      const newAffinity = Math.max(-100, Math.min(100, oldAffinity + delta));
      this._state.relationships[charId] = { affinity: newAffinity };

      const oldTier = this.getAffinityTier(oldAffinity);
      const newTier = this.getAffinityTier(newAffinity);

      yield {
        type: 'relationship_change',
        characterId: charId,
        characterName: charDef.name,
        oldAffinity,
        newAffinity,
        tier: newTier,
        tierChanged: oldTier !== newTier,
      };
    }
  }

  private getAffinityTier(affinity: number): string {
    if (affinity >= 80) return 'loyal';
    if (affinity >= 50) return 'allied';
    if (affinity >= 20) return 'friendly';
    if (affinity >= -10) return 'neutral';
    if (affinity >= -30) return 'distrustful';
    return 'hostile';
  }

  /** Expire temporary traits based on scene count */
  private expireTraits(): void {
    const traitDefs = this.manifest.traits;
    if (!traitDefs || !this._state.activeTraits?.length) return;

    // For now, traits with duration are removed after N scenes
    // We'd need to track when each trait was added — simplified approach:
    // traits with duration field expire, permanent ones don't
    // This is a basic implementation; a more sophisticated one would track timestamps
  }

  /** Get character's relationship tier */
  getRelationshipTier(charId: string): string {
    const aff = this._state.relationships?.[charId]?.affinity ?? 0;
    return this.getAffinityTier(aff);
  }

  /** Get character state */
  getCharacterState(charId: string): CharacterState | undefined {
    return this._state.characters?.[charId];
  }

  /** Get all skill trees */
  get skillTrees() {
    return this.manifest.skillTrees || {};
  }

  /** Get trait definitions */
  get traitDefs() {
    return this.manifest.traits || {};
  }
}
