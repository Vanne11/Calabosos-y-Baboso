// src/engine/routeResolver.jsx
// Resolvedor de rutas mejorado con sistema de depuración

import { logDebug, isDebugActive } from './debugSystem';
import { findDialogById, findWidgetById, getScenarioById } from './gameLoader';

/**
 * Procesa una ruta del juego
 * @param {string} routeId - ID de la ruta a procesar
 * @param {object} gameData - Datos del juego
 * @param {object} gameState - Estado actual del juego
 * @param {object} handlers - Funciones para manipular la interfaz
 * @returns {boolean} - Éxito o fracaso del procesamiento
 */
export const processRoute = (routeId, gameData, gameState, handlers) => {
  if (!gameData || !routeId) {
    if (isDebugActive()) {
      logDebug(`Intento de procesar ruta inválida: ${routeId}`, 'ERROR');
    }
    return false;
  }

  if (isDebugActive()) {
    logDebug(`Procesando ruta: ${routeId}`, 'ROUTE');
  }

  // Buscar la ruta en los datos del juego
  const route = gameData.routes.find(r => r.id === routeId);
  
  if (!route) {
    if (isDebugActive()) {
      logDebug(`Ruta no encontrada: ${routeId}`, 'ERROR');
    }
    return false;
  }

  if (isDebugActive()) {
    logDebug(`Ruta encontrada: ${routeId}`, 'ROUTE');
    
    if (route.condition) {
      logDebug(`Condición de ruta: ${route.condition}`, 'ROUTE');
    }
    
    if (route.actions && route.actions.length > 0) {
      logDebug(`Acciones de ruta: ${route.actions.join(', ')}`, 'ROUTE');
    }
  }

  // Verificar condición de la ruta si existe
  if (route.condition && route.condition !== 'default') {
    const conditionResult = checkCondition(route.condition, gameState);
    
    if (!conditionResult.success) {
      if (isDebugActive()) {
        logDebug(`Condición de ruta no cumplida: ${route.condition}`, 'CONDITION');
      }
      
      // Si hay ruta alternativa, procesarla
      if (conditionResult.alternativeRoute) {
        if (isDebugActive()) {
          logDebug(`Redirigiendo a ruta alternativa: ${conditionResult.alternativeRoute}`, 'ROUTE');
        }
        return processRoute(conditionResult.alternativeRoute, gameData, gameState, handlers);
      }
      
      // Si hay mensaje de fallo, mostrarlo
      if (conditionResult.failMessage && handlers.addToTerminal) {
        handlers.addToTerminal({
          type: 'system',
          content: conditionResult.failMessage
        });
      }
      
      return false;
    }
  }

  // Marcar la ruta como visitada
  if (gameState && !gameState.visitedRoutes?.includes(routeId)) {
    // Esta lógica debería estar en el manejador de estado del juego
    if (handlers.updateGameState) {
      handlers.updateGameState(prevState => ({
        ...prevState,
        visitedRoutes: [...(prevState.visitedRoutes || []), routeId]
      }));
      
      if (isDebugActive()) {
        logDebug(`Ruta marcada como visitada: ${routeId}`, 'STATE');
      }
    }
  }

  // Procesar cada acción de la ruta
  if (route.actions && route.actions.length > 0) {
    for (const actionId of route.actions) {
      if (isDebugActive()) {
        logDebug(`Procesando acción: ${actionId}`, 'ACTION');
      }

      // Buscar si es un escenario
      const scenario = getScenarioById(actionId, gameData.scenarios);
      if (scenario) {
        if (isDebugActive()) {
          logDebug(`Mostrando escenario: ${actionId}`, 'SCENARIO');
        }
        
        if (handlers.setCurrentScenario) {
          handlers.setCurrentScenario(scenario);
        }
        continue;
      }

      // Buscar si es un diálogo
      const dialog = findDialogById(actionId, gameData.dialogs);
      if (dialog) {
        if (isDebugActive()) {
          logDebug(`Mostrando diálogo: ${actionId}`, 'DIALOG');
        }
        
        if (handlers.showDialog) {
          handlers.showDialog(dialog);
        }
        continue;
      }

      // Buscar si es un widget
      const widget = findWidgetById(actionId, gameData.widgets);
      if (widget) {
        if (isDebugActive()) {
          logDebug(`Mostrando widget: ${actionId} (tipo: ${widget.type})`, 'WIDGET');
          logDebug(`Buscando widget: ${actionId} → ${widget ? 'ENCONTRADO' : 'NO ENCONTRADO'}`, 'DEBUG');

        }
      
        if (widget.type === 'choice' && Array.isArray(widget.options)) {
          if (handlers.addToTerminal) {
            handlers.addToTerminal({ type: 'system', content: '[cyan][bold]Elige una opción:[/bold][/cyan]' });
      
            widget.options.forEach((opt, idx) => {
              const label = opt.label || `Opción ${idx + 1}`;
              const key = opt.key || `${idx + 1}`;
              handlers.addToTerminal({
                type: 'system',
                content: `[yellow]${key}.[/yellow] ${label}`
              });
            });
          }
      
          if (handlers.updateGameState) {
            handlers.updateGameState(prev => ({
              ...prev,
              awaitingChoice: {
                widgetId: widget.id,
                options: widget.options
              }
            }));
          }
      
          return true; // detenemos el procesamiento hasta que el jugador elija
        }
      
        // Si es otro tipo de widget, se muestra con showWidget (por compatibilidad)
        if (handlers.showWidget) {
          handlers.showWidget(widget);
        }
      
        continue;
      }

      // Si llegamos aquí, la acción no fue encontrada
      if (isDebugActive()) {
        logDebug(`Acción no encontrada: ${actionId}`, 'WARNING');
      }
    }
  }

  return true;
};

