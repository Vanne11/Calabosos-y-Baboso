# Motor Baboso — Documentación Técnica Completa

> Motor de aventuras textuales narrativas con mecánicas RPG, escrito en TypeScript + React.
> Versión: 0.1.0 | ~18.000 líneas | 109 archivos

---

## Índice

1. [Arquitectura General](#1-arquitectura-general)
2. [Formato de Datos del Juego](#2-formato-de-datos-del-juego)
3. [El Motor (GameEngine)](#3-el-motor-gameengine)
4. [Sistema de Tipos de Pasos (SequenceStep)](#4-sistema-de-tipos-de-pasos-sequencestep)
5. [Sistema de Condiciones](#5-sistema-de-condiciones)
6. [Sistema de Efectos](#6-sistema-de-efectos)
7. [Sistema de Dados (DiceRoller)](#7-sistema-de-dados-diceroller)
8. [Sistema de Audio](#8-sistema-de-audio)
9. [Estado del Jugador (PlayerState)](#9-estado-del-jugador-playerstate)
10. [Comunicación Motor ↔ UI (StepResult / PlayerAction)](#10-comunicación-motor--ui-stepresult--playeraction)
11. [Game Loop (useGameLoop)](#11-game-loop-usegameloop)
12. [Terminal y Comandos](#12-terminal-y-comandos)
13. [Rich Text (formato de texto)](#13-rich-text-formato-de-texto)
14. [Store Global (Zustand)](#14-store-global-zustand)
15. [Fases de la Aplicación](#15-fases-de-la-aplicación)
16. [Editor Visual](#16-editor-visual)
17. [Cargador de Juegos](#17-cargador-de-juegos)
18. [Estructura de Archivos](#18-estructura-de-archivos)
19. [Stack Tecnológico](#19-stack-tecnológico)
20. [Sistemas RPG Avanzados](#20-sistemas-rpg-avanzados)
21. [Navegación Especial](#21-navegación-especial)
22. [Sistema de Guardado](#22-sistema-de-guardado)
23. [Guía para Crear un Juego](#23-guía-para-crear-un-juego)

---

## 1. Arquitectura General

El motor sigue una arquitectura de **generadores asíncronos** que separa completamente la lógica del juego de la UI:

```
┌──────────────────────────────────────────────────────────────┐
│                        React UI                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Terminal  │  │ Widgets  │  │ Image    │  │ StatusBar   │  │
│  │ History   │  │ Choice   │  │ Panel    │  │ Inventory   │  │
│  │ Input     │  │ Dice     │  │          │  │ Stats       │  │
│  └────┬──────┘  │ Input    │  └──────────┘  └─────────────┘  │
│       │         │ Shop     │                                  │
│       │         │ Combat   │                                  │
│       │         │ Puzzle   │                                  │
│       │         │ Examine  │                                  │
│       │         │ UseItem  │                                  │
│       │         │ Craft    │                                  │
│       │         │ LevelUp  │                                  │
│       │         │ Timed    │                                  │
│       │         └────┬─────┘                                  │
│       │              │                                        │
│  ┌────▼──────────────▼───┐                                    │
│  │     useGameLoop       │  Hook que consume StepResults      │
│  │  (consume + render)   │  y despacha PlayerActions          │
│  └────────┬──────────────┘                                    │
│           │ yield StepResult / sendAction(PlayerAction)        │
│  ┌────────▼──────────────┐                                    │
│  │    Zustand Store      │  Estado global sincronizado        │
│  │   (useAppStore)       │                                    │
│  └────────┬──────────────┘                                    │
└───────────┼──────────────────────────────────────────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                    GameEngine (puro TS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Condition    │  │ Effects      │  │ DiceRoller   │        │
│  │ Evaluator    │  │ Applier      │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│                                                               │
│  async *enterScene(id) → AsyncGenerator<StepResult>           │
│  sendAction(action: PlayerAction)                             │
└──────────────────────────────────────────────────────────────┘
```

### Principios clave

- **GameEngine es puro TypeScript** — sin dependencias de React, DOM o browser
- **Generadores asíncronos** — `enterScene()` es un `async *generator` que `yield`ea resultados paso a paso
- **Comunicación bidireccional** — el motor `yield`ea `StepResult` (datos para la UI), la UI responde con `sendAction(PlayerAction)` cuando necesita input del jugador
- **Estado inmutable en la UI** — el motor muta su propio `PlayerState`, la UI recibe copias vía Zustand
- **Separación datos/lógica** — toda la narrativa vive en JSON (`game.json` + `scenes.json`), el código solo ejecuta

---

## 2. Formato de Datos del Juego

Un juego se compone de **2 archivos JSON** en `public/games/{nombre}/`:

### `game.json` — Manifiesto del juego (GameManifest)

Define metadatos, personajes, configuración inicial y sistemas RPG.

```jsonc
{
  // --- Metadatos ---
  "name": "Mi Aventura",
  "description": "Una historia viscosa",
  "author": "Narrador Malévolo",
  "version": "1.0.0",

  // --- Personajes ---
  "characters": {
    "narrator": {
      "name": "Narrador",
      "description": "El narrador omnisciente",
      "role": "narrator"                    // narrator | protagonist | companion | npc
    },
    "bob": {
      "name": "BOB",
      "description": "El héroe involuntario",
      "image": "images/bob.png",
      "role": "protagonist",
      "altImages": {                        // Imágenes alternativas (selección visual)
        "masculino": "images/bob_m.png",
        "femenino": "images/bob_f.png"
      },
      "skillTree": "guerrero",             // ID del árbol de habilidades
      "baseStats": { "hp": 100, "atk": 10 },
      "maxLevel": 10,
      "xpCurve": [100, 200, 400, 800],     // XP necesaria por nivel
      "initialTraits": ["valiente"]
    },
    "nerly": {
      "name": "Nerly la Babosa",
      "description": "Compañera comerciante",
      "image": "images/nerly.png",
      "role": "companion",
      "joinFlag": "nerly_joined"            // Flag que activa al compañero
    }
  },

  // --- Estado inicial ---
  "initialStats": {
    "will_to_live": 100,
    "hunger": 0,
    "reputation": 50,
    "gold": 20
  },
  "initialFlags": {
    "intro_done": false
  },
  "initialInventory": ["bread"],

  // --- Sistema temporal ---
  "time": {
    "duration": 5,                          // Acciones por fase
    "phases": ["morning", "afternoon", "night"],
    "initial": "morning"
  },

  // --- Items (opcional) ---
  "items": {
    "bread": {
      "name": "Pan",
      "description": "Un trozo de pan mohoso",
      "image": "images/bread.png"
    },
    "sword": {
      "name": "Espada Oxidada",
      "description": "Apenas corta mantequilla"
    }
  },

  // --- Árboles de habilidades (opcional) ---
  "skillTrees": {
    "guerrero": {
      "name": "Guerrero",
      "skills": {
        "slash": {
          "name": "Tajo",
          "description": "+5 ataque por nivel",
          "maxLevel": 3,
          "cost": 1,
          "passiveBonus": { "atk": 5 }
        },
        "shield_bash": {
          "name": "Golpe de Escudo",
          "description": "Requiere Tajo nivel 1",
          "maxLevel": 2,
          "cost": 2,
          "prerequisites": ["slash"],
          "passiveBonus": { "def": 3 }
        }
      }
    }
  },

  // --- Rasgos (opcional) ---
  "traits": {
    "valiente": {
      "name": "Valiente",
      "description": "+2 a tiradas de dados",
      "diceModifier": 2,
      "permanent": true,
      "tags": ["personality"]
    },
    "envenenado": {
      "name": "Envenenado",
      "description": "-10 HP por escena",
      "statModifiers": { "will_to_live": -10 },
      "permanent": false,
      "duration": 3                         // Se elimina tras 3 escenas
    }
  },

  // --- Sistema de guardado (opcional) ---
  "saveSystem": {
    "mode": "free",                         // "free" (manual) | "checkpoint" (automático)
    "slots": 3,                             // Número de slots (1-10, default: 3)
    "allowOverwrite": true,                 // Permitir sobreescribir slots ocupados
    "checkpointScenes": []                  // Escenas de autoguardado (solo modo checkpoint)
  }
}
```

### `scenes.json` — Escenas del juego (ScenesFile)

Contiene todas las escenas con sus secuencias de pasos. **Debe existir una escena `start`**.

```jsonc
{
  "scenes": {
    "start": {
      "scenario": {
        "name": "Plaza Principal",
        "image": "images/plaza.png",
        "music": "audio/town.mp3",
        "description": "La plaza principal al amanecer...",
        "variants": {                       // Descripciones por fase temporal
          "morning": "El sol ilumina la plaza...",
          "afternoon": "La plaza está concurrida...",
          "night": "Antorchas iluminan la oscuridad..."
        }
      },
      "sequence": [
        // Array de SequenceStep (ver sección 4)
      ]
    }
  }
}
```

### Resolución de rutas de assets

El `GameLoader` resuelve automáticamente las rutas relativas de imágenes y música:
- `"images/plaza.png"` → `"games/demo/images/plaza.png"`
- Se aplica al `scenario.image`, `scenario.music` y `characters[*].image`
- Las rutas dentro de pasos (`sound.src`) se resuelven en el `GameEngine`

---

## 3. El Motor (GameEngine)

**Archivo:** `src/engine/GameEngine.ts` (1.328 líneas)

### Constructor

```typescript
const engine = new GameEngine(manifest, scenes, basePath);
// manifest: GameManifest — datos del juego
// scenes: ScenesFile — escenas
// basePath: string — ruta base para resolver assets (ej: "games/demo")
```

### API Pública

| Método / Propiedad | Tipo | Descripción |
|---|---|---|
| `enterScene(sceneId)` | `AsyncGenerator<StepResult>` | Generador principal: entra en una escena y yield-ea resultados |
| `sendAction(action)` | `void` | Envía una acción del jugador al motor |
| `reset()` | `void` | Reinicia al estado inicial |
| `state` | `PlayerState` | Estado actual del jugador (readonly) |
| `currentScene` | `string` | ID de la escena actual |
| `characters` | `Record<string, CharacterDef>` | Definiciones de personajes |
| `gameName` | `string` | Nombre del juego |
| `items` | `Record<string, ItemDef>` | Definiciones de items |
| `currentSceneImage` | `string \| undefined` | Imagen de la escena actual |
| `currentSceneMusic` | `string \| undefined` | Música de la escena actual |
| `getActiveCompanions()` | `Array` | Compañeros activos (joinFlag == true) |
| `getProtagonist()` | `Object \| null` | Datos del protagonista |
| `getRelationshipTier(charId)` | `string` | Tier de relación con NPC |
| `getCharacterState(charId)` | `CharacterState` | Estado RPG de un personaje |
| `skillTrees` | `Record` | Árboles de habilidades |
| `traitDefs` | `Record` | Definiciones de rasgos |

### Flujo de ejecución

```
enterScene("plaza")
  │
  ├─ Marca escena como visitada
  ├─ Incrementa sceneCount
  ├─ Expira traits temporales
  │
  ├─ yield ScenarioResult (nombre, descripción, imagen, música)
  │
  └─ Para cada paso en scene.sequence:
       │
       ├─ Evalúa step.condition → si false, skip
       │
       └─ processStep(step) → yield* (delega al sub-generador)
            │
            ├─ yield StepResult (datos para la UI)
            ├─ Si requiere input: yield prompt, await waitForAction()
            ├─ Aplica efectos si hay
            └─ Si hay goto: return { type: 'navigate', scene: goto }
                 │
                 └─ consumeResults detecta navigate → llama startScene(goto)
```

### Mecanismo de pausa/reanudación

El motor usa un patrón de **Promise bridge** para pausar la ejecución del generador:

```typescript
// Motor: se pausa esperando input del jugador
const action = await this.waitForAction();

// UI: envía la respuesta del jugador
engine.sendAction({ type: 'choose', index: 0 });
```

Internamente:
1. `waitForAction()` crea una `Promise` y guarda el `resolve` en `_actionResolver`
2. `sendAction()` llama al `resolve` guardado, desbloqueando el generador
3. Si `sendAction` se llama antes de `waitForAction`, la acción se buferea en `_pendingAction`

---

## 4. Sistema de Tipos de Pasos (SequenceStep)

El motor soporta **18 tipos de pasos** que se pueden combinar libremente en la secuencia de una escena.

### 4.1 `dialog` — Diálogo de personaje

Muestra líneas de texto de un personaje, con su nombre e imagen.

```jsonc
{
  "type": "dialog",
  "character": "narrator",          // ID del personaje en characters
  "lines": [
    "Bienvenido a Viscaria, tierra de babosas.",
    "Espero que hayas traído zapatos impermeables."
  ],
  "condition": { ... }              // Opcional: condición para mostrar
}
```

**Comportamiento:** Muestra header con nombre/imagen del personaje, luego cada línea con delay. Espera Enter entre diálogos. En la primera aparición de un personaje con imagen, se muestra con animación especial.

### 4.2 `choice` — Opciones del jugador

Presenta botones de opciones. Cada opción puede tener efectos y/o navegar a otra escena.

```jsonc
{
  "type": "choice",
  "options": [
    {
      "text": "Ir a la tienda",
      "effects": {                  // Opcional
        "stats": { "curiosity": 5 },
        "flags": { "visited_shop": true }
      },
      "goto": "tienda",            // Opcional: escena destino
      "condition": { ... }          // Opcional: oculta la opción si no se cumple
    },
    {
      "text": "Explorar el callejón",
      "goto": "callejon"
    },
    {
      "text": "[Requiere llave] Abrir la puerta",
      "goto": "puerta_secreta",
      "condition": { "inventory": ["master_key"] }
    }
  ]
}
```

**Comportamiento:** Filtra opciones visibles evaluando `condition`. Yield-ea `choice_prompt` y espera `{ type: 'choose', index }`. Aplica efectos de la opción elegida y navega si hay `goto`.

### 4.3 `dice` — Tirada de dados

Sistema D20 con modificadores basados en stats del jugador.

```jsonc
{
  "type": "dice",
  "stat": "reputation",            // Stat que modifica la tirada
  "difficulty": 13,                 // Número a superar
  "faces": 20,                     // Caras del dado (normalmente 20)
  "description": "Tirada de Reputación",
  "results": {
    "critical_success": {           // Opcional: dado == faces (nat 20)
      "text": "¡Éxito legendario!",
      "effects": { "stats": { "reputation": 20 } },
      "goto": "resultado_epico"
    },
    "success": {                    // Obligatorio: total >= difficulty
      "text": "Has logrado convencer al guardia.",
      "effects": { "stats": { "reputation": 5 } },
      "goto": "exito"
    },
    "failure": {                    // Obligatorio: total < difficulty
      "text": "El guardia te mira con desprecio.",
      "effects": { "stats": { "reputation": -5 } },
      "goto": "fallo"
    },
    "critical_failure": {           // Opcional: dado == 1 (nat 1)
      "text": "Has tropezado y caído en barro.",
      "effects": { "stats": { "reputation": -15 } },
      "goto": "desastre"
    }
  }
}
```

**Mecánica:** Ver [sección 7](#7-sistema-de-dados-diceroller).

### 4.4 `input` — Entrada de texto libre

Pide al jugador que escriba texto. Se guarda como stat.

```jsonc
{
  "type": "input",
  "prompt": "¿Cuál es tu nombre, aventurero?",
  "saveAs": "player_name",         // Se guarda en stats[saveAs]
  "goto": "despues_del_nombre",    // Opcional
  "condition": { ... }
}
```

**Uso común:** Nombre del personaje, contraseñas, respuestas libres.

### 4.5 `effects` — Aplicar efectos silenciosamente

Aplica modificadores al estado sin interacción del jugador.

```jsonc
{
  "type": "effects",
  "effects": {
    "stats": { "will_to_live": -10 },
    "flags": { "trap_activated": true },
    "inventory": ["mysterious_note"]
  }
}
```

### 4.6 `branch` — Bifurcación automática

Evalúa condiciones en orden y navega a la primera que se cumpla. No requiere input del jugador.

```jsonc
{
  "type": "branch",
  "branches": [
    {
      "condition": { "flags": { "has_key": true } },
      "goto": "puerta_abierta"
    },
    {
      "condition": { "stats": { "strength": ">=80" } },
      "goto": "puerta_forzada"
    },
    {
      "goto": "puerta_cerrada"     // Sin condición = fallback
    }
  ]
}
```

**Comportamiento:** Evalúa cada `condition` en orden. La primera que pasa, navega a su `goto`. Si ninguna pasa, continúa con el siguiente paso.

### 4.7 `random` — Resultado aleatorio con pesos

Selecciona un resultado al azar basándose en pesos relativos.

```jsonc
{
  "type": "random",
  "outcomes": [
    {
      "weight": 3,                  // 3/5 = 60% de probabilidad
      "text": "No encuentras nada interesante.",
      "effects": { "stats": { "hunger": 5 } }
    },
    {
      "weight": 1,                  // 1/5 = 20%
      "text": "¡Encuentras una moneda!",
      "effects": { "inventory": ["gold_coin"] },
      "goto": "moneda_encontrada"
    },
    {
      "weight": 1,                  // 1/5 = 20%
      "text": "¡Una babosa te ataca!",
      "goto": "encuentro_babosa"
    }
  ]
}
```

### 4.8 `check` — Comprobación determinista de stat

Similar a `dice` pero sin azar: compara directamente el valor de una stat con un umbral.

```jsonc
{
  "type": "check",
  "stat": "perception",
  "threshold": ">=50",             // Operadores: >=, <=, >, <, ==
  "description": "Comprobación de Percepción",
  "success": {
    "text": "Notas algo brillante entre los arbustos.",
    "effects": { "flags": { "found_gem": true } },
    "goto": "gema_encontrada"
  },
  "failure": {
    "text": "No ves nada fuera de lo normal.",
    "goto": "siguiente_area"
  }
}
```

### 4.9 `shop` — Interfaz de tienda

Sistema de compra/venta interactivo con una stat como moneda.

```jsonc
{
  "type": "shop",
  "title": "Tienda de Nerly",
  "currency": "gold",              // Stat usada como dinero
  "items": [
    {
      "id": "sword",
      "name": "Espada Oxidada",
      "price": 15,
      "description": "Apenas corta mantequilla",
      "effects": {                  // Efectos extra al comprar
        "stats": { "attack": 5 }
      }
    },
    {
      "id": "potion",
      "name": "Poción de Vida",
      "price": 10,
      "description": "Sabe a barro"
    }
  ],
  "sellable": true,                // ¿Se puede vender?
  "sellRatio": 0.5,                // Precio de venta = precio * ratio
  "goto": "despues_de_tienda"      // Escena al salir
}
```

**Comportamiento:** Loop interactivo de compra/venta. El jugador ve sus monedas, items disponibles y puede comprar/vender. Sale con `shop_exit`.

### 4.10 `combat` — Combate por turnos

Sistema de combate con HP, ataque, defensa y acciones.

```jsonc
{
  "type": "combat",
  "enemy": {
    "name": "Rey Baboso",
    "image": "images/rey_baboso.png",
    "hp": 50,
    "attack": 8,
    "defense": 3
  },
  "playerStat": "will_to_live",    // Stat del jugador como HP
  "attackStat": "attack",           // Stat que afecta daño
  "defenseStat": "defense",         // Stat que reduce daño (opcional)
  "actions": ["attack", "defend", "flee", "use_item"],
  "combatItems": [                  // Items usables en combate (opcional)
    {
      "itemId": "sal_anti_babosas",
      "name": "Sal Anti-Babosas",
      "text": "¡Lanzas sal al Rey Baboso! Se retuerce de dolor.",
      "damage": 25,
      "consume": true
    },
    {
      "itemId": "potion",
      "name": "Poción de Vida",
      "text": "Bebes la poción y sientes vigor renovado.",
      "heal": 30,
      "consume": true
    }
  ],
  "results": {
    "victory": {
      "text": "¡Has derrotado al Rey Baboso!",
      "effects": {
        "flags": { "rey_derrotado": true },
        "xp": { "bob": 100 }
      },
      "goto": "victoria_final"
    },
    "defeat": {
      "text": "El Rey Baboso te ha aplastado...",
      "goto": "_game_over"
    },
    "flee": {                       // Opcional
      "text": "Huyes cobardemente.",
      "effects": { "stats": { "reputation": -10 } },
      "goto": "huida"
    }
  }
}
```

**Mecánica de combate:**

| Acción | Efecto |
|---|---|
| `attack` | Daño = `floor(attackStat/10) + random(1-6)`. Enemigo contraataca |
| `defend` | Daño recibido reducido al 50%. No atacas |
| `flee` | Sale del combate si hay resultado `flee` definido |
| `use_item:ID` | Usa un item de `combatItems`. Puede hacer daño, curar, y/o tener efectos. Enemigo contraataca si sobrevive |

**Daño enemigo:** `max(1, enemy.attack - floor(defenseStat/20)) + random(0-3)`
**Defendiendo:** `max(1, floor(daño_base * 0.5))`

### 4.11 `notify` — Notificación/toast

Muestra una notificación visual con estilo.

```jsonc
{
  "type": "notify",
  "style": "achievement",          // achievement | warning | info | discovery
  "title": "¡Logro Desbloqueado!",
  "text": "Has sobrevivido al primer día.",
  "icon": "🏆",                   // Opcional (se deduce del style)
  "effects": { ... }               // Opcional
}
```

### 4.12 `wait` — Pausa dramática

Pausa la ejecución con texto animado.

```jsonc
{
  "type": "wait",
  "text": "El suelo tiembla bajo tus pies...",
  "duration": 2000,                // Milisegundos
  "style": "typing"                // typing | fade | dots
}
```

### 4.13 `sound` — Efecto de sonido puntual

Reproduce un sonido one-shot (no reemplaza la música de fondo).

```jsonc
{
  "type": "sound",
  "src": "audio/explosion.mp3",
  "volume": 0.8                    // 0-1, por defecto 1
}
```

### 4.14 `craft` — Combinar items del inventario

Sistema de crafting: el jugador selecciona items para combinar.

```jsonc
{
  "type": "craft",
  "description": "Mesa de alquimia",
  "recipes": [
    {
      "ingredients": ["herb", "water"],
      "result": "potion",
      "text": "¡Has creado una Poción de Vida!",
      "consume": true,             // Consume los ingredientes (default: true)
      "effects": { "stats": { "alchemy": 5 } },
      "goto": "pocion_creada"      // Opcional
    },
    {
      "ingredients": ["stick", "rock"],
      "result": "crude_axe",
      "text": "Has improvisado un hacha tosca.",
      "consume": true
    }
  ],
  "failText": "Eso no tiene ningún sentido...",
  "goto": "despues_del_craft"      // Escena al salir sin craftear
}
```

**Comportamiento:** Compara ingredientes sin importar el orden. Si coincide una receta y el jugador tiene todos los ingredientes, craftea y sale. Si no, muestra `failText`.

### 4.15 `puzzle` — Acertijos interactivos

Cuatro tipos de puzzles: código, secuencia, acertijo y candado.

```jsonc
// Tipo: code (escribir respuesta)
{
  "type": "puzzle",
  "puzzleType": "code",
  "description": "Una puerta con inscripciones...",
  "config": {
    "type": "code",
    "answers": ["viscaria", "babosa"],  // Respuestas válidas (case-insensitive)
    "prompt": "Escribe la contraseña:",
    "hint": "El nombre del reino..."
  },
  "maxAttempts": 3,                // 0 = infinitos
  "hintText": "Piensa en el reino...",
  "success": {
    "text": "¡La puerta se abre!",
    "effects": { "flags": { "puzzle_solved": true } },
    "goto": "interior"
  },
  "failure": {
    "text": "La puerta permanece cerrada.",
    "goto": "buscar_pista"
  }
}

// Tipo: riddle (respuesta libre, match parcial)
{
  "puzzleType": "riddle",
  "config": {
    "type": "riddle",
    "question": "¿Qué tiene raíces que nadie ve, es más alta que los árboles?",
    "answers": ["montaña", "la montaña"],
    "hint": "Piensa en grande..."
  }
}

// Tipo: lock (combinación numérica)
{
  "puzzleType": "lock",
  "config": {
    "type": "lock",
    "digits": 4,
    "combination": "4829",
    "hint": "Mira los números en la pared..."
  }
}

// Tipo: sequence (ordenar elementos)
{
  "puzzleType": "sequence",
  "config": {
    "type": "sequence",
    "elements": [
      { "id": "sun", "label": "☀️ Sol" },
      { "id": "moon", "label": "🌙 Luna" },
      { "id": "star", "label": "⭐ Estrella" }
    ],
    "hint": "Del más grande al más pequeño..."
  }
}
```

### 4.16 `examine` — Inspeccionar entorno

El jugador puede examinar múltiples elementos de un escenario. Loop interactivo.

```jsonc
{
  "type": "examine",
  "description": "Observas la habitación detenidamente...",
  "subjects": [
    {
      "id": "desk",
      "label": "📋 Escritorio",
      "text": "Un escritorio polvoriento con cajones cerrados.",
      "effects": { "flags": { "saw_desk": true } },
      "condition": { ... },         // Opcional: oculta si no se cumple
      "oneTime": true               // Desaparece tras examinar
    },
    {
      "id": "painting",
      "label": "🖼️ Cuadro",
      "text": "Un retrato del Rey Baboso en su mejor momento."
    }
  ],
  "exitText": "Dejar de investigar",
  "goto": "siguiente_area"
}
```

**Comportamiento:** Muestra sujetos disponibles en loop. El jugador selecciona uno, ve su texto, y puede seguir examinando o salir. Los sujetos `oneTime` desaparecen tras ser examinados.

### 4.17 `use_item` — Usar item en objetivo del entorno

Estilo LucasArts: "Usar [item] en [objetivo]".

```jsonc
{
  "type": "use_item",
  "description": "Hay una puerta cerrada y una cerradura oxidada.",
  "targets": [
    {
      "id": "door_lock",
      "label": "🔒 Cerradura",
      "accepts": [
        {
          "itemId": "rusty_key",
          "text": "¡La llave encaja! La puerta se abre con un chirrido.",
          "consume": true,          // Consume el item (default: true)
          "effects": { "flags": { "door_opened": true } },
          "goto": "habitacion_secreta"
        },
        {
          "itemId": "lockpick",
          "text": "Fuerzas la cerradura... funciona.",
          "consume": true,
          "goto": "habitacion_secreta"
        }
      ],
      "defaultText": "Eso no funciona con la cerradura."
    }
  ],
  "failText": "No puedes usar eso aquí.",
  "exitText": "Olvidarlo",
  "goto": "siguiente_area"
}
```

**Comportamiento:** El jugador ve los targets y su inventario. Selecciona un item y un target. Si el item está en `accepts`, éxito. Si no, muestra `defaultText` o `failText`.

### 4.18 `timed_choice` — Decisión con temporizador

Como `choice` pero con cuenta atrás. Si se acaba el tiempo, se selecciona la opción por defecto.

```jsonc
{
  "type": "timed_choice",
  "duration": 10000,               // Milisegundos para decidir
  "defaultIndex": 0,                // Opción seleccionada al expirar
  "timeoutText": "Tardaste demasiado...",
  "options": [
    {
      "text": "¡Saltar!",
      "goto": "saltar",
      "effects": { "stats": { "courage": 10 } }
    },
    {
      "text": "Quedarse quieto",
      "goto": "quieto"
    }
  ]
}
```

### 4.19 `level_up` — Pantalla de subir nivel

Muestra interfaz de selección de habilidades al subir de nivel.

```jsonc
{
  "type": "level_up",
  "characterId": "bob",            // Opcional: vacío = protagonista
  "description": "¡Has ganado experiencia!",
  "force": true,                    // true = sube sin chequear XP
  "skillPoints": 2,                 // Puntos de habilidad otorgados (default: 1)
  "goto": "despues_level_up"
}
```

**Comportamiento:** Si `force: false`, verifica que el personaje tenga suficiente XP. Muestra UI con habilidades disponibles del `skillTree`. El jugador gasta puntos en skills. Los `passiveBonus` de las skills se aplican automáticamente como stats del personaje.

---

## 5. Sistema de Condiciones

**Archivo:** `src/engine/ConditionEvaluator.ts`

Las condiciones se evalúan con lógica AND: **todas** las reglas deben cumplirse.

### StepCondition

```typescript
interface StepCondition {
  stats?: Record<string, string>;          // { "perception": ">=50" }
  flags?: Record<string, boolean>;         // { "intro_done": true }
  inventory?: string[];                    // ["sword", "key"]
  visitedScenes?: string[];                // ["tienda", "callejon"]
  unvisitedScenes?: string[];              // ["final"]
  skillLevel?: Record<string, string>;     // { "fireball": ">=2" }
  affinity?: Record<string, string>;       // { "nerly": ">=50" }
  hasTraits?: string[];                    // ["valiente"]
  notTraits?: string[];                    // ["envenenado"]
  characterLevel?: Record<string, string>; // { "bob": ">=3" }
  relationshipTier?: Record<string, RelationshipTier>; // { "nerly": "friendly" }
}
```

### Operadores de comparación

Se usan en `stats`, `skillLevel`, `affinity`, `characterLevel`:

| Operador | Significado |
|---|---|
| `>=50` | Mayor o igual a 50 |
| `<=30` | Menor o igual a 30 |
| `>0` | Estrictamente mayor que 0 |
| `<100` | Estrictamente menor que 100 |
| `==42` | Exactamente igual a 42 |
| `!=0` | Diferente de 0 |
| `50` | Sin operador → se usa `>=` por defecto |

### Tiers de relación

```
hostile    (afinidad < -30)
distrustful (-30 ≤ afinidad < -10)
neutral    (-10 ≤ afinidad < 20)
friendly   (20 ≤ afinidad < 50)
allied     (50 ≤ afinidad < 80)
loyal      (afinidad ≥ 80)
```

### Uso en pasos

Cada paso tiene un campo `condition` opcional. Si la condición no se cumple, el paso se salta:

```jsonc
{
  "type": "dialog",
  "character": "nerly",
  "lines": ["¡Veo que tienes la espada legendaria!"],
  "condition": {
    "inventory": ["legendary_sword"],
    "flags": { "nerly_met": true }
  }
}
```

Las opciones de `choice` también pueden tener condiciones individuales (se ocultan si no se cumplen).

---

## 6. Sistema de Efectos

**Archivo:** `src/engine/EffectsApplier.ts`

### Estructura de Effects

```typescript
interface Effects {
  // --- Stats ---
  stats?: Record<string, number | string>;     // Suma relativa: { "gold": 10 } → gold += 10
  setStats?: Record<string, number | string>;  // Asignación absoluta: { "gold": 100 } → gold = 100

  // --- Flags ---
  flags?: Record<string, boolean>;              // { "door_opened": true }

  // --- Inventario ---
  inventory?: string[];                         // Añadir items: ["sword", "shield"]
  removeInventory?: string[];                   // Quitar items: ["old_key"]
  clearInventory?: boolean;                     // Vaciar todo el inventario

  // --- RPG ---
  xp?: Record<string, number>;                 // Dar XP: { "bob": 50, "nerly": 20 }
  affinity?: Record<string, number>;            // Cambiar afinidad: { "nerly": 10 }
  addTraits?: string[];                         // Añadir rasgos: ["envenenado"]
  removeTraits?: string[];                      // Quitar rasgos: ["maldito"]
  learnSkill?: Record<string, number>;          // Aprender skill: { "fireball": 1 }
  giveSkillPoints?: Record<string, number>;     // Dar puntos: { "bob": 2 }
}
```

### Comportamiento de stats vs setStats

```jsonc
// Estado: { gold: 50 }
{ "stats": { "gold": 10 } }       // → gold = 60 (suma)
{ "stats": { "gold": -20 } }      // → gold = 30 (resta)
{ "setStats": { "gold": 100 } }   // → gold = 100 (asignación directa)

// Strings se asignan directamente
{ "stats": { "player_name": "BOB" } }  // → player_name = "BOB"
```

### Afinidad

La afinidad se clampea entre -100 y +100:
```jsonc
{ "affinity": { "nerly": 10 } }   // nerly.affinity += 10 (max 100)
{ "affinity": { "nerly": -20 } }  // nerly.affinity -= 20 (min -100)
```

---

## 7. Sistema de Dados (DiceRoller)

**Archivo:** `src/engine/DiceRoller.ts`

### Mecánica

1. Se lanza un dado de N caras (normalmente D20)
2. Se calcula el modificador basado en la stat relevante
3. Se suma: `total = roll + modifier`
4. Se compara con la dificultad

### Cálculo del modificador

```
modifier = floor(statValue / divider) - 5
```

Con `divider = 10` (default):
- Stat 100 → +5
- Stat 70 → +2
- Stat 50 → 0
- Stat 30 → -2
- Stat 0 → -5

### Resultados

| Resultado | Condición |
|---|---|
| `critical_success` | El dado sacó el valor máximo (nat 20 en D20) |
| `success` | total ≥ difficulty |
| `failure` | total < difficulty |
| `critical_failure` | El dado sacó 1 (nat 1) |

Los críticos tienen prioridad sobre el resultado normal.

---

## 8. Sistema de Audio

**Archivo:** `src/engine/AudioManager.ts`

### Características

- **Singleton** global: `audioManager`
- **Crossfade** entre pistas de música (1.5s de transición)
- **Auto-unlock** del audio en la primera interacción del usuario
- **Loop** automático de la música
- **Efectos de sonido** one-shot separados (via `SoundStep`)

### API

```typescript
audioManager.play(src)    // Reproduce música con crossfade
audioManager.stop()       // Para con fade out
audioManager.pause()      // Pausa
audioManager.resume()     // Reanuda
audioManager.volume = 0.5 // Volumen (0-1)
```

### Flujo

1. La escena define `scenario.music` → el `GameEngine` yield-ea un `ScenarioResult` con `music`
2. `useGameLoop` detecta `result.music` → llama `audioManager.play(src)`
3. Si la música es la misma que la actual, no hace nada
4. Si es diferente, hace crossfade de la anterior a la nueva
5. Al salir del juego (`resetGame`), `audioManager.stop()`

---

## 9. Estado del Jugador (PlayerState)

**Archivo:** `src/types/engine.ts`

```typescript
interface PlayerState {
  stats: Record<string, number | string>;  // Stats numéricas y strings
  flags: Record<string, boolean>;          // Banderas booleanas
  inventory: string[];                     // IDs de items en inventario
  visitedScenes: string[];                 // IDs de escenas visitadas
  time: {
    phase: string;                         // Fase temporal actual
    actions: number;                       // Acciones en esta fase
    cycles: number;                        // Ciclos completados
  };
  characters: Record<string, CharacterState>;  // Estado RPG por personaje
  relationships: Record<string, RelationshipState>; // Afinidad con NPCs
  activeTraits: string[];                  // Rasgos activos globales
  sceneCount: number;                      // Contador para expiración de traits
}

interface CharacterState {
  level: number;
  xp: number;
  skillPoints: number;
  skills: Record<string, number>;  // skillId → nivel
  traits: string[];                // Traits del personaje
  stats: Record<string, number>;   // Stats propias (HP, atk, etc.)
}
```

### Inicialización

El `PlayerState` se crea desde el `GameManifest`:
- `stats` ← `manifest.initialStats`
- `flags` ← `manifest.initialFlags`
- `inventory` ← `manifest.initialInventory`
- `characters` ← se crean `CharacterState` para personajes con `role: 'protagonist'` o `'companion'`, usando `baseStats`, `initialTraits` del manifest

---

## 10. Comunicación Motor ↔ UI (StepResult / PlayerAction)

**Archivo:** `src/types/engine.ts`

### StepResult (Motor → UI)

El motor yield-ea estos tipos. La UI renderiza cada uno según su tipo.

| Tipo | Requiere input | Descripción |
|---|---|---|
| `scenario` | No | Cambio de escena (nombre, descripción, imagen, música) |
| `dialog` | No* | Diálogo de personaje (espera Enter) |
| `choice_prompt` | Sí | Opciones para elegir |
| `dice_prompt` | Sí | Solicitud de tirar dados |
| `dice_result` | No | Resultado de la tirada |
| `input_prompt` | Sí | Solicitud de texto libre |
| `effects` | No | Efectos aplicados (para debug/sync) |
| `navigate` | No | Ir a otra escena |
| `game_end` | No | Fin del juego |
| `check_result` | No | Resultado de comprobación |
| `random_result` | No | Resultado aleatorio |
| `shop_prompt` | Sí | Interfaz de tienda |
| `combat_prompt` | Sí | Turno de combate |
| `combat_turn` | No | Resultado de un turno |
| `combat_end` | No | Fin del combate |
| `notify` | No | Notificación visual |
| `wait` | No | Pausa dramática |
| `sound` | No | Reproducir sonido |
| `craft_prompt` | Sí | Interfaz de crafting |
| `craft_result` | No | Resultado del craft |
| `puzzle_prompt` | Sí | Interfaz de puzzle |
| `puzzle_attempt` | No | Resultado de intento |
| `examine_prompt` | Sí | Interfaz de examinar |
| `examine_result` | No | Texto de examen |
| `use_item_prompt` | Sí | Interfaz de usar item |
| `use_item_result` | No | Resultado de uso |
| `timed_choice_prompt` | Sí | Opciones con timer |
| `level_up_prompt` | Sí | Interfaz de level up |
| `level_up_result` | No | Resultado del level up |
| `xp_gain` | No | Ganancia de XP |
| `relationship_change` | No | Cambio de afinidad |
| `trait_change` | No | Rasgos ganados/perdidos |

### PlayerAction (UI → Motor)

Acciones que la UI envía cuando el motor espera input:

```typescript
type PlayerAction =
  | { type: 'choose'; index: number }           // Elegir opción
  | { type: 'roll_dice' }                        // Tirar dado
  | { type: 'submit_input'; value: string }      // Enviar texto
  | { type: 'continue' }                         // Continuar
  | { type: 'shop_buy'; itemIndex: number }      // Comprar item
  | { type: 'shop_sell'; itemId: string }         // Vender item
  | { type: 'shop_exit' }                        // Salir de tienda
  | { type: 'combat_action'; action: string }    // Acción de combate
  | { type: 'craft_combine'; items: string[] }   // Combinar items
  | { type: 'craft_exit' }                       // Salir de craft
  | { type: 'puzzle_attempt'; answer: string | string[] }  // Intentar puzzle
  | { type: 'puzzle_exit' }                      // Rendirse en puzzle
  | { type: 'examine_select'; subjectId: string } // Examinar sujeto
  | { type: 'examine_exit' }                     // Dejar de examinar
  | { type: 'use_item_on'; itemId: string; targetId: string } // Usar item
  | { type: 'use_item_exit' }                    // Dejar de intentar
  | { type: 'level_up_skill'; skillId: string }  // Aprender skill
  | { type: 'level_up_done' }                    // Terminar level up
```

---

## 11. Game Loop (useGameLoop)

**Archivo:** `src/hooks/useGameLoop.ts` (545 líneas)

El hook que conecta el `GameEngine` con la UI de React.

### Flujo

```
startScene(sceneId)
  └─ engine.enterScene(sceneId)  →  AsyncGenerator<StepResult>
       └─ consumeResults(iterator)
            │
            ├─ Para cada StepResult:
            │   └─ handleResult(result)
            │        ├─ scenario → actualiza imagen/música, muestra header
            │        ├─ dialog → muestra líneas, espera Enter
            │        ├─ *_prompt → guarda en pendingResult, para el loop
            │        ├─ dice_result → muestra resultado, espera Enter
            │        ├─ effects → sync estado
            │        ├─ combat_turn → muestra turno
            │        ├─ navigate → detecta destinos especiales o llama startScene
            │        └─ (etc para cada tipo)
            │
            └─ Al final: sync playerState al store

sendAction(action)
  └─ engine.sendAction(action)
       └─ Continúa consumeResults (el iterador estaba pausado)
```

### Destinos especiales de navigate

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego y vuelve a shell |
| `_game_over` | Muestra pantalla de Game Over |
| `_restart` | Reinicia el juego completo y va a `start` |
| cualquier otro | Navega a esa escena |

### Interacción con la terminal

- Los diálogos esperan que el jugador pulse **Enter** o **toque la pantalla**
- Los prompts (`choice`, `dice`, etc.) se guardan en `pendingResult` en el store
- Los widgets de la UI leen `pendingResult` y muestran la interfaz correspondiente
- Al interactuar, los widgets llaman `sendAction` y el loop continúa

---

## 12. Terminal y Comandos

**Archivos:** `src/hooks/useTerminalCommands.ts`, `src/engine/CommandParser.ts`

### Comandos de Shell (fase `shell`)

Disponibles cuando no hay juego en ejecución. Funcionan con o sin prefijo `/`.

| Comando | Descripción |
|---|---|
| `help` | Lista de comandos con sarcasmo |
| `clear` | Limpia la terminal |
| `version` | Versión del motor |
| `about` | Pantalla About con música y animación |
| `run [juego]` | Carga y ejecuta un juego |
| `list` | Lista juegos disponibles |
| `editor [juego]` | Abre el editor visual (opcionalmente carga un juego) |
| `create` | Alias de `editor` |
| `debug [on\|off\|status\|history\|clear\|report]` | Sistema de depuración |
| `quit` / `exit` | Cierra sesión |

### Comandos In-Game (fase `game`)

Disponibles durante la partida. **Requieren prefijo `/`** para distinguirlos del input de widgets (selección de opciones, tiradas, etc.). Se interceptan incluso cuando hay un widget activo (choice, shop, dice, etc.).

| Comando | Descripción |
|---|---|
| `/help` | Ayuda específica de la partida (comandos disponibles durante el juego) |
| `/about` | Información del juego actual (nombre, descripción, versión, autor del manifest) |
| `/history` | Muestra el historial narrativo de la partida (últimas 50 entradas: diálogos, opciones, eventos) |
| `/clear` | Limpia la terminal conservando el último bloque de diálogo activo (desde el último `dialogHeader`) |
| `/save` | Guarda la partida en un slot (ver [Sistema de Guardado](#22-sistema-de-guardado)) |
| `/load` | Carga una partida guardada desde un slot |
| `/version` | Versión del motor |
| `/debug` | Sistema de depuración (funciona igual que en shell) |
| `/quit` / `/exit` | Sale de la partida y vuelve a la shell (no cierra sesión) |

**Comandos bloqueados durante la partida:** `run`, `list`, `editor`, `create` — muestran aviso de que hay una partida activa.

### Interceptación de comandos in-game

En `App.tsx`, el flujo de `handleSubmit()` chequea si el input empieza con `/` **antes** de procesarlo como input de widget:

```
input empieza con "/"?
  → SÍ: processCommand() (comandos in-game)
  → NO: procesar como input de widget (número, texto, etc.)
```

Esto permite escribir `/help` incluso estando en una pantalla de selección de opciones, tienda, combate, etc.

### CommandParser

Simplemente separa nombre y argumentos:
```
"run demo" → { name: "run", args: ["demo"] }
"/editor demo" → { name: "editor", args: ["demo"] }
```

---

## 13. Rich Text (formato de texto)

**Archivo:** `src/utils/richTextParser.ts`

El motor usa un formato de texto inspirado en Rich (Python) para dar color y estilo al texto de la terminal.

### Tags disponibles

| Tag | Efecto |
|---|---|
| `[bold]texto[/bold]` | Negrita |
| `[italic]texto[/italic]` | Cursiva |
| `[dim]texto[/dim]` | Atenuado (opacidad reducida) |
| `[red]texto[/red]` | Color rojo |
| `[green]texto[/green]` | Color verde |
| `[blue]texto[/blue]` | Color azul |
| `[yellow]texto[/yellow]` | Color amarillo |
| `[purple]texto[/purple]` | Color púrpura |
| `[cyan]texto[/cyan]` | Color cian |
| `[white]texto[/white]` | Color blanco |
| `[orange]texto[/orange]` | Color naranja |
| `[pink]texto[/pink]` | Color rosa |

### Tags compuestos

Se pueden combinar en un solo tag:
```
[bold red]Texto rojo y negrita[/bold red]
[bold italic green]Triple formato[/bold italic green]
```

### Emojis

Atajos de emoji soportados:
```
:snail: → 🐌    :castle: → 🏰    :sword: → ⚔️
:shield: → 🛡️   :skull: → 💀     :star: → ⭐
:fire: → 🔥     :gem: → 💎       :key: → 🔑
:potion: → 🧪
```

### Mapa de colores

```
red     → #ff5555
green   → #50fa7b
blue    → #8be9fd
yellow  → #f1fa8c
purple  → #bd93f9
cyan    → #8be9fd
white   → #ffffff
orange  → #ffb86c
pink    → #ff79c6
```

---

## 14. Store Global (Zustand)

**Archivo:** `src/store/useAppStore.ts`

Store centralizado que maneja todo el estado de la aplicación.

### Campos principales

| Campo | Tipo | Descripción |
|---|---|---|
| `phase` | `AppPhase` | Fase actual de la app |
| `username` | `string` | Nombre de usuario logueado |
| `history` | `TerminalEntry[]` | Historial de la terminal |
| `commandHistory` | `string[]` | Historial de comandos (navegación con flechas) |
| `engine` | `GameEngine \| null` | Instancia del motor activo |
| `playerState` | `PlayerState \| null` | Estado del jugador (sync del motor) |
| `gameManifest` | `GameManifest \| null` | Manifest del juego activo |
| `gameBasePath` | `string` | Ruta base del juego (ej: `"games/demo"`) |
| `currentScene` | `string` | ID de la escena actual |
| `pendingResult` | `StepResult \| null` | Prompt pendiente de respuesta del jugador |
| `currentImage` | `string \| null` | Imagen del panel lateral |
| `speed` | `number` | Multiplicador de velocidad (0.5, 1, 2, 3) |
| `volume` | `number` | Volumen 0-100 |
| `fadeBeforeIndex` | `number` | Índice para atenuar entradas antiguas |
| `seenCharacters` | `Set<string>` | Personajes vistos (para animación de primera aparición) |
| `showEnterPrompt` | `boolean` | Mostrar "Presiona Enter" |
| `returnToEditor` | `boolean` | Volver al editor al cerrar juego (test mode) |

### Acciones

| Acción | Efecto |
|---|---|
| `addEntry(entry)` | Añade una entrada al historial |
| `clearHistory()` | Limpia historial |
| `fadeOldEntries()` | Atenúa entradas antiguas |
| `setEngine(engine)` | Establece el motor activo |
| `setPlayerState(state)` | Sincroniza estado del jugador |
| `setPendingResult(result)` | Establece prompt pendiente |
| `resetGame()` | Reinicia todo (engine, state, image, etc.) y vuelve a shell/editor |

### Tipos de TerminalEntry

```typescript
type TerminalEntryType =
  | 'system'        // Mensajes del sistema
  | 'command'        // Comandos del usuario
  | 'response'       // Respuestas
  | 'dialog'         // Líneas de diálogo
  | 'dialogHeader'   // Header de personaje (nombre + imagen)
  | 'option'         // Opciones interactivas
  | 'error'          // Errores
  | 'warning'        // Advertencias
  | 'info'           // Información
  | 'success'        // Éxitos
  | 'table'          // Tablas
```

---

## 15. Fases de la Aplicación

```
boot → login → shell → game
                  │        │
                  │        └─ (resetGame) → shell/editor
                  │
                  └─ editor
```

| Fase | Descripción |
|---|---|
| `boot` | Secuencia de arranque estilo Linux con mensajes animados |
| `login` | Pantalla de usuario/contraseña con comentarios sarcásticos |
| `shell` | Terminal libre donde se escriben comandos |
| `game` | Juego en ejecución (motor activo, widgets visibles) |
| `editor` | Editor visual de historias con ReactFlow |

---

## 16. Editor Visual

**Directorio:** `src/editor/` (~5.900 líneas)

Editor visual completo para crear juegos sin escribir JSON manualmente.

### Características

- **Canvas con nodos** — cada escena es un nodo, conectados por aristas que representan navegación (`goto`)
- **Drag & drop** — reposicionar escenas libremente
- **Auto-layout** — disposición automática de nodos
- **18 editores de pasos** — cada tipo de `SequenceStep` tiene su propio formulario visual
- **Preview integrado** — probar el juego directamente desde el editor
- **Validación** — detecta errores (escenas huérfanas, gotos rotos, etc.)
- **Undo/Redo** — middleware de Zustand para deshacer/rehacer
- **Export/Import** — exportar a ZIP (game.json + scenes.json + assets), importar desde JSON o ZIP
- **Asset Picker** — selector visual de imágenes y sonidos del proyecto
- **Atajos de teclado** — Ctrl+Z, Ctrl+S, Ctrl+Shift+Z, etc.
- **Templates** — escenas pre-configuradas (diálogo, combate, tienda, puzzle, etc.)
- **Nodos especiales** — `_quit`, `_game_over`, `_restart` como nodos visuales

### Store del Editor

**Archivo:** `src/editor/store/useEditorStore.ts`

Estado del editor gestionado con Zustand + middleware de undo:

```typescript
// Campos principales
project: EditorProject | null       // Proyecto actual
scenes: Record<string, Scene>       // Escenas del proyecto
nodes: SceneFlowNode[]              // Nodos de ReactFlow
edges: SceneFlowEdge[]              // Aristas de ReactFlow
selectedSceneId: string | null      // Escena seleccionada
editingScene: { id: string; scene: Scene } | null  // Escena en edición

// Acciones
addScene(id, scene)                 // Crear escena
updateScene(id, scene)              // Actualizar escena
deleteScene(id)                     // Eliminar escena
setProject(project)                 // Cargar proyecto
undo() / redo()                     // Deshacer/rehacer
```

### Validación

**Archivo:** `src/editor/utils/validation.ts`

Detecta:
- Escenas sin conexiones de entrada (huérfanas)
- `goto` apuntando a escenas inexistentes
- Escenas vacías (sin pasos)
- Diálogos con personajes no definidos
- Items referenciados no definidos
- Stats referenciadas no definidas en `initialStats`

### Export/Import

**Archivo:** `src/editor/utils/exportProject.ts`, `importProject.ts`

- **Export:** Genera un ZIP con `game.json` (manifest) + `scenes.json` + assets embebidos
- **Import:** Acepta ZIP o JSON sueltos. Puede importar juegos del formato legacy (routes/dialogs/widgets/scenarios separados) o del formato nuevo (game.json + scenes.json)

---

## 17. Cargador de Juegos

**Archivo:** `src/engine/GameLoader.ts`

### loadGame(gameName)

```typescript
async function loadGame(gameName: string): Promise<LoadedGame>
```

1. Fetch `games/{name}/game.json` (manifest) y `games/{name}/scenes.json` en paralelo
2. Valida: nombre existe, hay escenas, existe escena `start`
3. Resuelve rutas de imágenes relativas a rutas completas
4. Retorna `{ manifest, scenes }`

### listGames()

1. Intenta cargar `games/index.json` → `{ games: ["demo", ...] }`
2. Si falla, usa fallback hardcodeado
3. Para cada juego, carga su `game.json` y extrae metadatos

---

## 18. Estructura de Archivos

```
src/
├── main.tsx                          Entrada React
├── App.tsx                           Orquestador principal (201 líneas)
│
├── engine/                           Motor del juego (puro TypeScript)
│   ├── GameEngine.ts                 Núcleo: generadores, procesamiento de pasos (1.328)
│   ├── ConditionEvaluator.ts         Evaluación de condiciones (131)
│   ├── EffectsApplier.ts             Aplicación de efectos al estado (123)
│   ├── DiceRoller.ts                 Tiradas D20 con modificadores (50)
│   ├── AudioManager.ts              Gestión de música con crossfade (153)
│   ├── GameLoader.ts                 Cargador de juegos JSON (92)
│   └── CommandParser.ts              Parser de comandos (23)
│
├── types/                            Definiciones TypeScript
│   ├── game.ts                       Tipos del formato JSON (565)
│   ├── engine.ts                     Tipos del motor y StepResult/PlayerAction (366)
│   ├── terminal.ts                   Tipos de la terminal (28)
│   ├── theme.ts                      Tipos de temas (52)
│   ├── styled.d.ts                   Declaraciones styled-components (9)
│   └── file-saver.d.ts              Declaraciones file-saver (3)
│
├── hooks/                            Custom hooks
│   ├── useGameLoop.ts                Consume StepResults, renderiza en terminal (545)
│   ├── useTerminalCommands.ts        Procesamiento de comandos (385)
│   ├── useBootSequence.ts            Secuencia de arranque (108)
│   ├── useLoginFlow.ts               Flujo de login (107)
│   └── useKeyboardInput.ts           Manejo de teclado (74)
│
├── store/                            Estado global (Zustand)
│   ├── useAppStore.ts                Store principal (201)
│   └── useDebugStore.ts              Store de debugging (58)
│
├── components/                       Componentes React
│   ├── terminal/                     Sistema de terminal
│   │   ├── Terminal.tsx              Contenedor principal (116)
│   │   ├── TerminalHistory.tsx       Historial de mensajes (58)
│   │   ├── TerminalEntry.tsx         Entrada individual (132)
│   │   ├── TerminalInput.tsx         Input de usuario (99)
│   │   └── RichText.tsx              Renderizador de Rich text (35)
│   ├── game/                         Widgets de juego
│   │   ├── ChoiceWidget.tsx          Botones de opciones (54)
│   │   ├── DiceWidget.tsx            Widget de dados (128)
│   │   └── InputWidget.tsx           Widget de entrada de texto (28)
│   ├── layout/                       Layout
│   │   ├── AppShell.tsx              Shell principal (88)
│   │   ├── StatusBar.tsx             Barra de stats (187)
│   │   ├── InventoryPanel.tsx        Panel de inventario (233)
│   │   ├── ImagePanel.tsx            Panel de imagen (88)
│   │   ├── SpeedControl.tsx          Control de velocidad (105)
│   │   └── MobileWarning.tsx         Advertencia móvil (159)
│   ├── sequences/
│   │   └── BootSequence.tsx          Secuencia de boot (84)
│   └── ui/
│       └── HoverPreview.tsx          Preview en hover (94)
│
├── editor/                           Editor visual (~5.877 líneas)
│   ├── components/
│   │   ├── EditorApp.tsx             Raíz del editor (589)
│   │   ├── canvas/                   Canvas con nodos
│   │   ├── panels/                   Paneles de edición
│   │   ├── panels/steps/             18 editores de tipos de paso
│   │   ├── preview/                  Preview del juego
│   │   ├── shared/                   Componentes compartidos
│   │   └── toolbar/                  Barra de herramientas
│   ├── data/
│   │   └── sceneTemplates.ts         Templates de escenas (483)
│   ├── hooks/
│   │   ├── useEditorShortcuts.ts     Atajos de teclado (139)
│   │   └── useProjectContext.ts      Contexto del proyecto (94)
│   ├── store/
│   │   ├── useEditorStore.ts         Store del editor (538)
│   │   └── undoMiddleware.ts         Middleware undo/redo (51)
│   ├── types/
│   │   └── editor.ts                 Tipos del editor (209)
│   └── utils/
│       ├── validation.ts             Validación de proyectos (344)
│       ├── importProject.ts          Importación (220)
│       ├── exportProject.ts          Exportación (174)
│       ├── autoLayout.ts             Auto-layout de nodos (87)
│       ├── assetStorage.ts           Almacenamiento de assets (49)
│       └── editorStorage.ts          Persistencia del editor (42)
│
├── styles/                           Estilos
│   ├── globalStyles.ts               Estilos globales (42)
│   └── themes.ts                     Temas dracula/lilac (104)
│
└── utils/                            Utilidades
    ├── richTextParser.ts             Parser de Rich text (128)
    ├── preloadAssets.ts              Precarga de imágenes (86)
    ├── storage.ts                    LocalForage wrapper (33)
    └── delay.ts                      Función delay con velocidad (4)
```

---

## 19. Stack Tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.0.0 | UI y componentes |
| TypeScript | 5.9.3 | Tipado estático |
| Vite | 6.2.0 | Bundler y dev server |
| Zustand | 5.0.11 | Estado global |
| @xyflow/react | 12.10.0 | Editor visual de nodos |
| styled-components | 6.1.17 | CSS-in-JS |
| localforage | 1.10.0 | Persistencia local (IndexedDB) |
| jszip | 3.10.1 | Compresión/descompresión de proyectos |
| file-saver | 2.0.5 | Descarga de archivos |

### Comandos de desarrollo

```bash
npm run dev      # Servidor de desarrollo (localhost:5173)
npm run build    # Build para producción
npm run preview  # Preview del build
npm run lint     # ESLint
```

---

## 20. Sistemas RPG Avanzados

### Sistema de Niveles y XP

Cada personaje con `role: 'protagonist'` o `'companion'` tiene:
- **Nivel** (empieza en 1)
- **XP** (experiencia acumulada)
- **Curva de XP**: array donde `xpCurve[i]` = XP para pasar de nivel `i+1` a `i+2`
- **Puntos de habilidad**: se ganan al subir de nivel

XP se otorga mediante efectos: `{ "xp": { "bob": 50 } }`

### Sistema de Habilidades (Skill Trees)

Cada personaje puede tener un `skillTree` asignado. Las skills:
- Tienen `maxLevel` (nivel máximo)
- Cuestan `cost` puntos de habilidad por nivel
- Pueden requerir `prerequisites` (otras skills)
- Otorgan `passiveBonus` (stats permanentes al aprender)
- Tienen `tags` para condicionales

### Sistema de Rasgos (Traits)

Los rasgos son estados que afectan al personaje:
- **Permanentes**: nunca expiran
- **Temporales**: expiran tras N escenas (`duration`)
- Pueden modificar stats (`statModifiers`)
- Pueden modificar tiradas de dados (`diceModifier`)
- Se usan en condiciones (`hasTraits`, `notTraits`)

### Sistema de Relaciones (Affinity)

Cada NPC tiene un valor de afinidad (-100 a +100) que determina su `tier`:

| Tier | Rango |
|---|---|
| Hostil | < -30 |
| Desconfiado | -30 a -10 |
| Neutral | -10 a 20 |
| Amigable | 20 a 50 |
| Aliado | 50 a 80 |
| Leal | ≥ 80 |

Se modifica con efectos: `{ "affinity": { "nerly": 10 } }`
Se evalúa en condiciones: `{ "affinity": { "nerly": ">=50" } }` o `{ "relationshipTier": { "nerly": "friendly" } }`

### Sistema de Compañeros

Los personajes con `role: 'companion'` se activan cuando su `joinFlag` es `true` en el estado. Los compañeros activos se muestran en la barra de estado.

### Stats especiales

| Stat | Efecto |
|---|---|
| `_protagonist_image` | Si se asigna como string, cambia la imagen del protagonista |

---

## 21. Navegación Especial

Los `goto` pueden apuntar a IDs de escenas normales o a destinos especiales:

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego, vuelve a la terminal shell |
| `_game_over` | Muestra pantalla de Game Over con banner |
| `_restart` | Reinicia completamente el juego (estado inicial, escena `start`) |
| `start` | Escena inicial obligatoria de todo juego |

Estos destinos se manejan en `useGameLoop.consumeResults()`.

---

## 22. Sistema de Guardado

**Archivos:** `src/utils/storage.ts`, `src/hooks/useTerminalCommands.ts`

El motor incluye un sistema de guardado persistente basado en **slots** usando IndexedDB (localforage). El creador del juego puede configurar cómo funciona el guardado a través del manifest.

### Configuración en `game.json`

```jsonc
{
  "name": "Mi Aventura",
  // ...

  // --- Sistema de guardado (opcional) ---
  "saveSystem": {
    "mode": "free",              // "free" | "checkpoint" (default: "free")
    "slots": 3,                  // Número de slots disponibles (default: 3, max: 10)
    "allowOverwrite": true,      // Permitir sobreescribir slots (default: true)
    "checkpointScenes": [        // Solo para mode: "checkpoint" — escenas donde se autoguarda
      "pueblo",
      "bosque_entrada",
      "castillo_hall"
    ]
  }
}
```

### Modos de guardado

#### `"free"` (por defecto)

El jugador puede guardar y cargar libremente en cualquier momento con `/save` y `/load`. Menú interactivo de slots.

#### `"checkpoint"`

El guardado manual está **desactivado**. El juego guarda automáticamente al completar ciertas escenas clave definidas en `checkpointScenes`. El jugador solo puede usar `/load` para volver a un checkpoint anterior.

- Si el jugador intenta `/save` en modo checkpoint, recibe un mensaje indicando que el guardado es automático.
- Al entrar a una escena listada en `checkpointScenes`, el motor autoguarda en el slot siguiente (rotación cíclica por los slots disponibles).
- El slot más reciente se marca como "último checkpoint" para carga rápida.

### Estructura del SaveData

```typescript
interface SaveData {
  playerState: PlayerState;    // Estado completo del jugador
  currentScene: string;        // Escena donde se guardó
  gameName: string;            // ID del juego
  timestamp: number;           // Fecha del guardado (Date.now())
  slotLabel?: string;          // Nombre opcional del slot
  sceneName?: string;          // Nombre legible de la escena (del scenario.name)
  isCheckpoint?: boolean;      // Si fue guardado automático por checkpoint
}
```

### Almacenamiento

- **Backend:** IndexedDB via `localforage`
- **Clave por slot:** `{gameName}:slot:{n}` (ej: `demo:slot:1`)
- **Instancia:** `calabosos-y-babosos / saves`
- Cada juego tiene sus propios slots, no se mezclan entre juegos.

### Comandos del jugador

#### `/save`

1. Si `mode === "checkpoint"`: muestra mensaje de que el guardado es automático.
2. Si `mode === "free"`:
   - Muestra menú de slots con estado (vacío / nombre de escena + fecha).
   - El jugador escribe el número del slot.
   - Si el slot tiene datos y `allowOverwrite === true`: sobreescribe con confirmación.
   - Si `allowOverwrite === false`: solo permite guardar en slots vacíos.
   - Muestra confirmación de guardado exitoso.

#### `/load`

1. Muestra menú de slots con datos guardados (slots vacíos se muestran pero no son seleccionables).
2. El jugador escribe el número del slot.
3. Pide confirmación ("Se perderá el progreso actual").
4. Restaura `PlayerState`, navega a la escena guardada, limpia el historial de terminal.

### Autoguardado en checkpoints

Cuando el motor entra a una escena listada en `checkpointScenes`:

1. Determina el siguiente slot disponible (rotación: slot 1 → 2 → 3 → 1...).
2. Guarda automáticamente con `isCheckpoint: true`.
3. Muestra notificación sutil: `[dim]Progreso guardado automáticamente.[/dim]`

### Ejemplo de flujo `/save` (modo free)

```
> /save

╔══════════════════════════════════════╗
║         GUARDAR PARTIDA              ║
╠══════════════════════════════════════╣
║  [1] Plaza Principal - 08/03 14:32  ║
║  [2] Bosque Oscuro   - 08/03 15:10  ║
║  [3] --- vacío ---                  ║
╚══════════════════════════════════════╝

Selecciona slot [1-3]:
> 3

Partida guardada en slot 3.
```

### Ejemplo de flujo `/load`

```
> /load

╔══════════════════════════════════════╗
║         CARGAR PARTIDA               ║
╠══════════════════════════════════════╣
║  [1] Plaza Principal - 08/03 14:32  ║
║  [2] Bosque Oscuro   - 08/03 15:10  ║
║  [3] --- vacío ---                  ║
╚══════════════════════════════════════╝

Selecciona slot [1-2] (0 para cancelar):
> 2

⚠ Se perderá el progreso actual. ¿Continuar? (s/n)
> s

Partida cargada. Volviendo a "Bosque Oscuro"...
```

---

## 23. Guía para Crear un Juego

### Paso 1: Crear la estructura

```
public/games/mi_juego/
├── game.json          # Manifiesto
├── scenes.json        # Escenas
├── images/            # Imágenes
│   ├── plaza.png
│   └── personaje.png
└── audio/             # Música y sonidos
    └── theme.mp3
```

### Paso 2: Crear game.json

Definir personajes, stats iniciales, items:

```json
{
  "name": "Mi Aventura",
  "description": "Una aventura de prueba",
  "author": "Yo",
  "version": "1.0.0",
  "characters": {
    "narrator": { "name": "Narrador", "role": "narrator" }
  },
  "initialStats": { "will_to_live": 100 },
  "initialFlags": {},
  "initialInventory": [],
  "time": { "duration": 5, "phases": ["morning"], "initial": "morning" }
}
```

### Paso 3: Crear scenes.json con escena `start`

```json
{
  "scenes": {
    "start": {
      "scenario": { "name": "Inicio", "description": "El comienzo..." },
      "sequence": [
        {
          "type": "dialog",
          "character": "narrator",
          "lines": ["Bienvenido a la aventura."]
        },
        {
          "type": "choice",
          "options": [
            { "text": "Explorar", "goto": "exploracion" },
            { "text": "Salir", "goto": "_quit" }
          ]
        }
      ]
    },
    "exploracion": {
      "scenario": { "name": "Exploración" },
      "sequence": [
        {
          "type": "dialog",
          "character": "narrator",
          "lines": ["Has llegado al final de la demo."]
        },
        {
          "type": "choice",
          "options": [
            { "text": "Reiniciar", "goto": "_restart" },
            { "text": "Salir", "goto": "_quit" }
          ]
        }
      ]
    }
  }
}
```

### Paso 4: Registrar en index.json

```json
{ "games": ["demo", "mi_juego"] }
```

### Paso 5: Probar

```bash
npm run dev
# En la terminal: run mi_juego
```

### Alternativa: Usar el Editor Visual

```
# En la terminal del motor:
editor
# o para editar un juego existente:
editor demo
```

El editor permite crear escenas, conectarlas visualmente, añadir pasos, y exportar el juego como ZIP.

---

## Apéndice: Ejemplo Completo de Secuencia

```jsonc
// scenes.json — Escena de la tienda
{
  "scenes": {
    "tienda": {
      "scenario": {
        "name": "Tienda de Nerly",
        "image": "images/tienda.png",
        "music": "audio/shop.mp3",
        "description": "Una tienda húmeda llena de objetos dudosos."
      },
      "sequence": [
        // 1. Diálogo de bienvenida
        {
          "type": "dialog",
          "character": "nerly",
          "lines": [
            "¡Bienvenido a mi tienda, querido!",
            "Tengo ofertas especiales para aventureros suicidas."
          ]
        },

        // 2. Diálogo condicional (solo si es la primera visita)
        {
          "type": "dialog",
          "character": "nerly",
          "lines": ["Es tu primera vez aquí, ¿verdad? Te haré un descuento."],
          "condition": { "unvisitedScenes": ["tienda"] }
        },

        // 3. Notificación si tiene reputación alta
        {
          "type": "notify",
          "style": "info",
          "title": "Descuento VIP",
          "text": "Tu reputación te precede. 20% de descuento.",
          "condition": { "stats": { "reputation": ">=80" } }
        },

        // 4. Tirada para regatear
        {
          "type": "dice",
          "stat": "reputation",
          "difficulty": 12,
          "faces": 20,
          "description": "Tirada de Regateo",
          "results": {
            "success": {
              "text": "Nerly se ríe: 'Eres bueno regateando...'",
              "effects": { "stats": { "gold": 5 }, "affinity": { "nerly": 5 } }
            },
            "failure": {
              "text": "Nerly te mira fijamente. 'Precio completo.'",
              "effects": { "affinity": { "nerly": -2 } }
            }
          }
        },

        // 5. Tienda
        {
          "type": "shop",
          "title": "Tienda de Nerly",
          "currency": "gold",
          "items": [
            { "id": "sword", "name": "Espada", "price": 15 },
            { "id": "potion", "name": "Poción", "price": 8 }
          ],
          "sellable": true,
          "sellRatio": 0.5
        },

        // 6. Despedida
        {
          "type": "dialog",
          "character": "nerly",
          "lines": ["¡Vuelve cuando quieras! O cuando puedas..."]
        },

        // 7. Opciones de salida
        {
          "type": "choice",
          "options": [
            { "text": "Ir a la plaza", "goto": "plaza" },
            { "text": "Explorar el callejón", "goto": "callejon" },
            {
              "text": "[Llave maestra] Abrir la trastienda",
              "goto": "trastienda",
              "condition": { "inventory": ["master_key"] }
            }
          ]
        }
      ]
    }
  }
}
```

---

*Documentación generada para Motor Baboso v0.1.0 — Calabosos y Babosos*
*Última actualización: 2026-03-08*
