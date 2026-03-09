// styles/themes.ts
// Temas de color - migrados del original

import type { AppTheme } from '../types/theme';

export const draculaTheme: AppTheme = {
  background: '#1a1625',
  text: '#ffffff',
  textSecondary: '#d9baff',
  accent: '#bd93f9',
  accentHover: '#ff79c6',

  terminal: {
    background: '#151320',
    border: '#44475a',
    text: '#ffffff',
    prompt: '#c495ff',
    command: '#ffffa0',
    error: '#ff5555',
    success: '#50fa7b',
    system: '#a5b0e3',
    warning: '#ffb86c',
    info: '#8be9fd',
    accent: '#c495ff',
    accentDim: '#8f78c6',
    dialog: '#ffffff',
    dialogBackground: '#251d35',
    character: '#ff92d0',
    characterBorder: '#ff5caf',
    option: '#c495ff',
    highlight: 'rgba(189, 147, 249, 0.25)',
    tableBorder: '#44475a',
    tableBorderLight: '#383a59',
    tableHeader: '#352a50',
    tableHeaderText: '#ffffff',
    tableRowEven: '#1a1625',
    tableRowOdd: '#211a2e',
  },

  scrollbar: {
    track: '#1a1625',
    thumb: '#44475a',
    hover: '#6272a4',
  },

  button: {
    background: '#44475a',
    text: '#ffffff',
    hoverBackground: '#6272a4',
    activeBackground: '#bd93f9',
  },

  widgets: {
    background: '#251d35',
    border: '#44475a',
  },
};

export const lilacTheme: AppTheme = {
  ...draculaTheme,
  background: '#211134',
  text: '#ffffff',
  textSecondary: '#e0c3ff',
  accent: '#c67dff',
  accentHover: '#d9a3ff',

  terminal: {
    ...draculaTheme.terminal,
    background: '#1a0e29',
    border: '#4a3664',
    prompt: '#c67dff',
    system: '#b3a5cc',
    accent: '#c67dff',
    accentDim: '#9167d8',
    dialogBackground: '#301d47',
    character: '#ff92d0',
    characterBorder: '#ff5caf',
    option: '#c67dff',
    tableBorder: '#4a3664',
    tableBorderLight: '#403054',
    tableHeader: '#3c2760',
    tableHeaderText: '#ffffff',
  },

  scrollbar: {
    track: '#211134',
    thumb: '#4a3664',
    hover: '#7a4eb5',
  },

  button: {
    ...draculaTheme.button,
    background: '#4a3664',
    hoverBackground: '#7a4eb5',
    activeBackground: '#c67dff',
  },

  widgets: {
    background: '#301d47',
    border: '#4a3664',
  },
};

export const darkTheme = lilacTheme;
