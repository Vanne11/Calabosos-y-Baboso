// editor/store/undoMiddleware.ts
// Sistema de undo/redo basado en snapshots del estado

import type { SceneFlowNode, SceneFlowEdge } from '../types/editor';
import type { EditorProject } from '../types/editor';

export interface EditorSnapshot {
  project: EditorProject | null;
  nodes: SceneFlowNode[];
  edges: SceneFlowEdge[];
  selectedNodeId: string | null;
}

const MAX_HISTORY = 50;

let past: EditorSnapshot[] = [];
let future: EditorSnapshot[] = [];

export function takeSnapshot(state: EditorSnapshot): void {
  past.push(JSON.parse(JSON.stringify(state)));
  if (past.length > MAX_HISTORY) {
    past.shift();
  }
  // Cualquier nueva acción descarta el futuro
  future = [];
}

export function undo(current: EditorSnapshot): EditorSnapshot | null {
  if (past.length === 0) return null;
  future.push(JSON.parse(JSON.stringify(current)));
  return past.pop()!;
}

export function redo(current: EditorSnapshot): EditorSnapshot | null {
  if (future.length === 0) return null;
  past.push(JSON.parse(JSON.stringify(current)));
  return future.pop()!;
}

export function canUndo(): boolean {
  return past.length > 0;
}

export function canRedo(): boolean {
  return future.length > 0;
}

export function clearHistory(): void {
  past = [];
  future = [];
}
