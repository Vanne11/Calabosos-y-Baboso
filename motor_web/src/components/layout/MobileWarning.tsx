// components/layout/MobileWarning.tsx
// Detecta móvil/pantalla pequeña y advierte que el juego no va a funcionar

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
`;

const Modal = styled.div`
  background-color: ${(props) => props.theme.terminal.background};
  border: 2px solid ${(props) => props.theme.terminal.accent};
  border-radius: 8px;
  padding: 2rem;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 0 30px ${(props) => props.theme.terminal.accent}40;
`;

const Title = styled.h2`
  color: ${(props) => props.theme.terminal.accent};
  margin: 0 0 1rem 0;
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
`;

const Message = styled.p`
  color: ${(props) => props.theme.terminal.text};
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
`;

const SubMessage = styled.p`
  color: ${(props) => props.theme.terminal.accentDim};
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
  margin: 0 0 1.5rem 0;
  font-style: italic;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Button = styled.button<{ $primary?: boolean }>`
  background-color: ${(props) =>
    props.$primary ? props.theme.terminal.accent : 'transparent'};
  color: ${(props) =>
    props.$primary ? props.theme.terminal.background : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accent};
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) =>
      props.$primary ? props.theme.terminal.accentDim : props.theme.terminal.accent + '20'};
  }
`;

const WarningIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const MIN_WIDTH = 900;

function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

function isSmallScreen(): boolean {
  return window.innerWidth < MIN_WIDTH;
}

const MobileWarning: React.FC = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(() => {
    if (dismissed) {
      setShow(false);
      return;
    }
    setShow(isMobileDevice() || isSmallScreen());
  }, [dismissed]);

  useEffect(() => {
    check();
    window.addEventListener('resize', check);
    if (screen.orientation) {
      screen.orientation.addEventListener('change', check);
    }
    return () => {
      window.removeEventListener('resize', check);
      if (screen.orientation) {
        screen.orientation.removeEventListener('change', check);
      }
    };
  }, [check]);

  if (!show) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  return (
    <Overlay>
      <Modal>
        <WarningIcon>&#128586;</WarningIcon>
        <Title>ERROR CRÍTICO DE HARDWARE</Title>
        <Message>
          A ver... esto es un juego de TERMINAL. Se necesita un teclado de verdad, no ese cristalito
          que tocas con los dedos como si fuera una bola mágica.
        </Message>
        <Message>
          Cuando se hicieron estos juegos, un "celular" tenía botones físicos y una "tablet" era
          el diario del domingo. Así que hazte un favor y pásate al PC.
        </Message>
        <SubMessage>
          — El Narrador (que ya está perdiendo la paciencia)
        </SubMessage>
        <ButtonGroup>
          <Button $primary onClick={handleDismiss}>
            Ya, déjame intentar igual
          </Button>
          <Button onClick={() => window.open('https://www.google.com/search?q=pc+barato', '_blank')}>
            Ok, voy a buscar un PC
          </Button>
        </ButtonGroup>
      </Modal>
    </Overlay>
  );
};

export default MobileWarning;
