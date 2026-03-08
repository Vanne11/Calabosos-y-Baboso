// editor/components/canvas/EditorCanvas.tsx
// Wrapper ReactFlow con configuración del editor

import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
} from '@xyflow/react';
import type { NodeMouseHandler, NodeTypes, EdgeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import SceneNode from './SceneNode';
import SpecialNode from './SpecialNode';
import CustomEdge from './CustomEdge';
import SceneSearch from './SceneSearch';
import type { SceneFlowNode, SceneNodeData } from '../../types/editor';

interface EditorCanvasProps {
  showSearch: boolean;
  onCloseSearch: () => void;
  onNodeDoubleClick?: (nodeId: string) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ showSearch, onCloseSearch, onNodeDoubleClick }) => {
  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);

  const nodeTypes = useMemo<NodeTypes>(() => ({ sceneNode: SceneNode as any, specialNode: SpecialNode as any }), []);
  const edgeTypes = useMemo<EdgeTypes>(() => ({ customEdge: CustomEdge as any }), []);

  const onNodeClick: NodeMouseHandler<SceneFlowNode> = useCallback(
    (_event, node) => {
      setSelectedNodeId(node.id);
    },
    [setSelectedNodeId]
  );

  const onNodeDblClick: NodeMouseHandler<SceneFlowNode> = useCallback(
    (_event, node) => {
      onNodeDoubleClick?.(node.id);
    },
    [onNodeDoubleClick]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <CanvasWrapper>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDblClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ type: 'customEdge' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#4a3664" />
        <Controls
          style={{ background: '#1a0e29', border: '1px solid #4a3664', borderRadius: 4 }}
        />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'specialNode') return '#ff5555';
            const data = node.data as SceneNodeData;
            return data?.isStart ? '#50fa7b' : '#c67dff';
          }}
          style={{ background: '#1a0e29', border: '1px solid #4a3664' }}
          maskColor="rgba(26, 14, 41, 0.7)"
        />
      </ReactFlow>
      <SceneSearch visible={showSearch} onClose={onCloseSearch} />
    </CanvasWrapper>
  );
};

export default EditorCanvas;

const CanvasWrapper = styled.div`
  width: 100%;
  height: 100%;
  background: #0d0618;
  position: relative;

  .react-flow__node {
    cursor: pointer;
  }

  .react-flow__controls-button {
    background: #1a0e29;
    border: 1px solid #4a3664;
    color: #c67dff;
    fill: #c67dff;

    &:hover {
      background: #301d47;
    }
  }
`;
