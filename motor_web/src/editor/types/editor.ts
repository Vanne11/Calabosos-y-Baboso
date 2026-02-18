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
  return {
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
}

export function nodesToScenesFile(nodes: SceneFlowNode[]): ScenesFile {
  const scenes: Record<string, Scene> = {};
  for (const node of nodes) {
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
    }
  }
  return [...new Set(destinations)];
}
