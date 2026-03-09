// components/game/CombatWidget.tsx
// Interfaz de combate por turnos

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const Header = styled.div`
  color: ${(props) => props.theme.terminal.error};
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const HpBar = styled.div`
  margin: 0.25rem 0;
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.85rem;
`;

const HpFill = styled.div<{ $ratio: number }>`
  height: 8px;
  background: ${(props) =>
    props.$ratio > 0.5 ? props.theme.terminal.success :
    props.$ratio > 0.25 ? props.theme.terminal.warning :
    props.theme.terminal.error};
  width: ${(props) => Math.max(0, Math.min(100, props.$ratio * 100))}%;
  border-radius: 2px;
  transition: width 0.3s ease;
`;

const HpTrack = styled.div`
  height: 8px;
  background: ${(props) => props.theme.terminal.tableBorder};
  border-radius: 2px;
  margin-top: 2px;
`;

const RoundInfo = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.8rem;
  margin: 0.5rem 0;
`;

const ActionButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
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
    border-color: ${(props) => props.theme.terminal.accent};
    box-shadow: 0 0 5px ${(props) => props.theme.terminal.accent}40;
  }
`;

const ItemButton = styled(ActionButton)`
  color: ${(props) => props.theme.terminal.success};
  border-color: ${(props) => props.theme.terminal.success}80;

  &:hover {
    border-color: ${(props) => props.theme.terminal.success};
    box-shadow: 0 0 5px ${(props) => props.theme.terminal.success}40;
  }
`;

interface CombatWidgetProps {
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  playerHp: number;
  actions: string[];
  round: number;
  usableItems?: { itemId: string; name: string }[];
  onAction: (action: string) => void;
}

const actionLabels: Record<string, string> = {
  attack: 'Atacar',
  defend: 'Defender',
  flee: 'Huir',
  special: 'Especial',
};

const CombatWidget: React.FC<CombatWidgetProps> = ({
  enemyName,
  enemyHp,
  enemyMaxHp,
  playerHp,
  actions,
  round,
  usableItems,
  onAction,
}) => {
  return (
    <Container>
      <Header>⚔️ {enemyName}</Header>

      <HpBar>
        Enemigo: {enemyHp}/{enemyMaxHp} HP
        <HpTrack><HpFill $ratio={enemyHp / enemyMaxHp} /></HpTrack>
      </HpBar>
      <HpBar>
        Tú: {playerHp} HP
      </HpBar>

      <RoundInfo>Ronda {round}</RoundInfo>

      {actions.map((action) => (
        <ActionButton key={action} onClick={() => onAction(action)}>
          {actionLabels[action] || action}
        </ActionButton>
      ))}

      {usableItems && usableItems.length > 0 && usableItems.map((item) => (
        <ItemButton key={item.itemId} onClick={() => onAction(`use_item:${item.itemId}`)}>
          🎒 Usar: {item.name}
        </ItemButton>
      ))}
    </Container>
  );
};

export default CombatWidget;
