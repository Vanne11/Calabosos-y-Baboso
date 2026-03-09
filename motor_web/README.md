# 🐌 Motor Baboso: Calabosos y Babosos™

**La plataforma terminal viscosa para aventuras textuales con imágenes que el mundo no sabía que necesitaba.**

¡Bienvenido al Motor Baboso! Una plataforma de terminal interactiva impulsada por React + Vite, diseñada para cargar y ejecutar juegos textuales con imágenes. Con más ego que lógica, el sistema está optimizado para crear y disfrutar aventuras narrativas grotescas, gloriosas y absolutamente jugables desde el navegador.

---

## 📦 Instalación pegajosa

```bash
# Crear proyecto base con Vite, porque reinventar la rueda es para gente sin imaginación
npm create vite@latest motor-baboso --template react

# Arrastrarte al directorio como la babosa que eres
cd motor-baboso
npm install

# Dependencias adicionales porque nunca tenemos suficientes node_modules
npm install react-terminal-ui styled-components jszip file-saver localforage
```

Luego clona este repo y reemplaza el contenido de `/src` con nuestros archivos babosos. Y asegúrate de que tus babosas estén frescas y bien alimentadas con hojas de lechuga digital.

---

## 🌐 Estructura del proyecto

```
src/
├── components/           # Componentes React, o como me gusta llamarlos: "pedazos de interfaz"
│   ├── Terminal/         # Terminal interactiva para que finjas ser un hacker
│   ├── GameRenderer/     # Renderizadores que transforman JSON aburrido en experiencias traumáticas
│   ├── Widgets/          # Componentes interactivos para hacer que creas que tienes control
│   └── UI/               # Elementos de interfaz que intentan ser bonitos y fallan gloriosamente
│
├── engine/               # El "cerebro" del sistema, si las babosas tuvieran cerebro
│   ├── gameLoader.js     # Carga juegos y juzga tus decisiones de diseño
│   ├── gameState.js      # Mantiene tu traumático progreso para futuras sesiones
│   ├── commandHandler.js # Procesa comandos y se burla de tus errores tipográficos
│   ├── routeResolver.js  # Decide a dónde ir, porque tú claramente no puedes
│   └── timeSystem.js     # Sistema temporal que mata tus esperanzas lentamente
│
├── hooks/                # Ganchos de React, no confundir con los ganchos que usa el narrador
│   ├── useGameState.js   # Para acceder al estado sin volverse loco (más)
│   └── useTerminal.js    # Hook que gestiona la terminal cuando tú no puedes
│
├── lib/                  # Utilidades y helpers, también conocidos como "parches de emergencia"
│   ├── fileUtils.js      # Maneja archivos sin destruir el navegador, casi siempre
│   ├── jsonValidator.js  # Juzga tus JSON como el narrador juzga tus decisiones
│   └── textEffects.js    # Efectos de texto para maximizar trauma visual
│
├── data/                 # Datos y ejemplos para que no empieces desde cero (agradécelo)
│   └── games/            # Carpetas con juegos que son mejores que los que tú harás
│       ├── calabosos/    # El brillante ejemplo "Calabosos y Babosos"
│       └── template/     # Plantilla para nuevos juegos (spoiler: la arruinarás)
│
├── styles/               # Estilos, porque hasta las babosas pueden verse bien
│   ├── globalStyles.js   # Estilos globales que todo contaminan
│   ├── themes.js         # Temas que van de "oscuro" a "más oscuro"
│   └── animations.js     # Animaciones para distraerte de la falta de contenido
│
├── App.jsx               # El portal hacia el abismo de tu autoestima
├── main.jsx              # El arranque infernal que nadie lee
└── vite-env.d.ts         # Definiciones de tipo para aparentar profesionalismo
```

---

## 🧠 Estructura de datos del motor

El Motor Baboso carga juegos definidos mediante archivos JSON estructurados, porque archivos de texto plano serían demasiado sencillos y no queremos eso, ¿verdad?

### `routes.json`
```json
{
  "routes": [
    {
      "id": "start",
      "condition": "default",
      "actions": [
        "kitchen",
        "intro", 
        "widget_start",
        "show_stats"
      ]
    },
    {
      "id": "partial_victory",
      "condition": "has_key",
      "actions": [
        "garden", 
        "escape", 
        "widget_celebration"
      ]
    },
    {
      "id": "continue_kitchen",
      "condition": "hunger_level_high",
      "actions": [
        "hunger_dialog",
        "widget_eat",
        "update_stats"
      ]
    }
  ]
}
```
Cada ruta tiene:
- `id`: Identificador único, porque ponerle nombres a las cosas es lo único que te dejamos controlar.
- `condicion`: ID de la condición a revisar en condiciones.json (si existe).
- `acciones`: Lista ORDENADA de elementos a ejecutar secuencialmente.
  - Las acciones pueden ser escenarios, diálogos, widgets, etc.
  - Si una acción no cambia el escenario, se mantiene el último mostrado.
  - No hay límite de acciones, puedes poner 100 si quieres torturar al jugador.