/**
 * Verifica si se cumple una condición
 * @param {string} conditionId - ID de la condición a verificar
 * @param {object} gameState - Estado actual del juego
 * @returns {object} - Resultado de la verificación
 */
export const checkCondition = (conditionId, gameState) => {
  // Para el modo debug, registrar la verificación
  if (isDebugActive()) {
    logDebug(`Verificando condición: ${conditionId || 'ninguna'}`, 'CONDITION');
  }
  
  // Si no hay condición o es 'default', se cumple automáticamente
  if (!conditionId || conditionId === 'default') {
    return { success: true };
  }

  // Buscar la condición en el juego
  const condition = gameState?.game?.conditions?.find(c => c.id === conditionId);
  
  if (!condition) {
    if (isDebugActive()) {
      logDebug(`Condición no encontrada: ${conditionId}`, 'WARNING');
    }
    return { success: true }; // Por defecto asumimos éxito
  }

  // Evaluar la condición según sus criterios
  // Este es un sistema simplificado, la implementación real puede ser más compleja
  let success = true;
  
  if (condition.criteria) {
    // Condición de siempre verdadera
    if (condition.criteria.always === true) {
      if (isDebugActive()) {
        logDebug(`Condición ${conditionId} es always=true`, 'CONDITION');
      }
      return { success: true };
    }
    
    // Verificar inventario
    if (condition.criteria.inventory && Array.isArray(condition.criteria.inventory)) {
      for (const item of condition.criteria.inventory) {
        if (!gameState.inventory?.includes(item)) {
          if (isDebugActive()) {
            logDebug(`Falta ítem en inventario: ${item}`, 'CONDITION');
          }
          success = false;
          break;
        }
      }
    }
    
    // Verificar flags
    if (condition.criteria.flags && typeof condition.criteria.flags === 'object') {
      for (const [flag, value] of Object.entries(condition.criteria.flags)) {
        if (gameState.flags?.[flag] !== value) {
          if (isDebugActive()) {
            logDebug(`Flag no coincide: ${flag}=${value}`, 'CONDITION');
          }
          success = false;
          break;
        }
      }
    }
    
    // Verificar estadísticas
    if (condition.criteria.stats && typeof condition.criteria.stats === 'object') {
      for (const [stat, valueStr] of Object.entries(condition.criteria.stats)) {
        // Permitir comparaciones como ">50", "<=30", etc.
        const match = valueStr.match(/^([<>=]{1,2})(\d+)$/);
        
        if (match) {
          const [, operator, valueNum] = match;
          const statValue = gameState.stats?.[stat] || 0;
          const compareValue = parseInt(valueNum, 10);
          
          let satisfies = false;
          switch (operator) {
            case '>': satisfies = statValue > compareValue; break;
            case '<': satisfies = statValue < compareValue; break;
            case '>=': satisfies = statValue >= compareValue; break;
            case '<=': satisfies = statValue <= compareValue; break;
            case '=':
            case '==': satisfies = statValue === compareValue; break;
            default: satisfies = false;
          }
          
          if (!satisfies) {
            if (isDebugActive()) {
              logDebug(`Condición de stat no cumplida: ${stat} ${operator} ${valueNum} (valor actual: ${statValue})`, 'CONDITION');
            }
            success = false;
            break;
          }
        } else {
          // Comparación simple de igualdad
          const statValue = gameState.stats?.[stat] || 0;
          const compareValue = parseInt(valueStr, 10);
          
          if (statValue !== compareValue) {
            if (isDebugActive()) {
              logDebug(`Stat no coincide: ${stat}=${valueStr} (valor actual: ${statValue})`, 'CONDITION');
            }
            success = false;
            break;
          }
        }
      }
    }
    
    // Verificar rutas visitadas
    if (condition.criteria.visited_routes && Array.isArray(condition.criteria.visited_routes)) {
      for (const route of condition.criteria.visited_routes) {
        if (!gameState.visitedRoutes?.includes(route)) {
          if (isDebugActive()) {
            logDebug(`Ruta no visitada: ${route}`, 'CONDITION');
          }
          success = false;
          break;
        }
      }
    }
    
    // Verificar rutas NO visitadas
    if (condition.criteria.unvisited_routes && Array.isArray(condition.criteria.unvisited_routes)) {
      for (const route of condition.criteria.unvisited_routes) {
        if (gameState.visitedRoutes?.includes(route)) {
          if (isDebugActive()) {
            logDebug(`Ruta ya visitada: ${route}`, 'CONDITION');
          }
          success = false;
          break;
        }
      }
    }
    
    // Verificar diálogos vistos
    if (condition.criteria.seen_dialogs && Array.isArray(condition.criteria.seen_dialogs)) {
      for (const dialog of condition.criteria.seen_dialogs) {
        if (!gameState.seenDialogs?.includes(dialog)) {
          if (isDebugActive()) {
            logDebug(`Diálogo no visto: ${dialog}`, 'CONDITION');
          }
          success = false;
          break;
        }
      }
    }
    
    // Verificar fase temporal
    if (condition.criteria.time && condition.criteria.time.phase) {
      if (gameState.time?.currentPhase !== condition.criteria.time.phase) {
        if (isDebugActive()) {
          logDebug(`Fase temporal no coincide: ${condition.criteria.time.phase} (actual: ${gameState.time?.currentPhase})`, 'CONDITION');
        }
        success = false;
      }
    }
  }
  
  // Si la condición falla y hay configuración de fallo
  if (!success && condition.failure) {
    if (isDebugActive()) {
      logDebug(`Condición fallida: ${conditionId}`, 'CONDITION');
      if (condition.failure.message) {
        logDebug(`Mensaje de fallo: ${condition.failure.message}`, 'CONDITION');
      }
      if (condition.failure.alternative_route) {
        logDebug(`Ruta alternativa: ${condition.failure.alternative_route}`, 'CONDITION');
      }
    }
    
    return {
      success: false,
      failMessage: condition.failure.message,
      alternativeRoute: condition.failure.alternative_route
    };
  }
  
  // Para el modo debug, registrar el resultado final
  if (isDebugActive()) {
    logDebug(`Resultado final de condición ${conditionId}: ${success ? 'verdadero' : 'falso'}`, 'CONDITION');
  }
  
  return { success };
};

/**
 * Encuentra una ruta por su ID
 * @param {string} routeId - ID de la ruta a buscar
 * @param {array} routes - Lista de rutas disponibles
 * @returns {object|null} - La ruta encontrada o null
 */
export const findRouteById = (routeId, routes) => {
  if (!routes || !Array.isArray(routes) || !routeId) {
    return null;
  }
  
  const route = routes.find(r => r.id === routeId);
  
  if (isDebugActive()) {
    if (route) {
      logDebug(`Ruta encontrada: ${routeId}`, 'ROUTE');
    } else {
      logDebug(`Ruta no encontrada: ${routeId}`, 'WARNING');
    }
  }
  
  return route;
};