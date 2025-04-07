// components/GameRenderer/GameContainer.jsx
// Contenedor principal para el juego

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import ScenarioRenderer from './ScenarioRenderer';
import DialogRenderer from './DialogRenderer';
import ButtonWidget from '../Widgets/ButtonWidget';
import { processRoute } from '../../engine/routeResolver';
import { applyModifiers } from '../../engine/gameState';

const GameContainerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 1rem;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.widgets.background};
  border-bottom: 1px solid ${props => props.theme.widgets.border};
  font-size: 0.8rem;
  margin-bottom: 1rem;
  border-radius: 5px 5px 0 0;
`;

const GameContainer = ({ 
  gameData, 
  gameState, 
  updateGameState, 
  currentRoute, 
  setCurrentRoute,
  setCurrentImage
}) => {
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentDialog, setCurrentDialog] = useState(null);
  const [currentWidget, setCurrentWidget] = useState(null);
  const [renderQueue, setRenderQueue] = useState([]);
  
  // Procesar una nueva ruta
  useEffect(() => {
    if (!gameData || !currentRoute) return;
    
    // Limpiar estado actual
    setCurrentScenario(null);
    setCurrentDialog(null);
    setCurrentWidget(null);
    setRenderQueue([]);
    
    // Procesar la ruta
    processRoute(currentRoute, gameData, gameState, {
      updateGameState,
      setCurrentScenario: (scenario) => {
        setCurrentScenario(scenario);
        // Actualizar la imagen principal si existe
        if (scenario && scenario.image) {
          setCurrentImage(scenario.image);
        }
      },
      showDialog: (dialog) => {
        // Añadir diálogo a la cola de renderizado
        setRenderQueue(prev => [...prev, { type: 'dialog', content: dialog }]);
      },
      showWidget: (widget) => {
        // Añadir widget a la cola de renderizado
        setRenderQueue(prev => [...prev, { type: 'widget', content: widget }]);
      }
    });
    
  }, [gameData, currentRoute, gameState, updateGameState, setCurrentImage]);
  
  // Procesar la cola de renderizado
  useEffect(() => {
    if (renderQueue.length === 0) return;
    
    // Tomar el primer elemento de la cola
    const nextItem = renderQueue[0];
    
    if (nextItem.type === 'dialog') {
      setCurrentDialog(nextItem.content);
      setCurrentWidget(null);
    } else if (nextItem.type === 'widget') {
      setCurrentDialog(null);
      setCurrentWidget(nextItem.content);
    }
    
  }, [renderQueue]);
  
  // Cuando se completa un diálogo, pasar al siguiente elemento
  const handleDialogComplete = () => {
    setCurrentDialog(null);
    setRenderQueue(prev => prev.slice(1)); // Eliminar el primer elemento
  };
  
  // Cuando se selecciona una opción en un widget
  const handleOptionSelect = (option) => {
    // Aplicar modificadores si existen
    if (option.modifiers && updateGameState) {
      updateGameState(prevState => applyModifiers(prevState, option.modifiers));
    }
    
    // Ir a la ruta especificada
    if (option.destination && setCurrentRoute) {
      setCurrentRoute(option.destination);
    }
    
    // Limpiar el widget actual
    setCurrentWidget(null);
    setRenderQueue(prev => prev.slice(1)); // Eliminar el primer elemento
  };
  
  // Si no hay datos de juego o estado, no renderizar nada
  if (!gameData || !gameState) {
    return null;
  }
  
  return (
    <GameContainerWrapper>
      <StatusBar>
        <div>Fase: {gameState.time.currentPhase}</div>
        <div>Ruta: {currentRoute}</div>
      </StatusBar>
      
      {/* Renderizar el escenario actual */}
      <ScenarioRenderer 
        scenario={currentScenario} 
        currentPhase={gameState.time.currentPhase}
      />
      
      {/* Renderizar diálogo actual si existe */}
      {currentDialog && (
        <DialogRenderer 
          dialog={currentDialog} 
          gameState={gameState}
          onComplete={handleDialogComplete}
        />
      )}
      
      {/* Renderizar widget actual si existe */}
      {currentWidget && (
        <ButtonWidget 
          widget={currentWidget}
          onOptionSelect={handleOptionSelect}
        />
      )}
    </GameContainerWrapper>
  );
};

export default GameContainer;