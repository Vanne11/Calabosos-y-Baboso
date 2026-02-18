// editor/components/shared/TerminalInput.tsx
// Input monospace estilizado para el editor

import React from 'react';
import styled from 'styled-components';

interface TerminalInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

const TerminalInput: React.FC<TerminalInputProps> = ({
  value,
  onChange,
  placeholder,
  label,
  multiline,
  rows = 3,
  className,
}) => {
  return (
    <InputWrapper className={className}>
      {label && <InputLabel>{label}</InputLabel>}
      {multiline ? (
        <StyledTextarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <StyledInput
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </InputWrapper>
  );
};

export default TerminalInput;

const InputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InputLabel = styled.label`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const inputStyles = `
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 6px 8px;
  border-radius: 3px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
`;

const StyledInput = styled.input`
  ${inputStyles}
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }

  &::placeholder {
    color: ${(p) => p.theme.terminal.accentDim};
    opacity: 0.5;
  }
`;

const StyledTextarea = styled.textarea`
  ${inputStyles}
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  resize: vertical;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }

  &::placeholder {
    color: ${(p) => p.theme.terminal.accentDim};
    opacity: 0.5;
  }
`;
