export const delay = (ms, speedMultiplier = 1) =>
  new Promise(resolve => setTimeout(resolve, ms / (speedMultiplier || 1)));
