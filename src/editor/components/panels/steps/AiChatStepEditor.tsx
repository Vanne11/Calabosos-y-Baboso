// editor/components/panels/steps/AiChatStepEditor.tsx

import React from 'react';
import styled from 'styled-components';
import type { AiChatStep, ChatMode, ChatOutcome } from '../../../../types/game';
import TerminalInput from '../../shared/TerminalInput';
import TerminalSelect from '../../shared/TerminalSelect';
import GotoSelect from '../../shared/GotoSelect';
import ConditionEditor from './ConditionEditor';
import EffectsEditor from './EffectsEditor';
import { useEditorStore } from '../../../store/useEditorStore';
import { useProjectContext } from '../../../hooks/useProjectContext';

interface Props {
  step: AiChatStep;
  onChange: (step: AiChatStep) => void;
}

const MODES: { value: ChatMode; label: string; vars: string }[] = [
  { value: 'persuadir', label: 'Persuadir', vars: 'objetivo, debilidad' },
  { value: 'negociar', label: 'Negociar', vars: 'objeto, precio_inicial, precio_minimo' },
  { value: 'cancion', label: 'Canción', vars: 'tema' },
  { value: 'rap', label: 'Guerra de rap', vars: 'rival_nombre, rival_descripcion' },
  { value: 'insultos', label: 'Duelo de insultos', vars: 'rival_nombre, rival_descripcion' },
  { value: 'confesion', label: 'Confesión', vars: 'pregunta' },
];

const OUTCOMES: { key: keyof AiChatStep['outcomes']; label: string; color: string }[] = [
  { key: 'success', label: 'Éxito', color: '#50fa7b' },
  { key: 'partial', label: 'A medias (si falta, usa Fracaso)', color: '#f1fa8c' },
  { key: 'failure', label: 'Fracaso', color: '#ff5555' },
  { key: 'done', label: 'Sin veredicto (confesión)', color: '#bd93f9' },
];

/** "clave: valor" por línea ↔ objeto */
function varsToText(vars: Record<string, string> | undefined): string {
  return Object.entries(vars ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n');
}

function textToVars(text: string): Record<string, string> | undefined {
  const vars: Record<string, string> = {};
  for (const line of text.split('\n')) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    if (/^[a-zA-Z0-9_]+$/.test(key)) vars[key] = line.slice(idx + 1).trim();
  }
  return Object.keys(vars).length ? vars : undefined;
}

const AiChatStepEditor: React.FC<Props> = ({ step, onChange }) => {
  const project = useEditorStore((s) => s.project);
  const { stats } = useProjectContext();
  const characterOptions = Object.entries(project?.characters || {}).map(([id, char]) => ({
    value: id,
    label: `${char.name} (${id})`,
  }));
  const mode = MODES.find((m) => m.value === step.mode) ?? MODES[0];

  const setOutcome = (key: keyof AiChatStep['outcomes'], outcome: ChatOutcome | undefined) => {
    const outcomes = { ...step.outcomes };
    if (outcome && (outcome.text || outcome.goto || outcome.effects)) outcomes[key] = outcome;
    else delete outcomes[key];
    onChange({ ...step, outcomes });
  };

  return (
    <Wrapper>
      <Row>
        <Field>
          <TerminalSelect
            label="Modo"
            value={step.mode}
            options={MODES.map((m) => ({ value: m.value, label: m.label }))}
            onChange={(value) => onChange({ ...step, mode: value as ChatMode })}
          />
        </Field>
        <Field>
          <TerminalSelect
            label="NPC"
            value={step.npc}
            options={characterOptions}
            onChange={(npc) => onChange({ ...step, npc })}
          />
        </Field>
      </Row>

      <TerminalInput
        label="Intro del NPC (una línea por renglón)"
        multiline
        rows={3}
        value={(step.intro ?? []).join('\n')}
        onChange={(text) => {
          const intro = text.split('\n').filter((l) => l.trim());
          onChange({ ...step, intro: intro.length ? intro : undefined });
        }}
        placeholder="¿Qué quieres, gusano? Nadie pasa."
      />

      <TerminalInput
        label={`Variables del prompt (clave: valor) — este modo usa: ${mode.vars}`}
        multiline
        rows={3}
        value={varsToText(step.vars)}
        onChange={(text) => onChange({ ...step, vars: textToVars(text) })}
        placeholder="objetivo: entrar al Abismo"
      />

      <Row>
        <Field>
          <TerminalInput
            label="Turnos máx."
            value={step.maxTurns ? String(step.maxTurns) : ''}
            onChange={(v) => onChange({ ...step, maxTurns: parseInt(v, 10) > 0 ? parseInt(v, 10) : undefined })}
            placeholder="según el prompt"
          />
        </Field>
        <Field>
          <TerminalInput
            label="Nombre del medidor"
            value={step.meterLabel ?? ''}
            onChange={(v) => onChange({ ...step, meterLabel: v || undefined })}
            placeholder="automático"
          />
        </Field>
        <Field>
          <TerminalInput
            label="Guardar conversación en stat"
            value={step.saveAs ?? ''}
            onChange={(v) => onChange({ ...step, saveAs: v || undefined })}
            placeholder="(opcional)"
          />
        </Field>
      </Row>

      <OutcomeBlock>
        <OutcomeLabel $color="#ffb86c">Sin IA: se decide con una tirada</OutcomeLabel>
        <Row>
          <Field>
            <Label>Stat</Label>
            <StatInput
              value={step.fallback.stat}
              onChange={(e) => onChange({ ...step, fallback: { ...step.fallback, stat: e.target.value } })}
              list="aichat-stats"
            />
            <datalist id="aichat-stats">
              {stats.map((s) => <option key={s} value={s} />)}
            </datalist>
          </Field>
          <Field>
            <Label>Dificultad</Label>
            <StatInput
              type="number"
              value={step.fallback.difficulty}
              onChange={(e) => onChange({ ...step, fallback: { ...step.fallback, difficulty: parseInt(e.target.value, 10) || 0 } })}
            />
          </Field>
        </Row>
      </OutcomeBlock>

      {OUTCOMES.map(({ key, label, color }) => {
        const outcome = step.outcomes[key] ?? {};
        return (
          <OutcomeBlock key={key}>
            <OutcomeLabel $color={color}>{label}</OutcomeLabel>
            <TerminalInput
              label="Texto"
              value={outcome.text ?? ''}
              onChange={(text) => setOutcome(key, { ...outcome, text: text || undefined })}
            />
            <GotoSelect
              label="Ir a"
              value={outcome.goto ?? ''}
              onChange={(goto) => setOutcome(key, { ...outcome, goto: goto || undefined })}
            />
            <EffectsEditor
              effects={outcome.effects || {}}
              onChange={(effects) => setOutcome(key, { ...outcome, effects: Object.keys(effects).length ? effects : undefined })}
            />
          </OutcomeBlock>
        );
      })}

      <ConditionEditor
        condition={step.condition}
        onChange={(condition) => onChange({ ...step, condition })}
      />
    </Wrapper>
  );
};

export default AiChatStepEditor;

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
  flex: 1;
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

const StatInput = styled.input`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 4px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 2px;
  outline: none;
  &:focus { border-color: ${(p) => p.theme.terminal.accent}; }
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
