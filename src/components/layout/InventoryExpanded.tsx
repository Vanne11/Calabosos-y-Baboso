// components/layout/InventoryExpanded.tsx
// Vista expandida del inventario: overlay con grid grande + info del jugador

import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import { assetUrl } from '../../utils/assetUrl';

const EXPANDED_SLOTS = 24;

interface StackedItem {
  id: string;
  count: number;
}

function stackItems(inventory: string[]): StackedItem[] {
  const map = new Map<string, number>();
  for (const id of inventory) {
    map.set(id, (map.get(id) || 0) + 1);
  }
  return Array.from(map, ([id, count]) => ({ id, count }));
}

const STAT_LABELS: Record<string, string> = {
  will_to_live: 'Ganas de vivir',
  hunger: 'Hambre',
  pee: 'Pipí',
  fear: 'Miedo',
  reputation: 'Reputación',
};

const CURRENCY_KEYS = ['gold', 'dinero', 'money', 'coins', 'oro'];

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Panel = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 2px solid ${(p) => p.theme.accent};
  border-radius: 10px;
  width: 100%;
  max-width: 900px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.6);
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.2rem;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const Title = styled.span`
  color: ${(p) => p.theme.accent};
  font-weight: bold;
  font-size: 1rem;
  letter-spacing: 1px;
`;

const CloseHint = styled.span`
  color: ${(p) => p.theme.textSecondary};
  font-size: 0.7rem;
`;

const Body = styled.div`
  display: flex;
  gap: 1.2rem;
  padding: 1rem 1.2rem;
  min-height: 0;

  @media (max-width: 700px) {
    flex-direction: column;
  }
`;

// --- Lado izquierdo: Jugador ---

const PlayerSide = styled.div`
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;

  @media (max-width: 700px) {
    flex: 0 0 auto;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

const PlayerImage = styled.img`
  width: 160px;
  height: 160px;
  object-fit: contain;
  image-rendering: pixelated;
  border: 2px solid ${(p) => p.theme.accent};
  border-radius: 8px;
  background: ${(p) => p.theme.widgets.background};
`;

const PlayerName = styled.div`
  color: ${(p) => p.theme.accent};
  font-weight: bold;
  font-size: 1rem;
`;

const LevelBadge = styled.span`
  font-size: 0.75rem;
  font-weight: bold;
  color: ${(p) => p.theme.background};
  background: ${(p) => p.theme.accent};
  border-radius: 10px;
  padding: 2px 8px;
`;

const StatsBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
`;

const StatLabel = styled.span`
  color: ${(p) => p.theme.textSecondary};
`;

const StatValue = styled.span`
  color: ${(p) => p.theme.accent};
  font-weight: bold;
`;

const CoinRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const CoinIcon = styled.img`
  width: 28px;
  height: 28px;
  object-fit: contain;
  image-rendering: pixelated;
`;

const CoinAmount = styled.span<{ $broke?: boolean }>`
  font-size: 0.9rem;
  font-weight: bold;
  color: ${(p) => p.$broke
    ? (p.theme.terminal.error || '#ff5555')
    : (p.theme.terminal.warning || '#f1fa8c')};
`;

const TraitsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  width: 100%;
`;

const TraitBadge = styled.span`
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 3px;
  background: ${(p) => p.theme.widgets.border};
  color: ${(p) => p.theme.textSecondary};
`;

// --- Lado derecho: Grid de slots ---

const InventorySide = styled.div`
  flex: 1;
  min-width: 0;
`;

const SlotsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Slot = styled.div<{ $empty?: boolean }>`
  width: 90px;
  height: 90px;
  border: 1px solid ${(p) => p.$empty
    ? p.theme.terminal.border
    : p.theme.accent};
  border-radius: 6px;
  background: ${(p) => p.$empty
    ? 'transparent'
    : p.theme.widgets.background};
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  opacity: ${(p) => p.$empty ? 0.2 : 1};
  cursor: ${(p) => p.$empty ? 'default' : 'pointer'};
  transition: border-color 0.15s;

  &:hover {
    ${(p) => !p.$empty && `border-color: ${p.theme.terminal.warning || '#f1fa8c'};`}
  }
`;

const SlotIcon = styled.img`
  width: 68px;
  height: 68px;
  object-fit: contain;
  image-rendering: pixelated;
`;

const SlotLabel = styled.div`
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 0.55rem;
  color: ${(p) => p.theme.textSecondary};
  background: ${(p) => p.theme.terminal.background}cc;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 2px;
  border-radius: 0 0 5px 5px;
`;

const StackBadge = styled.div`
  position: absolute;
  top: -2px;
  right: -2px;
  background: ${(p) => p.theme.terminal.warning || '#f1fa8c'};
  color: ${(p) => p.theme.terminal.background || '#1a0e29'};
  font-size: 0.6rem;
  font-weight: bold;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  z-index: 2;
`;

const InBadge = styled.div`
  position: absolute;
  top: -2px;
  left: -2px;
  background: #6272a4;
  color: #f8f8f2;
  font-size: 0.55rem;
  font-weight: bold;
  min-width: 22px;
  height: 14px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 2px;
  z-index: 2;
  letter-spacing: -0.5px;
`;

// --- Tooltip ---

const Tooltip = styled.div`
  position: fixed;
  z-index: 950;
  background: ${(p) => p.theme.widgets.background};
  border: 1px solid ${(p) => p.theme.accent};
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  min-width: 220px;
`;

const TooltipImage = styled.img`
  width: 96px;
  height: 96px;
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
  color: ${(p) => p.theme.accent};
  font-weight: bold;
  font-size: 0.9rem;
