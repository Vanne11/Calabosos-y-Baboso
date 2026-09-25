// hooks/useGameLoop.ts
// Consume StepResults del GameEngine y actualiza la terminal/UI

import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDebugStore } from '../store/useDebugStore';
import { delay } from '../utils/delay';
import { audioManager } from '../engine/AudioManager';
import { sfx } from '../audio/SfxPlayer';
import { observeState, rebaseFeedback, screenFx, playSfx } from '../audio/gameFeedback';
import { toneSfx, CHAT_START_SFX } from '../audio/tones';
import { saveGame } from '../utils/storage';
import { getMeta, setMeta, ageGateKey, META_COUNTERS_KEY } from '../utils/metaStorage';
import { AGE_GATE_SCENE, AGE_ACCEPT } from '../engine/GameLoader';
import { AiClient } from '../ai/AiClient';
import { setAiClient, noteAiLine } from '../ai/session';

/** Servidor de IA por defecto: la carpeta api/ dentro del juego (/cyb/api/ con base /cyb/) */
const DEFAULT_AI_ENDPOINT = `${import.meta.env.BASE_URL}api/`;
import type { PlayerAction, StepResult } from '../types/engine';

/** Pista (una vez por sesión) de que las líneas de la IA se pueden calificar */
const RATE_HINT =
  '[dim italic]¿Te hizo reír? /bien · ¿Fue un asco? /mal — así el narrador aprende (o finge que aprende). ¿Quieres decirle algo? /narrador <texto>[/dim italic]';

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
  const checkpointSlotRef = useRef(0);
  /** Combate en curso: pista que sonaba antes, para volver a ella al terminar */
  const combatRef = useRef<{ prevTrack: string | null } | null>(null);
  /** Último tono sonado en la conversación actual (no repetir el mismo efecto turno tras turno) */
  const lastToneRef = useRef<string | null>(null);

  /** Efecto de reacción al tono que marcó la IA, un poco después del texto */
  const playTone = (tone: string | undefined, delayMs: number) => {
    const name = toneSfx(tone as Parameters<typeof toneSfx>[0], engine?.audioConfig?.toneSfx);
    if (!name || name === lastToneRef.current) return;
    lastToneRef.current = name;
    setTimeout(() => sfx.play(name), delayMs);
  };

  const startScene = useCallback(
    async (sceneId: string) => {
      if (!engine) return;

      setCurrentScene(sceneId);
      if (debugActive) debugLog(`Entrando a escena: ${sceneId}`, 'ROUTE');

      // Checkpoint autosave
      const state = useAppStore.getState();
      const manifest = state.gameManifest;
      const saveConfig = manifest?.saveSystem;
      if (saveConfig?.mode === 'checkpoint' && saveConfig.checkpointScenes?.includes(sceneId)) {
        const totalSlots = Math.min(Math.max(saveConfig.slots ?? 3, 1), 10);
        checkpointSlotRef.current = (checkpointSlotRef.current % totalSlots) + 1;
        const gameName = state.gameBasePath.split('/').pop() ?? 'unknown';
        const sceneName = engine.getScenarioName(sceneId) ?? sceneId;
        await saveGame(gameName, checkpointSlotRef.current, {
          playerState: { ...engine.state },
          currentScene: sceneId,
          gameName,
          timestamp: Date.now(),
          sceneName,
          isCheckpoint: true,
        });
        useAppStore.getState().addEntry({
          type: 'system',
          content: '[dim]💾 Progreso guardado automáticamente.[/dim]',
        });
        sfx.play('guardar');
      }

      const iterator = engine.enterScene(sceneId);
      iteratorRef.current = iterator;

      await consumeResults(iterator);
    },
    [engine, debugActive]
  );

  /** Inicia la partida: pasa por el control de edad si el juego lo exige y no fue aceptado */
  const startGame = useCallback(async () => {
    if (!engine) return;
    const gameName = useAppStore.getState().gameBasePath.split('/').pop() ?? 'unknown';

    // Contadores meta (muertes, partidas...): se cargan y se persisten cuando cambian
    const meta = await getMeta<Record<string, number>>(gameName, META_COUNTERS_KEY);
    engine.loadMeta(meta ?? {});
    engine.setMetaListener((m) => {
      setMeta(gameName, META_COUNTERS_KEY, m);
    });
    setPlayerState({ ...engine.state });
    rebaseFeedback(engine.state);
    combatRef.current = null;

    // IA: solo si el juego la declara. Si el servidor no responde, el juego sigue sin IA.
    const aiConfig = useAppStore.getState().gameManifest?.ai;
    if (aiConfig) {
      const client = new AiClient(gameName, aiConfig.endpoint ?? DEFAULT_AI_ENDPOINT);
      setAiClient(client);
      const ok = await client.init();
      engine.setAiProvider(ok ? client : null);
      engine.setEventSink(ok ? client.track : null);
      if (debugActive) debugLog(ok ? 'Servidor de IA conectado' : 'Servidor de IA no disponible: modo sin IA', 'INFO');
    } else {
      setAiClient(null);
      engine.setAiProvider(null);
      engine.setEventSink(null);
    }

    const rating = engine.contentRating;
    if (rating) {
      const gate = rating.gateScene ?? AGE_GATE_SCENE;
      const accepted = await getMeta<boolean>(gameName, ageGateKey(rating.minAge));
      if (!accepted && engine.hasScene(gate)) {
        await startScene(gate);
        return;
      }
    }
    await startScene('start');
  }, [engine, startScene, debugActive]);

  const consumeResults = async (iterator: AsyncGenerator<StepResult>) => {
    const ownerEngine = useAppStore.getState().engine;
    // Este ciclo quedó obsoleto si otra escena tomó el control (/debug goto, /load)
    // o si la partida terminó (/quit): no debe seguir imprimiendo ni navegando
    const stale = () => iteratorRef.current !== iterator || useAppStore.getState().engine !== ownerEngine;
    while (true) {
      // Yield al browser entre iteraciones para no bloquear el hilo
      await yieldToMain();
      if (stale()) break;

      const { value, done } = await iterator.next();
      if (done || !value || stale()) break;

      await handleResult(value, stale);
      if (stale()) break;
      // Respuesta audiovisual a lo que cambió (vida, monedas, objetos...)
      // (y la barra de estado se actualiza en el acto para que la cifra flotante coincida)
      if (engine && observeState(engine.state, engine.audioConfig)) setPlayerState({ ...engine.state });

      // If the result requires player input, stop consuming
      if (
        value.type === 'choice_prompt' ||
        value.type === 'dice_prompt' ||
        value.type === 'input_prompt' ||
        value.type === 'shop_prompt' ||
        value.type === 'shop_dice_prompt' ||
        value.type === 'combat_prompt' ||
        value.type === 'craft_prompt' ||
        value.type === 'puzzle_prompt' ||
        value.type === 'examine_prompt' ||
        value.type === 'use_item_prompt' ||
        value.type === 'timed_choice_prompt' ||
        value.type === 'level_up_prompt' ||
        value.type === 'chat_prompt'
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
          sfx.stopAll();
          resetGame();
          setCurrentImage(null);
          return;
        }
        if (value.scene === '_game_over') {
          useAppStore.getState().addEntries([
            { type: 'system', content: '' },
            { type: 'system', content: '[bold red]═══════════════════════════════════════════[/bold red]' },
            { type: 'system', content: '[bold red]              GAME OVER[/bold red]' },
            { type: 'system', content: '[bold red]═══════════════════════════════════════════[/bold red]' },
            { type: 'system', content: '' },
          ]);
          gameOverAudio(engine?.audioConfig?.gameOverMusic ? engine.assetPath(engine.audioConfig.gameOverMusic) : null);
          return;
        }
        if (value.scene === '_checkpoint') {
          const { addEntry: add, setPlayerState: syncState, fadeOldEntries } = useAppStore.getState();
          const cpScene = engine?.restoreCheckpoint() ?? null;
          audioManager.stop();
          sfx.play('rebobinar');
          combatRef.current = null;
          if (engine) rebaseFeedback(engine.state);
          fadeOldEntries();
          if (engine && cpScene) {
            add({ type: 'system', content: '[italic yellow]Volviendo al último punto seguro... (el narrador lo recuerda todo)[/italic yellow]' });
            syncState({ ...engine.state });
            await startScene(cpScene);
          } else if (engine) {
            add({ type: 'system', content: '[italic yellow]No hay punto seguro. Desde el principio, entonces.[/italic yellow]' });
            engine.reset();
            rebaseFeedback(engine.state);
            syncState({ ...engine.state });
            await startScene('start');
          }
          return;
        }
        if (value.scene === AGE_ACCEPT) {
          const rating = engine?.contentRating;
          if (rating) {
            const gameName = useAppStore.getState().gameBasePath.split('/').pop() ?? 'unknown';
            await setMeta(gameName, ageGateKey(rating.minAge), true);
          }
          await startScene('start');
          return;
        }
        if (value.scene === '_restart') {
          const { addEntry: add, setPlayerState: syncState, fadeOldEntries } = useAppStore.getState();
          add({ type: 'system', content: '[italic yellow]Reiniciando el juego...[/italic yellow]' });
          audioManager.stop();
          sfx.play('rebobinar');
          combatRef.current = null;
          fadeOldEntries();
          if (engine) {
            engine.reset();
            rebaseFeedback(engine.state);
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

  const handleResult = async (result: StepResult, isStale: () => boolean = () => false) => {
    const currentSpeed = useAppStore.getState().speed;

    switch (result.type) {
      case 'scenario': {
        if (result.image) setCurrentImage(result.image);
        if (result.music) {
          // Fire-and-forget: no bloquear el gameLoop esperando audio
          audioManager.play(result.music);
          combatRef.current = null;
        }
        if (result.ambience !== undefined) sfx.setAmbience(result.ambience);
        result.sfx?.forEach((name, i) => setTimeout(() => playSfx(name), i * 250));
        const scenarioEntries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: '[bold cyan]═══════════════════════════════════════════[/bold cyan]' },
          { type: 'system', content: `[bold yellow]📍 ${result.name}[/bold yellow]` },
          { type: 'system', content: '[bold cyan]═══════════════════════════════════════════[/bold cyan]' },
          { type: 'system', content: '' },
        ];
        if (result.description) {
          scenarioEntries.push({ type: 'system', content: `[white]${result.description}[/white]` });
        }
        scenarioEntries.push({ type: 'system', content: '' });
        useAppStore.getState().addEntries(scenarioEntries);
        break;
      }

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
          if (isStale()) return; // otra escena tomó el control: no seguir imprimiendo
          addEntry({ type: 'dialog', content: result.lines[i] });
          sfx.voice(result.character, result.lines[i]);
          if (i < result.lines.length - 1) {
            await delay(300, currentSpeed);
          }
        }
        if (result.tone) {
          lastToneRef.current = null;
          playTone(result.tone, 500);
        }
        if (noteAiLine(result.aiLineId, result.lines.join(' '))) {
          addEntry({ type: 'system', content: RATE_HINT });
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

      case 'dice_result': {
        const outcomeColors: Record<string, string> = {
          critical_success: 'green',
          success: 'green',
          failure: 'red',
          critical_failure: 'red',
        };
        const color = outcomeColors[result.outcome] || 'white';
        playDiceOutcome(result.outcome);
        if (result.sfx) {
          const extra = result.sfx;
          setTimeout(() => playSfx(extra), 350);
        }
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold cyan]🎲 Resultado: ${result.roll} + ${result.modifier} = ${result.total} (Dificultad: ${result.difficulty})[/bold cyan]` },
          { type: 'system', content: `[${color}]${result.text}[/${color}]` },
          { type: 'system', content: '' },
        ]);

        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'input_prompt':
        setPendingResult(result);
        break;

      case 'effects':
        if (debugActive) {
          debugLog(`Efectos aplicados: ${JSON.stringify(result)}`, 'STATE');
        }
        // Aviso de entradas nuevas del códice (bestiario)
        if (result.unlockCodex?.length && engine?.codex) {
          const codex = engine.codex;
          const names = result.unlockCodex.map((id) => codex.entries[id]?.title ?? id).join(', ');
          addEntry({ type: 'system', content: `[purple]📖 ${codex.title} actualizado: ${names}[/purple] [dim](/${codex.command})[/dim]` });
          sfx.play('libro');
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
        sfx.play(result.passed ? 'exito' : 'fallo');
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold cyan]🔍 ${result.description}[/bold cyan]` },
          { type: 'system', content: `[${checkColor}]${checkIcon} ${result.text}[/${checkColor}]` },
          { type: 'system', content: '' },
        ]);

        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'random_result':
        if (result.sfx) playSfx(result.sfx);
        useAppStore.getState().addEntries([
          { type: 'system', content: `[yellow]${result.text}[/yellow]` },
          { type: 'system', content: '' },
        ]);
        break;

      case 'shop_prompt':
        setPendingResult(result);
        break;

      case 'shop_dice_prompt':
        setPendingResult(result);
        break;

      case 'shop_dice_result': {
        const diceColor = result.success ? 'green' : 'red';
        sfx.play(result.success ? 'exito' : 'fallo');
        const actionLabel = result.action === 'haggle' ? '🗣️ Regateo' : result.action === 'steal' ? '🤫 Robo' : '🎭 Engaño';
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold]${actionLabel}[/bold] — 🎲 ${result.roll} + ${result.modifier} = ${result.total} vs DC ${result.difficulty}` },
          { type: 'system', content: `[${diceColor}]${result.text}[/${diceColor}]` },
          { type: 'system', content: '' },
        ]);
        break;
      }

      case 'combat_prompt':
        startCombatAudio(result.music);
        setPendingResult(result);
        break;

      case 'combat_turn':
        if (result.playerAction === 'ambush') startCombatAudio(result.music);
        playCombatTurn(result);
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold]⚔️ ${result.text}[/bold]` },
          { type: 'system', content: `[dim]Enemigo: ${result.enemyHp} HP | Tú: ${result.playerHp} HP[/dim]` },
          { type: 'system', content: '' },
        ]);
        break;

      case 'combat_end': {
        const combatColor = result.outcome === 'victory' ? 'green' : result.outcome === 'flee' ? 'yellow' : 'red';
        endCombatAudio(result.outcome, result.sfx);
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold ${combatColor}]${result.text}[/bold ${combatColor}]` },
          { type: 'system', content: '' },
        ]);

        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'chat_start': {
        sfx.play(CHAT_START_SFX[result.mode] ?? 'misterio');
        lastToneRef.current = null;
        useAppStore.getState().addEntries([
          { type: 'system', content: '[bold purple]╔══════════════════════════════════════════╗[/bold purple]' },
          { type: 'system', content: `[bold purple]  💬 ${CHAT_MODE_TITLES[result.mode] ?? 'Conversación'} con ${result.npcName}[/bold purple]` },
          { type: 'system', content: `[dim]  Escribe lo que quieras decir. Tienes ${result.maxTurns} ${result.maxTurns === 1 ? 'turno' : 'turnos'}. [bold]/rendirse[/bold] para abandonar.[/dim]` },
          { type: 'system', content: '[bold purple]╚══════════════════════════════════════════╝[/bold purple]' },
          { type: 'system', content: meterLine(result.meterLabel, result.score) },
          { type: 'system', content: '' },
        ]);
        break;
      }

      case 'chat_prompt':
        setPendingResult(result);
        break;

      case 'chat_reply': {
        const { seenCharacters, markCharacterSeen } = useAppStore.getState();
        const isFirstTime = !seenCharacters.has(result.character);
        if (isFirstTime) markCharacterSeen(result.character);
        if (result.delta !== 0) sfx.play(result.delta > 0 ? 'subir' : 'bajar');
        playTone(result.tone, 450);
        const deltaText = result.delta === 0 ? '' : result.delta > 0 ? ` [green](+${result.delta})[/green]` : ` [red](${result.delta})[/red]`;
        useAppStore.getState().addEntries([
          { type: 'dialogHeader', content: result.characterName, image: result.characterImage, firstAppearance: isFirstTime && !!result.characterImage },
          { type: 'dialog', content: result.text },
          { type: 'system', content: meterLine(result.meterLabel, result.score) + deltaText + (result.turnsLeft > 0 ? ` [dim]· quedan ${result.turnsLeft}[/dim]` : '') },
          ...(noteAiLine(result.aiLineId, result.text) ? [{ type: 'system' as const, content: RATE_HINT }] : []),
          { type: 'system', content: '' },
        ]);
        break;
      }

      case 'chat_end': {
        const verdictText: Record<string, string> = {
          success: '[bold green]✔ ¡Lo lograste![/bold green]',
          partial: '[bold yellow]≈ A medias[/bold yellow]',
          failure: '[bold red]✘ Fracaso[/bold red]',
        };
        sfx.play(result.gaveUp ? 'desinfle' : result.verdict === 'success' ? 'exito_chat' : result.verdict === 'failure' ? 'pifia' : 'notificacion');
        const entries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: result.gaveUp ? '[bold red]🏳 Te rendiste.[/bold red]' : verdictText[result.verdict ?? ''] ?? '[bold purple]Fin de la conversación[/bold purple]' },
        ];
        if (result.text) entries.push({ type: 'system', content: result.text });
        entries.push({ type: 'system', content: '' });
        useAppStore.getState().addEntries(entries);
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
        const notifySfx = result.sfx ?? NOTIFY_SFX[result.style];
        if (notifySfx && notifySfx !== 'none') playSfx(notifySfx);
        if (result.style === 'achievement') screenFx('gold');
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold ${nColor}]${icon} ${result.title}[/bold ${nColor}]` },
          { type: 'system', content: `[${nColor}]${result.text}[/${nColor}]` },
          { type: 'system', content: '' },
        ]);
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
        // Efecto one-shot: sintetizado del catálogo o archivo del juego
        let seconds = 0;
        if (result.sfx) {
          seconds = playSfx(result.sfx, result.volume);
        } else if (result.src) {
          const clip = new Audio(result.src);
          clip.volume = Math.min(1, result.volume * (useAppStore.getState().sfxVolume / 100));
          clip.play().catch(() => {});
          if (result.wait) {
            seconds = await new Promise<number>((resolve) => {
              clip.addEventListener('loadedmetadata', () => resolve(clip.duration || 0), { once: true });
              clip.addEventListener('error', () => resolve(0), { once: true });
            });
          }
        }
        if (result.wait && seconds > 0) await new Promise((r) => setTimeout(r, seconds * 1000));
        break;
      }

      case 'craft_prompt':
        setPendingResult(result);
        break;

      case 'craft_result': {
        const craftColor = result.success ? 'green' : 'yellow';
        const craftIcon = result.success ? '🔧' : '❌';
        sfx.play(result.success ? 'magia' : 'error');
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold ${craftColor}]${craftIcon} ${result.text}[/bold ${craftColor}]` },
          { type: 'system', content: '' },
        ]);
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
        sfx.play(result.correct ? 'exito' : 'error');
        const puzzleEntries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: `[bold ${puzzleColor}]${puzzleIcon} ${result.text}[/bold ${puzzleColor}]` },
        ];
        if (result.attemptsLeft !== undefined && !result.correct) {
          puzzleEntries.push({ type: 'system', content: `[dim]Intentos restantes: ${result.attemptsLeft}[/dim]` });
        }
        puzzleEntries.push({ type: 'system', content: '' });
        useAppStore.getState().addEntries(puzzleEntries);
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
        if (result.sfx) playSfx(result.sfx);
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold cyan]🔍 ${result.subjectLabel}[/bold cyan]` },
          { type: 'system', content: `[white]${result.text}[/white]` },
          { type: 'system', content: '' },
        ]);
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
        playSfx(result.sfx ?? (result.success ? 'exito' : 'error'));
        useAppStore.getState().addEntries([
          { type: 'system', content: `[bold ${uiColor}]${uiIcon} ${result.text}[/bold ${uiColor}]` },
          { type: 'system', content: '' },
        ]);
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
        sfx.play('nivel');
        screenFx('level');
        const lvlEntries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: `[bold green]⬆️ ¡${result.characterName} ha subido al nivel ${result.newLevel}![/bold green]` },
        ];
        for (const skill of result.skillsLearned) {
          lvlEntries.push({ type: 'system', content: `[green]  ✦ ${skill.name} (Nivel ${skill.level})[/green]` });
        }
        lvlEntries.push({ type: 'system', content: '' });
        useAppStore.getState().addEntries(lvlEntries);
        setShowEnterPrompt(true);
        await waitForEnterKey();
        setShowEnterPrompt(false);
        useAppStore.getState().fadeOldEntries();
        break;
      }

      case 'xp_gain': {
        const xpColor = result.leveledUp ? 'green' : 'cyan';
        sfx.play(result.leveledUp ? 'nivel' : 'xp');
        if (result.leveledUp) screenFx('level');
        const xpEntries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: `[${xpColor}]✨ ${result.characterName} gana ${result.amount} XP (${result.totalXp} total)[/${xpColor}]` },
        ];
        if (result.leveledUp) {
          xpEntries.push({ type: 'system', content: `[bold green]⬆️ ¡${result.characterName} sube al nivel ${result.newLevel}![/bold green]` });
        }
        useAppStore.getState().addEntries(xpEntries);
        break;
      }

      case 'relationship_change': {
        const relDelta = result.newAffinity - result.oldAffinity;
        const relColor = relDelta > 0 ? 'green' : 'red';
        const relIcon = relDelta > 0 ? '💚' : '💔';
        sfx.play(relDelta > 0 ? 'afinidad_sube' : 'afinidad_baja');
        const sign = relDelta > 0 ? '+' : '';
        const relEntries: import('../types/terminal').TerminalEntry[] = [
          { type: 'system', content: `[${relColor}]${relIcon} ${result.characterName}: ${sign}${relDelta} afinidad[/${relColor}]` },
        ];
        if (result.tierChanged) {
          const tierNames: Record<string, string> = {
            hostile: 'Hostil', distrustful: 'Desconfiado', neutral: 'Neutral',
            friendly: 'Amigable', allied: 'Aliado', loyal: 'Leal',
          };
          relEntries.push({ type: 'system', content: `[bold yellow]📊 Relación con ${result.characterName}: ${tierNames[result.tier] || result.tier}[/bold yellow]` });
        }
        useAppStore.getState().addEntries(relEntries);
        break;
      }

      case 'trait_change': {
        const traitEntries: import('../types/terminal').TerminalEntry[] = [];
        if (result.added.length) sfx.play('rasgo');
        for (const trait of result.added) {
          traitEntries.push({ type: 'system', content: `[bold purple]${trait.icon || '🔮'} Nuevo rasgo: ${trait.name}[/bold purple]` });
        }
        for (const trait of result.removed) {
          traitEntries.push({ type: 'system', content: `[dim]✕ Rasgo perdido: ${trait.name}[/dim]` });
        }
        if (traitEntries.length > 0) useAppStore.getState().addEntries(traitEntries);
        break;
      }

      case 'game_end':
        sfx.play('final');
        addEntry({
          type: 'system',
          content: '[bold green]Fin del juego.[/bold green]',
        });
        break;
    }
  };

  /** Primer momento de un combate: su música (si trae) y la alarma */
  const startCombatAudio = (music: string | undefined) => {
    if (combatRef.current) return;
    combatRef.current = { prevTrack: audioManager.track };
    sfx.play('combate');
    if (music && audioManager.track !== music) audioManager.play(music);
  };

  /** Fin del combate: jingle y vuelta a la música que sonaba antes */
  const endCombatAudio = (outcome: 'victory' | 'defeat' | 'flee', deathSfx?: string) => {
    const prev = combatRef.current?.prevTrack ?? null;
    combatRef.current = null;
    if (outcome === 'victory') {
      sfx.play(deathSfx ?? 'muere_enemigo');
      setTimeout(() => sfx.play('victoria'), 450);
    } else if (outcome === 'flee') {
      sfx.play('huida');
    } else {
      sfx.play('derrota');
    }
    if (outcome !== 'defeat' && prev && audioManager.track !== prev) {
      setTimeout(() => audioManager.play(prev), 1500);
    }
  };

  const sendAction = useCallback(
    async (action: PlayerAction) => {
      if (!engine) return;

      setPendingResult(null);
      if (action.type === 'choose' || action.type === 'submit_input') sfx.play('seleccion');
      else if (!SILENT_ACTIONS.has(action.type)) sfx.play('click');
      engine.sendAction(action);

      // Continue consuming results
      if (iteratorRef.current) {
        await consumeResults(iteratorRef.current);
      }
    },
    [engine]
  );

  return { startScene, startGame, sendAction };
}

