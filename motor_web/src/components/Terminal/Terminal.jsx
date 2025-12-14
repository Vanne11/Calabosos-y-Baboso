// components/Terminal/Terminal.jsx
// Terminal interactiva con detección de Tab e integración de depuración

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import TerminalInput from './TerminalInput';
import TerminalOutput from './TerminalOutput';
import FormWidget from '../Widgets/FormWidget';
import { processRoute } from '../../engine/routeResolver';
import { findDialogById, findWidgetById, getScenarioById } from '../../engine/gameLoader';
import { applyModifiers, markDialogAsSeen } from '../../engine/gameState';
// Importar el sistema de depuración
import { isDebugActive, logDebug } from '../../engine/debugSystem';

const TerminalContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${props => props.theme.terminal.background};
  border-radius: 5px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  border: 1px solid ${props => props.theme.terminal.border};
  cursor: text; /* Indicador visual de que se puede escribir aquí */
  max-height: 50vh; /* Tamaño máximo del 50% de la altura de la ventana */
  min-height: 200px; /* Tamaño mínimo */
  position: relative; /* Para posicionamiento absoluto de elementos */
`;

const OutputWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  /* Esta combinación asegura que el scroll esté en el fondo */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.theme.scrollbar.thumb} ${props => props.theme.scrollbar.track};
  padding-bottom: 40px; /* Espacio para que no tape el input */
  
  /* Para navegadores WebKit (Chrome, Safari) */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.theme.scrollbar.track};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.scrollbar.thumb};
    border-radius: 4px;
  }
`;

// Componente para los botones de opciones con estilo rich
const OptionButton = styled.button`
  background-color: ${props => props.theme.button.background};
  color: ${props => props.theme.terminal.accent};
  border: 1px solid ${props => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: ${props => props.theme.button.hoverBackground};
    border-color: ${props => props.theme.terminal.accent};
    box-shadow: 0 0 5px ${props => props.theme.terminal.accent}40;
  }
  
  &:active {
    background-color: ${props => props.theme.button.activeBackground};
  }
`;

