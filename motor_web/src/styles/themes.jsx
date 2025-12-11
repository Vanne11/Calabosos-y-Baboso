// styles/themes.jsx
// Temas de color con alto contraste, fondos morado oscuro y estilo Dracula

export const draculaTheme = {
  background: '#1a1625', // Fondo negro con tinte morado
  text: '#ffffff', // Texto blanco puro para máximo contraste
  textSecondary: '#d9baff', // Lila claro
  accent: '#bd93f9', // Acento principal morado
  accentHover: '#ff79c6', // Rosa para hover
  
  terminal: {
    background: '#151320', // Fondo de terminal negro con tinte morado
    border: '#44475a', // Borde Dracula
    text: '#ffffff', // Texto blanco para máximo contraste
    prompt: '#c495ff', // Morado claro para prompt
    command: '#ffffa0', // Amarillo claro más brillante para comandos
    error: '#ff5555', // Rojo para errores
    success: '#50fa7b', // Verde para éxito
    system: '#a5b0e3', // Azul más claro para mensajes del sistema (contraste mejorado)
    warning: '#ffb86c', // Naranja para advertencias
    info: '#8be9fd', // Cyan para info
    accent: '#c495ff',  // Morado principal más claro
    accentDim: '#8f78c6', // Morado medio para contraste
    
    // Colores para diálogos
    dialog: '#ffffff',  // Texto blanco para diálogos
    dialogBackground: '#251d35', // Fondo morado oscuro más rico
    character: '#ff92d0', // Rosa más claro para nombres de personaje
    characterBorder: '#ff5caf', // Rosa más brillante para borde
    option: '#c495ff', // Morado claro para opciones
    
    // Colores para formato Rich
    highlight: 'rgba(189, 147, 249, 0.25)', // Highlight morado translúcido
    
    // Colores para tablas Rich
    tableBorder: '#44475a',
    tableBorderLight: '#383a59',
    tableHeader: '#352a50', // Morado más oscuro pero visible
    tableHeaderText: '#ffffff', // Texto blanco para encabezados
    tableRowEven: '#1a1625',
    tableRowOdd: '#211a2e',
  },
  
  scrollbar: {
    track: '#1a1625',
    thumb: '#44475a',
    hover: '#6272a4',
  },
  
  button: {
    background: '#44475a',
    text: '#ffffff',
    hoverBackground: '#6272a4',
    activeBackground: '#bd93f9',
  },
  
  widgets: {
    background: '#251d35',
    border: '#44475a',
  }
};

// Tema alternativo con más énfasis en morados y lilas
export const lilacTheme = {
  ...draculaTheme,
  background: '#211134', // Fondo morado oscuro
  text: '#ffffff',
  textSecondary: '#e0c3ff', // Lila más claro para mejor lectura
  accent: '#c67dff', // Lila/morado vibrante más claro
  accentHover: '#d9a3ff', // Lila claro para hover
  
  terminal: {
    ...draculaTheme.terminal,
    background: '#1a0e29', // Fondo terminal morado oscuro
    border: '#4a3664',
    prompt: '#c67dff', // Prompt lila más brillante
    system: '#b3a5cc', // Mensajes sistema en lila más claro
    accent: '#c67dff',  // Lila principal
    accentDim: '#9167d8', // Lila medio para mejor contraste
    dialogBackground: '#301d47', // Morado oscuro con mayor distinción
    character: '#ff92d0',
    characterBorder: '#ff5caf',
    option: '#c67dff',
    tableBorder: '#4a3664',
    tableBorderLight: '#403054',
    tableHeader: '#3c2760',
    tableHeaderText: '#ffffff',
  },
  
  scrollbar: {
    track: '#211134',
    thumb: '#4a3664',
    hover: '#7a4eb5',
  },
  
  button: {
    ...draculaTheme.button,
    background: '#4a3664',
    hoverBackground: '#7a4eb5',
    activeBackground: '#c67dff',
  },
  
  widgets: {
    background: '#301d47',
    border: '#4a3664',
  }
};

// Para compatibilidad con el código existente
export const darkTheme = lilacTheme; // Cambiado el tema por defecto a lila
export const slimeTheme = draculaTheme;