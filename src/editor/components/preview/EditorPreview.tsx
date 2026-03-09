// editor/components/preview/EditorPreview.tsx
// Preview en vivo: muestra la secuencia de la escena seleccionada

import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { parseRichText } from '../../../utils/richTextParser';

const EditorPreview: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const nodes = useEditorStore((s) => s.nodes);
  const project = useEditorStore((s) => s.project);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const scene = selectedNode?.data.scene;

  const lines = useMemo(() => {
    if (!scene) return [{ text: '(Selecciona una escena para previsualizar)', type: 'dim' }];

    const result: { text: string; type: string }[] = [];

    if (scene.scenario) {
      result.push({ text: `=== ${scene.scenario.name} ===`, type: 'accent' });
      if (scene.scenario.description) {
        result.push({ text: scene.scenario.description, type: 'normal' });
      }
      result.push({ text: '', type: 'normal' });
    }

    for (const step of scene.sequence) {
      if (step.type === 'dialog') {
        const charDef = project?.characters[step.character];
        const name = charDef?.name || step.character;
        result.push({ text: `[${name}]`, type: 'header' });
        for (const line of step.lines) {
          result.push({ text: line, type: 'dialog' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'choice') {
        for (let i = 0; i < step.options.length; i++) {
          const opt = step.options[i];
          result.push({
            text: `  [${i + 1}] ${opt.text}${opt.goto ? ` -> ${opt.goto}` : ''}`,
            type: 'option',
          });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'dice') {
        result.push({ text: `[Dado] ${step.description} (d${step.faces}, DC ${step.difficulty}, stat: ${step.stat})`, type: 'dice' });
        if (step.results.success) result.push({ text: `  OK: ${step.results.success.text}`, type: 'success' });
        if (step.results.failure) result.push({ text: `  FAIL: ${step.results.failure.text}`, type: 'error' });
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'input') {
        result.push({ text: `[Input] ${step.prompt} (-> ${step.saveAs})`, type: 'input' });
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'effects') {
        const parts: string[] = [];
        if (step.effects.stats) {
          for (const [k, v] of Object.entries(step.effects.stats)) {
            parts.push(`${k}: ${typeof v === 'number' && v > 0 ? '+' : ''}${v}`);
          }
        }
        if (step.effects.flags) {
          for (const [k, v] of Object.entries(step.effects.flags)) {
            parts.push(`${k}=${v}`);
          }
        }
        if (parts.length > 0) {
          result.push({ text: `[Efectos] ${parts.join(', ')}`, type: 'effects' });
        }
      }

      if (step.type === 'branch') {
        result.push({ text: '[Bifurcación]', type: 'branch' });
        for (let j = 0; j < step.branches.length; j++) {
          const b = step.branches[j];
          const label = b.condition ? 'si condición' : 'default';
          result.push({ text: `  ${label} -> ${b.goto || '?'}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'random') {
        result.push({ text: '[Aleatorio]', type: 'random' });
        for (const o of step.outcomes) {
          result.push({ text: `  (x${o.weight}) ${o.text}${o.goto ? ` -> ${o.goto}` : ''}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'check') {
        result.push({ text: `[Comprobación] ${step.description} (${step.stat} ${step.threshold})`, type: 'dice' });
        result.push({ text: `  OK: ${step.success.text}${step.success.goto ? ` -> ${step.success.goto}` : ''}`, type: 'success' });
        result.push({ text: `  FAIL: ${step.failure.text}${step.failure.goto ? ` -> ${step.failure.goto}` : ''}`, type: 'error' });
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'shop') {
        result.push({ text: `[Tienda] ${step.title} (moneda: ${step.currency})`, type: 'effects' });
        for (const item of step.items) {
          result.push({ text: `  ${item.name} - $${item.price}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'combat') {
        result.push({ text: `[Combate] vs ${step.enemy.name} (HP: ${step.enemy.hp}, ATK: ${step.enemy.attack})`, type: 'error' });
        result.push({ text: `  Victoria: ${step.results.victory.text}`, type: 'success' });
        result.push({ text: `  Derrota: ${step.results.defeat.text}`, type: 'error' });
        if (step.results.flee) {
          result.push({ text: `  Huida: ${step.results.flee.text}`, type: 'effects' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'notify') {
        const icon = step.icon || (step.style === 'achievement' ? '🏆' : 'ℹ️');
        result.push({ text: `[${icon} ${step.title}] ${step.text}`, type: step.style === 'achievement' ? 'success' : 'input' });
      }

      if (step.type === 'wait') {
        result.push({ text: `[Espera ${step.duration}ms] ${step.text}`, type: 'dim' });
      }

      if (step.type === 'sound') {
        result.push({ text: `[Sonido] ${step.src || '(sin archivo)'}`, type: 'dim' });
      }

      if (step.type === 'craft') {
        result.push({ text: `[Crafteo] ${step.recipes.length} receta(s)`, type: 'craft' });
        for (const recipe of step.recipes) {
          result.push({ text: `  ${recipe.ingredients.join(' + ')} = ${recipe.result}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'puzzle') {
        result.push({ text: `[Puzzle: ${step.puzzleType}] ${step.description}`, type: 'puzzle' });
        result.push({ text: `  OK: ${step.success.text}${step.success.goto ? ` -> ${step.success.goto}` : ''}`, type: 'success' });
        result.push({ text: `  FAIL: ${step.failure.text}${step.failure.goto ? ` -> ${step.failure.goto}` : ''}`, type: 'error' });
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'examine') {
        result.push({ text: `[Examinar] ${step.description || ''}`, type: 'examine' });
        for (const s of step.subjects) {
          result.push({ text: `  > ${s.label}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'use_item') {
        result.push({ text: `[Usar Item] ${step.description || ''}`, type: 'input' });
        for (const t of step.targets) {
          const accepts = t.accepts.map((a) => a.itemId).join(', ');
          result.push({ text: `  ${t.label} [acepta: ${accepts || 'nada'}]`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'timed_choice') {
        result.push({ text: `[Timed Choice] ${step.duration / 1000}s`, type: 'timed' });
        for (let i = 0; i < step.options.length; i++) {
          const opt = step.options[i];
          const def = i === step.defaultIndex ? ' (default)' : '';
          result.push({ text: `  [${i + 1}] ${opt.text}${def}${opt.goto ? ` -> ${opt.goto}` : ''}`, type: 'option' });
        }
        result.push({ text: '', type: 'normal' });
      }

      if (step.type === 'level_up') {
        const charLabel = step.characterId || 'protagonista';
        result.push({ text: `[⬆️ Subir Nivel] ${charLabel}${step.force ? ' (forzado)' : ''}`, type: 'success' });
        if (step.description) result.push({ text: `  ${step.description}`, type: 'normal' });
        if (step.goto) result.push({ text: `  -> ${step.goto}`, type: 'option' });
        result.push({ text: '', type: 'normal' });
      }
    }

    return result;
  }, [scene, project]);

  const renderLine = (line: { text: string; type: string }, i: number) => {
    if (line.type === 'dialog') {
      const segments = parseRichText(line.text);
      return (
        <PreviewLine key={i}>
          {segments.map((seg, j) => (
            <span
              key={j}
              style={{
                fontWeight: seg.bold ? 'bold' : 'normal',
                fontStyle: seg.italic ? 'italic' : 'normal',
                opacity: seg.dim ? 0.5 : 1,
                color: seg.color,
              }}
            >
              {seg.text}
            </span>
          ))}
        </PreviewLine>
      );
    }

    const colorMap: Record<string, string> = {
      accent: '#c67dff',
      header: '#8be9fd',
      option: '#c67dff',
      dice: '#ffb86c',
      success: '#50fa7b',
      error: '#ff5555',
      input: '#50fa7b',
      effects: '#f1fa8c',
      dim: '#4a3664',
      normal: '#ffffff',
      branch: '#ff79c6',
      random: '#ffb86c',
      craft: '#f1fa8c',
      puzzle: '#ff79c6',
      examine: '#8be9fd',
      timed: '#ff5555',
    };

    return (
      <PreviewLine key={i} style={{ color: colorMap[line.type] || '#ffffff' }}>
        {line.text || '\u00A0'}
      </PreviewLine>
    );
  };

  return (
    <PreviewContainer>
      <PreviewHeader>
        <PreviewTitle>Preview: {selectedNode?.data.sceneId || '...'}</PreviewTitle>
        <CloseBtn onClick={onClose}>x</CloseBtn>
      </PreviewHeader>
      <PreviewScroll>
        {lines.map((l, i) => renderLine(l, i))}
      </PreviewScroll>
    </PreviewContainer>
  );
};

export default EditorPreview;

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: ${(p) => p.theme.terminal.background};
  border-left: 1px solid ${(p) => p.theme.terminal.border};
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
  background: ${(p) => p.theme.terminal.dialogBackground};
`;

const PreviewTitle = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
`;

const PreviewScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const PreviewLine = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #ffffff;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
`;
