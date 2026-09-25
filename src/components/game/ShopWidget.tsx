// components/game/ShopWidget.tsx
// Interfaz de tienda con cuadrícula compacta y detalle expandible

import React from 'react';
import styled from 'styled-components';
import { itemImageUrl } from '../../utils/itemImage';

type Selection =
  | { mode: 'buy'; index: number }
  | { mode: 'sell'; itemId: string }
  | null;

interface ShopWidgetProps {
  title: string;
  currency: string;
  currentMoney: number;
  items: { id: string; name: string; price: number; description?: string; canAfford: boolean; haggled?: boolean }[];
  sellable: boolean;
  playerInventory: { id: string; name: string; count: number; sellPrice?: number }[];
  sellRatio: number;
  canHaggle: boolean;
  canSteal: boolean;
  canDeceive: boolean;
  haggleLeft?: number;
  stealLeft?: number;
  deceiveLeft?: number;
  lastMessage?: string;
  externalSelection: Selection;
  onSelectionChange: (sel: Selection) => void;
  onBuy: (itemIndex: number) => void;
  onSell: (itemId: string) => void;
  onHaggle: (itemIndex: number) => void;
  onSteal: (itemIndex: number) => void;
  onDeceive: (itemId: string) => void;
  onExit: () => void;
}