### `scenarios.json`
```json
{
  "scenarios": [
    {
      "id": "kitchen",
      "image": "/images/scenarios/kitchen.png",
      "variants": {
        "morning": "Una cocina en ruinas. Todo huele a baba.",
        "afternoon": "La luz entra y revela una escena viscosa.",
        "night": "La oscuridad lo cubre todo, excepto la baba brillante."
      },
      "condition": "first_visit_kitchen"
    }
  ]
}
```
Cada escenario incluye:
- `id`: Identificador único, por si acaso decides crear más de un escenario (ambicioso, ¿eh?).
- `imagen`: Path relativo a la imagen (opcional, como tu compromiso con este proyecto).
- `variantes`: Descripciones según hora del día, porque hasta las babosas merecen ciclos circadianos.
- `condicion`: ID opcional de condición para mostrar el escenario (si no la cumple, no se muestra).

### `dialogs.json`
```json
{
  "dialogs": [
    {
      "id": "intro",
      "character": "narrator",
      "image": "/images/dialogs/narrator.png",
      "condition": "first_visit",
      "content": [
        "Despiertas en una cocina. Huele a baba.",
        "Hay una tostadora mirándote fijamente.",
        {
          "text": "La tostadora parece querer decirte algo...",
          "condition": "perception_high"
        },
        {
          "text": "Pero eres demasiado torpe para notarlo.",
          "condition": "perception_low"
        }
      ]
    }
  ]
}
```
Componentes de un diálogo:
- `id`: Identificador único, no seas creativo aquí.
- `personaje`: Quién habla (narrador, NPC, mueble poseído, etc.).
- `imagen`: Avatar del hablante (opcional, algunos personajes son demasiado horribles para mostrarlos).
- `condicion`: ID de condición que determina si todo el diálogo se muestra.
- `contenido`: Array de líneas de texto o objetos condicionales:
  - Strings simples se muestran siempre.
  - Objetos con {texto, condicion} se muestran solo si la condición se cumple.

### `widgets.json`
```json
{
  "widgets": [
    {
      "id": "widget_start",
      "type": "dice",
      "description": "Tira un dado de 20 para determinar tu nivel de patetismo inicial.",
      "condition": "first_roll",
      "config": {
        "faces": 20,
        "modifier": "will_to_live",
        "divider": 10,
        "difficulty": 10
      },
      "image": "/images/widgets/dice.png",
      "results": {
        "success": {
          "text": "¡Has tenido éxito! Qué extraña sensación, ¿verdad?",
          "modifiers": {
            "stats": {"will_to_live": 5},
            "flags": {"has_key": true}
          }
        },
        "failure": {
          "text": "Has fallado miserablemente. Como era de esperarse.",
          "modifiers": {
            "stats": {"will_to_live": -5}
          }
        }
      }
    },
    {
      "id": "character_selection",
      "type": "selection",
      "title": "Elige tu personaje (aunque todos son igualmente patéticos)",
      "options": [
        {
          "text": "Guerrero: Fuerte pero estúpido",
          "image": "/images/characters/warrior.png",
          "value": "warrior",
          "modifiers": {
            "stats": {"strength": 20, "intelligence": 5}
          }
        },
        {
          "text": "Mago: Inteligente pero frágil como un palillo",
          "image": "/images/characters/wizard.png",
          "value": "wizard",
          "modifiers": {
            "stats": {"strength": 5, "intelligence": 20}
          }
        }
      ]
    },
    {
      "id": "stats_start",
      "type": "stats",
      "title": "Tus deplorables estadísticas iniciales",
      "stats": [
        {"name": "Ganas de vivir", "value": 50, "max": 100, "icon": "heart"},
        {"name": "Inteligencia", "value": 25, "max": 100, "icon": "brain"},
        {"name": "Pipí acumulado", "value": 0, "max": 100, "icon": "droplet"}
      ]
    },
    {
      "id": "start_screen",
      "type": "screen",
      "title": "Calabosos y Babosos™",
      "subtitle": "Una aventura viscosa",
      "image": "/images/widgets/title.png",
      "text": "Prepárate para la experiencia más resbaladiza de tu vida",
      "buttons": [
        {"text": "Comenzar", "action": "start"},
        {"text": "¿Por qué estoy jugando esto?", "action": "question_existence"}
      ]
    }
  ]
}
```
Cada widget define:
- `id`: Identificador único, como tu crisis existencial.
- `tipo`: Tipo de interacción ("dado", "seleccion", "pantalla", "stats", "combate", etc.).
- `descripcion`: Texto descriptivo, generalmente insultante.
- `condicion`: ID opcional de condición para mostrar el widget.
- `config`: Configuración específica según el tipo, porque la complejidad es diversión.
- `imagen`: Path a imagen relevante (opcional, como tu relevancia en esta vida).
- `resultados`: Posibles resultados y sus efectos, como en la vida real pero más predecibles.

