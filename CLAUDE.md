# Calabosos y Babosos - Guía Completa para Claude

## Descripción General

**Calabosos y Babosos** es un juego de rol narrativo interactivo basado en texto con mecánicas de D&D. El proyecto combina:

- Narrativa ramificada con múltiples caminos y decisiones
- Sistema de tiradas de dados (D20) con modificadores de estadísticas
- Humor satírico con un narrador que rompe la cuarta pared
- Tema fantástico centrado en babosas como antagonistas principales
- Motor terminal interactivo basado en React para navegador
- Sistema modular de carga de juegos mediante JSON

**Objetivo del juego**: Derrotar al Rey Baboso en el "Abismo de las Babosas" en el reino de Viscaria, controlando al protagonista "BOB".

---

## Estructura Completa del Proyecto

```
Calabosos-y-Baboso/
├── back/                           # Backend y versión terminal (Python)
│   ├── main.py                     # Motor del juego terminal (908 líneas)
│   ├── main2.py                    # Versión alternativa (642 líneas)
│   ├── imagen_consola_hd.py        # Renderizador ASCII/HD (322 líneas)
│   ├── image_view.py               # Visor de imágenes
│   ├── imagenes/                   # Assets PNG (17 imágenes)
│   ├── dialogos/                   # Datos JSON del juego original
│   │   ├── rutas_completo.json     # Rutas del juego (8977 bytes)
│   │   ├── historia_completo.json  # Diálogos principales (24436 bytes)
│   │   ├── combate_completo.json   # Sistema de combate (28956 bytes)
│   │   ├── relleno_completo.json   # Fragmentos reutilizables (10488 bytes)
│   │   ├── introduccion.json
│   │   ├── dialogos/               # Diálogos específicos
│   │   ├── tiradas/                # Definiciones de tiradas D20
│   │   │   ├── ciudad.json
│   │   │   └── combate.json
│   │   └── relleno/                # Fragmentos de texto
│   ├── historia/                   # Documentación narrativa (5 archivos .md)
│   │   ├── md-introduccion.md
│   │   ├── md-tienda-callejon.md
│   │   ├── md-conseguir-dinero.md
│   │   ├── md-abismo-babosas.md
│   │   └── md-confrontacion-final.md
│   ├── ideas/                      # Notas de diseño
│   │   ├── Ideas.txt
│   │   └── Historia Juego Rol.txt
│   ├── estructura-carpetas.md      # Documentación de estructura
│   ├── md-personajes-escenarios.md # Catálogo de personajes
│   └── web_test/                   # Versiones experimentales web
│       ├── calabozos-y-babosos/
│       ├── calabozos-y-babosos-v2/
│       ├── calabozos-y-babosos-sin-imagenes/
│       └── calabozos-babosos-simple/
│
├── datos/                          # Datos compilados (backups)
│   ├── combate_completo.json
│   ├── historia_completo.json
│   ├── relleno_completo.json
│   └── rutas_completo.json
│
├── motor_web/                      # MOTOR WEB OFICIAL (React + Vite)
│   ├── package.json                # Dependencias (React 19.0.0, Vite 6.2.0)
│   ├── vite.config.js              # Config de Vite (base: '/cyb/')
│   ├── eslint.config.js            # Configuración ESLint
│   ├── index.html                  # HTML de entrada
│   ├── README.md                   # Documentación técnica extensa (150+ líneas)
│   ├── favicon.ico / favicon.png   # Icons del proyecto
│   ├── node_modules/               # Dependencias instaladas
│   ├── dist/                       # Build compilado
│   │
│   ├── public/                     # Assets estáticos públicos
│   │   ├── games/                  # Juegos disponibles
│   │   │   ├── demo/               # Juego demo completo
│   │   │   │   ├── info.json       # Metadatos del juego
│   │   │   │   ├── routes.json     # 230 líneas - Sistema de rutas
│   │   │   │   ├── dialogs.json    # 577 líneas - Diálogos
│   │   │   │   ├── scenarios.json  # 59 líneas - Escenarios
│   │   │   │   ├── widgets.json    # 322 líneas - Widgets interactivos
│   │   │   │   ├── characters.json # 58 líneas - Personajes
│   │   │   │   ├── conditions.json # 11 líneas - Condiciones
│   │   │   │   ├── time.json       # 8 líneas - Sistema temporal
│   │   │   │   └── README.md
│   │   │   └── Calabosos y Babosos/
│   │   │       └── info.json
│   │   ├── audio/
│   │   │   └── about_theme.mp3
│   │   └── images/
│   │       ├── logo.png
│   │       └── about/
│   │           ├── about1.png
│   │           └── about2.png
│   │
│   └── src/                        # Código fuente React (~4248 líneas)
│       ├── main.jsx                # Punto de entrada React
│       ├── App.jsx                 # Componente raíz (759 líneas)
│       ├── App.css
│       ├── index.css
│       │
│       ├── components/             # Componentes React
│       │   ├── Terminal/           # Sistema terminal
│       │   │   ├── Terminal.jsx    # Terminal principal (19KB)
│       │   │   ├── TerminalInput.jsx
│       │   │   └── TerminalOutput.jsx
│       │   ├── GameRenderer/       # Renderizadores de juego
│       │   │   ├── DialogRenderer.jsx
│       │   │   ├── GameContainer.jsx
│       │   │   └── ScenarioRenderer.jsx
│       │   ├── Widgets/            # Componentes interactivos
│       │   │   └── ButtonWidget.jsx
│       │   └── UI/                 # Componentes UI (vacío)
│       │
│       ├── engine/                 # Motor del juego (lógica principal)
│       │   ├── gameState.jsx       # Estado del juego (5520 bytes)
│       │   ├── gameLoader.jsx      # Cargador de juegos (6101 bytes)
│       │   ├── commandHandler.jsx  # Procesador de comandos (23320 bytes)
│       │   ├── routeResolver.jsx   # Resolvedor de rutas (12623 bytes)
│       │   └── debugSystem.jsx     # Sistema de debug (14592 bytes)
│       │
│       ├── hooks/                  # Custom React hooks
│       │   ├── useGameState.jsx
│       │   └── useTerminal.jsx
│       │
│       ├── styles/                 # Estilos y temas
│       │   ├── globalStyles.jsx    # Estilos globales
│       │   └── themes.jsx          # Temas: dracula y lilac
│       │
│       ├── utils/                  # Utilidades
│       │   ├── delay.js
│       │   └── waitForEnter.js
│       │
│       ├── lib/                    # Librerías (vacío)
│       └── assets/                 # Assets (vacío)
│
├── .git/                           # Repositorio Git
├── .gitignore
├── .gitattributes
├── .claude/                        # Configuración de Claude
└── CLAUDE.md                       # Este archivo
```

