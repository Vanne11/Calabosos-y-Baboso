// editor/components/panels/steps/SoundStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { SoundStep } from '../../../../types/game';
import AssetPicker from '../../shared/AssetPicker';
import ConditionEditor from './ConditionEditor';
import { SFX } from '../../../../audio/sfxCatalog';
import { sfx as sfxPlayer } from '../../../../audio/SfxPlayer';

const SFX_NAMES = Object.keys(SFX).sort();

interface Props {
  step: SoundStep;
  onChange: (step: SoundStep) => void;
}

const SoundStepEditor: React.FC<Props> = ({ step, onChange }) => {
  return (
    <Wrapper>
      <Field>
        <Label>Efecto sintetizado</Label>
        <Row>
          <Select
            value={step.sfx ?? ''}
            onChange={(e) => onChange({ ...step, sfx: e.target.value || undefined })}
          >
            <option value="">— archivo de audio —</option>
            {SFX_NAMES.map((name) => (
              <option key={name} value={name} title={SFX[name].desc}>
                {name} — {SFX[name].desc}
              </option>
            ))}
          </Select>
          {step.sfx && (
            <PlayButton type="button" title="Probar" onClick={() => sfxPlayer.play(step.sfx!, step.volume ?? 1)}>
              ▶
            </PlayButton>
          )}
        </Row>
      </Field>

      {!step.sfx && (
        <AssetPicker
          label="Archivo de audio"
          value={step.src ?? ''}
          onChange={(src) => onChange({ ...step, src })}
          accept="audio"
        />
      )}

      <Check>
        <input
          type="checkbox"
          checked={step.wait ?? false}
          onChange={(e) => onChange({ ...step, wait: e.target.checked || undefined })}
        />
        Esperar a que termine
      </Check>

      <Field>
        <Label>Volumen (0-1)</Label>
        <NumInput
          type="number"
          min={0}
          max={1}
          step={0.1}
          value={step.volume ?? 1}
          onChange={(e) => onChange({ ...step, volume: parseFloat(e.target.value) || 1 })}
        />
      </Field>

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default SoundStepEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
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

const Row = styled.div`
  display: flex;
  gap: 4px;
`;

const Select = styled.select`
  flex: 1;
  min-width: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  cursor: pointer;
`;

const PlayButton = styled.button`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accentDim};
  color: ${(p) => p.theme.terminal.accent};
  border-radius: 2px;
  cursor: pointer;
`;

const Check = styled.label`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.text};
`;

const NumInput = styled.input`
  width: 60px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
`;
