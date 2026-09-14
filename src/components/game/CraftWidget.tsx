// components/game/CraftWidget.tsx
// Interfaz de crafting con cuadrícula de slots y detalle expandible

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import { assetUrl } from '../../utils/assetUrl';

interface CraftWidgetProps {
  description?: string;
  tableItems: { id: string; name: string; description?: string; isFixed: boolean }[];
  availableActions: import('../../types/game').CraftAction[];
  selectedIndex: number | null;
  onSelectionChange: (index: number | null) => void;
  onPickup: (index: number) => void;
  onCombine: (items: string[]) => void;
  onExit: () => void;
}

const CraftWidget: React.FC<CraftWidgetProps> = ({
  description,
  tableItems,
  availableActions,
  selectedIndex,
  onSelectionChange,
  onPickup,
  onExit,
}) => {
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const has = (a: string) => availableActions.includes(a as import('../../types/game').CraftAction);

  const selectedItem = selectedIndex !== null ? tableItems[selectedIndex] : null;
  const selNum = selectedIndex !== null ? selectedIndex + 1 : 0;

  const toggleSelection = (i: number) => {
    onSelectionChange(selectedIndex === i ? null : i);
  };

  // Construir acciones contextuales según el tipo de item seleccionado
  const buildActions = () => {
    if (!selectedItem) return null;
    const n = selNum;
    const actions: { label: string; syntax: string; key?: string }[] = [];

    if (selectedItem.isFixed) {
      // Herramienta fija: mostrar acciones donde actúa como tool
      if (has('use')) {
        actions.push({ label: 'Meter ingredientes', syntax: `${n}(IN1+IN2)` });
      }
      if (has('cut')) {
        actions.push({ label: 'Cortar algo', syntax: `${n}/IN1` });
      }
      if (has('chop')) {
        actions.push({ label: 'Picar algo', syntax: `${n}//IN1` });
      }
      if (has('apply')) {
        actions.push({ label: 'Aplicar sustancia', syntax: `IN1>${n}` });
      }
    } else {
      // Item recogible: recoger + acciones como ingrediente
      actions.push({ label: 'Recoger', syntax: '', key: 'R' });
      if (has('combine')) {
        actions.push({ label: 'Combinar con otro', syntax: `${n}+IN1` });
      }
      if (has('apply')) {
        actions.push({ label: 'Aplicar sobre algo', syntax: `${n}>IN1` });
      }
      if (has('use')) {
        actions.push({ label: 'Meter en herramienta', syntax: `1(${n})` });
      }
    }

    return actions;
  };

  const actions = buildActions();

  return (
    <Container>
      <CraftHeader>
        <Title>🧪 {description || 'Estación de Crafteo'}</Title>
      </CraftHeader>

      <SectionLabel>Sobre la mesa</SectionLabel>
      <SlotsGrid>
        {tableItems.map((item, i) => (
          <Slot
            key={`${item.id}-${i}`}
            $isFixed={item.isFixed}
            $selected={selectedIndex === i}
            onClick={() => toggleSelection(i)}
          >
            <SlotNum>{i + 1}</SlotNum>
            {item.isFixed
              ? <FixedBadge>⚒</FixedBadge>
              : <PickBadge>↑</PickBadge>
            }
            <SlotIcon
              src={assetUrl(`${gameBasePath}/images/items/${item.id}.png`)}
              alt={item.name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <SlotName>{item.name}</SlotName>
          </Slot>
        ))}
      </SlotsGrid>

      {/* Panel de detalle del item seleccionado */}
      {selectedItem && actions && (
        <DetailPanel>
          <DetailHeader>
            <DetailImage
              src={assetUrl(`${gameBasePath}/images/items/${selectedItem.id}.png`)}
              alt={selectedItem.name}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <DetailInfo>
              <DetailName>
                [{selNum}] {selectedItem.name}
              </DetailName>
              <DetailType $isFixed={selectedItem.isFixed}>
                {selectedItem.isFixed ? '⚒ Herramienta (fija)' : '↑ Recogible'}
              </DetailType>
              {selectedItem.description && (
                <DetailDesc>{selectedItem.description}</DetailDesc>
              )}
            </DetailInfo>
          </DetailHeader>
          <ActionsSection>
            {actions.map((act, i) => (
              <ActionRow
                key={i}
                $clickable={!!act.key}
                onClick={act.key === 'R' ? () => onPickup(selectedIndex!) : undefined}
              >
                {act.key ? (
                  <>
                    <ActionKey>[{act.key}]</ActionKey>
                    <ActionLabel>{act.label}</ActionLabel>
                  </>
                ) : (
                  <>
                    <ActionSyntax>{act.syntax}</ActionSyntax>
                    <ActionLabel>{act.label}</ActionLabel>
                  </>
                )}
              </ActionRow>
            ))}
            <ActionRow $clickable onClick={() => onSelectionChange(null)}>
              <ActionKey>[0]</ActionKey>
              <ActionLabel>Cancelar</ActionLabel>
            </ActionRow>
          </ActionsSection>
        </DetailPanel>
      )}

      {/* Referencia rápida: solo si no hay selección */}
      {selectedIndex === null && (
        <HelpHint>
          Selecciona un item [1-{tableItems.length}] para ver acciones — usa <HelpKey>IN[N]</HelpKey> para items del inventario
        </HelpHint>
      )}

      <ExitButton onClick={onExit}>
        <Key>[0]</Key> Dejar la mesa
      </ExitButton>
    </Container>
  );
};

export default CraftWidget;

// --- Styles ---

const Container = styled.div`
  margin: 1rem 0;
`;

const CraftHeader = styled.div`
  margin-bottom: 0.5rem;
`;

const Title = styled.div`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  font-size: 1.1rem;
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

const Slot = styled.button<{ $isFixed?: boolean; $selected?: boolean }>`
  width: 90px;
  height: 90px;
  border: 1px solid ${(props) => props.$selected
    ? props.theme.terminal.warning
    : props.$isFixed
      ? props.theme.terminal.accentDim
      : (props.theme.terminal.success || '#50fa7b')};
  border-radius: 4px;
  background-color: ${(props) => props.$selected
    ? props.theme.button.hoverBackground
    : props.theme.widgets?.background || props.theme.button.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1px;
  position: relative;
  padding: 4px;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(props) => props.theme.terminal.warning};
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

const FixedBadge = styled.span`
  position: absolute;
  top: 1px;
  right: 3px;
  font-size: 0.65rem;
  opacity: 0.7;
`;

const PickBadge = styled.span`
  position: absolute;
  top: 1px;
  right: 4px;
  color: ${(props) => props.theme.terminal.success || '#50fa7b'};
  font-weight: bold;
  font-size: 0.7rem;
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
  font-size: 0.6rem;
  text-align: center;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
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

const DetailType = styled.div<{ $isFixed?: boolean }>`
  color: ${(props) => props.$isFixed
    ? props.theme.terminal.accentDim
    : (props.theme.terminal.success || '#50fa7b')};
  font-size: 0.8rem;
`;

const DetailDesc = styled.div`
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.8rem;
  line-height: 1.3;
`;

const ActionsSection = styled.div`
  border-top: 1px solid ${(props) => props.theme.terminal.accentDim};
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ActionRow = styled.div<{ $clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 3px;
  cursor: ${(props) => props.$clickable ? 'pointer' : 'default'};
  font-size: 0.85rem;

  ${(props) => props.$clickable && `
    &:hover {
      background-color: ${props.theme.button.hoverBackground};
    }
  `}
`;

const ActionKey = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  min-width: 24px;
`;

const ActionSyntax = styled.span`
  color: ${(props) => props.theme.terminal.info};
  font-weight: bold;
  min-width: 80px;
  font-size: 0.8rem;
`;

const ActionLabel = styled.span`
  color: ${(props) => props.theme.terminal.accentDim};
`;

const HelpHint = styled.div`
  margin-top: 0.5rem;
  color: ${(props) => props.theme.terminal.accentDim};
  font-size: 0.8rem;
`;

const HelpKey = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
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

const Key = styled.span`
  color: ${(props) => props.theme.terminal.warning};
  font-weight: bold;
  margin-right: 2px;
`;
