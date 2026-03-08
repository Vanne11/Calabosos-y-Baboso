// App.tsx
// Orquestador de fases: boot → login → shell → game

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useAppStore } from './store/useAppStore';
import AppShell from './components/layout/AppShell';
import BootSequence from './components/sequences/BootSequence';
import Terminal from './components/terminal/Terminal';
import ChoiceWidget from './components/game/ChoiceWidget';
import DiceWidget from './components/game/DiceWidget';
import InputWidget from './components/game/InputWidget';
import { useLoginFlow } from './hooks/useLoginFlow';
import { useTerminalCommands } from './hooks/useTerminalCommands';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import type { ChoicePrompt, DicePrompt, InputPrompt } from './types/engine';

const EditorApp = lazy(() => import('./editor/components/EditorApp'));

const App: React.FC = () => {
  const phase = useAppStore((s) => s.phase);
  const username = useAppStore((s) => s.username);
  const addEntry = useAppStore((s) => s.addEntry);
  const addCommandToHistory = useAppStore((s) => s.addCommandToHistory);
  const pendingResult = useAppStore((s) => s.pendingResult);
  const playerState = useAppStore((s) => s.playerState);

  const [inputValue, setInputValue] = useState('');

  const { isLogin, loginStep, handleLoginInput, initLogin } = useLoginFlow();
  const { processCommand } = useTerminalCommands();
  const { startScene, sendAction } = useGameLoop();
  const { handleKeyDown, resetHistoryIndex } = useKeyboardInput();

  // Initialize login when phase transitions to login
  useEffect(() => {
    if (phase === 'login') {
      initLogin();
    }
  }, [phase]);

  // Start the game scene when entering game phase
  useEffect(() => {
    if (phase === 'game') {
      startScene('start');
    }
  }, [phase]);

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const trimmed = inputValue.trim();
    setInputValue('');
    resetHistoryIndex();

    // Login flow
    if (isLogin) {
      await handleLoginInput(trimmed);
      return;
    }

    // Game input widget
    if (phase === 'game' && pendingResult?.type === 'input_prompt') {
      if (trimmed) {
        addEntry({ type: 'system', content: `[cyan]> ${trimmed}[/cyan]` });
        sendAction({ type: 'submit_input', value: trimmed });
      }
      return;
    }

    // Game choice by number
    if (phase === 'game' && pendingResult?.type === 'choice_prompt' && trimmed) {
      const num = parseInt(trimmed);
      const options = (pendingResult as ChoicePrompt).options;
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        addEntry({ type: 'option', content: `> ${options[num - 1].text}` });
        sendAction({ type: 'choose', index: num - 1 });
        return;
      }
    }

    if (!trimmed) return;

    // Normal command
    addEntry({ type: 'command', content: trimmed });
    addCommandToHistory(trimmed);
    await processCommand(trimmed);
  }, [inputValue, isLogin, phase, pendingResult, handleLoginInput, processCommand, sendAction]);

  // Key down handler
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      handleKeyDown(e, inputValue, setInputValue);
    },
    [handleKeyDown, inputValue]
  );

  // Handle choice widget click
  const handleChoiceSelect = (index: number) => {
    if (pendingResult?.type === 'choice_prompt') {
      const options = (pendingResult as ChoicePrompt).options;
      addEntry({ type: 'option', content: `> ${options[index].text}` });
      sendAction({ type: 'choose', index });
    }
  };

  // Handle dice roll
  const handleDiceRoll = () => {
    sendAction({ type: 'roll_dice' });
  };

  // Determine prompt - in game mode, derive from player state
  let promptName = username;
  if (phase === 'game' && playerState) {
    const override = playerState.stats._prompt;
    const charName = playerState.stats.nombre_jugador;
    if (override) promptName = String(override);
    else if (charName) promptName = String(charName);
  }
  const prompt = isLogin
    ? loginStep === 'password'
      ? 'Contraseña >'
      : 'Login >'
    : promptName
      ? `[${promptName}@cyb] >`
      : 'cyb >';

  // Determine input type
  const inputType = isLogin && loginStep === 'password' ? 'password' : 'text';

  // Determine placeholder
  let placeholder = '';
  if (pendingResult?.type === 'choice_prompt') {
    const opts = (pendingResult as ChoicePrompt).options;
    placeholder = `Escribe el número de la opción [1-${opts.length}]`;
  } else if (pendingResult?.type === 'input_prompt') {
    placeholder = (pendingResult as InputPrompt).prompt;
  }

  // Render widgets inside the terminal
  const renderWidget = () => {
    if (!pendingResult) return null;

    if (pendingResult.type === 'choice_prompt') {
      return (
        <ChoiceWidget
          options={(pendingResult as ChoicePrompt).options}
          onSelect={handleChoiceSelect}
        />
      );
    }

    if (pendingResult.type === 'dice_prompt') {
      const dp = pendingResult as DicePrompt;
      return (
        <DiceWidget
          description={dp.description}
          stat={dp.stat}
          difficulty={dp.difficulty}
          faces={dp.faces}
          onRoll={handleDiceRoll}
        />
      );
    }

    if (pendingResult.type === 'input_prompt') {
      return <InputWidget prompt={(pendingResult as InputPrompt).prompt} />;
    }

    return null;
  };

  // Editor phase: render the editor
  if (phase === 'editor') {
    return (
      <Suspense fallback={null}>
        <EditorApp />
      </Suspense>
    );
  }

  return (
    <>
      <BootSequence />
      <AppShell>
        <Terminal
          prompt={prompt}
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSubmit={handleSubmit}
          onKeyDown={onKeyDown}
          inputType={inputType}
          placeholder={placeholder}
        >
          {renderWidget()}
        </Terminal>
      </AppShell>
    </>
  );
};

export default App;