---

## Stack Tecnológico

### Versión Terminal (Python - Legacy)
- **Python 3.x**
  - `rich`: Interfaz terminal mejorada (paneles, colores, tablas)
  - `PIL/Pillow`: Procesamiento de imágenes para renderizado ASCII/HD
  - `json`: Manejo de datos estructurados
  - `random`: Generador de tiradas de dados

### Versión Web (Producción - motor_web/)

**Frontend (package.json v0.0.0):**

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-terminal-ui": "^1.4.0",
    "styled-components": "^6.1.17",
    "file-saver": "^2.0.5",
    "jszip": "^3.10.1",
    "localforage": "^1.10.0",
    "vite-plugin-glob": "^0.3.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.2.0",
    "eslint": "^9.21.0",
    "@eslint/js": "^9.21.0",
    "eslint-plugin-react-hooks": "^5.1.0",
    "eslint-plugin-react-refresh": "^0.4.19"
  }
}
```

**Herramientas:**
- Vite 6.2.0 (bundler y dev server)
- ESLint 9.21.0 (linter)
- Styled-components 6.1.17 (CSS-in-JS)

---

## Arquitectura del Motor Web

### Componente Raíz (App.jsx - 759 líneas)

**Funcionalidades principales:**
1. **Sistema de Login**: Usuario/contraseña con validación
2. **Secuencia de Boot**: Animación estilo Linux con 20+ mensajes
3. **Barra de Estado**: Muestra estadísticas del jugador
4. **Área de Imagen**: Renderizado de escenarios/imágenes
5. **Terminal Interactiva**: Componente principal de interacción
6. **Control de Velocidad**: Ajuste de velocidad de texto (0.5x, 1x, 2x, 3x)
7. **Control de Volumen**: Ajuste de volumen (0-100%)
8. **Advertencia de Móvil**: Detecta dispositivos móviles

### Sistema Terminal (components/Terminal/)

**Terminal.jsx (19KB)**
- Historial de mensajes con colores Rich-style
- Input con soporte de contraseña (type='password')
- Botones de opciones interactivos
- Scroll automático
- Prompt dinámico
- Animación de escritura letra-por-letra

**TerminalInput.jsx**
- Soporte para input de texto
- Soporte para input de contraseña
- Manejo de eventos de teclado (Tab, Enter)

**TerminalOutput.jsx**
- Renderizado de salida con colores
- Formato estilo terminal
- Soporte para múltiples tipos de mensajes

### Motor del Juego (engine/)

#### gameLoader.jsx (6101 bytes)
**Responsabilidades:**
- Carga de juegos desde `/public/games/{name}/`
- Carga de 7 archivos JSON requeridos:
  - `info.json` - Metadatos
  - `routes.json` - Sistema de rutas
  - `dialogs.json` - Diálogos
  - `scenarios.json` - Escenarios
  - `widgets.json` - Widgets interactivos
  - `characters.json` - Personajes
  - `conditions.json` - Condiciones
  - `time.json` - Sistema temporal
- Validación de estructura JSON
- Manejo de errores de carga

#### gameState.jsx (5520 bytes)
**Estado del juego:**
```javascript
{
  stats: {},              // Estadísticas numéricas
  inventory: [],          // Items en inventario
  flags: {},              // Banderas booleanas
  time: {                 // Sistema temporal
    phase: "morning",
    actions: 0,
    cycles: 0
  },
  visitedRoutes: [],      // Rutas visitadas
  seenDialogs: [],        // Diálogos vistos
  currentRoute: null,     // Ruta actual
  characters: {},         // Estado de NPCs
  game: {}                // Metadatos del juego
}
```

#### commandHandler.jsx (23320 bytes)
**Comandos disponibles:**
- `help` - Lista de comandos
- `clear` - Limpia la terminal
- `version` - Muestra versión del motor (v0.1.0)
- `about` - Información con música
- `run [game]` - Ejecuta un juego
- `list` - Lista juegos disponibles
- `debug [option]` - Sistema de depuración
- `image` - Demo: muestra imagen
- `reset-image` - Demo: oculta imagen
- `quit` - Cierra sesión

#### routeResolver.jsx (12623 bytes)
**Procesamiento de rutas:**
- Evaluación de condiciones
- Ejecución secuencial de acciones
- Resolución de escenarios, diálogos y widgets
- Manejo de rutas alternativas
- Aplicación de modificadores de estado

#### debugSystem.jsx (14592 bytes)
**Sistema de depuración:**
- Categorías: INFO, ERROR, WARNING, DEBUG, EVENT, TIMER
- Salida a terminal integrada
- Activable mediante comando `debug`
- Seguimiento de eventos del motor

### Renderizadores de Juego (components/GameRenderer/)

**DialogRenderer.jsx**
- Renderiza diálogos de personajes
- Soporte para imágenes de avatares
- Animación de texto
- Evaluación de condiciones en líneas

**ScenarioRenderer.jsx**
- Muestra descripciones de escenarios
- Soporte para imágenes
- Variantes según hora del día
- Aplicación de condiciones

**GameContainer.jsx**
- Contenedor principal del juego
- Gestión de estado global
- Coordinación de componentes

### Widgets (components/Widgets/)

**ButtonWidget.jsx**
- Botones interactivos
- Navegación entre rutas
- Aplicación de efectos
- Soporte para imágenes

### Hooks Personalizados (hooks/)

**useGameState.jsx**
```javascript
{
  state,                    // Estado completo del juego
  updateStat,               // Actualiza una estadística
  toggleFlag,               // Activa/desactiva flag
  addInventoryItem,         // Añade item al inventario
  removeInventoryItem,      // Remueve item
  updateCharacter,          // Actualiza estado de NPC
  visitRoute,               // Marca ruta como visitada
  seeDialog                 // Marca diálogo como visto
}
```

**useTerminal.jsx**
```javascript
{
  history,                  // Historial de mensajes
  command,                  // Comando actual
  setCommand,               // Actualiza comando
  submitCommand,            // Envía comando
  clearHistory,             // Limpia historial
  setPrompt,                // Cambia el prompt
  addAutoComplete           // Añade autocompletado
}
```

### Temas y Estilos (styles/)

**themes.jsx - Dos temas disponibles:**

1. **draculaTheme** - Inspirado en Dracula
2. **lilacTheme** (por defecto) - Tema morado/lila

**Paleta de colores (lilacTheme):**
```javascript
{
  background: '#1a0e29',
  backgroundSecondary: '#1a1625',
  text: '#ffffff',
  textSecondary: '#c7b8ea',
  primary: '#c67dff',
  secondary: '#9d4edd',
  accent: '#bd93f9',
  success: '#50fa7b',
  error: '#ff5555',
  warning: '#f1fa8c'
}
```

---

## Sistema de Datos JSON del Motor Web

### Estructura de un Juego

Ubicación: `/public/games/{nombre_juego}/`

**Archivos requeridos (7):**
1. `info.json` - Metadatos
2. `routes.json` - Rutas
3. `dialogs.json` - Diálogos
4. `scenarios.json` - Escenarios
5. `widgets.json` - Widgets
6. `characters.json` - Personajes
7. `conditions.json` - Condiciones
8. `time.json` - Sistema temporal (opcional)

### info.json
```json
{
  "name": "Calabosos y Babosos - Demo",
  "description": "Una aventura viscosa",
  "author": "Narrador Malévolo",
  "version": "2.0.0"
}
```

### routes.json
```json
{
  "routes": [
    {
      "id": "plaza_principal",
      "condition": "default",
      "actions": [
        "scenario_plaza",
        "dialog_plaza_narrador",
        "widget_opciones_plaza"
      ]
    }
  ]
}
```

**Estructura de ruta:**
- `id`: Identificador único (snake_case)
- `condition`: ID de condición a evaluar
- `actions`: Array ordenado de acciones (escenarios, diálogos, widgets)

### scenarios.json
```json
{
  "scenarios": [
    {
      "id": "scenario_plaza",
      "image": "/images/plaza.png",
      "variants": {
        "morning": "La plaza principal al amanecer...",
        "afternoon": "El sol de la tarde ilumina...",
        "night": "La oscuridad envuelve la plaza..."
      },
      "condition": "default"
    }
  ]
}
```

**Estructura de escenario:**
- `id`: Identificador único
- `image`: Path a imagen (opcional)
- `variants`: Descripciones por fase del día
- `condition`: Condición para mostrar

### dialogs.json
```json
{
  "dialogs": [
    {
      "id": "dialog_narrador_intro",
      "character": "narrator",
      "image": "/images/narrator.png",
      "condition": "default",
      "content": [
        "Bienvenido a Viscaria, tierra de babosas.",
        {
          "text": "Tu percepción es alta.",
          "condition": "perception_high"
        }
      ]
    }
  ]
}
```

**Estructura de diálogo:**
- `id`: Identificador único
- `character`: ID del personaje que habla
- `image`: Avatar (opcional)
- `condition`: Condición para mostrar todo el diálogo
- `content`: Array de líneas (strings o objetos condicionales)

### widgets.json
```json
{
  "widgets": [
    {
      "id": "widget_opciones_plaza",
      "type": "button",
      "description": "Opciones disponibles",
      "condition": "default",
      "config": {
        "buttons": [
          {
            "text": "Ir a la tienda",
            "destination": "tienda",
            "modifiers": {
              "stats": {"curiosity": 5}
            }
          }
        ]
      }
    },
    {
      "id": "widget_tirada_robo",
      "type": "dice",
      "description": "Tirada de Reputación",
      "config": {
        "faces": 20,
        "modifier": "reputation",
        "divider": 10,
        "difficulty": 13
      },
      "results": {
        "success": {
          "text": "¡Has robado exitosamente!",
          "modifiers": {
            "stats": {"reputation": -5},
            "inventory": ["moneda_robada"]
          },
          "destination": "escape"
        },
        "failure": {
          "text": "Te han atrapado.",
          "modifiers": {
            "stats": {"reputation": -10}
          },
          "destination": "prision"
        }
      }
    }
  ]
}
```

**Tipos de widgets:**
- `button` - Botones de navegación
- `dice` - Tiradas de dados D20
- `selection` - Selección múltiple
- `stats` - Mostrar estadísticas
- `screen` - Pantallas especiales

### conditions.json
```json
{
  "conditions": [
    {
      "id": "default",
      "description": "Condición por defecto",
      "criteria": {
        "always": true
      }
    },
    {
      "id": "has_key",
      "description": "El jugador tiene la llave",
      "criteria": {
        "inventory": ["master_key"],
        "flags": {"door_found": true}
      },
      "failure": {
        "message": "Necesitas una llave.",
        "alternative_route": "search_key"
      }
    },
    {
      "id": "perception_high",
      "criteria": {
        "stats": {"perception": ">=50"}
      }
    }
  ]
}
```

**Criterios disponibles:**
- `always`: true/false
- `stats`: Comparaciones numéricas (>, <, >=, <=, ==)
- `flags`: Valores booleanos
- `inventory`: Items requeridos
- `visited_routes`: Rutas visitadas
- `unvisited_routes`: Rutas NO visitadas
- `seen_dialogs`: Diálogos vistos
- `characters`: Estado de NPCs
- `time`: Condiciones temporales

### characters.json
```json
{
  "characters": [
    {
      "id": "nerly",
      "name": "Nerly la Babosa",
      "description": "Una babosa comerciante",
      "image": "/images/nerly.png",
      "initial_state": {
        "alive": true,
        "friendship": 30,
        "location": "tienda"
      }
    }
  ]
}
```

### time.json
```json
{
  "cycle": {
    "duration": 5,
    "phases": ["morning", "afternoon", "night"],
    "initial": "morning"
  },
  "events": [
    {
      "id": "hunger_increase",
      "frequency": "each_phase",
      "action": {
        "message": "Tu estómago gruñe.",
        "modifiers": {
          "stats": {"hunger": 10}
        }
      }
    }
  ]
}
```

---

## Sistema de Estadísticas (Versión Python Original)

### Stats del Jugador

- **Ganas de vivir**: 100 inicial (HP)
- **Hambre intensa**: 0 inicial
- **Pipí acumulado**: 0 inicial
- **Miedo**: 0 inicial
- **Reputación**: 50 inicial

### Mecánica de Tiradas (D20)

1. Se lanza un D20 (dado de 20 caras)
2. Se aplican modificadores basados en la stat principal:
   - Stat > 70: +5
   - Stat 50-70: 0
   - Stat < 50: -5
3. Se compara con la dificultad
4. El resultado determina efectos y secuencia

### Rangos de Resultado

- `1`: Fallo crítico
- `2-5`: Fallo grave
- `6-10`: Fallo leve
- `11-15`: Éxito leve
- `16-19`: Éxito notable
- `20`: Éxito crítico

---

## Personajes Principales

### Narrador
- Voz omnisciente y sarcástica
- Rompe la cuarta pared constantemente
- Tono condescendiente con el protagonista
- Dirige la historia con comentarios irónicos

### Protagonista ("BOB")
- Nombre impuesto por el Narrador
- Aventurero involuntario
- Estadísticas modificables
- Inventario dinámico

### NPCs Importantes
- **Nerly**: Comerciante de la tienda
- **Mago de las Calles**: Vendedor de objetos mágicos
- **Ian**: Personaje secundario
- **Rey Baboso**: Antagonista principal

---

## Convenciones de Código

### React (motor_web/)
- Componentes funcionales con hooks
- styled-components para todos los estilos
- localforage para persistencia de datos
- PropTypes para validación (opcional)
- ESLint para linting
- Vite para bundling

### Python (back/ - Legacy)
- Usar `rich` para toda la salida formateada
- Funciones modulares para cada mecánica
- Diccionarios para estado del juego
- JSON para todos los datos narrativos

### JSON (Datos del Juego)
- UTF-8 para caracteres especiales
- Indentación de 2 espacios
- IDs descriptivos en snake_case
- Comentarios en campos "description"
- Validación estricta en el cargador

---

## Comandos de Desarrollo

### Motor Web (Producción)
```bash
cd motor_web

