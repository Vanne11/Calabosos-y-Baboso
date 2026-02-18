// editor/components/panels/steps/InputStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { InputStep } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import ConditionEditor from './ConditionEditor';

interface InputStepEditorProps {
  step: InputStep;
  onChange: (step: InputStep) => void;
}

const InputStepEditor: React.FC<InputStepEditorProps> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <TerminalInput
        label="Prompt"
        value={step.prompt}
        onChange={(prompt) => onChange({ ...step, prompt })}
        placeholder="¿Cómo te llamas?"
      />

      <TerminalInput
        label="Guardar como (saveAs)"
        value={step.saveAs}
        onChange={(saveAs) => onChange({ ...step, saveAs })}
        placeholder="player_name"
      />

      <TerminalInput
        label="Ir a (goto)"
        value={step.goto || ''}
        onChange={(goto) => onChange({ ...step, goto: goto || undefined })}
        placeholder="scene_id"
      />

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default InputStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;
