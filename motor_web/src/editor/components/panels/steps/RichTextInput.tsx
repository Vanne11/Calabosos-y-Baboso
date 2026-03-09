// editor/components/panels/steps/RichTextInput.tsx
// Textarea con barra de formato y toggle preview

import React, { useState, useRef } from 'react';
import styled from 'styled-components';
import RichTextPreview from './RichTextPreview';

interface RichTextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const FORMAT_TAGS = [
  { label: 'B', tag: 'bold', title: 'Negrita' },
  { label: 'I', tag: 'italic', title: 'Cursiva' },
  { label: 'dim', tag: 'dim', title: 'Atenuado' },
  { label: 'red', tag: 'red', title: 'Rojo' },
  { label: 'grn', tag: 'green', title: 'Verde' },
  { label: 'cyn', tag: 'cyan', title: 'Cyan' },
  { label: 'ylw', tag: 'yellow', title: 'Amarillo' },
  { label: 'prp', tag: 'purple', title: 'Púrpura' },
];

const RichTextInput: React.FC<RichTextInputProps> = ({ value, onChange, placeholder }) => {
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wrapSelection = (tag: string) => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    const before = value.substring(0, start);
    const after = value.substring(end);
    const wrapped = `[${tag}]${selected}[/${tag}]`;

    onChange(before + wrapped + after);

    // Restaurar cursor después del texto envuelto
    setTimeout(() => {
      el.focus();
      el.selectionStart = start + tag.length + 2;
      el.selectionEnd = start + tag.length + 2 + selected.length;
    }, 0);
  };

  return (
    <Wrapper>
      <Toolbar>
        {FORMAT_TAGS.map((ft) => (
          <FormatBtn key={ft.tag} onClick={() => wrapSelection(ft.tag)} title={ft.title}>
            {ft.label}
          </FormatBtn>
        ))}
        <Spacer />
        <PreviewToggle $active={showPreview} onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'editar' : 'preview'}
        </PreviewToggle>
      </Toolbar>

      {showPreview ? (
        <RichTextPreview text={value} />
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
        />
      )}
    </Wrapper>
  );
};

export default RichTextInput;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: wrap;
`;

const FormatBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 2px;

  &:hover {
    border-color: ${(p) => p.theme.terminal.accent};
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const Spacer = styled.div`
  flex: 1;
`;

const PreviewToggle = styled.button<{ $active: boolean }>`
  background: ${(p) => (p.$active ? p.theme.terminal.dialogBackground : 'none')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.border)};
  color: ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.accentDim)};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 2px;
`;

const Textarea = styled.textarea`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  resize: vertical;
  min-height: 32px;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;
