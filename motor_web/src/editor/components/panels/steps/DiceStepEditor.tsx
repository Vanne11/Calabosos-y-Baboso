// editor/components/panels/steps/DiceStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { DiceStep, DiceOutcome } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface DiceStepEditorProps {
  step: DiceStep;
  onChange: (step: DiceStep) => void;
}

const DiceStepEditor: React.FC<DiceStepEditorProps> = ({ step, onChange }) => {
  const updateOutcome = (
    key: 'success' | 'failure' | 'critical_success' | 'critical_failure',
    outcome: DiceOutcome | undefined
  ) => {
    const newResults = { ...step.results };
    if (outcome) {
      newResults[key] = outcome;
    } else {
      delete newResults[key];
    }
    onChange({ ...step, results: newResults });
  };

  const renderOutcome = (
    label: string,
    key: 'success' | 'failure' | 'critical_success' | 'critical_failure',
    required: boolean
  ) => {
    const outcome = step.results[key];

    if (!outcome && !required) {
      return (
        <AddOutcomeBtn onClick={() => updateOutcome(key, { text: '', goto: '' })}>
          + {label}
        </AddOutcomeBtn>
      );
    }

    if (!outcome) return null;

    return (
      <OutcomeBlock>
        <OutcomeHeader>
          <OutcomeLabel>{label}</OutcomeLabel>
          {!required && (
            <RemoveBtn onClick={() => updateOutcome(key, undefined)}>x</RemoveBtn>
          )}
        </OutcomeHeader>
        <TerminalInput
          label="Texto"
          value={outcome.text}
          onChange={(text) => updateOutcome(key, { ...outcome, text })}
        />
        <TerminalInput
          label="Ir a (goto)"
          value={outcome.goto || ''}
          onChange={(goto) => updateOutcome(key, { ...outcome, goto: goto || undefined })}
          placeholder="scene_id"
        />
        <EffectsEditor
          effects={outcome.effects || {}}
          onChange={(effects) =>
            updateOutcome(key, {
              ...outcome,
              effects: Object.keys(effects).length ? effects : undefined,
            })
          }
        />
      </OutcomeBlock>
    );
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description}
        onChange={(description) => onChange({ ...step, description })}
        placeholder="Tirada de..."
      />

      <Row>
        <TerminalInput
          label="Stat"
          value={step.stat}
          onChange={(stat) => onChange({ ...step, stat })}
          placeholder="will_to_live"
        />
        <SmallInput>
          <TerminalInput
            label="Dificultad"
            value={String(step.difficulty)}
            onChange={(v) => onChange({ ...step, difficulty: Number(v) || 0 })}
          />
        </SmallInput>
        <SmallInput>
          <TerminalInput
            label="Caras"
            value={String(step.faces)}
            onChange={(v) => onChange({ ...step, faces: Number(v) || 20 })}
          />
        </SmallInput>
      </Row>

      <ResultsSection>
        <ResultsLabel>Resultados</ResultsLabel>
        {renderOutcome('Éxito Crítico', 'critical_success', false)}
        {renderOutcome('Éxito', 'success', true)}
        {renderOutcome('Fallo', 'failure', true)}
        {renderOutcome('Fallo Crítico', 'critical_failure', false)}
      </ResultsSection>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default DiceStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
`;

const SmallInput = styled.div`
  width: 80px;
  flex-shrink: 0;
`;

const ResultsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ResultsLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const OutcomeBlock = styled.div`
  padding: 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OutcomeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OutcomeLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const AddOutcomeBtn = styled.button`
  background: none;
  border: 1px dashed ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 3px;
  text-align: left;

  &:hover {
    border-color: ${(p) => p.theme.terminal.accent};
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 13px;
`;
