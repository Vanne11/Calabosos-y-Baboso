// editor/utils/exportProject.ts
// Exportar proyecto del editor a game.json + scenes.json + ZIP

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SceneFlowNode, EditorProject } from '../types/editor';
import { projectToManifest, nodesToScenesFile } from '../types/editor';
import type { GameManifest, ScenesFile } from '../../types/game';

export interface ExportedGameFiles {
  manifest: GameManifest;
  scenes: ScenesFile;
}

export function exportToGameFiles(
  project: EditorProject,
  nodes: SceneFlowNode[]
): ExportedGameFiles {
  const manifest = projectToManifest(project);
  const scenes = nodesToScenesFile(nodes);
  return { manifest, scenes };
}

export async function exportProjectZip(
  project: EditorProject,
  nodes: SceneFlowNode[]
): Promise<void> {
  const { manifest, scenes } = exportToGameFiles(project, nodes);

  const zip = new JSZip();
  const folderName = project.name.replace(/[^a-zA-Z0-9_-\s]/g, '').trim() || 'mi-juego';
  const folder = zip.folder(folderName)!;

  folder.file('game.json', JSON.stringify(manifest, null, 2));
  folder.file('scenes.json', JSON.stringify(scenes, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}.zip`);
}
