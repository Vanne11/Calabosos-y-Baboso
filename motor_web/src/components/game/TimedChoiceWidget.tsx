// components/game/TimedChoiceWidget.tsx
// Opciones con temporizador

import React, { useState, useEffect, useRef } from 'react';
import styled, { keyframes } from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const shrink = keyframes`
  from { width: 100%; }
  to { width: 0%; }
`;

const TimerTrack = styled.div`
  height: 6px;
  background: ${(props) => props.theme.terminal.tableBorder};
  border-radius: 3px;
  margin-bottom: 0.75rem;
  overflow: hidden;
`;

const TimerFill = styled.div<{ $duration: number }>`
  height: 100%;
  background: ${(props) => props.theme.terminal.warning};
  border-radius: 3px;
  animation: ${shrink} ${(props) => props.$duration}s linear forwards;
`;

const TimerText = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-size: 0.85rem;
  text-align: right;
  margin-bottom: 0.25rem;
`;

const OptionButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
    box-shadow: 0 0 5px ${(props) => props.theme.terminal.accent}40;
  }
`;

interface TimedChoiceWidgetProps {
  options: { text: string; index: number }[];
  duration: number;
  defaultIndex: number;
  timeoutText?: string;
  onSelect: (index: number) => void;
}

const TimedChoiceWidget: React.FC<TimedChoiceWidgetProps> = ({
  options,
  duration,
  defaultIndex,
  onSelect,
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const resolved = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!resolved.current) {
            resolved.current = true;
            onSelect(defaultIndex);
          }
        }
        return Math.max(0, next);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, defaultIndex, onSelect]);

  const handleSelect = (index: number) => {
    if (!resolved.current) {
      resolved.current = true;
      onSelect(index);
    }
  };

  return (
    <Container>
      <TimerText>⏱ {timeLeft}s</TimerText>
      <TimerTrack>
        <TimerFill $duration={duration} />
      </TimerTrack>
      {options.map((opt) => (
        <OptionButton key={opt.index} onClick={() => handleSelect(opt.index)}>
          [{opt.index + 1}] {opt.text}
        </OptionButton>
      ))}
    </Container>
  );
};

export default TimedChoiceWidget;
