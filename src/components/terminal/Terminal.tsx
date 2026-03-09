// components/terminal/Terminal.tsx
// Terminal principal - solo renderizado, la lógica está en hooks

import React, { useRef } from 'react';
import styled from 'styled-components';
import TerminalHistory from './TerminalHistory';
import TerminalInput, { TerminalInputHandle } from './TerminalInput';
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
  min-height: 0;
  position: relative;
`;

const EnterPrompt = styled.button`
  position: absolute;
  right: 10px;
  bottom: 50px;
  background-color: ${(props) => props.theme.terminal.accent};
  color: ${(props) => props.theme.terminal.background};
  border: none;
  padding: 8px 14px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  animation: pulse 1.5s infinite;
  box-shadow: 0 0 10px ${(props) => props.theme.terminal.accent}40;
  z-index: 10;

  @keyframes pulse {
    0% { opacity: 0.7; }
    50% { opacity: 1; }
    100% { opacity: 0.7; }
  }

  .mobile-text { display: none; }

  @media (max-width: 768px) {
    right: 50%;
    transform: translateX(50%);
    bottom: 50px;
    padding: 12px 24px;
    font-size: 1rem;

    .desktop-text { display: none; }
    .mobile-text { display: inline; }
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
  const inputRef = useRef<TerminalInputHandle>(null);

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <TerminalContainer onClick={handleContainerClick}>
      <TerminalHistory>
        {children}
      </TerminalHistory>

      {showEnterPrompt && (
        <EnterPrompt>
          <span className="desktop-text">Presiona ENTER para continuar</span>
          <span className="mobile-text">Toca aquí para continuar</span>
        </EnterPrompt>
      )}

      <TerminalInput
        ref={inputRef}
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
