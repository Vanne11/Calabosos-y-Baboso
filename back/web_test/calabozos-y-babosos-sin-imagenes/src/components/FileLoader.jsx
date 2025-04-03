import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

/**
 * FileLoader Component
 * 
 * Componente para cargar archivos comprimidos con historias e imágenes
 */
const FileLoader = ({ onFileLoad, onError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const fileInputRef = useRef(null);

  // Manejar el evento de arrastrar y soltar
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Manejar la selección de archivos mediante el input
  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Procesar el archivo seleccionado
  const processFile = async (file) => {
    setIsLoading(true);
    setLoadingMessage('Procesando archivo...');

    try {
      // Verificar que sea un archivo ZIP
      if (!file.name.endsWith('.zip')) {
        throw new Error('El archivo debe ser un ZIP');
      }

      // Leer el archivo como ArrayBuffer
      const arrayBuffer = await readFileAsArrayBuffer(file);
      
      // Aquí se procesaría el ZIP para extraer las historias e imágenes
      // Por ahora, simulamos un procesamiento exitoso
      setLoadingMessage('Extrayendo contenido...');
      
      // Simulamos un tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingMessage('Cargando historias...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setLoadingMessage('Cargando imágenes...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Notificar que el archivo se ha cargado correctamente
      if (onFileLoad) {
        onFileLoad({
          fileName: file.name,
          size: file.size,
          // Aquí se pasarían los datos extraídos del ZIP
          data: {
            historias: [],
            imagenes: []
          }
        });
      }
    } catch (error) {
      console.error('Error al procesar el archivo:', error);
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  // Función auxiliar para leer un archivo como ArrayBuffer
  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        resolve(event.target.result);
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // Abrir el diálogo de selección de archivos
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <FileLoaderContainer>
      <DropZone 
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {isLoading ? (
          <LoadingMessage>{loadingMessage}</LoadingMessage>
        ) : (
          <>
            <DropIcon>📁</DropIcon>
            <DropText>
              Arrastra un archivo ZIP con historias e imágenes aquí<br />
              o haz clic para seleccionar
            </DropText>
          </>
        )}
      </DropZone>
      
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".zip"
        onChange={handleFileSelect}
      />
    </FileLoaderContainer>
  );
};

FileLoader.propTypes = {
  onFileLoad: PropTypes.func,
  onError: PropTypes.func
};

// Estilos
const FileLoaderContainer = styled.div`
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const DropZone = styled.div`
  border: 2px dashed ${props => props.isDragging ? '#4cd2ff' : '#444'};
  border-radius: 8px;
  padding: 30px;
  text-align: center;
  background-color: ${props => props.isDragging ? 'rgba(76, 210, 255, 0.1)' : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #4cd2ff;
    background-color: rgba(76, 210, 255, 0.05);
  }
`;

const DropIcon = styled.div`
  font-size: 48px;
  margin-bottom: 15px;
`;

const DropText = styled.p`
  color: #ccc;
  margin: 0;
`;

const LoadingMessage = styled.p`
  color: #4cd2ff;
  font-size: 18px;
`;

export default FileLoader;
