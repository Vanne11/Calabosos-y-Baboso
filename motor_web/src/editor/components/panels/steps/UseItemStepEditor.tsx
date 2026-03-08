// editor/components/panels/steps/UseItemStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { UseItemStep, UseItemTarget, UseItemAccept } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: UseItemStep;
  onChange: (step: UseItemStep) => void;
}

const UseItemStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const updateTarget = (index: number, patch: Partial<UseItemTarget>) => {
    const targets = step.targets.map((t, i) => (i === index ? { ...t, ...patch } : t));
    onChange({ ...step, targets });
  };

  const updateAccept = (targetIndex: number, acceptIndex: number, patch: Partial<UseItemAccept>) => {
    const target = step.targets[targetIndex];
    const accepts = target.accepts.map((a, i) => (i === acceptIndex ? { ...a, ...patch } : a));
    updateTarget(targetIndex, { accepts });
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description || ''}
        onChange={(description) => onChange({ ...step, description: description || undefined })}
        placeholder="Ves varios objetos interesantes..."
      />
      <TerminalInput
        label="Texto item no válido"
        value={step.failText || ''}
        onChange={(failText) => onChange({ ...step, failText: failText || undefined })}
        placeholder="No puedes usar eso aquí."
      />
      <TerminalInput
        label="Texto botón salir"
        value={step.exitText || ''}
        onChange={(exitText) => onChange({ ...step, exitText: exitText || undefined })}
        placeholder="Dejar de intentar"
      />

      <SubTitle>Objetivos</SubTitle>
      {step.targets.map((target, ti) => (
        <TargetBlock key={ti}>
          <TargetHeader>
            <TargetLabel>{target.label || `Objetivo #${ti + 1}`}</TargetLabel>
            <DelBtn onClick={() => onChange({ ...step, targets: step.targets.filter((_, i) => i !== ti) })}>x</DelBtn>
          </TargetHeader>
          <TerminalInput label="ID" value={target.id} onChange={(id) => updateTarget(ti, { id })} placeholder="cerradura" />
          <TerminalInput label="Etiqueta" value={target.label} onChange={(label) => updateTarget(ti, { label })} placeholder="La cerradura oxidada" />
          <TerminalInput label="Texto por defecto" value={target.defaultText || ''} onChange={(defaultText) => updateTarget(ti, { defaultText: defaultText || undefined })} placeholder="No parece funcionar con eso..." />

          <AcceptTitle>Items aceptados</AcceptTitle>
          {target.accepts.map((accept, ai) => (
            <AcceptBlock key={ai}>
              <Row>
                <TerminalInput label="Item ID" value={accept.itemId} onChange={(itemId) => updateAccept(ti, ai, { itemId })} placeholder="llave_maestra" />
                <Toggle $active={accept.consume !== false} onClick={() => updateAccept(ti, ai, { consume: accept.consume === false ? undefined : false })}>
                  {accept.consume !== false ? 'Consumir' : 'Mantener'}
                </Toggle>
                <SmallDel onClick={() => updateTarget(ti, { accepts: target.accepts.filter((_, i) => i !== ai) })}>x</SmallDel>
              </Row>
              <TerminalInput label="Texto al usar" value={accept.text} onChange={(text) => updateAccept(ti, ai, { text })} multiline rows={2} placeholder="¡La llave encaja perfectamente!" />
              <GotoSelect label="Ir a" value={accept.goto || ''} onChange={(goto) => updateAccept(ti, ai, { goto: goto || undefined })} />
              <EffectsEditor effects={accept.effects || {}} onChange={(effects) => updateAccept(ti, ai, { effects: Object.keys(effects).length ? effects : undefined })} />
            </AcceptBlock>
          ))}
          <TerminalButton variant="ghost" size="sm" onClick={() => {
            updateTarget(ti, { accepts: [...target.accepts, { itemId: '', text: '¡Funciona!', consume: true }] });
          }}>
            + Item aceptado
          </TerminalButton>
        </TargetBlock>
      ))}

      <TerminalButton variant="ghost" size="sm" onClick={() => {
        const id = `target_${step.targets.length + 1}`;
        onChange({
          ...step,
          targets: [...step.targets, { id, label: 'Nuevo objetivo', accepts: [], defaultText: 'Eso no funciona aquí.' }],
        });
      }}>
        + Objetivo
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

export default UseItemStepEditor;

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

const AcceptTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.success};
  text-transform: uppercase;
  margin-top: 2px;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const TargetBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const AcceptBlock = styled.div`
  padding: 4px 6px;
  background: rgba(80, 250, 123, 0.05);
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TargetHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TargetLabel = styled.span`
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

const SmallDel = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
`;

const Toggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 2px 6px;
  background: ${(p) => (p.$active ? 'rgba(80,250,123,0.15)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.border)};
  color: ${(p) => (p.$active ? p.theme.terminal.success : p.theme.terminal.accentDim)};
  cursor: pointer;
  border-radius: 2px;
`;
