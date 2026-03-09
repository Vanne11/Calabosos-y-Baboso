// components/layout/StatusBar.tsx
// Barra de estado con stats del jugador, avatar del protagonista y compañeros

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import HoverPreview from '../ui/HoverPreview';

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 1rem;
  background-color: ${(props) => props.theme.widgets.background};
  border: 1px solid ${(props) => props.theme.widgets.border};
  border-radius: 5px;
  margin-bottom: 1rem;
  transition: all 0.5s ease;
`;

const PartyGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;


const CompanionName = styled.span`
  font-size: 0.75rem;
  color: ${(props) => props.theme.terminal.success || '#50fa7b'};
  flex-shrink: 0;
`;

const LevelBadge = styled.span`
  font-size: 0.65rem;
  font-weight: bold;
  color: ${(props) => props.theme.background};
  background-color: ${(props) => props.theme.accent};
  border-radius: 50%;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -4px;
  flex-shrink: 0;
`;

const TraitBadge = styled.span`
  font-size: 0.7rem;
  padding: 0 0.3rem;
  border-radius: 3px;
  background-color: ${(props) => props.theme.widgets.border};
  color: ${(props) => props.theme.textSecondary};
  flex-shrink: 0;
`;

const PlayerName = styled.span`
  font-size: 0.85rem;
  font-weight: bold;
  color: ${(props) => props.theme.accent};
  flex-shrink: 0;
`;

const Separator = styled.div`
  width: 1px;
  height: 24px;
  background-color: ${(props) => props.theme.widgets.border};
  flex-shrink: 0;
`;

const StatsArea = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  justify-content: flex-end;
  gap: 0 1rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
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
  const engine = useAppStore((s) => s.engine);
  const gameBasePath = useAppStore((s) => s.gameBasePath);
  const phase = useAppStore((s) => s.phase);

  if (phase !== 'game' || !playerState) return null;

  const numericStats = Object.entries(playerState.stats).filter(
    ([key, val]) => typeof val === 'number' && key in STAT_LABELS
  );

  // Protagonist from engine (role-based)
  const protagonist = engine?.getProtagonist?.();
  const rawImage = protagonist?.image || playerState.stats._protagonist_image;
  const protagonistImage = typeof rawImage === 'string'
    ? (rawImage.startsWith(gameBasePath) ? rawImage : `${gameBasePath}/${rawImage}`)
    : null;
  const playerName = typeof playerState.stats.nombre_jugador === 'string'
    ? playerState.stats.nombre_jugador
    : null;

  // Active companions (role-based, dynamic)
  const companions = engine?.getActiveCompanions?.() || [];

  // Character states
  const protagonistId = Object.keys(engine?.characters || {}).find(
    (id) => engine?.characters[id]?.role === 'protagonist'
  ) || 'protagonist';
  const protagonistState = playerState.characters?.[protagonistId];
  const activeTraits = playerState.activeTraits || [];
  const traitDefs = engine?.traitDefs || {};

  const resolveImage = (img?: string) => {
    if (!img) return null;
    return img.startsWith(gameBasePath) ? img : `${gameBasePath}/${img}`;
  };

  return (
    <Bar>
      <PartyGroup>
        {protagonistImage && <HoverPreview key={protagonistImage} src={protagonistImage} alt="Protagonista" size={32} />}
        {protagonistState && protagonistState.level > 1 && (
          <LevelBadge title={`Nivel ${protagonistState.level}`}>{protagonistState.level}</LevelBadge>
        )}
        {playerName && <PlayerName>{playerName}</PlayerName>}
        {activeTraits.slice(0, 3).map((traitId) => {
          const def = traitDefs[traitId];
          return def ? (
            <TraitBadge key={traitId} title={def.description}>
              {def.icon || '🔮'} {def.name}
            </TraitBadge>
          ) : null;
        })}
        {companions.map((comp) => {
          const compImg = resolveImage(comp.image);
          const compState = playerState.characters?.[comp.id];
          return (
            <React.Fragment key={comp.id}>
              <Separator />
              {compImg && <HoverPreview src={compImg} alt={comp.name} size={32} />}
              {compState && compState.level > 1 && (
                <LevelBadge title={`Nivel ${compState.level}`}>{compState.level}</LevelBadge>
              )}
              <CompanionName>{comp.name}</CompanionName>
            </React.Fragment>
          );
        })}
      </PartyGroup>
      <StatsArea>
        {numericStats.map(([key, value]) => (
          <StatItem key={key}>
            <StatLabel>{STAT_LABELS[key] || key}:</StatLabel>
            <StatValue>{String(value)}</StatValue>
          </StatItem>
        ))}
      </StatsArea>
    </Bar>
  );
};

export default StatusBar;
