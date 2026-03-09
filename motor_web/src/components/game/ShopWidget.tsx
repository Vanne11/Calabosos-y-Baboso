// components/game/ShopWidget.tsx
// Interfaz de tienda: compra, venta, regateo, robo y engaño

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const Title = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
`;

const MoneyInfo = styled.div`
  color: ${(props) => props.theme.terminal.info};
  margin-bottom: 0.75rem;
`;

const SectionLabel = styled.div`
  color: ${(props) => props.theme.terminal.accent};
  font-weight: bold;
  margin: 0.5rem 0 0.25rem;
`;

const ItemRow = styled.div`
  display: flex;
  gap: 4px;
  margin: 3px 0;
  align-items: stretch;
`;

const ItemButton = styled.button<{ $disabled?: boolean }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.$disabled ? props.theme.terminal.accentDim : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$disabled ? props.theme.terminal.tableBorder : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  cursor: ${(props) => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  flex: 1;
  opacity: ${(props) => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

const ActionBtn = styled.button<{ $color?: string }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.$color || props.theme.terminal.warning};
  border: 1px solid ${(props) => props.$color || props.theme.terminal.warning};
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => props.$color || props.theme.terminal.warning}22;
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ItemDesc = styled.span`
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.8rem;
`;

const HaggleTag = styled.span<{ $up?: boolean }>`
  font-size: 0.75rem;
  color: ${(props) => props.$up ? props.theme.terminal.error : props.theme.terminal.success};
  margin-left: 4px;
`;

const ExitButton = styled(ItemButton)`
  margin-top: 0.75rem;
  border-style: dashed;
  color: ${(props) => props.theme.terminal.accentDim};
`;

const SellRow = styled.div`
  display: flex;
  gap: 4px;
  margin: 3px 0;
  align-items: stretch;
`;

interface ShopWidgetProps {
  title: string;
  currency: string;
  currentMoney: number;
  items: { id: string; name: string; price: number; description?: string; canAfford: boolean; haggled?: boolean }[];
  sellable: boolean;
  playerInventory: string[];
  sellRatio: number;
  canHaggle: boolean;
  canSteal: boolean;
  canDeceive: boolean;
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
  onBuy,
  onSell,
  onHaggle,
  onSteal,
  onDeceive,
  onExit,
}) => {
  return (
    <Container>
      <Title>🏪 {title}</Title>
      <MoneyInfo>{currency}: {currentMoney}</MoneyInfo>

      <SectionLabel>Comprar</SectionLabel>
      {items.map((item, i) => (
        <ItemRow key={item.id}>
          <ItemButton
            $disabled={!item.canAfford}
            disabled={!item.canAfford}
            onClick={() => onBuy(i)}
          >
            {item.name} — {item.price} {currency}
            {item.haggled && <HaggleTag $up={false}> (regateado)</HaggleTag>}
            {item.description && <> <ItemDesc>({item.description})</ItemDesc></>}
          </ItemButton>
          {canHaggle && !item.haggled && (
            <ActionBtn onClick={() => onHaggle(i)} title="Regatear precio">
              🗣️
            </ActionBtn>
          )}
          {canSteal && (
            <ActionBtn
              $color="#ff5555"
              onClick={() => onSteal(i)}
              title="Intentar robar"
            >
              🤫
            </ActionBtn>
          )}
        </ItemRow>
      ))}

      {sellable && playerInventory.length > 0 && (
        <>
          <SectionLabel>Vender ({Math.round(sellRatio * 100)}%)</SectionLabel>
          {playerInventory.map((itemId) => (
            <SellRow key={itemId}>
              <ItemButton onClick={() => onSell(itemId)}>
                Vender: {itemId}
              </ItemButton>
              {canDeceive && (
                <ActionBtn
                  $color="#bd93f9"
                  onClick={() => onDeceive(itemId)}
                  title="Engañar al tendero"
                >
                  🎭
                </ActionBtn>
              )}
            </SellRow>
          ))}
        </>
      )}

      <ExitButton onClick={onExit}>Salir de la tienda</ExitButton>
    </Container>
  );
};

export default ShopWidget;
