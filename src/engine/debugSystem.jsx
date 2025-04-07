// src/engine/debugSystem.jsx
// Sistema de depuración viscoso para el Motor Baboso
// Porque hasta las babosas necesitan solucionar problemas

import React from 'react';

// Estado global y configuración del sistema de depuración
let debugLogs = [];
let debugActive = false;
let debugOutputHandler = null;

// Estado global de depuración
let debugState = {
  active: false,
  history: [],
  timers: {},
  startTime: Date.now()
};

// Colores para mensajes de terminal
const COLORS = {
  INFO: 'cyan',
  ERROR: 'red',
  WARNING: 'yellow',
  DEBUG: 'blue',
  EVENT: 'green',
  TIMER: 'magenta'
};

/**
 * Establece el manejador para la salida de depuración
 * @param {function} handler - Función que recibirá los mensajes de depuración
 */
export function setDebugOutputHandler(handler) {
  debugOutputHandler = handler;
}

/**
 * Registra un mensaje en el historial de depuración
 * @param {string} message - Mensaje a registrar
 * @param {string} category - Categoría del mensaje (INFO, ERROR, WARNING, DEBUG, EVENT, TIMER)
 * @param {boolean} important - Si es true, muestra el mensaje aunque el debug esté desactivado
 * @returns {object} - Entrada del log creada
 */
export const logDebug = (message, category = 'GENERAL', important = false) => {
  // Si el debug no está activo y el mensaje no es importante, ignorar
  if (!isDebugActive() && !important) return null;

  const logEntry = {
    timestamp: new Date().toISOString(),
    category,
    message,
    important
  };

  // Añadir la entrada al historial
  debugLogs.push(logEntry);
  debugState.history.push(logEntry);

  const prefix = `[DEBUG][${category}]`;

  // Imprimir en la consola del navegador según importancia
  if (important) {
    console.warn(prefix, message);
  } else {
    console.log(prefix, message);
  }

  // Si hay un manejador de salida registrado, enviarle el mensaje
  if (debugOutputHandler) {
    try {
      debugOutputHandler({
        type: 'debug',
        content: `[${COLORS[category] || 'white'}]${prefix} ${message}[/${COLORS[category] || 'white'}]`,
        category,
        timestamp: logEntry.timestamp
      });
    } catch (error) {
      console.error('Error en debugOutputHandler:', error);
    }
  }

  return logEntry;
};

/**
 * Activa el modo de depuración
 * @returns {string} - Mensaje de confirmación
 */
export const enableDebug = () => {
  debugState.active = true;
  debugActive = true;
  return logDebug('Modo depuración activado', 'INFO', true);
};

/**
 * Desactiva el modo de depuración
 * @returns {string} - Mensaje de confirmación
 */
export const disableDebug = () => {
  debugState.active = false;
  debugActive = false;
  return logDebug('Modo depuración desactivado', 'INFO', true);
};

/**
 * Verifica si el modo de depuración está activo
 * @returns {boolean}
 */
export const isDebugActive = () => debugState.active || debugActive;

/**
 * Obtiene el historial de depuración
 * @param {number} limit - Número máximo de entradas a retornar
 * @returns {Array} - Historial de depuración
 */
export const getDebugHistory = (limit = 50) => {
  if (!isDebugActive()) {
    return [];
  }
  
  // Devolver las últimas 'limit' entradas
  return debugState.history.slice(-limit);
};

/**
 * Limpia el historial de depuración
 */
export const clearDebugHistory = () => {
  debugState.history = [];
  debugLogs = [];
  return logDebug('Historial de depuración limpiado', 'INFO', true);
};

/**
 * Inicia un temporizador para medir rendimiento
 * @param {string} name - Nombre del temporizador
 */
export const startTimer = (name = 'default') => {
  if (!isDebugActive()) return;
  
  debugState.timers[name] = Date.now();
  return logDebug(`Temporizador '${name}' iniciado`, 'TIMER');
};

/**
 * Detiene un temporizador y retorna el tiempo transcurrido
 * @param {string} name - Nombre del temporizador
 * @returns {number} - Tiempo transcurrido en milisegundos
 */
export const stopTimer = (name = 'default') => {
  if (!isDebugActive() || !debugState.timers[name]) {
    return 0;
  }
  
  const elapsed = Date.now() - debugState.timers[name];
  delete debugState.timers[name];
  
  logDebug(`Temporizador '${name}': ${elapsed}ms`, 'TIMER');
  return elapsed;
};

