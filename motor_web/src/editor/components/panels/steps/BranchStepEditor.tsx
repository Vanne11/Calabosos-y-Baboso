// editor/components/panels/steps/BranchStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { BranchStep, BranchOption } from '../../../../types/game';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import TerminalButton from '../../shared/TerminalButton';

interface Props {
  step: BranchStep;
  onChange: (step: BranchStep) => void;
}

const BranchStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateBranch = (i: number, patch: Partial<BranchOption>) => {
    const branches = step.branches.map((b, j) => (j === i ? { ...b, ...patch } : b));
    onChange({ ...step, branches });
  };

  return (
    <Wrapper>
      <Hint>Evalúa condiciones en orden. La primera que se cumpla (o sin condición = default) navega al goto.</Hint>

      {step.branches.map((branch, i) => (
        <BranchBlock key={i}>
          <BranchHeader>
            <BranchLabel>#{i + 1} {!branch.condition ? '(default)' : ''}</BranchLabel>
            <DelBtn onClick={() => {
              onChange({ ...step, branches: step.branches.filter((_, j) => j !== i) });
            }}>x</DelBtn>
          </BranchHeader>

          <GotoSelect
            label="Ir a"
            value={branch.goto}
            onChange={(goto) => updateBranch(i, { goto })}
          />

          <ConditionEditor
            condition={branch.condition}
            onChange={(condition) => updateBranch(i, { condition })}
          />
        </BranchBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({ ...step, branches: [...step.branches, { goto: '' }] });
      }}>
        + Rama
      </TerminalButton>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default BranchStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Hint = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  font-style: italic;
`;

const BranchBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const BranchHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const BranchLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;
