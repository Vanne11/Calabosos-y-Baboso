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
  onError = () => {}
}) => {
  // Estado para almacenar la representación ASCII
  const [asciiContent, setAsciiContent] = useState('');
  // Estado para controlar la carga
  const [loading, setLoading] = useState(true);
  // Estado para controlar errores
  const [error, setError] = useState(null);
  
  // Referencia al contenedor
  const containerRef = useRef(null);
  
  // Efecto para procesar la imagen cuando cambian las props
  useEffect(() => {
    if (!imageSrc) {
      setAsciiContent('');
      setLoading(false);
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
        setError('Error al procesar la imagen');
        setLoading(false);
        onError(err);
      }
    };
    
    processAsciiImage();
  }, [imageSrc, width, height, charSet, colored, brightness, contrast, onLoad, onError]);
  
  // Renderizar un mensaje de carga
  if (loading) {
    return (
      <div className={`ascii-display ${className}`} style={{ backgroundColor }}>
        <div className="ascii-loading">Cargando imagen ASCII...</div>
      </div>
    );
  }
  
  // Renderizar un mensaje de error
  if (error) {
    return (
      <div className={`ascii-display ${className}`} style={{ backgroundColor }}>
        <div className="ascii-error">{error}</div>
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
  onError: PropTypes.func
};

export default AsciiRenderer;