# Desarrollo
npm install          # Instalar dependencias (primera vez)
npm run dev          # Servidor de desarrollo (http://localhost:5173)
npm run build        # Compilar para producción
npm run preview      # Preview de build
npm run lint         # ESLint
```

### Versión Terminal (Legacy)
```bash
cd back

# Ejecutar
python main.py       # Versión principal (908 líneas)
python main2.py      # Versión alternativa (642 líneas)

# Renderizado de imágenes
python imagen_consola_hd.py
python image_view.py
```

---

## Flujos de Trabajo

### Crear un Nuevo Juego

1. **Crear estructura base:**
```bash
mkdir -p motor_web/public/games/mi_juego/images
cd motor_web/public/games/mi_juego
```

2. **Crear archivos JSON requeridos:**
   - `info.json` - Metadatos
   - `routes.json` - Al menos una ruta "start"
   - `dialogs.json` - Al menos un diálogo
   - `scenarios.json` - Al menos un escenario
   - `widgets.json` - Al menos un widget
   - `characters.json` - Array vacío si no hay NPCs
   - `conditions.json` - Al menos condición "default"
   - `time.json` - Ciclo básico (opcional)

3. **Añadir imágenes:**
```bash
# Copiar imágenes a motor_web/public/games/mi_juego/images/
```

4. **Probar el juego:**
```bash
cd motor_web
npm run dev
# En la terminal del motor: run mi_juego
```

### Añadir Nueva Ruta (Motor Web)

1. Editar `routes.json`:
```json
{
  "id": "nueva_ruta",
  "condition": "default",
  "actions": ["escenario_1", "dialogo_1", "widget_1"]
}
```

2. Crear escenario asociado en `scenarios.json`
3. Crear diálogo en `dialogs.json`
4. Crear widget en `widgets.json`
5. Añadir condición en `conditions.json` si es necesaria
6. Vincular desde ruta anterior mediante widget

### Añadir Tirada de Dados

En `widgets.json`:
```json
{
  "id": "tirada_ejemplo",
  "type": "dice",
  "description": "Tirada de Destreza",
  "config": {
    "faces": 20,
    "modifier": "dexterity",
    "divider": 10,
    "difficulty": 15
  },
  "results": {
    "success": {
      "text": "¡Éxito!",
      "modifiers": {
        "stats": {"confidence": 10},
        "flags": {"passed_challenge": true}
      },
      "destination": "ruta_exito"
    },
    "failure": {
      "text": "Has fallado.",
      "modifiers": {
        "stats": {"confidence": -5}
      },
      "destination": "ruta_fallo"
    }
  }
}
```

### Modificar Estadísticas

En cualquier widget, resultado de tirada o acción:
```json
{
  "modifiers": {
    "stats": {
      "will_to_live": 10,
      "hunger": -5,
      "reputation": 15
    },
    "flags": {
      "door_opened": true,
      "nerly_met": true
    },
    "inventory": ["sword", "key"]
  }
}
```

---

## Ramas Git

- **main**: Rama principal estable
- **cyb-web**: Desarrollo del modo web (rama actual)

---

## Archivos de Documentación

### Técnica
- `motor_web/README.md`: Documentación completa del motor (150+ líneas)
- `back/estructura-carpetas.md`: Estructura de datos JSON legacy
- `back/md-personajes-escenarios.md`: Catálogo de personajes y escenarios
- `CLAUDE.md`: Este archivo (guía para Claude)

### Narrativa (back/historia/)
- `md-introduccion.md`: Prólogo y Plaza Principal
- `md-tienda-callejon.md`: Escena de comercio
- `md-conseguir-dinero.md`: Búsqueda de moneda
- `md-abismo-babosas.md`: Dungeon principal (22KB)
- `md-confrontacion-final.md`: Enfrentamiento final (28KB)

### Notas (back/ideas/)
- `Ideas.txt`: Mecánicas y conceptos
- `Historia Juego Rol.txt`: Concepto general (23KB)

---

## Características Destacadas del Motor Web

### 1. Sistema de Login Interactivo
- Usuario y contraseña configurables
- Comentarios sarcásticos del narrador
- Validación en tiempo real

### 2. Secuencia de Boot Estilo Linux
- 21 mensajes de inicio animados
- Colores RGB dinámicos
- Hardware "baboso" ficticio
- Animación de fade out

### 3. Sistema de Depuración Integrado
- Activable con comando `debug`
- Categorías: INFO, ERROR, WARNING, DEBUG, EVENT, TIMER
- Salida a terminal en tiempo real
- Seguimiento de eventos del motor

### 4. Control de Velocidad y Volumen
- Selector de velocidad: 0.5x, 1x, 2x, 3x
- Control de volumen: 0-100%
- Persistencia en localStorage

### 5. Advertencia de Dispositivo Móvil
- Detección automática
- Mensaje de compatibilidad limitada

### 6. Tema Visual Personalizado
- Tema oscuro/lila por defecto
- Colores de alto contraste
- Sistema de temas global con ThemeProvider
- Fácilmente extensible

### 7. Preload de Imágenes
- Precarga de assets antes de uso
- Promise-based para mejor control
- Mejora experiencia de usuario

### 8. Persistencia con LocalForage
- Guardado automático de progreso
- Soporte para múltiples partidas
- Datos indexados para mejor rendimiento

---

## Estadísticas del Proyecto

### Código Python (back/)
- `main.py`: 908 líneas
- `main2.py`: 642 líneas
- `imagen_consola_hd.py`: 322 líneas
- **Total**: ~1872 líneas

### Código React/JavaScript (motor_web/src/)
- **Total**: ~4248 líneas
- `App.jsx`: 759 líneas
- `Terminal.jsx`: ~620 líneas
- `commandHandler.jsx`: ~730 líneas
- `routeResolver.jsx`: ~400 líneas
- `debugSystem.jsx`: ~460 líneas
- `gameLoader.jsx`: ~190 líneas
- `gameState.jsx`: ~175 líneas

### Datos JSON (motor_web/public/games/demo/)
- **Total**: 1271 líneas
- `dialogs.json`: 577 líneas
- `widgets.json`: 322 líneas
- `routes.json`: 230 líneas
- `scenarios.json`: 59 líneas
- `characters.json`: 58 líneas
- `conditions.json`: 11 líneas
- `time.json`: 8 líneas
- `info.json`: 6 líneas

---

## Notas Importantes

1. **Separación de Datos y Lógica**: Toda la narrativa está en JSON, el código solo procesa
2. **Modularidad**: Juegos completamente independientes y cargables dinámicamente
3. **Flexibilidad**: Sistema de efectos permite modificar cualquier aspecto del estado
4. **Persistencia**: LocalForage para guardado de partidas en navegador
5. **Extensibilidad**: Fácil añadir nuevos tipos de widgets y comandos
6. **Humor**: El tono satírico es fundamental, mantener en nuevos contenidos
7. **Condiciones**: Sistema robusto de evaluación de condiciones complejas
8. **Acciones Secuenciales**: Las rutas ejecutan acciones en orden estricto

---

## Estado Actual del Proyecto

- **Rama activa**: `cyb-web`
- **Enfoque**: Motor web en producción con React + Vite
- **Versión motor**: 0.0.0 (pre-release)
- **React**: 19.0.0
- **Vite**: 6.2.0
- **Versión terminal**: Funcional (legacy en back/)
- **Versiones experimentales**: 4 versiones en back/web_test/
- **Juego demo**: Completo y funcional en motor_web/public/games/demo/
- **Última build**: Abril 2025 (motor_web/dist/)

---

## Próximos Pasos Potenciales

- Completar todas las rutas narrativas del juego principal
- Migrar contenido de back/dialogos/ a formato motor web
- Implementar sistema de audio completo
- Añadir más tipos de widgets (combate, inventario visual, etc.)
- Sistema de logros
- Múltiples finales
- Exportación/importación de partidas
- Modo multijugador (opcional)
- Editor visual de juegos
- Marketplace de juegos de la comunidad

---

## Solución de Problemas Comunes

### El servidor de desarrollo no inicia
```bash
cd motor_web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Los archivos JSON no se cargan
- Verificar que estén en `/public/games/{nombre}/`
- Validar sintaxis JSON con JSONLint
- Revisar consola del navegador para errores

### Las imágenes no aparecen
- Paths deben ser relativos a `/public/games/{nombre}/`
- Usar formato: `/images/archivo.png`
- Verificar que las imágenes existan

### Error al compilar
```bash
cd motor_web
npm run lint  # Ver errores de ESLint
npm run build # Ver errores de compilación
```

### El juego se congela
- Verificar condiciones circulares en routes.json
- Revisar referencias a IDs inexistentes
- Usar comando `debug` en el motor para ver estado

---

**Última actualización**: 2025-12-11
**Rama activa**: cyb-web
**Versión motor**: 0.0.0
**Autor**: Nicolás y Vanessa
**Estado**: En desarrollo activo
