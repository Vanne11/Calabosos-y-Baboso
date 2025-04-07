// src/engine/gameLoader.jsx
// Modificación para añadir logs detallados durante la carga del juego

import { logDebug, isDebugActive } from './debugSystem';

// Mantén aquí tus importaciones existentes
// ...

/**
 * Carga un juego local desde la carpeta de juegos
 * @param {string} gameName - Nombre del juego a cargar
 * @returns {object} - Datos del juego cargado
 */
export const loadLocalGame = async (gameName) => {
  try {
    if (isDebugActive()) {
      logDebug(`Iniciando carga del juego: ${gameName}`, 'LOADER');
      logDebug(`Ruta relativa: games/${gameName}/`, 'LOADER');
    }

    // Cargar archivos JSON del juego
    const infoResponse = await fetch(`games/${gameName}/info.json`);
    
    if (!infoResponse.ok) {
      const errorMsg = `No se pudo cargar info.json para ${gameName}. Estado: ${infoResponse.status}`;
      if (isDebugActive()) {
        logDebug(errorMsg, 'ERROR');
      }
      throw new Error(errorMsg);
    }
    
    const gameInfo = await infoResponse.json();
    
    if (isDebugActive()) {
      logDebug(`Info del juego cargada: ${JSON.stringify(gameInfo)}`, 'LOADER');
    }

    // Lista de archivos a cargar
    const filesToLoad = [
      'routes.json',
      'scenarios.json',
      'dialogs.json',
      'widgets.json',
      'conditions.json',
      'time.json',
      'characters.json'
    ];

    // Cargar cada archivo
    const gameData = {
      name: gameInfo.name,
      author: gameInfo.author,
      version: gameInfo.version,
      description: gameInfo.description
    };

    for (const file of filesToLoad) {
      try {
        if (isDebugActive()) {
          logDebug(`Cargando archivo: ${file}`, 'LOADER');
        }
        
        const response = await fetch(`games/${gameName}/${file}`);
        
        if (!response.ok) {
          const errorMsg = `No se pudo cargar ${file} para ${gameName}. Estado: ${response.status}`;
          if (isDebugActive()) {
            logDebug(errorMsg, 'WARNING');
          }
          // No lanzamos error, solo registramos advertencia
          continue;
        }
        
        const data = await response.json();
        
        // Extraer el nombre del recurso del archivo (sin .json)
        const resourceName = file.replace('.json', '');
        
        // Guardar en el objeto de datos del juego
        gameData[resourceName] = data[resourceName];
        
        if (isDebugActive()) {
          logDebug(`Archivo ${file} cargado correctamente. Encontrados ${data[resourceName]?.length || 0} elementos`, 'LOADER');
        }
      } catch (error) {
        if (isDebugActive()) {
          logDebug(`Error al cargar ${file}: ${error.message}`, 'ERROR');
        }
        // Continuamos con los siguientes archivos
      }
    }

    // Análisis detallado de la estructura cargada
    if (isDebugActive()) {
      logDebug(`Juego cargado: ${gameData.name}`, 'LOADER');
      logDebug(`Rutas: ${gameData.routes?.length || 0}`, 'LOADER');
      logDebug(`Escenarios: ${gameData.scenarios?.length || 0}`, 'LOADER');
      logDebug(`Diálogos: ${gameData.dialogs?.length || 0}`, 'LOADER');
      logDebug(`Widgets: ${gameData.widgets?.length || 0}`, 'LOADER');
      
      // Listado de rutas disponibles
      if (gameData.routes && gameData.routes.length > 0) {
        const routeIds = gameData.routes.map(route => route.id).join(', ');
        logDebug(`IDs de rutas disponibles: ${routeIds}`, 'LOADER');
      }
      
      // Verificar la ruta de inicio
      const startRoute = gameData.routes?.find(route => route.id === 'start');
      if (startRoute) {
        logDebug(`Ruta de inicio encontrada con ${startRoute.actions?.length || 0} acciones`, 'LOADER');
        if (startRoute.actions && startRoute.actions.length > 0) {
          logDebug(`Acciones de inicio: ${startRoute.actions.join(', ')}`, 'LOADER');
        }
      } else {
        logDebug('¡ADVERTENCIA! No se encontró la ruta de inicio "start"', 'WARNING');
      }
    }

    return gameData;
  } catch (error) {
    if (isDebugActive()) {
      logDebug(`Error fatal en la carga del juego: ${error.message}`, 'ERROR');
      console.error('Error completo:', error);
    }
    throw error;
  }
};

// Mantén el resto de tus funciones existentes
// ...

/**
 * Busca un diálogo por su ID
 * @param {string} id - ID del diálogo a buscar
 * @param {Array} dialogs - Array de diálogos donde buscar
 * @returns {object} - Diálogo encontrado o null
 */
export const findDialogById = (id, dialogs) => {
  if (!dialogs || !Array.isArray(dialogs)) return null;
  
  const dialog = dialogs.find(d => d.id === id);
  
  if (isDebugActive() && dialog) {
    logDebug(`Diálogo encontrado: ${id} (personaje: ${dialog.character || 'ninguno'})`, 'DIALOG');
  } else if (isDebugActive()) {
    logDebug(`Diálogo no encontrado: ${id}`, 'WARNING');
  }
  
  return dialog;
};

/**
 * Busca un widget por su ID
 * @param {string} id - ID del widget a buscar
 * @param {Array} widgets - Array de widgets donde buscar
 * @returns {object} - Widget encontrado o null
 */
export const findWidgetById = (id, widgets) => {
  if (!widgets || !Array.isArray(widgets)) return null;
  
  const widget = widgets.find(w => w.id === id);
  
  if (isDebugActive() && widget) {
    logDebug(`Widget encontrado: ${id} (tipo: ${widget.type || 'desconocido'})`, 'WIDGET');
  } else if (isDebugActive()) {
    logDebug(`Widget no encontrado: ${id}`, 'WARNING');
  }
  
  return widget;
};

/**
 * Busca un escenario por su ID
 * @param {string} id - ID del escenario a buscar
 * @param {Array} scenarios - Array de escenarios donde buscar
 * @returns {object} - Escenario encontrado o null
 */
export const getScenarioById = (id, scenarios) => {
  if (!scenarios || !Array.isArray(scenarios)) return null;
  
  const scenario = scenarios.find(s => s.id === id);
  
  if (isDebugActive() && scenario) {
    logDebug(`Escenario encontrado: ${id} (imagen: ${scenario.image || 'ninguna'})`, 'SCENARIO');
  } else if (isDebugActive()) {
    logDebug(`Escenario no encontrado: ${id}`, 'WARNING');
  }
  
  return scenario;
};