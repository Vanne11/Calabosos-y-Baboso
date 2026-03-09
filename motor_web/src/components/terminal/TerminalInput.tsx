// components/terminal/TerminalInput.tsx
// Input de la terminal

import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styled from 'styled-components';

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  margin-top: 4px;
`;

const Prompt = styled.span`
  color: ${(props) => props.theme.terminal.prompt};
  margin-right: 8px;
  white-space: nowrap;
  font-size: 0.9rem;
`;

const Input = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${(props) => props.theme.terminal.command};
  font-family: inherit;
  font-size: 0.9rem;
  outline: none;
  caret-color: ${(props) => props.theme.terminal.accent};

  &::placeholder {
    color: ${(props) => props.theme.terminal.accentDim};
    opacity: 0.5;
  }
`;

interface TerminalInputProps {
  prompt: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  type?: 'text' | 'password';
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface TerminalInputHandle {
  focus: () => void;
}

const TerminalInput = forwardRef<TerminalInputHandle, TerminalInputProps>(({
  prompt,
  value,
  onChange,
  onSubmit,
  onKeyDown,
  placeholder = '',
  type = 'text',
  disabled = false,
  autoFocus = true,
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <InputContainer onSubmit={handleSubmit}>
      <Prompt>{prompt}</Prompt>
      <Input
        ref={inputRef}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        spellCheck={false}
        autoComplete="off"
      />
    </InputContainer>
  );
});

export default TerminalInput;
