// hooks/useTerminalCommands.ts
// Procesa comandos de la terminal (help, run, list, debug, etc.)

import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useDebugStore } from '../store/useDebugStore';
import { useEditorStore } from '../editor/store/useEditorStore';
import { parseCommand } from '../engine/CommandParser';
import { loadGame, listGames } from '../engine/GameLoader';
import { GameEngine } from '../engine/GameEngine';
import { delay } from '../utils/delay';

export function useTerminalCommands() {
  const addEntry = useAppStore((s) => s.addEntry);
  const addEntries = useAppStore((s) => s.addEntries);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const setEngine = useAppStore((s) => s.setEngine);
  const setGameManifest = useAppStore((s) => s.setGameManifest);
  const setGameBasePath = useAppStore((s) => s.setGameBasePath);
  const setPhase = useAppStore((s) => s.setPhase);
  const setCurrentImage = useAppStore((s) => s.setCurrentImage);
  const resetGame = useAppStore((s) => s.resetGame);
  const speed = useAppStore((s) => s.speed);
  const volume = useAppStore((s) => s.volume);

  const debugActive = useDebugStore((s) => s.active);
  const debugToggle = useDebugStore((s) => s.toggle);
  const debugLog = useDebugStore((s) => s.log);
  const debugReport = useDebugStore((s) => s.getReport);
  const debugClear = useDebugStore((s) => s.clear);

  const processCommand = useCallback(
    async (input: string) => {
      const { name, args } = parseCommand(input);

      if (debugActive) {
        debugLog(`Comando: ${input}`, 'COMMAND');
      }

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
    [debugActive, speed, volume]
  );

  const handleAbout = async () => {
    const audio = new Audio('audio/about_theme.mp3');
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch(() => {});

    setCurrentImage('images/about/about1.png');
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
[green]debug report[/green] - Informe completo`,
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

  return { processCommand };
}
