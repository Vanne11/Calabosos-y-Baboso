import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * HelpCommand Component
 * 
 * Componente para mostrar la documentación del proyecto en formato MD
 */
const HelpCommand = ({ isVisible, onClose }) => {
  const [markdownContent, setMarkdownContent] = useState('');

  useEffect(() => {
    if (isVisible) {
      // Cargar el contenido de la documentación
      setMarkdownContent(`
# Calabozos y Babosos - Documentación

## Descripción General
Calabozos y Babosos es un juego narrativo de aventuras en formato de terminal interactiva con visualización ASCII. El juego sumerge a los jugadores en un mundo de fantasía humorística donde interpretan a un héroe que debe adentrarse en el Abismo de las Babosas para derrotar al Rey Baboso.

## Comandos Disponibles

### Comandos Básicos
- \`help\`: Muestra esta documentación
- \`open\`: Abre el diálogo para cargar un archivo ZIP con historias e imágenes
- \`stats\`: Muestra tus estadísticas actuales
- \`inventario\`: Muestra los objetos que llevas
- \`usar [objeto]\`: Utiliza un objeto de tu inventario
- \`examinar\`: Observa con más detalle tu entorno
- \`guardar\`: Guarda tu progreso actual
- \`cargar\`: Carga una partida guardada

### Navegación
- Usa el ratón para seleccionar opciones de diálogo
- También puedes usar las teclas de flecha ARRIBA/ABAJO para navegar entre opciones y ENTER para seleccionar

## Estadísticas del Juego
- **Ganas de vivir**: Si llega a 0, te conviertes en babosa
- **Hambre intensa**: Aumenta con el tiempo, afecta tus Ganas de vivir
- **Pipí acumulado**: Aumenta al beber, necesitarás encontrar baños
- **Miedo**: Afecta tus tiradas de dados en situaciones peligrosas
- **Reputación**: Determina cómo te tratan los habitantes

## Carga de Contenido Personalizado
Puedes cargar tus propias historias e imágenes mediante archivos ZIP. El archivo debe tener la siguiente estructura:

\`\`\`
mi_aventura.zip/
├── data/
│   ├── rutas.json
│   ├── historia.json
│   ├── ciudad.json
│   ├── combate.json
│   ├── introduccion.json
│   └── relleno.json
└── images/
    ├── escenarios/
    ├── personajes/
    └── objetos/
\`\`\`

### Formato de los Archivos JSON
Consulta los ejemplos incluidos en el juego para ver el formato correcto de cada archivo JSON.

## Créditos
Desarrollado como parte del proyecto "Calabozos y Babosos" utilizando React, Vite y otras tecnologías modernas.
      `);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <HelpOverlay>
      <HelpContainer>
        <CloseButton onClick={onClose}>×</CloseButton>
        <HelpTitle>Ayuda de Calabozos y Babosos</HelpTitle>
        <HelpContent dangerouslySetInnerHTML={{ __html: formatMarkdown(markdownContent) }} />
      </HelpContainer>
    </HelpOverlay>
  );
};

// Función simple para formatear Markdown a HTML
const formatMarkdown = (markdown) => {
  let html = markdown
    // Encabezados
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    
    // Negrita
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    
    // Cursiva
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // Código en línea
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    
    // Bloques de código
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    
    // Listas
    .replace(/^\- (.*$)/gm, '<li>$1</li>')
    
    // Párrafos
    .replace(/^(?!<[hl]|<li|<pre)(.+)$/gm, '<p>$1</p>')
    
    // Envolver listas
    .replace(/<li>(.*?)<\/li>/g, function(match) {
      return '<ul>' + match + '</ul>';
    })
    .replace(/<\/ul><ul>/g, '');
  
  return html;
};

HelpCommand.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

// Estilos
const HelpOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const HelpContainer = styled.div`
  background-color: #1e1e1e;
  border: 1px solid #444;
  border-radius: 8px;
  width: 80%;
  max-width: 800px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  position: relative;
  color: #f0f0f0;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: #f0f0f0;
  font-size: 24px;
  cursor: pointer;
  
  &:hover {
    color: #4cd2ff;
  }
`;

const HelpTitle = styled.h1`
  color: #4cd2ff;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
`;

const HelpContent = styled.div`
  h1, h2, h3 {
    color: #4cd2ff;
  }
  
  h1 {
    border-bottom: 1px solid #444;
    padding-bottom: 10px;
  }
  
  h2 {
    margin-top: 25px;
  }
  
  code {
    background-color: #2d2d2d;
    padding: 2px 5px;
    border-radius: 3px;
    font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    color: #50fa7b;
  }
  
  pre {
    background-color: #2d2d2d;
    padding: 15px;
    border-radius: 5px;
    overflow-x: auto;
  }
  
  pre code {
    background-color: transparent;
    padding: 0;
  }
  
  ul {
    padding-left: 20px;
  }
  
  li {
    margin-bottom: 5px;
  }
  
  strong {
    color: #ff79c6;
  }
`;

export default HelpCommand;
