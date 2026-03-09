// editor/utils/autoLayout.ts
// Auto-layout BFS del grafo de escenas - distribución horizontal por niveles

import type { SceneFlowNode } from '../types/editor';
import { getNodeDestinations } from '../types/editor';

const X_GAP = 350;
const Y_GAP = 200;
const MAX_PER_ROW = 4;

export function autoLayout(nodes: SceneFlowNode[]): SceneFlowNode[] {
  if (nodes.length === 0) return nodes;

  // Construir mapa sceneId -> node
  const sceneMap = new Map<string, SceneFlowNode>();
  for (const node of nodes) {
    sceneMap.set(node.data.sceneId, node);
  }

  // Construir grafo de adyacencia
  const adj = new Map<string, string[]>();
  for (const node of nodes) {
    const dests = getNodeDestinations(node.data.scene.sequence);
    adj.set(node.data.sceneId, dests.filter((d) => sceneMap.has(d)));
  }

  // BFS desde "start" o primer nodo
  const startNode = nodes.find((n) => n.data.isStart) || nodes[0];
  const visited = new Set<string>();
  const levels: string[][] = [];

  const queue: { sceneId: string; level: number }[] = [{ sceneId: startNode.data.sceneId, level: 0 }];
  visited.add(startNode.data.sceneId);

  while (queue.length > 0) {
    const { sceneId, level } = queue.shift()!;
    if (!levels[level]) levels[level] = [];
    levels[level].push(sceneId);

    const neighbors = adj.get(sceneId) || [];
    for (const next of neighbors) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push({ sceneId: next, level: level + 1 });
      }
    }
  }

  // Nodos huérfanos (no alcanzables desde start)
  const orphans = nodes.filter((n) => !visited.has(n.data.sceneId)).map((n) => n.data.sceneId);
  if (orphans.length > 0) {
    levels.push(orphans);
  }

  // Si un nivel tiene demasiados nodos, dividirlo en sub-filas
  const expandedLevels: string[][] = [];
  for (const level of levels) {
    if (level.length <= MAX_PER_ROW) {
      expandedLevels.push(level);
    } else {
      for (let i = 0; i < level.length; i += MAX_PER_ROW) {
        expandedLevels.push(level.slice(i, i + MAX_PER_ROW));
      }
    }
  }

  // Asignar posiciones centradas
  const newPositions = new Map<string, { x: number; y: number }>();
  for (let row = 0; row < expandedLevels.length; row++) {
    const level = expandedLevels[row];
    const totalWidth = (level.length - 1) * X_GAP;
    const startX = -totalWidth / 2;

    for (let col = 0; col < level.length; col++) {
      newPositions.set(level[col], {
        x: startX + col * X_GAP,
        y: row * Y_GAP,
      });
    }
  }

  return nodes.map((n) => {
    const pos = newPositions.get(n.data.sceneId);
    if (!pos) return n;
    return { ...n, position: pos };
  });
}