### `conditions.json`
```json
{
  "conditions": [
    {
      "id": "default",
      "description": "Condición por defecto cuando no hay nada mejor",
      "criteria": {
        "always": true
      }
    },
    {
      "id": "has_key",
      "description": "El jugador tiene la llave maestra",
      "criteria": {
        "inventory": ["master_key"],
        "flags": {"door_discovered": true}
      },
      "failure": {
        "message": "Necesitas encontrar una llave, genio. Las puertas no se abren con la fuerza de voluntad.",
        "alternative_route": "search_key"
      }
    },
    {
      "id": "hunger_level_high",
      "description": "El jugador tiene mucha hambre",
      "criteria": {
        "stats": {"hunger": ">70"},
        "visited_routes": ["kitchen", "basement"],
        "seen_dialogs": ["npc_cook"],
        "time": {"phase": "afternoon"}
      },
      "failure": {
        "message": "No tienes tanta hambre... aún. Espera a que tu estómago empiece a comerse a sí mismo.",
        "effects": {
          "stats": {"hunger": 5}
        }
      }
    },
    {
      "id": "perception_high",
      "description": "El jugador tiene alta percepción",
      "criteria": {
        "stats": {"perception": ">=50"}
      }
    },
    {
      "id": "perception_low",
      "description": "El jugador tiene baja percepción",
      "criteria": {
        "stats": {"perception": "<50"}
      }
    },
    {
      "id": "nerly_alive_and_happy",
      "description": "Nerly está vivo y contento contigo",
      "criteria": {
        "characters": {"nerly": {"alive": true, "friendship": ">50"}}
      }
    },
    {
      "id": "first_visit_kitchen",
      "description": "Primera vez en la cocina",
      "criteria": {
        "unvisited_routes": ["kitchen"]
      }
    }
  ]
}
```
Define la lógica condicional del infierno:
- `id`: Identificador único para referenciar desde rutas, diálogos, etc.
- `descripcion`: Explicación para que entiendas qué verifica (o intenta).
- `criterios`: Conjunto de condiciones que TODAS deben cumplirse:
  - `stats`: Valores numéricos y comparaciones.
  - `flags`: Valores booleanos que deben ser true.
  - `inventario`: Items que deben estar en posesión.
  - `rutas_visitadas`: Rutas por las que el jugador debe haber pasado.
  - `rutas_no_visitadas`: Rutas por las que NO debe haber pasado.
  - `dialogos_vistos`: Diálogos que deben haberse mostrado.
  - `personajes`: Estado de NPCs (vivo/muerto, nivel de amistad, etc.).
  - `tiempo`: Condiciones temporales (fase del día, etc.).
- `fallo`: Qué sucede si la condición no se cumple:
  - `mensaje`: Texto sarcástico del narrador explicando el fallo.
  - `ruta_alternativa`: Dónde ir si falla la condición.
  - `efectos`: Modificaciones al estado del juego como resultado del fallo.

### `time.json`
```json
{
  "cycle": {
    "duration": 5,
    "phases": ["morning", "afternoon", "night"],
    "initial": "morning"
  },
  "events": [
    {
      "id": "first_night",
      "phase": "night",
      "conditions": {
        "flags": {"first_night": false}
      },
      "action": {
        "message": "Ha caído la noche. Los sonidos viscosos aumentan. Esa mancha en la pared... ¿se movió?",
        "modifiers": {
          "stats": {"fear": 5},
          "flags": {"first_night": true}
        }
      }
    },
    {
      "id": "hunger_increase",
      "frequency": "each_phase",
      "action": {
        "message": "Tu estómago gruñe. Cuánto tiempo sin comer algo que no sea baba.",
        "modifiers": {
          "stats": {"hunger": 10}
        }
      }
    }
  ]
}
```
Controla el ciclo temporal y eventos recurrentes:
- `ciclo`: Configuración del ciclo de tiempo (porque hasta el tiempo es tu enemigo).
  - `duracion`: Cuántas acciones pasan antes de cambiar de fase.
  - `fases`: Array de nombres de fases del día.
  - `inicial`: Fase inicial, generalmente la menos traumática.
- `eventos`: Eventos que se disparan con patrones temporales:
  - `id`: Identificador único del evento.
  - `fase`: En qué fase debe ocurrir, o "cualquiera".
  - `frecuencia`: "una_vez", "cada_fase", "cada_ciclo", etc.
  - `condiciones`: Condiciones adicionales para que ocurra.
  - `accion`: Efectos cuando se activa el evento.

