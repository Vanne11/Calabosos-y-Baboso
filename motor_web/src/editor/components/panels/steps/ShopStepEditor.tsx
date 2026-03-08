// editor/components/panels/steps/ShopStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { ShopStep, ShopItem } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import TerminalButton from '../../shared/TerminalButton';

interface Props {
  step: ShopStep;
  onChange: (step: ShopStep) => void;
}

const ShopStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateItem = (i: number, patch: Partial<ShopItem>) => {
    const items = step.items.map((item, j) => (j === i ? { ...item, ...patch } : item));
    onChange({ ...step, items });
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Título de la tienda"
        value={step.title}
        onChange={(title) => onChange({ ...step, title })}
      />

      <Row>
        <TerminalInput
          label="Stat de moneda"
          value={step.currency}
          onChange={(currency) => onChange({ ...step, currency })}
          placeholder="dinero"
        />
        <Field>
          <Label>Vender</Label>
          <Toggle
            $active={step.sellable ?? false}
            onClick={() => onChange({ ...step, sellable: !(step.sellable ?? false) })}
          >
            {step.sellable ? 'Sí' : 'No'}
          </Toggle>
        </Field>
        {step.sellable && (
          <Field>
            <Label>Ratio venta</Label>
            <NumInput
              type="number"
              min={0}
              max={1}
              step={0.1}
              value={step.sellRatio ?? 0.5}
              onChange={(e) => onChange({ ...step, sellRatio: parseFloat(e.target.value) || 0.5 })}
            />
          </Field>
        )}
      </Row>

      {step.items.map((item, i) => (
        <ItemBlock key={i}>
          <ItemHeader>
            <ItemLabel>Item #{i + 1}</ItemLabel>
            <DelBtn onClick={() => {
              onChange({ ...step, items: step.items.filter((_, j) => j !== i) });
            }}>x</DelBtn>
          </ItemHeader>
          <Row>
            <TerminalInput
              label="ID"
              value={item.id}
              onChange={(id) => updateItem(i, { id })}
              placeholder="pocion_salud"
            />
            <TerminalInput
              label="Nombre"
              value={item.name}
              onChange={(name) => updateItem(i, { name })}
            />
          </Row>
          <Row>
            <Field>
              <Label>Precio</Label>
              <NumInput
                type="number"
                min={0}
                value={item.price}
                onChange={(e) => updateItem(i, { price: parseInt(e.target.value) || 0 })}
              />
            </Field>
            <TerminalInput
              label="Descripción"
              value={item.description || ''}
              onChange={(description) => updateItem(i, { description: description || undefined })}
            />
          </Row>
        </ItemBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({
          ...step,
          items: [...step.items, { id: `item_${step.items.length + 1}`, name: 'Nuevo Item', price: 10 }],
        });
      }}>
        + Item
      </TerminalButton>

      <GotoSelect
        label="Al salir, ir a"
        value={step.goto || ''}
        onChange={(goto) => onChange({ ...step, goto: goto || undefined })}
      />

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default ShopStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const Label = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const NumInput = styled.input`
  width: 60px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
`;

const Toggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 8px;
  background: ${(p) => p.$active ? 'rgba(80,250,123,0.15)' : 'rgba(255,85,85,0.15)'};
  border: 1px solid ${(p) => p.$active ? p.theme.terminal.success : p.theme.terminal.error};
  color: ${(p) => p.$active ? p.theme.terminal.success : p.theme.terminal.error};
  cursor: pointer;
  border-radius: 2px;
`;

const ItemBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ItemLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;
