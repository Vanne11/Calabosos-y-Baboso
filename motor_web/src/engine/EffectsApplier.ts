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

  // XP: { "protagonist": 50 }
  if (effects.xp) {
    const chars = { ...newState.characters };
    for (const [charId, amount] of Object.entries(effects.xp)) {
      if (!chars[charId]) {
        chars[charId] = { level: 1, xp: 0, skillPoints: 0, skills: {}, traits: [], stats: {} };
      }
      chars[charId] = { ...chars[charId], xp: chars[charId].xp + amount };
    }
    newState.characters = chars;
  }

  // Affinity: { "nerly": 10 }
  if (effects.affinity) {
    const rels = { ...newState.relationships };
    for (const [charId, delta] of Object.entries(effects.affinity)) {
      if (!rels[charId]) {
        rels[charId] = { affinity: 0 };
      }
      rels[charId] = {
        ...rels[charId],
        affinity: Math.max(-100, Math.min(100, rels[charId].affinity + delta)),
      };
    }
    newState.relationships = rels;
  }

  // Add traits
  if (effects.addTraits) {
    const current = [...(newState.activeTraits || [])];
    for (const trait of effects.addTraits) {
      if (!current.includes(trait)) current.push(trait);
    }
    newState.activeTraits = current;
  }

  // Remove traits
  if (effects.removeTraits) {
    newState.activeTraits = (newState.activeTraits || []).filter(
      t => !effects.removeTraits!.includes(t)
    );
  }

  // Learn skill: { "fireball": 1 }
  if (effects.learnSkill) {
    const chars = { ...newState.characters };
    // Apply to protagonist by default (first character or _protagonist)
    const targetId = Object.keys(chars)[0] || '_protagonist';
    if (!chars[targetId]) {
      chars[targetId] = { level: 1, xp: 0, skillPoints: 0, skills: {}, traits: [], stats: {} };
    }
    const charState = { ...chars[targetId], skills: { ...chars[targetId].skills } };
    for (const [skillId, levels] of Object.entries(effects.learnSkill)) {
      charState.skills[skillId] = (charState.skills[skillId] || 0) + levels;
    }
    chars[targetId] = charState;
    newState.characters = chars;
  }

  // Give skill points
  if (effects.giveSkillPoints) {
    const chars = { ...newState.characters };
    for (const [charId, points] of Object.entries(effects.giveSkillPoints)) {
      if (!chars[charId]) {
        chars[charId] = { level: 1, xp: 0, skillPoints: 0, skills: {}, traits: [], stats: {} };
      }
      chars[charId] = { ...chars[charId], skillPoints: chars[charId].skillPoints + points };
    }
    newState.characters = chars;
  }

  return newState;
}
