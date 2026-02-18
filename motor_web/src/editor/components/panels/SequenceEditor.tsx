// editor/components/panels/SequenceEditor.tsx
// Lista reordenable de steps con editores inline

import React from 'react';
import styled from 'styled-components';
import type { SequenceStep } from '../../../types/game';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalButton from '../shared/TerminalButton';
import TerminalPanel from '../shared/TerminalPanel';
import DialogStepEditor from './steps/DialogStepEditor';
import ChoiceStepEditor from './steps/ChoiceStepEditor';
import DiceStepEditor from './steps/DiceStepEditor';
import InputStepEditor from './steps/InputStepEditor';
import EffectsStepEditor from './steps/EffectsStepEditor';

interface SequenceEditorProps {
  nodeId: string;
  steps: SequenceStep[];
}

const STEP_LABELS: Record<SequenceStep['type'], string> = {
  dialog: 'Diálogo',
  choice: 'Opciones',
  dice: 'Dado',
  input: 'Input',
  effects: 'Efectos',
};

const STEP_COLORS: Record<SequenceStep['type'], string> = {
  dialog: '#8be9fd',
  choice: '#c67dff',
  dice: '#ffb86c',
  input: '#50fa7b',
  effects: '#f1fa8c',
};

const SequenceEditor: React.FC<SequenceEditorProps> = ({ nodeId, steps }) => {
  const updateStep = useEditorStore((s) => s.updateStep);
  const addStep = useEditorStore((s) => s.addStep);
  const removeStep = useEditorStore((s) => s.removeStep);
  const moveStep = useEditorStore((s) => s.moveStep);

  const renderStepEditor = (step: SequenceStep, index: number) => {
    const handleChange = (updated: SequenceStep) => {
      updateStep(nodeId, index, updated);
    };

    switch (step.type) {
      case 'dialog':
        return <DialogStepEditor step={step} onChange={handleChange as any} />;
      case 'choice':
        return <ChoiceStepEditor step={step} onChange={handleChange as any} />;
      case 'dice':
        return <DiceStepEditor step={step} onChange={handleChange as any} />;
      case 'input':
        return <InputStepEditor step={step} onChange={handleChange as any} />;
      case 'effects':
        return <EffectsStepEditor step={step} onChange={handleChange as any} />;
    }
  };

  return (
    <Wrapper>
      <SectionHeader>
        <SectionTitle>Secuencia ({steps.length} pasos)</SectionTitle>
      </SectionHeader>

      {steps.map((step, i) => (
        <StepWrapper key={i}>
          <TerminalPanel
            title={`#${i + 1} ${STEP_LABELS[step.type]}`}
            actions={
              <StepActions>
                <MoveBtn
                  onClick={() => moveStep(nodeId, i, i - 1)}
                  disabled={i === 0}
                  title="Mover arriba"
                >
                  ↑
                </MoveBtn>
                <MoveBtn
                  onClick={() => moveStep(nodeId, i, i + 1)}
                  disabled={i === steps.length - 1}
                  title="Mover abajo"
                >
                  ↓
                </MoveBtn>
                <DeleteBtn onClick={() => removeStep(nodeId, i)} title="Eliminar paso">
                  x
                </DeleteBtn>
              </StepActions>
            }
          >
            <StepIndicator $color={STEP_COLORS[step.type]} />
            {renderStepEditor(step, i)}
          </TerminalPanel>
        </StepWrapper>
      ))}

      <AddStepRow>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'dialog')}>
          + Diálogo
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'choice')}>
          + Opciones
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'dice')}>
          + Dado
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'input')}>
          + Input
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'effects')}>
          + Efectos
        </TerminalButton>
      </AddStepRow>
    </Wrapper>
  );
};

export default SequenceEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const StepWrapper = styled.div`
  position: relative;
`;

const StepIndicator = styled.div<{ $color: string }>`
  position: absolute;
  left: -10px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: ${(p) => p.$color};
  border-radius: 2px;
`;

const StepActions = styled.div`
  display: flex;
  gap: 2px;
`;

const MoveBtn = styled.button<{ disabled?: boolean }>`
  background: none;
  border: none;
  color: ${(p) => (p.disabled ? p.theme.terminal.border : p.theme.terminal.accentDim)};
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 0 3px;

  &:hover:not(:disabled) {
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 0 3px;

  &:hover {
    opacity: 0.7;
  }
`;

const AddStepRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
`;
