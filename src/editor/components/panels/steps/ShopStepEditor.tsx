// editor/components/panels/steps/ShopStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { ShopStep, ShopItem, ShopDiceAction } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';
import TerminalButton from '../../shared/TerminalButton';

interface Props {
  step: ShopStep;
  onChange: (step: ShopStep) => void;
}

const DEFAULT_DICE_ACTION: ShopDiceAction = {
  stat: 'charisma',
  difficulty: 12,
};

const ShopStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateItem = (i: number, patch: Partial<ShopItem>) => {
    const items = step.items.map((item, j) => (j === i ? { ...item, ...patch } : item));
    onChange({ ...step, items });
  };

  const toggleDiceAction = (key: 'haggle' | 'steal' | 'deceive') => {
    if (step[key]) {
      const next = { ...step };
      delete next[key];
      onChange(next);
    } else {
      onChange({ ...step, [key]: { ...DEFAULT_DICE_ACTION } });
    }
  };

  const updateDiceAction = (key: 'haggle' | 'steal' | 'deceive', patch: Partial<ShopDiceAction>) => {
    const current = step[key];
    if (!current) return;
    onChange({ ...step, [key]: { ...current, ...patch } });
  };

  const renderDiceActionEditor = (
    key: 'haggle' | 'steal' | 'deceive',
    label: string,
    emoji: string,
  ) => {
    const active = !!step[key];
    const action = step[key];

    return (
      <DiceActionBlock>
        <DiceActionHeader>
          <DiceActionLabel>{emoji} {label}</DiceActionLabel>
          <Toggle $active={active} onClick={() => toggleDiceAction(key)}>
            {active ? 'Sí' : 'No'}
          </Toggle>
        </DiceActionHeader>

        {action && (
          <DiceActionBody>
            <Row>
              <TerminalInput
                label="Stat"
                value={action.stat}
                onChange={(stat) => updateDiceAction(key, { stat })}
                placeholder="charisma"
              />
              <Field>
                <Label>Dificultad (DC)</Label>
                <NumInput
                  type="number"
                  min={1}
                  max={30}
                  value={action.difficulty}
                  onChange={(e) => updateDiceAction(key, { difficulty: parseInt(e.target.value) || 12 })}
                />
              </Field>
              <Field>
                <Label>Max intentos</Label>
                <NumInput
                  type="number"
                  min={0}
                  value={action.maxAttempts ?? 0}
                  onChange={(e) => updateDiceAction(key, {
                    maxAttempts: parseInt(e.target.value) || undefined,
                  })}
                />
              </Field>
              <Field>
                <Label>DC +/intento</Label>
                <NumInput
                  type="number"
                  min={0}
                  value={action.difficultyIncrease ?? 0}
                  onChange={(e) => updateDiceAction(key, {
                    difficultyIncrease: parseInt(e.target.value) || undefined,
                  })}
                />
              </Field>
            </Row>
            <Row>
              <TerminalInput
                label="Texto éxito"
                value={action.successText || ''}
                onChange={(v) => updateDiceAction(key, { successText: v || undefined })}
                placeholder="(auto)"
              />
              <TerminalInput
                label="Texto fallo"
                value={action.failText || ''}
                onChange={(v) => updateDiceAction(key, { failText: v || undefined })}
                placeholder="(auto)"
              />
            </Row>
            <EffectsEditor
              label="Penalización al fallar"
              effects={action.failEffects || {}}
              onChange={(failEffects) => updateDiceAction(key, {
                failEffects: Object.keys(failEffects).length > 0 ? failEffects : undefined,
              })}
            />
            <SectionDivider />
            <HintText>Expulsión (al agotar intentos o fallo crítico)</HintText>
            <Row>
              <GotoSelect
                label="Escena expulsión"
                value={action.bustGoto || ''}
                onChange={(v) => updateDiceAction(key, { bustGoto: v || undefined })}
              />
              <TerminalInput
                label="Texto expulsión"
                value={action.bustText || ''}
                onChange={(v) => updateDiceAction(key, { bustText: v || undefined })}
                placeholder="(auto)"
              />
            </Row>
            <EffectsEditor
              label="Efectos al ser expulsado"
              effects={action.bustEffects || {}}
              onChange={(bustEffects) => updateDiceAction(key, {
                bustEffects: Object.keys(bustEffects).length > 0 ? bustEffects : undefined,
              })}
            />
          </DiceActionBody>
        )}
      </DiceActionBlock>
    );
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

      <SectionDivider />
      <SectionTitle>Mecánicas de dado</SectionTitle>

      {renderDiceActionEditor('haggle', 'Regatear', '🗣️')}
      {renderDiceActionEditor('steal', 'Robar', '🤫')}
      {step.sellable && renderDiceActionEditor('deceive', 'Engañar al vender', '🎭')}

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

const SectionDivider = styled.hr`
  border: none;
  border-top: 1px dashed ${(p) => p.theme.terminal.border};
  margin: 4px 0;
`;

const SectionTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
`;

const DiceActionBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DiceActionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DiceActionLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const DiceActionBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 4px;
  border-top: 1px dotted ${(p) => p.theme.terminal.border};
`;

const HintText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.system};
  text-transform: uppercase;
`;
