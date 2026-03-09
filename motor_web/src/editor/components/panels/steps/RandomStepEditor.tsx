// editor/components/panels/steps/RandomStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { RandomStep, RandomOutcome } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';
import TerminalButton from '../../shared/TerminalButton';

interface Props {
  step: RandomStep;
  onChange: (step: RandomStep) => void;
}

const RandomStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateOutcome = (i: number, patch: Partial<RandomOutcome>) => {
    const outcomes = step.outcomes.map((o, j) => (j === i ? { ...o, ...patch } : o));
    onChange({ ...step, outcomes });
  };

  return (
    <Wrapper>
      {step.outcomes.map((outcome, i) => (
        <OutcomeBlock key={i}>
          <OutcomeHeader>
            <OutcomeLabel>Resultado #{i + 1}</OutcomeLabel>
            <WeightRow>
              <WeightLabel>Peso:</WeightLabel>
              <WeightInput
                type="number"
                min={1}
                value={outcome.weight}
                onChange={(e) => updateOutcome(i, { weight: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </WeightRow>
            <DelBtn onClick={() => {
              onChange({ ...step, outcomes: step.outcomes.filter((_, j) => j !== i) });
            }}>x</DelBtn>
          </OutcomeHeader>

          <TerminalInput
            label="Texto"
            value={outcome.text}
            onChange={(text) => updateOutcome(i, { text })}
            multiline
            rows={2}
          />

          <GotoSelect
            label="Ir a"
            value={outcome.goto || ''}
            onChange={(goto) => updateOutcome(i, { goto: goto || undefined })}
          />

          <EffectsEditor
            effects={outcome.effects || {}}
            onChange={(effects) => updateOutcome(i, { effects: Object.keys(effects).length ? effects : undefined })}
          />
        </OutcomeBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({ ...step, outcomes: [...step.outcomes, { weight: 1, text: 'Otro resultado...' }] });
      }}>
        + Resultado
      </TerminalButton>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default RandomStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
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

const OutcomeHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const OutcomeLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
  flex: 1;
`;

const WeightRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const WeightLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
`;

const WeightInput = styled.input`
  width: 40px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 4px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  text-align: center;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;
