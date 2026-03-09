// editor/components/canvas/SceneSearch.tsx
// Buscador flotante de escenas con zoom al nodo encontrado

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useReactFlow } from '@xyflow/react';
import { useEditorStore } from '../../store/useEditorStore';

interface SceneSearchProps {
  visible: boolean;
  onClose: () => void;
}

const SceneSearch: React.FC<SceneSearchProps> = ({ visible, onClose }) => {
  const nodes = useEditorStore((s) => s.nodes);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const reactFlow = useReactFlow();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [visible]);

  if (!visible) return null;

  const lq = query.toLowerCase();
  const results = query
    ? nodes.filter((n) => {
        const { sceneId, scene } = n.data;
        if (sceneId.toLowerCase().includes(lq)) return true;
        if (!scene?.sequence) return false;
        if (scene.scenario?.name?.toLowerCase().includes(lq)) return true;
        if (scene.scenario?.description?.toLowerCase().includes(lq)) return true;
        // Buscar en contenido de diálogos
        for (const step of scene.sequence) {
          if (step.type === 'dialog') {
            if (step.lines.some((l) => l.toLowerCase().includes(lq))) return true;
          }
          if (step.type === 'choice') {
            if (step.options.some((o) => o.text.toLowerCase().includes(lq))) return true;
          }
        }
        return false;
      })
    : [];

  const handleSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    reactFlow.fitView({ nodes: [{ id: nodeId }], duration: 400, padding: 0.5 });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && results.length > 0) {
      handleSelect(results[0].id);
    }
  };

  return (
    <SearchOverlay>
      <SearchBox>
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar escena..."
        />
        <CloseBtn onClick={onClose}>x</CloseBtn>
      </SearchBox>
      {results.length > 0 && (
        <ResultsList>
          {results.slice(0, 10).map((n) => (
            <ResultItem key={n.id} onClick={() => handleSelect(n.id)}>
              <ResultId>{n.data.sceneId}</ResultId>
              {n.data.scene.scenario?.name && (
                <ResultName>{n.data.scene.scenario.name}</ResultName>
              )}
            </ResultItem>
          ))}
        </ResultsList>
      )}
      {query && results.length === 0 && (
        <NoResults>Sin resultados</NoResults>
      )}
    </SearchOverlay>
  );
};

export default SceneSearch;

const SearchOverlay = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
  width: 320px;
`;

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  padding: 4px 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  background: transparent;
  border: none;
  color: ${(p) => p.theme.terminal.text};
  outline: none;

  &::placeholder {
    color: ${(p) => p.theme.terminal.accentDim};
  }
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
`;

const ResultsList = styled.div`
  margin-top: 4px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
`;

const ResultItem = styled.div`
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
  }
`;

const ResultId = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const ResultName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
`;

const NoResults = styled.div`
  margin-top: 4px;
  padding: 8px 10px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
`;
