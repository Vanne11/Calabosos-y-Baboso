// components/game/UseItemWidget.tsx
// Usar item sobre un objetivo (estilo LucasArts)

import React, { useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const Description = styled.div`
  color: ${(props) => props.theme.terminal.system};
  font-style: italic;
  margin-bottom: 0.75rem;
`;

const SectionLabel = styled.div`
  color: ${(props) => props.theme.terminal.accent};
  font-weight: bold;
  margin: 0.5rem 0 0.25rem;
`;

const SelectButton = styled.button<{ $selected: boolean }>`
  background-color: ${(props) => props.$selected ? props.theme.button.hoverBackground : props.theme.button.background};
  color: ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 3px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
  }
`;

const ActionButton = styled.button<{ $disabled?: boolean }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 3px 0;
  cursor: ${(props) => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  opacity: ${(props) => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

const ExitButton = styled(ActionButton)`
  margin-top: 0.5rem;
  border-style: dashed;
  color: ${(props) => props.theme.terminal.accentDim};
`;

interface UseItemWidgetProps {
  description?: string;
  targets: { id: string; label: string }[];
  playerInventory: string[];
  exitText: string;
  onUse: (itemId: string, targetId: string) => void;
  onExit: () => void;
}

const UseItemWidget: React.FC<UseItemWidgetProps> = ({
  description,
  targets,
  playerInventory,
  exitText,
  onUse,
  onExit,
}) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const handleUse = () => {
    if (selectedItem && selectedTarget) {
      onUse(selectedItem, selectedTarget);
      setSelectedItem(null);
      setSelectedTarget(null);
    }
  };

  return (
    <Container>
      {description && <Description>{description}</Description>}

      <SectionLabel>🎒 Elige un item</SectionLabel>
      {playerInventory.map((item) => (
        <SelectButton
          key={item}
          $selected={selectedItem === item}
          onClick={() => setSelectedItem(item)}
        >
          {selectedItem === item ? '✓ ' : ''}{item}
        </SelectButton>
      ))}

      <SectionLabel>🎯 Elige un objetivo</SectionLabel>
      {targets.map((target) => (
        <SelectButton
          key={target.id}
          $selected={selectedTarget === target.id}
          onClick={() => setSelectedTarget(target.id)}
        >
          {selectedTarget === target.id ? '✓ ' : ''}{target.label}
        </SelectButton>
      ))}

      <ActionButton
        $disabled={!selectedItem || !selectedTarget}
        disabled={!selectedItem || !selectedTarget}
        onClick={handleUse}
      >
        Usar {selectedItem || '...'} en {
          selectedTarget
            ? targets.find((t) => t.id === selectedTarget)?.label || selectedTarget
            : '...'
        }
      </ActionButton>
      <ExitButton onClick={onExit}>{exitText}</ExitButton>
    </Container>
  );
};

export default UseItemWidget;
