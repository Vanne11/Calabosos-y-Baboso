// engine/DiceRoller.ts
// Tiradas de dados D20 con modificadores - puro TypeScript

export interface RollResult {
  roll: number;
  modifier: number;
  total: number;
  outcome: 'critical_success' | 'success' | 'failure' | 'critical_failure';
}

export function rollDice(faces: number): number {
  return Math.floor(Math.random() * faces) + 1;
}

export function calculateModifier(statValue: number, divider: number = 10): number {
  // Basado en la mecánica original:
  // Stat > 70: +5, Stat 50-70: 0, Stat < 50: -5
  // Pero usando divider para flexibilidad
  if (divider > 0) {
    return Math.floor(statValue / divider) - 5;
  }
  if (statValue > 70) return 5;
  if (statValue >= 50) return 0;
  return -5;
}

export function resolveRoll(
  faces: number,
  statValue: number,
  difficulty: number,
  divider: number = 10
): RollResult {
  const roll = rollDice(faces);
  const modifier = calculateModifier(statValue, divider);
  const total = roll + modifier;

  let outcome: RollResult['outcome'];

  if (roll === faces) {
    outcome = 'critical_success';
  } else if (roll === 1) {
    outcome = 'critical_failure';
  } else if (total >= difficulty) {
    outcome = 'success';
  } else {
    outcome = 'failure';
  }

  return { roll, modifier, total, outcome };
}