/**
 * Inspecciona un objeto para depuración
 * @param {any} obj - Objeto a inspeccionar
 * @param {string} name - Nombre para identificar el objeto
 * @returns {object} - Entrada del log con la inspección
 */
export const inspectObject = (obj, name = 'Objeto') => {
  if (!isDebugActive()) return null;
  
  try {
    // Para objetos complejos, crear una versión segura de JSON
    const safeObj = JSON.parse(JSON.stringify(obj, (key, value) => {
      // Manejar casos especiales como funciones o circular references
      if (typeof value === 'function') {
        return '[Función]';
      }
      return value;
    }));
    
    return logDebug(`Inspección de ${name}: ${JSON.stringify(safeObj, null, 2)}`, 'DEBUG');
  } catch (error) {
    return logDebug(`Error al inspeccionar ${name}: ${error.message}`, 'ERROR');
  }
};

/**
 * Obtiene un informe completo del estado del juego
 * @param {object} gameState - Estado actual del juego
 * @returns {object} - Informe detallado
 */
export const getDebugReport = (gameState) => {
  if (!gameState) {
    return { error: 'No hay estado de juego disponible' };
  }
  
  // Crear informe de estado
  const report = {
    debugInfo: {
      active: debugState.active,
      historyLength: debugState.history.length,
      uptime: Date.now() - debugState.startTime
    },
    gameState: {
      currentRoute: gameState.currentRoute,
      stats: gameState.stats || {},
      flags: gameState.flags || {},
      inventory: gameState.inventory || [],
      visitedRoutes: gameState.visitedRoutes || [],
      seenDialogs: gameState.seenDialogs || []
    },
    browserInfo: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`
    }
  };
  
  return report;
};

/**
 * Exporta el informe de depuración como JSON
 * @param {object} gameState - Estado actual del juego
 * @returns {string} - JSON del informe
 */
export const exportDebugReport = (gameState) => {
  const report = getDebugReport(gameState);
  
  // Añadir historial completo al exportar
  report.debugHistory = debugState.history;
  report.timestamp = new Date().toISOString();
  
  return JSON.stringify(report, null, 2);
};

/**
 * Genera una tabla para la salida del terminal basada en datos
 * @param {Array} data - Array de objetos para la tabla
 * @param {Array} columns - Columnas a mostrar (headers)
 * @returns {object} - Objeto de tabla formateado para la terminal
 */
export const generateDebugTable = (data, columns) => {
  if (!data || !columns || data.length === 0) {
    return { type: 'system', content: '[yellow]No hay datos para mostrar en la tabla.[/yellow]' };
  }
  
  return {
    type: 'table',
    table: {
      header: columns,
      rows: data.map(item => columns.map(col => item[col] || '')),
      widths: columns.map(() => 1), // Ancho equitativo por defecto
      aligns: columns.map(() => 'left') // Alineación izquierda por defecto
    }
  };
};

// Función que procesa el comando debug con el característico sarcasmo baboso
export const handleDebugCommand = (args, gameState, handlers) => {
  const subcommand = args[0]?.toLowerCase();
  let outputText = '';
  
  switch (subcommand) {
    case 'on':
      enableDebug();
      return '[green]Modo depuración activado.[/green] Ahora puedes apreciar lo verdaderamente desastroso que es todo por dentro.';
      
    case 'off':
      disableDebug();
      return '[yellow]Modo depuración desactivado.[/yellow] Volviendo a la ignorancia feliz, ¿eh?';
      
    case 'status':
      return isDebugActive() 
        ? '[green]El modo depuración está ACTIVO.[/green] Estás viendo más de lo que deberías.' 
        : '[yellow]El modo depuración está INACTIVO.[/yellow] ¿Quieres ver la realidad? Usa "debug on".';
      
    case 'history':
      const history = getDebugHistory();
      if (history.length === 0) {
        return '[yellow]No hay historial de depuración disponible. Tan vacío como tus logros vitales.[/yellow]';
      }
      
      // Crear tabla de historial para mostrar
      outputText = '[cyan]===== HISTORIAL DE DEPURACIÓN =====[/cyan]\n\n';
      history.forEach(entry => {
        const color = COLORS[entry.category] || 'white';
        outputText += `[dim]${entry.timestamp}[/dim] [${color}]${entry.category}:[/${color}] ${entry.message}\n`;
      });
      
      return outputText;
      
    case 'clear':
      clearDebugHistory();
      return '[cyan]Historial de depuración limpiado. Como borrar la evidencia de tus errores.[/cyan]';
      
    case 'inspect':
      if (!isDebugActive()) {
        return '[yellow]Activa el modo depuración primero con "debug on", genio.[/yellow]';
      }
      
      const report = getDebugReport(gameState);
      outputText = '[cyan]===== INSPECCIÓN DEL SISTEMA =====[/cyan]\n\n';
      
      // Formatear informe para mostrar en terminal con sarcasmo
      outputText += `[green]Estado de depuración:[/green] ${report.debugInfo.active ? 'Activo (felicidades por descubrirlo)' : 'Inactivo (¿en serio?)'}\n`;
      outputText += `[green]Tiempo de ejecución:[/green] ${Math.floor(report.debugInfo.uptime / 1000)}s (tiempo que podrías haber usado productivamente)\n`;
      outputText += `[green]Entradas de historial:[/green] ${report.debugInfo.historyLength} (cada una, un pequeño fracaso)\n\n`;
      
      outputText += `[green]Ruta actual:[/green] ${report.gameState.currentRoute || 'Ninguna (perdido, como en la vida real)'}\n`;
      outputText += `[green]Stats:[/green] ${JSON.stringify(report.gameState.stats)}\n`;
      outputText += `[green]Flags:[/green] ${JSON.stringify(report.gameState.flags)}\n`;
      outputText += `[green]Inventario:[/green] ${report.gameState.inventory ? report.gameState.inventory.join(', ') : 'Tan vacío como tu billetera'}\n\n`;
      
      outputText += `[green]Navegador:[/green] ${report.browserInfo.userAgent}\n`;
      outputText += `[green]Plataforma:[/green] ${report.browserInfo.platform}\n`;
      
      return outputText;
      
    case 'stats':
      if (!isDebugActive()) {
        return '[yellow]Activa el modo depuración primero con "debug on", iluminado.[/yellow]';
      }
      
      if (!gameState || !gameState.stats) {
        return '[red]No hay estadísticas disponibles. Como esa promoción que nunca llegó.[/red]';
      }
      
      outputText = '[cyan]===== ESTADÍSTICAS DEL JUEGO (TAN PATÉTICAS COMO TÚ) =====[/cyan]\n\n';
      
      for (const [key, value] of Object.entries(gameState.stats)) {
        outputText += `[green]${key}:[/green] ${value}\n`;
      }
      
      return outputText;
      
    case 'routes':
      if (!isDebugActive()) {
        return '[yellow]Activa el modo depuración primero con "debug on". ¿Es tan difícil?[/yellow]';
      }
      
      if (!gameState || !gameState.visitedRoutes || gameState.visitedRoutes.length === 0) {
        return '[yellow]No hay rutas visitadas. Tan sedentario en el juego como en la vida.[/yellow]';
      }
      
      outputText = '[cyan]===== RUTAS VISITADAS (TU HISTORIAL DE MALAS DECISIONES) =====[/cyan]\n\n';
      gameState.visitedRoutes.forEach((route, index) => {
        outputText += `${index + 1}. ${route}\n`;
      });
      
      return outputText;
      
    case 'game':
      if (!isDebugActive()) {
        return '[yellow]Activa el modo depuración primero con "debug on". Es como pedir la comida antes de sentarte.[/yellow]';
      }
      
      if (!gameState || !gameState.game) {
        return '[red]No hay información del juego disponible. ¿Seguro que estás jugando algo?[/red]';
      }
      
      outputText = '[cyan]===== INFORMACIÓN DEL JUEGO =====[/cyan]\n\n';
      outputText += `[green]Nombre:[/green] ${gameState.game.name || 'Algo tan insignificante que ni tiene nombre'}\n`;
      outputText += `[green]Versión:[/green] ${gameState.game.version || 'Tan antigua que los dinosaurios la usaban'}\n`;
      outputText += `[green]Autor:[/green] ${gameState.game.author || 'Anónimo (probablemente avergonzado)'}\n`;
      
      return outputText;
      
    case 'dump':
      if (!isDebugActive()) {
        return '[yellow]Activa el modo depuración primero con "debug on", criatura torpe.[/yellow]';
      }
      
      const jsonData = exportDebugReport(gameState);
      
      // Crear un objeto Blob para descarga
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Crear enlace para descarga
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `baboso_debug_dump_${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      
      // Limpiar
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      return '[green]Informe de depuración exportado correctamente.[/green] Ahora puedes enviar tus fracasos a un archivo que nadie leerá.';
      
    default:
      return `
[cyan]Comandos de depuración para cerebros subdesarrollados:[/cyan]

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

Usa estos comandos si realmente quieres ver lo desastroso que es todo por dentro.
`;
  }
};