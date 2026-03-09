// engine/CommandParser.ts
// Parsea comandos de la terminal - puro TypeScript

export interface ParsedCommand {
  name: string;
  args: string[];
  raw: string;
}

export function parseCommand(input: string): ParsedCommand {
  let raw = input.trim();

  // Eliminar prefijo / si existe
  if (raw.startsWith('/')) {
    raw = raw.substring(1);
  }

  const parts = raw.split(/\s+/);
  const name = (parts[0] || '').toLowerCase();
  const args = parts.slice(1);

  return { name, args, raw };
}
