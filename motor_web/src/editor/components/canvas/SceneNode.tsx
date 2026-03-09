// editor/components/canvas/SceneNode.tsx
// Nodo custom "ventana de terminal" para escenas con info enriquecida

import React, { memo, useMemo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import styled from 'styled-components';
import type { SceneFlowNode } from '../../types/editor';
import { getNodeDestinations } from '../../types/editor';
import { useEditorStore } from '../../store/useEditorStore';

const STEP_ICONS: Record<string, string> = {
  dialog: '\u{1F4AC}',
  choice: '\u{1F500}',
  dice: '\u{1F3B2}',
  input: '\u{2328}\u{FE0F}',
  effects: '\u{2728}',
};

const SceneNode: React.FC<NodeProps<SceneFlowNode>> = ({ data, selected }) => {
  const { sceneId, scene, isStart } = data;
  const errorCount = useEditorStore((s) => s.issues.filter((i) => i.sceneId === sceneId && i.severity === 'error').length);
  const warnCount = useEditorStore((s) => s.issues.filter((i) => i.sceneId === sceneId && i.severity === 'warning').length);

  const destinations = useMemo(() => getNodeDestinations(scene.sequence), [scene.sequence]);
  const scenarioName = scene.scenario?.name || 'Sin escenario';

  // Preview de primera línea de diálogo
  const dialogPreview = useMemo(() => {
    for (const step of scene.sequence) {
      if (step.type === 'dialog' && step.lines.length > 0) {
        const raw = step.lines[0].replace(/\[.*?\]/g, '').slice(0, 40);
        return step.lines[0].length > 40 ? raw + '...' : raw;
      }
    }
    return '';
  }, [scene.sequence]);

  // Iconos de tipos de steps
  const stepIcons = useMemo(() => scene.sequence.map((s) => STEP_ICONS[s.type] || '?'), [scene.sequence]);

  // Badge de imagen
  const hasImage = !!scene.scenario?.image;

  return (
    <NodeContainer $selected={!!selected} $isStart={isStart}>
      <Handle id="target-top" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="target-left" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="target-right" type="target" position={Position.Right} style={handleStyle} />
      <Handle id="target-bottom" type="target" position={Position.Bottom} style={handleStyle} />
      <NodeHeader $isStart={isStart}>
        <HeaderLeft>
          {isStart && <StartBadge>START</StartBadge>}
          <SceneId>{sceneId}</SceneId>
        </HeaderLeft>
        <HeaderRight>
          {hasImage && <ImageBadge title="Tiene imagen">img</ImageBadge>}
          {errorCount > 0 && <ErrorBadge title={`${errorCount} errores`}>{errorCount}!</ErrorBadge>}
          {warnCount > 0 && <WarnBadge title={`${warnCount} warnings`}>{warnCount}?</WarnBadge>}
        </HeaderRight>
      </NodeHeader>
      <NodeBody>
        <ScenarioLine>&gt; {scenarioName}</ScenarioLine>
        {stepIcons.length > 0 && (
          <StepIconsRow>{stepIcons.join(' ')}</StepIconsRow>
        )}
        {dialogPreview && (
          <DialogPreview>"{dialogPreview}"</DialogPreview>
        )}
        {destinations.length > 0 && (
          <DestLine>
            &rarr; {destinations.join(', ')}
          </DestLine>
        )}
        {scene.sequence.length === 0 && (
          <EmptyLine>&gt; (vacia)</EmptyLine>
        )}
      </NodeBody>
      <Handle id="source-top" type="source" position={Position.Top} style={handleStyle} />
      <Handle id="source-left" type="source" position={Position.Left} style={handleStyle} />
      <Handle id="source-right" type="source" position={Position.Right} style={handleStyle} />
      <Handle id="source-bottom" type="source" position={Position.Bottom} style={handleStyle} />
    </NodeContainer>
  );
};

export default memo(SceneNode);

const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: '#c67dff',
  border: '2px solid #4a3664',
};

const NodeContainer = styled.div<{ $selected: boolean; $isStart: boolean }>`
  width: 280px;
  background: #1a0e29;
  border: 1px solid ${(p) => (p.$selected ? '#c67dff' : p.$isStart ? '#50fa7b' : '#4a3664')};
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  box-shadow: ${(p) => (p.$selected ? '0 0 12px rgba(198, 125, 255, 0.3)' : 'none')};
  transition: border-color 0.15s, box-shadow 0.15s;
`;

const NodeHeader = styled.div<{ $isStart: boolean }>`
  padding: 6px 10px;
  background: ${(p) => (p.$isStart ? 'rgba(80, 250, 123, 0.1)' : '#301d47')};
  border-bottom: 1px solid #4a3664;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
`;

const StartBadge = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  background: #50fa7b;
  color: #1a0e29;
  border-radius: 2px;
  font-weight: bold;
  flex-shrink: 0;
`;

const ImageBadge = styled.span`
  font-size: 8px;
  padding: 1px 4px;
  background: rgba(139, 233, 253, 0.15);
  color: #8be9fd;
  border-radius: 2px;
  border: 1px solid rgba(139, 233, 253, 0.3);
`;

const ErrorBadge = styled.span`
  font-size: 9px;
  padding: 1px 4px;
  color: #ff5555;
  font-weight: bold;
`;

const WarnBadge = styled.span`
  font-size: 9px;
  padding: 1px 4px;
  color: #f1fa8c;
  font-weight: bold;
`;

const SceneId = styled.span`
  font-size: 12px;
  font-weight: bold;
  color: #c67dff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const NodeBody = styled.div`
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const ScenarioLine = styled.div`
  font-size: 11px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StepIconsRow = styled.div`
  font-size: 10px;
  letter-spacing: 2px;
`;

const DialogPreview = styled.div`
  font-size: 10px;
  color: #8be9fd;
  font-style: italic;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DestLine = styled.div`
  font-size: 10px;
  color: #50fa7b;
`;

const EmptyLine = styled.div`
  font-size: 10px;
  color: #ff5555;
  font-style: italic;
`;
