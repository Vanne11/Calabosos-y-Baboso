// editor/types/editor.ts
// Tipos del editor visual de historias

import type { Node, Edge } from '@xyflow/react';
import type {
  GameManifest,
  ScenesFile,
  Scene,
  SequenceStep,
  CharacterDef,
  TimeCycle,
  ItemDef,
  SkillTreeDef,
  TraitDef,
} from '../../types/game';

// --- Proyecto del editor ---

export interface EditorProject {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  characters: Record<string, CharacterDef>;
  initialStats: Record<string, number | string>;
  initialFlags: Record<string, boolean>;
  initialInventory: string[];
  items: Record<string, ItemDef>;
  skillTrees: Record<string, SkillTreeDef>;
  traits: Record<string, TraitDef>;
  time: TimeCycle;
  createdAt: number;
  updatedAt: number;
}

// --- Nodos de ReactFlow ---

export interface SceneNodeData {
  sceneId: string;
  scene: Scene;
  isStart: boolean;
  [key: string]: unknown;
}

export type SceneFlowNode = Node<SceneNodeData>;
export type SceneFlowEdge = Edge;

// --- Validación ---

export type ValidationSeverity = 'error' | 'warning';

export interface ValidationIssue {
  severity: ValidationSeverity;
  message: string;
  sceneId?: string;
  stepIndex?: number;
}

// --- Helpers para defaults ---

export function createDefaultProject(): EditorProject {
  return {
    id: crypto.randomUUID(),
    name: 'Nuevo Proyecto',
    description: 'Una aventura viscosa',
    author: 'Anónimo',
    version: '1.0.0',
    characters: {
      narrator: {
        name: 'Narrador',
        description: 'El narrador omnisciente y sarcástico',
      },
    },
    initialStats: {
      will_to_live: 100,
    },
    initialFlags: {},
    initialInventory: [],
    items: {},
    skillTrees: {},
    traits: {},
    time: {
      duration: 5,
      phases: ['morning', 'afternoon', 'night'],
      initial: 'morning',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createDefaultScene(): Scene {
  return {
    scenario: {
      name: 'Nueva Escena',
      description: 'Descripción de la escena...',
    },
    sequence: [],
  };
}

// --- Conversión a formato del motor ---

export function projectToManifest(project: EditorProject): GameManifest {
  const manifest: GameManifest = {
    name: project.name,
    description: project.description,
    author: project.author,
    version: project.version,
    characters: project.characters,
    initialStats: project.initialStats,
    initialFlags: project.initialFlags,
    initialInventory: project.initialInventory,
    time: project.time,
  };
  if (Object.keys(project.items).length > 0) {
    manifest.items = project.items;
  }
  if (Object.keys(project.skillTrees).length > 0) {
    manifest.skillTrees = project.skillTrees;
  }
  if (Object.keys(project.traits).length > 0) {
    manifest.traits = project.traits;
  }
  return manifest;
}

export function nodesToScenesFile(nodes: SceneFlowNode[]): ScenesFile {
  const scenes: Record<string, Scene> = {};
  for (const node of nodes) {
    // Skip special nodes (they're system destinations, not real scenes)
    if (node.type === 'specialNode') continue;
    scenes[node.data.sceneId] = node.data.scene;
  }
  return { scenes };
}

// --- Resumen de steps para nodos ---

export function getStepSummary(steps: SequenceStep[]): string {
  const counts: Record<string, number> = {};
  for (const step of steps) {
    counts[step.type] = (counts[step.type] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');
}

export function getNodeDestinations(steps: SequenceStep[]): string[] {
  const destinations: string[] = [];
  for (const step of steps) {
    if (step.type === 'choice') {
      for (const opt of step.options) {
        if (opt.goto) destinations.push(opt.goto);
      }
    } else if (step.type === 'dice') {
      const results = step.results;
      if (results.success?.goto) destinations.push(results.success.goto);
      if (results.failure?.goto) destinations.push(results.failure.goto);
      if (results.critical_success?.goto) destinations.push(results.critical_success.goto);
      if (results.critical_failure?.goto) destinations.push(results.critical_failure.goto);
    } else if (step.type === 'input' && step.goto) {
      destinations.push(step.goto);
    } else if (step.type === 'branch') {
      for (const branch of step.branches) {
        if (branch.goto) destinations.push(branch.goto);
      }
    } else if (step.type === 'random') {
      for (const outcome of step.outcomes) {
        if (outcome.goto) destinations.push(outcome.goto);
      }
    } else if (step.type === 'check') {
      if (step.success?.goto) destinations.push(step.success.goto);
      if (step.failure?.goto) destinations.push(step.failure.goto);
    } else if (step.type === 'shop' && step.goto) {
      destinations.push(step.goto);
    } else if (step.type === 'combat') {
      if (step.results.victory?.goto) destinations.push(step.results.victory.goto);
      if (step.results.defeat?.goto) destinations.push(step.results.defeat.goto);
      if (step.results.flee?.goto) destinations.push(step.results.flee.goto);
    } else if (step.type === 'craft') {
      if (step.goto) destinations.push(step.goto);
      for (const recipe of step.recipes) {
        if (recipe.goto) destinations.push(recipe.goto);
      }
    } else if (step.type === 'puzzle') {
      if (step.success?.goto) destinations.push(step.success.goto);
      if (step.failure?.goto) destinations.push(step.failure.goto);
    } else if (step.type === 'examine' && step.goto) {
      destinations.push(step.goto);
    } else if (step.type === 'use_item') {
      if (step.goto) destinations.push(step.goto);
      for (const target of step.targets) {
        for (const accept of target.accepts) {
          if (accept.goto) destinations.push(accept.goto);
        }
      }
    } else if (step.type === 'timed_choice') {
      for (const opt of step.options) {
        if (opt.goto) destinations.push(opt.goto);
      }
    } else if (step.type === 'level_up' && step.goto) {
      destinations.push(step.goto);
    }
  }
  return [...new Set(destinations)];
}
