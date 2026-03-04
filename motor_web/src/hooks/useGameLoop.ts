// hooks/useGameLoop.ts
// Consume StepResults del GameEngine y actualiza la terminal/UI

import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDebugStore } from '../store/useDebugStore';
import { delay } from '../utils/delay';
import type { PlayerAction, StepResult } from '../types/engine';

export function useGameLoop() {
  const engine = useAppStore((s) => s.engine);
  const addEntry = useAppStore((s) => s.addEntry);
  const setPlayerState = useAppStore((s) => s.setPlayerState);
  const setCurrentImage = useAppStore((s) => s.setCurrentImage);
  const setPendingResult = useAppStore((s) => s.setPendingResult);
  const setShowEnterPrompt = useAppStore((s) => s.setShowEnterPrompt);
  const setCurrentScene = useAppStore((s) => s.setCurrentScene);
  const speed = useAppStore((s) => s.speed);

  const debugLog = useDebugStore((s) => s.log);
  const debugActive = useDebugStore((s) => s.active);

  const iteratorRef = useRef<AsyncGenerator<StepResult> | null>(null);

  const startScene = useCallback(
    async (sceneId: string) => {
      if (!engine) return;

      setCurrentScene(sceneId);
      if (debugActive) debugLog(`Entrando a escena: ${sceneId}`, 'ROUTE');

      const iterator = engine.enterScene(sceneId);
      iteratorRef.current = iterator;

      await consumeResults(iterator);
    },
    [engine, debugActive]
  );

  const consumeResults = async (iterator: AsyncGenerator<StepResult>) => {
    while (true) {
      const { value, done } = await iterator.next();
      if (done || !value) break;

      await handleResult(value);

      // If the result requires player input, stop consuming
      if (
        value.type === 'choice_prompt' ||
        value.type === 'dice_prompt' ||
        value.type === 'input_prompt'
      ) {
        break;
      }

      // If navigate, start new scene
      if (value.type === 'navigate') {
        await startScene(value.scene);
        return;
      }
    }

    // Sync state after processing
    if (engine) {
      setPlayerState({ ...engine.state });
    }
  };

  const handleResult = async (result: StepResult) => {
    const currentSpeed = useAppStore.getState().speed;

    switch (result.type) {
      case 'scenario':
        if (result.image) setCurrentImage(result.image);
        addEntry({
          type: 'system',
          content: `[bold cyan]═══════════════════════════════════════════[/bold cyan]`,
        });
        addEntry({
          type: 'system',
          content: `[bold yellow]📍 ${result.name}[/bold yellow]`,
        });
        addEntry({
          type: 'system',
          content: `[bold cyan]═══════════════════════════════════════════[/bold cyan]`,
        });
        addEntry({ type: 'system', content: '' });
        if (result.description) {
          addEntry({ type: 'system', content: `[white]${result.description}[/white]` });
        }
        addEntry({ type: 'system', content: '' });
        break;

      case 'dialog': {
        addEntry({
          type: 'dialogHeader',
          content: result.characterName,
        });

        for (let i = 0; i < result.lines.length; i++) {
          addEntry({ type: 'dialog', content: result.lines[i] });
          if (i < result.lines.length - 1) {
            await delay(300, currentSpeed);
          }
        }

        // Wait for user to press Enter between dialogs
        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        break;
      }

      case 'choice_prompt':
        setPendingResult(result);
        break;

      case 'dice_prompt':
        setPendingResult(result);
        break;

      case 'dice_result':
        addEntry({
          type: 'system',
          content: `[bold cyan]🎲 Resultado: ${result.roll} + ${result.modifier} = ${result.total} (Dificultad: ${result.difficulty})[/bold cyan]`,
        });

        const outcomeColors: Record<string, string> = {
          critical_success: 'green',
          success: 'green',
          failure: 'red',
          critical_failure: 'red',
        };
        const color = outcomeColors[result.outcome] || 'white';
        addEntry({
          type: 'system',
          content: `[${color}]${result.text}[/${color}]`,
        });
        addEntry({ type: 'system', content: '' });

        // Wait after dice result
        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        break;

      case 'input_prompt':
        setPendingResult(result);
        break;

      case 'effects':
        if (debugActive) {
          debugLog(`Efectos aplicados: ${JSON.stringify(result)}`, 'STATE');
        }
        // Sync state
        if (engine) {
          setPlayerState({ ...engine.state });
        }
        break;

      case 'navigate':
        // Handled by consumeResults
        break;

      case 'game_end':
        addEntry({
          type: 'system',
          content: '[bold green]Fin del juego.[/bold green]',
        });
        break;
    }
  };

  const sendAction = useCallback(
    async (action: PlayerAction) => {
      if (!engine) return;

      setPendingResult(null);
      engine.sendAction(action);

      // Continue consuming results
      if (iteratorRef.current) {
        await consumeResults(iteratorRef.current);
      }
    },
    [engine]
  );

  return { startScene, sendAction };
}

function waitForEnterKey(): Promise<void> {
  return new Promise((resolve) => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        window.removeEventListener('keydown', handler);
        resolve();
      }
    };
    window.addEventListener('keydown', handler);
  });
}
