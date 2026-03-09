// editor/components/panels/steps/LevelUpStepEditor.tsx
// Editor para el step de subir nivel

import React from 'react';
import styled from 'styled-components';
import type { LevelUpStep } from '../../../../types/game';
import GotoSelect from '../../shared/GotoSelect';

interface Props {
  step: LevelUpStep;
  onChange: (step: LevelUpStep) => void;
}

const LevelUpStepEditor: React.FC<Props> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <Row>
        <Label>Personaje (vacío = protagonista):</Label>
        <Input
          value={step.characterId || ''}
          onChange={(e) => onChange({ ...step, characterId: e.target.value || undefined })}
          placeholder="ID del personaje"
        />
      </Row>

      <Row>
        <Label>Descripción:</Label>
        <Input
          value={step.description || ''}
          onChange={(e) => onChange({ ...step, description: e.target.value || undefined })}
          placeholder="¡Has ganado experiencia!"
        />
      </Row>

      <Row>
        <Label>Puntos de habilidad:</Label>
        <SmallInput
          type="number"
          min={0}
          value={step.skillPoints ?? 1}
          onChange={(e) => onChange({ ...step, skillPoints: parseInt(e.target.value) || 1 })}
        />
      </Row>

      <Row>
        <CheckLabel>
          <input
            type="checkbox"
            checked={step.force || false}
            onChange={(e) => onChange({ ...step, force: e.target.checked || undefined })}
          />
          Forzar (no chequear XP)
        </CheckLabel>
      </Row>

      <Row>
        <Label>Goto después:</Label>
        <GotoSelect value={step.goto || ''} onChange={(val) => onChange({ ...step, goto: val || undefined })} />
      </Row>
    </Wrapper>
  );
};

export default LevelUpStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const Label = styled.label`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  white-space: nowrap;
`;

const Input = styled.input`
  flex: 1;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 3px 6px;
  border-radius: 3px;
`;

const SmallInput = styled(Input)`
  width: 60px;
  flex: none;
`;

const CheckLabel = styled.label`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
`;
