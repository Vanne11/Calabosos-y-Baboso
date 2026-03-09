// editor/components/panels/steps/PuzzleStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { PuzzleStep, PuzzleConfig } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalButton from '../../shared/TerminalButton';
import GotoSelect from '../../shared/GotoSelect';
import EffectsEditor from './EffectsEditor';
import ConditionEditor from './ConditionEditor';

interface Props {
  step: PuzzleStep;
  onChange: (step: PuzzleStep) => void;
}

const PUZZLE_TYPES = [
  { value: 'code', label: 'Código/Contraseña' },
  { value: 'sequence', label: 'Secuencia' },
  { value: 'riddle', label: 'Acertijo' },
  { value: 'lock', label: 'Candado' },
] as const;

function createDefaultConfig(type: PuzzleConfig['type']): PuzzleConfig {
  switch (type) {
    case 'code': return { type: 'code', answers: [''], prompt: 'Introduce el código:' };
    case 'sequence': return { type: 'sequence', elements: [{ id: '1', label: 'Elemento 1' }, { id: '2', label: 'Elemento 2' }] };
    case 'riddle': return { type: 'riddle', question: '¿Qué tiene...?', answers: [''] };
    case 'lock': return { type: 'lock', digits: 3, combination: '000' };
  }
}

const PuzzleStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const config = step.config;

  const changePuzzleType = (newType: PuzzleConfig['type']) => {
    onChange({ ...step, puzzleType: newType, config: createDefaultConfig(newType) });
  };

  return (
    <Wrapper>
      <TerminalInput
        label="Descripción"
        value={step.description}
        onChange={(description) => onChange({ ...step, description })}
        placeholder="Un mecanismo antiguo..."
      />

      <SubTitle>Tipo de puzzle</SubTitle>
      <TypeRow>
        {PUZZLE_TYPES.map((pt) => (
          <TypeToggle key={pt.value} $active={step.puzzleType === pt.value} onClick={() => changePuzzleType(pt.value)}>
            {pt.label}
          </TypeToggle>
        ))}
      </TypeRow>

      {/* Config según tipo */}
      {config.type === 'code' && (
        <>
          <TerminalInput label="Prompt" value={config.prompt || ''} onChange={(prompt) => onChange({ ...step, config: { ...config, prompt } })} />
          <SubLabel>Respuestas válidas</SubLabel>
          {config.answers.map((ans, i) => (
            <Row key={i}>
              <TerminalInput
                label={`#${i + 1}`}
                value={ans}
                onChange={(v) => {
                  const answers = config.answers.map((a, j) => (j === i ? v : a));
                  onChange({ ...step, config: { ...config, answers } });
                }}
              />
              {config.answers.length > 1 && (
                <SmallDel onClick={() => onChange({ ...step, config: { ...config, answers: config.answers.filter((_, j) => j !== i) } })}>x</SmallDel>
              )}
            </Row>
          ))}
          <TerminalButton variant="ghost" size="sm" onClick={() => onChange({ ...step, config: { ...config, answers: [...config.answers, ''] } })}>
            + Respuesta
          </TerminalButton>
        </>
      )}

      {config.type === 'riddle' && (
        <>
          <TerminalInput label="Pregunta" value={config.question} onChange={(question) => onChange({ ...step, config: { ...config, question } })} multiline rows={2} />
          <SubLabel>Respuestas válidas (match parcial)</SubLabel>
          {config.answers.map((ans, i) => (
            <Row key={i}>
              <TerminalInput
                label={`#${i + 1}`}
                value={ans}
                onChange={(v) => {
                  const answers = config.answers.map((a, j) => (j === i ? v : a));
                  onChange({ ...step, config: { ...config, answers } });
                }}
              />
              {config.answers.length > 1 && (
                <SmallDel onClick={() => onChange({ ...step, config: { ...config, answers: config.answers.filter((_, j) => j !== i) } })}>x</SmallDel>
              )}
            </Row>
          ))}
          <TerminalButton variant="ghost" size="sm" onClick={() => onChange({ ...step, config: { ...config, answers: [...config.answers, ''] } })}>
            + Respuesta
          </TerminalButton>
        </>
      )}

      {config.type === 'sequence' && (
        <>
          <SubLabel>Elementos (en orden correcto)</SubLabel>
          {config.elements.map((el, i) => (
            <Row key={i}>
              <TerminalInput label={`#${i + 1}`} value={el.label} onChange={(label) => {
                const elements = config.elements.map((e, j) => (j === i ? { ...e, label } : e));
                onChange({ ...step, config: { ...config, elements } });
              }} />
              {config.elements.length > 2 && (
                <SmallDel onClick={() => onChange({ ...step, config: { ...config, elements: config.elements.filter((_, j) => j !== i) } })}>x</SmallDel>
              )}
            </Row>
          ))}
          <TerminalButton variant="ghost" size="sm" onClick={() => {
            const id = String(config.elements.length + 1);
            onChange({ ...step, config: { ...config, elements: [...config.elements, { id, label: `Elemento ${id}` }] } });
          }}>
            + Elemento
          </TerminalButton>
        </>
      )}

      {config.type === 'lock' && (
        <Row>
          <Field>
            <Label>Dígitos</Label>
            <NumInput type="number" min={2} max={8} value={config.digits}
              onChange={(e) => {
                const digits = parseInt(e.target.value) || 3;
                const combination = config.combination.padEnd(digits, '0').slice(0, digits);
                onChange({ ...step, config: { ...config, digits, combination } });
              }} />
          </Field>
          <TerminalInput label="Combinación" value={config.combination}
            onChange={(combination) => onChange({ ...step, config: { ...config, combination } })} />
        </Row>
      )}

      <TerminalInput label="Pista (opcional)" value={config.hint || step.hintText || ''}
        onChange={(hint) => onChange({ ...step, config: { ...config, hint: hint || undefined }, hintText: undefined })}
        placeholder="Mira detrás del cuadro..." />

      <Field>
        <Label>Intentos máximos (0 = infinito)</Label>
        <NumInput type="number" min={0} value={step.maxAttempts || 0}
          onChange={(e) => onChange({ ...step, maxAttempts: parseInt(e.target.value) || 0 })} />
      </Field>

      <SubTitle>Resultados</SubTitle>
      <OutcomeBlock>
        <OutcomeLabel $color="#50fa7b">Éxito</OutcomeLabel>
        <TerminalInput label="Texto" value={step.success.text} onChange={(text) => onChange({ ...step, success: { ...step.success, text } })} />
        <GotoSelect label="Ir a" value={step.success.goto || ''} onChange={(goto) => onChange({ ...step, success: { ...step.success, goto: goto || undefined } })} />
        <EffectsEditor effects={step.success.effects || {}} onChange={(effects) => onChange({ ...step, success: { ...step.success, effects: Object.keys(effects).length ? effects : undefined } })} />
      </OutcomeBlock>
      <OutcomeBlock>
        <OutcomeLabel $color="#ff5555">Fallo</OutcomeLabel>
        <TerminalInput label="Texto" value={step.failure.text} onChange={(text) => onChange({ ...step, failure: { ...step.failure, text } })} />
        <GotoSelect label="Ir a" value={step.failure.goto || ''} onChange={(goto) => onChange({ ...step, failure: { ...step.failure, goto: goto || undefined } })} />
        <EffectsEditor effects={step.failure.effects || {}} onChange={(effects) => onChange({ ...step, failure: { ...step.failure, effects: Object.keys(effects).length ? effects : undefined } })} />
      </OutcomeBlock>

      <ConditionEditor condition={step.condition} onChange={(condition) => onChange({ ...step, condition })} />
    </Wrapper>
  );
};

export default PuzzleStepEditor;

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

const SubLabel = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
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
  width: 60px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
`;

const TypeRow = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`;

const TypeToggle = styled.button<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 4px 8px;
  background: ${(p) => (p.$active ? 'rgba(198,125,255,0.15)' : 'transparent')};
  border: 1px solid ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.border)};
  color: ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.accentDim)};
  cursor: pointer;
  border-radius: 2px;
`;

const SmallDel = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 10px;
`;

const OutcomeBlock = styled.div`
  padding: 6px 8px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 3px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OutcomeLabel = styled.span<{ $color: string }>`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.$color};
  font-weight: bold;
`;
