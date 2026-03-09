// components/terminal/RichText.tsx
// Renderiza texto con formato Rich [bold], [color], etc.

import React from 'react';
import { parseRichText } from '../../utils/richTextParser';

interface RichTextProps {
  text: string;
}

const RichText: React.FC<RichTextProps> = ({ text }) => {
  const segments = parseRichText(text);

  return (
    <>
      {segments.map((seg, i) => {
        const style: React.CSSProperties = {};
        if (seg.bold) style.fontWeight = 'bold';
        if (seg.italic) style.fontStyle = 'italic';
        if (seg.dim) style.opacity = 0.6;
        if (seg.color) style.color = seg.color;

        return Object.keys(style).length > 0 ? (
          <span key={i} style={style}>
            {seg.text}
          </span>
        ) : (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        );
      })}
    </>
  );
};

export default RichText;
