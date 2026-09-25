// components/game/UseItemWidget.tsx
// Usar item sobre un objetivo (estilo LucasArts). El objeto se elige en el panel de inventario
// (clic o IN[n]); aquí solo están los objetivos: con un objeto elegido, tocar un objetivo lo usa.

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

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

const Hint = styled.div`
  color: ${(props) => props.theme.terminal.accentDim};
  font-size: 0.85rem;
  margin: 0.25rem 0 0.5rem;
`;

const Chosen = styled.span`
  color: ${(props) => props.theme.terminal.success};
  font-weight: bold;
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

const UseItemWidget: React.FC<UseItemWidgetProps> = ({ description, targets, playerInventory, exitText, onUse, onExit }) => {
  const usingItem = useAppStore((st) => st.usingItem);
  const itemDefs = useAppStore((st) => st.engine?.items) ?? {};
  // Si el objeto elegido ya no está (se gastó), no cuenta como elegido
  const item = usingItem && playerInventory.includes(usingItem) ? usingItem : null;
  const itemName = item ? itemDefs[item]?.name ?? item : '';

  return (
    <Container>
      {description && <Description>{description}</Description>}

      {playerInventory.length === 0 ? (
        <Hint>No llevas nada encima. Ni dignidad.</Hint>
      ) : item ? (
        <Hint>
          Usar <Chosen>{itemName}</Chosen> en… <span>(escribe el número)</span>
        </Hint>
      ) : (
        <Hint>🎒 Primero elige un objeto de tu inventario (clic o IN1, IN2…), después el objetivo.</Hint>
      )}

      <SectionLabel>🎯 Objetivos</SectionLabel>
      {targets.map((target, i) => (
        <ActionButton
          key={target.id}
          $disabled={!item}
          disabled={!item}
          onClick={() => item && onUse(item, target.id)}
        >
          [{i + 1}] {item ? `Usar ${itemName} en ${target.label}` : target.label}
        </ActionButton>
      ))}
      <ExitButton onClick={onExit}>[0] {exitText}</ExitButton>
    </Container>
  );
};

export default UseItemWidget;
