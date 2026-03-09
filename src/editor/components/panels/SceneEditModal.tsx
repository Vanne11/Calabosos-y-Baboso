// editor/components/panels/SceneEditModal.tsx
// Vista fullscreen de edición de escena con navegación entre escenas

import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalButton from '../shared/TerminalButton';
import ConfirmDialog from '../shared/ConfirmDialog';
import ScenarioEditor from './ScenarioEditor';
import SequenceEditor from './SequenceEditor';
import EditorPreview from '../preview/EditorPreview';
import { getNodeDestinations } from '../../types/editor';

interface SceneEditModalProps {
  nodeId: string;
  onClose: () => void;
  onNavigate: (nodeId: string) => void;
}

const SceneEditModal: React.FC<SceneEditModalProps> = ({ nodeId, onClose, onNavigate }) => {
  const nodes = useEditorStore((s) => s.nodes);
  const updateSceneId = useEditorStore((s) => s.updateSceneId);
  const updateScene = useEditorStore((s) => s.updateScene);
  const deleteScene = useEditorStore((s) => s.deleteScene);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const setSelectedNodeId = useEditorStore((s) => s.setSelectedNodeId);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [sidebarFilter, setSidebarFilter] = useState('');

  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  const { sceneId, scene, isStart } = node.data;

  // Escenas que apuntan a esta
  const incomingScenes = useMemo(() => {
    return nodes.filter((n) => {
      if (n.type === 'specialNode') return false;
      const dests = getNodeDestinations(n.data.scene.sequence);
      return dests.includes(sceneId);
    });
  }, [nodes, sceneId]);

  // Escenas a las que apunta esta
  const outgoingDestinations = useMemo(() => {
    return getNodeDestinations(scene.sequence);
  }, [scene.sequence]);

  // Lista filtrada de todas las escenas
  const filteredScenes = useMemo(() => {
    const lf = sidebarFilter.toLowerCase();
    return nodes.filter((n) =>
      n.type !== 'specialNode' && (
        !lf || n.data.sceneId.toLowerCase().includes(lf) ||
        (n.data.scene.scenario?.name || '').toLowerCase().includes(lf)
      )
    );
  }, [nodes, sidebarFilter]);

  const handleDelete = () => {
    deleteScene(nodeId);
    setConfirmDelete(false);
    onClose();
  };

  const handleDuplicate = () => {
    duplicateScene(nodeId);
  };

  const navigateToScene = (targetSceneId: string) => {
    const target = nodes.find((n) => n.data.sceneId === targetSceneId);
    if (target) {
      setSelectedNodeId(target.id);
      onNavigate(target.id);
    }
  };

  const navigateToNode = (targetNodeId: string) => {
    setSelectedNodeId(targetNodeId);
    onNavigate(targetNodeId);
  };

  // Keyboard: Escape cierra
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <FullScreen tabIndex={0} onKeyDown={handleKeyDown}>
      {/* Sidebar izquierdo: navegación de escenas */}
      <Sidebar>
        <SidebarHeader>
          <BackBtn onClick={onClose}>&larr; Canvas</BackBtn>
        </SidebarHeader>

        <SidebarSearch
          value={sidebarFilter}
          onChange={(e) => setSidebarFilter(e.target.value)}
          placeholder="Filtrar escenas..."
        />

        <SceneList>
          {filteredScenes.map((n) => (
            <SceneItem
              key={n.id}
              $active={n.id === nodeId}
              onClick={() => navigateToNode(n.id)}
            >
              <SceneItemId $active={n.id === nodeId}>
                {n.data.isStart && <MiniStartBadge>S</MiniStartBadge>}
                {n.data.sceneId}
              </SceneItemId>
              <SceneItemName>{n.data.scene.scenario?.name || ''}</SceneItemName>
            </SceneItem>
          ))}
        </SceneList>
      </Sidebar>

      {/* Área principal de edición */}
      <MainArea>
        <TopBar>
          <TopBarLeft>
            {isStart && <StartBadge>START</StartBadge>}
            <SceneIdInput
              value={sceneId}
              onChange={(e) => updateSceneId(nodeId, e.target.value)}
              placeholder="scene_id"
            />
            <SceneName>{scene.scenario?.name || ''}</SceneName>
          </TopBarLeft>
          <TopBarRight>
            <TerminalButton
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Editar' : 'Preview'}
            </TerminalButton>
            <TerminalButton variant="ghost" size="sm" onClick={handleDuplicate}>
              Duplicar
            </TerminalButton>
            {!isStart && (
              <TerminalButton variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </TerminalButton>
            )}
          </TopBarRight>
        </TopBar>

        <ContentArea>
          {showPreview ? (
            <PreviewPane>
              <EditorPreview onClose={() => setShowPreview(false)} />
            </PreviewPane>
          ) : (
            <EditorScroll>
              <EditorContent>
                {/* Conexiones: de dónde viene / a dónde va */}
                <ConnectionsBar>
                  {incomingScenes.length > 0 && (
                    <ConnectionGroup>
                      <ConnectionLabel>&larr; Viene de:</ConnectionLabel>
                      {incomingScenes.map((n) => (
                        <ConnectionChip key={n.id} onClick={() => navigateToNode(n.id)}>
                          {n.data.sceneId}
                        </ConnectionChip>
                      ))}
                    </ConnectionGroup>
                  )}
                  {outgoingDestinations.length > 0 && (
                    <ConnectionGroup>
                      <ConnectionLabel>&rarr; Va a:</ConnectionLabel>
                      {outgoingDestinations.map((dest) => {
                        const exists = nodes.some((n) => n.data.sceneId === dest);
                        return (
                          <ConnectionChip
                            key={dest}
                            $warning={!exists}
                            onClick={() => exists && navigateToScene(dest)}
                            style={{ cursor: exists ? 'pointer' : 'default' }}
                          >
                            {dest}{!exists && ' !'}
                          </ConnectionChip>
                        );
                      })}
                    </ConnectionGroup>
                  )}
                </ConnectionsBar>

                {/* Escenario */}
                <Section>
                  <SectionTitle>Escenario</SectionTitle>
                  <ScenarioEditor
                    scenario={scene.scenario}
                    onChange={(scenario) => updateScene(nodeId, { ...scene, scenario })}
                  />
                </Section>

                <Divider />

                {/* Secuencia */}
                <Section>
                  <SequenceEditor nodeId={nodeId} steps={scene.sequence} />
                </Section>
              </EditorContent>
            </EditorScroll>
          )}
        </ContentArea>
      </MainArea>

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar la escena "${sceneId}"?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </FullScreen>
  );
};

