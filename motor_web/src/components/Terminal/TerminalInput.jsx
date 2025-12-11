// components/Terminal/TerminalInput.jsx
// Componente de entrada mejorado para la terminal con manejo de Tab

import React, { forwardRef } from 'react';
import styled from 'styled-components';

const InputContainer = styled.form`
  display: flex;
  align-items: center;
  margin-top: 8px;
  opacity: ${props => props.disabled ? 0.6 : 1};
`;

const Prompt = styled.span`
  color: ${props => props.theme.terminal.prompt};
  margin-right: 8px;
  font-weight: bold;
`;

const Input = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  color: ${props => props.theme.terminal.text};
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  outline: none;
  padding: 0;
  
  &:focus {
    outline: none;
  }
  
  &::placeholder {
    color: ${props => props.theme.terminal.text}80;
    opacity: 0.7;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const TerminalInput = forwardRef(({ 
  prompt = '>',
  value, 
  onChange, 
  onSubmit, 
  onKeyDown,
  placeholder = "Escribe un comando...",
  disabled = false,
  type = 'text' // <-- añade esto
}, ref) => {
  return (
    <InputContainer onSubmit={onSubmit} disabled={disabled}>
      <Prompt>{prompt}</Prompt>
      <Input 
        type={type} // <-- usa esto aquí
        value={value} 
        onChange={onChange}
        onKeyDown={onKeyDown}
        autoFocus
        spellCheck="false"
        ref={ref}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === 'password' ? 'current-password' : 'username'} 
      />
    </InputContainer>
  );
});

export default TerminalInput;