// editor/components/EditorApp.tsx
// Layout raíz del editor: toolbar + canvas + panel lateral

import React, { useEffect, useState, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { ReactFlowProvider } from '@xyflow/react';
import { useEditorStore } from '../store/useEditorStore';
import EditorToolbar from './toolbar/EditorToolbar';
import EditorCanvas from './canvas/EditorCanvas';
import ScenePanel from './panels/ScenePanel';
import TerminalButton from './shared/TerminalButton';
import ConfirmDialog from './shared/ConfirmDialog';
import ShortcutsModal from './toolbar/ShortcutsModal';
import SceneEditModal from './panels/SceneEditModal';
import { listEditorProjects, loadEditorProject, deleteEditorProject } from '../utils/editorStorage';
import { importProjectFromZip, importProjectFromGame } from '../utils/importProject';
import { exportProjectZip } from '../utils/exportProject';
import { useEditorShortcuts } from '../hooks/useEditorShortcuts';
import { sceneTemplates } from '../data/sceneTemplates';
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
  const pendingGameImport = useEditorStore((s) => s.pendingGameImport);
  const setPendingGameImport = useEditorStore((s) => s.setPendingGameImport);
  const panelWidth = useEditorStore((s) => s.panelWidth);
  const setPanelWidth = useEditorStore((s) => s.setPanelWidth);
  const panelCollapsed = useEditorStore((s) => s.panelCollapsed);
  const setPanelCollapsed = useEditorStore((s) => s.setPanelCollapsed);
  const nodes = useEditorStore((s) => s.nodes);

  const [savedProjects, setSavedProjects] = useState<EditorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [editModalNodeId, setEditModalNodeId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const templateMenuRef = useRef<HTMLDivElement>(null);

  // Importar juego existente si viene de "editor <game>"
  useEffect(() => {
    if (!pendingGameImport) return;
    const gameName = pendingGameImport;
    setPendingGameImport(null);

    importProjectFromGame(gameName)
      .then((imported) => {
        setProject(imported.project);
        setNodes(imported.nodes);
        setDirty(false);
        setTimeout(() => recalculateEdges(), 0);
      })
      .catch((err) => {
        console.error(`Error importando "${gameName}":`, err);
      });
  }, [pendingGameImport]);

  // Cargar lista de proyectos guardados
  useEffect(() => {
    if (!pendingGameImport) {
      loadProjectList();
    }
  }, []);

  // Cerrar menú de templates al hacer click fuera
  useEffect(() => {
    if (!showTemplateMenu) return;
    const handler = (e: MouseEvent) => {
      if (templateMenuRef.current && !templateMenuRef.current.contains(e.target as Node)) {
        setShowTemplateMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTemplateMenu]);

  // Atajos de teclado
  const shortcutCallbacks = useCallback(() => ({
    onSave: () => document.querySelector<HTMLButtonElement>('[data-save-btn]')?.click(),
    onExport: () => {
      const s = useEditorStore.getState();
      if (s.project) exportProjectZip(s.project, s.nodes);
    },
    onSearch: () => setShowSearch(true),
    onNewScene: () => addScene(),
    onHelp: () => setShowShortcuts(true),
  }), [addScene]);

  useEditorShortcuts(shortcutCallbacks());

  // Resize panel
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const diff = resizeRef.current.startX - e.clientX;
      const newWidth = Math.max(250, Math.min(600, resizeRef.current.startWidth + diff));
      setPanelWidth(newWidth);
    };
    const handleMouseUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setPanelWidth]);

  const startResize = (e: React.MouseEvent) => {
    resizeRef.current = { startX: e.clientX, startWidth: panelWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

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
    const loadedNodes: SceneFlowNode[] = saved.nodes.map((n) => ({
      ...n,
      type: n.type || 'sceneNode',
    }));
    setNodes(loadedNodes);
    setDirty(false);
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

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Si estamos importando un juego, mostrar loading
  if (!project && pendingGameImport) {
    return (
      <ProjectSelector>
        <SelectorHeader>Editor de Historias</SelectorHeader>
        <LoadingText>Cargando "{pendingGameImport}"...</LoadingText>
      </ProjectSelector>
    );
  }

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
        <EditorToolbar
          onSearch={() => setShowSearch(true)}
        />
        <EditorBody>
          <CanvasSection>
            <EditorCanvas
              showSearch={showSearch}
              onCloseSearch={() => setShowSearch(false)}
              onNodeDoubleClick={(nodeId) => {
                useEditorStore.getState().setSelectedNodeId(nodeId);
                setEditModalNodeId(nodeId);
              }}
            />
            <BottomControls>
              <AddSceneBtnWrapper ref={templateMenuRef}>
                <AddSceneBtn onClick={() => addScene()}>+ Escena</AddSceneBtn>
                <TemplateToggle onClick={() => setShowTemplateMenu(!showTemplateMenu)}>
                  v
                </TemplateToggle>
                {showTemplateMenu && (
                  <TemplateMenu>
                    {sceneTemplates.map((t) => (
                      <TemplateItem
                        key={t.id}
                        onClick={() => {
                          addScene(undefined, t);
                          setShowTemplateMenu(false);
                        }}
                      >
                        <TemplateName>{t.name}</TemplateName>
                        <TemplateDesc>{t.description}</TemplateDesc>
                      </TemplateItem>
                    ))}
                  </TemplateMenu>
                )}
              </AddSceneBtnWrapper>
            </BottomControls>
          </CanvasSection>

          {!panelCollapsed && (
            <>
              <ResizeHandle onMouseDown={startResize} />
              <PanelSection style={{ width: panelWidth }}>
                <PanelCollapseBtn onClick={() => setPanelCollapsed(true)} title="Colapsar panel">
                  &raquo;
                </PanelCollapseBtn>
                <ScenePanel />
              </PanelSection>
            </>
          )}
          {panelCollapsed && (
            <CollapsedPanel onClick={() => setPanelCollapsed(false)} title="Expandir panel">
              &laquo;
            </CollapsedPanel>
          )}
        </EditorBody>
      </EditorContainer>

      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
      {editModalNodeId && (
        <SceneEditModal
          nodeId={editModalNodeId}
          onClose={() => setEditModalNodeId(null)}
          onNavigate={(newNodeId) => {
            setEditModalNodeId(newNodeId);
            useEditorStore.getState().setSelectedNodeId(newNodeId);
          }}
        />
      )}
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
  flex-shrink: 0;
  position: relative;
  min-width: 250px;
  max-width: 600px;
`;

const ResizeHandle = styled.div`
  width: 4px;
  cursor: col-resize;
  background: transparent;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: ${(p) => p.theme.terminal.accent};
  }
`;

const PanelCollapseBtn = styled.button`
  position: absolute;
  top: 8px;
  left: -16px;
  z-index: 10;
  width: 16px;
  height: 24px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: 1px solid ${(p) => p.theme.terminal.border};
  border-right: none;
  border-radius: 3px 0 0 3px;
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${(p) => p.theme.terminal.accent};
  }
`;

const CollapsedPanel = styled.button`
  width: 20px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border: none;
  border-left: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    color: ${(p) => p.theme.terminal.accent};
    background: ${(p) => p.theme.terminal.background};
  }
`;

const BottomControls = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 4px;
`;

const AddSceneBtnWrapper = styled.div`
  position: relative;
  display: flex;
`;

const AddSceneBtn = styled.button`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  padding: 8px 16px;
  background: ${(p) => p.theme.terminal.accent};
  color: ${(p) => p.theme.terminal.background};
  border: none;
  border-radius: 4px 0 0 4px;
  cursor: pointer;
  font-weight: bold;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }
`;

const TemplateToggle = styled.button`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 8px 8px;
  background: ${(p) => p.theme.terminal.accent};
  color: ${(p) => p.theme.terminal.background};
  border: none;
  border-left: 1px solid rgba(0,0,0,0.2);
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-weight: bold;

  &:hover {
    opacity: 0.85;
  }
`;

const TemplateMenu = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  margin-bottom: 4px;
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  min-width: 220px;
  z-index: 20;
  overflow: hidden;
`;

const TemplateItem = styled.div`
  padding: 8px 10px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;

  &:hover {
    background: ${(p) => p.theme.terminal.dialogBackground};
  }
`;

const TemplateName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const TemplateDesc = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
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
