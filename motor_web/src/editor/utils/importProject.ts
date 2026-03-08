// editor/utils/importProject.ts
// Importar proyecto desde ZIP o desde juego existente en public/games/

import JSZip from 'jszip';
import type { SceneFlowNode, EditorProject } from '../types/editor';
import { createDefaultProject } from '../types/editor';
import type { GameManifest, ScenesFile, Scene } from '../../types/game';
import { saveAsset } from './assetStorage';
import { SPECIAL_DESTINATIONS } from '../components/canvas/SpecialNode';
import type { SpecialFlowNode } from '../components/canvas/SpecialNode';

export interface ImportedProject {
  project: EditorProject;
  nodes: SceneFlowNode[];
}

function convertToEditorProject(manifest: GameManifest, scenesFile: ScenesFile): ImportedProject {
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
    items: manifest.items || {},
    time: manifest.time || { duration: 5, phases: ['morning', 'afternoon', 'night'], initial: 'morning' },
  };

  const sceneEntries = Object.entries(scenesFile.scenes);
  const sceneNodes: SceneFlowNode[] = sceneEntries.map(([sceneId, scene], index) => ({
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

  // Add special destination nodes
  const specialNodes: SpecialFlowNode[] = Object.entries(SPECIAL_DESTINATIONS).map(([id, def], i) => ({
    id: `special_${id}`,
    type: 'specialNode' as const,
    position: { x: 250 + (sceneEntries.length % 3 + i) * 350, y: 100 + (Math.floor(sceneEntries.length / 3) + 1) * 250 },
    data: {
      sceneId: id,
      label: def.label,
      icon: def.icon,
      color: def.color,
      description: def.description,
      isSpecial: true as const,
    },
    draggable: true,
    selectable: true,
    deletable: false,
  }));

  const nodes = [...sceneNodes, ...specialNodes] as SceneFlowNode[];

  return { project, nodes };
}

// Convierte paths relativos (images/foo.png, audio/bar.ogg) a asset:projectId/filename
// y guarda los blobs extraídos del ZIP en LocalForage
function convertPathsToAssetRefs(
  manifest: GameManifest,
  scenesFile: ScenesFile,
  projectId: string,
  savedAssets: Map<string, string> // relativePath → assetKey
): void {
  function toAssetRef(path: string): string {
    if (!path || path.startsWith('asset:')) return path;
    const assetKey = savedAssets.get(path);
    if (assetKey) return `asset:${assetKey}`;
    // Intentar solo con el filename
    const filename = path.split('/').pop() || path;
    for (const [relPath, key] of savedAssets) {
      if (relPath.endsWith(`/${filename}`) || relPath === filename) {
        return `asset:${key}`;
      }
    }
    return path; // No encontrado, dejar como está
  }

  // Manifest: characters
  for (const char of Object.values(manifest.characters)) {
    if (char.image) char.image = toAssetRef(char.image);
    if (char.altImages) {
      for (const [key, val] of Object.entries(char.altImages)) {
        char.altImages[key] = toAssetRef(val);
      }
    }
  }

  // Scenes
  for (const scene of Object.values(scenesFile.scenes)) {
    if (scene.scenario?.image) scene.scenario.image = toAssetRef(scene.scenario.image);
    if (scene.scenario?.music) scene.scenario.music = toAssetRef(scene.scenario.music);
    convertStepPaths(scene, toAssetRef);
  }
}

function convertStepPaths(scene: Scene, toAssetRef: (p: string) => string): void {
  for (const step of scene.sequence) {
    if (step.type === 'choice') {
      for (const opt of step.options) {
        convertEffectPaths(opt.effects, toAssetRef);
      }
    } else if (step.type === 'effects') {
      convertEffectPaths(step.effects, toAssetRef);
    } else if (step.type === 'dice') {
      for (const outcome of [step.results.success, step.results.failure, step.results.critical_success, step.results.critical_failure]) {
        if (outcome) convertEffectPaths(outcome.effects, toAssetRef);
      }
    }
  }
}

function convertEffectPaths(
  effects: { stats?: Record<string, number | string>; setStats?: Record<string, number | string> } | undefined,
  toAssetRef: (p: string) => string
): void {
  if (!effects) return;
  for (const statsObj of [effects.stats, effects.setStats]) {
    if (!statsObj) continue;
    for (const [k, v] of Object.entries(statsObj)) {
      if (typeof v === 'string' && (v.startsWith('images/') || v.startsWith('audio/'))) {
        statsObj[k] = toAssetRef(v);
      }
    }
  }
}

export async function importProjectFromZip(file: File): Promise<ImportedProject> {
  const zip = await JSZip.loadAsync(file);

  let manifestJson: string | null = null;
  let scenesJson: string | null = null;
  const assetFiles: { relativePath: string; entry: JSZip.JSZipObject }[] = [];

  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;
    const name = path.split('/').pop();
    if (name === 'game.json') {
      manifestJson = await zipEntry.async('string');
    } else if (name === 'scenes.json') {
      scenesJson = await zipEntry.async('string');
    } else if (/\.(png|jpe?g|gif|webp|svg|bmp|ico|mp3|ogg|wav|flac|aac|m4a|webm)$/i.test(path)) {
      // Extraer path relativo (quitar carpeta raíz del ZIP)
      const parts = path.split('/');
      const relativePath = parts.length > 1 ? parts.slice(1).join('/') : path;
      assetFiles.push({ relativePath, entry: zipEntry });
    }
  }

  if (!manifestJson || !scenesJson) {
    throw new Error('El ZIP debe contener game.json y scenes.json');
  }

  const manifest: GameManifest = JSON.parse(manifestJson);
  const scenesFile: ScenesFile = JSON.parse(scenesJson);

  // Generar un projectId anticipado para los assets
  const projectId = crypto.randomUUID();

  // Restaurar assets del ZIP a LocalForage
  const savedAssets = new Map<string, string>(); // relativePath → assetKey
  for (const { relativePath, entry } of assetFiles) {
    const blob = await entry.async('blob');
    const filename = relativePath.split('/').pop() || relativePath;
    const assetKey = await saveAsset(projectId, filename, blob);
    savedAssets.set(relativePath, assetKey);
  }

  // Convertir paths relativos en JSON a asset: refs ANTES de crear el proyecto
  if (savedAssets.size > 0) {
    convertPathsToAssetRefs(manifest, scenesFile, projectId, savedAssets);
  }

  // Crear proyecto con los paths ya convertidos
  const result = convertToEditorProject(manifest, scenesFile);
  // Usar el mismo ID que usamos para los assets
  result.project.id = projectId;

  return result;
}

export async function importProjectFromGame(gameName: string): Promise<ImportedProject> {
  const basePath = `games/${gameName}`;

  const [manifestRes, scenesRes] = await Promise.all([
    fetch(`${basePath}/game.json`),
    fetch(`${basePath}/scenes.json`),
  ]);

  if (!manifestRes.ok) {
    throw new Error(`No se encontró game.json para "${gameName}"`);
  }
  if (!scenesRes.ok) {
    throw new Error(`No se encontró scenes.json para "${gameName}"`);
  }

  const manifest: GameManifest = await manifestRes.json();
  const scenesFile: ScenesFile = await scenesRes.json();

  if (!scenesFile.scenes || Object.keys(scenesFile.scenes).length === 0) {
    throw new Error(`El juego "${gameName}" no tiene escenas`);
  }

  return convertToEditorProject(manifest, scenesFile);
}
