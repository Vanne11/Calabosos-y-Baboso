// editor/components/panels/steps/ExamineStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { ExamineStep, ExamineSubject } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: ExamineStep;
  onChange: (step: ExamineStep) => void;
}

const ExamineStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateSubject = (index: number, patch: Partial<ExamineSubject>) => {
    const subjects = step.subjects.map((s, i) => (i === index ? { ...s, ...patch } : s));
    onChange({ ...step, subjects });
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description || ''}
        onChange={(description) => onChange({ ...step, description: description || undefined })}
        placeholder="Miras a tu alrededor..."
      />
      <TerminalInput
        label="Texto del botón salir"
        value={step.exitText || ''}
        onChange={(exitText) => onChange({ ...step, exitText: exitText || undefined })}
        placeholder="Seguir adelante"
      />

      <SubTitle>Objetos examinables</SubTitle>
      {step.subjects.map((subject, i) => (
        <SubjectBlock key={i}>
          <SubjectHeader>
            <SubjectLabel>#{i + 1} {subject.label || '...'}</SubjectLabel>
            <Row>
              <Toggle $active={!!subject.oneTime} onClick={() => updateSubject(i, { oneTime: subject.oneTime ? undefined : true })}>
                {subject.oneTime ? '1 vez' : '∞'}
              </Toggle>
              <DelBtn onClick={() => onChange({ ...step, subjects: step.subjects.filter((_, j) => j !== i) })}>
                x
              </DelBtn>
            </Row>
          </SubjectHeader>
          <TerminalInput label="ID" value={subject.id} onChange={(id) => updateSubject(i, { id })} placeholder="estanteria" />
          <TerminalInput label="Etiqueta" value={subject.label} onChange={(label) => updateSubject(i, { label })} placeholder="La estantería polvorienta" />
          <TerminalInput label="Texto al examinar" value={subject.text} onChange={(text) => updateSubject(i, { text })} multiline rows={3} placeholder="Entre los libros encuentras..." />
          <EffectsEditor
            effects={subject.effects || {}}
            onChange={(effects) => updateSubject(i, { effects: Object.keys(effects).length ? effects : undefined })}
          />
          <ConditionEditor
            condition={subject.condition}
            onChange={(condition) => updateSubject(i, { condition })}
          />
        </SubjectBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        const id = `subject_${step.subjects.length + 1}`;
        onChange({
          ...step,
          subjects: [...step.subjects, { id, label: 'Nuevo objeto', text: 'No ves nada especial.' }],
        });
      }}>
        + Objeto examinable
      </TerminalButton>

      <GotoSelect
        label="Ir a (al salir)"
        value={step.goto || ''}
        onChange={(goto) => onChange({ ...step, goto: goto || undefined })}
      />
      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default ExamineStepEditor;

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
  gap: 4px;
  align-items: center;
`;

const SubjectBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SubjectHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SubjectLabel = styled.span`
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

const Toggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 2px 6px;
  background: ${(p) => (p.$active ? 'rgba(241,250,140,0.15)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.warning : p.theme.terminal.border)};
  color: ${(p) => (p.$active ? p.theme.terminal.warning : p.theme.terminal.accentDim)};
  cursor: pointer;
  border-radius: 2px;
`;
