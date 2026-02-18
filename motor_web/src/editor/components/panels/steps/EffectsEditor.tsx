// editor/components/panels/steps/EffectsEditor.tsx
// Reutilizable: editor de modificadores (stats, flags, inventory)

import React from 'react';
import styled from 'styled-components';
import type { Effects } from '../../../../types/game';
import TagInput from '../../shared/TagInput';

interface EffectsEditorProps {
  effects: Effects;
  onChange: (effects: Effects) => void;
  label?: string;
}

const EffectsEditor: React.FC<EffectsEditorProps> = ({ effects, onChange, label }) => {
  const stats = effects.stats || {};
  const flags = effects.flags || {};
  const inventory = effects.inventory || [];
  const removeInventory = effects.removeInventory || [];

  const updateStat = (key: string, value: string) => {
    const numVal = Number(value);
    const newStats = { ...stats, [key]: isNaN(numVal) ? value : numVal };
    onChange({ ...effects, stats: newStats });
  };

  const removeStat = (key: string) => {
    const { [key]: _, ...rest } = stats;
    onChange({ ...effects, stats: Object.keys(rest).length ? rest : undefined });
  };

  const addStat = () => {
    onChange({ ...effects, stats: { ...stats, nueva_stat: 0 } });
  };

  const updateFlag = (key: string, value: boolean) => {
    onChange({ ...effects, flags: { ...flags, [key]: value } });
  };

  const removeFlag = (key: string) => {
    const { [key]: _, ...rest } = flags;
    onChange({ ...effects, flags: Object.keys(rest).length ? rest : undefined });
  };

  const addFlag = () => {
    onChange({ ...effects, flags: { ...flags, nuevo_flag: true } });
  };

  return (
    <Wrapper>
      {label && <SectionLabel>{label}</SectionLabel>}

      <SubSection>
        <SubLabel>
          Stats
          <AddBtn onClick={addStat}>+</AddBtn>
        </SubLabel>
        {Object.entries(stats).map(([key, val]) => (
          <StatRow key={key}>
            <StatInput
              value={key}
              onChange={(e) => {
                const { [key]: oldVal, ...rest } = stats;
                onChange({ ...effects, stats: { ...rest, [e.target.value]: oldVal } });
              }}
              placeholder="stat"
            />
            <StatInput
              value={String(val)}
              onChange={(e) => updateStat(key, e.target.value)}
              placeholder="valor"
              style={{ width: 60 }}
            />
            <RemoveBtn onClick={() => removeStat(key)}>x</RemoveBtn>
          </StatRow>
        ))}
      </SubSection>

      <SubSection>
        <SubLabel>
          Flags
          <AddBtn onClick={addFlag}>+</AddBtn>
        </SubLabel>
        {Object.entries(flags).map(([key, val]) => (
          <StatRow key={key}>
            <StatInput
              value={key}
              onChange={(e) => {
                const { [key]: oldVal, ...rest } = flags;
                onChange({ ...effects, flags: { ...rest, [e.target.value]: oldVal } });
              }}
              placeholder="flag"
            />
            <FlagToggle onClick={() => updateFlag(key, !val)} $active={val}>
              {val ? 'true' : 'false'}
            </FlagToggle>
            <RemoveBtn onClick={() => removeFlag(key)}>x</RemoveBtn>
          </StatRow>
        ))}
      </SubSection>

      <TagInput
        label="Inventario (agregar)"
        tags={inventory}
        onChange={(inv) => onChange({ ...effects, inventory: inv.length ? inv : undefined })}
      />

      <TagInput
        label="Inventario (quitar)"
        tags={removeInventory}
        onChange={(inv) => onChange({ ...effects, removeInventory: inv.length ? inv : undefined })}
      />
    </Wrapper>
  );
};

export default EffectsEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
`;

const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const SubLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.success};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 0 5px;
  border-radius: 2px;

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
  }
`;

const StatRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const StatInput = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 3px 6px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;

const FlagToggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 3px 8px;
  background: ${(p) => (p.$active ? 'rgba(80, 250, 123, 0.15)' : 'rgba(255, 85, 85, 0.15)')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.error)};
  color: ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.error)};
  cursor: pointer;
  border-radius: 2px;
  min-width: 50px;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 2px 4px;

  &:hover {
    opacity: 0.7;
  }
`;
