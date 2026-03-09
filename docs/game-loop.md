← [Volver al índice](README.md)

# Game Loop (useGameLoop)

**Archivo:** `src/hooks/useGameLoop.ts` (545 líneas)

El hook que conecta el `GameEngine` con la UI de React.

## Flujo

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

## Destinos especiales de navigate

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego y vuelve a shell |
| `_game_over` | Muestra pantalla de Game Over |
| `_restart` | Reinicia el juego completo y va a `start` |
| cualquier otro | Navega a esa escena |

## Interacción con la terminal

- Los diálogos esperan que el jugador pulse **Enter** o **toque la pantalla**
- Los prompts (`choice`, `dice`, etc.) se guardan en `pendingResult` en el store
- Los widgets de la UI leen `pendingResult` y muestran la interfaz correspondiente
- Al interactuar, los widgets llaman `sendAction` y el loop continúa
