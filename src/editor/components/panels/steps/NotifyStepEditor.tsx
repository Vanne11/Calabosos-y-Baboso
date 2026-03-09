// editor/components/panels/steps/NotifyStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { NotifyStep } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';

interface Props {
  step: NotifyStep;
  onChange: (step: NotifyStep) => void;
}

const STYLES = [
  { value: 'achievement', label: 'Logro', color: '#50fa7b' },
  { value: 'warning', label: 'Aviso', color: '#f1fa8c' },
  { value: 'info', label: 'Info', color: '#8be9fd' },
  { value: 'discovery', label: 'Descubrimiento', color: '#bd93f9' },
] as const;

const NotifyStepEditor: React.FC<Props> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <Row>
        <Field>
          <Label>Estilo</Label>
          <StyleSelect
            value={step.style}
            onChange={(e) => onChange({ ...step, style: e.target.value as NotifyStep['style'] })}
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </StyleSelect>
        </Field>
        <TerminalInput
          label="Icono (emoji)"
          value={step.icon || ''}
          onChange={(icon) => onChange({ ...step, icon: icon || undefined })}
          placeholder=":star:"
        />
      </Row>

      <TerminalInput
        label="Título"
        value={step.title}
        onChange={(title) => onChange({ ...step, title })}
      />

      <TerminalInput
        label="Texto"
        value={step.text}
        onChange={(text) => onChange({ ...step, text })}
        multiline
        rows={2}
      />

      <EffectsEditor
        effects={step.effects || {}}
        onChange={(effects) => onChange({ ...step, effects: Object.keys(effects).length ? effects : undefined })}
      />

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default NotifyStepEditor;

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
