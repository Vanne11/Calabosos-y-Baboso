// components/Terminal/Terminal.jsx
// Terminal interactiva con detección de Tab e integración de depuración

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import styled from 'styled-components';
import TerminalInput from './TerminalInput';
import TerminalOutput from './TerminalOutput';
import { processRoute } from '../../engine/routeResolver';
import { findDialogById, findWidgetById } from '../../engine/gameLoader';
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
    inputType = 'text',
    speedMultiplier = 1,
    showEnterPrompt,
    setShowEnterPrompt,
    waitForEnter,
    volume = 50,
    isLoginPrompt = false  // <-- Asegúrate de recibir esta prop

  } = props;

  const [inputValue, setInputValue] = useState('');
  const [currentDialog, setCurrentDialog] = useState(null);
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0);
  const [dialogLines, setDialogLines] = useState([]);
  const [currentOptions, setCurrentOptions] = useState(null);
  const [isProcessingRoute, setIsProcessingRoute] = useState(false);
  const [tabCount, setTabCount] = useState(0);

  const inputRef = useRef(null);
  const outputRef = useRef(null);

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

  // Mostrar/ocultar el aviso de Enter según haya diálogo activo
  useEffect(() => {
    setShowEnterPrompt(!!currentDialog);
  }, [currentDialog]);

  // Procesar la ruta actual cuando cambia
  useEffect(() => {
    if (!gameData || !currentRoute || !setGameState || isProcessingRoute) return;

    setIsProcessingRoute(true);

    // Log de depuración cuando se cambia de ruta
    if (isDebugActive()) {
      logDebug(`Navegando a ruta: ${currentRoute}`, 'ROUTE');
    }

    const processCurrentRoute = async () => {
      const route = gameData.routes.find(r => r.id === currentRoute);
      if (!route) {
        setIsProcessingRoute(false);
        if (isDebugActive()) {
          logDebug(`Error: Ruta no encontrada: ${currentRoute}`, 'ERROR');
        }
        return;
      }

      // Limpiar estado actual de diálogo y opciones
      setCurrentDialog(null);
      setCurrentOptions(null);

      // Mostrar mensaje de la ruta
      addSystemMessage(`[dim]Procesando ruta: ${currentRoute}[/dim]`);

      // Procesar acciones de la ruta
      for (const actionId of route.actions) {
        // Buscar si es un diálogo
        const dialog = findDialogById(actionId, gameData.dialogs);
        if (dialog) {
          await showDialog(dialog);

          // Marcar diálogo como visto
          setGameState(prevState => markDialogAsSeen(prevState, actionId));
          continue;
        }

        // Buscar si es un widget (opciones)
        const widget = findWidgetById(actionId, gameData.widgets);
        if (widget && widget.type === 'button') {
          if (isDebugActive()) {
            logDebug(`Renderizando widget de botones: ${actionId}`, 'WIDGET');
          }
          setCurrentOptions(widget);
          break; // Detenemos el procesamiento de acciones cuando hay opciones
        }
      }

      setIsProcessingRoute(false);
    };

    processCurrentRoute();
  }, [currentRoute, gameData, setGameState, isProcessingRoute]);

  // Mantener el foco después de renderizar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Añadir mensaje del sistema a la historia
  const addSystemMessage = (message) => {
    setHistory(prev => [...prev, { type: 'system', content: message }]);
    setTimeout(forceScrollToBottom, 50);
  };

  // Mostrar un diálogo en la terminal
  const showDialog = async (dialog) => {
    if (!dialog || !dialog.content) return;

    // Log de depuración cuando se muestra un diálogo
    if (isDebugActive() && dialog) {
      logDebug(`Mostrando diálogo: ${dialog.id || 'sin id'} (${dialog.character || 'sin personaje'})`, 'DIALOG');
    }

    // Determinar qué líneas mostrar (filtrar por condiciones si es necesario)
    const validLines = dialog.content.filter(line => {
      // Si es un string, siempre se muestra
      if (typeof line === 'string') return true;

      // Si es un objeto con condición, se debería verificar la condición
      // Por simplicidad, ahora mostramos todas las líneas
      return true;
    });

    setCurrentDialog(dialog);
    setDialogLines(validLines);

    // Mostrar el nombre del personaje
    if (dialog.character) {
      setHistory(prev => [...prev, {
        type: 'dialogHeader',
        content: dialog.character
      }]);
      setTimeout(forceScrollToBottom, 50);
    }

    // Mostrar la primera línea
    if (validLines.length > 0) {
      const firstLine = typeof validLines[0] === 'string'
        ? validLines[0]
        : validLines[0].text || '';

      setHistory(prev => [...prev, {
        type: 'dialog',
        content: firstLine
      }]);
      setTimeout(forceScrollToBottom, 50);

      // Si hay más líneas, esperamos a que el usuario continúe
      if (validLines.length > 1) {
        setCurrentDialogIndex(1);
      } else {
        setCurrentDialog(null);
      }
    }

    // Esperamos a que se complete el diálogo antes de continuar
    return new Promise(resolve => {
      const checkDialogComplete = setInterval(() => {
        if (!currentDialog) {
          clearInterval(checkDialogComplete);
          resolve();
        }
      }, 100);
    });
  };

  // Continuar mostrando el diálogo
  const continueDialog = () => {
    if (!currentDialog || currentDialogIndex >= dialogLines.length) {
      setCurrentDialog(null);
      setCurrentDialogIndex(0);
      return;
    }

    const line = dialogLines[currentDialogIndex];
    const text = typeof line === 'string' ? line : line.text || '';

    setHistory(prev => [...prev, {
      type: 'dialog',
      content: text
    }]);
    setTimeout(forceScrollToBottom, 50);

    setCurrentDialogIndex(currentDialogIndex + 1);

    if (currentDialogIndex >= dialogLines.length - 1) {
      // Era la última línea
      setCurrentDialog(null);
      setCurrentDialogIndex(0);
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

      if (isDebugActive() && option.modifiers) {
        logDebug(`Aplicando modificadores: ${JSON.stringify(option.modifiers)}`, 'STATE');
      }
    }

    // Ir a la ruta especificada
    if (option.destination && setCurrentRoute) {
      setCurrentRoute(option.destination);
    }

    // Limpiar opciones actuales
    setCurrentOptions(null);
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

  // Renderizar las opciones actuales si existen
  const renderOptions = () => {
    if (!currentOptions || !currentOptions.options) return null;

    return (
      <div>
        {currentOptions.options.map((option, index) => (
          <OptionButton
            key={index}
            onClick={() => handleOptionSelect(option)}
          >
            {option.text}
          </OptionButton>
        ))}
      </div>
    );
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
        placeholder={currentDialog ? "Presiona Enter para continuar..." : ""}
        disabled={false}
        type={inputType}
      />
    </TerminalContainer>
  );
});

export default Terminal;