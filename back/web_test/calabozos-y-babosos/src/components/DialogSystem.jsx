import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * DialogSystem Component
 * 
 * Gestiona la presentación de diálogos:
 * - Secuencias de conversación entre personajes
 * - Opciones de respuesta para el jugador
 * - Condiciones basadas en estado del juego
 * - Animación de texto con pausas dramáticas
 * - Efectos de tipografía (texto temblando, colores cambiantes)
 */
const DialogSystem = ({
  dialogData,
  gameState,
  onDialogComplete,
  onOptionSelect,
  terminal,
  typingSpeed = 30
}) => {
  // Estado para controlar la secuencia actual de diálogo
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0);
  // Estado para controlar si se está mostrando un diálogo
  const [isShowingDialog, setIsShowingDialog] = useState(false);
  // Estado para controlar si se están mostrando opciones
  const [showingOptions, setShowingOptions] = useState(false);
  // Referencia para timeouts
  const timeoutRef = useRef(null);

  // Efecto para iniciar la secuencia de diálogo
  useEffect(() => {
    if (dialogData && dialogData.secuencia && dialogData.secuencia.length > 0) {
      startDialogSequence();
    }
    
    // Limpieza de timeouts al desmontar
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [dialogData]);

  // Función para iniciar la secuencia de diálogo
  const startDialogSequence = () => {
    setCurrentDialogIndex(0);
    showNextDialog();
  };

  // Función para mostrar el siguiente diálogo en la secuencia
  const showNextDialog = () => {
    if (!dialogData || !dialogData.secuencia) return;
    
    // Si hemos llegado al final de la secuencia
    if (currentDialogIndex >= dialogData.secuencia.length) {
      // Mostrar opciones si existen
      if (dialogData.opciones && dialogData.opciones.length > 0) {
        showOptions();
      } else if (onDialogComplete) {
        // Notificar que el diálogo ha terminado
        onDialogComplete();
      }
      return;
    }
    
    setIsShowingDialog(true);
    
    // Obtener el diálogo actual
    const currentDialog = dialogData.secuencia[currentDialogIndex];
    
    // Verificar si hay condiciones para mostrar este diálogo
    if (currentDialog.condicion && !evaluateCondition(currentDialog.condicion)) {
      // Si no se cumple la condición, pasar al siguiente diálogo
      setCurrentDialogIndex(prevIndex => prevIndex + 1);
      showNextDialog();
      return;
    }
    
    // Determinar el tipo de mensaje basado en el personaje
    let messageType = 'normal';
    switch (currentDialog.personaje) {
      case 'NARRADOR':
        messageType = 'narrator';
        break;
      case 'PROTAGONISTA':
        messageType = 'protagonist';
        break;
      case 'SISTEMA':
        messageType = 'system';
        break;
      default:
        messageType = 'npc';
    }
    
    // Aplicar efectos especiales si están definidos
    if (currentDialog.efecto) {
      messageType = currentDialog.efecto;
    }
    
    // Mostrar el mensaje en la terminal
    if (terminal && terminal.addMessage) {
      terminal.addMessage({
        text: `${currentDialog.personaje !== 'NARRADOR' ? currentDialog.personaje + ': ' : ''}${currentDialog.texto}`,
        type: messageType,
        animate: true
      });
    }
    
    // Calcular el tiempo de espera antes del siguiente diálogo
    const textLength = currentDialog.texto.length;
    const baseDelay = textLength * typingSpeed;
    const pauseDelay = currentDialog.pausa ? 1000 : 0;
    const totalDelay = baseDelay + pauseDelay + 500; // 500ms extra para asegurar que termine la animación
    
    // Programar el siguiente diálogo
    timeoutRef.current = setTimeout(() => {
      setCurrentDialogIndex(prevIndex => prevIndex + 1);
      setIsShowingDialog(false);
      showNextDialog();
    }, totalDelay);
  };

  // Función para evaluar condiciones
  const evaluateCondition = (condition) => {
    if (!gameState || !condition) return true;
    
    try {
      // Ejemplos de condiciones:
      // { "stat": "Miedo", "operador": ">", "valor": 50 }
      // { "objeto": "llave_maestra", "presente": true }
      
      if (condition.stat && condition.operador && condition.valor !== undefined) {
        const statValue = gameState.stats[condition.stat] || 0;
        
        switch (condition.operador) {
          case '>': return statValue > condition.valor;
          case '<': return statValue < condition.valor;
          case '>=': return statValue >= condition.valor;
          case '<=': return statValue <= condition.valor;
          case '==': return statValue === condition.valor;
          case '!=': return statValue !== condition.valor;
          default: return false;
        }
      }
      
      if (condition.objeto && condition.presente !== undefined) {
        const tieneObjeto = gameState.inventario.includes(condition.objeto);
        return condition.presente ? tieneObjeto : !tieneObjeto;
      }
      
      if (condition.ruta && condition.visitada !== undefined) {
        const rutaVisitada = gameState.rutasVisitadas.includes(condition.ruta);
        return condition.visitada ? rutaVisitada : !rutaVisitada;
      }
      
      if (condition.habilidad && condition.desbloqueada !== undefined) {
        const habilidadDesbloqueada = gameState.habilidades.includes(condition.habilidad);
        return condition.desbloqueada ? habilidadDesbloqueada : !habilidadDesbloqueada;
      }
      
      return true;
    } catch (error) {
      console.error('Error al evaluar condición:', error);
      return false;
    }
  };

  // Función para mostrar opciones
  const showOptions = () => {
    if (!dialogData || !dialogData.opciones || dialogData.opciones.length === 0) {
      if (onDialogComplete) {
        onDialogComplete();
      }
      return;
    }
    
    // Filtrar opciones basadas en condiciones
    const opcionesFiltradas = dialogData.opciones.filter(opcion => 
      !opcion.condicion || evaluateCondition(opcion.condicion)
    );
    
    if (opcionesFiltradas.length === 0) {
      if (onDialogComplete) {
        onDialogComplete();
      }
      return;
    }
    
    setShowingOptions(true);
    
    // Mostrar opciones en la terminal
    if (terminal && terminal.setOptions) {
      terminal.setOptions(opcionesFiltradas.map(opcion => ({
        text: opcion.texto,
        value: opcion
      })));
    }
  };

  // Función para manejar la selección de opciones
  const handleOptionSelect = (option, index) => {
    setShowingOptions(false);
    
    if (terminal && terminal.setOptions) {
      terminal.setOptions([]);
    }
    
    if (onOptionSelect) {
      onOptionSelect(option, index);
    }
  };

  // No renderizamos nada directamente, solo manejamos la lógica
  return null;
};

DialogSystem.propTypes = {
  dialogData: PropTypes.shape({
    secuencia: PropTypes.arrayOf(
      PropTypes.shape({
        personaje: PropTypes.string.isRequired,
        texto: PropTypes.string.isRequired,
        pausa: PropTypes.bool,
        efecto: PropTypes.string,
        condicion: PropTypes.object
      })
    ),
    opciones: PropTypes.arrayOf(
      PropTypes.shape({
        texto: PropTypes.string.isRequired,
        siguiente_ruta: PropTypes.string,
        siguiente_dialogo: PropTypes.string,
        condicion: PropTypes.object
      })
    )
  }),
  gameState: PropTypes.object,
  onDialogComplete: PropTypes.func,
  onOptionSelect: PropTypes.func,
  terminal: PropTypes.object,
  typingSpeed: PropTypes.number
};

export default DialogSystem;
