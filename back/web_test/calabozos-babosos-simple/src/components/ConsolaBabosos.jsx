import React, { useState, useEffect, useRef } from 'react';
import './ConsolaBabosos.css';

// Datos de prueba
const DATOS_PRUEBA = {
  dialogos: [
    {
      id: "prologo_narrador",
      secuencia: [
        {
          personaje: "NARRADOR",
          texto: "Desde tiempos inmemoriales, el Reino de Viscaria ha vivido aterrorizado por las criaturas que habitan el Abismo de las Babosas, una mazmorra tan profunda y retorcida como... eh, ¿estás prestando atención?"
        },
        {
          personaje: "NARRADOR",
          texto: "¡Por fin! Pensé que tendría que recitar toda la introducción yo solo. Necesitamos a alguien que protagonice esta historia y parece que ese alguien eres tú.",
          pausa: true
        },
        {
          personaje: "NARRADOR",
          texto: "Vamos, vamos, elige un género y un nombre. Como si importara... igual te llamaré BOB."
        }
      ],
      opciones: [
        {
          texto: "Continuar",
          siguiente_ruta: "plaza_principal"
        }
      ]
    }
  ],
  rutas: [
    {
      id: "plaza_principal",
      nombre: "Plaza Principal",
      dialogo_tipo: "historia",
      dialogo_id: "encuentro_plaza",
      escenario: {
        descripcion: "Una bulliciosa plaza medieval con puestos de mercado y una fuente central.",
        ambiente: "Día soleado, mucho ruido de mercaderes y compradores",
        color_fondo: "#F5DEB3",
        color_texto: "#8B4513",
        elementos_destacados: ["fuente de piedra", "puestos de mercado", "guardias patrullando"],
        sonidos: ["multitud", "pregones", "caballos"]
      }
    }
  ],
  estadoJuego: {
    stats: {
      "Ganas de vivir": 100,
      "Hambre intensa": 0,
      "Pipí acumulado": 0,
      "Miedo": 0,
      "Reputación": 50
    },
    inventario: [
      { nombre: "Espada oxidada", descripcion: "Una espada vieja que probablemente se rompa en el primer golpe." },
      { nombre: "Zurrón", descripcion: "Bolsa de cuero de origen cuestionable." },
      { nombre: "Sal", descripcion: "Un puñado de sal. Letal para las babosas." }
    ]
  }
};

