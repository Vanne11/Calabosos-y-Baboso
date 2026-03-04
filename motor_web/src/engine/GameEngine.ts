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
} from '../types/game';
import type { PlayerState, StepResult, PlayerAction } from '../types/engine';
import { evaluateCondition } from './ConditionEvaluator';
import { applyEffects } from './EffectsApplier';
import { resolveRoll } from './DiceRoller';

export class GameEngine {
  private manifest: GameManifest;
  private scenes: ScenesFile;
  private _state: PlayerState;
  private _currentScene: string = '';
  private _pendingAction: PlayerAction | null = null;
  private _actionResolver: ((action: PlayerAction) => void) | null = null;

  constructor(manifest: GameManifest, scenes: ScenesFile) {
    this.manifest = manifest;
    this.scenes = scenes;
    this._state = this.createInitialState();
  }

  get state(): PlayerState {
    return this._state;
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

  private createInitialState(): PlayerState {
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
    };
  }

  // Wait for a player action (used by generator)
  private waitForAction(): Promise<PlayerAction> {
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

    // Yield scenario if present
    if (scene.scenario) {
      const description = this.getScenarioDescription(scene);
      yield {
        type: 'scenario',
        name: scene.scenario.name,
        description,
        image: scene.scenario.image,
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
        }

        if (step.goto) {
          return { type: 'navigate' as const, scene: step.goto };
        }
        break;
      }

      case 'effects':
        this._state = applyEffects(this._state, step.effects);
        yield { type: 'effects', ...step.effects };
        break;
    }
  }

  private async *handleChoiceResult(
    chosen: ChoiceOption
  ): AsyncGenerator<StepResult, { type: 'navigate'; scene: string } | void> {
    if (chosen.effects) {
      this._state = applyEffects(this._state, chosen.effects);
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

  private getCharacterName(id: string): string {
    const char = this.manifest.characters[id];
    return char?.name || id;
  }
}
