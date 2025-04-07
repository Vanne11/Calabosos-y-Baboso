// engine/routeResolver.jsx
// El corazón del motor narrativo, resuelve rutas y evalúa condiciones

import { 
  findRouteById, 
  findScenarioById, 
  findDialogById, 
  findWidgetById, 
  findConditionById 
} from './gameLoader';
import { markRouteAsVisited, markDialogAsSeen, advanceTime } from './gameState';

// Procesa una ruta y ejecuta sus acciones
export const processRoute = (routeId, gameData, gameState, handlers = {}) => {
  const { 
    updateGameState, 
    setCurrentScenario, 
    showDialog, 
    showWidget 
  } = handlers;
  
  // Buscar la ruta en los datos del juego
  const route = findRouteById(routeId, gameData.routes);
  if (!route) {
    console.error(`Ruta no encontrada: ${routeId}`);
    return false;
  }
  
  // Verificar si la ruta tiene una condición
  if (route.condition && route.condition !== 'default') {
    const conditionResult = checkCondition(route.condition, gameData, gameState);
    if (!conditionResult.success) {
      console.log(`Condición de ruta no cumplida: ${route.condition}`);
      
      // Si hay una ruta alternativa definida, procesarla en su lugar
      if (conditionResult.alternativeRoute) {
        return processRoute(conditionResult.alternativeRoute, gameData, gameState, handlers);
      }
      
      return false;
    }
  }
  
  // Marcar la ruta como visitada
  if (updateGameState) {
    updateGameState(prevState => markRouteAsVisited(prevState, routeId));
  }
  
  // Ejecutar las acciones de la ruta en orden
  executeActions(route.actions, gameData, gameState, handlers);
  
  return true;
};

// Ejecuta las acciones de una ruta
const executeActions = (actions, gameData, gameState, handlers) => {
  const { 
    updateGameState, 
    setCurrentScenario, 
    showDialog, 
    showWidget 
  } = handlers;
  
  // No hay acciones que ejecutar
  if (!actions || actions.length === 0) {
    return;
  }
  
  // Ejecutar cada acción en secuencia
  for (const actionId of actions) {
    // Comprobar si es un escenario
    const scenario = findScenarioById(actionId, gameData.scenarios);
    if (scenario) {
      if (!scenario.condition || checkCondition(scenario.condition, gameData, gameState).success) {
        if (setCurrentScenario) {
          setCurrentScenario(scenario);
        }
      }
      continue;
    }
    
    // Comprobar si es un diálogo
    const dialog = findDialogById(actionId, gameData.dialogs);
    if (dialog) {
      if (!dialog.condition || checkCondition(dialog.condition, gameData, gameState).success) {
        if (showDialog) {
          showDialog(dialog);
        }
        
        // Marcar el diálogo como visto
        if (updateGameState) {
          updateGameState(prevState => markDialogAsSeen(prevState, actionId));
        }
      }
      continue;
    }
    
    // Comprobar si es un widget
    const widget = findWidgetById(actionId, gameData.widgets);
    if (widget) {
      if (!widget.condition || checkCondition(widget.condition, gameData, gameState).success) {
        if (showWidget) {
          showWidget(widget);
        }
      }
      continue;
    }
    
    // Si llegamos aquí, la acción no existe
    console.warn(`Acción no encontrada: ${actionId}`);
  }
  
  // Avanzar el tiempo del juego después de procesar todas las acciones
  if (updateGameState) {
    updateGameState(prevState => advanceTime(prevState, gameData));
  }
};