/** Acciones cuyo sonido lo pone su propio widget (o que no suenan) */
const SILENT_ACTIONS = new Set<PlayerAction['type']>(['roll_dice', 'continue', 'chat_message']);

const NOTIFY_SFX: Record<string, string> = {
  achievement: 'logro',
  warning: 'alerta',
  info: 'notificacion',
  discovery: 'descubrimiento',
};

function playDiceOutcome(outcome: 'critical_success' | 'success' | 'failure' | 'critical_failure') {
  if (outcome === 'critical_success') {
    sfx.play('critico');
    screenFx('gold');
  } else if (outcome === 'critical_failure') {
    sfx.play('pifia');
    screenFx(undefined, 1);
  } else {
    sfx.play(outcome === 'success' ? 'exito' : 'fallo');
  }
}

/** Golpes del turno: el daño recibido lo pone observeState (vida que baja) */
function playCombatTurn(turn: { playerAction: string; playerDamage: number; sfx?: string }) {
  if (turn.sfx) sfx.play(turn.sfx);
  else if (turn.playerAction === 'attack') sfx.play(turn.playerDamage > 0 ? 'espada' : 'esquiva');
  else if (turn.playerAction === 'defend') sfx.play('bloqueo');
  else if (turn.playerDamage > 0) sfx.play('golpe');
}

