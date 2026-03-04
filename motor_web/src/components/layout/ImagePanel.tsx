// components/layout/ImagePanel.tsx
// Panel de imagen / logo

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  height: 200px;
  overflow: hidden;
`;

const ScenarioImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
`;

const TitleContainer = styled.div`
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: ${(props) => props.theme.accent};
  text-shadow: 0 0 5px ${(props) => props.theme.accent}33;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const LogoImg = styled.img`
  height: 3rem;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin: 0;
  color: ${(props) => props.theme.textSecondary};
`;

const ImagePanel: React.FC = () => {
  const currentImage = useAppStore((s) => s.currentImage);

  if (currentImage) {
    return (
      <Container>
        <ScenarioImage src={currentImage} alt="Escenario actual" />
      </Container>
    );
  }

  return (
    <Container>
      <TitleContainer>
        <Title>
          <LogoImg src="images/logo.png" alt="Logo" />
          BabosOS
        </Title>
        <Subtitle>Calabosos y Babosos™</Subtitle>
      </TitleContainer>
    </Container>
  );
};

export default ImagePanel;
