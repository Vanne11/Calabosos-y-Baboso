// editor/hooks/useProjectContext.ts
// Extrae stats, flags, items y personajes usados en todo el proyecto

import { useMemo } from 'react';
import { useEditorStore } from '../store/useEditorStore';

export interface ProjectContext {
  stats: string[];
  flags: string[];
  items: string[];
  characters: string[];
  sceneIds: string[];
}

export function useProjectContext(): ProjectContext {
  const project = useEditorStore((s) => s.project);
  const nodes = useEditorStore((s) => s.nodes);

  return useMemo(() => {
    const statsSet = new Set<string>();
    const flagsSet = new Set<string>();
    const itemsSet = new Set<string>();
    const charsSet = new Set<string>();
    const sceneIdsSet = new Set<string>();

    // Desde configuración del proyecto
    if (project) {
      Object.keys(project.initialStats).forEach((s) => statsSet.add(s));
      Object.keys(project.initialFlags).forEach((f) => flagsSet.add(f));
      project.initialInventory.forEach((i) => itemsSet.add(i));
      Object.keys(project.characters).forEach((c) => charsSet.add(c));
    }

    // Desde todos los nodos/steps
    for (const node of nodes) {
      sceneIdsSet.add(node.data.sceneId);

      for (const step of node.data.scene.sequence) {
        if (step.type === 'dialog') {
          charsSet.add(step.character);
        }

        if (step.type === 'dice') {
          statsSet.add(step.stat);
        }

        // Extraer de effects
        const extractEffects = (effects?: Record<string, any>) => {
          if (!effects) return;
          if (effects.stats) Object.keys(effects.stats).forEach((s) => statsSet.add(s));
          if (effects.flags) Object.keys(effects.flags).forEach((f) => flagsSet.add(f));
          if (effects.inventory) (effects.inventory as string[]).forEach((i) => itemsSet.add(i));
          if (effects.removeInventory) (effects.removeInventory as string[]).forEach((i) => itemsSet.add(i));
        };

        if (step.type === 'effects') {
          extractEffects(step.effects);
        }

        if (step.type === 'choice') {
          for (const opt of step.options) {
            extractEffects(opt.effects);
          }
        }

        if (step.type === 'dice') {
          for (const outcome of Object.values(step.results)) {
            if (outcome) extractEffects(outcome.effects);
          }
        }

        // Extraer de condiciones
        const extractCondition = (cond?: Record<string, any>) => {
          if (!cond) return;
          if (cond.stats) Object.keys(cond.stats).forEach((s) => statsSet.add(s));
          if (cond.flags) Object.keys(cond.flags).forEach((f) => flagsSet.add(f));
          if (cond.inventory) (cond.inventory as string[]).forEach((i) => itemsSet.add(i));
        };

        if ('condition' in step) {
          extractCondition((step as any).condition);
        }
      }
    }

    return {
      stats: [...statsSet].sort(),
      flags: [...flagsSet].sort(),
      items: [...itemsSet].sort(),
      characters: [...charsSet].sort(),
      sceneIds: [...sceneIdsSet].sort(),
    };
  }, [project, nodes]);
}
