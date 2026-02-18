// editor/components/panels/ScenePanel.tsx
// Panel lateral para editar la escena seleccionada

import React, { useState } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import TerminalInput from '../shared/TerminalInput';
import TerminalButton from '../shared/TerminalButton';
import ConfirmDialog from '../shared/ConfirmDialog';
import ScenarioEditor from './ScenarioEditor';
import SequenceEditor from './SequenceEditor';

const ScenePanel: React.FC = () => {
  const selectedNodeId = useEditorStore((s) => s.selectedNodeId);
  const nodes = useEditorStore((s) => s.nodes);
  const updateSceneId = useEditorStore((s) => s.updateSceneId);
  const updateScene = useEditorStore((s) => s.updateScene);
  const deleteScene = useEditorStore((s) => s.deleteScene);
  const duplicateScene = useEditorStore((s) => s.duplicateScene);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <EmptyPanel>
        <EmptyText>Selecciona una escena para editarla</EmptyText>
        <EmptyHint>Haz clic en un nodo del canvas</EmptyHint>
      </EmptyPanel>
    );
  }

  const { sceneId, scene, isStart } = selectedNode.data;

  return (
    <PanelContainer>
      <PanelScroll>
        {/* Header: ID editable + acciones */}
        <HeaderSection>
          <TerminalInput
            label="ID de escena"
            value={sceneId}
            onChange={(newId) => updateSceneId(selectedNode.id, newId)}
            placeholder="scene_id"
          />
          <ButtonRow>
            <TerminalButton
              variant="ghost"
              size="sm"
              onClick={() => duplicateScene(selectedNode.id)}
              title="Duplicar escena"
            >
              Duplicar
            </TerminalButton>
            {!isStart && (
              <TerminalButton
                variant="danger"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                title="Eliminar escena"
              >
                Eliminar
              </TerminalButton>
            )}
          </ButtonRow>
          {isStart && <StartNote>Esta es la escena inicial del juego</StartNote>}
        </HeaderSection>

        <Divider />

        {/* Escenario */}
        <SectionTitle>Escenario</SectionTitle>
        <ScenarioEditor
          scenario={scene.scenario}
          onChange={(scenario) =>
            updateScene(selectedNode.id, { ...scene, scenario })
          }
        />

        <Divider />

        {/* Secuencia de steps */}
        <SequenceEditor nodeId={selectedNode.id} steps={scene.sequence} />
      </PanelScroll>

      {confirmDelete && (
        <ConfirmDialog
          message={`¿Eliminar la escena "${sceneId}"? Esta acción no se puede deshacer.`}
          onConfirm={() => {
            deleteScene(selectedNode.id);
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </PanelContainer>
  );
};

export default ScenePanel;

const PanelContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: ${(p) => p.theme.terminal.background};
  border-left: 1px solid ${(p) => p.theme.terminal.border};
`;

const PanelScroll = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 6px;
`;

const StartNote = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.success};
  font-style: italic;
`;

const SectionTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
  text-transform: uppercase;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(p) => p.theme.terminal.border};
  margin: 0;
`;

const EmptyPanel = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
  padding: 20px;
`;

const EmptyText = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${(p) => p.theme.terminal.accentDim};
`;

const EmptyHint = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.border};
`;
