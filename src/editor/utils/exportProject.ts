// editor/utils/exportProject.ts
// Exportar proyecto del editor a game.json + scenes.json + ZIP

import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { SceneFlowNode, EditorProject } from '../types/editor';
import { projectToManifest, nodesToScenesFile } from '../types/editor';
import type { GameManifest, ScenesFile } from '../../types/game';
import { exportAllAssets } from './assetStorage';

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

// Detectar si un archivo es audio por extensión
function isAudioFile(filename: string): boolean {
  return /\.(mp3|ogg|wav|flac|aac|m4a|webm)$/i.test(filename);
}

// Convertir referencias asset: a paths relativos para el ZIP exportado
// Devuelve el mapa de asset keys a paths relativos usados
function resolveAssetReferences(
  manifest: GameManifest,
  scenes: ScenesFile
): Map<string, string> {
  const assetMap = new Map<string, string>(); // asset key → relative path
  const usedFilenames = new Map<string, number>(); // filename → count (para colisiones)

  function getUniquePath(assetKey: string): string {
    if (assetMap.has(assetKey)) return assetMap.get(assetKey)!;

    const filename = assetKey.split('/').pop() || assetKey;
    const isAudio = isAudioFile(filename);
    const folder = isAudio ? 'audio' : 'images';

    // Resolver colisiones de nombre
    const count = usedFilenames.get(filename) || 0;
    usedFilenames.set(filename, count + 1);

    const ext = filename.lastIndexOf('.') >= 0 ? filename.slice(filename.lastIndexOf('.')) : '';
    const base = filename.lastIndexOf('.') >= 0 ? filename.slice(0, filename.lastIndexOf('.')) : filename;
    const uniqueName = count === 0 ? filename : `${base}_${count}${ext}`;

    const relativePath = `${folder}/${uniqueName}`;
    assetMap.set(assetKey, relativePath);
    return relativePath;
  }

  function resolveString(value: string): string {
    if (!value.startsWith('asset:')) return value;
    const assetKey = value.slice(6); // quitar "asset:"
    return getUniquePath(assetKey);
  }

  // Resolver en manifest: characters
  for (const char of Object.values(manifest.characters)) {
    if (char.image) char.image = resolveString(char.image);
    if (char.altImages) {
      for (const [key, val] of Object.entries(char.altImages)) {
        char.altImages[key] = resolveString(val);
      }
    }
  }

  // Resolver en scenes
  for (const scene of Object.values(scenes.scenes)) {
    if (scene.scenario?.image) scene.scenario.image = resolveString(scene.scenario.image);
    if (scene.scenario?.music) scene.scenario.music = resolveString(scene.scenario.music);

    // Resolver en efectos dentro de steps (por si hay refs a imágenes en stats)
    for (const step of scene.sequence) {
      if (step.type === 'choice') {
        for (const opt of step.options) {
          if (opt.effects?.stats) {
            for (const [k, v] of Object.entries(opt.effects.stats)) {
              if (typeof v === 'string' && v.startsWith('asset:')) {
                opt.effects.stats[k] = resolveString(v);
              }
            }
          }
          if (opt.effects?.setStats) {
            for (const [k, v] of Object.entries(opt.effects.setStats)) {
              if (typeof v === 'string' && v.startsWith('asset:')) {
                opt.effects.setStats[k] = resolveString(v);
              }
            }
          }
        }
      } else if (step.type === 'effects') {
        if (step.effects?.stats) {
          for (const [k, v] of Object.entries(step.effects.stats)) {
            if (typeof v === 'string' && v.startsWith('asset:')) {
              step.effects.stats[k] = resolveString(v);
            }
          }
        }
        if (step.effects?.setStats) {
          for (const [k, v] of Object.entries(step.effects.setStats)) {
            if (typeof v === 'string' && v.startsWith('asset:')) {
              step.effects.setStats[k] = resolveString(v);
            }
          }
        }
      } else if (step.type === 'dice') {
        for (const outcome of [step.results.success, step.results.failure, step.results.critical_success, step.results.critical_failure]) {
          if (!outcome?.effects) continue;
          if (outcome.effects.stats) {
            for (const [k, v] of Object.entries(outcome.effects.stats)) {
              if (typeof v === 'string' && v.startsWith('asset:')) {
                outcome.effects.stats[k] = resolveString(v);
              }
            }
          }
          if (outcome.effects.setStats) {
            for (const [k, v] of Object.entries(outcome.effects.setStats)) {
              if (typeof v === 'string' && v.startsWith('asset:')) {
                outcome.effects.setStats[k] = resolveString(v);
              }
            }
          }
        }
      }
    }
  }

  return assetMap;
}

export async function exportProjectZip(
  project: EditorProject,
  nodes: SceneFlowNode[]
): Promise<void> {
  const { manifest, scenes } = exportToGameFiles(project, nodes);

  // Convertir asset: refs a paths relativos y resolver colisiones
  const assetMap = resolveAssetReferences(manifest, scenes);

  const zip = new JSZip();
  const folderName = project.name.replace(/[^a-zA-Z0-9_-\s]/g, '').trim() || 'mi-juego';
  const folder = zip.folder(folderName)!;

  folder.file('game.json', JSON.stringify(manifest, null, 2));
  folder.file('scenes.json', JSON.stringify(scenes, null, 2));

  // Incluir assets almacenados en LocalForage
  const assets = await exportAllAssets(project.id);
  if (assets.size > 0) {
    for (const [originalFilename, blob] of assets) {
      // Buscar el path relativo asignado a este asset
      const assetKey = `${project.id}/${originalFilename}`;
      const relativePath = assetMap.get(assetKey);
      if (relativePath) {
        folder.file(relativePath, blob);
      } else {
        // Asset no referenciado, guardarlo en images/ por defecto
        const fallbackFolder = isAudioFile(originalFilename) ? 'audio' : 'images';
        folder.file(`${fallbackFolder}/${originalFilename}`, blob);
      }
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${folderName}.zip`);
}
