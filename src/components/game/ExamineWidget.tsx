// components/game/ExamineWidget.tsx
// Widget para inspeccionar elementos del entorno

import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const Description = styled.div`
  color: ${(props) => props.theme.terminal.system};
  margin-bottom: 0.75rem;
  font-style: italic;
`;

const SubjectButton = styled.button`
  background-color: ${(props) => props.theme.button.background};
  color: ${(props) => props.theme.terminal.accent};
  border: 1px solid ${(props) => props.theme.terminal.accentDim};
  border-radius: 3px;
  padding: 8px 12px;
  margin: 4px 0;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  text-align: left;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.theme.button.hoverBackground};
    border-color: ${(props) => props.theme.terminal.accent};
    box-shadow: 0 0 5px ${(props) => props.theme.terminal.accent}40;
  }

  &:active {
    background-color: ${(props) => props.theme.button.activeBackground};
  }
`;

const ExitButton = styled(SubjectButton)`
  margin-top: 0.5rem;
  color: ${(props) => props.theme.terminal.accentDim};
  border-style: dashed;
`;

interface ExamineWidgetProps {
  description?: string;
  subjects: { id: string; label: string }[];
  exitText: string;
  onSelect: (subjectId: string) => void;
  onExit: () => void;
}

const ExamineWidget: React.FC<ExamineWidgetProps> = ({
  description,
  subjects,
  exitText,
  onSelect,
  onExit,
}) => {
  return (
    <Container>
      {description && <Description>{description}</Description>}
      {subjects.map((subject, i) => (
        <SubjectButton key={subject.id} onClick={() => onSelect(subject.id)}>
          [{i + 1}] {subject.label}
        </SubjectButton>
      ))}
      <ExitButton onClick={onExit}>[0] {exitText}</ExitButton>
    </Container>
  );
};

export default ExamineWidget;
