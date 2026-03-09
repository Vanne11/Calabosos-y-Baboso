# Calabosos y Babosos - Guía para Claude

## Descripción General

**Calabosos y Babosos** es un juego de rol narrativo interactivo basado en texto con mecánicas de D&D. El proyecto combina:

- Narrativa ramificada con múltiples caminos y decisiones
- Sistema de tiradas de dados (D20) con modificadores de estadísticas
- Humor satírico con un narrador que rompe la cuarta pared
- Tema fantástico centrado en babosas como antagonistas principales
- Motor terminal interactivo basado en React + TypeScript para navegador
- Editor visual de historias con ReactFlow
- 18 tipos de pasos narrativos (diálogo, combate, tienda, puzzle, crafting, etc.)
- Sistemas RPG: niveles, XP, árboles de habilidades, rasgos, relaciones

**Objetivo del juego**: Derrotar al Rey Baboso en el "Abismo de las Babosas" en el reino de Viscaria, controlando al protagonista "BOB".

> **Documentación técnica completa**: ver `motor_web/DOCS.md` (referencia exhaustiva del motor, tipos, API, formato JSON, etc.)

---

## Stack Tecnológico

### Motor Web (Producción — motor_web/)

- **React 19** + **TypeScript 5.9** — UI y tipado
- **Vite 6.2** — bundler y dev server
- **Zustand 5.0** — estado global
- **@xyflow/react 12.10** — editor visual de nodos
- **styled-components 6.1** — CSS-in-JS
- **localforage** — persistencia local (IndexedDB)
- **jszip + file-saver** — export/import de proyectos

### Versión Terminal (Python — Legacy en back/)
- Python 3.x con `rich` y `PIL/Pillow`

---

## Arquitectura del Motor

```
React UI (componentes, widgets, terminal)
    ↕ useGameLoop (consume StepResults, envía PlayerActions)
    ↕ Zustand Store (useAppStore)
    ↕
GameEngine (puro TypeScript, async generators)
    ├── ConditionEvaluator
    ├── EffectsApplier
    ├── DiceRoller
    └── AudioManager
```

**Principio clave**: El `GameEngine` es puro TypeScript sin dependencias de React. Usa `async *enterScene()` como generador que yield-ea `StepResult` (datos para la UI). La UI responde con `sendAction(PlayerAction)` cuando necesita input del jugador.

---

## Estructura del Proyecto

```
Calabosos-y-Baboso/
├── motor_web/                      MOTOR WEB OFICIAL (~18.000 líneas TS)
│   ├── DOCS.md                     Documentación técnica completa
│   ├── src/
│   │   ├── engine/                 Motor puro TypeScript
│   │   │   ├── GameEngine.ts       Núcleo (1.328 líneas)
│   │   │   ├── ConditionEvaluator.ts
│   │   │   ├── EffectsApplier.ts
│   │   │   ├── DiceRoller.ts
│   │   │   ├── AudioManager.ts
│   │   │   ├── GameLoader.ts
│   │   │   └── CommandParser.ts
│   │   ├── types/                  Definiciones TypeScript
│   │   │   ├── game.ts            Tipos del formato JSON (565 líneas)
│   │   │   ├── engine.ts          StepResult, PlayerAction, PlayerState
│   │   │   └── terminal.ts
│   │   ├── hooks/                  Custom hooks
│   │   │   ├── useGameLoop.ts     Game loop principal (545)
│   │   │   ├── useTerminalCommands.ts
│   │   │   ├── useBootSequence.ts
│   │   │   └── useLoginFlow.ts
│   │   ├── store/                  Zustand stores
│   │   │   ├── useAppStore.ts     Store principal
│   │   │   └── useDebugStore.ts
│   │   ├── components/             Componentes React
│   │   │   ├── terminal/          Terminal (history, input, rich text)
│   │   │   ├── game/             Widgets (choice, dice, input)
│   │   │   └── layout/           Layout (statusbar, inventory, image)
│   │   ├── editor/                 Editor visual (~5.900 líneas)
│   │   │   ├── components/        Canvas, paneles, 18 editores de pasos
│   │   │   ├── store/            Store con undo/redo
│   │   │   ├── utils/            Validación, export, import
│   │   │   └── types/            Tipos del editor
│   │   ├── styles/                 Temas (dracula, lilac)
│   │   └── utils/                  Rich text parser, delay, storage
│   └── public/games/               Juegos disponibles
│       ├── index.json
│       └── demo/                   Juego demo completo
│           ├── game.json          Manifiesto
│           ├── scenes.json        Escenas
│           ├── images/
│           └── audio/
│
├── back/                           Backend Python (legacy)
│   ├── main.py                     Motor terminal original
│   ├── dialogos/                   Datos JSON formato antiguo
│   └── historia/                   Documentación narrativa
│
└── CLAUDE.md                       Este archivo
```

