// hooks/useGameLoop.ts
// Consume StepResults del GameEngine y actualiza la terminal/UI

import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDebugStore } from '../store/useDebugStore';
import { delay } from '../utils/delay';
import { audioManager } from '../engine/AudioManager';
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
        value.type === 'input_prompt' ||
        value.type === 'shop_prompt' ||
        value.type === 'combat_prompt' ||
        value.type === 'craft_prompt' ||
        value.type === 'puzzle_prompt' ||
        value.type === 'examine_prompt' ||
        value.type === 'use_item_prompt' ||
        value.type === 'timed_choice_prompt' ||
        value.type === 'level_up_prompt'
      ) {
        break;
      }

      // If navigate, start new scene or quit
      if (value.type === 'navigate') {
        if (value.scene === '_quit') {
          const { resetGame, setCurrentImage, addEntry: add } = useAppStore.getState();
          add({
            type: 'system',
            content: '[italic]Cerrando el juego... hasta la próxima, aventurero.[/italic]',
          });
          audioManager.stop();
          resetGame();
          setCurrentImage(null);
          return;
        }
        if (value.scene === '_game_over') {
          const { addEntry: add } = useAppStore.getState();
          add({ type: 'system', content: '' });
          add({ type: 'system', content: '[bold red]═══════════════════════════════════════════[/bold red]' });
          add({ type: 'system', content: '[bold red]              GAME OVER[/bold red]' });
          add({ type: 'system', content: '[bold red]═══════════════════════════════════════════[/bold red]' });
          add({ type: 'system', content: '' });
          audioManager.stop();
          return;
        }
        if (value.scene === '_restart') {
          const { addEntry: add, setPlayerState: syncState, fadeOldEntries } = useAppStore.getState();
          add({ type: 'system', content: '[italic yellow]Reiniciando el juego...[/italic yellow]' });
          audioManager.stop();
          fadeOldEntries();
          if (engine) {
            engine.reset();
            syncState({ ...engine.state });
            await startScene('start');
          }
          return;
        }
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
        if (result.music) {
          console.log('[GameLoop] Reproduciendo música:', result.music);
          audioManager.volume = useAppStore.getState().volume / 100;
          audioManager.play(result.music);
        } else {
          console.log('[GameLoop] Escenario sin música:', result.name);
        }
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
        const { seenCharacters, markCharacterSeen, fadeOldEntries } = useAppStore.getState();
        const isFirstTime = !seenCharacters.has(result.character);
        if (isFirstTime) {
          markCharacterSeen(result.character);
        }

        addEntry({
          type: 'dialogHeader',
          content: result.characterName,
          image: result.characterImage,
          firstAppearance: isFirstTime && !!result.characterImage,
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

        // Fade old entries after user continues
        fadeOldEntries();
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
        useAppStore.getState().fadeOldEntries();
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

      case 'check_result': {
        const checkColor = result.passed ? 'green' : 'red';
        const checkIcon = result.passed ? '✓' : '✗';
        addEntry({
          type: 'system',
          content: `[bold cyan]🔍 ${result.description}[/bold cyan]`,
        });
        addEntry({
          type: 'system',
          content: `[${checkColor}]${checkIcon} ${result.text}[/${checkColor}]`,
        });
        addEntry({ type: 'system', content: '' });

        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'random_result':
        addEntry({
          type: 'system',
          content: `[yellow]${result.text}[/yellow]`,
        });
        addEntry({ type: 'system', content: '' });
        break;

      case 'shop_prompt':
        setPendingResult(result);
        break;

      case 'combat_prompt':
        setPendingResult(result);
        break;

      case 'combat_turn':
        addEntry({
          type: 'system',
          content: `[bold]⚔️ ${result.text}[/bold]`,
        });
        addEntry({
          type: 'system',
          content: `[dim]Enemigo: ${result.enemyHp} HP | Tú: ${result.playerHp} HP[/dim]`,
        });
        addEntry({ type: 'system', content: '' });
        break;

      case 'combat_end': {
        const combatColor = result.outcome === 'victory' ? 'green' : result.outcome === 'flee' ? 'yellow' : 'red';
        addEntry({
          type: 'system',
          content: `[bold ${combatColor}]${result.text}[/bold ${combatColor}]`,
        });
        addEntry({ type: 'system', content: '' });

        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'notify': {
        const notifyColors: Record<string, string> = {
          achievement: 'green',
          warning: 'yellow',
          info: 'cyan',
          discovery: 'purple',
        };
        const nColor = notifyColors[result.style] || 'white';
        const icon = result.icon || (result.style === 'achievement' ? '🏆' : result.style === 'discovery' ? '🔎' : 'ℹ️');
        addEntry({
          type: 'system',
          content: `[bold ${nColor}]${icon} ${result.title}[/bold ${nColor}]`,
        });
        addEntry({
          type: 'system',
          content: `[${nColor}]${result.text}[/${nColor}]`,
        });
        addEntry({ type: 'system', content: '' });
        break;
      }

      case 'wait': {
        if (result.style === 'dots') {
          addEntry({ type: 'system', content: `[dim]${result.text}...[/dim]` });
        } else {
          addEntry({ type: 'system', content: `[dim]${result.text}[/dim]` });
        }
        await delay(result.duration, currentSpeed);
        break;
      }

      case 'sound': {
        // Reproducir efecto de sonido one-shot
        const sfx = new Audio(result.src);
        sfx.volume = result.volume * (useAppStore.getState().volume / 100);
        sfx.play().catch(() => {});
        break;
      }

      case 'craft_prompt':
        setPendingResult(result);
        break;

      case 'craft_result': {
        const craftColor = result.success ? 'green' : 'yellow';
        const craftIcon = result.success ? '🔧' : '❌';
        addEntry({
          type: 'system',
          content: `[bold ${craftColor}]${craftIcon} ${result.text}[/bold ${craftColor}]`,
        });
        addEntry({ type: 'system', content: '' });
        if (result.success) {
          setShowEnterPrompt(true);
          await waitForEnterKey();
          setShowEnterPrompt(false);
          useAppStore.getState().fadeOldEntries();
        }
        break;
      }

      case 'puzzle_prompt':
        setPendingResult(result);
        break;

      case 'puzzle_attempt': {
        const puzzleColor = result.correct ? 'green' : 'red';
        const puzzleIcon = result.correct ? '✓' : '✗';
        addEntry({
          type: 'system',
          content: `[bold ${puzzleColor}]${puzzleIcon} ${result.text}[/bold ${puzzleColor}]`,
        });
        if (result.attemptsLeft !== undefined && !result.correct) {
          addEntry({
            type: 'system',
            content: `[dim]Intentos restantes: ${result.attemptsLeft}[/dim]`,
          });
        }
        addEntry({ type: 'system', content: '' });
        if (result.correct || result.attemptsLeft === 0) {
          setShowEnterPrompt(true);
          await waitForEnterKey();
          setShowEnterPrompt(false);
          useAppStore.getState().fadeOldEntries();
        }
        break;
      }

      case 'examine_prompt':
        setPendingResult(result);
        break;

      case 'examine_result':
        addEntry({
          type: 'system',
          content: `[bold cyan]🔍 ${result.subjectLabel}[/bold cyan]`,
        });
        addEntry({
          type: 'system',
          content: `[white]${result.text}[/white]`,
        });
        addEntry({ type: 'system', content: '' });
        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        break;

      case 'use_item_prompt':
        setPendingResult(result);
        break;

      case 'use_item_result': {
        const uiColor = result.success ? 'green' : 'yellow';
        const uiIcon = result.success ? '✓' : '✗';
        addEntry({
          type: 'system',
          content: `[bold ${uiColor}]${uiIcon} ${result.text}[/bold ${uiColor}]`,
        });
        addEntry({ type: 'system', content: '' });
        if (result.success) {
          setShowEnterPrompt(true);
          await waitForEnterKey();
          setShowEnterPrompt(false);
          useAppStore.getState().fadeOldEntries();
        }
        break;
      }

      case 'timed_choice_prompt':
        setPendingResult(result);
        break;

      case 'level_up_prompt':
        setPendingResult(result);
        break;

      case 'level_up_result': {
        const lvlColor = 'green';
        addEntry({
          type: 'system',
          content: `[bold ${lvlColor}]⬆️ ¡${result.characterName} ha subido al nivel ${result.newLevel}![/bold ${lvlColor}]`,
        });
        if (result.skillsLearned.length > 0) {
          for (const skill of result.skillsLearned) {
            addEntry({
              type: 'system',
              content: `[${lvlColor}]  ✦ ${skill.name} (Nivel ${skill.level})[/${lvlColor}]`,
            });
          }
        }
        addEntry({ type: 'system', content: '' });
        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'xp_gain': {
        const xpColor = result.leveledUp ? 'green' : 'cyan';
        addEntry({
          type: 'system',
          content: `[${xpColor}]✨ ${result.characterName} gana ${result.amount} XP (${result.totalXp} total)[/${xpColor}]`,
        });
        if (result.leveledUp) {
          addEntry({
            type: 'system',
            content: `[bold green]⬆️ ¡${result.characterName} sube al nivel ${result.newLevel}![/bold green]`,
          });
        }
        break;
      }

      case 'relationship_change': {
        const relDelta = result.newAffinity - result.oldAffinity;
        const relColor = relDelta > 0 ? 'green' : 'red';
        const relIcon = relDelta > 0 ? '💚' : '💔';
        const sign = relDelta > 0 ? '+' : '';
        addEntry({
          type: 'system',
          content: `[${relColor}]${relIcon} ${result.characterName}: ${sign}${relDelta} afinidad[/${relColor}]`,
        });
        if (result.tierChanged) {
          const tierNames: Record<string, string> = {
            hostile: 'Hostil', distrustful: 'Desconfiado', neutral: 'Neutral',
            friendly: 'Amigable', allied: 'Aliado', loyal: 'Leal',
          };
          addEntry({
            type: 'system',
            content: `[bold yellow]📊 Relación con ${result.characterName}: ${tierNames[result.tier] || result.tier}[/bold yellow]`,
          });
        }
        break;
      }

      case 'trait_change': {
        for (const trait of result.added) {
          addEntry({
            type: 'system',
            content: `[bold purple]${trait.icon || '🔮'} Nuevo rasgo: ${trait.name}[/bold purple]`,
          });
        }
        for (const trait of result.removed) {
          addEntry({
            type: 'system',
            content: `[dim]✕ Rasgo perdido: ${trait.name}[/dim]`,
          });
        }
        break;
      }

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        cleanup();
        resolve();
      }
    };
    const onTap = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerup', onTap);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerup', onTap);
  });
}
