// engine/EffectsApplier.ts
// Aplica efectos al estado del jugador - puro TypeScript

import type { Effects } from '../types/game';
import type { PlayerState } from '../types/engine';

export function applyEffects(state: PlayerState, effects: Effects): PlayerState {
  const newState = { ...state };

  if (effects.stats) {
    const newStats = { ...newState.stats };
    for (const [key, value] of Object.entries(effects.stats)) {
      if (typeof value === 'number') {
        const current = typeof newStats[key] === 'number' ? (newStats[key] as number) : 0;
        newStats[key] = current + value;
      } else {
        // String values are set directly (e.g. genero: "masculino")
        newStats[key] = value;
      }
    }
    newState.stats = newStats;
  }

  // setStats: asigna valores absolutos (no suma)
  if (effects.setStats) {
    const newStats = { ...newState.stats };
    for (const [key, value] of Object.entries(effects.setStats)) {
      newStats[key] = value;
    }
    newState.stats = newStats;
  }

  if (effects.flags) {
    newState.flags = { ...newState.flags, ...effects.flags };
  }

  if (effects.inventory) {
    newState.inventory = [...newState.inventory, ...effects.inventory];
  }

  if (effects.clearInventory) {
    newState.inventory = [];
  }

  if (effects.removeInventory) {
    newState.inventory = newState.inventory.filter(
      item => !effects.removeInventory!.includes(item)
    );
  }

  return newState;
}