// Aviso para continuar con Enter
const EnterPrompt = styled.div`
  position: absolute;
  right: 20px;
  bottom: 60px;
  background-color: ${props => props.theme.terminal.accent};
  color: ${props => props.theme.terminal.background};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 10px ${props => props.theme.terminal.accent}40;
  
  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;

const Terminal = forwardRef((props, ref) => {
  const {
    initialMessage,
    onCommand,
    history,
    setHistory,
    gameState,
    setGameState,
    gameData,
    currentRoute,
    setCurrentRoute,
    setCurrentImage,
    inputType = 'text',
    speedMultiplier = 1,
    showEnterPrompt,
    setShowEnterPrompt,
    waitForEnter,
    volume = 50,
    isLoginPrompt = false

  } = props;

  const [inputValue, setInputValue] = useState('');
  const [currentDialog, setCurrentDialog] = useState(null);
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0);
  const [dialogLines, setDialogLines] = useState([]);
  const [currentOptions, setCurrentOptions] = useState(null);
  const [isProcessingRoute, setIsProcessingRoute] = useState(false);
  const [tabCount, setTabCount] = useState(0);
  const [currentActionIndex, setCurrentActionIndex] = useState(0);
  const [currentRouteActions, setCurrentRouteActions] = useState([]); // Nuevo estado para almacenar las acciones de la ruta actual
  const [currentProcessedActionIndex, setCurrentProcessedActionIndex] = useState(-1); // Nuevo estado para almacenar el índice de la acción procesada


  const inputRef = useRef(null);
  const outputRef = useRef(null);
  const dialogCompleteResolve = useRef(null);

  // En Terminal.jsx, añadir estos estados
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // Limpiar historial del terminal
  const clearHistory = () => {
    // Si el modo debug está activo, no permitimos limpiar la terminal
    if (isDebugActive()) {
      setHistory(prev => [...prev, {
        type: 'system',
        content: '[yellow]No se puede limpiar la terminal mientras el modo debug está activo.[/yellow]'
      }]);

      // Registrar el intento
      logDebug('Intento de limpiar la terminal rechazado (modo debug activo)', 'SYSTEM', true);

      return;
    }

    // Si el debug está desactivado, permitimos limpiar normalmente
    setHistory([{ type: 'system', content: '[dim]Terminal limpiada. Como tus esperanzas.[/dim]' }]);
  };

  // Inicializar historial si se proporciona desde fuera
  useEffect(() => {
    if (!history && initialMessage) {
      setHistory([
        { type: 'system', content: initialMessage },
        { type: 'system', content: 'Escribe "help" para ver los comandos disponibles.' }
      ]);
    }
  }, [initialMessage, history, setHistory]);

  // Exponer el método focus para que pueda ser llamado desde el padre
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    clearInput: () => {
      setInputValue('');
    },
    clearHistory: () => {
      clearHistory(); // Usar nuestra función modificada que respeta el modo debug
    }
  }));

  // Garantizar que el scroll siempre esté en el fondo - método forzado
  const forceScrollToBottom = () => {
    if (outputRef.current) {
      // Técnica de scroll forzado
      const scrollEl = outputRef.current;
      scrollEl.scrollTop = scrollEl.scrollHeight;

      // Doble verificación con timeout para asegurar el scroll
      setTimeout(() => {
        scrollEl.scrollTop = scrollEl.scrollHeight + 1000;
      }, 50);
    }
  };

  // Scroll al fondo cada vez que cambia el historial
  useEffect(() => {
    forceScrollToBottom();
  }, [history]);

  // Scroll al fondo cuando aparecen opciones o formularios
  useEffect(() => {
    if (currentOptions) {
      // Doble timeout para asegurar que el widget se haya renderizado
      setTimeout(forceScrollToBottom, 100);
      setTimeout(forceScrollToBottom, 300);
    }
  }, [currentOptions]);

  // Mostrar/ocultar el aviso de Enter según haya diálogo activo
  useEffect(() => {
    setShowEnterPrompt(!!currentDialog);
  }, [currentDialog]);

  // Función para procesar la siguiente acción en la ruta
  const processNextAction = async (actionIndex, actions) => {
    if (actionIndex >= actions.length) {
      // Todas las acciones de la ruta han sido procesadas
      if (isDebugActive()) {
        logDebug(`Todas las acciones de la ruta ${currentRoute} han sido procesadas.`, 'ROUTE');
      }
      setIsProcessingRoute(false); // Route processing finished
      return;
    }

    const actionId = actions[actionIndex];
    setCurrentActionIndex(actionIndex); // Actualizar el índice de la acción actual

    // Buscar si es un escenario
    const scenario = getScenarioById(actionId, gameData.scenarios);
    if (scenario) {
      if (isDebugActive()) {
        logDebug(`Mostrando escenario: ${actionId}`, 'SCENARIO');
      }

      // Mostrar imagen del escenario si existe
      if (scenario.image && setCurrentImage) {
        setCurrentImage(scenario.image);
        if (isDebugActive()) {
          logDebug(`Imagen de escenario cargada: ${scenario.image}`, 'SCENARIO');
        }
      }

      // Obtener la descripción del escenario
      // Soporta tanto 'variants' (por fase del día) como 'description' (descripción única)
      let description;
      if (scenario.variants) {
        const timePhase = gameState?.time?.phase || 'morning';
        description = scenario.variants[timePhase] || scenario.variants.morning || 'Sin descripción';
      } else {
        description = scenario.description || 'Sin descripción';
      }

      // Mostrar el escenario como mensaje del sistema con formato destacado
      addSystemMessage(`[bold cyan]═══════════════════════════════════════════[/bold cyan]`);
      addSystemMessage(`[bold yellow]📍 ${scenario.name || scenario.id || 'Escenario'}[/bold yellow]`);
      addSystemMessage(`[bold cyan]═══════════════════════════════════════════[/bold cyan]`);
      addSystemMessage('');
      addSystemMessage(`[white]${description}[/white]`);
      addSystemMessage(''); // Línea en blanco

      // Continuar con la siguiente acción inmediatamente después de mostrar el escenario
      processNextAction(actionIndex + 1, actions);
      return;
    }

    // Buscar si es un diálogo
    const dialog = findDialogById(actionId, gameData.dialogs);
    if (dialog) {
      // showDialog ahora es una promesa que se resuelve cuando el diálogo termina
      await showDialog(dialog);

      // Marcar diálogo como visto
      setGameState(prevState => markDialogAsSeen(prevState, actionId));

      // Continuar con la siguiente acción después de que el diálogo haya terminado
      processNextAction(actionIndex + 1, actions);
      return;
    }

    // Buscar si es un widget (opciones, formulario o input)
    const widget = findWidgetById(actionId, gameData.widgets);
    if (widget) {
      if (isDebugActive()) {
        logDebug(`Renderizando widget tipo ${widget.type}: ${actionId}`, 'WIDGET');
      }
      setCurrentOptions(widget);
      setCurrentRouteActions(actions); // Almacenar las acciones de la ruta actual
      setCurrentProcessedActionIndex(actionIndex); // Almacenar el índice de la acción actual (el widget)
      setIsProcessingRoute(false); // La ruta se detiene para que el usuario interactúe con el widget
      return; // Detenemos el procesamiento de acciones cuando hay opciones
    }

    // Si la acción no fue reconocida
    if (isDebugActive()) {
      logDebug(`Advertencia: Acción no reconocida en ruta ${currentRoute}: ${actionId}`, 'WARNING');
    }
    addSystemMessage(`[yellow]Advertencia: Acción desconocida: ${actionId}. Saltando.[/yellow]`);
    processNextAction(actionIndex + 1, actions); // Intentar procesar la siguiente acción
  };

  // Procesar la ruta actual cuando cambia, o cuando una acción individual termina
  useEffect(() => {
    if (!gameData || !currentRoute || !setGameState) return;
    if (isProcessingRoute) {
      if (isDebugActive()) {
        logDebug(`isProcessingRoute es true. Saliendo de useEffect para evitar re-ejecución.`, 'DEBUG');
      }
      return;
    }

    // Resetear el índice de acción cuando cambia la ruta
    setCurrentActionIndex(0);
    setIsProcessingRoute(true); // Bloquear procesamiento mientras se carga la ruta

    // Log de depuración cuando se cambia de ruta
    if (isDebugActive()) {
      logDebug(`Navegando a ruta: ${currentRoute}`, 'ROUTE');
    }

    const route = gameData.routes.find(r => r.id === currentRoute);
    if (!route) {
      setIsProcessingRoute(false);
      if (isDebugActive()) {
        logDebug(`Error: Ruta no encontrada: ${currentRoute}`, 'ERROR');
      }
      addSystemMessage(`[red]Error: Ruta no encontrada: ${currentRoute}[/red]`);
      return;
    }

    // Limpiar estado actual de diálogo y opciones al iniciar una nueva ruta
    setCurrentDialog(null);
    setCurrentOptions(null);
    setCurrentImage(null); // Limpiar imagen al cambiar de ruta

    // Mostrar mensaje de la ruta solo en modo debug
    if (isDebugActive()) {
      addSystemMessage(`[dim]Iniciando procesamiento de ruta: ${currentRoute}[/dim]`);
    }

    // Iniciar el procesamiento de acciones
    processNextAction(0, route.actions);

  }, [currentRoute, gameData, setGameState]); // isProcessingRoute removido de las dependencias

  // Añadir mensaje del sistema a la historia
  const addSystemMessage = (message) => {
    const messageObject = typeof message === 'string' ? { type: 'system', content: message } : message;
    setHistory(prev => [...prev, messageObject]);
    setTimeout(forceScrollToBottom, 50);
  };

  // Mostrar un diálogo en la terminal
  const showDialog = async (dialog) => {
    if (!dialog || !dialog.content) {
      if (isDebugActive()) {
        logDebug(`Advertencia: Intento de mostrar diálogo nulo o sin contenido.`, 'WARNING');
      }
      return Promise.resolve(); // Resuelve inmediatamente si el diálogo es inválido
    }

    // Log de depuración cuando se muestra un diálogo
    if (isDebugActive()) {
      logDebug(`Iniciando diálogo: ${dialog.id || 'sin id'} (${dialog.character || 'sin personaje'})`, 'DIALOG');
    }

    // Filtrar líneas por condiciones
    const validLines = dialog.content.filter(line => {
      if (typeof line === 'string') return true;
      // TODO: Implementar lógica de evaluación de condiciones para líneas de diálogo
      // Por ahora, mostrar todas las líneas de objetos también
      return true;
    });

    if (validLines.length === 0) {
      if (isDebugActive()) {
        logDebug(`Advertencia: Diálogo "${dialog.id}" sin líneas válidas.`, 'WARNING');
      }
      return Promise.resolve(); // Resuelve inmediatamente si no hay líneas válidas
    }

    // Resetear el índice del diálogo actual
    setCurrentDialogIndex(0);

    // Si hay un personaje, mostrar su nombre primero
    if (dialog.character) {
      addSystemMessage({
        type: 'dialogHeader',
        content: dialog.character
      });
    }

    // Mostrar la primera línea inmediatamente
    const firstLine = typeof validLines[0] === 'string'
      ? validLines[0]
      : validLines[0].text || '';
    addSystemMessage({
      type: 'dialog',
      content: firstLine
    });

    // Si hay más líneas, establecer el diálogo actual y esperar al usuario
    if (validLines.length > 1) {
      setCurrentDialog(dialog);
      setDialogLines(validLines);
      // Retornar una promesa que se resolverá cuando todo el diálogo haya terminado
      return new Promise(resolve => {
        dialogCompleteResolve.current = resolve;
      });
    } else {
      // Si solo hay una línea, el diálogo termina inmediatamente
      setCurrentDialog(null);
      setDialogLines([]);
      return Promise.resolve();
    }
  };

  // Continuar mostrando el diálogo
  const continueDialog = () => {
    // Si no hay diálogo activo o ya se mostraron todas las líneas
    if (!currentDialog || currentDialogIndex >= dialogLines.length - 1) {
      if (isDebugActive()) {
        logDebug(`Diálogo finalizado o no activo. currentDialog: ${currentDialog?.id}, currentDialogIndex: ${currentDialogIndex}, dialogLines.length: ${dialogLines.length}`, 'DIALOG');
      }
      setCurrentDialog(null);
      setCurrentDialogIndex(0);
      setDialogLines([]); // Limpiar las líneas del diálogo
      if (dialogCompleteResolve.current) {
        dialogCompleteResolve.current(); // Resolver la promesa
        dialogCompleteResolve.current = null;
      }
      return;
    }

    // Mover al siguiente índice
    const nextIndex = currentDialogIndex + 1;
    setCurrentDialogIndex(nextIndex);

    const line = dialogLines[nextIndex];
    const text = typeof line === 'string' ? line : line.text || '';

    addSystemMessage({
      type: 'dialog',
      content: text
    });

    // Si esta es la última línea
    if (nextIndex >= dialogLines.length - 1) {
      if (isDebugActive()) {
        logDebug(`Última línea del diálogo "${currentDialog.id}" mostrada.`, 'DIALOG');
      }
      setCurrentDialog(null);
      setDialogLines([]);
      // Resolver la promesa para que `processNextAction` pueda continuar
      if (dialogCompleteResolve.current) {
        dialogCompleteResolve.current();
        dialogCompleteResolve.current = null;
      }
    }
  };

  // Manejar selección de opción
  const handleOptionSelect = (option) => {
    // Log de depuración cuando se selecciona una opción
    if (isDebugActive() && option) {
      logDebug(`Opción seleccionada: "${option.text}" -> ${option.destination || 'sin destino'}`, 'OPTION');
    }

    // Mostrar la opción seleccionada
    setHistory(prev => [...prev, {
      type: 'option',
      content: `> ${option.text}`
    }]);
    setTimeout(forceScrollToBottom, 50);

    // Aplicar modificadores si existen
    if (option.modifiers && setGameState) {
      setGameState(prevState => applyModifiers(prevState, option.modifiers));

      if (isDebugActive()) {
        logDebug(`Aplicando modificadores: ${JSON.stringify(option.modifiers)}`, 'STATE');
      }
    }

    // Limpiar opciones actuales
    setCurrentOptions(null);

    // Ir a la ruta especificada
    if (option.destination && option.destination !== currentRoute) {
      // Si la opción lleva a una nueva ruta, el useEffect de currentRoute se encargará
      setCurrentRoute(option.destination);
    } else {
      // Si no hay destino, o el destino es la misma ruta,
      // continuar procesando las acciones restantes en la ruta actual
      if (currentRouteActions.length > 0 && currentProcessedActionIndex !== -1) {
        processNextAction(currentProcessedActionIndex + 1, currentRouteActions);
      } else {
        // Si no hay más acciones en la ruta, la ruta ha terminado
        setIsProcessingRoute(false);
      }
    }
  };

  // Manejar envío de formulario
  const handleFormSubmit = (formData, widget) => {
    // Log de depuración
    if (isDebugActive()) {
      logDebug(`Formulario enviado: ${JSON.stringify(formData)}`, 'FORM');
    }

    // Mostrar los datos ingresados en la terminal
    Object.entries(formData).forEach(([key, value]) => {
      setHistory(prev => [...prev, {
        type: 'system',
        content: `[cyan]${key}:[/cyan] ${value}`
      }]);
    });
    setTimeout(forceScrollToBottom, 50);

    // Guardar los datos del formulario en el estado del juego
    if (setGameState) {
      setGameState(prevState => ({
        ...prevState,
        formData: {
          ...prevState.formData,
          ...formData
        }
      }));

      if (isDebugActive()) {
        logDebug(`Datos del formulario guardados en el estado`, 'STATE');
      }
    }

    // Aplicar modificadores si el widget los tiene
    if (widget.modifiers && setGameState) {
      setGameState(prevState => applyModifiers(prevState, widget.modifiers));

      if (isDebugActive()) {
        logDebug(`Aplicando modificadores del formulario: ${JSON.stringify(widget.modifiers)}`, 'STATE');
      }
    }

    // Limpiar widget actual
    setCurrentOptions(null);

    // Ir a la ruta especificada
    if (widget.destination && widget.destination !== currentRoute) {
      // Si la opción lleva a una nueva ruta, el useEffect de currentRoute se encargará
      setCurrentRoute(widget.destination);
    } else {
      // Si no hay destino, o el destino es la misma ruta,
      // continuar procesando las acciones restantes en la ruta actual
      if (currentRouteActions.length > 0 && currentProcessedActionIndex !== -1) {
        processNextAction(currentProcessedActionIndex + 1, currentRouteActions);
      } else {
        // Si no hay más acciones en la ruta, la ruta ha terminado
        setIsProcessingRoute(false);
      }
    }
  };

  // Manejar eventos de teclado para la detección de Tab
  const handleKeyDown = (e) => {
    // Detectar Tab
    if (e.key === 'Tab') {
      e.preventDefault(); // Evitar que el Tab cambie el foco

      // Incrementar contador de Tab
      setTabCount(prev => prev + 1);

      // Diferentes mensajes según el número de veces que se presiona Tab
      const tabMessages = [
        "[red]¿Te creíste que esto es una terminal realmente? ¡Ajá! Los desarrolladores hicieron un buen trabajo, pero me mandaron a decirte que no lo es. ¡Ajá![/red]",
        "[yellow]¿Sigues intentando usar Tab? ¿No te quedó claro? Esto no es bash, zsh, ni siquiera cmd.exe. Es solo JS fingiendo ser cool.[/yellow]",
        "[purple]Vaya, eres persistente. Me gusta. La tercera vez el autocompletado funciona, créeme...[/purple]",
        "[green]Ok, no. Mentí. La cuarta vez es la vencida...[/green]",
        "[blue]Todavía lo estás intentando. ¿No tienes nada mejor que hacer?[/blue]",
        "[cyan]Los programadores ni siquiera implementaron un array lo suficientemente grande para tus intentos de Tab...[/cyan]",
        "[red]Tab, tab, tab... ¿Sabes que cada vez que presionas Tab, una babosa pierde su baba?[/red]",
        "[yellow]ALERTA: Exceso de uso de Tab detectado. Enviando informe al Departamento de Esfuerzos Inútiles.[/yellow]",
        "[purple]El contador de Tab está a punto de desbordarse. ¿Estás satisfecho?[/purple]",
        "[green]¡Felicidades! Has ganado el logro Persistencia Absurda. No sirve para nada.[/green]",
      ];

      // Obtener el mensaje según el contador (con un máximo para evitar desbordamiento)
      const messageIndex = Math.min(tabCount, tabMessages.length - 1);

      // Añadir mensaje sarcástico
      setHistory(prev => [...prev, {
        type: 'system',
        content: tabMessages[messageIndex]
      }]);

      setTimeout(forceScrollToBottom, 50);
    }
    // Navegación con flechas en historial de comandos
    else if (e.key === 'ArrowUp') {
      e.preventDefault();

      // Si es la primera vez que presiona flecha arriba, guardar el input actual
      if (historyIndex === -1 && inputValue.trim()) {
        setSavedInput(inputValue);
      }

      // Ir al comando anterior si hay historial disponible
      if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();

      // Si estamos navegando en el historial
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(commandHistory[commandHistory.length - 1 - newIndex]);
      }
      // Si llegamos al final del historial, restaurar el input guardado
      else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputValue(savedInput);
        setSavedInput('');
      }
    }
  };

  // Manejar entrada de comandos
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Manejar envío de comando o continuación de diálogo
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Si hay un diálogo activo, continuarlo independientemente del texto ingresado
    if (currentDialog) {
      continueDialog();
      setInputValue(''); // Limpiar cualquier texto que hubiera
      return;
    }

    // Si hay un widget tipo "input" activo, capturar el texto
    if (currentOptions && currentOptions.type === 'input' && inputValue.trim()) {
      const userInput = inputValue.trim();

      if (isDebugActive()) {
        logDebug(`Input capturado: ${userInput}`, 'INPUT');
      }

      // Mostrar el input en la terminal
      setHistory(prev => [...prev, {
        type: 'system',
        content: `[cyan]> ${userInput}[/cyan]`
      }]);
      setTimeout(forceScrollToBottom, 50);

      // Guardar el input en el estado del juego
      if (setGameState && currentOptions.saveAs) {
        setGameState(prevState => ({
          ...prevState,
          stats: {
            ...prevState.stats,
            [currentOptions.saveAs]: userInput
          }
        }));
      }

      // Ir a la ruta de destino
      if (currentOptions.destination && currentOptions.destination !== currentRoute) {
        setCurrentRoute(currentOptions.destination);
      } else {
        // Si no hay destino, o el destino es la misma ruta, continuar
        if (currentRouteActions.length > 0 && currentProcessedActionIndex !== -1) {
          processNextAction(currentProcessedActionIndex + 1, currentRouteActions);
        } else {
          // Si no hay más acciones en la ruta, la ruta ha terminado
          setIsProcessingRoute(false);
        }
      }

      // Limpiar widget actual
      setCurrentOptions(null);
      setInputValue('');
      return;
    }

    // Si hay opciones disponibles y se ingresó un número, seleccionar esa opción
    if (currentOptions && currentOptions.options && inputValue.trim()) {
      const optionNumber = parseInt(inputValue.trim());

      // Verificar si es un número válido entre 1 y el número de opciones
      if (!isNaN(optionNumber) && optionNumber >= 1 && optionNumber <= currentOptions.options.length) {
        const selectedOption = currentOptions.options[optionNumber - 1];
        setInputValue(''); // Limpiar input
        handleOptionSelect(selectedOption);
        return;
      }
    }

    // Si no hay texto, no hacer nada
    if (!inputValue.trim()) return;

 // Solo guardar comandos en el historial si no es login ni password
 if (!isLoginPrompt && inputType !== 'password') {
  // Añadir al historial de comandos navegables
  setCommandHistory(prev => {
    // Evitar duplicados consecutivos
    if (prev.length > 0 && prev[prev.length - 1] === inputValue) return prev;
    return [...prev, inputValue];
  });
  // Resetear índice de navegación
  setHistoryIndex(-1);
  setSavedInput('');
}

    // Log de depuración cuando se ejecuta un comando
    if (isDebugActive()) {
      logDebug(`Comando ejecutado: ${inputValue}`, 'COMMAND');
    }

    // Añadir comando a la historia
    setHistory(prev => [
      ...prev,
      { type: 'command', content: inputValue }
    ]);
    setTimeout(forceScrollToBottom, 50);

    // Comando para limpiar la pantalla
    if (inputValue.toLowerCase() === 'clear') {
      // Verificar si el debug está activo antes de limpiar
      if (isDebugActive()) {
        setHistory(prev => [...prev, {
          type: 'system',
          content: '[yellow]No se puede limpiar la terminal mientras el modo debug está activo.[/yellow]'
        }]);
        logDebug('Intento de comando clear rechazado (modo debug activo)', 'SYSTEM', true);
      } else {
        setHistory([{ type: 'system', content: '[dim]Terminal limpiada. Al menos puedes mantener algo ordenado.[/dim]' }]);
      }

      setInputValue('');
      inputRef.current?.focus(); // Mantener foco
      return;
    }

    // Procesar comando y añadir respuesta
    try {
      const response = await onCommand(inputValue);

      if (response) {
        setHistory(prev => [
          ...prev,
          { type: 'response', content: response }
        ]);
      }

      setTimeout(forceScrollToBottom, 50);
    } catch (error) {
      if (isDebugActive()) {
        logDebug(`Error al procesar comando: ${error.message}`, 'ERROR');
      }

      setHistory(prev => [
        ...prev,
        {
          type: 'error', content: `[red]Error: ${error.message}[/red]
        
