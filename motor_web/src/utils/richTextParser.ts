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
  const tagRegex = /\[(\/?)(bold|italic|dim|red|green|blue|yellow|purple|cyan|white|orange|pink|link=[^\]]*)\]/g;

  let lastIndex = 0;
  let bold = false;
  let italic = false;
  let dim = false;
  let colorStack: string[] = [];

  let match: RegExpExecArray | null;
  while ((match = tagRegex.exec(processed)) !== null) {
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

    const isClosing = match[1] === '/';
    const tag = match[2];

    if (tag === 'bold') {
      bold = !isClosing;
    } else if (tag === 'italic') {
      italic = !isClosing;
    } else if (tag === 'dim') {
      dim = !isClosing;
    } else if (tag.startsWith('link=')) {
      // Links: just treat as colored text
      if (!isClosing) {
        colorStack.push(COLOR_MAP['cyan'] || '#8be9fd');
      } else {
        colorStack.pop();
      }
    } else {
      // Color tag
      if (!isClosing) {
        colorStack.push(COLOR_MAP[tag] || '#ffffff');
      } else {
        colorStack.pop();
      }
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
