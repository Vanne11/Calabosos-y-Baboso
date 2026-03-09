// editor/components/panels/steps/SoundStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { SoundStep } from '../../../../types/game';
import AssetPicker from '../../shared/AssetPicker';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: SoundStep;
  onChange: (step: SoundStep) => void;
}

const SoundStepEditor: React.FC<Props> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <AssetPicker
        label="Archivo de audio"
        value={step.src}
        onChange={(src) => onChange({ ...step, src })}
        accept="audio"
      />

      <Field>
        <Label>Volumen (0-1)</Label>
        <NumInput
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={step.volume ?? 1}
          onChange={(e) => onChange({ ...step, volume: parseFloat(e.target.value) || 1 })}
        />
      </Field>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default SoundStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
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
