import { useState } from 'react';
import { createInitialState } from '../engine/gameState';

// Hook para acceder y manipular el estado del juego
export const useGameState = () => {
  const [state, setState] = useState(createInitialState());

  // Actualizar una estadística
  const updateStat = (statName, value) => {
    setState(prev => ({
      ...prev,
      stats: {
        ...prev.stats,
        [statName]: (prev.stats[statName] || 0) + value
      }
    }));
  };

  // Cambiar una bandera (flag)
  const toggleFlag = (flagName, value = null) => {
    setState(prev => ({
      ...prev,
      flags: {
        ...prev.flags,
        [flagName]: value !== null ? value : !prev.flags[flagName]
      }
    }));
  };

  // Añadir un objeto al inventario
  const addInventoryItem = (item) => {
    setState(prev => ({
      ...prev,
      inventory: [...prev.inventory, item]
    }));
  };

  // Eliminar un objeto del inventario
  const removeInventoryItem = (item) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i !== item)
    }));
  };

  // Actualizar el estado de un personaje
  const updateCharacter = (characterId, updates) => {
    setState(prev => ({
      ...prev,
      characters: {
        ...prev.characters,
        [characterId]: {
          ...(prev.characters[characterId] || {}),
          ...updates
        }
      }
    }));
  };

  return {
    state,
    updateStat,
    toggleFlag,
    addInventoryItem,
    removeInventoryItem,
    updateCharacter,
    setState
  };
};
