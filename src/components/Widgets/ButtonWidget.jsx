// components/Widgets/ButtonWidget.jsx
// Widget de botones para tomar decisiones

import React from 'react';
import styled from 'styled-components';

const WidgetContainer = styled.div`
  padding: 1rem;
  margin: 1rem 0;
  background-color: ${props => props.theme.widgets.background};
  border-radius: 5px;
  border: 1px solid ${props => props.theme.widgets.border};
`;

const Title = styled.h3`
  margin: 0 0 1rem 0;
  color: ${props => props.theme.text};
  font-size: 1.1rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Button = styled.button`
  background-color: ${props => props.theme.button.background};
  color: ${props => props.theme.button.text};
  border: none;
  border-radius: 3px;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  text-align: left;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: ${props => props.theme.button.hoverBackground};
  }
  
  &:active {
    background-color: ${props => props.theme.button.activeBackground};
  }
`;

const ButtonWidget = ({ widget, onOptionSelect }) => {
  if (!widget || !widget.options || widget.options.length === 0) {
    return null;
  }
  
  const handleOptionClick = (option) => {
    if (onOptionSelect) {
      onOptionSelect(option);
    }
  };
  
  return (
    <WidgetContainer>
      {widget.title && <Title>{widget.title}</Title>}
      <ButtonsContainer>
        {widget.options.map((option, index) => (
          <Button 
            key={index} 
            onClick={() => handleOptionClick(option)}
          >
            {option.text}
          </Button>
        ))}
      </ButtonsContainer>
    </WidgetContainer>
  );
};

export default ButtonWidget;