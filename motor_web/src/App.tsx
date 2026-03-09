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
  ShopPrompt, ShopDicePrompt, CombatPrompt, CraftPrompt, PuzzlePrompt,
  UseItemPrompt, TimedChoicePrompt, LevelUpPrompt,
} from './types/engine';

const EditorApp = lazy(() => import('./editor/components/EditorApp'));

/** Stack inventory items by id, preserving order of first occurrence */
function stackInventory(inventory: string[]): { id: string; count: number }[] {
  const map = new Map<string, number>();
  for (const id of inventory) {
    map.set(id, (map.get(id) || 0) + 1);
  }
  return Array.from(map, ([id, count]) => ({ id, count }));
}

const App: React.FC = () => {
  const phase = useAppStore((s) => s.phase);
  const username = useAppStore((s) => s.username);
  const addEntry = useAppStore((s) => s.addEntry);
  const addCommandToHistory = useAppStore((s) => s.addCommandToHistory);
  const pendingResult = useAppStore((s) => s.pendingResult);
  const playerState = useAppStore((s) => s.playerState);

  const [inputValue, setInputValue] = useState('');
  const [shopSelection, setShopSelection] = useState<{ mode: 'buy'; index: number } | { mode: 'sell'; itemId: string } | null>(null);

  const pendingSlotAction = useAppStore((s) => s.pendingSlotAction);

  const { isLogin, loginStep, handleLoginInput, initLogin } = useLoginFlow();
  const { processCommand, handleSlotInput } = useTerminalCommands();
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

    // In-game slot selection (save/load menu)
    if (phase === 'game' && pendingSlotAction && trimmed) {
      addEntry({ type: 'command', content: trimmed });
      await handleSlotInput(trimmed, startScene);
      return;
    }

    // In-game slash commands: intercept /commands even when a widget is active
    if (phase === 'game' && trimmed.startsWith('/')) {
      addEntry({ type: 'command', content: trimmed });
      addCommandToHistory(trimmed);
      await processCommand(trimmed);
      return;
    }

    // Global IN[N]: inspect inventory item (when NOT in craft mode)
    if (phase === 'game' && pendingResult?.type !== 'craft_prompt') {
      const invMatch = trimmed.toLowerCase().match(/^in(\d+)$/);
      if (invMatch && playerState) {
        const stacked = stackInventory(playerState.inventory);
        const idx = parseInt(invMatch[1]) - 1;
        if (idx >= 0 && idx < stacked.length) {
          const item = stacked[idx];
          const engine = useAppStore.getState().engine;
          const def = engine?.items?.[item.id];
          const name = def?.name || item.id;
          const desc = def?.description || 'Un objeto misterioso.';
          addEntry({ type: 'system', content: `[bold cyan]═══ ${name}${item.count > 1 ? ` (x${item.count})` : ''} ═══[/bold cyan]\n[dim]${desc}[/dim]` });
          return;
        }
      }
    }

    // Game input widget
    if (phase === 'game' && pendingResult?.type === 'input_prompt') {
      if (trimmed) {
        addEntry({ type: 'system', content: `[cyan]> ${trimmed}[/cyan]` });
        sendAction({ type: 'submit_input', value: trimmed });
      }
      return;
    }

    // Puzzle text answer (code, riddle, lock)
    if (phase === 'game' && pendingResult?.type === 'puzzle_prompt') {
      const pp = pendingResult as PuzzlePrompt;
      if (pp.puzzleType === 'sequence') {
        // sequence uses widget buttons, ignore terminal text
        return;
      }
      if (trimmed) {
        addEntry({ type: 'system', content: `[cyan]> ${trimmed}[/cyan]` });
        sendAction({ type: 'puzzle_attempt', answer: trimmed });
      }
      return;
    }

    // Craft: 5 syntaxes + pickup — mesa dinámica, inventario en panel
    if (phase === 'game' && pendingResult?.type === 'craft_prompt') {
      const cp = pendingResult as CraftPrompt;
      const low = trimmed.toLowerCase();

      // [0] salir
      if (low === '0') {
        sendAction({ type: 'craft_exit' });
        return;
      }

      // Resolve inventory items from global playerState
      const invStacked = playerState ? stackInventory(playerState.inventory) : [];

      // Helper: resolve a token (number=table, INn=inventory) to item id
      const resolveToken = (token: string): { id: string; name: string } | null => {
        const invMatch = token.match(/^in(\d+)$/);
        if (invMatch) {
          const idx = parseInt(invMatch[1]) - 1;
          if (idx >= 0 && idx < invStacked.length) {
            const item = invStacked[idx];
            const engine = useAppStore.getState().engine;
            const def = engine?.items?.[item.id];
            return { id: item.id, name: def?.name || item.id };
          }
          return null;
        }
        const num = parseInt(token);
        if (!isNaN(num) && num >= 1 && num <= cp.tableItems.length) return cp.tableItems[num - 1];
        return null;
      };

      // Parse tokens from a "+" separated string
      const parseTokens = (str: string): { id: string; name: string }[] | null => {
        const tokens = str.split('+').map((t) => t.trim()).filter(Boolean);
        const resolved: { id: string; name: string }[] = [];
        for (const t of tokens) {
          const item = resolveToken(t);
          if (!item) return null;
          resolved.push(item);
        }
        return resolved.length > 0 ? resolved : null;
      };

      // Try CHOP syntax: A//B (must check BEFORE cut to avoid false match)
      const chopMatch = low.match(/^(.+?)\/\/(.+)$/);
      if (chopMatch) {
        const tool = resolveToken(chopMatch[1].trim());
        const target = resolveToken(chopMatch[2].trim());
        if (tool && target) {
          addEntry({ type: 'option', content: `> Picar ${target.name} con ${tool.name}` });
          sendAction({ type: 'craft_chop', tool: tool.id, target: target.id });
          return;
        }
      }

      // Try CUT syntax: A/B (single slash)
      const cutMatch = low.match(/^(.+?)\/(.+)$/);
      if (cutMatch) {
        const tool = resolveToken(cutMatch[1].trim());
        const target = resolveToken(cutMatch[2].trim());
        if (tool && target) {
          addEntry({ type: 'option', content: `> Cortar ${target.name} con ${tool.name}` });
          sendAction({ type: 'craft_cut', tool: tool.id, target: target.id });
          return;
        }
      }

      // Try APPLY syntax: A>B (substance > target)
      const applyMatch = low.match(/^(.+)>(.+)$/);
      if (applyMatch) {
        const substance = resolveToken(applyMatch[1].trim());
        const target = resolveToken(applyMatch[2].trim());
        if (substance && target) {
          addEntry({ type: 'option', content: `> Aplicar ${substance.name} sobre ${target.name}` });
          sendAction({ type: 'craft_apply', substance: substance.id, target: target.id });
          return;
        }
      }

      // Try USE syntax: A(B+C+...) (tool with ingredients)
      const useMatch = low.match(/^(.+?)\((.+)\)$/);
      if (useMatch) {
        const tool = resolveToken(useMatch[1].trim());
        const ingredients = parseTokens(useMatch[2]);
        if (tool && ingredients && ingredients.length > 0) {
          const ingNames = ingredients.map((i) => i.name).join(' + ');
          addEntry({ type: 'option', content: `> Meter en ${tool.name}: ${ingNames}` });
          sendAction({ type: 'craft_use', tool: tool.id, ingredients: ingredients.map((i) => i.id) });
          return;
        }
      }

      // Try COMBINE syntax: A+B+C (simple mix)
      const combined = parseTokens(low);
      if (combined && combined.length >= 2) {
        addEntry({ type: 'option', content: `> Combinar: ${combined.map((i) => i.name).join(' + ')}` });
        sendAction({ type: 'craft_combine', items: combined.map((i) => i.id) });
        return;
      }

      // Solo un número: PICKUP (recoger item de la mesa)
      const pickNum = parseInt(low);
      if (!isNaN(pickNum) && pickNum >= 1 && pickNum <= cp.tableItems.length) {
        const item = cp.tableItems[pickNum - 1];
        if (!item.isFixed) {
          addEntry({ type: 'option', content: `> Recoger: ${item.name}` });
          sendAction({ type: 'craft_pickup', index: pickNum - 1 });
        }
        return;
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

    // Examine by number
    if (phase === 'game' && pendingResult?.type === 'examine_prompt' && trimmed) {
      const ep = pendingResult as ExaminePrompt;
      const num = parseInt(trimmed);
      if (num === 0) {
        sendAction({ type: 'examine_exit' });
        return;
      }
      if (!isNaN(num) && num >= 1 && num <= ep.subjects.length) {
        addEntry({ type: 'option', content: `> ${ep.subjects[num - 1].label}` });
        sendAction({ type: 'examine_select', subjectId: ep.subjects[num - 1].id });
        return;
      }
    }

    // Shop interaction
    if (phase === 'game' && pendingResult?.type === 'shop_prompt' && trimmed) {
      const sp = pendingResult as ShopPrompt;
      const low = trimmed.toLowerCase();

      // [0] salir
      if (low === '0') {
        setShopSelection(null);
        sendAction({ type: 'shop_exit' });
        return;
      }

      // Si hay un item seleccionado, procesar letra de acción
      if (shopSelection) {
        if (shopSelection.mode === 'buy') {
          const idx = shopSelection.index;
          const item = sp.items[idx];
          if (low === 'c' && item) {
            setShopSelection(null);
            addEntry({ type: 'option', content: `> Comprar: ${item.name}` });
            sendAction({ type: 'shop_buy', itemIndex: idx });
            return;
          }
          if (low === 'r' && item && sp.canHaggle) {
            setShopSelection(null);
            addEntry({ type: 'option', content: `> Regatear: ${item.name}` });
            sendAction({ type: 'shop_haggle', itemIndex: idx });
            return;
          }
          if (low === 's' && item && sp.canSteal) {
            setShopSelection(null);
            addEntry({ type: 'option', content: `> Robar: ${item.name}` });
            sendAction({ type: 'shop_steal', itemIndex: idx });
            return;
          }
        } else if (shopSelection.mode === 'sell') {
          const inv = sp.playerInventory.find(p => p.id === shopSelection.itemId);
          if (low === 'v' && inv) {
            setShopSelection(null);
            addEntry({ type: 'option', content: `> Vender: ${inv.name}` });
            sendAction({ type: 'shop_sell', itemId: shopSelection.itemId });
            return;
          }
          if (low === 'e' && inv && sp.canDeceive) {
            setShopSelection(null);
            addEntry({ type: 'option', content: `> Engañar: ${inv.name}` });
            sendAction({ type: 'shop_deceive', itemId: shopSelection.itemId });
            return;
          }
        }
        // Cancelar selección con 0 o input inválido
        if (low === '0') {
          setShopSelection(null);
          return;
        }
      }

      // Atajo directo: c3, r2, s1, v7, e7
      const shortcutMatch = low.match(/^([crsve])(\d+)$/);
      if (shortcutMatch) {
        const [, letter, numStr] = shortcutMatch;
        const num = parseInt(numStr);
        if (letter === 'c' && num >= 1 && num <= sp.items.length) {
          setShopSelection(null);
          addEntry({ type: 'option', content: `> Comprar: ${sp.items[num - 1].name}` });
          sendAction({ type: 'shop_buy', itemIndex: num - 1 });
          return;
        }
        if (letter === 'r' && num >= 1 && num <= sp.items.length && sp.canHaggle) {
          setShopSelection(null);
          addEntry({ type: 'option', content: `> Regatear: ${sp.items[num - 1].name}` });
          sendAction({ type: 'shop_haggle', itemIndex: num - 1 });
          return;
        }
        if (letter === 's' && num >= 1 && num <= sp.items.length && sp.canSteal) {
          setShopSelection(null);
          addEntry({ type: 'option', content: `> Robar: ${sp.items[num - 1].name}` });
          sendAction({ type: 'shop_steal', itemIndex: num - 1 });
          return;
        }
        const sellOffset = sp.items.length;
        if (letter === 'v' && num > sellOffset && num <= sellOffset + sp.playerInventory.length) {
          const inv = sp.playerInventory[num - sellOffset - 1];
          setShopSelection(null);
          addEntry({ type: 'option', content: `> Vender: ${inv.name}` });
          sendAction({ type: 'shop_sell', itemId: inv.id });
          return;
        }
        if (letter === 'e' && num > sellOffset && num <= sellOffset + sp.playerInventory.length && sp.canDeceive) {
          const inv = sp.playerInventory[num - sellOffset - 1];
          setShopSelection(null);
          addEntry({ type: 'option', content: `> Engañar: ${inv.name}` });
          sendAction({ type: 'shop_deceive', itemId: inv.id });
          return;
        }
      }

      // Solo número: seleccionar item y abrir submenú
      const num = parseInt(trimmed);
      if (!isNaN(num) && num >= 1 && num <= sp.items.length) {
        setShopSelection({ mode: 'buy', index: num - 1 });
        return;
      }
      const sellOffset = sp.items.length;
      if (!isNaN(num) && num > sellOffset && num <= sellOffset + sp.playerInventory.length) {
        const inv = sp.playerInventory[num - sellOffset - 1];
        setShopSelection({ mode: 'sell', itemId: inv.id });
        return;
      }
    }

    // Dice roll by typing 't'
    if (phase === 'game' && (pendingResult?.type === 'dice_prompt' || pendingResult?.type === 'shop_dice_prompt')) {
      if (trimmed.toLowerCase() === 't') {
        // The DiceWidget handles the T key itself, but this catches typed 't' + Enter
        sendAction({ type: 'roll_dice' });
        return;
      }
    }

    if (!trimmed) return;

    // Normal command
    addEntry({ type: 'command', content: trimmed });
    addCommandToHistory(trimmed);
    await processCommand(trimmed);
  }, [inputValue, isLogin, phase, pendingResult, pendingSlotAction, handleLoginInput, processCommand, handleSlotInput, sendAction, startScene]);

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
    setShopSelection(null);
    sendAction({ type: 'shop_buy', itemIndex });
  };
  const handleShopSell = (itemId: string) => {
    setShopSelection(null);
    sendAction({ type: 'shop_sell', itemId });
  };
  const handleShopHaggle = (itemIndex: number) => {
    setShopSelection(null);
    sendAction({ type: 'shop_haggle', itemIndex });
  };
  const handleShopSteal = (itemIndex: number) => {
    setShopSelection(null);
    sendAction({ type: 'shop_steal', itemIndex });
  };
  const handleShopDeceive = (itemId: string) => {
    setShopSelection(null);
    sendAction({ type: 'shop_deceive', itemId });
  };
  const handleShopExit = () => {
    setShopSelection(null);
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
  if (pendingSlotAction) {
    placeholder = `Selecciona slot [1-${pendingSlotAction.slots}] o [0] cancelar`;
  } else if (pendingResult?.type === 'choice_prompt') {
    const opts = (pendingResult as ChoicePrompt).options;
    placeholder = `Escribe el número de la opción [1-${opts.length}]`;
  } else if (pendingResult?.type === 'timed_choice_prompt') {
    const opts = (pendingResult as TimedChoicePrompt).options;
    placeholder = `Escribe el número de la opción [1-${opts.length}]`;
  } else if (pendingResult?.type === 'input_prompt') {
    placeholder = (pendingResult as InputPrompt).prompt;
  } else if (pendingResult?.type === 'examine_prompt') {
    const subs = (pendingResult as ExaminePrompt).subjects;
    placeholder = `Selecciona [1-${subs.length}] o [0] salir`;
  } else if (pendingResult?.type === 'shop_prompt') {
    if (shopSelection) {
      const keys = shopSelection.mode === 'buy' ? '[C]omprar [R]egatear [S]isar' : '[V]ender [E]ngañar';
      placeholder = `${keys} — [0] cancelar`;
    } else {
      const sp = pendingResult as ShopPrompt;
      const total = sp.items.length + sp.playerInventory.length;
      placeholder = `Selecciona [1-${total}] o [0] salir`;
    }
  } else if (pendingResult?.type === 'craft_prompt') {
    placeholder = 'Combina con + (ej: 1+IN2) — [0] salir';
  } else if (pendingResult?.type === 'puzzle_prompt') {
    const pp = pendingResult as PuzzlePrompt;
    if (pp.puzzleType === 'lock') {
      placeholder = `Código de ${pp.digits || 4} dígitos`;
    } else if (pp.puzzleType !== 'sequence') {
      placeholder = pp.prompt || 'Tu respuesta...';
    }
  } else if (pendingResult?.type === 'dice_prompt' || pendingResult?.type === 'shop_dice_prompt') {
    placeholder = 'Pulsa [T] para lanzar el dado';
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

      case 'shop_dice_prompt': {
        const sdp = pendingResult as ShopDicePrompt;
        return (
          <DiceWidget
            description={sdp.description}
            stat={sdp.stat}
            difficulty={sdp.difficulty}
            faces={sdp.faces}
            onRoll={handleDiceRoll}
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
            haggleLeft={sp.haggleLeft}
            stealLeft={sp.stealLeft}
            deceiveLeft={sp.deceiveLeft}
            externalSelection={shopSelection}
            onSelectionChange={setShopSelection}
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
            tableItems={crp.tableItems}
            availableActions={crp.availableActions}
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