/** Muerte: jingle, pantalla roja, y luego la música de game over (o silencio) */
function gameOverAudio(music: string | null) {
  sfx.setAmbience(null);
  audioManager.stop();
  const seconds = sfx.play('muerte');
  screenFx('death', 2);
  if (music) setTimeout(() => audioManager.play(music), Math.max(1, seconds) * 1000);
}

const CHAT_MODE_TITLES: Record<string, string> = {
  persuadir: 'Persuasión',
  negociar: 'Negociación',
  cancion: 'Canción',
  rap: 'Guerra de rap',
  insultos: 'Duelo de insultos',
  confesion: 'Confesión',
};

/** Medidor de texto: "Convencimiento ██████░░░░ 60%" */
function meterLine(label: string, score: number): string {
  const filled = Math.round(Math.max(0, Math.min(100, score)) / 10);
  const color = score >= 70 ? 'green' : score >= 40 ? 'yellow' : 'red';
  return `[${color}]${label} ${'█'.repeat(filled)}${'░'.repeat(10 - filled)} ${score}%[/${color}]`;
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

/** Cede el control al browser para que pueda pintar y procesar eventos */
function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    if ('scheduler' in window && typeof (window as any).scheduler?.yield === 'function') {
      (window as any).scheduler.yield().then(resolve);
    } else {
      setTimeout(resolve, 0);
    }
  });
}
