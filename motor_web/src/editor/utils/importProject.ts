// editor/utils/importProject.ts
// Importar proyecto desde ZIP

import JSZip from 'jszip';
import type { SceneFlowNode, EditorProject } from '../types/editor';
import { createDefaultProject } from '../types/editor';
import type { GameManifest, ScenesFile } from '../../types/game';

export interface ImportedProject {
  project: EditorProject;
  nodes: SceneFlowNode[];
}

export async function importProjectFromZip(file: File): Promise<ImportedProject> {
  const zip = await JSZip.loadAsync(file);

  // Find game.json and scenes.json (may be in a subfolder)
  let manifestJson: string | null = null;
  let scenesJson: string | null = null;

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const name = path.split('/').pop();
    if (name === 'game.json') {
      manifestJson = await zipEntry.async('string');
    } else if (name === 'scenes.json') {
      scenesJson = await zipEntry.async('string');
    }
  }

  if (!manifestJson || !scenesJson) {
    throw new Error('El ZIP debe contener game.json y scenes.json');
  }

  const manifest: GameManifest = JSON.parse(manifestJson);
  const scenesFile: ScenesFile = JSON.parse(scenesJson);

  // Create project from manifest
  const project: EditorProject = {
    ...createDefaultProject(),
    name: manifest.name,
    description: manifest.description,
    author: manifest.author,
    version: manifest.version,
    characters: manifest.characters || {},
    initialStats: manifest.initialStats || {},
    initialFlags: manifest.initialFlags || {},
    initialInventory: manifest.initialInventory || [],
    time: manifest.time || { duration: 5, phases: ['morning', 'afternoon', 'night'], initial: 'morning' },
  };

  // Create nodes from scenes
  const sceneEntries = Object.entries(scenesFile.scenes);
  const nodes: SceneFlowNode[] = sceneEntries.map(([sceneId, scene], index) => ({
    id: crypto.randomUUID(),
    type: 'sceneNode',
    position: {
      x: 250 + (index % 3) * 350,
      y: 100 + Math.floor(index / 3) * 250,
    },
    data: {
      sceneId,
      scene,
      isStart: sceneId === 'start',
    },
  }));

  return { project, nodes };
}
