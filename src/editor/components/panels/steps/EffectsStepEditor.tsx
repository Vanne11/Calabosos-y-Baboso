// editor/components/panels/steps/EffectsStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { EffectsStep } from '../../../../types/game';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface EffectsStepEditorProps {
  step: EffectsStep;
  onChange: (step: EffectsStep) => void;
}

const EffectsStepEditor: React.FC<EffectsStepEditorProps> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <EffectsEditor
        label="Efectos a aplicar"
        effects={step.effects}
        onChange={(effects) => onChange({ ...step, effects })}
      />

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default EffectsStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
