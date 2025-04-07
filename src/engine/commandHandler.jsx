// engine/commandHandler.jsx
// Maneja los comandos ingresados en la terminal con respuestas sarcásticas dignas de una babosa

import { loadLocalGame } from './gameLoader';
const gameInfos = import.meta.glob('../data/games/**/info.json', { eager: true });


export const processCommand = async (command, gameState, handlers = {}, sessionHandlers = {}) => {
  const { setLoggedUser, setAwaitingLogin } = sessionHandlers;

  const { 
    setGameData, 
    setCurrentImage, 
    setCurrentRoute,
    setGameLoaded,
    clearHistory,
    addToTerminal,
    resetTerminal
  } = handlers;

  const commandLower = command.toLowerCase().trim();
  const parts = commandLower.split(' ');
  const mainCommand = parts[0];
  const args = parts.slice(1);



  switch (mainCommand) {

    case 'help':
      return `[green]Comandos disponibles (para seres con intelecto limitado):[/green]

[yellow][bold]help[/bold][/yellow] - Muestra esta patética lista de comandos. Enhorabuena, has demostrado ser capaz de pedir ayuda.
[yellow][bold]clear[/bold][/yellow] - Limpia la pantalla. Como cuando niegas tu historial de búsqueda.
[yellow][bold]version[/bold][/yellow] - Muestra la versión del motor. Porque seguro que te importa.
[yellow][bold]about[/bold][/yellow] - Información sobre el [italic]glorioso[/italic] Motor Baboso.
[yellow][bold]run [game][/bold][/yellow] - Corre un juego. Ejemplo: lits -> [cyan]run demo[/cyan]. ¿Serás capaz de escribirlo correctamente?
[yellow][bold]list[/bold][/yellow] - Muestra los juegos disponibles. Spoiler: hay pocos.
[yellow][bold]image[/bold][/yellow] - (Demo) Muestra una imagen de prueba. Asombroso, lo sé.
[yellow][bold]reset-image[/bold][/yellow] - (Demo) Oculta la imagen. Por si era demasiado para tus ojos.
[yellow][bold]quit[/bold][/yellow] - Abandona como siempre lo haces. Vuelve al menú principal.
[yellow][bold]debug[/bold][/yellow] - Muestra el estado actual del juego. Para que entiendas por qué fracasas.`;

    case 'clear':
      if (clearHistory) clearHistory();
      return '[dim]Terminal limpiada. Al menos puedes mantener algo ordenado en tu vida.[/dim]';

    case 'version':
      return '[bold]Motor Baboso v0.1.0[/bold] - [italic]"Más viscoso que funcional"[/italic]';

    case 'about':
      return `[bold][green]Motor Baboso[/green][/bold]: La plataforma terminal viscosa para aventuras textuales.

[italic]Creado por un Narrador Malévolo que disfruta viendo tus decisiones desastrosas.
Para criaturas que se arrastran tanto física como intelectualmente.
Funciona mejor cuando tus expectativas son tan bajas como tu autoestima.[/italic]

[dim]© 2025 Corporación Babosa Inc. Todos los derechos reservados.
Garantía: Ninguna. Como en la vida real.[/dim]`;

    case 'image':
      if (setCurrentImage) setCurrentImage('/images/scenarios/room.png');
      return '[italic]Mostrando imagen de prueba... Impresionante tecnología, ¿verdad? No respondas, era retórico.[/italic]';

    case 'reset-image':
      if (setCurrentImage) setCurrentImage(null);
      return '[italic]Imagen eliminada. Vuelve a la reconfortante oscuridad donde perteneces.[/italic]';

    case 'debug':
      return `[green][bold]Estado actual del juego:[/bold][/green]
      
[blue]Ruta:[/blue] ${gameState.currentRoute || "Ninguna (perdido, como siempre)"}
[blue]Estadísticas:[/blue] ${JSON.stringify(gameState.stats, null, 2).replace(/[{}"]/g, '').replace(/,/g, '\n ')}
[blue]Inventario:[/blue] ${gameState.inventory?.length ? gameState.inventory.join(', ') : "Vacío (qué sorpresa)"}
[blue]Fase del día:[/blue] ${gameState.time?.currentPhase || "Desconocida"}

[dim]¿Satisfecho con esta información que probablemente no entiendes?[/dim]`;

    case 'run':
      if (args.length === 0) {
        return '[red]¿Abrir QUÉ exactamente? Especifica el nombre del juego, iluminado. Ejemplo: [bold]open demo[/bold][/red]';
      }
      
      const gameName = args[0];
      try {
        if (setGameLoaded) setGameLoaded(false);
        
        // Cargar el juego
        const gameData = await loadLocalGame(gameName);
        
        if (!gameData) {
          return `[red]Error: No pude cargar "${gameName}". O no existe, o fue demasiado inteligente para ti.[/red]`;
        }
        
        if (setGameData) setGameData(gameData);
        if (setGameLoaded) setGameLoaded(true);
        
        // Establecer la ruta inicial (generalmente "start")
        if (setCurrentRoute) setCurrentRoute('start');
        
        return `[green]Juego "${gameName}" cargado correctamente. Iniciando aventura... Prepárate para la mediocridad.[/green]`;
      } catch (error) {
        console.error('Error cargando el juego:', error);
        return `[red]Error cargando el juego "${gameName}": ${error.message}[/red]
        
[italic]¿Quizás sea una señal para hacer algo productivo con tu vida en lugar de jugar?[/italic]`;
      }
      
      case 'list':
        {
          const games = Object.entries(gameInfos).map(([path, data]) => {
            const gameFolder = path.split('/')[3]; // obtiene el nombre del folder del juego
            return {
              name: gameFolder,
              description: data.default.description,
              author: data.default.author,
              version: data.default.version
            };
          });
      
          if (games.length === 0) {
            return '[red]No hay juegos disponibles. Ni siquiera una babosa ha sido tan vaga para crear uno.[/red]';
          }
      
          const gameList = games.map(game => (
            `[yellow][bold]${game.name}[/bold][/yellow] - ${game.description} [dim](Versión: ${game.version}, por ${game.author})[/dim]`
          )).join('\n');
      
          return `[green]Juegos disponibles:[/green]\n${gameList}`;
        }
      
    
    case 'quit':
      if (setGameLoaded) setGameLoaded(false);
      if (setCurrentImage) setCurrentImage(null);
      if (setGameData) setGameData(null);
      if (resetTerminal) resetTerminal();
      return '[italic]Abandonando como siempre lo haces. Volviendo al menú principal...[/italic]';

    default:
      return `[red]"${command}"[/red] no es un comando válido, cerebrito. 
      
[yellow]Escribe [bold]help[/bold] para ver los comandos disponibles que tal vez puedas entender.[/yellow]`;
  }
};