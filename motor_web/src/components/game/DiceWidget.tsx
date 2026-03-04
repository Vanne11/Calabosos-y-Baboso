// components/game/DiceWidget.tsx
// Tirada D20 con animación

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const shake = keyframes`
  0% { transform: rotate(0deg); }
  10% { transform: rotate(-15deg); }
  20% { transform: rotate(15deg); }
  30% { transform: rotate(-10deg); }
  40% { transform: rotate(10deg); }
  50% { transform: rotate(-5deg); }
  60% { transform: rotate(5deg); }
  70% { transform: rotate(-2deg); }
  80% { transform: rotate(2deg); }
  90% { transform: rotate(-1deg); }
  100% { transform: rotate(0deg); }
`;

const DiceContainer = styled.div`
  margin: 1rem 0;
  text-align: center;
`;

const DiceDescription = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const DiceFace = styled.div<{ $rolling: boolean }>`
  font-size: 3rem;
  display: inline-block;
  animation: ${(props) => (props.$rolling ? shake : 'none')} 0.5s infinite;
  margin: 0.5rem 0;
`;

const RollButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accent};
  border-radius: 5px;
  padding: 10px 24px;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: bold;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
    box-shadow: 0 0 10px ${(props) => props.theme.terminal.accent}60;
  }

  &:active {
    background-color: ${(props) => props.theme.button.activeBackground};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StatInfo = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  margin-top: 0.3rem;
`;

interface DiceWidgetProps {
  description: string;
  stat: string;
  difficulty: number;
  faces: number;
  onRoll: () => void;
}

const DiceWidget: React.FC<DiceWidgetProps> = ({
  description,
  stat,
  difficulty,
  faces,
  onRoll,
}) => {
  const [rolling, setRolling] = useState(false);
  const [displayNum, setDisplayNum] = useState(faces);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const handleRoll = () => {
    setRolling(true);

    // Animate random numbers
    intervalRef.current = setInterval(() => {
      setDisplayNum(Math.floor(Math.random() * faces) + 1);
    }, 80);

    // Stop after 1.5s and send action
    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRolling(false);
      onRoll();
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <DiceContainer>
      <DiceDescription>{description}</DiceDescription>
      <StatInfo>
        Stat: {stat} | Dificultad: {difficulty} | D{faces}
      </StatInfo>
      <DiceFace $rolling={rolling}>🎲 {displayNum}</DiceFace>
      <br />
      <RollButton onClick={handleRoll} disabled={rolling}>
        {rolling ? 'Rodando...' : `Lanzar D${faces}`}
      </RollButton>
    </DiceContainer>
  );
};

export default DiceWidget;
