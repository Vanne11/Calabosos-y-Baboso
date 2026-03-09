// components/game/PuzzleWidget.tsx
// Acertijos: code, riddle, lock, sequence

import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const Description = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  margin-bottom: 0.5rem;
`;

const Question = styled.div`
  color: ${(props) => props.theme.terminal.text};
  margin-bottom: 0.5rem;
`;

const Hint = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  font-style: italic;
  margin-bottom: 0.5rem;
`;

const Attempts = styled.div`
  color: ${(props) => props.theme.terminal.error};
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
`;

const InputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const TextInput = styled.input`
  background: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.text};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 0.9rem;
  flex: 1;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

const ActionButton = styled.button<{ $disabled?: boolean }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  cursor: ${(props) => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  font-size: 0.9rem;
  opacity: ${(props) => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

const ElementButton = styled.button<{ $selected: boolean; $order: number }>`
  background-color: ${(props) => props.$selected ? props.theme.button.hoverBackground : props.theme.button.background};
  color: ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 3px 4px 3px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  display: inline-block;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
  }

  &::after {
    content: '${(props) => props.$order > 0 ? props.$order : ''}';
    position: absolute;
    top: -6px;
    right: -4px;
    font-size: 0.7rem;
    color: ${(props) => props.theme.terminal.success};
  }
`;

const ExitButton = styled(ActionButton)`
  margin-top: 0.5rem;
  width: 100%;
  border-style: dashed;
  color: ${(props) => props.theme.terminal.accentDim};
`;

const SequenceInfo = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  margin: 0.5rem 0;
`;

interface PuzzleWidgetProps {
  puzzleType: 'code' | 'sequence' | 'riddle' | 'lock';
  description: string;
  prompt?: string;
  question?: string;
  hint?: string;
  elements?: { id: string; label: string }[];
  digits?: number;
  attemptsLeft?: number;
  onAttempt: (answer: string | string[]) => void;
  onExit: () => void;
}

const PuzzleWidget: React.FC<PuzzleWidgetProps> = ({
  puzzleType,
  description,
  prompt: puzzlePrompt,
  question,
  hint,
  elements,
  digits,
  attemptsLeft,
  onAttempt,
  onExit,
}) => {
  const [textAnswer, setTextAnswer] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string[]>([]);

  const handleTextSubmit = () => {
    if (textAnswer.trim()) {
      onAttempt(textAnswer.trim());
      setTextAnswer('');
    }
  };

  const handleElementToggle = (id: string) => {
    setSelectedOrder((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSequenceSubmit = () => {
    if (selectedOrder.length > 0) {
      onAttempt(selectedOrder);
      setSelectedOrder([]);
    }
  };

  const renderPuzzleInput = () => {
    if (puzzleType === 'sequence' && elements) {
      return (
        <>
          {elements.map((el) => {
            const order = selectedOrder.indexOf(el.id) + 1;
            return (
              <ElementButton
                key={el.id}
                $selected={order > 0}
                $order={order}
                onClick={() => handleElementToggle(el.id)}
              >
                {el.label}
              </ElementButton>
            );
          })}
          {selectedOrder.length > 0 && (
            <SequenceInfo>Orden: {selectedOrder.map((id) => {
              const el = elements.find((e) => e.id === id);
              return el?.label || id;
            }).join(' → ')}</SequenceInfo>
          )}
          <ActionButton
            $disabled={selectedOrder.length === 0}
            disabled={selectedOrder.length === 0}
            onClick={handleSequenceSubmit}
          >
            Confirmar secuencia
          </ActionButton>
        </>
      );
    }

    // code, riddle, lock — text input
    return (
      <InputRow>
        <TextInput
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
          placeholder={puzzlePrompt || (puzzleType === 'lock' ? `Código de ${digits || 4} dígitos` : 'Tu respuesta...')}
          maxLength={puzzleType === 'lock' ? (digits || 4) : undefined}
        />
        <ActionButton
          $disabled={!textAnswer.trim()}
          disabled={!textAnswer.trim()}
          onClick={handleTextSubmit}
        >
          Enviar
        </ActionButton>
      </InputRow>
    );
  };

  const typeIcons: Record<string, string> = {
    code: '🔐',
    riddle: '❓',
    lock: '🔒',
    sequence: '🔢',
  };

  return (
    <Container>
      <Description>{typeIcons[puzzleType] || '🧩'} {description}</Description>
      {question && <Question>{question}</Question>}
      {hint && <Hint>Pista: {hint}</Hint>}
      {attemptsLeft !== undefined && <Attempts>Intentos restantes: {attemptsLeft}</Attempts>}

      {renderPuzzleInput()}

      <ExitButton onClick={onExit}>Rendirse</ExitButton>
    </Container>
  );
};

export default PuzzleWidget;
