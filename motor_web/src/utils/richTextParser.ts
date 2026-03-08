// utils/richTextParser.ts
// Parsea texto con formato Rich [bold], [color], etc. a spans HTML

export interface RichSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  dim?: boolean;
  color?: string;
}

const COLOR_MAP: Record<string, string> = {
  red: '#ff5555',
  green: '#50fa7b',
  blue: '#8be9fd',
  yellow: '#f1fa8c',
  purple: '#bd93f9',
  cyan: '#8be9fd',
  white: '#ffffff',
  orange: '#ffb86c',
  pink: '#ff79c6',
};

const EMOJI_MAP: Record<string, string> = {
  ':snail:': '\ud83d\udc0c',
  ':castle:': '\ud83c\udff0',
  ':sword:': '\u2694\ufe0f',
  ':shield:': '\ud83d\udee1\ufe0f',
  ':skull:': '\ud83d\udc80',
  ':star:': '\u2b50',
  ':fire:': '\ud83d\udd25',
  ':gem:': '\ud83d\udc8e',
  ':key:': '\ud83d\udd11',
  ':potion:': '\ud83e\uddea',
};

export function parseRichText(text: string): RichSegment[] {
  // Replace emoji shortcuts first
  let processed = text;
  for (const [code, emoji] of Object.entries(EMOJI_MAP)) {
    processed = processed.replaceAll(code, emoji);
  }

  const segments: RichSegment[] = [];

  let lastIndex = 0;
  let bold = false;
  let italic = false;
  let dim = false;
  let colorStack: string[] = [];

  // Helper to apply a single tag token
  function applyTag(token: string, isClosing: boolean) {
    if (token === 'bold') {
      bold = !isClosing;
    } else if (token === 'italic') {
      italic = !isClosing;
    } else if (token === 'dim') {
      dim = !isClosing;
    } else if (token.startsWith('link=')) {
      if (!isClosing) {
        colorStack.push(COLOR_MAP['cyan'] || '#8be9fd');
      } else {
        colorStack.pop();
      }
    } else if (COLOR_MAP[token]) {
      if (!isClosing) {
        colorStack.push(COLOR_MAP[token]);
      } else {
        colorStack.pop();
      }
    }
  }

  // Simpler approach: match any [...] tag and parse its contents
  const simpleTagRegex = /\[(\/?)([\w\s=]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = simpleTagRegex.exec(processed)) !== null) {
    const fullContent = match[2].trim();
    const isClosing = match[1] === '/';

    // Split the tag content into tokens and check if all are valid
    const tokens = fullContent.split(/\s+/);
    const validTokens = ['bold', 'italic', 'dim', ...Object.keys(COLOR_MAP)];
    const allValid = tokens.every(t => validTokens.includes(t) || t.startsWith('link='));

    if (!allValid) continue; // Skip unknown tags, leave them as literal text

    // Add text before this tag
    if (match.index > lastIndex) {
      const segText = processed.slice(lastIndex, match.index);
      if (segText) {
        segments.push({
          text: segText,
          bold,
          italic,
          dim,
          color: colorStack[colorStack.length - 1],
        });
      }
    }

    // Apply all tokens in the compound tag
    for (const token of tokens) {
      applyTag(token, isClosing);
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < processed.length) {
    segments.push({
      text: processed.slice(lastIndex),
      bold,
      italic,
      dim,
      color: colorStack[colorStack.length - 1],
    });
  }

  // If no segments, return the whole text
  if (segments.length === 0) {
    segments.push({ text: processed });
  }

  return segments;
}
