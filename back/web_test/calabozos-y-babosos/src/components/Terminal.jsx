import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import '../styles/terminal.css';

/**
 * Terminal Component
 * 
 * Emula una terminal interactiva con capacidad de:
 * - Animar texto letra por letra
 * - Mostrar historial de mensajes
 * - Resaltar diferentes tipos de texto
 * - Permitir entrada de comandos o selección de opciones
 */
const Terminal = ({
  title = 'Calabozos y Babosos',
  initialMessages = [],
  options = [],
  onOptionSelect,
  onCommandSubmit,
  typingSpeed = 30,
  allowInput = true,
  promptSymbol = '>'
}) => {
  // Estado para mensajes en la terminal
  const [messages, setMessages] = useState(initialMessages);
  // Estado para el texto que se está escribiendo actualmente
  const [currentTypingText, setCurrentTypingText] = useState('');
  // Estado para el texto de entrada del usuario
  const [inputText, setInputText] = useState('');
  // Estado para la opción seleccionada
  const [selectedOption, setSelectedOption] = useState(-1);
  // Estado para controlar si se está escribiendo
  const [isTyping, setIsTyping] = useState(false);
  // Estado para controlar el efecto de parpadeo
  const [flickerEffect, setFlickerEffect] = useState(false);

  // Referencias
  const contentRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Efecto para manejar el auto-scroll
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [messages, currentTypingText]);

  // Efecto para enfocar el input cuando está disponible
  useEffect(() => {
    if (allowInput && inputRef.current && !isTyping) {
      inputRef.current.focus();
    }
  }, [allowInput, isTyping]);

  // Efecto para el parpadeo aleatorio
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      if (Math.random() > 0.97) {
        setFlickerEffect(true);
        setTimeout(() => setFlickerEffect(false), 150);
      }
    }, 2000);

    return () => clearInterval(flickerInterval);
  }, []);

  // Función para añadir un mensaje a la terminal
  const addMessage = (message) => {
    const { text, type = 'normal', animate = true } = message;
    
    if (animate) {
      // Si hay que animar, iniciamos la animación letra por letra
      setIsTyping(true);
      let currentIndex = 0;
      setCurrentTypingText('');

      const typeNextChar = () => {
        if (currentIndex < text.length) {
          setCurrentTypingText(prev => prev + text[currentIndex]);
          currentIndex++;
          typingTimeoutRef.current = setTimeout(
            typeNextChar, 
            typingSpeed * (text[currentIndex - 1] === '.' ? 3 : 1) // Pausa más larga después de un punto
          );
        } else {
          // Animación completa, añadimos el mensaje al historial
          setMessages(prev => [...prev, { text, type }]);
          setCurrentTypingText('');
          setIsTyping(false);
        }
      };

      typeNextChar();
    } else {
      // Si no hay que animar, añadimos el mensaje directamente
      setMessages(prev => [...prev, { text, type }]);
    }
  };

  // Función para manejar la entrada de comandos
  const handleCommandSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim() && onCommandSubmit) {
      // Añadimos el comando al historial
      addMessage({ text: `${promptSymbol} ${inputText}`, type: 'command', animate: false });
      onCommandSubmit(inputText);
      setInputText('');
    }
  };

  // Función para manejar la selección de opciones
  const handleOptionSelect = (index) => {
    setSelectedOption(index);
    if (onOptionSelect) {
      // Añadimos la opción seleccionada al historial
      addMessage({ 
        text: options[index].text, 
        type: 'option-selected', 
        animate: false 
      });
      onOptionSelect(options[index], index);
    }
  };

  // Función para manejar las teclas de navegación
  const handleKeyDown = (e) => {
    if (options.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedOption(prev => (prev <= 0 ? options.length - 1 : prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedOption(prev => (prev >= options.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Enter' && selectedOption >= 0) {
        e.preventDefault();
        handleOptionSelect(selectedOption);
      }
    }
  };

  // Función para renderizar un mensaje según su tipo
  const renderMessage = (message, index) => {
    const { text, type } = message;
    
    let className = '';
    
    switch (type) {
      case 'narrator':
        className = 'narrator';
        break;
      case 'protagonist':
        className = 'protagonist';
        break;
      case 'npc':
        className = 'npc';
        break;
      case 'system':
        className = 'system';
        break;
      case 'error':
        className = 'error';
        break;
      case 'warning':
        className = 'warning';
        break;
      case 'success':
        className = 'success';
        break;
      case 'shake':
        className = 'text-shake';
        break;
      case 'glow':
        className = 'text-glow';
        break;
      default:
        className = '';
    }

    return (
      <div key={index} className={`terminal-text ${className}`}>
        {text}
      </div>
    );
  };

  // Limpieza de timeouts al desmontar
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`terminal-container ${flickerEffect ? 'terminal-flicker' : ''}`}>
      {/* Barra de título estilo macOS */}
      <div className="terminal-header">
        <div className="terminal-header-buttons">
          <div className="terminal-header-btn terminal-header-btn-red"></div>
          <div className="terminal-header-btn terminal-header-btn-yellow"></div>
          <div className="terminal-header-btn terminal-header-btn-green"></div>
        </div>
        <div className="terminal-title">{title}</div>
        <div style={{ width: '60px' }}></div> {/* Espacio para equilibrar el header */}
      </div>
      
      {/* Contenido de la terminal */}
      <div className="terminal-content" ref={contentRef}>
        {/* Mensajes anteriores */}
        {messages.map(renderMessage)}
        
        {/* Texto que se está escribiendo actualmente */}
        {currentTypingText && (
          <div className="terminal-text typing-animation">
            {currentTypingText}
            <span className="terminal-cursor"></span>
          </div>
        )}
        
        {/* Área de entrada de comandos */}
        {allowInput && !isTyping && (
          <form onSubmit={handleCommandSubmit}>
            <div className="terminal-input-area">
              <span className="terminal-prompt">{promptSymbol}</span>
              <input
                type="text"
                className="terminal-input"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                ref={inputRef}
                autoFocus
              />
            </div>
          </form>
        )}
        
        {/* Opciones de selección */}
        {options.length > 0 && !isTyping && (
          <div className="terminal-options">
            {options.map((option, index) => (
              <div
                key={index}
                className={`terminal-option ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                {option.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

Terminal.propTypes = {
  title: PropTypes.string,
  initialMessages: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      type: PropTypes.string,
      animate: PropTypes.bool
    })
  ),
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.any
    })
  ),
  onOptionSelect: PropTypes.func,
  onCommandSubmit: PropTypes.func,
  typingSpeed: PropTypes.number,
  allowInput: PropTypes.bool,
  promptSymbol: PropTypes.string
};

export default Terminal;
