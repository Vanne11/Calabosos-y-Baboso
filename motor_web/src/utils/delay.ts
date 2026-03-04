// utils/delay.ts

export const delay = (ms: number, speedMultiplier: number = 1): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms / (speedMultiplier || 1)));
