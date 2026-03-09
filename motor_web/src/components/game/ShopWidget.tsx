// components/game/ShopWidget.tsx
// Interfaz de tienda con selección por número y acciones por letra

import React from 'react';
import styled from 'styled-components';

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
  playerInventory: { id: string; name: string; count: number }[];
  sellRatio: number;
  canHaggle: boolean;
  canSteal: boolean;
  canDeceive: boolean;
  haggleLeft?: number;
  stealLeft?: number;
  deceiveLeft?: number;
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

  let num = 0;

  return (
    <Container>
      <Title>🏪 {title}</Title>
      <MoneyInfo>{currency}: {currentMoney}</MoneyInfo>

      <SectionLabel>Comprar</SectionLabel>
      {items.map((item, i) => {
        num++;
        const n = num;
        const isSelected = sel?.mode === 'buy' && sel.index === i;
        return (
          <React.Fragment key={item.id}>
            <ItemButton $selected={isSelected} onClick={() => toggleBuy(i)}>
              <ItemNum>[{n}]</ItemNum> {item.name} — {item.price} {currency}
              {item.haggled && <HaggleTag> (regateado)</HaggleTag>}
              {item.description && <> <ItemDesc>({item.description})</ItemDesc></>}
              {!item.canAfford && <NoMoney> (sin fondos)</NoMoney>}
            </ItemButton>
            {isSelected && (
              <ActionBar>
                <ActionButton disabled={!item.canAfford} onClick={() => onBuy(i)}>
                  <Key>[C]</Key> Comprar
                </ActionButton>
                {canHaggle && !item.haggled && (
                  <ActionButton $color="#f1fa8c" onClick={() => onHaggle(i)}>
                    <Key>[R]</Key> 🗣️ Regatear{haggleLeft !== undefined ? ` (${haggleLeft})` : ''}
                  </ActionButton>
                )}
                {canSteal && (
                  <ActionButton $color="#ff5555" onClick={() => onSteal(i)}>
                    <Key>[S]</Key> 🤫 Robar{stealLeft !== undefined ? ` (${stealLeft})` : ''}
                  </ActionButton>
                )}
                <ActionButton $color="#6272a4" onClick={() => onSelectionChange(null)}>
                  <Key>[0]</Key> Cancelar
                </ActionButton>
              </ActionBar>
            )}
          </React.Fragment>
        );
      })}

      {hasSellItems && (
        <>
          <SectionLabel>Vender ({Math.round(sellRatio * 100)}%)</SectionLabel>
          {playerInventory.map((inv) => {
            num++;
            const n = num;
            const isSelected = sel?.mode === 'sell' && sel.itemId === inv.id;
            const shopItem = items.find(si => si.id === inv.id);
            const sellPrice = shopItem ? Math.floor(shopItem.price * sellRatio) : '?';
            return (
              <React.Fragment key={inv.id}>
                <ItemButton $selected={isSelected} onClick={() => toggleSell(inv.id)}>
                  <ItemNum>[{n}]</ItemNum> {inv.name}{inv.count > 1 ? ` (x${inv.count})` : ''}
                </ItemButton>
                {isSelected && (
                  <ActionBar>
                    <ActionButton onClick={() => onSell(inv.id)}>
                      <Key>[V]</Key> Vender ({sellPrice} {currency})
                    </ActionButton>
                    {canDeceive && (
                      <ActionButton $color="#bd93f9" onClick={() => onDeceive(inv.id)}>
                        <Key>[E]</Key> 🎭 Engañar{deceiveLeft !== undefined ? ` (${deceiveLeft})` : ''}
                      </ActionButton>
                    )}
                    <ActionButton $color="#6272a4" onClick={() => onSelectionChange(null)}>
                      <Key>[0]</Key> Cancelar
                    </ActionButton>
                  </ActionBar>
                )}
              </React.Fragment>
            );
          })}
        </>
      )}

      <ExitButton onClick={onExit}>
        <ItemNum>[0]</ItemNum> Salir de la tienda
      </ExitButton>
    </Container>
  );
};

export default ShopWidget;

// --- Styles ---

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
  margin: 0.75rem 0 0.25rem;
`;

const ItemButton = styled.button<{ $selected?: boolean }>`
  background-color: ${(props) => props.$selected
    ? props.theme.button.hoverBackground
    : props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$selected
    ? props.theme.terminal.accent
    : props.theme.terminal.accentDim};
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
  }
`;

const ItemNum = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
`;

const ItemDesc = styled.span`
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.8rem;
`;

const HaggleTag = styled.span`
  font-size: 0.8rem;
  color: ${(props) => props.theme.terminal.success};
`;

const NoMoney = styled.span`
  font-size: 0.8rem;
  color: ${(props) => props.theme.terminal.error};
  opacity: 0.7;
`;

const ActionBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 8px 12px;
  margin: -3px 0 4px;
  background: ${(props) => props.theme.terminal.dialogBackground};
  border: 1px solid ${(props) => props.theme.terminal.accent};
  border-top: none;
  border-radius: 0 0 3px 3px;
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

const ExitButton = styled(ItemButton)`
  margin-top: 0.75rem;
  border-style: dashed;
  color: ${(props) => props.theme.terminal.accentDim};
`;
