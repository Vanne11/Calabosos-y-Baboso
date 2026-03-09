← [Volver al índice](README.md)

# Arquitectura General

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

## Principios clave

- **GameEngine es puro TypeScript** — sin dependencias de React, DOM o browser
- **Generadores asíncronos** — `enterScene()` es un `async *generator` que `yield`ea resultados paso a paso
- **Comunicación bidireccional** — el motor `yield`ea `StepResult` (datos para la UI), la UI responde con `sendAction(PlayerAction)` cuando necesita input del jugador
- **Estado inmutable en la UI** — el motor muta su propio `PlayerState`, la UI recibe copias vía Zustand
- **Separación datos/lógica** — toda la narrativa vive en JSON (`game.json` + `scenes.json`), el código solo ejecuta