const ShopWidget: React.FC<ShopWidgetProps> = ({
  title,
  currency,
  currentMoney,
  items,
  sellable,
  playerInventory,
  sellRatio,
  canHaggle,
  canSteal,
  canDeceive,
  haggleLeft,
  stealLeft,
  deceiveLeft,
  lastMessage,
  externalSelection,
  onSelectionChange,
  onBuy,
  onSell,
  onHaggle,
  onSteal,
  onDeceive,
  onExit,
}) => {
  const sel = externalSelection;
  const hasSellItems = sellable && playerInventory.length > 0;

  const toggleBuy = (index: number) => {
    onSelectionChange(
      sel && sel.mode === 'buy' && sel.index === index ? null : { mode: 'buy', index },
    );
  };

  const toggleSell = (itemId: string) => {
    onSelectionChange(
      sel && sel.mode === 'sell' && sel.itemId === itemId ? null : { mode: 'sell', itemId },
    );
  };

  // Encontrar el item seleccionado para el panel de detalle
  const selectedBuyItem = sel?.mode === 'buy' ? items[sel.index] : null;
  const selectedBuyIndex = sel?.mode === 'buy' ? sel.index : -1;
  const selectedSellItem = sel?.mode === 'sell'
    ? playerInventory.find(inv => inv.id === sel.itemId)
    : null;

  let num = 0;

  return (
    <Container>
      <ShopHeader>
        <Title>🏪 {title}</Title>
        <MoneyInfo>{currency}: {currentMoney}</MoneyInfo>
      </ShopHeader>

      <SectionLabel>Comprar</SectionLabel>
      <SlotsGrid>
        {items.map((item, i) => {
          num++;
          const n = num;
          const isSelected = sel?.mode === 'buy' && sel.index === i;
          return (
            <Slot
              key={item.id}
              $selected={isSelected}
              $cantAfford={!item.canAfford}
              onClick={() => toggleBuy(i)}
            >
              <SlotNum>{n}</SlotNum>
              {item.haggled && <HaggleBadge>!</HaggleBadge>}
              <SlotIcon
                src={itemImageUrl(item.id)}
                alt={item.name}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <SlotName>{item.name}</SlotName>
              <SlotPrice $cantAfford={!item.canAfford}>
                {item.price}
              </SlotPrice>
            </Slot>
          );
        })}
      </SlotsGrid>

      {/* Panel de detalle para item de compra seleccionado */}
      {selectedBuyItem && (
        <DetailPanel>
          <DetailHeader>
            <DetailImage
              src={itemImageUrl(selectedBuyItem.id)}
              alt={selectedBuyItem.name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <DetailInfo>
              <DetailName>{selectedBuyItem.name}</DetailName>
              <DetailPrice>
                Precio: {selectedBuyItem.price} {currency}
                {selectedBuyItem.haggled && <HaggleTag> (regateado)</HaggleTag>}
              </DetailPrice>
              {selectedBuyItem.description && (
                <DetailDesc>{selectedBuyItem.description}</DetailDesc>
              )}
            </DetailInfo>
          </DetailHeader>
          <ActionBar>
            <ActionButton disabled={!selectedBuyItem.canAfford} onClick={() => onBuy(selectedBuyIndex)}>
              <Key>[C]</Key> Comprar
            </ActionButton>
            {canHaggle && !selectedBuyItem.haggled && (
              <ActionButton $color="#f1fa8c" onClick={() => onHaggle(selectedBuyIndex)}>
                <Key>[R]</Key> 🗣️ Regatear{haggleLeft !== undefined ? ` (${haggleLeft})` : ''}
              </ActionButton>
            )}
            {canSteal && (
              <ActionButton $color="#ff5555" onClick={() => onSteal(selectedBuyIndex)}>
                <Key>[S]</Key> 🤫 Robar{stealLeft !== undefined ? ` (${stealLeft})` : ''}
              </ActionButton>
            )}
            <ActionButton $color="#6272a4" onClick={() => onSelectionChange(null)}>
              <Key>[0]</Key> Cancelar
            </ActionButton>
          </ActionBar>
        </DetailPanel>
      )}

      {hasSellItems && (
        <>
          <SectionLabel>Vender ({Math.round(sellRatio * 100)}%)</SectionLabel>
          <SlotsGrid>
            {playerInventory.map((inv) => {
              num++;
              const n = num;
              const isSelected = sel?.mode === 'sell' && sel.itemId === inv.id;
              return (
                <Slot
                  key={inv.id}
                  $selected={isSelected}
                  onClick={() => toggleSell(inv.id)}
                >
                  <SlotNum>{n}</SlotNum>
                  {inv.count > 1 && <StackBadge>x{inv.count}</StackBadge>}
                  <SlotIcon
                    src={itemImageUrl(inv.id)}
                    alt={inv.name}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <SlotName>{inv.name}</SlotName>
                  <SlotPrice>
                    {inv.sellPrice ?? '?'}
                  </SlotPrice>
                </Slot>
              );
            })}
          </SlotsGrid>

          {/* Panel de detalle para item de venta seleccionado */}
          {selectedSellItem && (
            <DetailPanel>
              <DetailHeader>
                <DetailImage
                  src={itemImageUrl(selectedSellItem.id)}
                  alt={selectedSellItem.name}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <DetailInfo>
                  <DetailName>
                    {selectedSellItem.name}
                    {selectedSellItem.count > 1 ? ` (x${selectedSellItem.count})` : ''}
                  </DetailName>
                  <DetailPrice>
                    Venta: {selectedSellItem.sellPrice ?? '?'} {currency}
                  </DetailPrice>
                </DetailInfo>
              </DetailHeader>
              <ActionBar>
                <ActionButton onClick={() => onSell(selectedSellItem.id)}>
                  <Key>[V]</Key> Vender
                </ActionButton>
                {canDeceive && (
                  <ActionButton $color="#bd93f9" onClick={() => onDeceive(selectedSellItem.id)}>
                    <Key>[E]</Key> 🎭 Engañar{deceiveLeft !== undefined ? ` (${deceiveLeft})` : ''}
                  </ActionButton>
                )}
                <ActionButton $color="#6272a4" onClick={() => onSelectionChange(null)}>
                  <Key>[0]</Key> Cancelar
                </ActionButton>
              </ActionBar>
            </DetailPanel>
          )}
        </>
      )}

      <ExitButton onClick={onExit}>
        <Key>[0]</Key> Salir de la tienda
      </ExitButton>

      {/* Comentario del vendedor — siempre visible al fondo */}
      {lastMessage && (
        <VendorComment>
          <VendorIcon>🗨️</VendorIcon>
          <VendorText>{lastMessage}</VendorText>
        </VendorComment>
      )}
    </Container>
  );
};

export default ShopWidget;

// --- Styles ---

const Container = styled.div`
  margin: 1rem 0;
`;

const ShopHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

const Title = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  font-size: 1.1rem;
`;

const MoneyInfo = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.9rem;
`;

const SectionLabel = styled.div`
  color: ${(props) => props.theme.terminal.accent};
  font-weight: bold;
  margin: 0.75rem 0 0.25rem;
  font-size: 0.85rem;
`;

const SlotsGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Slot = styled.button<{ $selected?: boolean; $cantAfford?: boolean }>`
  width: 90px;
  height: 90px;
  border: 1px solid ${(props) => props.$selected
    ? props.theme.terminal.warning
    : props.$cantAfford
      ? (props.theme.terminal.error || '#ff5555')
      : props.theme.terminal.accentDim};
  border-radius: 4px;
  background-color: ${(props) => props.$selected
    ? props.theme.button.hoverBackground
    : props.theme.widgets?.background || props.theme.button.background};
  cursor: pointer;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  padding: 4px;
  transition: all 0.15s ease;
  opacity: ${(props) => props.$cantAfford ? 0.5 : 1};

  &:hover {
    border-color: ${(props) => props.theme.terminal.warning};
    opacity: 1;
  }
`;

const SlotNum = styled.span`
  position: absolute;
  top: 2px;
  left: 4px;
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  font-size: 0.65rem;
`;

const HaggleBadge = styled.span`
  position: absolute;
  top: 1px;
  right: 3px;
  color: ${(props) => props.theme.terminal.success};
  font-weight: bold;
  font-size: 0.7rem;
`;

const StackBadge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: ${(props) => props.theme.terminal.warning || '#f1fa8c'};
  color: ${(props) => props.theme.terminal.background || '#1a0e29'};
  font-size: 0.6rem;
  font-weight: bold;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
  z-index: 2;
`;

const SlotIcon = styled.img`
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const SlotName = styled.span`
  color: ${(props) => props.theme.terminal.accent};
  font-size: 0.65rem;
  text-align: center;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

const SlotPrice = styled.span<{ $cantAfford?: boolean }>`
  color: ${(props) => props.$cantAfford
    ? (props.theme.terminal.error || '#ff5555')
    : (props.theme.terminal.warning || '#f1fa8c')};
  font-size: 0.65rem;
  font-weight: bold;
`;

const DetailPanel = styled.div`
  margin: 6px 0 4px;
  border: 1px solid ${(props) => props.theme.terminal.accent};
  border-radius: 4px;
  background: ${(props) => props.theme.terminal.dialogBackground};
  overflow: hidden;
`;

const DetailHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
`;

const DetailImage = styled.img`
  width: 64px;
  height: 64px;
  object-fit: contain;
  image-rendering: pixelated;
  flex-shrink: 0;
`;

const DetailInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const DetailName = styled.div`
  color: ${(props) => props.theme.terminal.accent};
  font-weight: bold;
  font-size: 0.95rem;
`;

const DetailPrice = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-size: 0.85rem;
`;

const DetailDesc = styled.div`
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.8rem;
  line-height: 1.3;
`;

const HaggleTag = styled.span`
  font-size: 0.8rem;
  color: ${(props) => props.theme.terminal.success};
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid ${(props) => props.theme.terminal.accentDim};
`;

const ActionButton = styled.button<{ $color?: string }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.$color || props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$color || props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 5px 10px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.$color || props.theme.terminal.accent}22;
    border-color: ${(props) => props.$color || props.theme.terminal.accent};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const Key = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  margin-right: 2px;
`;

const ExitButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accentDim};
  border: 1px dashed ${(props) => props.theme.terminal.border};
  border-radius: 3px;
  padding: 8px 12px;
  margin-top: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  width: 100%;
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.theme.terminal.accent};
    color: ${(props) => props.theme.terminal.accent};
  }
`;

const VendorComment = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 0.75rem;
  padding: 8px 12px;
  background: ${(props) => props.theme.terminal.dialogBackground};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 4px;
  border-left: 3px solid ${(props) => props.theme.terminal.warning};
`;

const VendorIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const VendorText = styled.span`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  line-height: 1.4;
  font-style: italic;
`;
