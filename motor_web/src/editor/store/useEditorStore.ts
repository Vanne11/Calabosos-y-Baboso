// editor/store/useEditorStore.ts
// Store Zustand del editor visual

import { create } from 'zustand';
import { applyNodeChanges } from '@xyflow/react';
import type { NodeChange } from '@xyflow/react';
import type { SceneFlowNode, SceneFlowEdge, EditorProject, ValidationIssue } from '../types/editor';
import { createDefaultProject, createDefaultScene, getNodeDestinations } from '../types/editor';
import type { Scene, SequenceStep } from '../../types/game';

interface EditorStore {
  // Proyecto actual
  project: EditorProject | null;
  setProject: (project: EditorProject) => void;
  updateProject: (partial: Partial<EditorProject>) => void;

  // Lista de proyectos guardados (para pantalla inicial)
  savedProjectIds: string[];
  setSavedProjectIds: (ids: string[]) => void;

  // Nodos y edges de ReactFlow
  nodes: SceneFlowNode[];
  edges: SceneFlowEdge[];
  setNodes: (nodes: SceneFlowNode[]) => void;
  setEdges: (edges: SceneFlowEdge[]) => void;
  onNodesChange: (changes: NodeChange<SceneFlowNode>[]) => void;

  // Selección
  selectedNodeId: string | null;
  setSelectedNodeId: (id: string | null) => void;

  // CRUD de escenas
  addScene: (sceneId?: string) => void;
  deleteScene: (nodeId: string) => void;
  duplicateScene: (nodeId: string) => void;
  updateSceneId: (nodeId: string, newSceneId: string) => void;
  updateScene: (nodeId: string, scene: Scene) => void;
  updateStep: (nodeId: string, stepIndex: number, step: SequenceStep) => void;
  addStep: (nodeId: string, stepType: SequenceStep['type']) => void;
  removeStep: (nodeId: string, stepIndex: number) => void;
  moveStep: (nodeId: string, fromIndex: number, toIndex: number) => void;

  // Edges se recalculan desde los datos
  recalculateEdges: () => void;

  // Dirty flag
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;

  // Validación
  issues: ValidationIssue[];
  setIssues: (issues: ValidationIssue[]) => void;

  // Nuevo proyecto
  createNewProject: () => void;

  // Reset
  resetEditor: () => void;
}

