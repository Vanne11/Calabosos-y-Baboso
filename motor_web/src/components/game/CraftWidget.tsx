// components/game/CraftWidget.tsx
// Interfaz de crafting: combinar items del inventario

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

const ItemToggle = styled.button<{ $selected: boolean }>`
  background-color: ${(props) => props.$selected ? props.theme.button.hoverBackground : props.theme.button.background};
  color: ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$selected ? props.theme.terminal.success : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 6px 12px;
  margin: 3px 4px 3px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  display: inline-block;
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

const Selected = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  margin: 0.5rem 0;
`;

interface CraftWidgetProps {
  description?: string;
  playerInventory: string[];
  onCombine: (items: string[]) => void;
  onExit: () => void;
}

const CraftWidget: React.FC<CraftWidgetProps> = ({
  description,
  playerInventory,
  onCombine,
  onExit,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleItem = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  return (
    <Container>
      {description && <Description>{description}</Description>}

      <SectionLabel>Inventario</SectionLabel>
      {playerInventory.map((item) => (
        <ItemToggle
          key={item}
          $selected={selected.includes(item)}
          onClick={() => toggleItem(item)}
        >
          {selected.includes(item) ? '✓ ' : ''}{item}
        </ItemToggle>
      ))}

      {selected.length > 0 && (
        <Selected>Seleccionados: {selected.join(' + ')}</Selected>
      )}

      <ActionButton
        $disabled={selected.length < 2}
        disabled={selected.length < 2}
        onClick={() => onCombine(selected)}
      >
        🔧 Combinar ({selected.length} items)
      </ActionButton>
      <ExitButton onClick={onExit}>Dejar de combinar</ExitButton>
    </Container>
  );
};

export default CraftWidget;
