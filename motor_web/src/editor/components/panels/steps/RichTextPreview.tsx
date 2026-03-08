// editor/components/panels/steps/RichTextPreview.tsx
// Renderiza texto con formato Rich [bold][cyan] etc.

import React from 'react';
import styled from 'styled-components';
import { parseRichText } from '../../../../utils/richTextParser';

interface RichTextPreviewProps {
  text: string;
}

const RichTextPreview: React.FC<RichTextPreviewProps> = ({ text }) => {
  const segments = parseRichText(text);

  return (
    <PreviewBox>
      {segments.map((seg, i) => (
        <span
          key={i}
          style={{
            fontWeight: seg.bold ? 'bold' : 'normal',
            fontStyle: seg.italic ? 'italic' : 'normal',
            opacity: seg.dim ? 0.5 : 1,
            color: seg.color || '#ffffff',
          }}
        >
          {seg.text}
        </span>
      ))}
    </PreviewBox>
  );
};

export default RichTextPreview;

const PreviewBox = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 2px;
  min-height: 20px;
  white-space: pre-wrap;
  word-break: break-word;
`;
