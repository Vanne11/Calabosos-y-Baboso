// editor/components/panels/ScenarioEditor.tsx
// Editor del escenario de una escena (nombre, descripción, imagen)

import React from 'react';
import styled from 'styled-components';
import type { ScenarioDef } from '../../../types/game';
import TerminalInput from '../shared/TerminalInput';
import AssetPicker from '../shared/AssetPicker';

interface ScenarioEditorProps {
  scenario: ScenarioDef | undefined;
  onChange: (scenario: ScenarioDef | undefined) => void;
}

const ScenarioEditor: React.FC<ScenarioEditorProps> = ({ scenario, onChange }) => {
  if (!scenario) {
    return (
      <AddBtn onClick={() => onChange({ name: 'Escenario', description: '' })}>
        + Agregar escenario
      </AddBtn>
    );
  }

  return (
    <Wrapper>
      <TerminalInput
        label="Nombre"
        value={scenario.name}
        onChange={(name) => onChange({ ...scenario, name })}
        placeholder="Nombre del lugar"
      />

      <TerminalInput
        label="Descripción"
        value={scenario.description || ''}
        onChange={(description) => onChange({ ...scenario, description: description || undefined })}
        placeholder="Lo que ve el jugador..."
        multiline
        rows={3}
      />

      <AssetPicker
        label="Imagen"
        value={scenario.image || ''}
        onChange={(image) => onChange({ ...scenario, image: image || undefined })}
      />

      <RemoveBtn onClick={() => onChange(undefined)}>
        Quitar escenario
      </RemoveBtn>
    </Wrapper>
  );
};

export default ScenarioEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AddBtn = styled.button`
  background: none;
  border: 1px dashed ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 8px;
  border-radius: 3px;
  text-align: center;

  &:hover {
    border-color: ${(p) => p.theme.terminal.accent};
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const RemoveBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  text-decoration: underline;
  text-align: left;
  padding: 0;

  &:hover {
    opacity: 0.7;
  }
`;
