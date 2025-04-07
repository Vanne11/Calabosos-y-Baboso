import React, { useState, useRef, useEffect } from 'react'
import styled from 'styled-components'
import Terminal from './components/Terminal/Terminal.jsx'
import { processCommand } from './engine/commandHandler.jsx'
import { createInitialState } from './engine/gameState.jsx'


const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.background};
  color: ${props => props.theme.text};
  font-family: 'Courier New', monospace;
  padding: 1rem;
  overflow: hidden;
`;

const LogoImage = styled.img`
  height: 4rem;
  margin-right: 0.5rem;
  vertical-align: bottom;
`;

const StatusBar = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background-color: ${props => props.theme.widgets.background};
  border: 1px solid ${props => props.theme.widgets.border};
  border-radius: 5px;
  margin-bottom: 1rem;
  transition: all 0.5s ease; /* Animación más lenta para cambios */
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 1rem;
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  margin-right: 0.5rem;
  color: ${props => props.theme.textSecondary};
`;

const StatValue = styled.span`
  font-size: 0.8rem;
  font-weight: bold;
  color: ${props => props.theme.accent};
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  height: 200px; /* Altura fija para el área de imagen */
  overflow: hidden;
`;

const ScenarioImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0;
  color: ${props => props.theme.accent};
  text-shadow: 0 0 5px ${props => props.theme.accent}33;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  margin: 0;
  color: ${props => props.theme.textSecondary};
`;

const TitleContainer = styled.div`
  text-align: center;
`;

const TerminalContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

// Overlay para animación de inicio - Corregido para usar $fading
const StartupOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.background};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: ${props => props.theme.terminal.text};
  font-family: 'Courier New', monospace;
  transition: opacity 0.5s ease;
  opacity: ${props => props.$fading ? 0 : 1};
  pointer-events: ${props => props.$fading ? 'none' : 'auto'};
`;

// Logo para la animación de inicio
const BabosLogo = styled.div`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-weight: bold;
  color: ${props => props.theme.terminal.accent};
  text-shadow: 0 0 10px ${props => props.theme.terminal.accent}40;
`;

// Contenedor para mensajes de inicio
const StartupMessages = styled.div`
  max-width: 600px;
  width: 90%;
  height: 300px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.terminal.border};
  background-color: ${props => props.theme.terminal.background};
  padding: 1rem;
  border-radius: 5px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
`;

// Mensajes de inicio individuales
const StartupMessage = styled.div`
  margin-bottom: 4px;
  color: ${props => props.$color || props.theme.terminal.text};
  font-size: 0.9rem;
`;

