// El editor visual no debe perder campos del manifiesto que no edita (pools, reglas, IA, códice...).

import { describe, it, expect } from 'vitest';
import { projectToManifest, EDITOR_MANIFEST_FIELDS } from '../../src/editor/types/editor';
import type { EditorProject } from '../../src/editor/types/editor';
import { loadGameFromDisk } from '../helpers';

describe('importar y exportar calabosos en el editor', () => {
  const { manifest } = loadGameFromDisk('calabosos');
  const project: EditorProject = {
    id: 'x', name: manifest.name, description: manifest.description, author: manifest.author, version: manifest.version,
    characters: manifest.characters, initialStats: manifest.initialStats, initialFlags: manifest.initialFlags,
    initialInventory: manifest.initialInventory, items: manifest.items ?? {}, skillTrees: {}, traits: manifest.traits ?? {},
    time: manifest.time, contentRating: manifest.contentRating, statDefs: manifest.statDefs,
    manifestExtras: Object.fromEntries(Object.entries(manifest).filter(([k]) => !(EDITOR_MANIFEST_FIELDS as readonly string[]).includes(k))),
    createdAt: 0, updatedAt: 0,
  };
  const exported = projectToManifest(project) as unknown as Record<string, unknown>;

  it.each(Object.keys(manifest).filter((k) => k !== 'sceneFiles'))('conserva "%s"', (key) => {
    expect(exported[key]).toEqual((manifest as unknown as Record<string, unknown>)[key]);
  });
  it('no exporta sceneFiles (el editor genera un único scenes.json)', () => {
    expect('sceneFiles' in exported).toBe(false);
  });
});
