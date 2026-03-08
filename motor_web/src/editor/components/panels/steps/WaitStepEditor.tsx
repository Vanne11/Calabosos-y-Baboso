// editor/components/panels/steps/WaitStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { WaitStep } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: WaitStep;
  onChange: (step: WaitStep) => void;
}

const WaitStepEditor: React.FC<Props> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <TerminalInput
        label="Texto"
        value={step.text}
        onChange={(text) => onChange({ ...step, text })}
        placeholder="La puerta se abre lentamente..."
      />

      <Row>
        <Field>
          <Label>Duración (ms)</Label>
          <NumInput
            type="number"
            min={500}
            step={500}
            value={step.duration}
            onChange={(e) => onChange({ ...step, duration: parseInt(e.target.value) || 2000 })}
          />
        </Field>
        <Field>
          <Label>Estilo</Label>
          <StyleSelect
            value={step.style}
            onChange={(e) => onChange({ ...step, style: e.target.value as WaitStep['style'] })}
          >
            <option value="dots">Puntos (...)</option>
            <option value="typing">Escribiendo</option>
            <option value="fade">Fade</option>
          </StyleSelect>
        </Field>
      </Row>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default WaitStepEditor;

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
  width: 80px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
`;

const StyleSelect = styled.select`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  cursor: pointer;
`;
