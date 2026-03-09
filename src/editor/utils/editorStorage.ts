// editor/utils/editorStorage.ts
// Persistencia de proyectos del editor con LocalForage

import localforage from 'localforage';
import type { SceneFlowNode, EditorProject } from '../types/editor';

const editorStore = localforage.createInstance({
  name: 'calabosos-y-babosos',
  storeName: 'editor-projects',
});

export interface SavedEditorProject {
  project: EditorProject;
  nodes: Array<{
    id: string;
    type: string;
    position: { x: number; y: number };
    data: SceneFlowNode['data'];
  }>;
}

export async function saveEditorProject(data: SavedEditorProject): Promise<void> {
  await editorStore.setItem(data.project.id, data);
}

export async function loadEditorProject(id: string): Promise<SavedEditorProject | null> {
  return editorStore.getItem<SavedEditorProject>(id);
}

export async function deleteEditorProject(id: string): Promise<void> {
  await editorStore.removeItem(id);
}

export async function listEditorProjects(): Promise<EditorProject[]> {
  const projects: EditorProject[] = [];
  await editorStore.iterate<SavedEditorProject, void>((value) => {
    if (value?.project) {
      projects.push(value.project);
    }
  });
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}
