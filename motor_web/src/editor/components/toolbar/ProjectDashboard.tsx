// editor/components/toolbar/ProjectDashboard.tsx
// Modal con estadísticas del proyecto

import React from 'react';
import styled from 'styled-components';
import { useEditorStore } from '../../store/useEditorStore';
import { useProjectContext } from '../../hooks/useProjectContext';
import { getNodeDestinations } from '../../types/editor';

interface ProjectDashboardProps {
  onClose: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onClose }) => {
  const project = useEditorStore((s) => s.project);
  const nodes = useEditorStore((s) => s.nodes);
  const ctx = useProjectContext();

  if (!project) return null;

  // Estadísticas básicas
  const totalScenes = nodes.length;
  const totalSteps = nodes.reduce((sum, n) => sum + n.data.scene.sequence.length, 0);
  const totalDialogLines = nodes.reduce((sum, n) => {
    return sum + n.data.scene.sequence.reduce((s2, step) => {
      return s2 + (step.type === 'dialog' ? step.lines.length : 0);
    }, 0);
  }, 0);

  // Escenas huérfanas (sin entrada desde otra escena)
  const allDestinations = new Set<string>();
  for (const node of nodes) {
    for (const dest of getNodeDestinations(node.data.scene.sequence)) {
      allDestinations.add(dest);
    }
  }
  const orphanScenes = nodes.filter(
    (n) => !n.data.isStart && !allDestinations.has(n.data.sceneId)
  );

  // Escenas sin salida
  const deadEndScenes = nodes.filter((n) => {
    const dests = getNodeDestinations(n.data.scene.sequence);
    return dests.length === 0 && n.data.scene.sequence.length > 0;
  });

  // Personajes definidos vs usados
  const definedChars = Object.keys(project.characters);
  const usedChars = ctx.characters;
  const unusedChars = definedChars.filter((c) => !usedChars.includes(c));
  const undefinedChars = usedChars.filter((c) => !definedChars.includes(c));

  // Profundidad del grafo (BFS)
  const visited = new Set<string>();
  let depth = 0;
  const startNode = nodes.find((n) => n.data.isStart);
  if (startNode) {
    const sceneMap = new Map(nodes.map((n) => [n.data.sceneId, n]));
    let frontier = [startNode.data.sceneId];
    visited.add(startNode.data.sceneId);
    while (frontier.length > 0) {
      depth++;
      const next: string[] = [];
      for (const sid of frontier) {
        const node = sceneMap.get(sid);
        if (!node) continue;
        for (const dest of getNodeDestinations(node.data.scene.sequence)) {
          if (!visited.has(dest) && sceneMap.has(dest)) {
            visited.add(dest);
            next.push(dest);
          }
        }
      }
      frontier = next;
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>Dashboard del Proyecto</Title>
          <CloseBtn onClick={onClose}>x</CloseBtn>
        </ModalHeader>
        <ModalBody>
          <StatGroup>
            <GroupTitle>General</GroupTitle>
            <Stat><StatLabel>Escenas</StatLabel><StatValue>{totalScenes}</StatValue></Stat>
            <Stat><StatLabel>Pasos totales</StatLabel><StatValue>{totalSteps}</StatValue></Stat>
            <Stat><StatLabel>Lineas de dialogo</StatLabel><StatValue>{totalDialogLines}</StatValue></Stat>
            <Stat><StatLabel>Profundidad del grafo</StatLabel><StatValue>{depth}</StatValue></Stat>
          </StatGroup>

          <StatGroup>
            <GroupTitle>Datos del proyecto</GroupTitle>
            <Stat><StatLabel>Stats</StatLabel><StatValue>{ctx.stats.length} ({ctx.stats.join(', ') || 'ninguna'})</StatValue></Stat>
            <Stat><StatLabel>Flags</StatLabel><StatValue>{ctx.flags.length} ({ctx.flags.join(', ') || 'ninguna'})</StatValue></Stat>
            <Stat><StatLabel>Items</StatLabel><StatValue>{ctx.items.length} ({ctx.items.join(', ') || 'ninguno'})</StatValue></Stat>
          </StatGroup>

          <StatGroup>
            <GroupTitle>Personajes</GroupTitle>
            <Stat><StatLabel>Definidos</StatLabel><StatValue>{definedChars.join(', ') || 'ninguno'}</StatValue></Stat>
            {unusedChars.length > 0 && (
              <WarnStat><StatLabel>Sin usar</StatLabel><StatValue>{unusedChars.join(', ')}</StatValue></WarnStat>
            )}
            {undefinedChars.length > 0 && (
              <ErrorStat><StatLabel>No definidos</StatLabel><StatValue>{undefinedChars.join(', ')}</StatValue></ErrorStat>
            )}
          </StatGroup>

          {(orphanScenes.length > 0 || deadEndScenes.length > 0) && (
            <StatGroup>
              <GroupTitle>Problemas</GroupTitle>
              {orphanScenes.length > 0 && (
                <WarnStat>
                  <StatLabel>Escenas huerfanas</StatLabel>
                  <StatValue>{orphanScenes.map((n) => n.data.sceneId).join(', ')}</StatValue>
                </WarnStat>
              )}
              {deadEndScenes.length > 0 && (
                <WarnStat>
                  <StatLabel>Sin salida</StatLabel>
                  <StatValue>{deadEndScenes.map((n) => n.data.sceneId).join(', ')}</StatValue>
                </WarnStat>
              )}
            </StatGroup>
          )}
        </ModalBody>
      </Modal>
    </Overlay>
  );
};

export default ProjectDashboard;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const Modal = styled.div`
  background: ${(p) => p.theme.terminal.background};
  border: 1px solid ${(p) => p.theme.terminal.accent};
  border-radius: 4px;
  width: 90%;
  max-width: 550px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid ${(p) => p.theme.terminal.border};
`;

const Title = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: ${(p) => p.theme.terminal.accent};
  font-weight: bold;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: ${(p) => p.theme.terminal.error};
  cursor: pointer;
  font-family: 'Courier New', monospace;
  font-size: 14px;
`;

const ModalBody = styled.div`
  padding: 14px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const StatGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const GroupTitle = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accent};
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 2px;
`;

const Stat = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
`;

const WarnStat = styled(Stat)`
  color: ${(p) => p.theme.terminal.warning};
`;

const ErrorStat = styled(Stat)`
  color: ${(p) => p.theme.terminal.error};
`;

const StatLabel = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: ${(p) => p.theme.terminal.accentDim};
  flex-shrink: 0;
`;

const StatValue = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: inherit;
  text-align: right;
  word-break: break-word;
`;
