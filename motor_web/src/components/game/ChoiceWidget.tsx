// components/game/ChoiceWidget.tsx
// Botones de opciones interactivos

import React from 'react';
import styled from 'styled-components';

const OptionsContainer = styled.div`
  margin-top: 1rem;
  margin-bottom: 1rem;
`;

const OptionButton = styled.button`
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

interface ChoiceWidgetProps {
  options: { text: string; index: number }[];
  onSelect: (index: number) => void;
}

const ChoiceWidget: React.FC<ChoiceWidgetProps> = ({ options, onSelect }) => {
  return (
    <OptionsContainer>
      {options.map((opt) => (
        <OptionButton key={opt.index} onClick={() => onSelect(opt.index)}>
          [{opt.index + 1}] {opt.text}
        </OptionButton>
      ))}
    </OptionsContainer>
  );
};

export default ChoiceWidget;
