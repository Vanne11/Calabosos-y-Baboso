// editor/components/panels/steps/DialogStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { DialogStep } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalSelect from '../../shared/TerminalSelect';
import ConditionEditor from './ConditionEditor';
import { useEditorStore } from '../../../store/useEditorStore';

interface DialogStepEditorProps {
  step: DialogStep;
  onChange: (step: DialogStep) => void;
}

const DialogStepEditor: React.FC<DialogStepEditorProps> = ({ step, onChange }) => {
  const project = useEditorStore((s) => s.project);
  const characterOptions = Object.entries(project?.characters || {}).map(([id, char]) => ({
    value: id,
    label: `${char.name} (${id})`,
  }));

  const updateLine = (index: number, value: string) => {
    const newLines = [...step.lines];
    newLines[index] = value;
    onChange({ ...step, lines: newLines });
  };

  const addLine = () => {
    onChange({ ...step, lines: [...step.lines, '...'] });
  };

  const removeLine = (index: number) => {
    onChange({ ...step, lines: step.lines.filter((_, i) => i !== index) });
  };

  return (
    <Wrapper>
      <TerminalSelect
        label="Personaje"
        value={step.character}
        onChange={(value) => onChange({ ...step, character: value })}
        options={characterOptions.length > 0 ? characterOptions : [{ value: step.character, label: step.character }]}
      />

      <LinesSection>
        <LinesHeader>
          <LinesLabel>Líneas de diálogo</LinesLabel>
          <AddBtn onClick={addLine}>+ línea</AddBtn>
        </LinesHeader>
        {step.lines.map((line, i) => (
          <LineRow key={i}>
            <LineInput
              value={line}
              onChange={(e) => updateLine(i, e.target.value)}
              placeholder={`Línea ${i + 1}...`}
            />
            {step.lines.length > 1 && (
              <RemoveBtn onClick={() => removeLine(i)}>x</RemoveBtn>
            )}
          </LineRow>
        ))}
      </LinesSection>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default DialogStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const LinesSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LinesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const LinesLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.success};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 2px;

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
  }
`;

const LineRow = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
`;

const LineInput = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
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
