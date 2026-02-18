// editor/components/canvas/SceneNode.tsx
// Nodo custom "ventana de terminal" para escenas

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import styled from 'styled-components';
import type { SceneFlowNode } from '../../types/editor';
import { getStepSummary, getNodeDestinations } from '../../types/editor';

const SceneNode: React.FC<NodeProps<SceneFlowNode>> = ({ data, selected }) => {
  const { sceneId, scene, isStart } = data;
  const summary = getStepSummary(scene.sequence);
  const destinations = getNodeDestinations(scene.sequence);
  const scenarioName = scene.scenario?.name || 'Sin escenario';

  return (
    <NodeContainer $selected={!!selected} $isStart={isStart}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <NodeHeader $isStart={isStart}>
        {isStart && <StartBadge>START</StartBadge>}
        <SceneId>{sceneId}</SceneId>
      </NodeHeader>
      <NodeBody>
        <ScenarioLine>&gt; {scenarioName}</ScenarioLine>
        {summary && <SummaryLine>&gt; {summary}</SummaryLine>}
        {destinations.length > 0 && (
          <DestLine>
            &gt; &rarr; {destinations.join(', ')}
          </DestLine>
        )}
        {scene.sequence.length === 0 && (
          <EmptyLine>&gt; (vacía)</EmptyLine>
        )}
      </NodeBody>
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
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
  gap: 6px;
`;

const StartBadge = styled.span`
  font-size: 9px;
  padding: 1px 5px;
  background: #50fa7b;
  color: #1a0e29;
  border-radius: 2px;
  font-weight: bold;
`;

const SceneId = styled.span`
  font-size: 12px;
  font-weight: bold;
  color: #c67dff;
`;

const NodeBody = styled.div`
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const ScenarioLine = styled.div`
  font-size: 11px;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SummaryLine = styled.div`
  font-size: 10px;
  color: #b3a5cc;
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
