// editor/components/shared/TagInput.tsx
// Input para listas de strings (inventario, etc.)

import React, { useState } from 'react';
import styled from 'styled-components';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  label?: string;
  placeholder?: string;
}

const TagInput: React.FC<TagInputProps> = ({ tags, onChange, label, placeholder }) => {
  const [input, setInput] = useState('');

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInput('');
    }
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Wrapper>
      {label && <Label>{label}</Label>}
      <TagList>
        {tags.map((tag, i) => (
          <Tag key={`${tag}-${i}`}>
            {tag}
            <TagRemove onClick={() => removeTag(i)}>x</TagRemove>
          </Tag>
        ))}
      </TagList>
      <InputRow>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Escribe y pulsa Enter'}
        />
        <AddBtn onClick={addTag} type="button">+</AddBtn>
      </InputRow>
    </Wrapper>
  );
};

export default TagInput;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Label = styled.label`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Tag = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  color: ${(p) => p.theme.terminal.accent};
  display: flex;
  align-items: center;
  gap: 4px;
`;

const TagRemove = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 0 2px;

  &:hover {
    opacity: 0.7;
  }
`;

const InputRow = styled.div`
  display: flex;
  gap: 4px;
`;

const Input = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 3px;
  outline: none;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;

const AddBtn = styled.button`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  padding: 4px 10px;
  background: ${(p) => p.theme.button.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.success};
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background: ${(p) => p.theme.button.hoverBackground};
  }
`;
