// components/sequences/BootSequence.tsx
// Pantalla de boot estilo Linux

import React, { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useBootSequence } from '../../hooks/useBootSequence';

const Overlay = styled.div<{ $fading: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${(props) => props.theme.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${(props) => props.theme.terminal.text};
  font-family: 'Courier New', monospace;
  transition: opacity 0.5s ease;
  opacity: ${(props) => (props.$fading ? 0 : 1)};
  pointer-events: ${(props) => (props.$fading ? 'none' : 'auto')};
`;

const LogoImage = styled.img`
  height: 4rem;
  margin-bottom: 0.5rem;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: ${(props) => props.theme.terminal.accent};
`;

const MessagesBox = styled.div`
  max-width: 600px;
  width: 90%;
  height: 300px;
  overflow: hidden;
  border: 1px solid ${(props) => props.theme.terminal.border};
  background-color: ${(props) => props.theme.terminal.background};
  padding: 1rem;
  border-radius: 5px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`;

const Message = styled.div<{ $color?: string }>`
  margin-bottom: 4px;
  color: ${(props) => props.$color || props.theme.terminal.text};
  font-size: 0.9rem;
`;

const BootSequence: React.FC = () => {
  const { messages, fading, isBooting } = useBootSequence();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isBooting) return null;

  return (
    <Overlay $fading={fading}>
      <LogoImage src="images/logo.png" alt="Logo" />
      <LogoText>BabosOS</LogoText>
      <MessagesBox>
        {messages.map((msg, i) => (
          <Message key={i} $color={msg.color}>
            {msg.text}
          </Message>
        ))}
        <div ref={endRef} />
      </MessagesBox>
    </Overlay>
  );
};

export default BootSequence;
