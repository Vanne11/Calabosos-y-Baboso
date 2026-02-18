// editor/components/EditorApp.tsx
// Layout raíz del editor: toolbar + canvas + panel lateral

import React, { useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { ReactFlowProvider } from '@xyflow/react';
import { useEditorStore } from '../store/useEditorStore';
import EditorToolbar from './toolbar/EditorToolbar';
import EditorCanvas from './canvas/EditorCanvas';
import ScenePanel from './panels/ScenePanel';
import TerminalButton from './shared/TerminalButton';
import ConfirmDialog from './shared/ConfirmDialog';
import { listEditorProjects, loadEditorProject, deleteEditorProject } from '../utils/editorStorage';
import { importProjectFromZip } from '../utils/importProject';
import type { EditorProject, SceneFlowNode } from '../types/editor';

const EditorApp: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const createNewProject = useEditorStore((s) => s.createNewProject);
  const setProject = useEditorStore((s) => s.setProject);
  const setNodes = useEditorStore((s) => s.setNodes);
  const setDirty = useEditorStore((s) => s.setDirty);
  const addScene = useEditorStore((s) => s.addScene);
  const recalculateEdges = useEditorStore((s) => s.recalculateEdges);
  const setSavedProjectIds = useEditorStore((s) => s.setSavedProjectIds);

  const [savedProjects, setSavedProjects] = useState<EditorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar lista de proyectos guardados
  useEffect(() => {
    loadProjectList();
  }, []);

  const loadProjectList = async () => {
    setLoading(true);
    const projects = await listEditorProjects();
    setSavedProjects(projects);
    setSavedProjectIds(projects.map((p) => p.id));
    setLoading(false);
  };

  const handleLoadProject = async (id: string) => {
    const saved = await loadEditorProject(id);
    if (!saved) return;

    setProject(saved.project);
    const nodes: SceneFlowNode[] = saved.nodes.map((n) => ({
      ...n,
      type: n.type || 'sceneNode',
    }));
    setNodes(nodes);
    setDirty(false);
    // Recalculate edges after nodes are set
    setTimeout(() => recalculateEdges(), 0);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteEditorProject(id);
    setDeleteTarget(null);
    await loadProjectList();
  };

  const handleImportZip = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importProjectFromZip(file);
      setProject(imported.project);
      setNodes(imported.nodes);
      setDirty(true);
      setTimeout(() => recalculateEdges(), 0);
    } catch (err) {
      alert(`Error importando: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Ctrl+S para guardar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger save via toolbar
        document.querySelector<HTMLButtonElement>('[data-save-btn]')?.click();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Si no hay proyecto activo, mostrar pantalla de selección
  if (!project) {
    return (
      <ProjectSelector>
        <SelectorHeader>Editor de Historias</SelectorHeader>
        <SelectorSubheader>Crea o carga un proyecto</SelectorSubheader>

        <ButtonGroup>
          <TerminalButton variant="primary" onClick={createNewProject}>
            Nuevo Proyecto
          </TerminalButton>
          <TerminalButton onClick={() => fileInputRef.current?.click()}>
            Importar ZIP
          </TerminalButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={handleImportZip}
          />
        </ButtonGroup>

        {loading && <LoadingText>Cargando proyectos...</LoadingText>}

        {!loading && savedProjects.length > 0 && (
          <SavedList>
            <SavedTitle>Proyectos guardados</SavedTitle>
            {savedProjects.map((p) => (
              <SavedItem key={p.id}>
                <SavedInfo onClick={() => handleLoadProject(p.id)}>
                  <SavedName>{p.name}</SavedName>
                  <SavedMeta>
                    {p.author} | v{p.version} | {new Date(p.updatedAt).toLocaleDateString()}
                  </SavedMeta>
                </SavedInfo>
                <TerminalButton
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget(p.id)}
                >
                  x
                </TerminalButton>
              </SavedItem>
            ))}
          </SavedList>
        )}

        {!loading && savedProjects.length === 0 && (
          <EmptyText>No hay proyectos guardados. Crea uno nuevo para empezar.</EmptyText>
        )}

        {deleteTarget && (
          <ConfirmDialog
            message="¿Eliminar este proyecto? No se puede deshacer."
            onConfirm={() => handleDeleteProject(deleteTarget)}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </ProjectSelector>
    );
  }

  // Editor activo
  return (
    <ReactFlowProvider>
      <EditorContainer>
        <EditorToolbar />
        <EditorBody>
          <CanvasSection>
            <EditorCanvas />
            <AddSceneBtn onClick={() => addScene()}>+ Escena</AddSceneBtn>
          </CanvasSection>
          <PanelSection>
            <ScenePanel />
          </PanelSection>
        </EditorBody>
      </EditorContainer>
    </ReactFlowProvider>
  );
};

export default EditorApp;

const EditorContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: ${(p) => p.theme.background};
`;

const EditorBody = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const CanvasSection = styled.div`
  flex: 1;
  position: relative;
  min-width: 0;
`;

const PanelSection = styled.div`
  width: 35%;
  min-width: 300px;
  max-width: 450px;
  flex-shrink: 0;
`;

const AddSceneBtn = styled.button`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 8px 16px;
  background: ${(p) => p.theme.terminal.accent};
  color: ${(p) => p.theme.terminal.background};
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

const ProjectSelector = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background: ${(p) => p.theme.background};
  gap: 16px;
  padding: 20px;
`;

const SelectorHeader = styled.h1`
  font-family: 'Courier New', monospace;
  font-size: 24px;
  color: ${(p) => p.theme.terminal.accent};
  margin: 0;
`;

const SelectorSubheader = styled.p`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${(p) => p.theme.terminal.accentDim};
  margin: 0;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  margin: 12px 0;
`;

const LoadingText = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.accentDim};
`;

const SavedList = styled.div`
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const SavedTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accentDim};
  text-transform: uppercase;
  margin-bottom: 4px;
`;

const SavedItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover {
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;

const SavedInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const SavedName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: ${(p) => p.theme.terminal.text};
  font-weight: bold;
`;

const SavedMeta = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
`;

const EmptyText = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.border};
  text-align: center;
  margin-top: 20px;
`;
