// hooks/useLoginFlow.ts
// Flujo de login interactivo - idéntico al original

import { useState } from 'react';
import { useAppStore, saveSession, getStoredCredentials } from '../store/useAppStore';
import { delay } from '../utils/delay';

type LoginStep = 'username' | 'password' | 'authenticating' | 'done';

export const welcomeMessages = [
  { type: 'system' as const, content: '[cyan]┌──────────────────────────────────────────────────────┐[/cyan]' },
  { type: 'system' as const, content: '[cyan]│[/cyan]                                                      [cyan]│[/cyan]' },
  { type: 'system' as const, content: '[cyan]│[/cyan]                [green][bold]BabosOS v0.1.0[/bold][/green]                        [cyan]│[/cyan]' },
  { type: 'system' as const, content: '[cyan]│[/cyan]           [yellow]Sistema Operativo para Babosas™[/yellow]            [cyan]│[/cyan]' },
  { type: 'system' as const, content: '[cyan]│[/cyan]                                                      [cyan]│[/cyan]' },
  { type: 'system' as const, content: '[cyan]└──────────────────────────────────────────────────────┘[/cyan]' },
  { type: 'system' as const, content: ' ' },
  { type: 'system' as const, content: '[yellow]Último inicio de sesión:[/yellow] [italic]Viscoso, 6 de Abril, 2025[/italic]' },
  { type: 'system' as const, content: '[green]Kernel BabOS 5.15.0-25-baboso[/green] ([dim]compilación #26~20.04.1[/dim])' },
  { type: 'system' as const, content: '[blue]Sistema de archivos:[/blue] [bold]SlimePath[/bold]' },
  { type: 'system' as const, content: ' ' },
  { type: 'system' as const, content: '[purple]🐌 ¡Bienvenido al Motor Baboso! 🐌[/purple]' },
  { type: 'system' as const, content: ' ' },
  { type: 'system' as const, content: 'Escribe [green][bold]help[/bold][/green] para ver los comandos disponibles.' },
  { type: 'system' as const, content: 'Escribe [green][bold]run demo[/bold][/green] para iniciar la aventura de demostración.' },
  { type: 'system' as const, content: ' ' },
];

export function useLoginFlow() {
  const phase = useAppStore((s) => s.phase);
  const setPhase = useAppStore((s) => s.setPhase);
  const setUsername = useAppStore((s) => s.setUsername);
  const addEntry = useAppStore((s) => s.addEntry);
  const replaceLastEntries = useAppStore((s) => s.replaceLastEntries);
  const speed = useAppStore((s) => s.speed);

  const [loginStep, setLoginStep] = useState<LoginStep>('username');
  const [tempUser, setTempUser] = useState('');

  const isLogin = phase === 'login';

  const initLogin = () => {
    // Idéntico al original: muestra "BabosOS iniciando sesión..." y "Login:"
    useAppStore.getState().addEntries([
      { type: 'system', content: '[cyan]BabosOS iniciando sesión...[/cyan]' },
      { type: 'system', content: '[green]Login:[/green]' },
    ]);
    setLoginStep('username');
  };

  const handleLoginInput = async (input: string) => {
    if (loginStep === 'username') {
      setTempUser(input);
      // Original: prev.slice(0, -1) elimina la línea "Login:" y añade comando + "Contraseña:"
      replaceLastEntries(1, [
        { type: 'command', content: input },
        { type: 'system', content: '[green]Contraseña:[/green]' },
      ]);
      setLoginStep('password');
      return;
    }

    if (loginStep === 'password') {
      // Original: prev.slice(0, -1) elimina "Contraseña:" y añade "****"
      replaceLastEntries(1, [
        { type: 'command', content: '****' },
      ]);
      setLoginStep('authenticating');

      // Verificar contra credenciales guardadas
      const stored = getStoredCredentials();
      if (stored) {
        if (tempUser !== stored.username) {
          await delay(1000, speed);
          addEntry({ type: 'system', content: '[yellow]Autenticando...[/yellow]' });
          await delay(1500, speed);
          addEntry({ type: 'system', content: '[red]Error: usuario no reconocido. ¿Quién eres tú y qué hiciste con [bold]' + stored.username + '[/bold]?[/red]' });
          await delay(1000, speed);
          addEntry({ type: 'system', content: '[dim]Inténtalo de nuevo, impostor.[/dim]' });
          addEntry({ type: 'system', content: '[green]Login:[/green]' });
          setLoginStep('username');
          setTempUser('');
          return;
        }
        if (input !== stored.password) {
          await delay(1000, speed);
          addEntry({ type: 'system', content: '[yellow]Autenticando...[/yellow]' });
          await delay(1500, speed);
          addEntry({ type: 'system', content: '[red]Error: contraseña incorrecta. ¿Te comió la memoria una babosa?[/red]' });
          await delay(1000, speed);
          addEntry({ type: 'system', content: '[dim]Venga, que tú puedes. O no.[/dim]' });
          addEntry({ type: 'system', content: '[green]Login:[/green]' });
          setLoginStep('username');
          setTempUser('');
          return;
        }
      }

      const sarcasticComment =
        input.length < 4
          ? '[italic]¿En serio? Bueno creo que no te esforzaste mucho para pensar...[/italic]'
          : '[italic]Impresionante, recordaste tu contraseña. Te daría un premio, pero se me olvidó traerlo.[/italic]';

      // Secuencia dramática con retardo - idéntica al original
      const sequence = [
        { content: '[yellow]Autenticando...[/yellow]', ms: 1000 },
        { content: sarcasticComment, ms: 1500 },
        { content: '[green]Acceso concedido.[/green]', ms: 1000 },
        { content: '', ms: 500 },
      ];

      for (const step of sequence) {
        await delay(step.ms, speed);
        addEntry({ type: 'system', content: step.content });
      }

      // Banner de bienvenida con delay entre mensajes - idéntico al original
      for (const msg of welcomeMessages) {
        await delay(200, speed);
        addEntry(msg);
      }

      setUsername(tempUser);
      saveSession(tempUser, input);
      setLoginStep('done');
      setPhase('shell');
      return;
    }
  };

  return {
    isLogin,
    loginStep,
    handleLoginInput,
    initLogin,
  };
}
