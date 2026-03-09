// components/game/CraftWidget.tsx
// Interfaz de crafting estilo terminal con 5 acciones

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

const Container = styled.div`
  margin: 1rem 0;
`;

const Title = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const SectionLabel = styled.div`
  color: ${(props) => props.theme.terminal.accent};
  font-weight: bold;
  margin: 0.75rem 0 0.25rem;
`;

const ItemButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 6px 10px;
  margin: 3px 0;
  cursor: default;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ItemNum = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  flex-shrink: 0;
`;

const InvNum = styled.span`
  color: #6272a4;
  font-weight: bold;
  flex-shrink: 0;
`;

const ItemImage = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const ItemName = styled.span`
  flex: 1;
`;

const HelpSection = styled.div`
  color: ${(props) => props.theme.terminal.accentDim};
  font-size: 0.85rem;
  margin-top: 0.75rem;
  border-top: 1px dashed ${(props) => props.theme.terminal.border};
  padding-top: 0.5rem;
  line-height: 1.5;
`;

const HelpLine = styled.div`
  margin: 2px 0;
`;

const HelpLabel = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
`;

const HelpExample = styled.span`
  color: ${(props) => props.theme.terminal.info};
`;

const ExitButton = styled(ItemButton)`
  margin-top: 0.75rem;
  border-style: dashed;
  color: ${(props) => props.theme.terminal.accentDim};
  cursor: pointer;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

interface CraftWidgetProps {
  description?: string;
  tableItems: { id: string; name: string }[];
  playerInventory: { id: string; name: string }[];
  availableActions: import('../../types/game').CraftAction[];
  onCombine: (items: string[]) => void;
  onExit: () => void;
}

const CraftWidget: React.FC<CraftWidgetProps> = ({
  description,
  tableItems,
  playerInventory,
  availableActions,
  onExit,
}) => {
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const has = (a: string) => availableActions.includes(a as import('../../types/game').CraftAction);

  return (
    <Container>
      <Title>🔧 {description || 'Estación de Crafteo'}</Title>

      {tableItems.length > 0 && (
        <>
          <SectionLabel>Sobre la mesa</SectionLabel>
          {tableItems.map((item, i) => (
            <ItemButton key={item.id}>
              <ItemNum>[{i + 1}]</ItemNum>
              <ItemImage
                src={`${gameBasePath}/images/items/${item.id}.png`}
                alt={item.name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <ItemName>{item.name}</ItemName>
            </ItemButton>
          ))}
        </>
      )}

      {playerInventory.length > 0 && (
        <>
          <SectionLabel>Inventario</SectionLabel>
          {playerInventory.map((item, i) => (
            <ItemButton key={item.id}>
              <InvNum>[IN{i + 1}]</InvNum>
              <ItemImage
                src={`${gameBasePath}/images/items/${item.id}.png`}
                alt={item.name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <ItemName>{item.name}</ItemName>
            </ItemButton>
          ))}
        </>
      )}

      <HelpSection>
        {has('combine') && (
          <HelpLine>
            <HelpLabel>+</HelpLabel> combinar — <HelpExample>1+IN2</HelpExample>
          </HelpLine>
        )}
        {has('use') && (
          <HelpLine>
            <HelpLabel>()</HelpLabel> meter en — <HelpExample>1(IN2+IN3)</HelpExample>
          </HelpLine>
        )}
        {has('apply') && (
          <HelpLine>
            <HelpLabel>&gt;</HelpLabel> aplicar — <HelpExample>1&gt;IN2</HelpExample>
          </HelpLine>
        )}
        {has('cut') && (
          <HelpLine>
            <HelpLabel>/</HelpLabel> cortar — <HelpExample>1/IN2</HelpExample>
          </HelpLine>
        )}
        {has('chop') && (
          <HelpLine>
            <HelpLabel>//</HelpLabel> picar — <HelpExample>1//IN2</HelpExample>
          </HelpLine>
        )}
      </HelpSection>

      <ExitButton onClick={onExit}>
        <ItemNum>[0]</ItemNum> Dejar la mesa
      </ExitButton>
    </Container>
  );
};

export default CraftWidget;
