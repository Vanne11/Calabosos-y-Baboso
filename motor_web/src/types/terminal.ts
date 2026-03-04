// types/terminal.ts
// Tipos para la terminal

export type TerminalEntryType =
  | 'system'
  | 'command'
  | 'response'
  | 'dialog'
  | 'dialogHeader'
  | 'option'
  | 'error'
  | 'warning'
  | 'info'
  | 'success'
  | 'table';

export interface TerminalEntry {
  type: TerminalEntryType;
  content: string;
}

export interface TerminalCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<string | null> | string | null;
}
