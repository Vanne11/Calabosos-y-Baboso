import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * GameEngine Component
 * 
 * Motor principal que:
 * - Gestiona el estado del juego (inventario, estadísticas, rutas visitadas)
 * - Carga/guarda progreso
 * - Procesa lógica de tiradas de dados
 * - Maneja transiciones entre escenas
 * - Controla efectos y temporizadores
 */
const GameEngine = ({
  initialGameState,
  rutasData,
  historiaData,
  ciudadData,
  combateData,
  introduccionData,
  rellenoData,
  onStateChange,
  children
}) => {
  // Estado principal del juego
  const [gameState, setGameState] = useState(initialGameState || {
    stats: {
      "Ganas de vivir": 100,
      "Hambre intensa": 0,
      "Pipí acumulado": 0,
      "Miedo": 0,
      "Reputación": 50
    },
    inventario: [],
    rutasVisitadas: [],
    habilidades: [],
    rutaActual: "plaza_principal",
    efectosTemporales: []
  });
  
  // Estado para el diálogo actual
  const [currentDialog, setCurrentDialog] = useState(null);
  // Estado para la ruta actual
  const [currentRoute, setCurrentRoute] = useState(null);
  // Estado para la tirada actual
  const [currentRoll, setCurrentRoll] = useState(null);
  // Estado para controlar si el juego está cargando
  const [loading, setLoading] = useState(true);
  
  // Referencias para temporizadores
  const timersRef = useRef([]);
  
  // Efecto para inicializar el juego
  useEffect(() => {
    initGame();
    
    // Limpieza de temporizadores al desmontar
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);
  
  // Efecto para notificar cambios en el estado del juego
  useEffect(() => {
    if (onStateChange) {
      onStateChange(gameState);
    }
  }, [gameState, onStateChange]);
  
  // Efecto para cargar la ruta actual
  useEffect(() => {
    if (gameState.rutaActual && rutasData) {
      loadRoute(gameState.rutaActual);
    }
  }, [gameState.rutaActual, rutasData]);
  
  // Inicializar el juego
  const initGame = () => {
    // Intentar cargar juego guardado
    const savedGame = localStorage.getItem('calabozos_y_babosos_save');
    
    if (savedGame) {
      try {
        const parsedSave = JSON.parse(savedGame);
        setGameState(parsedSave);
      } catch (error) {
        console.error('Error al cargar partida guardada:', error);
        // Si hay error, usar estado inicial
      }
    }
    
    setLoading(false);
  };
  
  // Guardar el estado del juego
  const saveGame = () => {
    try {
      localStorage.setItem('calabozos_y_babosos_save', JSON.stringify(gameState));
      return true;
    } catch (error) {
      console.error('Error al guardar partida:', error);
      return false;
    }
  };
  
  // Cargar una ruta específica
  const loadRoute = (routeId) => {
    if (!rutasData || !rutasData.rutas) return;
    
    const route = rutasData.rutas.find(r => r.id === routeId);
    
    if (!route) {
      console.error(`Ruta no encontrada: ${routeId}`);
      return;
    }
    
    setCurrentRoute(route);
    
    // Marcar como visitada si es la primera vez
    if (!gameState.rutasVisitadas.includes(routeId)) {
      updateGameState({
        rutasVisitadas: [...gameState.rutasVisitadas, routeId]
      });
    }
    
    // Cargar diálogo asociado a la ruta
    loadDialog(route.dialogo_tipo, route.dialogo_id);
  };
  
  // Cargar un diálogo específico
  const loadDialog = (dialogType, dialogId) => {
    if (!dialogId) return;
    
    let dialogData;
    
    // Determinar la fuente del diálogo
    switch (dialogType) {
      case 'historia':
        dialogData = historiaData;
        break;
      case 'introduccion':
        dialogData = introduccionData;
        break;
      default:
        dialogData = historiaData;
    }
    
    if (!dialogData || !dialogData.dialogos) {
      console.error(`Datos de diálogo no encontrados: ${dialogType}`);
      return;
    }
    
    const dialog = dialogData.dialogos.find(d => d.id === dialogId);
    
    if (!dialog) {
      console.error(`Diálogo no encontrado: ${dialogId}`);
      return;
    }
    
    setCurrentDialog(dialog);
  };
  
  // Actualizar el estado del juego
  const updateGameState = (newState) => {
    setGameState(prevState => ({
      ...prevState,
      ...newState,
      // Para propiedades anidadas como stats
      stats: {
        ...prevState.stats,
        ...(newState.stats || {})
      }
    }));
  };
  
  // Cambiar a una nueva ruta
  const changeRoute = (routeId) => {
    updateGameState({ rutaActual: routeId });
  };
  
  // Realizar una tirada de dados
  const rollDice = (sides = 20) => {
    return Math.floor(Math.random() * sides) + 1;
  };
  
  // Procesar una tirada específica
  const processDiceRoll = (rollId, bonusValue = 0) => {
    // Buscar la tirada en los datos
    let rollData;
    
    if (ciudadData && ciudadData.tiradas) {
      rollData = ciudadData.tiradas.find(t => t.id === rollId);
    }
    
    if (!rollData && combateData && combateData.tiradas) {
      rollData = combateData.tiradas.find(t => t.id === rollId);
    }
    
    if (!rollData) {
      console.error(`Tirada no encontrada: ${rollId}`);
      return null;
    }
    
    // Realizar la tirada
    const diceResult = rollDice(20);
    const statBonus = gameState.stats[rollData.stat_principal] ? 
      Math.floor(gameState.stats[rollData.stat_principal] / 10) : 0;
    
    const totalResult = diceResult + statBonus + bonusValue;
    const success = totalResult >= rollData.dificultad;
    
    // Determinar el rango de resultado
    let resultKey = '1'; // Resultado por defecto (peor)
    
    for (const key in rollData.resultados) {
      const rangeStr = key.split('-');
      
      if (rangeStr.length === 1) {
        // Valor único
        if (totalResult === parseInt(rangeStr[0])) {
          resultKey = key;
          break;
        }
      } else if (rangeStr.length === 2) {
        // Rango
        const min = parseInt(rangeStr[0]);
        const max = parseInt(rangeStr[1]);
        
        if (totalResult >= min && totalResult <= max) {
          resultKey = key;
          break;
        }
      }
    }
    
    // Obtener el resultado
    const result = rollData.resultados[resultKey];
    
    if (!result) {
      console.error(`Resultado no encontrado para tirada ${rollId} con valor ${totalResult}`);
      return null;
    }
    
    // Aplicar efectos del resultado
    if (result.efectos_stats) {
      const newStats = { ...gameState.stats };
      
      for (const stat in result.efectos_stats) {
        if (newStats[stat] !== undefined) {
          newStats[stat] += result.efectos_stats[stat];
          // Asegurar que los stats estén en rangos válidos
          newStats[stat] = Math.max(0, Math.min(100, newStats[stat]));
        }
      }
      
      updateGameState({ stats: newStats });
    }
    
    // Añadir objetos al inventario
    if (result.objetos_ganados && result.objetos_ganados.length > 0) {
      updateGameState({
        inventario: [...gameState.inventario, ...result.objetos_ganados]
      });
    }
    
    // Cambiar de ruta si es necesario
    if (result.siguiente_ruta) {
      // Programar el cambio de ruta después de mostrar el resultado
      const timerId = setTimeout(() => {
        changeRoute(result.siguiente_ruta);
      }, 2000);
      
      timersRef.current.push(timerId);
    }
    
    // Guardar la tirada actual para mostrarla
    setCurrentRoll({
      rollData,
      diceResult,
      statBonus,
      totalResult,
      success,
      result
    });
    
    return {
      rollData,
      diceResult,
      statBonus,
      totalResult,
      success,
      result
    };
  };
  
  // Manejar la selección de opciones de diálogo
  const handleDialogOption = (option) => {
    if (option.siguiente_ruta) {
      changeRoute(option.siguiente_ruta);
    } else if (option.siguiente_dialogo) {
      loadDialog(currentRoute.dialogo_tipo, option.siguiente_dialogo);
    } else if (option.tirada) {
      processDiceRoll(option.tirada);
    }
  };
  
  // Añadir un objeto al inventario
  const addToInventory = (item) => {
    updateGameState({
      inventario: [...gameState.inventario, item]
    });
  };
  
  // Remover un objeto del inventario
  const removeFromInventory = (item) => {
    updateGameState({
      inventario: gameState.inventario.filter(i => i !== item)
    });
  };
  
  // Actualizar un stat específico
  const updateStat = (statName, value) => {
    if (gameState.stats[statName] === undefined) return;
    
    const newValue = Math.max(0, Math.min(100, gameState.stats[statName] + value));
    
    updateGameState({
      stats: {
        ...gameState.stats,
        [statName]: newValue
      }
    });
  };
  
  // Añadir una habilidad
  const addSkill = (skill) => {
    if (gameState.habilidades.includes(skill)) return;
    
    updateGameState({
      habilidades: [...gameState.habilidades, skill]
    });
  };
  
  // Añadir un efecto temporal
  const addTemporaryEffect = (effect, duration) => {
    const newEffect = {
      ...effect,
      id: Date.now(),
      expiresAt: Date.now() + duration
    };
    
    updateGameState({
      efectosTemporales: [...gameState.efectosTemporales, newEffect]
    });
    
    // Programar la eliminación del efecto
    const timerId = setTimeout(() => {
      removeTemporaryEffect(newEffect.id);
    }, duration);
    
    timersRef.current.push(timerId);
  };
  
  // Remover un efecto temporal
  const removeTemporaryEffect = (effectId) => {
    updateGameState({
      efectosTemporales: gameState.efectosTemporales.filter(e => e.id !== effectId)
    });
  };
  
  // Verificar si el jugador tiene un objeto
  const hasItem = (itemId) => {
    return gameState.inventario.includes(itemId);
  };
  
  // Verificar si el jugador ha visitado una ruta
  const hasVisitedRoute = (routeId) => {
    return gameState.rutasVisitadas.includes(routeId);
  };
  
  // Verificar si el jugador tiene una habilidad
  const hasSkill = (skillId) => {
    return gameState.habilidades.includes(skillId);
  };
  
  // Crear un objeto con todas las funciones del motor de juego
  const gameEngine = {
    gameState,
    currentDialog,
    currentRoute,
    currentRoll,
    loading,
    saveGame,
    loadRoute,
    loadDialog,
    changeRoute,
    rollDice,
    processDiceRoll,
    handleDialogOption,
    addToInventory,
    removeFromInventory,
    updateStat,
    addSkill,
    addTemporaryEffect,
    removeTemporaryEffect,
    hasItem,
    hasVisitedRoute,
    hasSkill
  };
  
  // Renderizar los hijos con el contexto del motor de juego
  return React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { gameEngine });
    }
    return child;
  });
};

GameEngine.propTypes = {
  initialGameState: PropTypes.object,
  rutasData: PropTypes.object,
  historiaData: PropTypes.object,
  ciudadData: PropTypes.object,
  combateData: PropTypes.object,
  introduccionData: PropTypes.object,
  rellenoData: PropTypes.object,
  onStateChange: PropTypes.func,
  children: PropTypes.node
};

export default GameEngine;
