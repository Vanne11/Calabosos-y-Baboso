import React, { useState, useEffect, useRef } from 'react';
import Terminal from './components/Terminal';
import AsciiRenderer from './components/AsciiRenderer';
import DialogSystem from './components/DialogSystem';
import GameEngine from './components/GameEngine';
import './styles/terminal.css';

/**
 * App Component
 * 
 * Componente principal que:
 * - Integra Terminal, AsciiRenderer y GameEngine
 * - Gestiona estados globales de la aplicación
 * - Maneja la carga inicial de datos
 * - Implementa la estructura visual general
 */
const App = () => {
  // Estado para los datos del juego
  const [gameData, setGameData] = useState({
    rutas: null,
    historia: null,
    ciudad: null,
    combate: null,
    introduccion: null,
    relleno: null
  });
  
  // Estado para controlar la carga de datos
  const [loading, setLoading] = useState(true);
  // Estado para mensajes de error
  const [error, setError] = useState(null);
  // Estado para la imagen actual
  const [currentImage, setCurrentImage] = useState(null);
  // Estado para opciones de terminal
  const [terminalOptions, setTerminalOptions] = useState([]);
  // Estado para mensajes iniciales
  const [initialMessages, setInitialMessages] = useState([
    { text: "Cargando Calabozos y Babosos...", type: "system" }
  ]);
  
  // Referencia al componente Terminal
  const terminalRef = useRef(null);
  
  // Efecto para cargar los datos del juego
  useEffect(() => {
    loadGameData();
  }, []);
  
  // Función para cargar los datos del juego
  const loadGameData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar todos los archivos JSON
      const rutasData = await fetchJson('/data/rutas.json');
      const historiaData = await fetchJson('/data/historia.json');
      const ciudadData = await fetchJson('/data/ciudad.json');
      const combateData = await fetchJson('/data/combate.json');
      const introduccionData = await fetchJson('/data/introduccion.json');
      const rellenoData = await fetchJson('/data/relleno.json');
      
      setGameData({
        rutas: rutasData,
        historia: historiaData,
        ciudad: ciudadData,
        combate: combateData,
        introduccion: introduccionData,
        relleno: rellenoData
      });
      
      setLoading(false);
      
      // Mostrar mensaje de bienvenida
      if (terminalRef.current) {
        terminalRef.current.addMessage({
          text: "¡Bienvenido a Calabozos y Babosos!",
          type: "system",
          animate: true
        });
        
        setTimeout(() => {
          terminalRef.current.addMessage({
            text: "Presiona cualquier tecla para comenzar tu aventura...",
            type: "narrator",
            animate: true
          });
        }, 1500);
      }
    } catch (err) {
      console.error('Error al cargar datos del juego:', err);
      setError('Error al cargar los datos del juego. Por favor, recarga la página.');
      setLoading(false);
    }
  };
  
  // Función auxiliar para cargar archivos JSON
  const fetchJson = async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error al cargar ${url}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error al cargar ${url}:`, error);
      throw error;
    }
  };
  
  // Función para manejar la selección de opciones
  const handleOptionSelect = (option) => {
    console.log('Opción seleccionada:', option);
    // La lógica específica será manejada por GameEngine
  };
  
  // Función para manejar la entrada de comandos
  const handleCommandSubmit = (command) => {
    console.log('Comando ingresado:', command);
    // Implementar lógica de comandos aquí
  };
  
  // Función para manejar cambios en el estado del juego
  const handleGameStateChange = (newState) => {
    console.log('Estado del juego actualizado:', newState);
    
    // Actualizar la imagen si cambia la ruta
    if (newState.rutaActual && gameData.rutas) {
      const currentRoute = gameData.rutas.rutas.find(r => r.id === newState.rutaActual);
      if (currentRoute && currentRoute.escenario) {
        // Aquí se cargaría la imagen del escenario
        setCurrentImage(`/images/escenarios/${currentRoute.id}.png`);
      }
    }
  };
  
  // Función para añadir un mensaje a la terminal
  const addMessage = (message) => {
    if (terminalRef.current) {
      terminalRef.current.addMessage(message);
    }
  };
  
  // Renderizar pantalla de carga
  if (loading) {
    return (
      <div className="app-container">
        <Terminal
          title="Calabozos y Babosos - Cargando"
          initialMessages={initialMessages}
          allowInput={false}
        />
      </div>
    );
  }
  
  // Renderizar pantalla de error
  if (error) {
    return (
      <div className="app-container">
        <Terminal
          title="Calabozos y Babosos - Error"
          initialMessages={[
            { text: error, type: "error" },
            { text: "Intenta recargar la página.", type: "system" }
          ]}
          allowInput={false}
        />
      </div>
    );
  }
  
  // Renderizar el juego
  return (
    <div className="app-container">
      <GameEngine
        rutasData={gameData.rutas}
        historiaData={gameData.historia}
        ciudadData={gameData.ciudad}
        combateData={gameData.combate}
        introduccionData={gameData.introduccion}
        rellenoData={gameData.relleno}
        onStateChange={handleGameStateChange}
      >
        <div className="game-layout">
          <div className="ascii-container">
            {currentImage && (
              <AsciiRenderer
                imageSrc={currentImage}
                width={80}
                charSet="standard"
                colored={true}
                brightness={0}
                contrast={0.2}
              />
            )}
          </div>
          
          <Terminal
            ref={terminalRef}
            title="Calabozos y Babosos"
            initialMessages={initialMessages}
            options={terminalOptions}
            onOptionSelect={handleOptionSelect}
            onCommandSubmit={handleCommandSubmit}
            typingSpeed={30}
            allowInput={true}
            promptSymbol=">"
          />
          
          <DialogSystem
            terminal={{
              addMessage,
              setOptions: setTerminalOptions
            }}
          />
        </div>
      </GameEngine>
    </div>
  );
};

export default App;
