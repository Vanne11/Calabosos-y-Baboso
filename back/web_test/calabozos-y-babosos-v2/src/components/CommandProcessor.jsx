import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * CommandProcessor Component
 * 
 * Procesa comandos de la terminal y ejecuta las acciones correspondientes
 */
const CommandProcessor = ({ command, onResponse, onShowHelp, onShowFileLoader }) => {
  // Procesar el comando cuando cambia
  useEffect(() => {
    if (!command) return;
    
    processCommand(command);
  }, [command]);

  // Función para procesar comandos
  const processCommand = (cmd) => {
    // Convertir a minúsculas y eliminar espacios extra
    const normalizedCmd = cmd.trim().toLowerCase();
    
    // Dividir el comando en partes (comando principal y argumentos)
    const parts = normalizedCmd.split(' ');
    const mainCommand = parts[0];
    const args = parts.slice(1);
    
    // Procesar según el comando principal
    switch (mainCommand) {
      case 'help':
        handleHelpCommand();
        break;
      
      case 'open':
        handleOpenCommand();
        break;
      
      case 'stats':
        handleStatsCommand();
        break;
      
      case 'inventario':
        handleInventoryCommand();
        break;
      
      case 'usar':
        handleUseCommand(args);
        break;
      
      case 'examinar':
        handleExamineCommand();
        break;
      
      case 'guardar':
        handleSaveCommand();
        break;
      
      case 'cargar':
        handleLoadCommand();
        break;
      
      default:
        handleUnknownCommand(normalizedCmd);
        break;
    }
  };

  // Manejadores para cada comando
  const handleHelpCommand = () => {
    onResponse({
      text: "Mostrando ayuda...",
      type: "system"
    });
    
    if (onShowHelp) {
      onShowHelp();
    }
  };

  const handleOpenCommand = () => {
    onResponse({
      text: "Abriendo selector de archivos...",
      type: "system"
    });
    
    if (onShowFileLoader) {
      onShowFileLoader();
    }
  };

  const handleStatsCommand = () => {
    onResponse({
      text: "Estadísticas actuales:",
      type: "system"
    });
    
    // Aquí se obtendrían las estadísticas reales del estado del juego
    onResponse({
      text: "Ganas de vivir: 100\nHambre intensa: 0\nPipí acumulado: 0\nMiedo: 0\nReputación: 50",
      type: "system"
    });
  };

  const handleInventoryCommand = () => {
    onResponse({
      text: "Inventario actual:",
      type: "system"
    });
    
    // Aquí se obtendría el inventario real del estado del juego
    onResponse({
      text: "Tu inventario está vacío.",
      type: "system"
    });
  };

  const handleUseCommand = (args) => {
    if (args.length === 0) {
      onResponse({
        text: "¿Usar qué? Especifica un objeto de tu inventario.",
        type: "error"
      });
      return;
    }
    
    const item = args.join(' ');
    
    // Aquí se verificaría si el objeto está en el inventario y se usaría
    onResponse({
      text: `Intentando usar: ${item}`,
      type: "system"
    });
    
    onResponse({
      text: `No tienes ese objeto en tu inventario.`,
      type: "error"
    });
  };

  const handleExamineCommand = () => {
    onResponse({
      text: "Examinando el entorno...",
      type: "system"
    });
    
    // Aquí se obtendría la descripción detallada de la ubicación actual
    onResponse({
      text: "No hay nada interesante que examinar aquí.",
      type: "narrator"
    });
  };

  const handleSaveCommand = () => {
    onResponse({
      text: "Guardando partida...",
      type: "system"
    });
    
    // Aquí se guardaría el estado del juego
    setTimeout(() => {
      onResponse({
        text: "Partida guardada correctamente.",
        type: "success"
      });
    }, 500);
  };

  const handleLoadCommand = () => {
    onResponse({
      text: "Cargando partida guardada...",
      type: "system"
    });
    
    // Aquí se cargaría el estado del juego
    setTimeout(() => {
      onResponse({
        text: "No se encontró ninguna partida guardada.",
        type: "error"
      });
    }, 500);
  };

  const handleUnknownCommand = (cmd) => {
    onResponse({
      text: `Comando desconocido: "${cmd}". Escribe "help" para ver los comandos disponibles.`,
      type: "error"
    });
  };

  // Este componente no renderiza nada visible
  return null;
};

CommandProcessor.propTypes = {
  command: PropTypes.string,
  onResponse: PropTypes.func.isRequired,
  onShowHelp: PropTypes.func,
  onShowFileLoader: PropTypes.func
};

export default CommandProcessor;