function createDefaultStep(type: SequenceStep['type']): SequenceStep {
  switch (type) {
    case 'dialog':
      return { type: 'dialog', character: 'narrator', lines: ['...'] };
    case 'choice':
      return { type: 'choice', options: [{ text: 'Opción 1', goto: '' }] };
    case 'dice':
      return {
        type: 'dice',
        stat: 'will_to_live',
        difficulty: 10,
        faces: 20,
        description: 'Tirada',
        results: {
          success: { text: 'Éxito', goto: '' },
          failure: { text: 'Fallo', goto: '' },
        },
      };
    case 'input':
      return { type: 'input', prompt: '¿Cómo te llamas?', saveAs: 'player_name', goto: '' };
    case 'effects':
      return { type: 'effects', effects: {} };
  }
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: null,
  setProject: (project) => set({ project }),
  updateProject: (partial) =>
    set((s) => {
      if (!s.project) return s;
      return { project: { ...s.project, ...partial, updatedAt: Date.now() }, isDirty: true };
    }),

  savedProjectIds: [],
  setSavedProjectIds: (savedProjectIds) => set({ savedProjectIds }),

  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) =>
    set((s) => {
      const newNodes = applyNodeChanges(changes, s.nodes) as SceneFlowNode[];
      return { nodes: newNodes, isDirty: true };
    }),

  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),

  addScene: (sceneId) => {
    const state = get();
    const id = sceneId || `escena_${state.nodes.length + 1}`;
    const existingIds = state.nodes.map((n) => n.data.sceneId);
    let finalId = id;
    let counter = 1;
    while (existingIds.includes(finalId)) {
      finalId = `${id}_${counter++}`;
    }

    // Position new node below the last one
    const maxY = state.nodes.reduce((max, n) => Math.max(max, n.position.y), 0);
    const newNode: SceneFlowNode = {
      id: crypto.randomUUID(),
      type: 'sceneNode',
      position: { x: 250, y: maxY + 200 },
      data: {
        sceneId: finalId,
        scene: createDefaultScene(),
        isStart: false,
      },
    };

    set({ nodes: [...state.nodes, newNode], isDirty: true });
    get().recalculateEdges();
  },

  deleteScene: (nodeId) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  duplicateScene: (nodeId) => {
    const state = get();
    const original = state.nodes.find((n) => n.id === nodeId);
    if (!original) return;

    const newNode: SceneFlowNode = {
      id: crypto.randomUUID(),
      type: 'sceneNode',
      position: {
        x: original.position.x + 50,
        y: original.position.y + 50,
      },
      data: {
        sceneId: `${original.data.sceneId}_copia`,
        scene: JSON.parse(JSON.stringify(original.data.scene)),
        isStart: false,
      },
    };

    set({ nodes: [...state.nodes, newNode], isDirty: true });
    get().recalculateEdges();
  },

  updateSceneId: (nodeId, newSceneId) =>
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, sceneId: newSceneId, isStart: newSceneId === 'start' } } : n
      ),
      isDirty: true,
    })),

  updateScene: (nodeId, scene) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, scene } } : n
      ),
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  updateStep: (nodeId, stepIndex, step) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const newSequence = [...n.data.scene.sequence];
        newSequence[stepIndex] = step;
        return { ...n, data: { ...n.data, scene: { ...n.data.scene, sequence: newSequence } } };
      }),
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  addStep: (nodeId, stepType) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        return {
          ...n,
          data: {
            ...n.data,
            scene: {
              ...n.data.scene,
              sequence: [...n.data.scene.sequence, createDefaultStep(stepType)],
            },
          },
        };
      }),
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  removeStep: (nodeId, stepIndex) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const newSequence = n.data.scene.sequence.filter((_, i) => i !== stepIndex);
        return { ...n, data: { ...n.data, scene: { ...n.data.scene, sequence: newSequence } } };
      }),
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  moveStep: (nodeId, fromIndex, toIndex) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId) return n;
        const newSequence = [...n.data.scene.sequence];
        const [moved] = newSequence.splice(fromIndex, 1);
        newSequence.splice(toIndex, 0, moved);
        return { ...n, data: { ...n.data, scene: { ...n.data.scene, sequence: newSequence } } };
      }),
      isDirty: true,
    }));
  },

  recalculateEdges: () => {
    const state = get();
    const sceneIdToNodeId = new Map<string, string>();
    for (const node of state.nodes) {
      sceneIdToNodeId.set(node.data.sceneId, node.id);
    }

    const newEdges: SceneFlowEdge[] = [];
    for (const node of state.nodes) {
      const destinations = getNodeDestinations(node.data.scene.sequence);
      for (const dest of destinations) {
        const targetNodeId = sceneIdToNodeId.get(dest);
        if (targetNodeId) {
          const edgeId = `${node.id}->${targetNodeId}-${dest}`;
          newEdges.push({
            id: edgeId,
            source: node.id,
            target: targetNodeId,
            label: dest,
            type: 'customEdge',
          });
        }
      }
    }

    set({ edges: newEdges });
  },

  isDirty: false,
  setDirty: (isDirty) => set({ isDirty }),

  issues: [],
  setIssues: (issues) => set({ issues }),

  createNewProject: () => {
    const project = createDefaultProject();
    const startNode: SceneFlowNode = {
      id: crypto.randomUUID(),
      type: 'sceneNode',
      position: { x: 250, y: 100 },
      data: {
        sceneId: 'start',
        scene: {
          scenario: {
            name: 'Inicio',
            description: 'El comienzo de la aventura...',
          },
          sequence: [
            {
              type: 'dialog',
              character: 'narrator',
              lines: ['Bienvenido a tu nueva aventura.'],
            },
          ],
        },
        isStart: true,
      },
    };

    set({
      project,
      nodes: [startNode],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      issues: [],
    });
  },

  resetEditor: () =>
    set({
      project: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      issues: [],
    }),
}));
