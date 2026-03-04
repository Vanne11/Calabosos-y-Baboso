// hooks/useKeyboardInput.ts
// Maneja input de teclado: historial de comandos, Tab sarcástico

import { useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

const tabMessages = [
  '[red]¿Te creíste que esto es una terminal realmente? ¡Ajá! Los desarrolladores hicieron un buen trabajo, pero me mandaron a decirte que no lo es. ¡Ajá![/red]',
  '[yellow]¿Sigues intentando usar Tab? ¿No te quedó claro? Esto no es bash, zsh, ni siquiera cmd.exe. Es solo JS fingiendo ser cool.[/yellow]',
  '[purple]Vaya, eres persistente. Me gusta. La tercera vez el autocompletado funciona, créeme...[/purple]',
  '[green]Ok, no. Mentí. La cuarta vez es la vencida...[/green]',
  '[blue]Todavía lo estás intentando. ¿No tienes nada mejor que hacer?[/blue]',
  '[cyan]Los programadores ni siquiera implementaron un array lo suficientemente grande para tus intentos de Tab...[/cyan]',
  '[red]Tab, tab, tab... ¿Sabes que cada vez que presionas Tab, una babosa pierde su baba?[/red]',
  '[yellow]ALERTA: Exceso de uso de Tab detectado. Enviando informe al Departamento de Esfuerzos Inútiles.[/yellow]',
  '[purple]El contador de Tab está a punto de desbordarse. ¿Estás satisfecho?[/purple]',
  '[green]¡Felicidades! Has ganado el logro Persistencia Absurda. No sirve para nada.[/green]',
];

export function useKeyboardInput() {
  const commandHistory = useAppStore((s) => s.commandHistory);
  const addEntry = useAppStore((s) => s.addEntry);

  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');
  const [tabCount, setTabCount] = useState(0);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, inputValue: string, setInputValue: (v: string) => void) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const idx = Math.min(tabCount, tabMessages.length - 1);
        addEntry({ type: 'system', content: tabMessages[idx] });
        setTabCount((c) => c + 1);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex === -1 && inputValue.trim()) {
          setSavedInput(inputValue);
        }
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          const newIdx = historyIndex + 1;
          setHistoryIndex(newIdx);
          setInputValue(commandHistory[commandHistory.length - 1 - newIdx]);
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIdx = historyIndex - 1;
          setHistoryIndex(newIdx);
          setInputValue(commandHistory[commandHistory.length - 1 - newIdx]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInputValue(savedInput);
          setSavedInput('');
        }
        return;
      }
    },
    [commandHistory, historyIndex, tabCount, addEntry]
  );

  const resetHistoryIndex = useCallback(() => {
    setHistoryIndex(-1);
    setSavedInput('');
  }, []);

  return { handleKeyDown, resetHistoryIndex };
}
