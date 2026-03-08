// editor/components/panels/steps/CheckStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { CheckStep } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';
import { useProjectContext } from '../../../hooks/useProjectContext';

interface Props {
  step: CheckStep;
  onChange: (step: CheckStep) => void;
}

const CheckStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const { stats } = useProjectContext();

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description}
        onChange={(description) => onChange({ ...step, description })}
        placeholder="Intentas percibir la trampa..."
      />

      <Row>
        <Field>
          <Label>Stat</Label>
          <StatInput
            value={step.stat}
            onChange={(e) => onChange({ ...step, stat: e.target.value })}
            list="check-stats"
          />
          <datalist id="check-stats">
            {stats.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
        <Field>
          <Label>Umbral</Label>
          <StatInput
            value={step.threshold}
            onChange={(e) => onChange({ ...step, threshold: e.target.value })}
            placeholder=">=50"
          />
        </Field>
      </Row>

      <OutcomeBlock>
        <OutcomeLabel $color="#50fa7b">Éxito</OutcomeLabel>
        <TerminalInput
          label="Texto"
          value={step.success.text}
          onChange={(text) => onChange({ ...step, success: { ...step.success, text } })}
        />
        <GotoSelect
          label="Ir a"
          value={step.success.goto || ''}
          onChange={(goto) => onChange({ ...step, success: { ...step.success, goto: goto || undefined } })}
        />
        <EffectsEditor
          effects={step.success.effects || {}}
          onChange={(effects) => onChange({ ...step, success: { ...step.success, effects: Object.keys(effects).length ? effects : undefined } })}
        />
      </OutcomeBlock>

      <OutcomeBlock>
        <OutcomeLabel $color="#ff5555">Fallo</OutcomeLabel>
        <TerminalInput
          label="Texto"
          value={step.failure.text}
          onChange={(text) => onChange({ ...step, failure: { ...step.failure, text } })}
        />
        <GotoSelect
          label="Ir a"
          value={step.failure.goto || ''}
          onChange={(goto) => onChange({ ...step, failure: { ...step.failure, goto: goto || undefined } })}
        />
        <EffectsEditor
          effects={step.failure.effects || {}}
          onChange={(effects) => onChange({ ...step, failure: { ...step.failure, effects: Object.keys(effects).length ? effects : undefined } })}
        />
      </OutcomeBlock>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default CheckStepEditor;

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
  flex: 1;
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
