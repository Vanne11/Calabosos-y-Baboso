// components/GameRenderer/DialogRenderer.jsx
// Renderiza los diálogos del juego

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const DialogContainer = styled.div`
  display: flex;
  padding: 1rem;
  background-color: ${props => props.theme.widgets.background};
  border-radius: 5px;
  margin: 1rem 0;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  border: 1px solid ${props => props.theme.widgets.border};
`;

const CharacterImage = styled.img`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  margin-right: 1rem;
  object-fit: cover;
`;

const DialogContent = styled.div`
  flex: 1;
`;

const CharacterName = styled.h3`
  margin: 0 0 0.5rem 0;
  color: ${props => props.theme.accent};
  font-size: 1.1rem;
`;

const DialogText = styled.p`
  margin: 0.5rem 0;
  font-size: 1rem;
  line-height: 1.4;
  color: ${props => props.theme.text};
`;

const ContinueButton = styled.button`
  background-color: ${props => props.theme.button.background};
  color: ${props => props.theme.button.text};
  border: none;
  border-radius: 3px;
  padding: 0.5rem 1rem;
  margin-top: 1rem;
  cursor: pointer;
  font-family: inherit;
  
  &:hover {
    background-color: ${props => props.theme.button.hoverBackground};
  }
  
  &:active {
    background-color: ${props => props.theme.button.activeBackground};
  }
`;

const DialogRenderer = ({ dialog, gameState, onComplete }) => {
  const [currentLine, setCurrentLine] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  
  // Si no hay diálogo, no renderizamos nada
  if (!dialog) return null;
  
  // Procesar el contenido del diálogo
  useEffect(() => {
    if (!dialog) return;
    
    // Reiniciar el estado cuando cambia el diálogo
    setCurrentLine(0);
    setDisplayedLines([]);
    
    // Determinar qué líneas mostrar
    const validLines = dialog.content.filter(line => {
      // Si es un string, siempre se muestra
      if (typeof line === 'string') return true;
      
      // Si es un objeto con condición, verificar si se cumple
      // (Simplificado para el MVP)
      if (line.condition) {
        const condition = line.condition;
        if (condition === 'perception_high' && (gameState?.stats?.perception || 0) >= 50) {
          return true;
        }
        if (condition === 'perception_low' && (gameState?.stats?.perception || 0) < 50) {
          return true;
        }
      }
      
      // Por defecto, mostramos líneas sin condición o si no podemos evaluarla
      return !line.condition;
    });
    
    // Convertir objetos de línea a strings
    const processedLines = validLines.map(line => {
      if (typeof line === 'string') return line;
      return line.text || '';
    });
    
    setDisplayedLines(processedLines);
  }, [dialog, gameState]);
  
  // Determinar si estamos en la última línea
  const isLastLine = currentLine >= displayedLines.length - 1;
  
  // Avanzar a la siguiente línea o finalizar
  const handleContinue = () => {
    if (isLastLine) {
      if (onComplete) onComplete();
    } else {
      setCurrentLine(prev => prev + 1);
    }
  };
  
  // Si no hay líneas que mostrar, no renderizamos nada
  if (displayedLines.length === 0) {
    if (onComplete) onComplete();
    return null;
  }
  
  return (
    <DialogContainer>
      {dialog.image && (
        <CharacterImage 
          src={dialog.image} 
          alt={dialog.character || 'Character'} 
        />
      )}
      <DialogContent>
        {dialog.character && (
          <CharacterName>{dialog.character}</CharacterName>
        )}
        <DialogText>
          {displayedLines[currentLine] || ''}
        </DialogText>
        <ContinueButton onClick={handleContinue}>
          {isLastLine ? 'Continuar' : 'Siguiente'}
        </ContinueButton>
      </DialogContent>
    </DialogContainer>
  );
};

export default DialogRenderer;