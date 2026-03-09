// editor/store/useEditorStore.ts
// Store Zustand del editor visual

import { create } from 'zustand';
import { applyNodeChanges } from '@xyflow/react';
import type { NodeChange } from '@xyflow/react';
import type { SceneFlowNode, SceneFlowEdge, EditorProject, ValidationIssue } from '../types/editor';
import { createDefaultProject, createDefaultScene, getNodeDestinations } from '../types/editor';
import type { Scene, SequenceStep } from '../../types/game';
import { takeSnapshot, clearHistory as clearUndoHistory } from './undoMiddleware';
import type { SceneTemplate } from '../data/sceneTemplates';
import { SPECIAL_DESTINATIONS } from '../components/canvas/SpecialNode';
import type { SpecialFlowNode } from '../components/canvas/SpecialNode';

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
  addScene: (sceneId?: string, template?: SceneTemplate) => void;
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

  // Panel lateral
  panelWidth: number;
  setPanelWidth: (width: number) => void;
  panelCollapsed: boolean;
  setPanelCollapsed: (collapsed: boolean) => void;

  // Nuevo proyecto
  createNewProject: () => void;

  // Importar juego existente (desde terminal)
  pendingGameImport: string | null;
  setPendingGameImport: (name: string | null) => void;

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
    case 'branch':
      return { type: 'branch', branches: [{ goto: '' }] };
    case 'random':
      return { type: 'random', outcomes: [{ weight: 1, text: 'Algo sucede...' }] };
    case 'check':
      return {
        type: 'check',
        stat: 'will_to_live',
        threshold: '>=50',
        description: 'Comprobación',
        success: { text: 'Pasaste la prueba', goto: '' },
        failure: { text: 'No pasaste la prueba', goto: '' },
      };
    case 'shop':
      return {
        type: 'shop',
        title: 'Tienda',
        currency: 'dinero',
        items: [{ id: 'item_1', name: 'Objeto', price: 10 }],
        goto: '',
      };
    case 'combat':
      return {
        type: 'combat',
        enemy: { name: 'Enemigo', hp: 30, attack: 5, defense: 2 },
        playerStat: 'will_to_live',
        attackStat: 'reputation',
        actions: ['attack', 'defend', 'flee'],
        results: {
          victory: { text: '¡Victoria!', goto: '' },
          defeat: { text: 'Derrota...', goto: '' },
          flee: { text: 'Huiste del combate.', goto: '' },
        },
      };
    case 'notify':
      return { type: 'notify', style: 'info', title: 'Notificación', text: 'Algo sucedió.' };
    case 'wait':
      return { type: 'wait', text: 'Esperando...', duration: 2000, style: 'dots' };
    case 'sound':
      return { type: 'sound', src: '' };
    case 'craft':
      return {
        type: 'craft',
        recipes: [{
          ingredients: ['', ''],
          result: '',
          text: '¡Has creado algo nuevo!',
          consume: true,
        }],
        failText: 'Eso no tiene ningún sentido...',
      };
    case 'puzzle':
      return {
        type: 'puzzle',
        puzzleType: 'code',
        description: 'Un mecanismo antiguo...',
        config: { type: 'code', answers: ['respuesta'], prompt: 'Introduce el código:' },
        maxAttempts: 3,
        success: { text: '¡Correcto!', goto: '' },
        failure: { text: 'Has fallado el puzzle.', goto: '' },
      };
    case 'examine':
      return {
        type: 'examine',
        description: 'Miras a tu alrededor...',
        subjects: [
          { id: 'subject_1', label: 'Algo interesante', text: 'No ves nada especial.' },
        ],
        exitText: 'Seguir adelante',
      };
    case 'use_item':
      return {
        type: 'use_item',
        description: 'Hay algo aquí que requiere un objeto...',
        targets: [
          { id: 'target_1', label: 'Objetivo', accepts: [], defaultText: 'Eso no funciona aquí.' },
        ],
        failText: 'No puedes usar eso aquí.',
      };
    case 'timed_choice':
      return {
        type: 'timed_choice',
        duration: 10000,
        defaultIndex: 0,
        timeoutText: '¡Demasiado lento!',
        options: [
          { text: 'Opción rápida', goto: '' },
          { text: 'Otra opción', goto: '' },
        ],
      };
    case 'level_up':
      return {
        type: 'level_up',
        description: '¡Has ganado suficiente experiencia!',
        skillPoints: 1,
        goto: '',
      };
  }
}

