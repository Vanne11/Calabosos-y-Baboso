// editor/components/panels/steps/ChoiceStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { ChoiceStep, ChoiceOption } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';
import TagInput from '../../shared/TagInput';

interface ChoiceStepEditorProps {
  step: ChoiceStep;
  onChange: (step: ChoiceStep) => void;
}

const ChoiceStepEditor: React.FC<ChoiceStepEditorProps> = ({ step, onChange }) => {
  const updateOption = (index: number, opt: ChoiceOption) => {
    const newOptions = [...step.options];
    newOptions[index] = opt;
    onChange({ ...step, options: newOptions });
  };

  const addOption = () => {
    onChange({
      ...step,
      options: [...step.options, { text: 'Nueva opción', goto: '' }],
    });
  };

  const removeOption = (index: number) => {
    onChange({ ...step, options: step.options.filter((_, i) => i !== index) });
  };

  // Acción libre: se conserva lo que no se edita aquí (consecuencias propias, maxUses...)
  const free = typeof step.freeText === 'object' ? step.freeText : {};
  const setSituation = (situation: string) => {
    const { situation: _previous, ...rest } = free;
    onChange({ ...step, freeText: situation ? { ...rest, situation } : Object.keys(rest).length ? rest : true });
  };

  return (
    <Wrapper>
      <Header>
        <Label>Opciones</Label>
        <AddBtn onClick={addOption}>+ opción</AddBtn>
      </Header>

      {step.options.map((opt, i) => (
        <OptionBlock key={i}>
          <OptionHeader>
            <OptionNum>[{i + 1}]</OptionNum>
            <RemoveBtn onClick={() => removeOption(i)}>x</RemoveBtn>
          </OptionHeader>

          <TerminalInput
            label="Texto"
            value={opt.text}
            onChange={(text) => updateOption(i, { ...opt, text })}
          />

          <GotoSelect
            label="Ir a (goto)"
            value={opt.goto || ''}
            onChange={(goto) => updateOption(i, { ...opt, goto: goto || undefined })}
          />

          <TagInput
            label="Etiquetas de perfil (ej: cobarde, amable)"
            tags={opt.tags || []}
            onChange={(tags) => updateOption(i, { ...opt, tags: tags.length ? tags : undefined })}
            placeholder="cobarde"
          />

          <EffectsEditor
            label="Efectos"
            effects={opt.effects || {}}
            onChange={(effects) =>
              updateOption(i, { ...opt, effects: Object.keys(effects).length ? effects : undefined })
            }
          />

          <ConditionEditor
            condition={opt.condition}
            onChange={(condition) => updateOption(i, { ...opt, condition })}
          />
        </OptionBlock>
      ))}

      <Check>
        <input
          type="checkbox"
          checked={!!step.freeText}
          onChange={(e) => onChange({ ...step, freeText: e.target.checked ? true : undefined })}
        />
        Acción libre con IA («Hacer otra cosa…»)
      </Check>
      {step.freeText && (
        <TerminalInput
          label="Situación para la IA (vacío = nombre y descripción del escenario)"
          value={free.situation ?? ''}
          onChange={setSituation}
        />
      )}

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default ChoiceStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Label = styled.span`
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

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.text};
`;

const OptionBlock = styled.div`
  padding: 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
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

const OptionNum = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 13px;
`;
