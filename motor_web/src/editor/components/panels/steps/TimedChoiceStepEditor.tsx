// editor/components/panels/steps/TimedChoiceStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { TimedChoiceStep, ChoiceOption } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: TimedChoiceStep;
  onChange: (step: TimedChoiceStep) => void;
}

const TimedChoiceStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateOption = (index: number, patch: Partial<ChoiceOption>) => {
    const options = step.options.map((o, i) => (i === index ? { ...o, ...patch } : o));
    onChange({ ...step, options });
  };

  return (
    <Wrapper>
      <Row>
        <Field>
          <Label>Duración (ms)</Label>
          <NumInput type="number" min={1000} step={1000} value={step.duration}
            onChange={(e) => onChange({ ...step, duration: parseInt(e.target.value) || 5000 })} />
        </Field>
        <Field>
          <Label>Opción por defecto</Label>
          <NumInput type="number" min={0} max={step.options.length - 1} value={step.defaultIndex}
            onChange={(e) => onChange({ ...step, defaultIndex: parseInt(e.target.value) || 0 })} />
        </Field>
      </Row>
      <Hint>{(step.duration / 1000).toFixed(1)}s para decidir. Si se agota: opción #{step.defaultIndex + 1}</Hint>

      <TerminalInput
        label="Texto al agotar tiempo"
        value={step.timeoutText || ''}
        onChange={(timeoutText) => onChange({ ...step, timeoutText: timeoutText || undefined })}
        placeholder="¡Demasiado lento!"
      />

      <SubTitle>Opciones</SubTitle>
      {step.options.map((opt, i) => (
        <OptionBlock key={i} $isDefault={i === step.defaultIndex}>
          <OptionHeader>
            <OptionLabel>
              Opción #{i + 1}
              {i === step.defaultIndex && <DefaultBadge>DEFAULT</DefaultBadge>}
            </OptionLabel>
            {step.options.length > 1 && (
              <DelBtn onClick={() => {
                const newOpts = step.options.filter((_, j) => j !== i);
                const newDefault = step.defaultIndex >= newOpts.length ? 0 : step.defaultIndex;
                onChange({ ...step, options: newOpts, defaultIndex: newDefault });
              }}>x</DelBtn>
            )}
          </OptionHeader>
          <TerminalInput label="Texto" value={opt.text} onChange={(text) => updateOption(i, { text })} />
          <GotoSelect label="Ir a" value={opt.goto || ''} onChange={(goto) => updateOption(i, { goto: goto || undefined })} />
          <EffectsEditor effects={opt.effects || {}} onChange={(effects) => updateOption(i, { effects: Object.keys(effects).length ? effects : undefined })} />
          <ConditionEditor condition={opt.condition} onChange={(condition) => updateOption(i, { condition })} />
        </OptionBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        onChange({ ...step, options: [...step.options, { text: 'Nueva opción', goto: '' }] });
      }}>
        + Opción
      </TerminalButton>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default TimedChoiceStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SubTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.warning};
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 4px;
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

const Hint = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  font-style: italic;
`;

const OptionBlock = styled.div<{ $isDefault: boolean }>`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => (p.$isDefault ? p.theme.terminal.warning : p.theme.terminal.border)};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const OptionLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const DefaultBadge = styled.span`
  font-size: 8px;
  padding: 1px 4px;
  background: rgba(241, 250, 140, 0.2);
  color: ${(p) => p.theme.terminal.warning};
  border-radius: 2px;
`;

const DelBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
`;
