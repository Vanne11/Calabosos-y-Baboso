import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import * as imageProcessor from '../utils/imageProcessor';

/**
 * AsciiRenderer Component
 * 
 * Renderiza imágenes como representaciones ASCII/Unicode
 * - Soporta diferentes conjuntos de caracteres
 * - Ajustes de tamaño, brillo y contraste
 * - Soporte para colores o monocromático
 * - Fallback a arte ASCII predeterminado cuando no hay imagen
 */
const AsciiRenderer = ({
  imageSrc,
  width = 80,
  height = null,
  charSet = 'standard',
  colored = true,
  brightness = 0,
  contrast = 0,
  backgroundColor = 'transparent',
  className = '',
  onLoad = () => {},
  onError = () => {},
  sceneName = ''
}) => {
  // Estado para almacenar la representación ASCII
  const [asciiContent, setAsciiContent] = useState('');
  // Estado para controlar la carga
  const [loading, setLoading] = useState(true);
  // Estado para controlar errores
  const [error, setError] = useState(null);
  
  // Referencia al contenedor
  const containerRef = useRef(null);
  
  // Función para generar arte ASCII predeterminado basado en el nombre de la escena
  const generateDefaultAscii = (scene) => {
    // Escenas predeterminadas para diferentes tipos de ubicaciones
    const defaultScenes = {
      plaza: `
      <pre style="color: #5a9;">
      +---------------------------------------------+
      |                PLAZA PRINCIPAL              |
      +---------------------------------------------+
      |                                             |
      |    _____         _____        _____         |
      |   |     |       |     |      |     |        |
      |   | [] []       | [] []      | [] []        |
      |   |_____|       |_____|      |_____|        |
      |                                             |
      |                   _                         |
      |     \\|/         _|_|_         \\|/          |
      |    --O--       /     \\       --O--         |
      |     /|\\       /       \\       /|\\          |
      |              /         \\                    |
      |             /___________\\                   |
      |                                             |
      |                                             |
      |   \\O/      \\O       O/      \\O/            |
      |    |        |\\     /|        |             |
      |   / \\      /|      |\\       / \\            |
      |                                             |
      +---------------------------------------------+
      </pre>`,
      
      tienda: `
      <pre style="color: #a95;">
      +---------------------------------------------+
      |            TIENDA DEL TENDERO               |
      +---------------------------------------------+
      |                                             |
      |    ___________                              |
      |   |  POCIONES |    [][][][] [][][][]       |
      |   |___________|    [][][][] [][][][]       |
      |                    [][][][] [][][][]       |
      |                                             |
      |    /|\\                                      |
      |   / | \\      |\\__/|                         |
      |     |         (oo)    ___                   |
      |     |        (    )  /   \\                  |
      |    / \\        \\__/  |     |                 |
      |                     |     |                 |
      |    TENDERO          \\_____/                 |
      |                                             |
      |                                             |
      |   +------+  +------+  +------+  +------+   |
      |   |ESPADA|  | SAL  |  |POCION|  |ESCUDO|   |
      |   +------+  +------+  +------+  +------+   |
      |                                             |
      +---------------------------------------------+
      </pre>`,
      
      callejon: `
      <pre style="color: #567;">
      +---------------------------------------------+
      |                 CALLEJÓN                    |
      +---------------------------------------------+
      |                                             |
      |   |\\                                  /|    |
      |   | \\                                / |    |
      |   |  \\                              /  |    |
      |   |   \\                            /   |    |
      |   |    \\                          /    |    |
      |   |     \\________________________/     |    |
      |   |                                    |    |
      |   |                                    |    |
      |   |         ~                          |    |
      |   |        ~                           |    |
      |   |       ~                            |    |
      |   |      ~                             |    |
      |   |     ~                              |    |
      |   |    ~                               |    |
      |   |   ~                                |    |
      |   |  ~                                 |    |
      |   | ~                                  |    |
      |   |~                                   |    |
      +---------------------------------------------+
      </pre>`,
      
      abismo: `
      <pre style="color: #5a5;">
      +---------------------------------------------+
      |            ABISMO DE LAS BABOSAS            |
      +---------------------------------------------+
      |                                             |
      |      /\\                          /\\         |
      |     /  \\   /\\      /\\    /\\    /  \\        |
      |    /    \\ /  \\    /  \\  /  \\  /    \\       |
      |                                             |
      |                                             |
      |    \\                                /       |
      |     \\                              /        |
      |      \\                            /         |
      |       \\                          /          |
      |        \\                        /           |
      |         \\                      /            |
      |          \\                    /             |
      |           \\                  /              |
      |            \\________________/               |
      |                                             |
      |            ~~~~~~~~~~~~~~                   |
      |           ~~~~~~~~~~~~~~~~                  |
      |                                             |
      +---------------------------------------------+
      </pre>`,
      
      rey: `
      <pre style="color: #5c5;">
      +---------------------------------------------+
      |                REY BABOSO                   |
      +---------------------------------------------+
      |                                             |
      |                 _______                     |
      |                /       \\                    |
      |               /  O   O  \\                   |
      |              |     V     |                  |
      |              |  \\_____/  |                  |
      |               \\         /                   |
      |                \\_______/                    |
      |              /           \\                  |
      |             /             \\                 |
      |            /               \\                |
      |           /                 \\               |
      |          /                   \\              |
      |         /                     \\             |
      |        /                       \\            |
      |       /                         \\           |
      |      /___________________________\\          |
      |                                             |
      |                                             |
      +---------------------------------------------+
      </pre>`,
      
      default: `
      <pre style="color: #aaa;">
      +---------------------------------------------+
      |             CALABOZOS Y BABOSOS             |
      +---------------------------------------------+
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      |                                             |
      +---------------------------------------------+
      </pre>`
    };
    
    // Determinar qué escena mostrar basado en palabras clave en el nombre
    let sceneType = 'default';
    
    if (!scene) return defaultScenes.default;
    
    const sceneLower = scene.toLowerCase();
    
    if (sceneLower.includes('plaza') || sceneLower.includes('principal')) {
      sceneType = 'plaza';
    } else if (sceneLower.includes('tienda') || sceneLower.includes('tendero')) {
      sceneType = 'tienda';
    } else if (sceneLower.includes('callejon') || sceneLower.includes('lateral')) {
      sceneType = 'callejon';
    } else if (sceneLower.includes('abismo') || sceneLower.includes('babosa') || 
               sceneLower.includes('cueva') || sceneLower.includes('entrada')) {
      sceneType = 'abismo';
    } else if (sceneLower.includes('rey') || sceneLower.includes('trono') || 
               sceneLower.includes('final') || sceneLower.includes('confrontacion')) {
      sceneType = 'rey';
    }
    
    return defaultScenes[sceneType];
  };
  
  // Efecto para procesar la imagen cuando cambian las props
  useEffect(() => {
    if (!imageSrc) {
      // Si no hay imagen, usar arte ASCII predeterminado
      const defaultArt = generateDefaultAscii(sceneName);
      setAsciiContent(defaultArt);
      setLoading(false);
      onLoad();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const processAsciiImage = async () => {
      try {
        const options = {
          charSet,
          colored,
          width,
          height,
          brightness,
          contrast
        };
        
        // Procesar la imagen a HTML ASCII
        const asciiHtml = await imageProcessor.processImageToHtml(imageSrc, options);
        setAsciiContent(asciiHtml);
        setLoading(false);
        onLoad();
      } catch (err) {
        console.error('Error al renderizar ASCII:', err);
        // En caso de error, usar arte ASCII predeterminado
        const defaultArt = generateDefaultAscii(sceneName);
        setAsciiContent(defaultArt);
        setLoading(false);
        onLoad(); // Aún llamamos onLoad para que el juego continúe
      }
    };
    
    processAsciiImage();
  }, [imageSrc, width, height, charSet, colored, brightness, contrast, onLoad, onError, sceneName]);
  
  // Renderizar un mensaje de carga
  if (loading) {
    return (
      <div className={`ascii-display ${className}`} style={{ backgroundColor }}>
        <div className="ascii-loading">Cargando escena...</div>
      </div>
    );
  }
  
  // Renderizar el contenido ASCII
  return (
    <div 
      className={`ascii-display ${className}`}
      style={{ backgroundColor }}
      ref={containerRef}
      dangerouslySetInnerHTML={{ __html: asciiContent }}
    />
  );
};

AsciiRenderer.propTypes = {
  imageSrc: PropTypes.string,
  width: PropTypes.number,
  height: PropTypes.number,
  charSet: PropTypes.oneOf(['simple', 'standard', 'blocks', 'custom']),
  colored: PropTypes.bool,
  brightness: PropTypes.number,
  contrast: PropTypes.number,
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
  onLoad: PropTypes.func,
  onError: PropTypes.func,
  sceneName: PropTypes.string
};

export default AsciiRenderer;
