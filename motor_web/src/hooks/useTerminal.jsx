import { useState, useCallback } from 'react';

// Hook para gestionar el terminal
export const useTerminal = () => {
  const [history, setHistory] = useState([]);
  const [command, setCommand] = useState({ text: '', prompt: '>' });
  const [autoCompleteOptions, setAutoCompleteOptions] = useState([]);

  // Limpiar historial
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // Enviar comando
  const submitCommand = useCallback(() => {
    if (!command.text.trim()) return;

    // Añadir comando al historial
    setHistory(prev => [...prev, { type: 'command', text: command.text }]);
    
    // Limpiar comando después de enviar
    setCommand(prev => ({ ...prev, text: '' }));
    
    return command.text;
  }, [command]);

  // Cambiar el prompt
  const setPrompt = useCallback((newPrompt) => {
    setCommand(prev => ({ ...prev, prompt: newPrompt }));
  }, []);

  // Añadir opciones de autocompletado
  const addAutoComplete = useCallback((options) => {
    setAutoCompleteOptions(options);
  }, []);

  return {
    history,
    command,
    setCommand,
    submitCommand,
    clearHistory,
    setPrompt,
    addAutoComplete,
    autoCompleteOptions
  };
};