// Verifica si se cumple una condición
export const checkCondition = (conditionId, gameData, gameState) => {
  // Si no hay condición o es 'default', se cumple automáticamente
  if (!conditionId || conditionId === 'default') {
    return { success: true };
  }
  
  // Buscar la condición en los datos del juego
  const condition = findConditionById(conditionId, gameData.conditions);
  if (!condition) {
    console.error(`Condición no encontrada: ${conditionId}`);
    return { success: false };
  }
  
  // Verificar los criterios de la condición
  const criteria = condition.criteria || {};
  
  // Criterio 'always': siempre se cumple
  if (criteria.always === true) {
    return { success: true };
  }
  
  // Criterio 'stats': verifica estadísticas del jugador
  if (criteria.stats) {
    for (const [stat, requirement] of Object.entries(criteria.stats)) {
      const statValue = gameState.stats[stat] || 0;
      
      // Requisito puede ser un número o una comparación
      if (typeof requirement === 'number') {
        if (statValue < requirement) {
          return { 
            success: false, 
            message: condition.failure?.message,
            alternativeRoute: condition.failure?.alternative_route
          };
        }
      } else if (typeof requirement === 'string') {
        // Comparación como ">50", "<=30", etc.
        const operator = requirement.match(/^([<>=]+)/)[1];
        const value = parseInt(requirement.replace(/^[<>=]+/, ''), 10);
        
        if (!evaluateComparison(statValue, operator, value)) {
          return { 
            success: false, 
            message: condition.failure?.message,
            alternativeRoute: condition.failure?.alternative_route
          };
        }
      }
    }
  }
  
  // Criterio 'inventory': verifica ítems en el inventario
  if (criteria.inventory) {
    for (const item of criteria.inventory) {
      if (!gameState.inventory.includes(item)) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
    }
  }
  
  // Criterio 'flags': verifica banderas (flags)
  if (criteria.flags) {
    for (const [flag, required] of Object.entries(criteria.flags)) {
      if (gameState.flags[flag] !== required) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
    }
  }
  
  // Criterio 'visited_routes': verifica rutas visitadas
  if (criteria.visited_routes) {
    for (const route of criteria.visited_routes) {
      if (!gameState.visitedRoutes.includes(route)) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
    }
  }
  
  // Criterio 'unvisited_routes': verifica rutas NO visitadas
  if (criteria.unvisited_routes) {
    for (const route of criteria.unvisited_routes) {
      if (gameState.visitedRoutes.includes(route)) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
    }
  }
  
  // Criterio 'seen_dialogs': verifica diálogos vistos
  if (criteria.seen_dialogs) {
    for (const dialog of criteria.seen_dialogs) {
      if (!gameState.seenDialogs.includes(dialog)) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
    }
  }
  
  // Criterio 'characters': verifica estado de personajes
  if (criteria.characters) {
    for (const [charId, requirements] of Object.entries(criteria.characters)) {
      const character = gameState.characters[charId];
      
      if (!character) {
        return { 
          success: false, 
          message: condition.failure?.message,
          alternativeRoute: condition.failure?.alternative_route
        };
      }
      
      for (const [attribute, requirement] of Object.entries(requirements)) {
        if (typeof requirement === 'boolean') {
          if (character[attribute] !== requirement) {
            return { 
              success: false, 
              message: condition.failure?.message,
              alternativeRoute: condition.failure?.alternative_route
            };
          }
        } else if (typeof requirement === 'string' && requirement.match(/^[<>=]+/)) {
          // Comparación como ">50", "<=30", etc.
          const operator = requirement.match(/^([<>=]+)/)[1];
          const value = parseInt(requirement.replace(/^[<>=]+/, ''), 10);
          
          if (!evaluateComparison(character[attribute] || 0, operator, value)) {
            return { 
              success: false, 
              message: condition.failure?.message,
              alternativeRoute: condition.failure?.alternative_route
            };
          }
        }
      }
    }
  }
  
  // Criterio 'time': verifica condiciones de tiempo
  if (criteria.time) {
    if (criteria.time.phase && gameState.time.currentPhase !== criteria.time.phase) {
      return { 
        success: false, 
        message: condition.failure?.message,
        alternativeRoute: condition.failure?.alternative_route
      };
    }
  }
  
  // Si llegamos aquí, todos los criterios se cumplen
  return { success: true };
};

// Evalúa una comparación numérica
const evaluateComparison = (value, operator, target) => {
  switch (operator) {
    case '>':
      return value > target;
    case '>=':
      return value >= target;
    case '<':
      return value < target;
    case '<=':
      return value <= target;
    case '==':
    case '=':
      return value === target;
    case '!=':
      return value !== target;
    default:
      return false;
  }
};