### `characters.json`
```json
{
  "characters": [
    {
      "id": "nerly",
      "name": "Nerly la Babosa",
      "description": "Una babosa parlante con más personalidad que tú.",
      "image": "/images/characters/nerly.png",
      "initial_state": {
        "alive": true,
        "friendship": 30,
        "location": "alley"
      },
      "dialogs": {
        "greeting": [
          {
            "text": "¡Hola humano! Soy Nerly. No me pises, por favor.",
            "condition": "first_encounter"
          },
          {
            "text": "Oh, eres tú otra vez. Sigues vivo, qué decepción.",
            "condition": "subsequent_encounter"
          }
        ],
        "help": [
          "Podría ayudarte, si prometes no echarme sal encima.",
          {
            "text": "Tengo información sobre el Rey Baboso.",
            "condition": "high_friendship"
          }
        ]
      },
      "reactions": {
        "salt_in_inventory": {
          "text": "¿Es... es eso SAL? Por favor mantenla lejos de mí.",
          "effects": {
            "stats": {"friendship": -10}
          }
        }
      }
    }
  ]
}
```
Define personajes no jugables (NPCs):
- `id`: Identificador único del personaje.
- `nombre`: Nombre visible del personaje.
- `descripcion`: Breve descripción, más ingeniosa que tu biografía de LinkedIn.
- `imagen`: Ruta a la imagen del personaje.
- `estado_inicial`: Valores iniciales de sus atributos.
- `dialogos`: Conjuntos de líneas de diálogo categorizadas.
- `reacciones`: Respuestas automáticas a situaciones específicas.

---

## 🖥️ Consola Babosa™

La interfaz principal es una terminal interactiva que acepta comandos para navegar por los juegos y gestionar la experiencia. Si no sabes usar una terminal, este juego te odiará tanto como yo.

### Comandos disponibles

| Comando         | Descripción                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `list`          | Muestra todos los juegos disponibles, juzgándolos silenciosamente           |
| `open <juego>`  | Abre un juego específico, ejemplo: `open calabosos`                         |
| `load`          | Abre un selector para subir tu propio juego (probablemente horrible)        |
| `help`          | Muestra ayuda que realmente no te ayudará                                   |
| `credits`       | Muestra quiénes son culpables de esta abominación                          |
| `clear`         | Limpia la pantalla. Si solo pudieras limpiar tu historial de decisiones...  |
| `quit`          | Admite tu derrota y vuelve al menú principal                              |
| `restart`       | Borra tu progreso para cometer exactamente los mismos errores             |
| `debug`         | Muestra el estado interno del jugador (spoiler: es patético)             |
| `time`          | Muestra la hora actual en el ciclo narrativo                              |
| `save <nombre>` | Guarda partida con nombre (usado para burlas posteriores)                  |
| `load-save <nombre>`| Carga una partida guardada para revivir tus fracasos                  |
| `say <mensaje>` | Habla directamente al narrador (responderá, y no amablemente)              |

> Sí, puedes tener discusiones con el narrador. Y sí, él es siempre más sexy e inteligente que tú.

---

## 🧮 Sistema de Estado del Juego

El Motor Baboso mantiene un estado global que se actualiza con cada interacción, como un registro detallado de tus fracasos:

```javascript
{
  // Estadísticas numéricas del jugador
  "stats": {
    "ganas_de_vivir": 50,
    "tirada_d20": 13,
    "miedo": 20,
    "pipi_acumulado": 75,
    "hambre": 60,
    "percepcion": 25
  },
  
  // Objetos en inventario (probablemente inútiles)
  "inventario": ["sal", "espada_oxidada", "mapa_roto"],
  
  // Banderas (flags) booleanas para tracking de eventos
  "flags": {
    "nerly_se_unio": false,
    "has_llave": true,
    "primera_noche": true,
    "puerta_descubierta": false
  },
  
  // Estado del ciclo temporal
  "tiempo": {
    "fase_actual": "tarde",
    "acciones_restantes": 2,
    "ciclos_completados": 1
  },
  
  // Historial de rutas visitadas 
  "rutas_visitadas": ["inicio", "cocina", "ventana"],
  
  // Diálogos ya vistos (para no repetir, aunque repetir traumas es divertido)
  "dialogos_vistos": ["intro", "npc_cocinero", "tostadora_poseida"],
  
  // Ruta actual
  "ruta_actual": "jardin",
  
  // Estado de personajes
  "personajes": {
    "nerly": {
      "vivo": true,
      "amistad": 45,
      "ubicacion": "jardin"
    },
    "tostadora": {
      "vivo": true,
      "amistad": -10,
      "ubicacion": "cocina"
    }
  },
  
  // Metadata del juego actual
  "juego": {
    "nombre": "Calabosos y Babosos",
    "version": "1.0.0",
    "autor": "Narrador Malévolo"
  }
}
```

Este estado se persiste usando `localForage` para el guardado/carga de partidas, porque tus decisiones deben perseguirte eternamente.

---

## 🔧 Arquitectura Interna

### Cargador de Juegos (gameLoader.js)

Responsable de:
- Cargar archivos JSON y validar estructura (juzgándote en el proceso)
- Deserializar archivos ZIP (esperando encontrar horrores)
- Parsear las definiciones del juego (y reírse de tu diseño)
- Extraer y preparar imágenes (seguro son peores que el clipart de los 90)

```javascript
// Ejemplo de uso del cargador, si es que logras entender cómo funciona
import { loadGameFromZip, loadLocalGame } from './engine/gameLoader';

// Cargar desde ZIP, asumiendo que puedes hacer un ZIP correctamente
const fileInput = document.getElementById('zipInput');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Tus esperanzas y sueños, empaquetados en un ZIP
    const game = await loadGameFromZip(file);
    startGame(game); // Comienza el sufrimiento
  }
});

// Cargar juego local, para los que ni siquiera pueden hacer un ZIP
const localGame = await loadLocalGame('calabosos');
if (localGame) {
  startGame(localGame); // Este está hecho por profesionales, así que duele más
}
```

