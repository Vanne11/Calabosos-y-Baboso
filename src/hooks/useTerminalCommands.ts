// hooks/useTerminalCommands.ts
// Procesa comandos de la terminal (help, run, list, debug, etc.)

import { useCallback } from 'react';
import { useAppStore, clearSession } from '../store/useAppStore';
import { useDebugStore } from '../store/useDebugStore';
import { useEditorStore } from '../editor/store/useEditorStore';
import { parseCommand } from '../engine/CommandParser';
import { loadGame, listGames } from '../engine/GameLoader';
import { rebaseFeedback } from '../audio/gameFeedback';
import { sfx } from '../audio/SfxPlayer';
import { SFX } from '../audio/sfxCatalog';
import { AMBIENCES } from '../audio/ambience';
import { GameEngine } from '../engine/GameEngine';
import { assetUrl } from '../utils/assetUrl';
import { delay } from '../utils/delay';
import { saveGame, loadSave, listSlots } from '../utils/storage';
import type { SaveData } from '../utils/storage';
import { getAiClient, getLastAiLine, noteAiLine } from '../ai/session';
import { toneSfx } from '../audio/tones';
import { setAiPreference, getAiPreference } from '../ai/AiClient';

export function useTerminalCommands() {
  const addEntry = useAppStore((s) => s.addEntry);
  const addEntries = useAppStore((s) => s.addEntries);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const setHistory = useAppStore((s) => s.setHistory);
  const setEngine = useAppStore((s) => s.setEngine);
  const setGameManifest = useAppStore((s) => s.setGameManifest);
  const setGameBasePath = useAppStore((s) => s.setGameBasePath);
  const setPhase = useAppStore((s) => s.setPhase);
  const setCurrentImage = useAppStore((s) => s.setCurrentImage);
  const resetGame = useAppStore((s) => s.resetGame);
  const phase = useAppStore((s) => s.phase);
  const speed = useAppStore((s) => s.speed);
  const volume = useAppStore((s) => s.volume);

  const debugActive = useDebugStore((s) => s.active);
  const debugToggle = useDebugStore((s) => s.toggle);
  const debugLog = useDebugStore((s) => s.log);
  const debugReport = useDebugStore((s) => s.getReport);
  const debugClear = useDebugStore((s) => s.clear);

  // --- In-game commands ---

  const gameHelp = () => {
    addEntry({
      type: 'system',
      content: `[green]Comandos disponibles durante la partida:[/green]

[yellow][bold]/help[/bold][/yellow] - Muestra esta ayuda. Sí, la que estás leyendo ahora mismo.
[yellow][bold]/save[/bold][/yellow] - Guarda tu partida en un slot. Por si la pifias (que lo harás).
[yellow][bold]/load[/bold][/yellow] - Carga una partida guardada. Para revivir tus fracasos.
[yellow][bold]/clear[/bold][/yellow] - Limpia la pantalla sin perder tu widget actual. Perfecto para fingir que no viste nada.
[yellow][bold]/history[/bold][/yellow] - Revive todos los momentos de gloria (y vergüenza) de tu partida.
[yellow][bold]/inventario[/bold][/yellow] - Abre el inventario completo. Para admirar tu basura con más detalle.
[yellow][bold]/about[/bold][/yellow] - Información sobre el juego que estás jugando. Por si ya se te olvidó.
[yellow][bold]/debug[/bold][/yellow] - Sistema de depuración. Para ver tus errores con más detalle.
[yellow][bold]/ia[/bold][/yellow] [dim][on|off][/dim] - Estado del narrador con IA, o encenderlo/apagarlo.
[yellow][bold]/rendirse[/bold][/yellow] - Abandona una conversación (modo chat). Cobarde, pero legal.
[yellow][bold]/narrador[/bold][/yellow] [dim]<texto>[/dim] - Háblale al narrador cuando quieras (con IA). Pocas veces por partida: tiene sindicato.
[yellow][bold]/bien[/bold][/yellow] o [yellow][bold]/mal[/bold][/yellow] - Califica la última línea del narrador con IA. Le importa. Mucho. No se lo digas.
[yellow][bold]/quit[/bold][/yellow] o [yellow][bold]/exit[/bold][/yellow] - Abandona la partida. Nadie te culpará (mentira, sí).

[dim]Usa siempre el prefijo "/" para comandos durante la partida.[/dim]`,
    });
  };

  /** Muestra el códice del juego (bestiario): lista por categoría o una entrada */
  const gameCodex = (args: string[]) => {
    const engine = useAppStore.getState().engine;
    const codex = engine?.codex;
    if (!engine || !codex) return;
    const unlocked = (engine.state.codex ?? []).filter((id) => codex.entries[id]);
    const total = Object.keys(codex.entries).length;
    if (!unlocked.length) {
      addEntry({ type: 'system', content: `[purple][bold]📖 ${codex.title}[/bold][/purple]\n[dim]Vacío. Todavía no sabes nada de nada. Como siempre.[/dim]` });
      return;
    }
    const n = parseInt(args[0] ?? '', 10);
    if (n >= 1 && n <= unlocked.length) {
      const e = codex.entries[unlocked[n - 1]];
      addEntry({ type: 'system', content: `[purple][bold]${e.icon ?? '📖'} ${e.title}[/bold][/purple]\n${e.text}` });
      return;
    }
    const byCat = new Map<string, string[]>();
    unlocked.forEach((id, i) => {
      const e = codex.entries[id];
      const cat = e.category ?? 'Varios';
      byCat.set(cat, [...(byCat.get(cat) ?? []), `  [yellow][${i + 1}][/yellow] ${e.icon ?? '•'} ${e.title}`]);
    });
    const body = [...byCat].map(([cat, lines]) => `[cyan]${cat}[/cyan]\n${lines.join('\n')}`).join('\n');
    addEntry({
      type: 'system',
      content: `[purple][bold]📖 ${codex.title}[/bold][/purple] [dim](${unlocked.length}/${total})[/dim]\n${body}\n[dim]/${codex.command} <número> para leer una entrada.[/dim]`,
    });
  };

  const gameAi = (args: string[]) => {
    const arg = (args[0] ?? '').toLowerCase();
    if (arg === 'on' || arg === 'off') {
      setAiPreference(arg === 'on');
      addEntry({
        type: 'system',
        content: arg === 'on'
          ? '[green]Narrador con IA: activado.[/green] [dim]Prepárate para burlas nuevas e inéditas.[/dim]'
          : '[yellow]Narrador con IA: apagado.[/yellow] [dim]Volvemos a las burlas clásicas, que igual duelen.[/dim]',
      });
      return;
    }
    const client = getAiClient();
    const st = client?.status();
    let line: string;
    if (!client) line = '[dim]Este juego no usa IA.[/dim]';
    else if (!st?.server) line = '[yellow]No hay conexión con el servidor de IA. Se usan los textos fijos y los dados.[/yellow]';
    else if (!st.enabled) line = '[yellow]La IA está apagada en el servidor. Se usan los textos fijos y los dados.[/yellow]';
    else line = `[green]Servidor de IA conectado.[/green] Narración: ${st.narrate ? 'sí' : 'no'} · Acción libre: ${st.freeAction ? 'sí' : 'no'} · Modos chat: ${st.modes.length ? st.modes.join(', ') : 'ninguno'}`;
    addEntry({
      type: 'system',
      content: `${line}\nTu preferencia: ${getAiPreference() ? '[green]activada[/green]' : '[yellow]apagada[/yellow]'} [dim](/ia on · /ia off)[/dim]`,
    });
  };

  /** /narrador <texto>: el jugador le habla al narrador fuera de la historia */
  const talkToNarrator = async (message: string) => {
    const state = useAppStore.getState();
    const engine = state.engine;
    if (!engine) {
      addEntry({ type: 'system', content: '[dim]No hay partida en curso. El narrador está de vacaciones.[/dim]' });
      return;
    }
    if (state.pendingResult?.type === 'chat_prompt') {
      addEntry({ type: 'system', content: '[dim]Estás en medio de una conversación. El narrador espera su turno (y lo cobra).[/dim]' });
      return;
    }
    if (!message.trim()) {
      addEntry({ type: 'system', content: '[dim]Uso: /narrador <lo que quieras decirle>. Ejemplo: /narrador ¿por qué me odias?[/dim]' });
      return;
    }
    addEntry({ type: 'system', content: `[cyan]> (al narrador) ${message.replace(/\[/g, '(').replace(/\]/g, ')')}[/cyan]` });
    addEntry({ type: 'system', content: '[dim italic]El narrador deja lo que estaba haciendo. Suspira…[/dim italic]' });
    const res = await engine.talkToNarrator(message);
    if (!res.ok) {
      const why: Record<typeof res.reason, string> = {
        no_ai: '[dim]El narrador no está disponible para charlas (sin IA). Solo narra, y a regañadientes.[/dim]',
        limit: '[yellow]Ya gastaste tus charlas con el narrador en esta partida.[/yellow] [dim]Tiene sindicato.[/dim]',
        cooldown: `[yellow]El narrador está ocupado narrando.[/yellow] [dim]Vuelve a intentarlo en ${res.scenesLeft ?? 1} ${res.scenesLeft === 1 ? 'escena' : 'escenas'}.[/dim]`,
        failed: '[yellow]El narrador se hizo el sordo[/yellow] [dim](sin respuesta del servidor).[/dim]',
      };
      addEntry({ type: 'system', content: why[res.reason] });
      return;
    }
    const narrator = engine.narrator;
    state.addEntries([
      { type: 'dialogHeader', content: narrator.name, image: narrator.image },
      { type: 'dialog', content: res.text },
      ...(noteAiLine(res.lineId, res.text)
        ? [{ type: 'system' as const, content: '[dim italic]¿Te hizo reír? /bien · ¿Fue un asco? /mal[/dim italic]' }]
        : []),
    ]);
    const tone = toneSfx(res.tone ?? undefined, engine.audioConfig?.toneSfx);
    if (tone) setTimeout(() => sfx.play(tone), 450);
    state.setPlayerState(engine.state);
  };

  /** /bien y /mal: califica la última línea generada por la IA */
  const rateAiLine = async (rating: 1 | -1) => {
    const client = getAiClient();
    const line = getLastAiLine();
    if (!client || !line) {
      addEntry({ type: 'system', content: '[dim]No hay ninguna línea de la IA que calificar. Todo lo que leíste lo escribió un humano. Uno triste.[/dim]' });
      return;
    }
    if (line.rated === rating) {
      addEntry({ type: 'system', content: '[dim]Ya lo anoté. No insistas, que se me sube a la cabeza.[/dim]' });
      return;
    }
    const ok = await client.rate(line.id, rating);
    if (!ok) {
      addEntry({ type: 'system', content: '[yellow]No se pudo guardar la calificación (sin conexión con el servidor).[/yellow]' });
      return;
    }
    line.rated = rating;
    addEntry({
      type: 'system',
      content: rating === 1
        ? '[green]👍 Anotado.[/green] [dim]El narrador finge que no le importa. Le importa.[/dim]'
        : '[red]👎 Anotado.[/red] [dim]El narrador se lo toma con madurez. Mentira: está llorando.[/dim]',
    });
  };

  const gameAbout = () => {
    const manifest = useAppStore.getState().gameManifest;
    if (!manifest) {
      addEntry({ type: 'system', content: '[dim]No hay juego cargado.[/dim]' });
      return;
    }
    addEntry({
      type: 'system',
      content: `[green][bold]${manifest.name}[/bold][/green]
${manifest.description ? `[cyan]${manifest.description}[/cyan]` : ''}
[dim]Versión: ${manifest.version ?? '???'} — Autor: ${manifest.author ?? 'Desconocido'}[/dim]`,
    });
  };

  const gameHistory = () => {
    const history = useAppStore.getState().history;
    // Filter to narrative-relevant entries only
    const narrativeTypes = new Set(['dialog', 'dialogHeader', 'option', 'system', 'success', 'warning', 'info']);
    const relevant = history.filter((e) => narrativeTypes.has(e.type) && e.content.trim());

    if (relevant.length === 0) {
      addEntry({ type: 'system', content: '[dim]No hay historial narrativo todavía. Haz algo interesante primero.[/dim]' });
      return;
    }

    addEntry({ type: 'system', content: '[green][bold]═══ Historial de la partida ═══[/bold][/green]' });
    // Show last 50 entries max to avoid flooding
    const shown = relevant.slice(-50);
    if (relevant.length > 50) {
      addEntry({ type: 'system', content: `[dim]... (mostrando las últimas 50 de ${relevant.length} entradas)[/dim]` });
    }
    for (const entry of shown) {
      addEntry({ type: entry.type, content: entry.content });
    }
    addEntry({ type: 'system', content: '[green][bold]═══ Fin del historial ═══[/bold][/green]' });
  };

  const gameSave = async () => {
    const state = useAppStore.getState();
    const manifest = state.gameManifest;
    if (!manifest) return;

    const saveConfig = manifest.saveSystem;
    const mode = saveConfig?.mode ?? 'free';

    if (mode === 'checkpoint') {
      addEntry({
        type: 'system',
        content: '[yellow]Este juego usa guardado automático por checkpoints. No puedes guardar manualmente.[/yellow]',
      });
      return;
    }

    const totalSlots = Math.min(Math.max(saveConfig?.slots ?? 3, 1), 10);
    const gameName = state.gameBasePath.split('/').pop() ?? 'unknown';
    const slots = await listSlots(gameName, totalSlots);

    const lines = slots.map((slot, i) => {
      if (slot) {
        const date = new Date(slot.timestamp);
        const dateStr = date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
        const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        const label = slot.sceneName ?? slot.currentScene;
        return `  [yellow][bold][${i + 1}][/bold][/yellow] ${label} [dim]- ${dateStr} ${timeStr}[/dim]`;
      }
      return `  [yellow][bold][${i + 1}][/bold][/yellow] [dim]--- vacío ---[/dim]`;
    });

    addEntry({
      type: 'system',
      content: `[green][bold]═══ GUARDAR PARTIDA ═══[/bold][/green]
${lines.join('\n')}

[cyan]Selecciona slot [1-${totalSlots}] (0 para cancelar):[/cyan]`,
    });

    useAppStore.getState().setPendingSlotAction({ type: 'save', slots: totalSlots });
  };

  const gameLoad = async () => {
    const state = useAppStore.getState();
    const manifest = state.gameManifest;
    if (!manifest) return;

    const totalSlots = Math.min(Math.max(manifest.saveSystem?.slots ?? 3, 1), 10);
    const gameName = state.gameBasePath.split('/').pop() ?? 'unknown';
    const slots = await listSlots(gameName, totalSlots);

    const hasAnySave = slots.some((s) => s !== null);
    if (!hasAnySave) {
      addEntry({
        type: 'system',
        content: '[yellow]No hay partidas guardadas. Primero tienes que guardar algo, genio.[/yellow]',
      });
      return;
    }

    const lines = slots.map((slot, i) => {
      if (slot) {
        const date = new Date(slot.timestamp);
        const dateStr = date.toLocaleDateString('es', { day: '2-digit', month: '2-digit' });
        const timeStr = date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        const label = slot.sceneName ?? slot.currentScene;
        const cp = slot.isCheckpoint ? ' [dim](checkpoint)[/dim]' : '';
        return `  [yellow][bold][${i + 1}][/bold][/yellow] ${label}${cp} [dim]- ${dateStr} ${timeStr}[/dim]`;
      }
      return `  [dim]  [${i + 1}]  --- vacío ---[/dim]`;
    });

    addEntry({
      type: 'system',
      content: `[green][bold]═══ CARGAR PARTIDA ═══[/bold][/green]
${lines.join('\n')}

[cyan]Selecciona slot (0 para cancelar):[/cyan]`,
    });

    useAppStore.getState().setPendingSlotAction({ type: 'load', slots: totalSlots });
  };

  const gameClear = () => {
    if (debugActive) {
      addEntry({
        type: 'system',
        content: '[yellow]No se puede limpiar la terminal mientras el modo debug está activo.[/yellow]',
      });
      return;
    }
    // Keep only the last widget-related entries (dialog headers, recent system messages)
    const history = useAppStore.getState().history;
    // Find the last significant block: from the last dialogHeader or scenario marker
    let keepFrom = history.length;
    for (let i = history.length - 1; i >= 0; i--) {
      const entry = history[i];
      if (entry.type === 'dialogHeader') {
        keepFrom = i;
        break;
      }
    }
    // Keep from the dialogHeader to the end, plus a separator
    const kept = keepFrom < history.length ? history.slice(keepFrom) : [];
    setHistory([
      { type: 'system', content: '[dim]Terminal limpiada. Lo que pasó, pasó.[/dim]' },
      ...kept,
    ]);
  };

  const processGameCommand = async (name: string, args: string[], input: string): Promise<boolean> => {
    switch (name) {
      case 'help':
        gameHelp();
        return true;
      case 'about':
        gameAbout();
        return true;
      case 'history':
        gameHistory();
        return true;
      case 'clear':
        gameClear();
        return true;
      case 'save':
        await gameSave();
        return true;
      case 'load':
        await gameLoad();
        return true;
      case 'version':
        addEntry({
          type: 'system',
          content: '[bold]Motor Baboso v0.1.0[/bold] - [italic]"Más viscoso que funcional"[/italic]',
        });
        return true;
      case 'debug':
        handleDebug(args);
        return true;
      case 'ia':
        gameAi(args);
        return true;
      case 'narrador':
      case 'hablar':
        void talkToNarrator(args.join(' '));
        return true;
      case 'bien':
        void rateAiLine(1);
        return true;
      case 'mal':
        void rateAiLine(-1);
        return true;
      case 'rendirse':
        addEntry({ type: 'system', content: '[dim]Solo puedes rendirte en medio de una conversación. Aquí no hay a quién rendirse.[/dim]' });
        return true;
      case 'inventario':
      case 'inv':
      case 'inventory': {
        const current = useAppStore.getState().inventoryExpanded;
        useAppStore.getState().setInventoryExpanded(!current);
        return true;
      }
      case 'quit':
      case 'exit':
        resetGame();
        setCurrentImage(null);
        addEntry({
          type: 'system',
          content: '[italic]Abandonando la partida. Otra vez será... o no.[/italic]',
        });
        return true;
      case 'run':
      case 'list':
      case 'editor':
      case 'create':
        addEntry({
          type: 'warning',
          content: '[yellow]Estás en medio de una partida. Usa [bold]/quit[/bold] primero si quieres salir.[/yellow]',
        });
        return true;
      default:
        // Comando del códice definido por el juego (ej: /bestiario)
        if (useAppStore.getState().engine?.codex?.command === name) {
          gameCodex(args);
          return true;
        }
        return false;
    }
  };

  // --- Main command processor ---

  const processCommand = useCallback(
    async (input: string) => {
      const { name, args } = parseCommand(input);

      if (debugActive) {
        debugLog(`Comando: ${input}`, 'COMMAND');
      }

      // In-game: use game-specific commands
      if (phase === 'game') {
        if (await processGameCommand(name, args, input)) return;
        addEntry({
          type: 'system',
          content: `[red]"${input}"[/red] no es un comando válido durante la partida.

[yellow]Escribe [bold]/help[/bold] para ver los comandos disponibles.[/yellow]`,
        });
        return;
      }

      // Shell commands
      switch (name) {
        case 'help':
          addEntry({
            type: 'system',
            content: `[green]Comandos disponibles (para seres con intelecto limitado):[/green]

[yellow][bold]/help[/bold][/yellow] - Muestra esta patética lista de comandos. Enhorabuena, has demostrado ser capaz de pedir ayuda.
[yellow][bold]/clear[/bold][/yellow] - Limpia la pantalla. Como cuando niegas tu historial de búsqueda.
[yellow][bold]/version[/bold][/yellow] - Muestra la versión del motor. Porque seguro que te importa.
[yellow][bold]/about[/bold][/yellow] - Información sobre el [italic]glorioso[/italic] Motor Baboso.
[yellow][bold]/run [game][/bold][/yellow] - Corre un juego. Ejemplo: [cyan]/run demo[/cyan]. ¿Serás capaz de escribirlo correctamente?
[yellow][bold]/list[/bold][/yellow] - Muestra los juegos disponibles. Spoiler: hay pocos.
[yellow][bold]/editor [game][/bold][/yellow] o [yellow][bold]/create[/bold][/yellow] - Abre el editor visual de historias. Con nombre de juego lo carga para editar. Ejemplo: [cyan]/editor demo[/cyan].
[yellow][bold]/debug[/bold][/yellow] - Activa el modo de depuración. Para ver opciones escribe [cyan]/debug[/cyan] sin argumentos.
[yellow][bold]/quit[/bold][/yellow] o [yellow][bold]/exit[/bold][/yellow] - Abandona como siempre lo haces. Cierra la sesión.

[dim]Nota: Los comandos funcionan con o sin el prefijo "/"[/dim]`,
          });
          break;

        case 'clear':
          if (debugActive) {
            addEntry({
              type: 'system',
              content:
                '[yellow]No se puede limpiar la terminal mientras el modo debug está activo.[/yellow]',
            });
          } else {
            clearHistory();
            addEntry({
              type: 'system',
              content:
                '[dim]Terminal limpiada. Como tus esperanzas.[/dim]',
            });
          }
          break;

        case 'version':
          addEntry({
            type: 'system',
            content:
              '[bold]Motor Baboso v0.1.0[/bold] - [italic]"Más viscoso que funcional"[/italic]',
          });
          break;

        case 'about':
          await handleAbout();
          break;

        case 'run': {
          if (args.length === 0) {
            addEntry({
              type: 'error',
              content:
                '[red]¿Abrir QUÉ exactamente? Especifica el nombre del juego, iluminado. Ejemplo: [bold]run demo[/bold][/red]',
            });
            break;
          }
          await handleRun(args[0]);
          break;
        }

        case 'list': {
          await handleList();
          break;
        }

        case 'editor':
        case 'create':
          if (args.length > 0) {
            await handleEditorWithGame(args[0]);
          } else {
            addEntry({
              type: 'system',
              content: '[yellow]Abriendo el editor visual de historias...[/yellow]',
            });
            addEntry({
              type: 'system',
              content: '[dim]Prepárate para crear algo que probablemente nadie jugará.[/dim]',
            });
            await delay(500, speed);
            setPhase('editor');
          }
          break;

        case 'debug':
          handleDebug(args);
          break;

        case 'quit':
        case 'exit':
          clearSession();
          resetGame();
          setCurrentImage(null);
          addEntry({
            type: 'system',
            content:
              '[italic]Abandonando como siempre lo haces. Cerrando sesión...[/italic]',
          });
          break;

        default:
          addEntry({
            type: 'system',
            content: `[red]"${input}"[/red] no es un comando válido, cerebrito.

[yellow]Escribe [bold]help[/bold] para ver los comandos disponibles que tal vez puedas entender.[/yellow]`,
          });
      }
    },
    [debugActive, phase, speed, volume]
  );

  const handleAbout = async () => {
    const audio = new Audio('audio/about_theme.mp3');
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch(() => {});

    setCurrentImage(assetUrl('images/about/about1.png'));
    clearHistory();

    addEntry({
      type: 'system',
      content:
        '[green][bold]MOTOR BABOSO[/bold][/green] - La plataforma terminal viscosa para aventuras',
    });

    const readmeLines = [
      '# 🐌 Motor Baboso: Calabosos y Babosos™',
      '',
      '**La terminal viscosa para aventuras textuales que nadie pidió.**',
      '',
      'Bienvenido. Este motor ejecuta juegos grotescos en una terminal sarcástica. Está hecho con React + Vite porque claro, ¿por qué no?',
      '',
      '## ¿Y esto para qué sirve?',
      '',
      'Para cargar juegos. Para burlarse de tus decisiones. Para darte control... o al menos la ilusión.',
      '',
      '## Funciones clave (más o menos)',
      '',
      '- **Terminal interactiva** con comandos, color y desprecio.',
      '- **Rutas condicionales** que probablemente nunca cumplas.',
      '- **Personajes juzgones** que recuerdan tus errores.',
      '- **Widgets** que hacen cosas. A veces.',
      '- **Día y noche**, porque las babosas también duermen.',
      '- **Datos guardados**, por si querés sufrir dos veces.',
      '',
      '> "Esto no es solo un juego. Es una advertencia."',
      '',
      '## Código fuente baboso',
      '',
      '[bold]github.com/vane11/calabosos-y-babosos[/bold]',
      '¿Te animás a ver el código? Bueno, te advertimos...',
      '',
      'atte. Nicolás y Vanessa',
    ];

    for (const line of readmeLines) {
      await delay(600, speed);
      let formatted = line;
      if (formatted.startsWith('# '))
        formatted = `[green][bold]${formatted.substring(2)}[/bold][/green]`;
      else if (formatted.startsWith('## '))
        formatted = `[cyan][bold]${formatted.substring(3)}[/bold][/cyan]`;
      else if (formatted.startsWith('> '))
        formatted = `[yellow][italic]${formatted}[/italic][/yellow]`;
      else if (formatted.startsWith('- ')) {
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '[bold]$1[/bold]');
        formatted = `[purple]${formatted}[/purple]`;
      } else {
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '[bold]$1[/bold]');
      }

      addEntry({
        type: 'system',
        content: formatted || '\u00A0',
      });
    }

    // After all lines shown, wait then cleanup
    await delay(3000, speed);
    audio.pause();
    audio.currentTime = 0;
    setCurrentImage(null);
    addEntry({
      type: 'system',
      content:
        '[green]Fin del about. Ya puedes volver a fingir que entiendes este juego.[/green]',
    });
  };

  const handleRun = async (gameName: string) => {
    try {
      addEntry({
        type: 'system',
        content: `[yellow]Cargando "${gameName}"...[/yellow]`,
      });

      const { manifest, scenes } = await loadGame(gameName);
      const basePath = `games/${gameName}`;
      const engine = new GameEngine(manifest, scenes, basePath);

      setEngine(engine);
      setGameManifest(manifest);
      setGameBasePath(basePath);
      setPhase('game');

      if (!debugActive) {
        clearHistory();
      }

      addEntries([
        {
          type: 'system',
          content: '[green]¡Juego cargado correctamente![/green]',
        },
        {
          type: 'system',
          content: `[yellow]Iniciando [bold]${manifest.name}[/bold]...[/yellow]`,
        },
        {
          type: 'system',
          content: '[dim]Prepárate para tomar decisiones terribles.[/dim]',
        },
        { type: 'system', content: ' ' },
      ]);

      if (debugActive) {
        debugLog(`Juego cargado: ${manifest.name}`, 'INFO');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addEntry({
        type: 'error',
        content: `[red]Error cargando "${gameName}": ${msg}[/red]`,
      });
    }
  };

  const handleList = async () => {
    try {
      const games = await listGames();
      if (games.length === 0) {
        addEntry({
          type: 'system',
          content: '[red]No se encontraron juegos jugables.[/red]',
        });
        return;
      }
      const lines = games.map(
        (g) =>
          `[yellow][bold]${g.name}[/bold][/yellow] - ${g.description} [dim](v${g.version} por ${g.author})[/dim]`
      );
      addEntry({
        type: 'system',
        content: `[green]Juegos disponibles:[/green]\n${lines.join('\n')}`,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      addEntry({
        type: 'error',
        content: `[red]Error listando juegos: ${msg}[/red]`,
      });
    }
  };

  const handleDebug = (args: string[]) => {
    if (args.length === 0) {
      addEntry({
        type: 'system',
        content: `[yellow]Opciones de depuración:[/yellow]
[green]debug on[/green] - Activa el modo depuración
[green]debug off[/green] - Desactiva el modo depuración
[green]debug status[/green] - Estado actual
[green]debug history[/green] - Historial de eventos
[green]debug clear[/green] - Limpia historial de debug
[green]debug report[/green] - Informe completo
[green]debug goto <escena>[/green] - Salta a una escena (solo en partida, con debug activo)
[green]debug sfx [nombre][/green] - Lista los efectos de sonido o toca uno
[green]debug ambiente [nombre|none][/green] - Lista los ambientes o pone uno`,
      });
      return;
    }

    switch (args[0]) {
      case 'on':
        useDebugStore.getState().enable();
        addEntry({
          type: 'success',
          content: '[green]Modo depuración activado.[/green]',
        });
        break;
      case 'off':
        useDebugStore.getState().disable();
        addEntry({
          type: 'system',
          content: '[dim]Modo depuración desactivado.[/dim]',
        });
        break;
      case 'status':
        addEntry({
          type: 'system',
          content: `[cyan]Debug:[/cyan] ${debugActive ? '[green]ACTIVO[/green]' : '[dim]INACTIVO[/dim]'}`,
        });
        break;
      case 'history':
        addEntry({
          type: 'system',
          content: debugReport(),
        });
        break;
      case 'clear':
        debugClear();
        addEntry({
          type: 'system',
          content: '[dim]Historial de debug limpiado.[/dim]',
        });
        break;
      case 'report':
        addEntry({
          type: 'system',
          content: debugReport(),
        });
        break;
      case 'sfx':
        if (!args[1]) {
          addEntry({
            type: 'system',
            content: `[yellow]Efectos (${Object.keys(SFX).length}):[/yellow]\n` +
              Object.entries(SFX).map(([name, def]) => `[green]${name}[/green]${def.jingle ? ' [purple]♪[/purple]' : ''} [dim]${def.desc}[/dim]`).join('\n'),
          });
        } else if (sfx.has(args[1])) {
          sfx.play(args[1]);
        } else {
          addEntry({ type: 'warning', content: `[yellow]No existe el efecto "${args[1]}". Usa [bold]debug sfx[/bold] para ver la lista.[/yellow]` });
        }
        break;
      case 'ambiente':
        if (!args[1]) {
          addEntry({
            type: 'system',
            content: `[yellow]Ambientes:[/yellow] [dim](sonando: ${sfx.currentAmbience ?? 'ninguno'})[/dim]\n` +
              Object.entries(AMBIENCES).map(([name, def]) => `[green]${name}[/green] [dim]${def.desc}[/dim]`).join('\n'),
          });
        } else if (args[1] === 'none' || args[1] in AMBIENCES) {
          sfx.setAmbience(args[1] === 'none' ? null : args[1]);
        } else {
          addEntry({ type: 'warning', content: `[yellow]No existe el ambiente "${args[1]}".[/yellow]` });
        }
        break;
      default:
        addEntry({
          type: 'warning',
          content: `[yellow]Subcomando debug desconocido: ${args[0]}[/yellow]`,
        });
    }
  };

  const handleEditorWithGame = async (gameName: string) => {
    addEntry({
      type: 'system',
      content: `[yellow]Cargando "${gameName}" en el editor...[/yellow]`,
    });
    addEntry({
      type: 'system',
      content: '[dim]Abriendo el editor... intenta no romper nada.[/dim]',
    });

    useEditorStore.getState().setPendingGameImport(gameName);
    await delay(500, speed);
    setPhase('editor');
  };

  const handleSlotInput = useCallback(
    async (input: string, startScene: (sceneId: string) => Promise<void>) => {
      const state = useAppStore.getState();
      const pending = state.pendingSlotAction;
      if (!pending) return;

      const num = parseInt(input);

      // Cancel
      if (num === 0) {
        state.setPendingSlotAction(null);
        addEntry({ type: 'system', content: '[dim]Cancelado.[/dim]' });
        return;
      }

      if (isNaN(num) || num < 1 || num > pending.slots) {
        addEntry({ type: 'warning', content: `[yellow]Selecciona un número entre 0 y ${pending.slots}.[/yellow]` });
        return;
      }

      const manifest = state.gameManifest;
      const gameName = state.gameBasePath.split('/').pop() ?? 'unknown';

      if (pending.type === 'save') {
        const saveConfig = manifest?.saveSystem;
        const existing = await loadSave(gameName, num);

        if (existing && saveConfig?.allowOverwrite === false) {
          addEntry({ type: 'warning', content: '[yellow]Este slot ya está ocupado y el juego no permite sobreescribir.[/yellow]' });
          state.setPendingSlotAction(null);
          return;
        }

        // Get current scene name from engine
        const engine = state.engine;
        const currentScene = state.currentScene;
        const sceneName = engine?.getScenarioName?.(currentScene) ?? currentScene;

        const data: SaveData = {
          playerState: state.playerState!,
          currentScene,
          gameName,
          timestamp: Date.now(),
          sceneName,
          isCheckpoint: false,
        };

        await saveGame(gameName, num, data);
        state.setPendingSlotAction(null);
        addEntry({
          type: 'success',
          content: `[green]Partida guardada en slot ${num}.[/green] [dim](${sceneName})[/dim]`,
        });
      } else {
        // Load
        const save = await loadSave(gameName, num);
        if (!save) {
          addEntry({ type: 'warning', content: '[yellow]Ese slot está vacío.[/yellow]' });
          return;
        }

        state.setPendingSlotAction(null);

        // Restore state
        const engine = state.engine;
        if (engine) {
          engine.restoreState(save.playerState);
        }
        state.setPlayerState(save.playerState);
        rebaseFeedback(engine?.state ?? null);
        clearHistory();
        addEntry({
          type: 'success',
          content: `[green]Partida cargada desde slot ${num}.[/green] Volviendo a [cyan]"${save.sceneName ?? save.currentScene}"[/cyan]...`,
        });

        // Navigate to saved scene
        await startScene(save.currentScene);
      }
    },
    []
  );

  return { processCommand, handleSlotInput };
}
