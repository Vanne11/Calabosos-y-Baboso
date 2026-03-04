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

  return true;
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