### Manejador de Comandos (commandHandler.js)

Procesa comandos ingresados en la terminal y se burla de tus errores tipográficos:

```javascript
import { processCommand } from './engine/commandHandler';

// En el componente Terminal, donde tus sueños van a morir
const handleCommand = (command) => {
  // Aquí es donde evaluamos tu capacidad para escribir correctamente
  const result = processCommand(command, gameState);
  // Y mostramos el resultado de tu incompetencia
  setOutput(prev => [...prev, result]);
  
  // Si escribiste "hlep" en lugar de "help", te lo señalaremos con amor
  if (command === "hlep") {
    setOutput(prev => [...prev, "¿'hlep'? ¿En serio? La dislexia es el menor de tus problemas."]);
  }
};
```

### Resolvedor de Rutas (routeResolver.js)

El corazón del motor narrativo (si tuviera corazón):

```javascript
import { resolveRoute, checkCondition } from './engine/routeResolver';

// Intenta procesar una ruta, si es que el jugador merece avanzar
const processRoute = (routeId) => {
  // Buscar la ruta que el jugador pretende seguir
  const route = findRouteById(routeId, gameData.routes);
  if (!route) {
    // Si la ruta no existe, no es culpa del sistema, es tu culpa
    return showError("Ruta inexistente. O estás perdido o estás intentando hacer trampa.");
  }
  
  // Verificar si la condición se cumple, que probablemente no
  const conditionResult = checkCondition(route.condicion, gameState);
  if (!conditionResult.success) {
    // Fallaste la condición, qué típico
    if (conditionResult.failMessage) {
      showMessage(conditionResult.failMessage);
    }
    
    // Si hay ruta alternativa para los perdedores, la seguimos
    if (conditionResult.alternativeRoute) {
      return processRoute(conditionResult.alternativeRoute);
    }
    
    // De lo contrario, te quedas estancado como en la vida real
    return false;
  }
  
  // Milagrosamente has cumplido la condición, procedemos con las acciones
  return executeActions(route.acciones);
};

// Ejecuta una serie de acciones, cada una potencialmente más traumática que la anterior
const executeActions = (actions) => {
  // Para cada acción en la lista, buscamos qué representa
  for (const actionId of actions) {
    // Podría ser un escenario
    const scenario = findScenarioById(actionId);
    if (scenario) {
      // Verificar condición del escenario porque nunca es simple
      if (checkCondition(scenario.condicion, gameState).success) {
        displayScenario(scenario);
      }
      continue; // Al siguiente trauma
    }
    
    // O un diálogo
    const dialog = findDialogById(actionId);
    if (dialog) {
      // Verificar condición del diálogo, nada es fácil
      if (checkCondition(dialog.condicion, gameState).success) {
        displayDialog(dialog);
      }
      continue; // A por más líneas hirientes
    }
    
    // O un widget interactivo para darte la ilusión de control
    const widget = findWidgetById(actionId);
    if (widget) {
      // Verificar condición del widget porque la vida es un test constante
      if (checkCondition(widget.condicion, gameState).success) {
        renderWidget(widget);
      }
      continue; // Sigue intentando, campeón
    }
    
    // Si llegamos aquí, la acción no existe y alguien la ha fastidiado (tú)
    showError(`Acción '${actionId}' inexistente. Otra razón para abandonar.`);
  }
};
```

---

## 🎮 Cómo crear tu propio juego baboso

1. **Prepara la estructura de archivos**:
   - Crea una carpeta con el nombre de tu juego (no uses espacios, ¿es tan difícil?)
   - Dentro, crea los JSON necesarios: `rutas.json`, `escenarios.json`, `dialogos.json`, `widgets.json`, `condiciones.json`, `tiempo.json` y `personajes.json`
   - Agrega una carpeta `images/` con subcarpetas para `escenarios/`, `dialogos/`, `widgets/` y `personajes/`

2. **Define tu contenido**:
   - Sigue las estructuras JSON indicadas arriba (no seas creativo, creativo = roto)
   - Asegúrate de que todos los IDs sean únicos y consistentes (aparentemente esto es difícil para la gente)
   - Las imágenes deben estar en formatos web-friendly (PNG, JPG, WebP) y optimizadas (>1MB = odio eterno)

3. **Empaqueta tu juego**:
   - Comprime la carpeta del juego en formato ZIP (no RAR, no 7z, ZIP - ¿entendido?)
   - Asegúrate de que la raíz del ZIP contenga directamente los archivos JSON, no otra carpeta

4. **Carga tu juego**:
   - Usa el comando `load` en la terminal para subir tu ZIP
   - Alternativa: coloca la carpeta de tu juego en `public/games/` y úsalo con `open nombre_juego`

### Ejemplo mínimo

