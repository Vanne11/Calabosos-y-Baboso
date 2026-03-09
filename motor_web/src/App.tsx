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
import ExamineWidget from './components/game/ExamineWidget';
import ShopWidget from './components/game/ShopWidget';
import CombatWidget from './components/game/CombatWidget';
import CraftWidget from './components/game/CraftWidget';
import PuzzleWidget from './components/game/PuzzleWidget';
import UseItemWidget from './components/game/UseItemWidget';
import TimedChoiceWidget from './components/game/TimedChoiceWidget';
import LevelUpWidget from './components/game/LevelUpWidget';
import { useLoginFlow, welcomeMessages } from './hooks/useLoginFlow';
import { useTerminalCommands } from './hooks/useTerminalCommands';
import { useGameLoop } from './hooks/useGameLoop';
import { useKeyboardInput } from './hooks/useKeyboardInput';
import type {
  ChoicePrompt, DicePrompt, InputPrompt, ExaminePrompt,
  ShopPrompt, CombatPrompt, CraftPrompt, PuzzlePrompt,
  UseItemPrompt, TimedChoicePrompt, LevelUpPrompt,
} from './types/engine';

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

  // Show welcome messages when session is restored (skip boot/login)
  const addEntries = useAppStore((s) => s.addEntries);
  const sessionRestored = React.useRef(phase === 'shell' && username !== '');
  useEffect(() => {
    if (sessionRestored.current) {
      sessionRestored.current = false;
      addEntries([
        { type: 'system', content: '[dim]Sesión restaurada.[/dim]' },
        ...welcomeMessages,
      ]);
    }
  }, []);

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

    // Timed choice by number
    if (phase === 'game' && pendingResult?.type === 'timed_choice_prompt' && trimmed) {
      const num = parseInt(trimmed);
      const options = (pendingResult as TimedChoicePrompt).options;
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

  // --- Widget handlers ---

  const handleChoiceSelect = (index: number) => {
    if (pendingResult?.type === 'choice_prompt') {
      const options = (pendingResult as ChoicePrompt).options;
      addEntry({ type: 'option', content: `> ${options[index].text}` });
      sendAction({ type: 'choose', index });
    }
  };

  const handleDiceRoll = () => {
    sendAction({ type: 'roll_dice' });
  };

  const handleExamineSelect = (subjectId: string) => {
    sendAction({ type: 'examine_select', subjectId });
  };
  const handleExamineExit = () => {
    sendAction({ type: 'examine_exit' });
  };

  const handleShopBuy = (itemIndex: number) => {
    sendAction({ type: 'shop_buy', itemIndex });
  };
  const handleShopSell = (itemId: string) => {
    sendAction({ type: 'shop_sell', itemId });
  };
  const handleShopHaggle = (itemIndex: number) => {
    sendAction({ type: 'shop_haggle', itemIndex });
  };
  const handleShopSteal = (itemIndex: number) => {
    sendAction({ type: 'shop_steal', itemIndex });
  };
  const handleShopDeceive = (itemId: string) => {
    sendAction({ type: 'shop_deceive', itemId });
  };
  const handleShopExit = () => {
    sendAction({ type: 'shop_exit' });
  };

  const handleCombatAction = (action: string) => {
    sendAction({ type: 'combat_action', action });
  };

  const handleCraftCombine = (items: string[]) => {
    sendAction({ type: 'craft_combine', items });
  };
  const handleCraftExit = () => {
    sendAction({ type: 'craft_exit' });
  };

  const handlePuzzleAttempt = (answer: string | string[]) => {
    sendAction({ type: 'puzzle_attempt', answer });
  };
  const handlePuzzleExit = () => {
    sendAction({ type: 'puzzle_exit' });
  };

  const handleUseItemOn = (itemId: string, targetId: string) => {
    sendAction({ type: 'use_item_on', itemId, targetId });
  };
  const handleUseItemExit = () => {
    sendAction({ type: 'use_item_exit' });
  };

  const handleTimedChoiceSelect = (index: number) => {
    if (pendingResult?.type === 'timed_choice_prompt') {
      const options = (pendingResult as TimedChoicePrompt).options;
      addEntry({ type: 'option', content: `> ${options[index].text}` });
      sendAction({ type: 'choose', index });
    }
  };

  const handleLevelUpSkill = (skillId: string) => {
    sendAction({ type: 'level_up_skill', skillId });
  };
  const handleLevelUpDone = () => {
    sendAction({ type: 'level_up_done' });
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
  } else if (pendingResult?.type === 'timed_choice_prompt') {
    const opts = (pendingResult as TimedChoicePrompt).options;
    placeholder = `Escribe el número de la opción [1-${opts.length}]`;
  } else if (pendingResult?.type === 'input_prompt') {
    placeholder = (pendingResult as InputPrompt).prompt;
  }

  // Render widgets inside the terminal
  const renderWidget = () => {
    if (!pendingResult) return null;

    switch (pendingResult.type) {
      case 'choice_prompt':
        return (
          <ChoiceWidget
            options={(pendingResult as ChoicePrompt).options}
            onSelect={handleChoiceSelect}
          />
        );

      case 'dice_prompt': {
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

      case 'input_prompt':
        return <InputWidget prompt={(pendingResult as InputPrompt).prompt} />;

      case 'examine_prompt': {
        const ep = pendingResult as ExaminePrompt;
        return (
          <ExamineWidget
            description={ep.description}
            subjects={ep.subjects}
            exitText={ep.exitText}
            onSelect={handleExamineSelect}
            onExit={handleExamineExit}
          />
        );
      }

      case 'shop_prompt': {
        const sp = pendingResult as ShopPrompt;
        return (
          <ShopWidget
            title={sp.title}
            currency={sp.currency}
            currentMoney={sp.currentMoney}
            items={sp.items}
            sellable={sp.sellable}
            playerInventory={sp.playerInventory}
            sellRatio={sp.sellRatio}
            canHaggle={sp.canHaggle}
            canSteal={sp.canSteal}
            canDeceive={sp.canDeceive}
            onBuy={handleShopBuy}
            onSell={handleShopSell}
            onHaggle={handleShopHaggle}
            onSteal={handleShopSteal}
            onDeceive={handleShopDeceive}
            onExit={handleShopExit}
          />
        );
      }

      case 'combat_prompt': {
        const cp = pendingResult as CombatPrompt;
        return (
          <CombatWidget
            enemyName={cp.enemyName}
            enemyHp={cp.enemyHp}
            enemyMaxHp={cp.enemyMaxHp}
            playerHp={cp.playerHp}
            actions={cp.actions}
            round={cp.round}
            usableItems={cp.usableItems}
            onAction={handleCombatAction}
          />
        );
      }

      case 'craft_prompt': {
        const crp = pendingResult as CraftPrompt;
        return (
          <CraftWidget
            description={crp.description}
            playerInventory={crp.playerInventory}
            onCombine={handleCraftCombine}
            onExit={handleCraftExit}
          />
        );
      }

      case 'puzzle_prompt': {
        const pp = pendingResult as PuzzlePrompt;
        return (
          <PuzzleWidget
            puzzleType={pp.puzzleType}
            description={pp.description}
            prompt={pp.prompt}
            question={pp.question}
            hint={pp.hint}
            elements={pp.elements}
            digits={pp.digits}
            attemptsLeft={pp.attemptsLeft}
            onAttempt={handlePuzzleAttempt}
            onExit={handlePuzzleExit}
          />
        );
      }

      case 'use_item_prompt': {
        const uip = pendingResult as UseItemPrompt;
        return (
          <UseItemWidget
            description={uip.description}
            targets={uip.targets}
            playerInventory={uip.playerInventory}
            exitText={uip.exitText}
            onUse={handleUseItemOn}
            onExit={handleUseItemExit}
          />
        );
      }

      case 'timed_choice_prompt': {
        const tcp = pendingResult as TimedChoicePrompt;
        return (
          <TimedChoiceWidget
            options={tcp.options}
            duration={tcp.duration}
            defaultIndex={tcp.defaultIndex}
            timeoutText={tcp.timeoutText}
            onSelect={handleTimedChoiceSelect}
          />
        );
      }

      case 'level_up_prompt': {
        const lup = pendingResult as LevelUpPrompt;
        return (
          <LevelUpWidget
            characterName={lup.characterName}
            newLevel={lup.newLevel}
            skillPoints={lup.skillPoints}
            availableSkills={lup.availableSkills}
            description={lup.description}
            onLearnSkill={handleLevelUpSkill}
            onDone={handleLevelUpDone}
          />
        );
      }

      default:
        return null;
    }
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