`;

const TooltipDesc = styled.div`
  color: ${(p) => p.theme.textSecondary};
  font-size: 0.75rem;
  line-height: 1.3;
`;

function getItemData(id: string, items?: Record<string, { name: string; description: string }>): { name: string; desc: string } {
  if (items?.[id]) {
    return { name: items[id].name, desc: items[id].description };
  }
  const name = id.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { name, desc: 'Un objeto misterioso.' };
}

const InventoryExpanded: React.FC = () => {
  const expanded = useAppStore((s) => s.inventoryExpanded);
  const setExpanded = useAppStore((s) => s.setInventoryExpanded);
  const playerState = useAppStore((s) => s.playerState);
  const engine = useAppStore((s) => s.engine);
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const phase = useAppStore((s) => s.phase);

  const [hovered, setHovered] = useState<{ id: string; x: number; y: number } | null>(null);

  // Close on ESC
  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [expanded, setExpanded]);

  if (!expanded || phase !== 'game' || !playerState) return null;

  // Player data
  const protagonist = engine?.getProtagonist?.();
  const rawImage = protagonist?.image || playerState.stats._protagonist_image;
  const protagonistImage = typeof rawImage === 'string'
    ? assetUrl(rawImage.startsWith(gameBasePath) ? rawImage : `${gameBasePath}/${rawImage}`)
    : null;
  const playerName = typeof playerState.stats.nombre_jugador === 'string'
    ? playerState.stats.nombre_jugador
    : (protagonist?.name || 'Jugador');

  const protagonistId = Object.keys(engine?.characters || {}).find(
    (id) => engine?.characters[id]?.role === 'protagonist'
  ) || 'protagonist';
  const charState = playerState.characters?.[protagonistId];
  const activeTraits = playerState.activeTraits || [];
  const traitDefs = engine?.traitDefs || {};

  const numericStats = Object.entries(playerState.stats).filter(
    ([key, val]) => typeof val === 'number' && key in STAT_LABELS
  );

  const currencyStat = CURRENCY_KEYS.find(
    (k) => typeof playerState.stats[k] === 'number'
  ) || 'gold';
  const dinero = typeof playerState.stats[currencyStat] === 'number' ? (playerState.stats[currencyStat] as number) : 0;

  // Inventory
  const items = engine?.items;
  const stacked = stackItems(playerState.inventory);
  const emptySlots = Math.max(0, EXPANDED_SLOTS - stacked.length);
  const hoveredData = hovered ? getItemData(hovered.id, items) : null;

  const handleMouseEnter = (id: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHovered({ id, x: rect.left, y: rect.top - 10 });
  };

  return (
    <Overlay onClick={() => setExpanded(false)}>
      <Panel onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>INVENTARIO</Title>
          <CloseHint>ESC o /inventario para cerrar</CloseHint>
        </Header>
        <Body>
          <PlayerSide>
            {protagonistImage && (
              <PlayerImage
                src={protagonistImage}
                alt={playerName}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <PlayerName>{playerName}</PlayerName>
            {charState && charState.level > 1 && (
              <LevelBadge>Nv. {charState.level}</LevelBadge>
            )}
            {activeTraits.length > 0 && (
              <TraitsList>
                {activeTraits.map((traitId) => {
                  const def = traitDefs[traitId];
                  return def ? (
                    <TraitBadge key={traitId} title={def.description}>
                      {def.icon || '🔮'} {def.name}
                    </TraitBadge>
                  ) : null;
                })}
              </TraitsList>
            )}
            <CoinRow>
              <CoinIcon
                src={assetUrl(`${gameBasePath}/images/items/bolsa_monedas.png`)}
                alt="Monedas"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <CoinAmount $broke={dinero <= 0}>{dinero}</CoinAmount>
            </CoinRow>
            <StatsBlock>
              {numericStats.map(([key, value]) => (
                <StatRow key={key}>
                  <StatLabel>{STAT_LABELS[key] || key}</StatLabel>
                  <StatValue>{String(value)}</StatValue>
                </StatRow>
              ))}
            </StatsBlock>
          </PlayerSide>

          <InventorySide>
            <SlotsGrid>
              {stacked.map((item, idx) => (
                <Slot
                  key={item.id}
                  onMouseEnter={(e) => handleMouseEnter(item.id, e)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <InBadge>IN{idx + 1}</InBadge>
                  {item.count > 1 && <StackBadge>{item.count}</StackBadge>}
                  <SlotIcon
                    src={assetUrl(`${gameBasePath}/images/items/${item.id}.png`)}
                    alt={getItemData(item.id, items).name}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <SlotLabel>{getItemData(item.id, items).name.split(' ')[0]}</SlotLabel>
                </Slot>
              ))}
              {Array.from({ length: emptySlots }).map((_, i) => (
                <Slot key={`empty-${i}`} $empty />
              ))}
            </SlotsGrid>
          </InventorySide>
        </Body>
      </Panel>

      {hoveredData && hovered && (
        <Tooltip style={{ left: hovered.x, top: hovered.y, transform: 'translateY(-100%)' }}>
          <TooltipImage
            src={assetUrl(`${gameBasePath}/images/items/${hovered.id}.png`)}
            alt={hoveredData.name}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <TooltipInfo>
            <TooltipName>{hoveredData.name}</TooltipName>
            <TooltipDesc>{hoveredData.desc}</TooltipDesc>
          </TooltipInfo>
        </Tooltip>
      )}
    </Overlay>
  );
};

export default InventoryExpanded;
