// editor/components/panels/steps/ConditionEditor.tsx
// Reutilizable: editor de condiciones inline

import React, { useState } from 'react';
import styled from 'styled-components';
import type { StepCondition } from '../../../../types/game';
import TagInput from '../../shared/TagInput';
import TerminalButton from '../../shared/TerminalButton';
import { useProjectContext } from '../../../hooks/useProjectContext';

interface ConditionEditorProps {
  condition?: StepCondition;
  onChange: (condition: StepCondition | undefined) => void;
}

const ConditionEditor: React.FC<ConditionEditorProps> = ({ condition, onChange }) => {
  const [expanded, setExpanded] = useState(!!condition);
  const ctx = useProjectContext();

  if (!expanded) {
    return (
      <TerminalButton variant="ghost" size="sm" onClick={() => { setExpanded(true); onChange({}); }}>
        + Agregar condición
      </TerminalButton>
    );
  }

  const cond = condition || {};

  const updateStats = (key: string, value: string) => {
    const newStats = { ...(cond.stats || {}), [key]: value };
    onChange({ ...cond, stats: newStats });
  };

  const removeStats = (key: string) => {
    const { [key]: _, ...rest } = cond.stats || {};
    onChange({ ...cond, stats: Object.keys(rest).length ? rest : undefined });
  };

  const updateFlags = (key: string, value: boolean) => {
    const newFlags = { ...(cond.flags || {}), [key]: value };
    onChange({ ...cond, flags: newFlags });
  };

  const removeFlags = (key: string) => {
    const { [key]: _, ...rest } = cond.flags || {};
    onChange({ ...cond, flags: Object.keys(rest).length ? rest : undefined });
  };

  const removeCondition = () => {
    setExpanded(false);
    onChange(undefined);
  };

  return (
    <Wrapper>
      <Header>
        <Label>Condición</Label>
        <RemoveBtn onClick={removeCondition}>quitar</RemoveBtn>
      </Header>

      <SubSection>
        <SubLabel>
          Stats (ej: &gt;=50)
          <AddBtn onClick={() => updateStats('nueva_stat', '>=0')}>+</AddBtn>
        </SubLabel>
        <datalist id="cond-stats-list">
          {ctx.stats.map((s) => <option key={s} value={s} />)}
        </datalist>
        {Object.entries(cond.stats || {}).map(([key, val]) => (
          <Row key={key}>
            <Input
              value={key}
              list="cond-stats-list"
              onChange={(e) => {
                const { [key]: oldVal, ...rest } = cond.stats || {};
                onChange({ ...cond, stats: { ...rest, [e.target.value]: oldVal } });
              }}
            />
            <Input
              value={val}
              onChange={(e) => updateStats(key, e.target.value)}
              style={{ width: 70 }}
            />
            <DelBtn onClick={() => removeStats(key)}>x</DelBtn>
          </Row>
        ))}
      </SubSection>

      <SubSection>
        <SubLabel>
          Flags
          <AddBtn onClick={() => updateFlags('flag', true)}>+</AddBtn>
        </SubLabel>
        <datalist id="cond-flags-list">
          {ctx.flags.map((f) => <option key={f} value={f} />)}
        </datalist>
        {Object.entries(cond.flags || {}).map(([key, val]) => (
          <Row key={key}>
            <Input
              value={key}
              list="cond-flags-list"
              onChange={(e) => {
                const { [key]: oldVal, ...rest } = cond.flags || {};
                onChange({ ...cond, flags: { ...rest, [e.target.value]: oldVal } });
              }}
            />
            <Toggle onClick={() => updateFlags(key, !val)} $on={val}>
              {val ? 'true' : 'false'}
            </Toggle>
            <DelBtn onClick={() => removeFlags(key)}>x</DelBtn>
          </Row>
        ))}
      </SubSection>

      <TagInput
        label="Items requeridos"
        tags={cond.inventory || []}
        onChange={(inv) => onChange({ ...cond, inventory: inv.length ? inv : undefined })}
      />

      <TagInput
        label="Escenas visitadas"
        tags={cond.visitedScenes || []}
        onChange={(vs) => onChange({ ...cond, visitedScenes: vs.length ? vs : undefined })}
      />

      <TagInput
        label="Escenas no visitadas"
        tags={cond.unvisitedScenes || []}
        onChange={(us) => onChange({ ...cond, unvisitedScenes: us.length ? us : undefined })}
      />
    </Wrapper>
  );
};

export default ConditionEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: rgba(198, 125, 255, 0.05);
  border: 1px dashed ${(p) => p.theme.terminal.border};
  border-radius: 3px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  text-decoration: underline;
`;

const SubSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const SubLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.success};
  cursor: pointer;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 2px;
  font-family: 'Courier New', monospace;
`;

const Row = styled.div`
  display: flex;
  gap: 3px;
  align-items: center;
`;

const Input = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 5px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
`;

const Toggle = styled.button<{ $on: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 2px 6px;
  background: ${(p) => (p.$on ? 'rgba(80,250,123,0.1)' : 'rgba(255,85,85,0.1)')};
  border: 1px solid ${(p) => (p.$on ? p.theme.terminal.success : p.theme.terminal.error)};
  color: ${(p) => (p.$on ? p.theme.terminal.success : p.theme.terminal.error)};
  cursor: pointer;
  border-radius: 2px;
  min-width: 45px;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-size: 11px;
  font-family: 'Courier New', monospace;
`;
