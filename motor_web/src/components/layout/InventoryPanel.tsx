// components/layout/InventoryPanel.tsx
// Panel de inventario con grid de slots estilo RPG + tooltip hover

import React, { useState } from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

const TOTAL_SLOTS = 8;

const Panel = styled.div`
  flex-shrink: 0;
  padding: 0.5rem 0.8rem;
  border: 1px solid ${(props) => props.theme.terminal.border};
  border-top: none;
  background-color: ${(props) => props.theme.terminal.background};
  position: relative;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

const Title = styled.span`
  color: ${(props) => props.theme.accent};
  font-weight: bold;
  font-size: 0.75rem;
`;

const CoinBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const CoinIcon = styled.img`
  width: 24px;
  height: 24px;
  object-fit: contain;
  image-rendering: pixelated;
`;

const CoinPill = styled.span<{ $broke?: boolean }>`
  background-color: ${(props) => props.$broke
    ? (props.theme.terminal.error || '#ff5555')
    : (props.theme.terminal.warning || '#f1fa8c')};
  color: ${(props) => props.theme.terminal.background || '#1a0e29'};
  font-size: 0.7rem;
  font-weight: bold;
  padding: 1px 6px;
  border-radius: 8px;
  line-height: 1.2;
`;

const SlotsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;

const Slot = styled.div<{ $empty?: boolean }>`
  width: 60px;
  height: 60px;
  border: 1px solid ${(props) => props.$empty
    ? props.theme.terminal.border
    : props.theme.accent};
  border-radius: 4px;
  background-color: ${(props) => props.$empty
    ? 'transparent'
    : props.theme.widgets.background};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  opacity: ${(props) => props.$empty ? 0.3 : 1};
  cursor: ${(props) => props.$empty ? 'default' : 'pointer'};

  &:hover {
    ${(props) => !props.$empty && `border-color: ${props.theme.terminal.warning || '#f1fa8c'};`}
  }
`;

const SlotIcon = styled.img`
  width: 44px;
  height: 44px;
  object-fit: contain;
  image-rendering: pixelated;
`;

const SlotLabel = styled.div`
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.5rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.terminal.background}cc;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 2px;
  border-radius: 0 0 3px 3px;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 8px;
  margin-bottom: 6px;
  background-color: ${(props) => props.theme.widgets.background};
  border: 1px solid ${(props) => props.theme.accent};
  border-radius: 6px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 20;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  min-width: 200px;
`;

const TooltipImage = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const TooltipInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TooltipName = styled.div`
  color: ${(props) => props.theme.accent};
  font-weight: bold;
  font-size: 0.85rem;
`;

const TooltipDesc = styled.div`
  color: ${(props) => props.theme.textSecondary};
  font-size: 0.75rem;
  line-height: 1.3;
`;

function getItemData(id: string, manifest: { items?: Record<string, { name: string; description: string }> } | null): { name: string; desc: string } {
  if (manifest?.items?.[id]) {
    return { name: manifest.items[id].name, desc: manifest.items[id].description };
  }
  // Fallback: generar nombre desde el ID
  const name = id
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { name, desc: 'Un objeto misterioso.' };
}

const InventoryPanel: React.FC = () => {
  const playerState = useAppStore((s) => s.playerState);
  const phase = useAppStore((s) => s.phase);
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const engine = useAppStore((s) => s.engine);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  if (phase !== 'game' || !playerState) return null;

  const dinero = typeof playerState.stats.dinero === 'number' ? playerState.stats.dinero : 0;
  const hasItems = playerState.inventory.length > 0;

  if (!hasItems && dinero <= 0) return null;

  const manifestItems = engine ? { items: engine.items } : null;
  const items = playerState.inventory;
  const emptySlots = Math.max(0, TOTAL_SLOTS - items.length);
  const hovered = hoveredItem ? getItemData(hoveredItem, manifestItems) : null;

  return (
    <Panel>
      {hovered && hoveredItem && (
        <Tooltip>
          <TooltipImage
            src={`${gameBasePath}/images/items/${hoveredItem}.png`}
            alt={hovered.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <TooltipInfo>
            <TooltipName>{hovered.name}</TooltipName>
            <TooltipDesc>{hovered.desc}</TooltipDesc>
          </TooltipInfo>
        </Tooltip>
      )}
      <Header>
        <Title>[INVENTARIO]</Title>
        <CoinBadge>
          <CoinIcon
            src={`${gameBasePath}/images/items/bolsa_monedas.png`}
            alt="Monedas"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <CoinPill $broke={dinero <= 0}>{dinero}</CoinPill>
        </CoinBadge>
      </Header>
      <SlotsGrid>
        {items.map((item, i) => (
          <Slot
            key={`${item}-${i}`}
            onMouseEnter={() => setHoveredItem(item)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            <SlotIcon
              src={`${gameBasePath}/images/items/${item}.png`}
              alt={getItemData(item, manifestItems).name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <SlotLabel>{getItemData(item, manifestItems).name.split(' ')[0]}</SlotLabel>
          </Slot>
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <Slot key={`empty-${i}`} $empty />
        ))}
      </SlotsGrid>
    </Panel>
  );
};

export default InventoryPanel;
