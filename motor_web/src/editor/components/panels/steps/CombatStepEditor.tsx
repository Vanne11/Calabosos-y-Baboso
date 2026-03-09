// editor/components/panels/steps/CombatStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { CombatStep, CombatItemDef } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import AssetPicker from '../../shared/AssetPicker';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';
import { useProjectContext } from '../../../hooks/useProjectContext';

interface Props {
  step: CombatStep;
  onChange: (step: CombatStep) => void;
}

const ACTIONS_OPTIONS = [
  { value: 'attack', label: 'Atacar' },
  { value: 'defend', label: 'Defender' },
  { value: 'flee', label: 'Huir' },
  { value: 'use_item', label: 'Usar Item' },
] as const;

const CombatStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const { stats } = useProjectContext();

  const toggleAction = (action: string) => {
    const current = step.actions as string[];
    const next = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    onChange({ ...step, actions: next as CombatStep['actions'] });
  };

  return (
    <Wrapper>
      <SubTitle>Enemigo</SubTitle>
      <TerminalInput
        label="Nombre"
        value={step.enemy.name}
        onChange={(name) => onChange({ ...step, enemy: { ...step.enemy, name } })}
      />
      <AssetPicker
        label="Imagen"
        value={step.enemy.image || ''}
        onChange={(image) => onChange({ ...step, enemy: { ...step.enemy, image: image || undefined } })}
        accept="image"
      />
      <Row>
        <Field>
          <Label>HP</Label>
          <NumInput type="number" min={1} value={step.enemy.hp}
            onChange={(e) => onChange({ ...step, enemy: { ...step.enemy, hp: parseInt(e.target.value) || 1 } })} />
        </Field>
        <Field>
          <Label>Ataque</Label>
          <NumInput type="number" min={0} value={step.enemy.attack}
            onChange={(e) => onChange({ ...step, enemy: { ...step.enemy, attack: parseInt(e.target.value) || 0 } })} />
        </Field>
        <Field>
          <Label>Defensa</Label>
          <NumInput type="number" min={0} value={step.enemy.defense}
            onChange={(e) => onChange({ ...step, enemy: { ...step.enemy, defense: parseInt(e.target.value) || 0 } })} />
        </Field>
      </Row>

      <SubTitle>Stats del jugador</SubTitle>
      <Row>
        <StatField>
          <Label>HP (stat)</Label>
          <StatInput value={step.playerStat}
            onChange={(e) => onChange({ ...step, playerStat: e.target.value })}
            list="combat-stats" />
        </StatField>
        <StatField>
          <Label>Ataque (stat)</Label>
          <StatInput value={step.attackStat}
            onChange={(e) => onChange({ ...step, attackStat: e.target.value })}
            list="combat-stats" />
        </StatField>
        <StatField>
          <Label>Defensa (stat)</Label>
          <StatInput value={step.defenseStat || ''}
            onChange={(e) => onChange({ ...step, defenseStat: e.target.value || undefined })}
            list="combat-stats" />
        </StatField>
      </Row>
      <datalist id="combat-stats">
        {stats.map((s) => <option key={s} value={s} />)}
      </datalist>

      <SubTitle>Acciones permitidas</SubTitle>
      <ActionsRow>
        {ACTIONS_OPTIONS.map((a) => (
          <ActionToggle
            key={a.value}
            $active={(step.actions as string[]).includes(a.value)}
            onClick={() => toggleAction(a.value)}
          >
            {a.label}
          </ActionToggle>
        ))}
      </ActionsRow>

      <SubTitle>Resultados</SubTitle>
      {(['victory', 'defeat', 'flee'] as const).map((key) => {
        const outcome = step.results[key];
        if (key === 'flee' && !(step.actions as string[]).includes('flee')) return null;
        if (!outcome && key === 'flee') return null;
        return (
          <OutcomeBlock key={key}>
            <OutcomeLabel $color={key === 'victory' ? '#50fa7b' : key === 'defeat' ? '#ff5555' : '#f1fa8c'}>
              {key === 'victory' ? 'Victoria' : key === 'defeat' ? 'Derrota' : 'Huida'}
            </OutcomeLabel>
            <TerminalInput
              label="Texto"
              value={outcome?.text || ''}
              onChange={(text) => onChange({
                ...step,
                results: { ...step.results, [key]: { ...(outcome || {}), text } },
              })}
            />
            <GotoSelect
              label="Ir a"
              value={outcome?.goto || ''}
              onChange={(goto) => onChange({
                ...step,
                results: { ...step.results, [key]: { ...(outcome || { text: '' }), goto: goto || undefined } },
              })}
            />
            <EffectsEditor
              effects={outcome?.effects || {}}
              onChange={(effects) => onChange({
                ...step,
                results: { ...step.results, [key]: { ...(outcome || { text: '' }), effects: Object.keys(effects).length ? effects : undefined } },
              })}
            />
          </OutcomeBlock>
        );
      })}

      {/* Items usables en combate */}
      {(step.actions as string[]).includes('use_item') && (
        <>
          <SubTitle>Items usables en combate</SubTitle>
          <Hint>El jugador puede usar estos items del inventario durante el combate.</Hint>
          {(step.combatItems || []).map((ci, i) => {
            const updateCI = (patch: Partial<CombatItemDef>) => {
              const items = (step.combatItems || []).map((item, j) => j === i ? { ...item, ...patch } : item);
              onChange({ ...step, combatItems: items });
            };
            return (
              <ItemBlock key={i}>
                <ItemHeader>
                  <ItemLabel>Item #{i + 1}</ItemLabel>
                  <DelBtn onClick={() => {
                    onChange({ ...step, combatItems: (step.combatItems || []).filter((_, j) => j !== i) });
                  }}>x</DelBtn>
                </ItemHeader>
                <Row>
                  <TerminalInput label="ID inventario" value={ci.itemId} onChange={(itemId) => updateCI({ itemId })} placeholder="sal_anti_babosas" />
                  <TerminalInput label="Nombre" value={ci.name} onChange={(name) => updateCI({ name })} />
                </Row>
                <TerminalInput label="Texto al usar" value={ci.text} onChange={(text) => updateCI({ text })} placeholder="¡Lanzas sal al enemigo!" multiline rows={2} />
                <Row>
                  <Field>
                    <Label>Daño</Label>
                    <NumInput type="number" min={0} value={ci.damage || 0} onChange={(e) => updateCI({ damage: parseInt(e.target.value) || 0 })} />
                  </Field>
                  <Field>
                    <Label>Curación</Label>
                    <NumInput type="number" min={0} value={ci.heal || 0} onChange={(e) => updateCI({ heal: parseInt(e.target.value) || 0 })} />
                  </Field>
                  <Field>
                    <Label>Consumir</Label>
                    <ActionToggle $active={ci.consume !== false} onClick={() => updateCI({ consume: ci.consume === false ? undefined : false })}>
                      {ci.consume !== false ? 'Sí' : 'No'}
                    </ActionToggle>
                  </Field>
                </Row>
              </ItemBlock>
            );
          })}
          <TerminalButton variant="ghost" size="sm" onClick={() => {
            onChange({
              ...step,
              combatItems: [...(step.combatItems || []), { itemId: '', name: 'Item', text: '¡Usas el item!', damage: 10, consume: true }],
            });
          }}>
            + Item de combate
          </TerminalButton>
        </>
      )}

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default CombatStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 4px;
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

const StatField = styled(Field)`
  flex: 1;
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

const StatInput = styled.input`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const ActionsRow = styled.div`
  display: flex;
  gap: 4px;
`;

const ActionToggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 4px 8px;
  background: ${(p) => p.$active ? 'rgba(80,250,123,0.15)' : 'transparent'};
  border: 1px solid ${(p) => p.$active ? p.theme.terminal.success : p.theme.terminal.border};
  color: ${(p) => p.$active ? p.theme.terminal.success : p.theme.terminal.accentDim};
  cursor: pointer;
  border-radius: 2px;
`;

const Hint = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  font-style: italic;
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

const OutcomeBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OutcomeLabel = styled.span<{ $color: string }>`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.$color};
  font-weight: bold;
`;