---

## Formato de Datos del Juego

Un juego se compone de 2 archivos JSON en `public/games/{nombre}/`:

### game.json (GameManifest)

```jsonc
{
  "name": "Nombre",
  "description": "...",
  "author": "...",
  "version": "1.0.0",
  "characters": {
    "narrator": { "name": "Narrador", "role": "narrator" },
    "bob": { "name": "BOB", "role": "protagonist", "image": "images/bob.png" }
  },
  "initialStats": { "will_to_live": 100, "gold": 20 },
  "initialFlags": {},
  "initialInventory": [],
  "time": { "duration": 5, "phases": ["morning", "afternoon", "night"], "initial": "morning" },
  "items": { "sword": { "name": "Espada", "description": "..." } },
  "skillTrees": { ... },
  "traits": { ... },
  "saveSystem": { "mode": "free", "slots": 3 }
}
```

### scenes.json (ScenesFile)

```jsonc
{
  "scenes": {
    "start": {                          // OBLIGATORIO: escena inicial
      "scenario": { "name": "Inicio", "image": "images/plaza.png", "music": "audio/theme.mp3" },
      "sequence": [
        { "type": "dialog", "character": "narrator", "lines": ["Bienvenido."] },
        { "type": "choice", "options": [
          { "text": "Explorar", "goto": "exploracion" },
          { "text": "Salir", "goto": "_quit" }
        ]}
      ]
    }
  }
}
```

---

## 18 Tipos de Pasos (SequenceStep)

| Tipo | Descripción | Input |
|---|---|---|
| `dialog` | Diálogo de personaje | No (espera Enter) |
| `choice` | Opciones del jugador | Sí |
| `dice` | Tirada D20 con modificadores | Sí |
| `input` | Entrada de texto libre | Sí |
| `effects` | Aplicar efectos silenciosamente | No |
| `branch` | Bifurcación automática por condiciones | No |
| `random` | Resultado aleatorio con pesos | No |
| `check` | Comprobación determinista de stat | No |
| `shop` | Interfaz de tienda compra/venta | Sí |
| `combat` | Combate por turnos | Sí |
| `notify` | Notificación visual | No |
| `wait` | Pausa dramática | No |
| `sound` | Efecto de sonido | No |
| `craft` | Combinar items | Sí |
| `puzzle` | Acertijo (code/riddle/lock/sequence) | Sí |
| `examine` | Inspeccionar entorno | Sí |
| `use_item` | Usar item en objetivo (estilo LucasArts) | Sí |
| `timed_choice` | Opciones con temporizador | Sí |
| `level_up` | Pantalla de subir nivel / skills | Sí |

> Referencia completa con ejemplos JSON: ver `motor_web/DOCS.md` sección 4.

---

## Sistema de Condiciones (StepCondition)

Lógica AND — todas las reglas deben cumplirse:

```jsonc
{
  "stats": { "perception": ">=50" },
  "flags": { "intro_done": true },
  "inventory": ["sword"],
  "visitedScenes": ["tienda"],
  "unvisitedScenes": ["final"],
  "skillLevel": { "fireball": ">=2" },
  "affinity": { "nerly": ">=50" },
  "hasTraits": ["valiente"],
  "notTraits": ["envenenado"],
  "characterLevel": { "bob": ">=3" },
  "relationshipTier": { "nerly": "friendly" }
}
```

