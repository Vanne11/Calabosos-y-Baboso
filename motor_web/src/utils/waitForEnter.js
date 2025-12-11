// utils/waitForEnter.js
export const waitForEnter = (setShowEnterPrompt) => new Promise((resolve) => {
  const handler = (e) => {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', handler);
      setShowEnterPrompt(false);
      resolve();
    }
  };
  window.addEventListener('keydown', handler);
});
