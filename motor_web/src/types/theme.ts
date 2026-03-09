// types/theme.ts

export interface TerminalColors {
  background: string;
  border: string;
  text: string;
  prompt: string;
  command: string;
  error: string;
  success: string;
  system: string;
  warning: string;
  info: string;
  accent: string;
  accentDim: string;
  dialog: string;
  dialogBackground: string;
  character: string;
  characterBorder: string;
  option: string;
  highlight: string;
  tableBorder: string;
  tableBorderLight: string;
  tableHeader: string;
  tableHeaderText: string;
  tableRowEven: string;
  tableRowOdd: string;
}

export interface AppTheme {
  background: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentHover: string;
  terminal: TerminalColors;
  scrollbar: {
    track: string;
    thumb: string;
    hover: string;
  };
  button: {
    background: string;
    text: string;
    hoverBackground: string;
    activeBackground: string;
  };
  widgets: {
    background: string;
    border: string;
  };
}
