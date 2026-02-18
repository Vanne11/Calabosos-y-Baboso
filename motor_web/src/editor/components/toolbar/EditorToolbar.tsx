// editor/components/toolbar/EditorToolbar.tsx
// Barra superior: guardar, exportar, probar, configuración, volver

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { useAppStore } from '../../../store/useAppStore';
import TerminalButton from '../shared/TerminalButton';
import ProjectSettingsModal from './ProjectSettingsModal';
import ValidationPanel from './ValidationPanel';
import { saveEditorProject } from '../../utils/editorStorage';
import { exportProjectZip } from '../../utils/exportProject';
import { exportToGameFiles } from '../../utils/exportProject';
import { validateProject } from '../../utils/validation';
import { GameEngine } from '../../../engine/GameEngine';

const EditorToolbar: React.FC = () => {
  const project = useEditorStore((s) => s.project);
  const nodes = useEditorStore((s) => s.nodes);
  const isDirty = useEditorStore((s) => s.isDirty);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setIssues = useEditorStore((s) => s.setIssues);
  const issues = useEditorStore((s) => s.issues);
  const resetEditor = useEditorStore((s) => s.resetEditor);

  const setPhase = useAppStore((s) => s.setPhase);
  const setEngine = useAppStore((s) => s.setEngine);
  const setGameManifest = useAppStore((s) => s.setGameManifest);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const addEntry = useAppStore((s) => s.addEntry);

  const [showSettings, setShowSettings] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-save con debounce de 5s
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSave = useCallback(async () => {
    if (!project) return;
    setSaving(true);
    try {
      await saveEditorProject({
        project: { ...project, updatedAt: Date.now() },
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type || 'sceneNode',
          position: n.position,
          data: n.data,
        })),
      });
      setDirty(false);
    } catch (err) {
      console.error('Error guardando proyecto:', err);
    }
    setSaving(false);
  }, [project, nodes, setDirty]);

  useEffect(() => {
    if (isDirty && project) {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(doSave, 5000);
    }
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [isDirty, doSave, project]);

  const handleSave = async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    await doSave();
  };

  const handleExport = async () => {
    if (!project) return;
    await exportProjectZip(project, nodes);
  };

  const handleValidate = () => {
    if (!project) return;
    const newIssues = validateProject(project, nodes);
    setIssues(newIssues);
    setShowValidation(true);
  };

  const handleTest = () => {
    if (!project) return;
    const { manifest, scenes } = exportToGameFiles(project, nodes);

    // Validar antes de probar
    const newIssues = validateProject(project, nodes);
    const errors = newIssues.filter((i) => i.severity === 'error');
    if (errors.length > 0) {
      setIssues(newIssues);
      setShowValidation(true);
      return;
    }

    // Crear engine y lanzar
    const engine = new GameEngine(manifest, scenes);
    setEngine(engine);
    setGameManifest(manifest);
    clearHistory();
    addEntry({ type: 'system', content: '[green]Modo prueba del editor[/green]' });
    addEntry({ type: 'system', content: `[yellow]Probando: ${manifest.name}[/yellow]` });
    addEntry({ type: 'system', content: '[dim]Escribe "quit" para volver al editor[/dim]' });
    addEntry({ type: 'system', content: ' ' });

    // Marcar returnToEditor y cambiar a game phase
    useAppStore.setState({ returnToEditor: true });
    setPhase('game');
  };

  const handleBack = async () => {
    if (isDirty) {
      await doSave();
    }
    resetEditor();
    setPhase('shell');
  };

  const errorCount = issues.filter((i) => i.severity === 'error').length;
  const warningCount = issues.filter((i) => i.severity === 'warning').length;

  return (
    <ToolbarContainer>
      <LeftSection>
        <BackBtn onClick={handleBack} title="Volver a la terminal">
          &larr; Terminal
        </BackBtn>
        <ProjectName>{project?.name || 'Sin nombre'}</ProjectName>
        {isDirty && <DirtyIndicator>*</DirtyIndicator>}
        {saving && <SavingText>guardando...</SavingText>}
      </LeftSection>

      <RightSection>
        {(errorCount > 0 || warningCount > 0) && (
          <IssuesBadge onClick={handleValidate}>
            {errorCount > 0 && <ErrorBadge>{errorCount}!</ErrorBadge>}
            {warningCount > 0 && <WarnBadge>{warningCount}?</WarnBadge>}
          </IssuesBadge>
        )}
        <TerminalButton size="sm" onClick={handleSave} disabled={!isDirty}>
          Guardar
        </TerminalButton>
        <TerminalButton size="sm" onClick={handleExport}>
          Exportar ZIP
        </TerminalButton>
        <TerminalButton size="sm" onClick={handleValidate}>
          Validar
        </TerminalButton>
        <TerminalButton variant="primary" size="sm" onClick={handleTest}>
          Probar
        </TerminalButton>
        <TerminalButton variant="ghost" size="sm" onClick={() => setShowSettings(true)}>
          Config
        </TerminalButton>
      </RightSection>

      {showSettings && <ProjectSettingsModal onClose={() => setShowSettings(false)} />}
      {showValidation && <ValidationPanel onClose={() => setShowValidation(false)} />}
    </ToolbarContainer>
  );
};

export default EditorToolbar;

const ToolbarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: ${(p) => p.theme.terminal.dialogBackground};
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
  flex-shrink: 0;
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const BackBtn = styled.button`
  background: none;
  border: 1px solid ${(p) => p.theme.terminal.border};
  color: ${(p) => p.theme.terminal.accentDim};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 3px;

  &:hover {
    color: ${(p) => p.theme.terminal.accent};
    border-color: ${(p) => p.theme.terminal.accent};
  }
`;

const ProjectName = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.text};
  font-weight: bold;
`;

const DirtyIndicator = styled.span`
  color: ${(p) => p.theme.terminal.warning};
  font-size: 16px;
  font-weight: bold;
`;

const SavingText = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: ${(p) => p.theme.terminal.accentDim};
  font-style: italic;
`;

const IssuesBadge = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  gap: 4px;
`;

const ErrorBadge = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.error};
  font-weight: bold;
`;

const WarnBadge = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.warning};
  font-weight: bold;
`;