export default SceneEditModal;

// --- Styled ---

const FullScreen = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  background: ${(p) => p.theme.background};
  outline: none;
`;

const Sidebar = styled.div`
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border-right: 1px solid ${(p) => p.theme.terminal.border};
`;

const SidebarHeader = styled.div`
  padding: 8px 10px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const BackBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 3px;
  width: 100%;
  text-align: left;

  &:hover {
    color: ${(p) => p.theme.terminal.accent};
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;

const SidebarSearch = styled.input`
  margin: 8px 10px 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 5px 8px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.text};
  border-radius: 3px;
  outline: none;

  &:focus {
    border-color: ${(p) => p.theme.terminal.accent};
  }

  &::placeholder {
    color: ${(p) => p.theme.terminal.accentDim};
  }
`;

const SceneList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
`;

const SceneItem = styled.div<{ $active: boolean }>`
  padding: 6px 12px;
  cursor: pointer;
  background: ${(p) => (p.$active ? p.theme.terminal.background : 'transparent')};
  border-left: 3px solid ${(p) => (p.$active ? p.theme.terminal.accent : 'transparent')};
  transition: all 0.1s;

  &:hover {
    background: ${(p) => p.theme.terminal.background};
  }
`;

const SceneItemId = styled.div<{ $active: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: bold;
  color: ${(p) => (p.$active ? p.theme.terminal.accent : p.theme.terminal.text)};
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MiniStartBadge = styled.span`
  font-size: 8px;
  padding: 0 3px;
  background: ${(p) => p.theme.terminal.success};
  color: ${(p) => p.theme.terminal.background};
  border-radius: 2px;
  font-weight: bold;
  flex-shrink: 0;
`;

const SceneItemName = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  color: ${(p) => p.theme.terminal.accentDim};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
  background: ${(p) => p.theme.terminal.dialogBackground};
  flex-shrink: 0;
`;

const TopBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
`;

const TopBarRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
`;

const StartBadge = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 9px;
  padding: 2px 6px;
  background: ${(p) => p.theme.terminal.success};
  color: ${(p) => p.theme.terminal.background};
  border-radius: 2px;
  font-weight: bold;
  flex-shrink: 0;
`;

const SceneIdInput = styled.input`
  font-family: 'Courier New', monospace;
  font-size: 16px;
  font-weight: bold;
  background: transparent;
  border: none;
  border-bottom: 1px dashed ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accent};
  outline: none;
  padding: 2px 4px;
  width: 200px;

  &:focus {
    border-bottom-color: ${(p) => p.theme.terminal.accent};
  }
`;

const SceneName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accentDim};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ContentArea = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
`;

const EditorScroll = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const EditorContent = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const PreviewPane = styled.div`
  flex: 1;
`;

const ConnectionsBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 14px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 4px;
`;

const ConnectionGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
`;

const ConnectionLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  flex-shrink: 0;
`;

const ConnectionChip = styled.button<{ $warning?: boolean }>`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  padding: 2px 8px;
  background: ${(p) => (p.$warning ? 'rgba(255,85,85,0.1)' : 'rgba(198,125,255,0.1)')};
  border: 1px solid ${(p) => (p.$warning ? p.theme.terminal.error : p.theme.terminal.accent)};
  color: ${(p) => (p.$warning ? p.theme.terminal.error : p.theme.terminal.accent)};
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SectionTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
  text-transform: uppercase;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(p) => p.theme.terminal.border};
  margin: 0;
`;
