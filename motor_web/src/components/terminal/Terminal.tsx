// components/terminal/Terminal.tsx
// Terminal principal - solo renderizado, la lógica está en hooks

import React from 'react';
import styled from 'styled-components';
import TerminalHistory from './TerminalHistory';
import TerminalInput from './TerminalInput';
import { useAppStore } from '../../store/useAppStore';

const TerminalContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: ${(props) => props.theme.terminal.background};
  border-radius: 5px;
  padding: 1rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.terminal.border};
  cursor: text;
  max-height: 50vh;
  min-height: 200px;
  position: relative;
`;

const EnterPrompt = styled.div`
  position: absolute;
  right: 20px;
  bottom: 60px;
  background-color: ${(props) => props.theme.terminal.accent};
  color: ${(props) => props.theme.terminal.background};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 10px ${(props) => props.theme.terminal.accent}40;

  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }
`;

interface TerminalProps {
  prompt: string;
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  inputType?: 'text' | 'password';
  placeholder?: string;
  children?: React.ReactNode;
}

const Terminal: React.FC<TerminalProps> = ({
  prompt,
  inputValue,
  onInputChange,
  onSubmit,
  onKeyDown,
  inputType = 'text',
  placeholder = '',
  children,
}) => {
  const showEnterPrompt = useAppStore((s) => s.showEnterPrompt);

  const handleContainerClick = () => {
    // Focus is handled by the input autoFocus
  };

  return (
    <TerminalContainer onClick={handleContainerClick}>
      <TerminalHistory>
        {children}
      </TerminalHistory>

      {showEnterPrompt && (
        <EnterPrompt>Presiona ENTER para continuar</EnterPrompt>
      )}

      <TerminalInput
        prompt={prompt}
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        onKeyDown={onKeyDown}
        type={inputType}
        placeholder={placeholder}
      />
    </TerminalContainer>
  );
};

export default Terminal;