function createSpecialNodes(): SpecialFlowNode[] {
  return Object.entries(SPECIAL_DESTINATIONS).map(([id, def], i) => ({
    id: `special_${id}`,
    type: 'specialNode' as const,
    position: { x: 600 + i * 200, y: 0 },
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
}

// Helper to push undo snapshot before mutations
function pushUndo() {
  const s = useEditorStore.getState();
  takeSnapshot({
    project: s.project,
    nodes: s.nodes,
    edges: s.edges,
    selectedNodeId: s.selectedNodeId,
  });
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  project: null,
  setProject: (project) => set({ project }),
  updateProject: (partial) =>
    set((s) => {
      if (!s.project) return s;
      pushUndo();
      return { project: { ...s.project, ...partial, updatedAt: Date.now() }, isDirty: true };
    }),

  savedProjectIds: [],
  setSavedProjectIds: (savedProjectIds) => set({ savedProjectIds }),

  nodes: [],
  edges: [],
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set((s) => {
      const newNodes = applyNodeChanges(changes, s.nodes) as SceneFlowNode[];
      return { nodes: newNodes, isDirty: true };
    });
    // Recalcular handles al mover nodos
    const hasPositionChange = changes.some((c) => c.type === 'position' && !c.dragging);
    if (hasPositionChange) {
      get().recalculateEdges();
    }
  },

  selectedNodeId: null,
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),

  addScene: (sceneId, template) => {
    pushUndo();
    const state = get();
    const id = sceneId || (template ? `escena_${template.id}` : `escena_${state.nodes.length + 1}`);
    const existingIds = state.nodes.map((n) => n.data.sceneId);
    let finalId = id;
    let counter = 1;
    while (existingIds.includes(finalId)) {
      finalId = `${id}_${counter++}`;
    }

    // Position new node below the last one
    const maxY = state.nodes.reduce((max, n) => Math.max(max, n.position.y), 0);
    const scene = template
      ? JSON.parse(JSON.stringify(template.scene))
      : createDefaultScene();

    const newNode: SceneFlowNode = {
      id: crypto.randomUUID(),
      type: 'sceneNode',
      position: { x: 250, y: maxY + 200 },
      data: {
        sceneId: finalId,
        scene,
        isStart: false,
      },
    };

    set({ nodes: [...state.nodes, newNode], isDirty: true });
    get().recalculateEdges();
  },

  deleteScene: (nodeId) => {
    const node = get().nodes.find((n) => n.id === nodeId);
    if (!node || node.type === 'specialNode') return; // No borrar nodos especiales
    pushUndo();
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      selectedNodeId: s.selectedNodeId === nodeId ? null : s.selectedNodeId,
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  duplicateScene: (nodeId) => {
    pushUndo();
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

  updateSceneId: (nodeId, newSceneId) => {
    pushUndo();
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, sceneId: newSceneId, isStart: newSceneId === 'start' } } : n
      ),
      isDirty: true,
    }));
  },

  updateScene: (nodeId, scene) => {
    pushUndo();
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, scene } } : n
      ),
      isDirty: true,
    }));
    get().recalculateEdges();
  },

  updateStep: (nodeId, stepIndex, step) => {
    pushUndo();
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
    pushUndo();
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
    pushUndo();
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
    pushUndo();
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
    const nodePositions = new Map<string, { x: number; y: number }>();
    for (const node of state.nodes) {
      sceneIdToNodeId.set(node.data.sceneId, node.id);
      nodePositions.set(node.id, node.position);
    }

    const NODE_W = 280;
    const NODE_H = 120;

    const newEdges: SceneFlowEdge[] = [];
    for (const node of state.nodes) {
      if (node.type === 'specialNode') continue; // Special nodes are targets only
      const destinations = getNodeDestinations(node.data.scene.sequence);
      for (const dest of destinations) {
        const targetNodeId = sceneIdToNodeId.get(dest);
        if (targetNodeId) {
          const srcPos = nodePositions.get(node.id)!;
          const tgtPos = nodePositions.get(targetNodeId)!;

          // Centro de cada nodo
          const dx = (tgtPos.x + NODE_W / 2) - (srcPos.x + NODE_W / 2);
          const dy = (tgtPos.y + NODE_H / 2) - (srcPos.y + NODE_H / 2);

          let sourceHandle: string;
          let targetHandle: string;

          if (Math.abs(dx) > Math.abs(dy)) {
            // Conexión horizontal
            if (dx > 0) {
              sourceHandle = 'source-right';
              targetHandle = 'target-left';
            } else {
              sourceHandle = 'source-left';
              targetHandle = 'target-right';
            }
          } else {
            // Conexión vertical
            if (dy > 0) {
              sourceHandle = 'source-bottom';
              targetHandle = 'target-top';
            } else {
              sourceHandle = 'source-top';
              targetHandle = 'target-bottom';
            }
          }

          const edgeId = `${node.id}->${targetNodeId}-${dest}`;
          newEdges.push({
            id: edgeId,
            source: node.id,
            target: targetNodeId,
            sourceHandle,
            targetHandle,
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

  panelWidth: 380,
  setPanelWidth: (panelWidth) => set({ panelWidth }),
  panelCollapsed: false,
  setPanelCollapsed: (panelCollapsed) => set({ panelCollapsed }),

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
      nodes: [startNode, ...createSpecialNodes()] as SceneFlowNode[],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      issues: [],
    });
  },

  pendingGameImport: null,
  setPendingGameImport: (pendingGameImport) => set({ pendingGameImport }),

  resetEditor: () => {
    clearUndoHistory();
    set({
      project: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      isDirty: false,
      issues: [],
      pendingGameImport: null,
    });
  },
}));