Para los impacientes (o sea, tú) que quieren crear un juego lo antes posible, aquí tienes un juego mínimo funcional. Literalmente mínimo... como tus posibilidades de crear algo bueno.

#### Estructura de carpetas:
```
mi_juego_patético/
├── rutas.json
├── escenarios.json
├── dialogos.json
├── widgets.json
├── condiciones.json
├── tiempo.json
├── personajes.json
└── images/
    ├── escenarios/
    │   └── habitacion.png
    ├── dialogos/
    │   └── narrador.png
    └── personajes/
        └── npc.png
```

#### routes.json
```json
{
  "routes": [
    {
      "id": "start",
      "condition": "default",
      "actions": ["initial_room", "intro_dialog", "button_widget"]
    },
    {
      "id": "end",
      "condition": "default",
      "actions": ["initial_room", "end_dialog", "restart_widget"]
    }
  ]
}
```

#### scenarios.json
```json
{
  "scenarios": [
    {
      "id": "initial_room",
      "image": "/images/scenarios/room.png",
      "variants": {
        "morning": "Una habitación vacía y deprimente. Como tu vida.",
        "afternoon": "La misma habitación, pero con sombras más largas.",
        "night": "Oscuridad. Como tu futuro."
      }
    }
  ]
}
```

#### dialogs.json
```json
{
  "dialogs": [
    {
      "id": "intro_dialog",
      "character": "narrator",
      "image": "/images/dialogs/narrator.png",
      "content": [
        "Bienvenido a la demo más patética de la historia.",
        "Un solo botón te separa del final. Impresionante, ¿verdad?"
      ]
    },
    {
      "id": "end_dialog",
      "character": "narrator",
      "image": "/images/dialogs/narrator.png",
      "content": [
        "¡Enhorabuena! Has terminado esta demostración.",
        "Si esperabas algo más, deberías revisar tus expectativas."
      ]
    }
  ]
}
```

#### widgets.json
```json
{
  "widgets": [
    {
      "id": "button_widget",
      "type": "button",
      "text": "Único botón del juego",
      "destination": "end"
    },
    {
      "id": "restart_widget",
      "type": "button",
      "text": "Reiniciar esta maravilla",
      "destination": "start"
    }
  ]
}
```

#### conditions.json
```json
{
  "conditions": [
    {
      "id": "default",
      "description": "Condición que siempre es verdadera",
      "criteria": {
        "always": true
      }
    }
  ]
}
```

#### time.json
```json
{
  "cycle": {
    "duration": 1,
    "phases": ["morning", "afternoon", "night"],
    "initial": "morning"
  },
  "events": []
}
```

#### characters.json
```json
{
  "characters": []
}
```

Felicidades, has creado el juego más aburrido posible. Tu madre estaría orgullosa. O no.

---

## 🧪 Ejecución y Desarrollo

```bash
# Desarrollo local, si es que tienes lo que hace falta
npm run dev

# Compilar para producción, suponiendo que llegue tan lejos
npm run build

# Vista previa de la compilación, para los más optimistas
npm run preview
```

Accede a la aplicación:
- Desarrollo: `http://localhost:5173` (donde mueren las esperanzas)
- Vista previa: `http://localhost:4173` (donde se confirma la muerte)

### Flujo de desarrollo recomendado

1. Usa la plantilla en `data/games/template/` como base, porque la originalidad es sobrevaluada
2. Desarrolla tu juego modificando los JSON, con cada error sintáctico te acercas más a la desesperación
3. Prueba con frecuencia usando `debug` para verificar el estado, y llorar un poco
4. Para iteraciones rápidas durante desarrollo, modifica directamente los archivos en `public/games/`
5. Repite hasta que tu autoestima desaparezca o el juego funcione, lo que ocurra primero

---

## 🛠️ API Interna para Desarrolladores Masoquistas

### Hooks Personalizados

```javascript
// useGameState: Acceso al estado del juego (léase: registro de fracasos)
import { useGameState } from './hooks/useGameState';

function MyComponent() {
  // Desestructurar como si supieras lo que haces
  const { 
    state, 
    updateStat, 
    toggleFlag, 
    addInventoryItem,
    removeInventoryItem,
    updateCharacter
  } = useGameState();
  
  return (
    <div>
      {/* Mostrar estadísticas para que el jugador pueda ver su declive */}
      <p>Ganas de vivir: {state.stats.ganas_de_vivir}</p>
      
      {/* Botón de falsa esperanza */}
      <button onClick={() => updateStat('ganas_de_vivir', 5)}>
        ¡Más ganas! (temporalmente)
      </button>
      
      {/* Mostrar inventario, probablemente lleno de basura */}
      <div>
        Inventario:
        {state.inventario.map(item => (
          <div key={item}>
            {item}
            <button onClick={() => removeInventoryItem(item)}>
              Tirar (como tu vida)
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// useTerminal: Manejo de la terminal, para fingir que eres hacker
import { useTerminal } from './hooks/useTerminal';

function TerminalWrapper() {
  // Herramientas para crear ilusión de control
  const { 
    history, 
    command, 
    setCommand, 
    submitCommand, 
    clearHistory,
    setPrompt,
    addAutoComplete
  } = useTerminal();
  
  // Configurar autocompletado para los menos capaces de escribir
  useEffect(() => {
    addAutoComplete(['help', 'quit', 'load', 'save', 'debug', 'cry']);
  }, []);
  
  return (
    <div className="terminal">
      {/* Historial de comandos y errores */}
      <div className="history">
        {history.map((entry, i) => (
          <div key={i} className={entry.type}>
            {entry.text}
          </div>
        ))}
      </div>
      
      {/* Prompt de entrada, donde escribirás tonterías */}
      <div className="input-line">
        <span className="prompt">{command.prompt || '>'}</span>
        <input 
          value={command.text}
          onChange={(e) => setCommand({...command, text: e.target.value})}
          onKeyDown={(e) => e.key === 'Enter' && submitCommand()}
        />
      </div>
    </div>
  );
}
```