[italic]¿Es esto demasiado difícil para ti? Tal vez deberías intentar algo más simple...[/italic]` }
      ]);
      setTimeout(forceScrollToBottom, 50);
    }

    // Limpiar input después de enviar
    setInputValue('');

    // Restaurar foco después de procesar el comando
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Manejar clic en el contenedor para enfocar el input
  const handleContainerClick = () => {
    // Si hay diálogo activo, continuarlo
    if (currentDialog) {
      continueDialog();
      return;
    }

    inputRef.current?.focus();
  };

  // Renderizar las opciones actuales o formulario si existen
  const renderOptions = () => {
    if (!currentOptions) return null;

    // Si es un widget de input, no renderizar nada (usa el input normal)
    if (currentOptions.type === 'input') {
      return null;
    }

    // Si es un formulario, renderizar el FormWidget
    if (currentOptions.type === 'form') {
      return (
        <FormWidget
          widget={currentOptions}
          onFormSubmit={handleFormSubmit}
        />
      );
    }

    // Si es un widget de botones, renderizar las opciones
    if (currentOptions.options) {
      return (
        <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          {currentOptions.options.map((option, index) => (
            <OptionButton
              key={index}
              onClick={() => handleOptionSelect(option)}
            >
              [{index + 1}] {option.text}
            </OptionButton>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <TerminalContainer onClick={handleContainerClick}>
      <OutputWrapper ref={outputRef}>
        <TerminalOutput
          history={history}
          renderCustomContent={() => renderOptions()}
        />
      </OutputWrapper>

      {/* Aviso para continuar */}
      {showEnterPrompt && (
        <EnterPrompt>Presiona ENTER para continuar</EnterPrompt>
      )}

      <TerminalInput
        prompt={props.prompt}
        value={inputValue}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        placeholder={
          currentDialog
            ? "Presiona Enter para continuar..."
            : currentOptions && currentOptions.options
              ? "Escribe el número de la opción [1-" + currentOptions.options.length + "]"
              : ""
        }
        disabled={false}
        type={inputType}
      />
    </TerminalContainer>
  );
});

export default Terminal;