// editor/components/canvas/SpecialNode.tsx
// Nodo especial para destinos del sistema (_quit, _game_over, _restart)

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import styled from 'styled-components';

export interface SpecialNodeData {
  sceneId: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  isSpecial: true;
  [key: string]: unknown;
}

export type SpecialFlowNode = Node<SpecialNodeData>;

/** IDs de destinos especiales del sistema */
export const SPECIAL_DESTINATIONS: Record<string, { label: string; icon: string; color: string; description: string }> = {
  _quit: {
    label: 'FIN',
    icon: '🚪',
    color: '#ff5555',
    description: 'Cierra el juego y vuelve al menú',
  },
  _game_over: {
    label: 'GAME OVER',
    icon: '💀',
    color: '#ff5555',
    description: 'Final de derrota',
  },
  _restart: {
    label: 'REINICIAR',
    icon: '🔄',
    color: '#f1fa8c',
    description: 'Reinicia el juego desde el inicio',
  },
};

export const SPECIAL_IDS = Object.keys(SPECIAL_DESTINATIONS);

const SpecialNode: React.FC<NodeProps<SpecialFlowNode>> = ({ data, selected }) => {
  return (
    <NodeContainer $selected={!!selected} $color={data.color}>
      <Handle id="target-top" type="target" position={Position.Top} style={handleStyle} />
      <Handle id="target-left" type="target" position={Position.Left} style={handleStyle} />
      <Handle id="target-right" type="target" position={Position.Right} style={handleStyle} />
      <Handle id="target-bottom" type="target" position={Position.Bottom} style={handleStyle} />
      <Icon>{data.icon}</Icon>
      <Label $color={data.color}>{data.label}</Label>
      <Desc>{data.description}</Desc>
    </NodeContainer>
  );
};

export default memo(SpecialNode);

const handleStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  background: '#ff5555',
  border: '2px solid #4a3664',
};

const NodeContainer = styled.div<{ $selected: boolean; $color: string }>`
  width: 160px;
  background: #1a0e29;
  border: 2px dashed ${(p) => (p.$selected ? p.$color : '#4a3664')};
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  box-shadow: ${(p) => (p.$selected ? `0 0 12px ${p.$color}40` : 'none')};
  transition: border-color 0.15s, box-shadow 0.15s;
`;

const Icon = styled.div`
  font-size: 24px;
`;

const Label = styled.div<{ $color: string }>`
  font-size: 11px;
  font-weight: bold;
  color: ${(p) => p.$color};
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Desc = styled.div`
  font-size: 9px;
  color: #8a7ba8;
  text-align: center;
`;
