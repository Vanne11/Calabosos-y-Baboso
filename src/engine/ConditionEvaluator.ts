// engine/ConditionEvaluator.ts
// Evaluador de condiciones - puro TypeScript, sin React

import type { StepCondition } from '../types/game';
import type { PlayerState } from '../types/engine';

export function evaluateCondition(
  condition: StepCondition | undefined,
  state: PlayerState
): boolean {
  if (!condition) return true;

  // Stats comparisons: { "perception": ">=50" }
  if (condition.stats) {
    for (const [key, expr] of Object.entries(condition.stats)) {
      const val = typeof state.stats[key] === 'number' ? (state.stats[key] as number) : 0;
      if (!evaluateComparison(val, String(expr))) return false;
    }
  }

  // Flags: { "intro_done": true }
  if (condition.flags) {
    for (const [key, expected] of Object.entries(condition.flags)) {
      if (Boolean(state.flags[key]) !== expected) return false;
    }
  }

  // Inventory: ["sword", "key"]
  if (condition.inventory) {
    for (const item of condition.inventory) {
      if (!state.inventory.includes(item)) return false;
    }
  }

  // Visited scenes
  if (condition.visitedScenes) {
    for (const scene of condition.visitedScenes) {
      if (!state.visitedScenes.includes(scene)) return false;
    }
  }

  // Unvisited scenes
  if (condition.unvisitedScenes) {
    for (const scene of condition.unvisitedScenes) {
      if (state.visitedScenes.includes(scene)) return false;
    }
  }

  // Skill levels: { "fireball": ">=2" }
  if (condition.skillLevel) {
    for (const [skillId, expr] of Object.entries(condition.skillLevel)) {
      // Search all characters for the skill
      let skillLevel = 0;
      for (const charState of Object.values(state.characters || {})) {
        if (charState.skills[skillId]) {
          skillLevel = Math.max(skillLevel, charState.skills[skillId]);
        }
      }
      if (!evaluateComparison(skillLevel, String(expr))) return false;
    }
  }

  // Affinity: { "nerly": ">=50" }
  if (condition.affinity) {
    for (const [charId, expr] of Object.entries(condition.affinity)) {
      const aff = state.relationships?.[charId]?.affinity ?? 0;
      if (!evaluateComparison(aff, String(expr))) return false;
    }
  }

  // Has traits
  if (condition.hasTraits) {
    for (const traitId of condition.hasTraits) {
      if (!state.activeTraits?.includes(traitId)) return false;
    }
  }

  // Not traits
  if (condition.notTraits) {
    for (const traitId of condition.notTraits) {
      if (state.activeTraits?.includes(traitId)) return false;
    }
  }

  // Character level: { "_protagonist": ">=3" }
  if (condition.characterLevel) {
    for (const [charId, expr] of Object.entries(condition.characterLevel)) {
      const level = state.characters?.[charId]?.level ?? 1;
      if (!evaluateComparison(level, String(expr))) return false;
    }
  }

  // Relationship tier: { "nerly": "friendly" }
  if (condition.relationshipTier) {
    const tierOrder = ['hostile', 'distrustful', 'neutral', 'friendly', 'allied', 'loyal'];
    for (const [charId, requiredTier] of Object.entries(condition.relationshipTier)) {
      const aff = state.relationships?.[charId]?.affinity ?? 0;
      const currentTier = getRelationshipTier(aff);
      if (tierOrder.indexOf(currentTier) < tierOrder.indexOf(requiredTier)) return false;
    }
  }

  return true;
}

function getRelationshipTier(affinity: number): string {
  if (affinity >= 80) return 'loyal';
  if (affinity >= 50) return 'allied';
  if (affinity >= 20) return 'friendly';
  if (affinity >= -10) return 'neutral';
  if (affinity >= -30) return 'distrustful';
  return 'hostile';
}

function evaluateComparison(value: number, expr: string): boolean {
  const match = expr.match(/^(>=|<=|>|<|==|!=)?\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return false;

  const operator = match[1] || '>=';
  const target = parseFloat(match[2]);

  switch (operator) {
    case '>=': return value >= target;
    case '<=': return value <= target;
    case '>': return value > target;
    case '<': return value < target;
    case '==': return value === target;
    case '!=': return value !== target;
    default: return false;
  }
}
