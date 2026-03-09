// components/game/CraftWidget.tsx
// Interfaz de crafting: solo muestra la mesa, inventario se ve en el panel

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import { assetUrl } from '../../utils/assetUrl';

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

const ItemButton = styled.button<{ $pickable?: boolean }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$pickable
    ? (props.theme.terminal.success || '#50fa7b')
    : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 6px 10px;
  margin: 3px 0;
  cursor: ${(props) => props.$pickable ? 'pointer' : 'default'};
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;

  ${(props) => props.$pickable && `
    &:hover {
      background-color: ${props.theme.button.hoverBackground};
      border-color: ${props.theme.terminal.success || '#50fa7b'};
    }
  `}
`;

const ItemNum = styled.span`
  color: ${(props) => props.theme.terminal.warning};
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

const PickTag = styled.span`
  color: ${(props) => props.theme.terminal.success || '#50fa7b'};
  font-size: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
`;

const ToolTag = styled.span`
  color: ${(props) => props.theme.terminal.accentDim};
  font-size: 0.75rem;
  margin-left: auto;
  flex-shrink: 0;
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
  tableItems: { id: string; name: string; isFixed: boolean }[];
  availableActions: import('../../types/game').CraftAction[];
  onCombine: (items: string[]) => void;
  onExit: () => void;
}

const CraftWidget: React.FC<CraftWidgetProps> = ({
  description,
  tableItems,
  availableActions,
  onExit,
}) => {
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const has = (a: string) => availableActions.includes(a as import('../../types/game').CraftAction);
  const hasPickable = tableItems.some((t) => !t.isFixed);

  return (
    <Container>
      <Title>🔧 {description || 'Estación de Crafteo'}</Title>

      <SectionLabel>Sobre la mesa</SectionLabel>
      {tableItems.map((item, i) => (
        <ItemButton key={`${item.id}-${i}`} $pickable={!item.isFixed}>
          <ItemNum>[{i + 1}]</ItemNum>
          <ItemImage
            src={assetUrl(`${gameBasePath}/images/items/${item.id}.png`)}
            alt={item.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <ItemName>{item.name}</ItemName>
          {item.isFixed
            ? <ToolTag>herramienta</ToolTag>
            : <PickTag>recoger</PickTag>
          }
        </ItemButton>
      ))}

      <HelpSection>
        {has('combine') && (
          <HelpLine><HelpLabel>+</HelpLabel> combinar — <HelpExample>1+IN2</HelpExample></HelpLine>
        )}
        {has('use') && (
          <HelpLine><HelpLabel>()</HelpLabel> meter en — <HelpExample>1(IN2+IN3)</HelpExample></HelpLine>
        )}
        {has('apply') && (
          <HelpLine><HelpLabel>&gt;</HelpLabel> aplicar — <HelpExample>1&gt;IN2</HelpExample></HelpLine>
        )}
        {has('cut') && (
          <HelpLine><HelpLabel>/</HelpLabel> cortar — <HelpExample>1/IN2</HelpExample></HelpLine>
        )}
        {has('chop') && (
          <HelpLine><HelpLabel>//</HelpLabel> picar — <HelpExample>1//IN2</HelpExample></HelpLine>
        )}
        {hasPickable && (
          <HelpLine><HelpLabel>[N]</HelpLabel> recoger item de la mesa</HelpLine>
        )}
        <HelpLine>Usa <HelpLabel>IN[N]</HelpLabel> para items del inventario</HelpLine>
      </HelpSection>

      <ExitButton onClick={onExit}>
        <ItemNum>[0]</ItemNum> Dejar la mesa
      </ExitButton>
    </Container>
  );
};

export default CraftWidget;
