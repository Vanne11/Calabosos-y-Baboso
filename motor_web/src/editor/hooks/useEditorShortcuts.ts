// editor/hooks/useEditorShortcuts.ts
// Atajos de teclado del editor

import { useEffect } from 'react';
import { useEditorStore } from '../store/useEditorStore';
import { undo, redo } from '../store/undoMiddleware';
import type { EditorSnapshot } from '../store/undoMiddleware';

interface ShortcutCallbacks {
  onSave: () => void;
  onExport: () => void;
  onSearch: () => void;
  onNewScene: () => void;
  onHelp: () => void;
}

export function useEditorShortcuts(callbacks: ShortcutCallbacks) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignorar si está en un input/textarea
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      const ctrl = e.ctrlKey || e.metaKey;

      // Ctrl+Z — Undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const state = useEditorStore.getState();
        const snapshot: EditorSnapshot = {
          project: state.project,
          nodes: state.nodes,
          edges: state.edges,
          selectedNodeId: state.selectedNodeId,
        };
        const prev = undo(snapshot);
        if (prev) {
          useEditorStore.setState({
            project: prev.project,
            nodes: prev.nodes,
            edges: prev.edges,
            selectedNodeId: prev.selectedNodeId,
          });
        }
        return;
      }

      // Ctrl+Shift+Z / Ctrl+Y — Redo
      if ((ctrl && e.shiftKey && e.key === 'Z') || (ctrl && e.key === 'y')) {
        e.preventDefault();
        const state = useEditorStore.getState();
        const snapshot: EditorSnapshot = {
          project: state.project,
          nodes: state.nodes,
          edges: state.edges,
          selectedNodeId: state.selectedNodeId,
        };
        const next = redo(snapshot);
        if (next) {
          useEditorStore.setState({
            project: next.project,
            nodes: next.nodes,
            edges: next.edges,
            selectedNodeId: next.selectedNodeId,
          });
        }
        return;
      }

      // Ctrl+S — Guardar
      if (ctrl && e.key === 's') {
        e.preventDefault();
        callbacks.onSave();
        return;
      }

      // Ctrl+E — Exportar
      if (ctrl && e.key === 'e') {
        e.preventDefault();
        callbacks.onExport();
        return;
      }

      // Ctrl+F — Buscar
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        callbacks.onSearch();
        return;
      }

      // Ctrl+N — Nueva escena
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        callbacks.onNewScene();
        return;
      }

      // Si estamos editando texto, no procesar los siguientes
      if (isEditing) return;

      // Delete — Eliminar escena seleccionada
      if (e.key === 'Delete') {
        const { selectedNodeId, nodes, deleteScene } = useEditorStore.getState();
        if (selectedNodeId) {
          const node = nodes.find((n) => n.id === selectedNodeId);
          if (node && !node.data.isStart) {
            deleteScene(selectedNodeId);
          }
        }
        return;
      }

      // Ctrl+D — Duplicar escena seleccionada
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        const { selectedNodeId, duplicateScene } = useEditorStore.getState();
        if (selectedNodeId) {
          duplicateScene(selectedNodeId);
        }
        return;
      }

      // Escape — Deseleccionar
      if (e.key === 'Escape') {
        useEditorStore.getState().setSelectedNodeId(null);
        return;
      }

      // ? — Ayuda
      if (e.key === '?') {
        callbacks.onHelp();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [callbacks]);
}
