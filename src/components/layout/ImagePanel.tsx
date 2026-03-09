// components/layout/ImagePanel.tsx
// Panel de imagen / logo - se adapta a su contenedor

import React from 'react';
import styled from 'styled-components';
import { useAppStore } from '../../store/useAppStore';
import { assetUrl } from '../../utils/assetUrl';

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 5px;
  border: 1px solid ${(props) => props.theme.terminal.border};
  background-color: ${(props) => props.theme.terminal.background};
`;

const ScenarioImage = styled.img`
  width: 120%;
  height: 100%;
  object-fit: cover;
  animation: panImage 30s ease-in-out forwards;

  @keyframes panImage {
    0% {
      object-position: 0% 50%;
    }
    50% {
      object-position: 100% 50%;
    }
    100% {
      object-position: 50% 50%;
    }
  }
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
        <ScenarioImage key={currentImage} src={assetUrl(currentImage)} alt="Escenario actual" />
      </Container>
    );
  }

  return (
    <Container>
      <TitleContainer>
        <Title>
          <LogoImg src={assetUrl("images/logo.png")} alt="Logo" />
          BabosOS
        </Title>
        <Subtitle>Calabosos y Babosos™</Subtitle>
      </TitleContainer>
    </Container>
  );
};

export default ImagePanel;