Operadores: `>=`, `<=`, `>`, `<`, `==`, `!=` (default: `>=`).

---

## Sistema de Efectos (Effects)

```jsonc
{
  "stats": { "gold": 10 },            // Suma relativa
  "setStats": { "gold": 100 },        // Asignación absoluta
  "flags": { "door_opened": true },
  "inventory": ["sword"],             // Añadir
  "removeInventory": ["old_key"],     // Quitar
  "clearInventory": true,             // Vaciar todo
  "xp": { "bob": 50 },               // Dar XP
  "affinity": { "nerly": 10 },        // Cambiar afinidad (-100 a 100)
  "addTraits": ["envenenado"],
  "removeTraits": ["maldito"],
  "learnSkill": { "fireball": 1 },
  "giveSkillPoints": { "bob": 2 }
}
```

---

## Navegación Especial (goto)

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego, vuelve a shell |
| `_game_over` | Pantalla de Game Over |
| `_restart` | Reinicia completamente el juego |
| `start` | Escena inicial obligatoria |
| cualquier ID | Navega a esa escena |

---

## Fases de la Aplicación

```
boot → login → shell → game
                 └──── editor
```

| Fase | Descripción |
|---|---|
| `boot` | Arranque estilo Linux animado |
| `login` | Usuario/contraseña sarcástico |
| `shell` | Terminal libre (comandos: help, run, list, editor, debug, quit) |
| `game` | Juego ejecutándose |
| `editor` | Editor visual de historias |

---

## Comandos de Terminal

### Shell (sin juego activo)

| Comando | Descripción |
|---|---|
| `help` | Lista de comandos |
| `run [juego]` | Ejecuta un juego |
| `list` | Lista juegos disponibles |
| `editor [juego]` | Abre editor visual |
| `debug [on\|off\|status\|report]` | Sistema de depuración |
| `clear` | Limpia terminal |
| `version` | Versión del motor |
| `about` | Pantalla About con música |
| `quit` / `exit` | Cierra sesión |

### In-Game (durante partida, requieren prefijo `/`)

| Comando | Descripción |
|---|---|
| `/help` | Ayuda de la partida |
| `/about` | Info del juego actual (manifest) |
| `/history` | Historial narrativo (últimas 50 entradas) |
| `/clear` | Limpia terminal conservando último diálogo |
| `/save` | Guardar partida en slot |
| `/load` | Cargar partida desde slot |
| `/debug` | Sistema de depuración |
| `/quit` / `/exit` | Sale de la partida |

---

## Rich Text (formato de texto)

Tags: `[bold]`, `[italic]`, `[dim]`, `[red]`, `[green]`, `[blue]`, `[yellow]`, `[purple]`, `[cyan]`, `[white]`, `[orange]`, `[pink]`

Compuestos: `[bold red]texto[/bold red]`

Emojis: `:snail:` → 🐌, `:castle:` → 🏰, `:sword:` → ⚔️, `:skull:` → 💀, etc.

---

## Convenciones de Código

- TypeScript estricto en todo el motor
- Componentes funcionales React con hooks
- styled-components para estilos
- Zustand para estado global
- Nombres en snake_case para IDs de escenas, items, stats
- camelCase para código TypeScript
- El GameEngine es puro TS (sin React, sin DOM)
- Generadores asíncronos para el flujo del juego
- Toda la narrativa en JSON, el código solo ejecuta

---

## Comandos de Desarrollo

```bash
cd motor_web
npm install          # Primera vez
npm run dev          # Desarrollo (localhost:5173)
npm run build        # Build producción
npm run lint         # ESLint
```

---

## Ramas Git

- **main**: Rama principal estable
- **cyb-web**: Desarrollo activo del motor web

---

## Estado Actual

- **~18.000 líneas** de TypeScript
- **18 tipos de pasos** narrativos
- **Editor visual completo** con ReactFlow
- **Sistemas RPG**: niveles, XP, skills, traits, relaciones
- **Juego demo** funcional
- **Versión terminal** (Python) legacy en `back/`

---

**Última actualización**: 2026-03-08
**Rama activa**: cyb-web
**Autor**: Nicolás y Vanessa
