// components/game/LevelUpWidget.tsx
// Pantalla de subir nivel y asignar skill points

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin: 1rem 0;
`;

const Header = styled.div`
  color: ${(props) => props.theme.terminal.success};
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 0.25rem;
`;

const SubHeader = styled.div`
  color: ${(props) => props.theme.terminal.info};
  font-size: 0.85rem;
  margin-bottom: 0.75rem;
`;

const SkillButton = styled.button<{ $disabled?: boolean }>`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.$disabled ? props.theme.terminal.accentDim : props.theme.terminal.accent};
  border: 1px solid ${(props) => props.$disabled ? props.theme.terminal.tableBorder : props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 3px 0;
  cursor: ${(props) => props.$disabled ? 'not-allowed' : 'pointer'};
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  opacity: ${(props) => props.$disabled ? 0.5 : 1};
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
  }
`;

const SkillName = styled.span`
  font-weight: bold;
`;

const SkillInfo = styled.div`
  color: ${(props) => props.theme.terminal.system};
  font-size: 0.8rem;
  margin-top: 2px;
`;

const SkillLevel = styled.span`
  color: ${(props) => props.theme.terminal.info};
`;

const DoneButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.success};
  border: 1px solid ${(props) => props.theme.terminal.success}80;
  border-radius: 3px;
  padding: 8px 12px;
  margin-top: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.success};
    box-shadow: 0 0 5px ${(props) => props.theme.terminal.success}40;
  }
`;

interface LevelUpWidgetProps {
  characterName: string;
  newLevel: number;
  skillPoints: number;
  availableSkills: {
    id: string;
    name: string;
    description: string;
    icon?: string;
    currentLevel: number;
    maxLevel: number;
    cost: number;
    canLearn: boolean;
  }[];
  description?: string;
  onLearnSkill: (skillId: string) => void;
  onDone: () => void;
}

const LevelUpWidget: React.FC<LevelUpWidgetProps> = ({
  characterName,
  newLevel,
  skillPoints,
  availableSkills,
  description,
  onLearnSkill,
  onDone,
}) => {
  return (
    <Container>
      <Header>⬆️ {characterName} — Nivel {newLevel}</Header>
      <SubHeader>
        Puntos de habilidad: {skillPoints}
        {description && ` — ${description}`}
      </SubHeader>

      {availableSkills.map((skill) => (
        <SkillButton
          key={skill.id}
          $disabled={!skill.canLearn}
          disabled={!skill.canLearn}
          onClick={() => onLearnSkill(skill.id)}
        >
          <SkillName>{skill.icon || '✦'} {skill.name}</SkillName>
          {' '}<SkillLevel>(Nv. {skill.currentLevel}/{skill.maxLevel} — Coste: {skill.cost})</SkillLevel>
          <SkillInfo>{skill.description}</SkillInfo>
        </SkillButton>
      ))}

      <DoneButton onClick={onDone}>
        Continuar
      </DoneButton>
    </Container>
  );
};

export default LevelUpWidget;
