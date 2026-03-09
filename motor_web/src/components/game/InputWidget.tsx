// components/game/InputWidget.tsx
// Widget para capturar input de texto del jugador

import React from 'react';
import styled from 'styled-components';

const InputContainer = styled.div`
  margin: 1rem 0;
`;

const PromptText = styled.div`
  color: ${(props) => props.theme.terminal.info};
  margin-bottom: 0.5rem;
`;

interface InputWidgetProps {
  prompt: string;
}

const InputWidget: React.FC<InputWidgetProps> = ({ prompt }) => {
  return (
    <InputContainer>
      <PromptText>{prompt}</PromptText>
    </InputContainer>
  );
};

export default InputWidget;