### Sistema de Efectos de Texto

El Motor Baboso incluye un sistema para efectos tipográficos, porque la presentación lo es todo (especialmente cuando el contenido es mediocre):

```javascript
import { typeEffect, rainbowText, glitchText, drippingText } from './lib/textEffects';

// Efecto de escritura letra por letra, como si alguien estuviera realmente escribiendo
typeEffect(elementDOM, "Este texto aparecerá gradualmente para crear suspenso donde no lo hay", 50);

// Texto arcoíris, para cuando quieres ser excesivamente festivo en un juego de terror
const rainbow = rainbowText("¡CRÍTICO!");

// Texto con glitch, perfecto para simular inestabilidad mental (tuya o del jugador)
const glitched = glitchText("A̵̧̛̮̫̗̫͉͕̝̤͈̝͚̦̙̘̲̜̮͌̓̒̔̀͝͠l̵̫͗̎̀̐̔̑̇̽́͐͑̕͘͠g̴̨̙̱̤̘̹̘͎͍̲͖̪̖̼̲̤̼̽̇̓͌͑̀͊͘ͅo̴̧̨̨̟̦̯̜̣̻̣̺̝̰̳̯̬̜̔̋̑̄̊̎̓͋̈́͛̋̓̀̕͜͝ ̷̱̰̭̾͊̀̍̍͌́̔͋͗̌̒̎̀͝͝ţ̷̹̙̤̻͎̜̓e̴̫̹̞̱̮̬̺̘̗̠͋̎̓̏̀ͅ ̵̼̮̞͇̹̝̳̠̭̺̮̹̫̮̠͕̎̂̆͑͆̊͆̔̎̐̀̋́̇͝͠ọ̸̧̺̬͙͓̺͓̪̣͕̀̒͒̾̎͝b̵̪͕̼̜̲͉̐̃̌͛̃̏̎͠ŝ̸̱̙̼̘͕̭̫͕̟̋ͅë̷̪́͗̽̑͐̎r̶̺̞̥̦̣̮̫̤̯̦͈̹̊̓̎̿̋̏̄̋̉̍̊͘͜ͅͅv̵̧̧̮̙̬̻̠͇̪̣̱̱̋́͜á̶̧̧̨̧̲̠̺̫̝̰̣̼̔͆̾͊̊̀̒͌̏̏̀̊̇̍͘͝");

// Texto goteante, porque ¿qué es un juego de babosas sin texto goteante?
const dripping = drippingText("La baba se desliza por las paredes", {
  color: "green",
  dropSpeed: "slow"
});
```

### Sistema de Audio

Porque un buen trauma necesita una banda sonora apropiada:

```javascript
import { playSound, loopBGM, stopBGM, fadeOut } from './lib/audioSystem';

// Reproducir un efecto de sonido singular
playSound('squish', { volume: 0.8 }); // Para cuando pisas una babosa

// Iniciar música de fondo en bucle y que se adapte a la situación
loopBGM('ambient_horror', { volume: 0.5, fadeIn: 3000 });

// Cambiar la música cuando el horror aumenta
const onMonsterAppear = () => {
  // Desvanecer la música actual gradualmente
  fadeOut('ambient_horror', 2000, () => {
    // Comenzar la nueva pista cuando termina el fade
    loopBGM('chase_panic', { volume: 0.7, fadeIn: 500 });
    
    // Aumentar volumen cuando el monstruo se acerca
    setTimeout(() => {
      setVolume('chase_panic', 1.0, 1000); // Aumentar a máximo volumen en 1 segundo
    }, 5000);
  });
};
```

### Gestión de Guardado/Carga

Porque incluso las decisiones más terribles deben persistir:

```javascript
import { saveGame, loadGame, listSaves, deleteSave } from './engine/saveSystem';

// Guardar partida para futuros remordimientos
const onSaveGame = async (name) => {
  try {
    await saveGame(name);
    showMessage("Juego guardado. Tus errores han sido inmortalizados.");
  } catch (error) {
    showError("Ni siquiera pudiste guardar correctamente. Patético.");
  }
};

// Cargar partida para revivir viejos traumas
const onLoadGame = async (name) => {
  try {
    const loadedState = await loadGame(name);
    if (loadedState) {
      setGameState(loadedState);
      showMessage(`Partida "${name}" cargada. Bienvenido de nuevo al sufrimiento.`);
    }
  } catch (error) {
    showError("Archivo de guardado corrupto. Como tus decisiones de vida.");
  }
};

// Listar partidas guardadas para elegir cuál revivir
const showSavedGames = async () => {
  const saves = await listSaves();
  if (saves.length === 0) {
    showMessage("No hay partidas guardadas. Al menos has sido consistente en no progresar.");
    return;
  }
  
  return (
    <div className="saved-games">
      <h3>Escoge tu pesadilla:</h3>
      {saves.map(save => (
        <button key={save.name} onClick={() => onLoadGame(save.name)}>
          {save.name} - {save.date} ({save.playTime} minutos de vida desperdiciada)
        </button>
      ))}
    </div>
  );
};

// Eliminar una partida guardada cuando no puedes soportar la vergüenza
const onDeleteSave = async (name) => {
  if (await confirmDialog(`¿Realmente quieres borrar "${name}"? No es como si pudieras borrar tus errores en la vida real.`)) {
    await deleteSave(name);
    showMessage(`Partida "${name}" eliminada. Ahora finge que nunca existió.`);
  }
};
```

---

## 🐛 Resolución de problemas

### Validación de estructura JSON

El motor incluye un validador que verifica la estructura de tus archivos JSON al cargarlos, porque ni siquiera confío en que sepas escribir JSON:

```bash
# Errores comunes y los insultos correspondientes del Narrador:

Narrador: Vaya, vaya... parece que olvidaste incluir 'routes.json'. ¿También olvidas ponerte pantalones por la mañana?
→ Verifica que todos los archivos básicos estén presentes en tu ZIP.

Narrador: ¡Menuda sorpresa! Tu archivo 'dialogs.json' está mal estructurado. Probablemente también ordenas tus calcetines por sabor.
→ Tu JSON está mal formado. Las llaves y corchetes tienen un propósito, no son decorativos.

Narrador: He detectado referencias rotas en tu juego. Igual que las promesas que le hiciste a tu madre sobre "hacer algo útil con tu vida".
→ Estás referenciando IDs que no existen en otros archivos. Mantén la coherencia.

Narrador: Hay un token inesperado en tu JSON en posición 420. ¿Qué sigue? ¿Pondrás emoji en tu código fuente?
→ Has puesto una llave o coma donde no debías. Aprende a contar paréntesis.

Narrador: Has creado una dependencia circular. Es como dar vueltas en círculos buscando propósito en tu vida... pero más patético.
→ Tus rutas o condiciones crean un bucle infinito. Dibuja un diagrama si tu cerebro no puede manejarlo.
```

Para depuración avanzada, usa el modo debug, si te atreves:

```javascript
// En la consola del navegador, para los más valientes
window.DEBUG_MODE = true;
window.DEBUG_LEVEL = "verbose"; // Opciones: "basic", "detailed", "verbose", "existential-crisis"

// O actívalo con un comando secreto 
// (escribe "debug-enable supersecretpassword" en la terminal)
```

### Problemas conocidos (o "características")

1. **"Mi juego se cuelga cuando llego a cierta escena"**
   - No es un bug, es una metáfora sobre cómo la vida se detiene en los momentos más inoportunos.
   - (Solución real: Probablemente tengas una condición circular o una referencia inválida)

2. **"Las imágenes no se cargan"**
   - ¿Has considerado que quizás el motor está protegiendo a los jugadores de tu "arte"?
   - (Solución real: Verifica las rutas, deben ser relativas a la carpeta del juego)

3. **"El narrador me insulta demasiado"**
   - Eso no es un bug, es una característica. De hecho, el narrador está siendo amable.
   - (No hay solución: El narrador te odiará siempre)

4. **"No puedo avanzar en el juego"**
   - Bienvenido a la vida real, donde a veces estás estancado sin razón aparente.
   - (Solución real: Usa el comando `debug` para ver qué condiciones no se cumplen)

5. **"El juego dice que mi JSON tiene errores pero se ve bien"**
   - Lo interesante de la perfección es que es imposible de alcanzar, especialmente para ti.
   - (Solución real: Usa un validador de JSON externo, hay comas fantasma por ahí)

---

## 💀 Licencia

MIT con cláusula babosa: si usas este motor para hacer un juego serio o, peor aún, educativo, una babosa te perseguirá en tus sueños por toda la eternidad.

---

## ✨ Cierre poético del Narrador

> "Has llegado al final de este README infinito. Tus stats de lectura han aumentado en +5. Tu dignidad, probablemente no. Y recuerda: no es solo un juego, es una terminal para cargar juegos. La diferencia es viscosa pero importante. Como tantas cosas en la vida, este proyecto es solo un cascarón vacío esperando a que lo llenes con contenido... igual que tu existencia."

Disfruta el abismo. Te estará esperando.

🐌

Olvidalo escribiremos porque queremos con S, la Z es para el de la mascara negra!

atte. Nicolás y Vanessa