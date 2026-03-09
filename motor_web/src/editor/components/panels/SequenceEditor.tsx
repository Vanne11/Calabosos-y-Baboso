// editor/components/panels/SequenceEditor.tsx
// Lista reordenable de steps con editores inline

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import type { SequenceStep } from '../../../types/game';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalButton from '../shared/TerminalButton';
import TerminalPanel from '../shared/TerminalPanel';
import DialogStepEditor from './steps/DialogStepEditor';
import ChoiceStepEditor from './steps/ChoiceStepEditor';
import DiceStepEditor from './steps/DiceStepEditor';
import InputStepEditor from './steps/InputStepEditor';
import EffectsStepEditor from './steps/EffectsStepEditor';
import BranchStepEditor from './steps/BranchStepEditor';
import RandomStepEditor from './steps/RandomStepEditor';
import CheckStepEditor from './steps/CheckStepEditor';
import ShopStepEditor from './steps/ShopStepEditor';
import CombatStepEditor from './steps/CombatStepEditor';
import NotifyStepEditor from './steps/NotifyStepEditor';
import WaitStepEditor from './steps/WaitStepEditor';
import SoundStepEditor from './steps/SoundStepEditor';
import CraftStepEditor from './steps/CraftStepEditor';
import PuzzleStepEditor from './steps/PuzzleStepEditor';
import ExamineStepEditor from './steps/ExamineStepEditor';
import UseItemStepEditor from './steps/UseItemStepEditor';
import TimedChoiceStepEditor from './steps/TimedChoiceStepEditor';
import LevelUpStepEditor from './steps/LevelUpStepEditor';

interface SequenceEditorProps {
  nodeId: string;
  steps: SequenceStep[];
}

const STEP_LABELS: Record<SequenceStep['type'], string> = {
  dialog: 'Diálogo',
  choice: 'Opciones',
  dice: 'Dado',
  input: 'Input',
  effects: 'Efectos',
  branch: 'Bifurcación',
  random: 'Aleatorio',
  check: 'Comprobación',
  shop: 'Tienda',
  combat: 'Combate',
  notify: 'Notificación',
  wait: 'Espera',
  sound: 'Sonido',
  craft: 'Crafteo',
  puzzle: 'Puzzle',
  examine: 'Examinar',
  use_item: 'Usar Item',
  timed_choice: 'Elección Timed',
  level_up: 'Subir Nivel',
};

const STEP_COLORS: Record<SequenceStep['type'], string> = {
  dialog: '#8be9fd',
  choice: '#c67dff',
  dice: '#ffb86c',
  input: '#50fa7b',
  effects: '#f1fa8c',
  branch: '#ff79c6',
  random: '#ffb86c',
  check: '#bd93f9',
  shop: '#f1fa8c',
  combat: '#ff5555',
  notify: '#50fa7b',
  wait: '#8be9fd',
  sound: '#ffb86c',
  craft: '#f1fa8c',
  puzzle: '#ff79c6',
  examine: '#8be9fd',
  use_item: '#50fa7b',
  timed_choice: '#ff5555',
  level_up: '#50fa7b',
};

