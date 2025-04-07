// components/GameRenderer/ScenarioRenderer.jsx
// Renderiza los escenarios del juego

import React from 'react';
import styled from 'styled-components';

const ScenarioContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  text-align: center;
`;

const ScenarioImage = styled.img`
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  margin-bottom: 1rem;
  border-radius: 5px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
`;

const ScenarioDescription = styled.p`
  font-size: 1rem;
  margin: 0;
  color: ${props => props.theme.text};
  text-align: center;
  font-style: italic;
`;

const ScenarioRenderer = ({ scenario, currentPhase = 'morning' }) => {
  if (!scenario) return null;

  // Obtenemos la descripción según la fase del día
  const description = scenario.variants?.[currentPhase] || 
                      scenario.variants?.['morning'] || 
                      'No hay descripción disponible.';

  return (
    <ScenarioContainer>
      {scenario.image && (
        <ScenarioImage 
          src={scenario.image} 
          alt="Escenario actual" 
        />
      )}
      <ScenarioDescription>{description}</ScenarioDescription>
    </ScenarioContainer>
  );
};

export default ScenarioRenderer;