// Componente principal
const ConsolaBabosos = () => {
  // Estados
  const [dialogoActual, setDialogoActual] = useState(DATOS_PRUEBA.dialogos[0]);
  const [indiceMensaje, setIndiceMensaje] = useState(0);
  const [textoActual, setTextoActual] = useState("");
  const [mostrarCursor, setMostrarCursor] = useState(true);
  const [estadoJuego, setEstadoJuego] = useState(DATOS_PRUEBA.estadoJuego);
  const [layoutModo, setLayoutModo] = useState("centrado"); 
  const [mostrarOpciones, setMostrarOpciones] = useState(false);
  const [mostrarStats, setMostrarStats] = useState(false);
  const [historialMensajes, setHistorialMensajes] = useState([]);
  
  const terminalRef = useRef(null);
  const velocidadTexto = 30; // ms por carácter

  // Colores de personajes
  const colorPersonaje = {
    NARRADOR: "#FFD700", 
    PROTAGONISTA: "#1E90FF", 
    NERLY: "#00CED1", 
    TENDERO: "#8B4513", 
    REY_BABOSO: "#8B0000", 
    GUARDIA: "#A9A9A9", 
    DEFAULT: "#FFFFFF" 
  };

  // Función para obtener el color según el personaje
  const getColorPersonaje = (personaje) => {
    for (const key in colorPersonaje) {
      if (personaje.includes(key)) {
        return colorPersonaje[key];
      }
    }
    return colorPersonaje.DEFAULT;
  };

  // Efecto para escribir texto letra por letra
  useEffect(() => {
    if (!dialogoActual || indiceMensaje >= dialogoActual.secuencia.length) {
      if (dialogoActual && indiceMensaje >= dialogoActual.secuencia.length) {
        setMostrarOpciones(true);
      }
      return;
    }

    const mensajeActual = dialogoActual.secuencia[indiceMensaje];
    const textoCompleto = mensajeActual.texto;
    let index = 0;

    if (indiceMensaje > 0 || historialMensajes.length > 0) {
      const mensajeAnterior = dialogoActual.secuencia[indiceMensaje - 1];
      if (indiceMensaje > 0 && !historialMensajes.some(m => 
          m.personaje === mensajeAnterior.personaje && 
          m.texto === mensajeAnterior.texto)) {
        setHistorialMensajes(prev => [...prev, mensajeAnterior]);
      }
    }

    // Animación de escritura
    const timer = setInterval(() => {
      if (index < textoCompleto.length) {
        setTextoActual(textoCompleto.substring(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        
        if (mensajeActual.pausa) {
          setMostrarCursor(true);
        } else {
          setTimeout(() => {
            setIndiceMensaje(prev => prev + 1);
            setTextoActual("");
          }, 1000);
        }
      }
    }, velocidadTexto);

    return () => clearInterval(timer);
  }, [dialogoActual, indiceMensaje]);

  // Hacer scroll automático
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [textoActual, historialMensajes]);

  // Manejar eventos de teclado para continuar
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && mostrarCursor) {
        setMostrarCursor(false);
        
        if (dialogoActual && indiceMensaje < dialogoActual.secuencia.length) {
          const mensajeActual = dialogoActual.secuencia[indiceMensaje];
          if (mensajeActual.pausa) {
            setHistorialMensajes(prev => [...prev, mensajeActual]);
            setIndiceMensaje(prev => prev + 1);
            setTextoActual("");
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarCursor, dialogoActual, indiceMensaje]);

  // Función para manejar selección de opciones
  const seleccionarOpcion = (opcion) => {
    console.log(`Seleccionada opción: ${opcion.texto} -> ${opcion.siguiente_ruta}`);
    setMostrarOpciones(false);
    
    setHistorialMensajes([]);
    setIndiceMensaje(0);
    setTextoActual("");
    
    // En una implementación real, aquí cargaríamos el siguiente diálogo
    setDialogoActual(DATOS_PRUEBA.dialogos[0]);
  };

  // Renderizar mensajes del historial
  const renderizarHistorial = () => {
    return historialMensajes.map((mensaje, idx) => {
      const esNarrador = mensaje.personaje === "NARRADOR";
      return (
        <div key={idx} className={`mensaje-historial ${esNarrador ? 'narrador' : ''}`}>
          <span 
            className="personaje" 
            style={{ color: getColorPersonaje(mensaje.personaje) }}
          >
            {esNarrador ? "" : `${mensaje.personaje}:`}
          </span>
          <span className="texto">{mensaje.texto}</span>
        </div>
      );
    });
  };

  // Renderizar mensaje actual
  const renderizarMensajeActual = () => {
    if (!dialogoActual || indiceMensaje >= dialogoActual.secuencia.length) {
      return null;
    }

    const mensajeActual = dialogoActual.secuencia[indiceMensaje];
    const esNarrador = mensajeActual.personaje === "NARRADOR";
    
    return (
      <div className={`mensaje-actual ${esNarrador ? 'narrador' : ''}`}>
        <span 
          className="personaje" 
          style={{ color: getColorPersonaje(mensajeActual.personaje) }}
        >
          {esNarrador ? "" : `${mensajeActual.personaje}:`}
        </span>
        <span className="texto">
          {textoActual}
          {mostrarCursor && <span className="cursor-parpadeo">▌</span>}
        </span>
      </div>
    );
  };

  // Renderizar opciones
  const renderizarOpciones = () => {
    if (!mostrarOpciones || !dialogoActual || !dialogoActual.opciones) {
      return null;
    }

    return (
      <div className="opciones">
        <div className="opciones-titulo">¿Qué quieres hacer?</div>
        {dialogoActual.opciones.map((opcion, idx) => (
          <div 
            key={idx} 
            className="opcion"
            onClick={() => seleccionarOpcion(opcion)}
          >
            <span className="opcion-numero">{idx + 1}. </span>
            <span className="opcion-texto">{opcion.texto}</span>
          </div>
        ))}
        <div 
          className="opcion opcion-stat"
          onClick={() => setMostrarStats(!mostrarStats)}
        >
          <span className="opcion-numero">s. </span>
          <span className="opcion-texto">Ver estadísticas</span>
        </div>
      </div>
    );
  };

  // Renderizar stats
  const renderizarStats = () => {
    if (!mostrarStats) return null;

    return (
      <div className="stats-panel">
        <div className="stats-header">
          <h3>Estadísticas</h3>
          <span 
            className="stats-close"
            onClick={() => setMostrarStats(false)}
          >
            ✕
          </span>
        </div>
        
        {Object.entries(estadoJuego.stats).map(([stat, valor]) => {
          let colorBarra = "barra-verde";
          if (valor < 30) colorBarra = "barra-roja";
          else if (valor < 60) colorBarra = "barra-amarilla";
          
          return (
            <div key={stat} className="stat">
              <div className="stat-header">
                <span className="stat-nombre">{stat}</span>
                <span className="stat-valor">{valor}</span>
              </div>
              <div className="barra-fondo">
                <div 
                  className={`barra-progreso ${colorBarra}`}
                  style={{ width: `${valor}%` }}
                ></div>
              </div>
            </div>
          );
        })}
        
        <h3 className="inventario-titulo">Inventario</h3>
        {estadoJuego.inventario.map((item, idx) => (
          <div key={idx} className="item">
            <div className="item-nombre">{item.nombre}</div>
            <div className="item-descripcion">{item.descripcion}</div>
          </div>
        ))}
      </div>
    );
  };

  // Renderizar imagen ASCII
  const renderizarImagenAscii = () => {
    return (
      <div className="ascii-imagen">
        <div className="ascii-titulo">plaza_principal.ascii</div>
        <pre className="ascii-arte">
{`
╔══════════════════════════════════════════╗
║                                          ║
║                  .---.                   ║
║                 /     \\                  ║
║                |  o o  |                 ║
║                |  \\=/  |  <-- Fuente    ║
║                 \\_---_/                  ║
║    ______      /|||||\\                   ║
║   /|_||_\\__   /|||||||\\                  ║
║  (   _    _  |  |||||||||||              ║
║  | '_____' )|   |||||||||||              ║
║  ==========  /  |||||||||      ___       ║
║  |  [ ]   |     |||||||||     |_|_|      ║
║  |  [ ]   |     ||||||||| _   |_|_|      ║
║__|________|__   ||||||||| || _____|____  ║
║                 |||||||||  |             ║
║                 |||||||||                ║
║  O  O           |||||||||               ║
║ /|__|/|          |||||||                 ║
║  | /\\|                                   ║
║  |/  \\|                                   ║
║                                          ║
╚══════════════════════════════════════════╝
`}
        </pre>
      </div>
    );
  };

  // Renderizar escenario
  const renderizarEscenario = () => {
    if (dialogoActual && DATOS_PRUEBA.rutas[0]) {
      const ruta = DATOS_PRUEBA.rutas[0];
      const escenario = ruta.escenario;
      
      if (escenario) {
        return (
          <div className="escenario" style={{color: escenario.color_texto, borderColor: escenario.color_texto}}>
            <div className="escenario-titulo">{ruta.nombre}</div>
            <div className="escenario-descripcion">{escenario.descripcion}</div>
            <div className="escenario-ambiente">{escenario.ambiente}</div>
            {escenario.elementos_destacados && (
              <div className="elementos">
                Puedes ver: {escenario.elementos_destacados.join(", ")}
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };
  
  // Obtener clases según layout
  const getTerminalClasses = () => {
    switch(layoutModo) {
      case "imagen-derecha": return "terminal layout-imagen-derecha";
      case "imagen-izquierda": return "terminal layout-imagen-izquierda";
      case "consola-completa": return "terminal layout-completa";
      default: return "terminal";
    }
  };

  return (
    <div className="terminal-container">
      {/* Botones de layout */}
      <div className="layout-controls">
        <button 
          className={layoutModo === 'centrado' ? 'activo' : ''}
          onClick={() => setLayoutModo('centrado')}
        >
          Centrado
        </button>
        <button 
          className={layoutModo === 'imagen-derecha' ? 'activo' : ''}
          onClick={() => setLayoutModo('imagen-derecha')}
        >
          Imagen Derecha
        </button>
        <button 
          className={layoutModo === 'imagen-izquierda' ? 'activo' : ''}
          onClick={() => setLayoutModo('imagen-izquierda')}
        >
          Imagen Izquierda
        </button>
        <button 
          className={layoutModo === 'consola-completa' ? 'activo' : ''}
          onClick={() => setLayoutModo('consola-completa')}
        >
          Consola Completa
        </button>
      </div>
      
      {/* Contenedor principal */}
      <div className="main-container">
        {/* Terminal de texto */}
        <div className={getTerminalClasses()}>
          <div className="terminal-header">
            <div className="terminal-title">Calabozos y Babosos</div>
            <div className="terminal-controls">
              <div className="control rojo"></div>
              <div className="control amarillo"></div>
              <div className="control verde"></div>
            </div>
          </div>
          
          <div
            className="terminal-content"
            ref={terminalRef}
          >
            {/* Título estilo ASCII */}
            {historialMensajes.length === 0 && indiceMensaje === 0 && (
              <pre className="titulo-ascii">
{`
 ██████╗ █████╗ ██╗      █████╗ ██████╗  ██████╗ ███████╗ ██████╗ ███████╗
██╔════╝██╔══██╗██║     ██╔══██╗██╔══██╗██╔═══██╗╚══███╔╝██╔═══██╗██╔════╝
██║     ███████║██║     ███████║██████╔╝██║   ██║  ███╔╝ ██║   ██║███████╗
██║     ██╔══██║██║     ██╔══██║██╔══██╗██║   ██║ ███╔╝  ██║   ██║╚════██║
╚██████╗██║  ██║███████╗██║  ██║██████╔╝╚██████╔╝███████╗╚██████╔╝███████║
 ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝
                                                                                    
 ██╗   ██╗    ██████╗  █████╗ ██████╗  ██████╗ ███████╗ ██████╗ ███████╗          
 ╚██╗ ██╔╝    ██╔══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝██╔═══██╗██╔════╝          
  ╚████╔╝     ██████╔╝███████║██████╔╝██║   ██║███████╗██║   ██║███████╗          
   ╚██╔╝      ██╔══██╗██╔══██║██╔══██╗██║   ██║╚════██║██║   ██║╚════██║          
    ██║       ██████╔╝██║  ██║██████╔╝╚██████╔╝███████║╚██████╔╝███████║          
    ╚═╝       ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝          
`}
              </pre>
            )}
            
            {/* Escenario */}
            {renderizarEscenario()}
            
            {/* Historial y mensaje actual */}
            {renderizarHistorial()}
            {renderizarMensajeActual()}
            
            {/* Opciones */}
            {renderizarOpciones()}
          </div>
        </div>
        
        {/* Imagen ASCII según el layout */}
        {(layoutModo === "imagen-derecha" || layoutModo === "imagen-izquierda") && (
          <div className="imagen-container">
            {renderizarImagenAscii()}
          </div>
        )}
        
        {/* Panel inferior */}
        {layoutModo === "consola-completa" && (
          <div className="panel-inferior">
            {renderizarImagenAscii()}
          </div>
        )}
      </div>
      
      {/* Panel de estadísticas */}
      {renderizarStats()}
      
      {/* Instrucciones */}
      <div className="instrucciones">
        Presiona <span className="tecla">ENTER</span> para continuar. 
        Usa <span className="tecla">1-9</span> para elegir opciones.
        {mostrarCursor && <span className="esperando-input">[Esperando entrada...]</span>}
      </div>
    </div>
  );
};

export default ConsolaBabosos;