const SequenceEditor: React.FC<SequenceEditorProps> = ({ nodeId, steps }) => {
  const updateStep = useEditorStore((s) => s.updateStep);
  const addStep = useEditorStore((s) => s.addStep);
  const removeStep = useEditorStore((s) => s.removeStep);
  const moveStep = useEditorStore((s) => s.moveStep);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const renderStepEditor = (step: SequenceStep, index: number) => {
    const handleChange = (updated: SequenceStep) => {
      updateStep(nodeId, index, updated);
    };

    switch (step.type) {
      case 'dialog':
        return <DialogStepEditor step={step} onChange={handleChange as any} />;
      case 'choice':
        return <ChoiceStepEditor step={step} onChange={handleChange as any} />;
      case 'dice':
        return <DiceStepEditor step={step} onChange={handleChange as any} />;
      case 'input':
        return <InputStepEditor step={step} onChange={handleChange as any} />;
      case 'effects':
        return <EffectsStepEditor step={step} onChange={handleChange as any} />;
      case 'branch':
        return <BranchStepEditor step={step} onChange={handleChange as any} />;
      case 'random':
        return <RandomStepEditor step={step} onChange={handleChange as any} />;
      case 'check':
        return <CheckStepEditor step={step} onChange={handleChange as any} />;
      case 'shop':
        return <ShopStepEditor step={step} onChange={handleChange as any} />;
      case 'combat':
        return <CombatStepEditor step={step} onChange={handleChange as any} />;
      case 'notify':
        return <NotifyStepEditor step={step} onChange={handleChange as any} />;
      case 'wait':
        return <WaitStepEditor step={step} onChange={handleChange as any} />;
      case 'sound':
        return <SoundStepEditor step={step} onChange={handleChange as any} />;
      case 'craft':
        return <CraftStepEditor step={step} onChange={handleChange as any} />;
      case 'puzzle':
        return <PuzzleStepEditor step={step} onChange={handleChange as any} />;
      case 'examine':
        return <ExamineStepEditor step={step} onChange={handleChange as any} />;
      case 'use_item':
        return <UseItemStepEditor step={step} onChange={handleChange as any} />;
      case 'timed_choice':
        return <TimedChoiceStepEditor step={step} onChange={handleChange as any} />;
      case 'level_up':
        return <LevelUpStepEditor step={step} onChange={handleChange as any} />;
    }
  };

  return (
    <Wrapper>
      <SectionHeader>
        <SectionTitle>Secuencia ({steps.length} pasos)</SectionTitle>
      </SectionHeader>

      {steps.map((step, i) => (
        <StepWrapper
          key={i}
          draggable
          $isDragging={dragIndex === i}
          $isDragOver={dragOverIndex === i}
          onDragStart={(e) => {
            setDragIndex(i);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverIndex(i);
          }}
          onDragLeave={() => setDragOverIndex(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== i) {
              moveStep(nodeId, dragIndex, i);
            }
            setDragIndex(null);
            setDragOverIndex(null);
          }}
          onDragEnd={() => {
            setDragIndex(null);
            setDragOverIndex(null);
          }}
        >
          <TerminalPanel
            title={`#${i + 1} ${STEP_LABELS[step.type]}`}
            actions={
              <StepActions>
                <MoveBtn
                  onClick={() => moveStep(nodeId, i, i - 1)}
                  disabled={i === 0}
                  title="Mover arriba"
                >
                  ↑
                </MoveBtn>
                <MoveBtn
                  onClick={() => moveStep(nodeId, i, i + 1)}
                  disabled={i === steps.length - 1}
                  title="Mover abajo"
                >
                  ↓
                </MoveBtn>
                <DeleteBtn onClick={() => removeStep(nodeId, i)} title="Eliminar paso">
                  x
                </DeleteBtn>
              </StepActions>
            }
          >
            <StepIndicator $color={STEP_COLORS[step.type]} />
            {renderStepEditor(step, i)}
          </TerminalPanel>
        </StepWrapper>
      ))}

      <AddStepRow>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'dialog')}>
          + Diálogo
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'choice')}>
          + Opciones
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'dice')}>
          + Dado
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'input')}>
          + Input
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'effects')}>
          + Efectos
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'branch')}>
          + Bifurcación
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'random')}>
          + Aleatorio
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'check')}>
          + Comprobación
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'shop')}>
          + Tienda
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'combat')}>
          + Combate
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'notify')}>
          + Notificación
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'wait')}>
          + Espera
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'sound')}>
          + Sonido
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'craft')}>
          + Crafteo
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'puzzle')}>
          + Puzzle
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'examine')}>
          + Examinar
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'use_item')}>
          + Usar Item
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'timed_choice')}>
          + Timed Choice
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => addStep(nodeId, 'level_up')}>
          + Subir Nivel
        </TerminalButton>
      </AddStepRow>
    </Wrapper>
  );
};

export default SequenceEditor;

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const StepWrapper = styled.div<{ $isDragging?: boolean; $isDragOver?: boolean }>`
  position: relative;
  opacity: ${(p) => (p.$isDragging ? 0.4 : 1)};
  border-top: ${(p) => (p.$isDragOver ? `2px solid ${p.theme.terminal.accent}` : '2px solid transparent')};
  cursor: grab;
  transition: opacity 0.15s;

  &:active {
    cursor: grabbing;
  }
`;

const StepIndicator = styled.div<{ $color: string }>`
  position: absolute;
  left: -10px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: ${(p) => p.$color};
  border-radius: 2px;
`;

const StepActions = styled.div`
  display: flex;
  gap: 2px;
`;

const MoveBtn = styled.button<{ disabled?: boolean }>`
  background: none;
  border: none;
  color: ${(p) => (p.disabled ? p.theme.terminal.border : p.theme.terminal.accentDim)};
  cursor: ${(p) => (p.disabled ? 'not-allowed' : 'pointer')};
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 0 3px;

  &:hover:not(:disabled) {
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  padding: 0 3px;

  &:hover {
    opacity: 0.7;
  }
`;

const AddStepRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px 0;
`;
