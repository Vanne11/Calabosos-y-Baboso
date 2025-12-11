// engine/gameState.jsx
// Gestiona el estado del juego

// Crea un estado inicial para un nuevo juego
export const createInitialState = (gameData = null) => {
  return {
    // Estadísticas numéricas del jugador
    stats: {
      will_to_live: 50, // Ganas de vivir
      strength: 10,     // Fuerza
      intelligence: 10, // Inteligencia
      perception: 10,   // Percepción
      hunger: 0,        // Hambre
      fear: 0           // Miedo
    },
    
    // Objetos en inventario
    inventory: [],
    
    // Banderas (flags) booleanas para tracking de eventos
    flags: {
      first_night: false,
      door_discovered: false
    },
    
    // Estado del ciclo temporal
    time: {
      currentPhase: gameData?.time?.cycle?.initial || "morning",
      actionsRemaining: gameData?.time?.cycle?.duration || 5,
      completedCycles: 0
    },
    
    // Historial de rutas visitadas
    visitedRoutes: [],
    
    // Diálogos ya vistos
    seenDialogs: [],
    
    // Ruta actual
    currentRoute: "",
    
    // Estado de personajes
    characters: {},
    
    // Metadata del juego actual
    game: {
      name: gameData?.name || "",
      version: "1.0.0",
      author: "Narrador Malévolo"
    }
  };
};

// Actualiza una estadística del jugador
export const updateStat = (state, statName, value) => {
  const newValue = (state.stats[statName] || 0) + value;
  return {
    ...state,
    stats: {
      ...state.stats,
      [statName]: newValue
    }
  };
};

// Cambia el valor de una bandera (flag)
export const setFlag = (state, flagName, value) => {
  return {
    ...state,
    flags: {
      ...state.flags,
      [flagName]: value
    }
  };
};

// Añade un objeto al inventario
export const addToInventory = (state, item) => {
  if (state.inventory.includes(item)) {
    return state; // El ítem ya está en el inventario
  }
  
  return {
    ...state,
    inventory: [...state.inventory, item]
  };
};

// Elimina un objeto del inventario
export const removeFromInventory = (state, item) => {
  return {
    ...state,
    inventory: state.inventory.filter(i => i !== item)
  };
};

// Registra una ruta como visitada
export const markRouteAsVisited = (state, routeId) => {
  if (state.visitedRoutes.includes(routeId)) {
    return state; // La ruta ya fue visitada
  }
  
  return {
    ...state,
    visitedRoutes: [...state.visitedRoutes, routeId],
    currentRoute: routeId
  };
};

// Registra un diálogo como visto
export const markDialogAsSeen = (state, dialogId) => {
  if (state.seenDialogs.includes(dialogId)) {
    return state; // El diálogo ya fue visto
  }
  
  return {
    ...state,
    seenDialogs: [...state.seenDialogs, dialogId]
  };
};

// Actualiza el estado de un personaje
export const updateCharacter = (state, characterId, updates) => {
  return {
    ...state,
    characters: {
      ...state.characters,
      [characterId]: {
        ...(state.characters[characterId] || {}),
        ...updates
      }
    }
  };
};

// Avanza el tiempo en el juego
export const advanceTime = (state, gameData) => {
  const timeConfig = gameData.time.cycle;
  const phases = timeConfig.phases || ["morning", "afternoon", "night"];
  let newState = { ...state };
  
  // Reducir acciones restantes
  let actionsRemaining = state.time.actionsRemaining - 1;
  let currentPhase = state.time.currentPhase;
  let completedCycles = state.time.completedCycles;
  
  // Si las acciones restantes llegan a 0, avanzar a la siguiente fase
  if (actionsRemaining <= 0) {
    const currentPhaseIndex = phases.indexOf(currentPhase);
    let nextPhaseIndex = (currentPhaseIndex + 1) % phases.length;
    
    // Si volvemos al inicio, incrementar los ciclos completados
    if (nextPhaseIndex === 0) {
      completedCycles++;
    }
    
    currentPhase = phases[nextPhaseIndex];
    actionsRemaining = timeConfig.duration || 5;
  }
  
  // Actualizar el estado del tiempo
  newState = {
    ...newState,
    time: {
      currentPhase,
      actionsRemaining,
      completedCycles
    }
  };
  
  // Procesar eventos de tiempo si existen
  if (gameData.time.events && gameData.time.events.length > 0) {
    for (const event of gameData.time.events) {
      // Procesar eventos según su tipo y condiciones
      // (Esto sería para una implementación completa)
    }
  }
  
  return newState;
};

// Aplica modificadores al estado del juego
export const applyModifiers = (state, modifiers) => {
  let newState = { ...state };
  
  // Aplicar modificaciones de estadísticas
  if (modifiers.stats) {
    for (const [stat, value] of Object.entries(modifiers.stats)) {
      newState = updateStat(newState, stat, value);
    }
  }
  
  // Aplicar modificaciones de banderas
  if (modifiers.flags) {
    for (const [flag, value] of Object.entries(modifiers.flags)) {
      newState = setFlag(newState, flag, value);
    }
  }
  
  // Aplicar modificaciones al inventario
  if (modifiers.inventory) {
    if (modifiers.inventory.add) {
      for (const item of modifiers.inventory.add) {
        newState = addToInventory(newState, item);
      }
    }
    
    if (modifiers.inventory.remove) {
      for (const item of modifiers.inventory.remove) {
        newState = removeFromInventory(newState, item);
      }
    }
  }
  
  // Aplicar modificaciones a personajes
  if (modifiers.characters) {
    for (const [characterId, updates] of Object.entries(modifiers.characters)) {
      newState = updateCharacter(newState, characterId, updates);
    }
  }
  
  return newState;
};