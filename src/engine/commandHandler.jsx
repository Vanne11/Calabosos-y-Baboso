// engine/commandHandler.jsx
// Manejador mejorado para mostrar información detallada en modo debug

import { loadLocalGame } from './gameLoader';
import { handleDebugCommand, isDebugActive, logDebug } from './debugSystem';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { delay } from '../utils/delay';



// Variable para controlar si el componente AboutSequence está activado
let aboutSequenceActive = false;
let aboutContainer = null;
let aboutRoot = null;

export const processCommand = async (command, gameState, handlers = {}, sessionHandlers = {}) => {
  const { setLoggedUser, setAwaitingLogin } = sessionHandlers;

  const {
    setGameData,
    setCurrentImage,
    setCurrentRoute,
    setGameLoaded,
    clearHistory,
    addToTerminal,
    resetTerminal,
    speedMultiplier = 1,
    setShowEnterPrompt,
    waitForEnter,
    volume

  } = handlers;

  const commandLower = command.toLowerCase().trim();
  const parts = commandLower.split(' ');
  const mainCommand = parts[0];
  const args = parts.slice(1);

  // Log de depuración del comando
  if (isDebugActive()) {
    logDebug(`Comando ejecutado: ${command}`, 'COMMAND');
  }

  switch (mainCommand) {

    case 'help':
      return `[green]Comandos disponibles (para seres con intelecto limitado):[/green]

[yellow][bold]help[/bold][/yellow] - Muestra esta patética lista de comandos. Enhorabuena, has demostrado ser capaz de pedir ayuda.
[yellow][bold]clear[/bold][/yellow] - Limpia la pantalla. Como cuando niegas tu historial de búsqueda.
[yellow][bold]version[/bold][/yellow] - Muestra la versión del motor. Porque seguro que te importa.
[yellow][bold]about[/bold][/yellow] - Información sobre el [italic]glorioso[/italic] Motor Baboso.
[yellow][bold]run [game][/bold][/yellow] - Corre un juego. Ejemplo: [cyan]run demo[/cyan]. ¿Serás capaz de escribirlo correctamente?
[yellow][bold]list[/bold][/yellow] - Muestra los juegos disponibles. Spoiler: hay pocos.
[yellow][bold]debug[/bold][/yellow] - Activa el modo de depuración. Para ver opciones escribe [cyan]debug[/cyan] sin argumentos.
[yellow][bold]image[/bold][/yellow] - (Demo) Muestra una imagen de prueba. Asombroso, lo sé.
[yellow][bold]reset-image[/bold][/yellow] - (Demo) Oculta la imagen. Por si era demasiado para tus ojos.
[yellow][bold]quit[/bold][/yellow] - Abandona como siempre lo haces. Vuelve al menú principal.`;

    case 'clear':
      if (clearHistory) clearHistory();
      return '[dim]Terminal limpiada. Al menos puedes mantener algo ordenado en tu vida.[/dim]';

    case 'version':
      return '[bold]Motor Baboso v0.1.0[/bold] - [italic]"Más viscoso que funcional"[/italic]';

    case 'about':
      try {
        // Iniciar la música de fondo
        const audio = new Audio('audio/about_theme.mp3');
        audio.loop = true;
        audio.volume = volume / 100;
        audio.play().catch(err => {
          console.warn('No se pudo reproducir el audio automáticamente');
        });

        // Mostrar imagen en la zona de imágenes
        if (setCurrentImage) {
          setCurrentImage('images/about/about1.png');
        }

        // Limpiar la terminal para mostrar el texto gradualmente
        if (clearHistory) clearHistory();

        // Mostrar un título inicial
        if (addToTerminal) {
          addToTerminal({
            type: 'system',
            content: '[green][bold]MOTOR BABOSO[/bold][/green] - La plataforma terminal viscosa para aventuras'
          });
          addToTerminal({
            type: 'system',
            content: 'Cargando información viscosa... [dim](en progreso)[/dim]'
          });
          addToTerminal({
            type: 'system',
            content: '\u00A0' // ← espacio no rompible (Unicode NBSP)
          });
        }

        const readmeLines = [
          "# 🐌 Motor Baboso: Calabosos y Babosos™",
          "",
          "**La terminal viscosa para aventuras textuales que nadie pidió.**",
          "",
          "Bienvenido. Este motor ejecuta juegos grotescos en una terminal sarcástica. Está hecho con React + Vite porque claro, ¿por qué no?",
          "",
          "## ¿Y esto para qué sirve?",
          "",
          "Para cargar juegos. Para burlarse de tus decisiones. Para darte control... o al menos la ilusión.",
          "",
          "## Funciones clave (más o menos)",
          "",
          "- **Terminal interactiva** con comandos, color y desprecio.",
          "- **Rutas condicionales** que probablemente nunca cumplas.",
          "- **Personajes juzgones** que recuerdan tus errores.",
          "- **Widgets** que hacen cosas. A veces.",
          "- **Día y noche**, porque las babosas también duermen.",
          "- **Datos guardados**, por si querés sufrir dos veces.",
          "",
          "> \"Esto no es solo un juego. Es una advertencia.\"",
          "",
          "## Código fuente baboso",
          "",
          "[bold][link=http://github.com/vane11/calabosos-y-babosos]github.com/vane11/calabosos-y-babosos[/link][/bold]",
          "¿Te animás a ver el código? Bueno, te advertimos...",
          "",
          "atte. Nicolás y Vanessa"
        ];


        // Mostrar líneas gradualmente
        let lineIndex = 0;
        const showNextLine = async () => {
          if (lineIndex < readmeLines.length && addToTerminal) {
            const line = readmeLines[lineIndex] || "";

            // Formatear línea según su contenido - asegurarse de que siempre sea string
            let formattedLine = String(line);

            // Títulos
            if (formattedLine.startsWith('# ')) {
              formattedLine = `[green][bold]${formattedLine.substring(2)}[/bold][/green]`;
            } else if (formattedLine.startsWith('## ')) {
              formattedLine = `[cyan][bold]${formattedLine.substring(3)}[/bold][/cyan]`;
            }
            // Negritas
            else if (formattedLine.includes('**')) {
              formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '[bold]$1[/bold]');
            }
            // Citas
            else if (formattedLine.startsWith('>')) {
              formattedLine = `[yellow][italic]${formattedLine}[/italic][/yellow]`;
            }
            // Listas
            else if (formattedLine.startsWith('- ')) {
              formattedLine = formattedLine.replace(/\*\*(.*?)\*\*/g, '[bold]$1[/bold]');
              formattedLine = `[purple]${formattedLine}[/purple]`;
            }
            // Itálicas
            else if (formattedLine.includes('*')) {
              formattedLine = formattedLine.replace(/\*(.*?)\*/g, '[italic]$1[/italic]');
            }

            // Añadir línea al terminal
            if (formattedLine.trim()) {
              addToTerminal({
                type: 'system',
                content: formattedLine
              });
            } else {
              // Para líneas vacías, añadir un espacio
              if (!formattedLine.trim()) {
                addToTerminal({
                  type: 'system',
                  content: '\u00A0'
                });
              }
            }

            // Avanzar a la siguiente línea
            lineIndex++;
            await delay(600, speedMultiplier);
            showNextLine(); // ✅ recursión para continuar
          } else {

            setTimeout(async () => {
              setShowEnterPrompt(true); // Mostrar el mensaje
              await waitForEnter(setShowEnterPrompt);     // Esperar que el usuario presione Enter
              // Cuando se han mostrado todas las líneas, mostrar el modal
              // Crear el modal para about2.png usando solo DOM nativo
              const modalContent = document.createElement('div');
              modalContent.id = 'about-modal';
              modalContent.style.cssText = `
                  position: fixed;
                  top: 50%;
                  left: 50%;
                  transform: translate(-50%, -50%);
                  background-color: #251d35;
                  padding: 2rem;
                  border-radius: 12px;
                  box-shadow: 0 0 30px rgba(189, 147, 249, 0.8);
                  max-width: 90vw;
                  max-height: 90vh;
                  overflow-y: auto;
                  text-align: center;
                  border: 2px solid #c495ff;
                  z-index: 1000;
                `;

              const modalImage = document.createElement('img');
              modalImage.src = 'images/about/about2.png';
              modalImage.alt = 'Calabosos y Babosos';
              modalImage.style.cssText = `
                  max-width: 100%;
                  max-height: 40vh;
                  display: block;
                  margin: 0 auto 1rem auto;
                  border-radius: 6px;
                `;

              const modalText1 = document.createElement('p');
              modalText1.textContent = 'Este programa ha sido desarrollado por criaturas viscosas para criaturas viscosas.';
              modalText1.style.cssText = 'color: #ffffff; margin: 1rem 0;';

              const modalText2 = document.createElement('p');
              modalText2.textContent = 'Úsalo bajo tu propio riesgo. No nos hacemos responsables de la pérdida de dignidad.';
              modalText2.style.cssText = 'color: #ffffff; margin: 1rem 0;';

              const loadingIndicator = document.createElement('div');
              loadingIndicator.textContent = 'Procesando sacrificio de dignidad';
              loadingIndicator.style.cssText = `
                  color: #c495ff;
                  font-style: italic;
                  margin-top: 1rem;
                `;

              // Añadir animación al loadingIndicator
              const loadingAnimation = document.createElement('style');
              loadingAnimation.textContent = `
                  @keyframes loading {
                    0% { content: "."; }
                    33% { content: ".."; }
                    66% { content: "..."; }
                  }
                  #about-loading::after {
                    content: "...";
                    animation: loading 1.5s infinite;
                  }
                `;
              loadingIndicator.id = 'about-loading';
              document.head.appendChild(loadingAnimation);

              // Construir estructura del modal
              modalContent.appendChild(modalImage);
              modalContent.appendChild(modalText1);
              modalContent.appendChild(modalText2);
              modalContent.appendChild(loadingIndicator);
              document.body.appendChild(modalContent);

              // Función para cerrar el modal y limpiar
              const closeModal = () => {
                // Verificar si el modal aún existe
                const modal = document.getElementById('about-modal');
                if (modal) {
                  // Cerrar modal y detener audio
                  modal.remove();
                  audio.pause();
                  audio.currentTime = 0;

                  // Opcional: cambiar la imagen de vuelta
                  if (setCurrentImage) {
                    setCurrentImage(null);
                  }

                  // No reiniciar la terminal
                  addToTerminal({
                    type: 'system',
                    content: '[green]Fin del about. Ya puedes volver a fingir que entiendes este juego.[/green]'
                  });
                }
              };

              // Añadir botón después de un tiempo
              setTimeout(() => {
                // Verificar si el modal aún existe
                const modal = document.getElementById('about-modal');
                if (modal) {
                  // Remover el indicador de carga
                  const loading = document.getElementById('about-loading');
                  if (loading) {
                    loading.remove();
                  }

                  const closeButton = document.createElement('button');
                  closeButton.textContent = 'Entendido, soy una babosa';
                  closeButton.style.cssText = `
                      background-color: #44475a;
                      color: #ffffff;
                      border: none;
                      border-radius: 5px;
                      padding: 8px 16px;
                      margin-top: 1rem;
                      cursor: pointer;
                      font-family: inherit;
                      font-size: 1rem;
                    `;

                  closeButton.addEventListener('mouseover', () => {
                    closeButton.style.backgroundColor = '#6272a4';
                  });

                  closeButton.addEventListener('mouseout', () => {
                    closeButton.style.backgroundColor = '#44475a';
                  });

                  closeButton.addEventListener('click', closeModal);

                  // Añadir el botón al modal
                  modal.appendChild(closeButton);
                }

                // Cerrar automáticamente después de 8 segundos

                setTimeout(closeModal, 8000);
              }, 4000); // 4 segundos antes de mostrar el botón

            }, 10); // 2 segundos después de mostrar todas las líneas
          }
        };

        // Comenzar a mostrar líneas
        showNextLine();

        return '[dim]Iniciando secuencia de información... Prepárate para la viscosidad.[/dim]';
      } catch (error) {
        console.error('Error mostrando about:', error);
        if (isDebugActive()) {
          logDebug(`Error en secuencia about: ${error.message}`, 'ERROR');
        }
        return `[red]Error mostrando la información. Tal vez la baba se secó: ${error.message}[/red]`;
      }

    case 'image':
      if (setCurrentImage) setCurrentImage('images/scenarios/room.png');
      return '[italic]Mostrando imagen de prueba... Impresionante tecnología, ¿verdad? No respondas, era retórico.[/italic]';

    case 'reset-image':
      if (setCurrentImage) setCurrentImage(null);
      return '[italic]Imagen eliminada. Vuelve a la reconfortante oscuridad donde perteneces.[/italic]';

    // En commandHandler.jsx, dentro del switch para los comandos
    // Reemplazar el caso 'debug' con esta versión corregida

    case 'debug':
      // Si solo escriben 'debug' sin argumentos
      if (args.length === 0) {
        // Mostrar comandos disponibles
        return `
[yellow]Para opciones avanzadas de depuración, prueba estos subcomandos:[/yellow]
[green]debug on[/green] - Activa el modo depuración completo
[green]debug off[/green] - Desactiva el modo depuración
[green]debug help[/green] - Muestra todas las opciones de depuración`;
      } else if (args[0] === 'help') {
        // Mostrar ayuda específica de debug
        return `
[cyan]===== COMANDOS DE DEPURACIÓN PARA BABOSAS =====[/cyan]

[green]debug on[/green] - Activa el modo depuración (prepárate para la verdad)
[green]debug off[/green] - Desactiva el modo depuración (vuelve a la ignorancia feliz)
[green]debug status[/green] - Muestra si el modo depuración está activo (por si olvidaste algo tan simple)
[green]debug history[/green] - Muestra el historial de eventos de depuración (una triste crónica)
[green]debug clear[/green] - Limpia el historial de depuración (borra la evidencia)
[green]debug inspect[/green] - Muestra información detallada del estado actual (más de lo que puedes entender)
[green]debug stats[/green] - Muestra las estadísticas del jugador (spoiler: son patéticas)
[green]debug routes[/green] - Muestra las rutas visitadas (tu historia de malas decisiones)
[green]debug game[/green] - Muestra información del juego actual (si es que estás jugando uno)
[green]debug dump[/green] - Exporta un informe completo como archivo JSON (para presumir a amigos imaginarios)

[italic]Usa estos comandos si realmente quieres ver lo desastroso que es todo por dentro.[/italic]`;
      } else {
        // Usar el sistema de depuración para subcomandos
        const debugOutput = handleDebugCommand(args, gameState, handlers);

        // IMPORTANTE: Verificar que el resultado no esté vacío antes de intentar mostrarlo
        if (debugOutput && debugOutput.trim() !== '' && handlers.addToTerminal) {
          handlers.addToTerminal({
            type: 'system',
            content: debugOutput
          });

          // Registrar que el comando se ejecutó correctamente si debug está activo
          if (isDebugActive()) {
            logDebug(`Comando debug '${args[0]}' ejecutado correctamente`, 'COMMAND');
          }
        }
        return '';
      }

    case 'run':
      if (args.length === 0) {
        return '[red]¿Abrir QUÉ exactamente? Especifica el nombre del juego, iluminado. Ejemplo: [bold]run demo[/bold][/red]';
      }

      const gameName = args[0];
      try {
        if (setGameLoaded) setGameLoaded(false);

        // Registrar el intento de carga en modo debug
        if (isDebugActive()) {
          logDebug(`Iniciando carga del juego: ${gameName}`, 'COMMAND');
        }

        // Cargar el juego
        const gameData = await loadLocalGame(gameName);

        if (!gameData) {
          if (isDebugActive()) {
            logDebug(`Error: No se pudo cargar el juego ${gameName}`, 'ERROR');
          }
          return `[red]Error: No pude cargar "${gameName}". O no existe, o fue demasiado inteligente para ti.[/red]`;
        }

        if (setGameData) setGameData(gameData);
        if (setGameLoaded) setGameLoaded(true);

        // Información detallada en modo debug
        if (isDebugActive()) {
          logDebug(`Juego cargado: ${gameData.name || gameName}`, 'SUCCESS');

          // Mostrar estructura completa del juego
          let outputText = `\n[green][bold]JUEGO CARGADO: ${gameData.name || gameName}[/bold][/green]\n\n`;
          outputText += `[cyan]Autor:[/cyan] ${gameData.author || 'Desconocido'}\n`;
          outputText += `[cyan]Versión:[/cyan] ${gameData.version || 'Desconocida'}\n`;
          outputText += `[cyan]Descripción:[/cyan] ${gameData.description || 'Sin descripción'}\n\n`;

          outputText += `[cyan]Rutas:[/cyan] ${gameData.routes?.length || 0}\n`;
          outputText += `[cyan]Escenarios:[/cyan] ${gameData.scenarios?.length || 0}\n`;
          outputText += `[cyan]Diálogos:[/cyan] ${gameData.dialogs?.length || 0}\n`;
          outputText += `[cyan]Widgets:[/cyan] ${gameData.widgets?.length || 0}\n\n`;

          // Listar rutas disponibles
          if (gameData.routes && gameData.routes.length > 0) {
            outputText += `[cyan]Rutas disponibles:[/cyan]\n`;
            gameData.routes.forEach((route, index) => {
              outputText += `- ${route.id} (${route.actions?.length || 0} acciones)\n`;
            });
            outputText += `\n`;
          }

          // Información de la ruta inicial
          const startRoute = gameData.routes?.find(route => route.id === 'start');
          if (startRoute) {
            outputText += `[cyan]Ruta inicial:[/cyan] start (${startRoute.actions?.length || 0} acciones)\n`;
            if (startRoute.actions && startRoute.actions.length > 0) {
              outputText += `[cyan]Acciones iniciales:[/cyan] ${startRoute.actions.join(', ')}\n\n`;
            }
          } else {
            outputText += `[red]ADVERTENCIA: No se encontró la ruta inicial "start"[/red]\n\n`;
          }

          // Añadir esta información detallada a la consola si estamos en modo debug
          if (addToTerminal) {
            addToTerminal({
              type: 'system',
              content: outputText
            });
          }
        }

        // Establecer la ruta inicial (generalmente "start")
        if (setCurrentRoute) {
          setCurrentRoute('start');
          if (isDebugActive()) {
            logDebug('Navegando a ruta inicial: start', 'ROUTE');
          }
        }

        return `[green]Juego "${gameName}" cargado correctamente. Iniciando aventura... Prepárate para la mediocridad.[/green]`;
      } catch (error) {
        console.error('Error cargando el juego:', error);
        if (isDebugActive()) {
          logDebug(`Error fatal: ${error.message}`, 'ERROR');
          // Mostrar más detalles del error en modo debug
          return `[red]Error cargando el juego "${gameName}": ${error.message}[/red]
          
[yellow]Detalles del error en modo depuración:[/yellow]
[dim]${error.stack || 'No hay stack disponible'}[/dim]

[italic]¿Quizás sea una señal para hacer algo productivo con tu vida en lugar de jugar?[/italic]`;
        }

        return `[red]Error cargando el juego "${gameName}": ${error.message}[/red]
        
[italic]¿Quizás sea una señal para hacer algo productivo con tu vida en lugar de jugar?[/italic]`;
      }

    case 'list': {
      let juegos = [];

      if (import.meta.env.DEV) {
        // 🔧 Desarrollo: lista falsa
        const posibles = ['demo', 'Calabosos y Babosos'];

        juegos = await Promise.all(posibles.map(async name => {
          try {
            const res = await fetch(`games/${name}/info.json`);
            const data = await res.json();
            return {
              name,
              description: data.description || 'Sin descripción',
              author: data.author || 'Anónimo',
              version: data.version || '0.1'
            };
          } catch {
            return null;
          }
        }));
      } else {
        // 🚀 Producción: usar el endpoint PHP
        try {
          const res = await fetch('api/games.php');
          juegos = await res.json();
        } catch (err) {
          return `[red]Error cargando juegos: ${err.message}[/red]`;
        }
      }

      const validos = juegos.filter(Boolean);

      if (validos.length === 0) {
        return '[red]No se encontraron juegos jugables.[/red]';
      }

      const lista = validos.map(j => (
        `[yellow][bold]${j.name}[/bold][/yellow] - ${j.description} [dim](v${j.version} por ${j.author})[/dim]`
      ));

      return `[green]Juegos disponibles:[/green]\n${lista.join('\n')}`;
    }



    case 'quit':
      // Si está activa la secuencia about, detenerla también
      if (aboutSequenceActive) {
        if (aboutRoot) {
          aboutRoot.unmount();
          aboutRoot = null;
        }
        if (aboutContainer) {
          document.body.removeChild(aboutContainer);
          aboutContainer = null;
        }
        aboutSequenceActive = false;
      }

      if (isDebugActive()) {
        logDebug('Abandonando el juego y volviendo al menú principal', 'COMMAND');
      }

      if (setGameLoaded) setGameLoaded(false);
      if (setCurrentImage) setCurrentImage(null);
      if (setGameData) setGameData(null);
      if (resetTerminal) resetTerminal();
      return '[italic]Abandonando como siempre lo haces. Volviendo al menú principal...[/italic]';

    default:
      if (isDebugActive()) {
        logDebug(`Comando desconocido: ${command}`, 'WARNING');
      }

      return `[red]"${command}"[/red] no es un comando válido, cerebrito. 
      
[yellow]Escribe [bold]help[/bold] para ver los comandos disponibles que tal vez puedas entender.[/yellow]`;
  }
};