// Mensaje para dispositivos móviles
const MobileWarning = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: ${props => props.theme.terminal.dialogBackground};
  color: ${props => props.theme.terminal.text};
  padding: 1rem;
  z-index: 999;
  border-bottom: 2px solid ${props => props.theme.terminal.accent};
  font-size: 0.9rem;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.5s ease;
  
  @keyframes slideDown {
    from { transform: translateY(-100%); }
    to { transform: translateY(0); }
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: ${props => props.theme.terminal.accent};
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  
  &:hover {
    color: ${props => props.theme.terminal.error};
  }
`;

// Componente para mostrar las stats del juego
const StatsDisplay = ({ gameState }) => {
  if (!gameState || !gameState.stats) return null;

  // Filtrar stats importantes y darles nombres amigables
  const importantStats = {
    will_to_live: "Ganas de vivir",
    strength: "Fuerza",
    intelligence: "Inteligencia",
    perception: "Percepción"
  };

  return (
    <>
      {Object.entries(gameState.stats)
        .filter(([key]) => key in importantStats)
        .map(([key, value]) => (
          <StatItem key={key}>
            <StatLabel>{importantStats[key]}:</StatLabel>
            <StatValue>{value}</StatValue>
          </StatItem>
        ))
      }
    </>
  );
};

// Secuencia de inicio estilo Linux
const bootSequence = [
  { text: "Iniciando BabosOS v0.1.0...", color: "#8be9fd", delay: 500 },
  { text: "Verificando hardware baboso...", color: "#f1fa8c", delay: 400 },
  { text: "CPU: Intel Babium i7 @ 2.5Ghz", color: "#f8f8f2", delay: 200 },
  { text: "Memoria: 16GB RAM (8GB dedicados a baba)", color: "#f8f8f2", delay: 200 },
  { text: "Disco: 1TB SSD (99% lleno de memes de babosas)", color: "#f8f8f2", delay: 200 },
  { text: "Cargando módulos del kernel...", color: "#bd93f9", delay: 300 },
  { text: "Módulo slime_core.ko.....................[ OK ]", color: "#50fa7b", delay: 150 },
  { text: "Módulo babos_graphics.ko.................[ OK ]", color: "#50fa7b", delay: 100 },
  { text: "Módulo sarcasm_engine.ko.................[ OK ]", color: "#50fa7b", delay: 100 },
  { text: "Módulo disappointment_generator.ko.......[ OK ]", color: "#50fa7b", delay: 100 },
  { text: "Módulo auto_insult.ko....................[ OK ]", color: "#50fa7b", delay: 100 },
  { text: "Comprobando sistema de archivos...", color: "#ff79c6", delay: 400 },
  { text: "Montando /dev/slime1 en /", color: "#f8f8f2", delay: 200 },
  { text: "Iniciando servicios babosos...", color: "#bd93f9", delay: 300 },
  { text: "Servicio narrador_sarcastico.........[ OK ]", color: "#50fa7b", delay: 150 },
  { text: "Servicio generador_de_rutas..........[ OK ]", color: "#50fa7b", delay: 150 },
  { text: "Servicio gestor_de_dialogos..........[ OK ]", color: "#50fa7b", delay: 150 },
  { text: "Estableciendo conexión babosa...", color: "#8be9fd", delay: 300 },
  { text: "¡Preparando interfaz viscosa!", color: "#ff79c6", delay: 300 },
  { text: "BabosOS cargado con éxito.", color: "#50fa7b", delay: 400 },
  { text: "Bienvenido al sistema.", color: "#f1fa8c", delay: 500 }
];

// Mensaje de inicio estilo Linux con colores Rich
const linuxWelcomeMessage = [
  { type: 'system', content: '[cyan]┌──────────────────────────────────────────────────────┐[/cyan]' },
  { type: 'system', content: '[cyan]│[/cyan]                                                      [cyan]│[/cyan]' },
  { type: 'system', content: '[cyan]│[/cyan]                [green][bold]BabosOS v0.1.0[/bold][/green]                        [cyan]│[/cyan]' },
  { type: 'system', content: '[cyan]│[/cyan]           [yellow]Sistema Operativo para Babosas™[/yellow]            [cyan]│[/cyan]' },
  { type: 'system', content: '[cyan]│[/cyan]                                                      [cyan]│[/cyan]' },
  { type: 'system', content: '[cyan]└──────────────────────────────────────────────────────┘[/cyan]' },
  { type: 'system', content: ' ' },
  { type: 'system', content: '[yellow]Último inicio de sesión:[/yellow] [italic]Viscoso, 6 de Abril, 2025[/italic]' },
  { type: 'system', content: '[green]Kernel BabOS 5.15.0-25-baboso[/green] ([dim]compilación #26~20.04.1[/dim])' },
  { type: 'system', content: '[blue]Sistema de archivos:[/blue] [bold]SlimePath[/bold]' },
  { type: 'system', content: ' ' },
  { type: 'system', content: '[purple]🐌 ¡Bienvenido al Motor Baboso! 🐌[/purple]' },
  { type: 'system', content: ' ' },
  { type: 'system', content: 'Escribe [green][bold]help[/bold][/green] para ver los comandos disponibles.' },
  { type: 'system', content: 'Escribe [green][bold]run demo[/bold][/green] para iniciar la aventura de demostración.' },
  { type: 'system', content: ' ' },
];

// Escena de login para iniciar
const loginSequence = [
  { type: 'system', content: '[cyan]BabosOS iniciando sesión...[/cyan]' },
  { type: 'system', content: '[green]Login:[/green] usuario_baboso' },
  { type: 'system', content: '[green]Contraseña:[/green] ********' },
  { type: 'system', content: '[yellow]Autenticando...[/yellow]' },
  { type: 'system', content: '[green]Acceso concedido.[/green]' },
  { type: 'system', content: '' },
];

// Mensaje para dispositivos móviles
const mobileWarningMessage = `
[bold][red]¡ADVERTENCIA DE DISPOSITIVO MÓVIL![/red][/bold]

Los desarrolladores apenas tienen tiempo para ir al baño, ganar un salario, soñar con kartings y postular proyectos, así que [italic]no esperes que funcione bien en tu celular[/italic].

Todo se diseñó en un PC. ¿Te imaginas desarrollando en una pantalla de 5 pulgadas? Ni siquiera un par de babosas podrían trabajar cómodamente ahí.

[yellow]Consejo:[/yellow] Consigue un dispositivo decente o prepárate para una experiencia tan fluida como una babosa subiendo una montaña.
`;

function App() {
  const [awaitingUser, setAwaitingUser] = useState(false);
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  const [tempUser, setTempUser] = useState('');
  const [loggedUser, setLoggedUser] = useState('');
  const [inputType, setInputType] = useState('text');  // Para ocultar contraseña

  const [awaitingLogin, setAwaitingLogin] = useState(true);

  const [message, setMessage] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [terminalHistory, setTerminalHistory] = useState([]);
  const [gameData, setGameData] = useState(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameState, setGameState] = useState(createInitialState());
  const [currentRoute, setCurrentRoute] = useState('');

  // Estados para la animación de inicio
  const [showStartup, setShowStartup] = useState(true);
  const [startupFading, setStartupFading] = useState(false);
  const [startupMessages, setStartupMessages] = useState([]);

  // Estado para advertencia móvil
  const [showMobileWarning, setShowMobileWarning] = useState(false);

  const terminalRef = useRef(null);
  const startupMessagesEndRef = useRef(null);



  // Comprobar si es un dispositivo móvil
  useEffect(() => {
    const checkIfMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 768;
    };

    // Solo mostrar la advertencia en móviles
    if (checkIfMobile()) {
      setShowMobileWarning(true);
    }

    // También verificar en cambios de tamaño de ventana
    const handleResize = () => {
      if (checkIfMobile() && !showMobileWarning) {
        setShowMobileWarning(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [showMobileWarning]);

  // Animar la secuencia de inicio
  useEffect(() => {
    if (!showStartup) return;

    let currentIndex = 0;
    let timer;

    const showNextMessage = () => {
      if (currentIndex < bootSequence.length) {
        console.log("bootSequence actual:", bootSequence[currentIndex]);

        // Añadir el siguiente mensaje a la secuencia
        setStartupMessages(prev => [...prev, bootSequence[currentIndex]]);

        // Programar el siguiente mensaje
        timer = setTimeout(
          showNextMessage,
          bootSequence[currentIndex].delay
        );

        currentIndex++;
      } else {
        // Todos los mensajes mostrados, esperar un momento y desvanecer
        setTimeout(() => {
          setStartupFading(true);

          // Eliminar completamente después de la transición
          setTimeout(() => {
            setShowStartup(false);

            // Inicializar terminal con mensaje de bienvenida
            setTerminalHistory([
              { type: 'system', content: '[cyan]BabosOS iniciando sesión...[/cyan]' },
              { type: 'system', content: '[green]Login:[/green]' }
            ]);

            setAwaitingUser(true);
          }, 500); // Duración del desvanecimiento
        }, 1000); // Tiempo de espera después del último mensaje
      }
    };

    // Comenzar la secuencia
    showNextMessage();

    // Limpieza
    return () => clearTimeout(timer);
  }, [showStartup]);

  // Capturar clics en la ventana para devolver el foco al terminal
  useEffect(() => {
    const handleWindowClick = () => {
      if (terminalRef.current && !showStartup) {
        terminalRef.current.focus();
      }
    };

    window.addEventListener('click', handleWindowClick);

    return () => {
      window.removeEventListener('click', handleWindowClick);
    };
  }, [showStartup]);

  // Al cargar un juego, inicializar su estado
  useEffect(() => {
    if (gameData) {
      // Limpiar la terminal al cargar un juego
      setTerminalHistory([
        { type: 'system', content: '[green]¡Juego cargado correctamente![/green]' },
        { type: 'system', content: `[yellow]Iniciando [bold]${gameData.name || "aventura"}[/bold]...[/yellow]` },
        { type: 'system', content: '[dim]Prepárate para tomar decisiones terribles.[/dim]' },
        { type: 'system', content: ' ' }
      ]);

      // Mostrar advertencia de móvil para juegos
      if (showMobileWarning) {
        setTerminalHistory(prev => [
          ...prev,
          { type: 'system', content: mobileWarningMessage }
        ]);
      }

      // Crear estado inicial
      const initialState = createInitialState(gameData);
      setGameState(initialState);

      // Establecer la ruta inicial después de un breve retraso
      // para asegurar que todo está inicializado
      setTimeout(() => {
        if (!currentRoute) {
          setCurrentRoute('start');
        }
      }, 100);
    }
  }, [gameData, showMobileWarning]);

  useEffect(() => {
    if (startupMessagesEndRef.current) {
      startupMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [startupMessages]);

  // Limpiar historial del terminal
  const clearHistory = () => {
    setTerminalHistory([{ type: 'system', content: '[dim]Terminal limpiada. Como tus esperanzas.[/dim]' }]);
  };

  // Resetear terminal al estado inicial
  const resetTerminal = () => {
    setTerminalHistory([
      { type: 'system', content: '[red]Sesión finalizada.[/red]' },
      { type: 'system', content: ' ' },
      ...loginSequence,
      ...linuxWelcomeMessage
    ]);
  };

  // Añadir mensaje a la terminal
  const addToTerminal = (content, type = 'system') => {
    setTerminalHistory(prev => [...prev, { type, content }]);
  };

  // Manejar comandos del terminal
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

  const handleCommand = async (command) => {
    if (awaitingUser) {
      // Añade solo el comando del usuario una vez
      setTerminalHistory(prev => [
        ...prev.slice(0, -1), // Esto elimina el "Login:" repetido
        { type: 'command', content: command },
        { type: 'system', content: '[green]Contraseña:[/green]' }
      ]);
      setTempUser(command);
      setAwaitingUser(false);
      setAwaitingPassword(true);
      setInputType('password');
      return '';
    }

    if (awaitingPassword) {
      setTerminalHistory(prev => [
        ...prev.slice(0, -1), // Esto elimina la repetición de "Contraseña:"
        { type: 'command', content: '****' }
      ]);

      setInputType('text');
      setAwaitingPassword(false);
      setLoggedUser(tempUser);

      const sarcasticComment = command.length < 4
        ? '[italic]¿En serio? Bueno creo que no te esforzaste mucho para pensar...[/italic]'
        : '[italic]Impresionante, recordaste tu contraseña. Te daría un premio, pero se me olvidó traerlo.[/italic]';

      // Secuencia dramática con retardo
      const loginSequenceDramatica = [
        { type: 'system', content: '[yellow]Autenticando...[/yellow]', delay: 1000 },
        { type: 'system', content: sarcasticComment, delay: 1500 },
        { type: 'system', content: '[green]Acceso concedido.[/green]', delay: 1000 },
        { type: 'system', content: '', delay: 500 },
        ...linuxWelcomeMessage.map(msg => ({ ...msg, delay: 200 }))
      ];

      for (const entry of loginSequenceDramatica) {
        await delay(entry.delay);
        setTerminalHistory(prev => [...prev, entry]);
        setTimeout(() => {
          terminalRef.current?.focus();
        }, 10);
      }

      return '';
    }

    // manejo normal de comandos
    const response = await processCommand(command, gameState, {
      setGameData,
      setCurrentImage,
      setCurrentRoute,
      setGameLoaded,
      clearHistory,
      addToTerminal: (content) => setTerminalHistory(prev => [...prev, { type: 'system', content }]),
      resetTerminal
    });

    return response;
  };


  const promptSymbol = loggedUser ? `[${loggedUser}@cyb] >` : 'cyb >';

  return (
    <AppContainer>
      {/* Overlay de inicio */}
      {showStartup && (
        <StartupOverlay $fading={startupFading}>
          {/*<BabosLogo>🐌 BabosOS</BabosLogo>*/}
              <LogoImage src="images/logo.png" alt="Logo" />
              BabosOS
          <StartupMessages>
            {startupMessages.filter(Boolean).map((msg, index) => (
              <StartupMessage key={index} $color={msg.color || '#ffffff'}>
                {msg.text}
              </StartupMessage>
            ))}
            <div ref={startupMessagesEndRef} /> {/* <- Esto es lo que debes añadir */}

          </StartupMessages>
        </StartupOverlay>
      )}

      {/* Advertencia móvil */}
      {showMobileWarning && !showStartup && !gameLoaded && (
        <MobileWarning>
          <div>
            ⚠️ Este sitio está diseñado para PC. En dispositivos móviles puede comportarse de forma extraña, como una babosa en una pista de baile.
          </div>
          <CloseButton onClick={() => setShowMobileWarning(false)}>✕</CloseButton>
        </MobileWarning>
      )}

      {/* Barra de estado - solo visible cuando hay un juego cargado */}
      {gameLoaded && gameData && (
        <StatusBar>
          <div>Fase: {gameState.time.currentPhase}</div>
          <div style={{ display: 'flex' }}>
            <StatsDisplay gameState={gameState} />
          </div>
        </StatusBar>
      )}

      {/* Contenedor de imagen */}
      <ImageContainer>
        {currentImage ? (
          <ScenarioImage src={currentImage} alt="Escenario actual" />
        ) : (
          <TitleContainer>
            <Title>
              <LogoImage src="images/logo.png" alt="Logo" />
              BabosOS
            </Title>
            <Subtitle>Calabosos y Babosos™</Subtitle>
          </TitleContainer>
        )}
      </ImageContainer>

      {/* Terminal - donde aparecen todos los diálogos, opciones, etc. */}
      <TerminalContainer>

        <Terminal
          prompt={promptSymbol}
          initialMessage={message}
          onCommand={(cmd) => handleCommand(cmd, { setLoggedUser, setAwaitingLogin })}
          history={terminalHistory}
          setHistory={setTerminalHistory}
          ref={terminalRef}
          gameState={gameState}
          setGameState={setGameState}
          gameData={gameData}
          currentRoute={currentRoute}
          setCurrentRoute={setCurrentRoute}
          inputType={inputType} // <-- agrega esta línea

        />
      </TerminalContainer>
    </AppContainer>
  );
}

export default App;