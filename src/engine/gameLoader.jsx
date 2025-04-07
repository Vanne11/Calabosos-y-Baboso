// engine/gameLoader.jsx
// Carga juegos desde archivos JSON o ZIP

import JSZip from 'jszip';

// Función para cargar un juego desde archivos locales (carpeta data/games)
export const loadLocalGame = async (gameName) => {
  try {
    // Cargar archivos JSON desde la carpeta del juego
    const routesData = await fetch(`/src/data/games/${gameName}/routes.json`);
    const scenariosData = await fetch(`/src/data/games/${gameName}/scenarios.json`);
    const dialogsData = await fetch(`/src/data/games/${gameName}/dialogs.json`);
    const widgetsData = await fetch(`/src/data/games/${gameName}/widgets.json`);
    const conditionsData = await fetch(`/src/data/games/${gameName}/conditions.json`);
    const timeData = await fetch(`/src/data/games/${gameName}/time.json`);
    const charactersData = await fetch(`/src/data/games/${gameName}/characters.json`);

    // Convertir la respuesta a JSON
    const routes = await routesData.json();
    const scenarios = await scenariosData.json();
    const dialogs = await dialogsData.json();
    const widgets = await widgetsData.json();
    const conditions = await conditionsData.json();
    const time = await timeData.json();
    const characters = await charactersData.json();

    // Validar que los archivos tengan la estructura correcta
    validateGameData({ routes, scenarios, dialogs, widgets, conditions, time, characters });

    // Devolver los datos del juego como un objeto unificado
    return {
      name: gameName,
      routes: routes.routes || [],
      scenarios: scenarios.scenarios || [],
      dialogs: dialogs.dialogs || [],
      widgets: widgets.widgets || [],
      conditions: conditions.conditions || [],
      time: time || {},
      characters: characters.characters || []
    };
  } catch (error) {
    console.error('Error cargando juego local:', error);
    throw new Error(`No se pudo cargar el juego "${gameName}". ${error.message}`);
  }
};

// Función para cargar un juego desde un archivo ZIP
export const loadGameFromZip = async (zipFile) => {
  try {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipFile);
    
    // Extraer los archivos JSON del ZIP
    const routesFile = zipContent.file('routes.json');
    const scenariosFile = zipContent.file('scenarios.json');
    const dialogsFile = zipContent.file('dialogs.json');
    const widgetsFile = zipContent.file('widgets.json');
    const conditionsFile = zipContent.file('conditions.json');
    const timeFile = zipContent.file('time.json');
    const charactersFile = zipContent.file('characters.json');
    
    // Verificar que todos los archivos necesarios existan
    if (!routesFile || !scenariosFile || !dialogsFile || !widgetsFile) {
      throw new Error('El archivo ZIP no contiene todos los archivos necesarios');
    }
    
    // Leer y parsear los archivos JSON
    const routes = JSON.parse(await routesFile.async('string'));
    const scenarios = JSON.parse(await scenariosFile.async('string'));
    const dialogs = JSON.parse(await dialogsFile.async('string'));
    const widgets = JSON.parse(await widgetsFile.async('string'));
    const conditions = conditionsFile ? JSON.parse(await conditionsFile.async('string')) : { conditions: [] };
    const time = timeFile ? JSON.parse(await timeFile.async('string')) : {};
    const characters = charactersFile ? JSON.parse(await charactersFile.async('string')) : { characters: [] };
    
    // Validar los datos
    validateGameData({ routes, scenarios, dialogs, widgets, conditions, time, characters });
    
    // Extraer las imágenes y guardarlas temporalmente si es necesario
    // (Esto sería para una implementación completa)
    
    // Devolver los datos del juego
    return {
      name: zipFile.name.replace('.zip', ''),
      routes: routes.routes || [],
      scenarios: scenarios.scenarios || [],
      dialogs: dialogs.dialogs || [],
      widgets: widgets.widgets || [],
      conditions: conditions.conditions || [],
      time: time || {},
      characters: characters.characters || []
    };
  } catch (error) {
    console.error('Error cargando juego desde ZIP:', error);
    throw new Error(`No se pudo cargar el archivo ZIP. ${error.message}`);
  }
};

// Función para validar la estructura de los datos del juego
const validateGameData = (gameData) => {
  // Validación básica para asegurarse de que las estructuras principales existen
  if (!gameData.routes || !Array.isArray(gameData.routes.routes)) {
    throw new Error('El archivo routes.json tiene un formato inválido');
  }
  
  if (!gameData.scenarios || !Array.isArray(gameData.scenarios.scenarios)) {
    throw new Error('El archivo scenarios.json tiene un formato inválido');
  }
  
  if (!gameData.dialogs || !Array.isArray(gameData.dialogs.dialogs)) {
    throw new Error('El archivo dialogs.json tiene un formato inválido');
  }
  
  if (!gameData.widgets || !Array.isArray(gameData.widgets.widgets)) {
    throw new Error('El archivo widgets.json tiene un formato inválido');
  }
  
  // Validaciones adicionales podrían agregarse aquí
  
  return true;
};

// Función para buscar una ruta por su ID
export const findRouteById = (routeId, routes) => {
  return routes.find(route => route.id === routeId) || null;
};

// Función para buscar un escenario por su ID
export const findScenarioById = (scenarioId, scenarios) => {
  return scenarios.find(scenario => scenario.id === scenarioId) || null;
};

// Función para buscar un diálogo por su ID
export const findDialogById = (dialogId, dialogs) => {
  return dialogs.find(dialog => dialog.id === dialogId) || null;
};

// Función para buscar un widget por su ID
export const findWidgetById = (widgetId, widgets) => {
  return widgets.find(widget => widget.id === widgetId) || null;
};

// Función para buscar una condición por su ID
export const findConditionById = (conditionId, conditions) => {
  return conditions.find(condition => condition.id === conditionId) || null;
};