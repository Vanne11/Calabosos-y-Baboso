// components/layout/StatusBar.tsx
// Barra de estado con stats del jugador

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

const Bar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.widgets.background};
  border: 1px solid ${(props) => props.theme.widgets.border};
  border-radius: 5px;
  margin-bottom: 1rem;
  transition: all 0.5s ease;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  margin-right: 0.5rem;
  color: ${(props) => props.theme.textSecondary};
`;

const StatValue = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: ${(props) => props.theme.accent};
`;

const STAT_LABELS: Record<string, string> = {
  will_to_live: 'Ganas de vivir',
  hunger: 'Hambre',
  pee: 'Pipí',
  fear: 'Miedo',
  reputation: 'Reputación',
};

const StatusBar: React.FC = () => {
  const playerState = useAppStore((s) => s.playerState);
  const phase = useAppStore((s) => s.phase);

  if (phase !== 'game' || !playerState) return null;

  const numericStats = Object.entries(playerState.stats).filter(
    ([key, val]) => typeof val === 'number' && key in STAT_LABELS
  );

  return (
    <Bar>
      <div>Fase: {playerState.time.phase}</div>
      <div style={{ display: 'flex' }}>
        {numericStats.map(([key, value]) => (
          <StatItem key={key}>
            <StatLabel>{STAT_LABELS[key] || key}:</StatLabel>
            <StatValue>{String(value)}</StatValue>
          </StatItem>
        ))}
      </div>
    </Bar>
  );
};

export default StatusBar;
