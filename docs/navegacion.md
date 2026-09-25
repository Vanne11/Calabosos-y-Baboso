← [Volver al índice](README.md)

# Navegación Especial

Los `goto` pueden apuntar a IDs de escenas normales o a destinos especiales:

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego, vuelve a la terminal shell |
| `_game_over` | Muestra pantalla de Game Over con banner |
| `_restart` | Reinicia completamente el juego (estado inicial, escena `start`) |
| `_age_accept` | Registra que el jugador aceptó el control de edad y va a `start` |
| `_checkpoint` | Vuelve al último punto seguro (`effects.checkpoint`); si no hay, reinicia desde `start` |
| `start` | Escena inicial obligatoria de todo juego |

Estos destinos se manejan en `useGameLoop.consumeResults()`.

## Control de edad (`contentRating`)

Si `game.json` define `contentRating`, `useGameLoop.startGame()` pasa por una escena de control de edad **antes de `start`**, salvo que el jugador ya la haya aceptado (se guarda por juego y por `minAge` en localforage, store `meta`, vía `utils/metaStorage.ts`).

- **Escena propia** (`contentRating.gateScene`): una escena normal del juego, con su narrador y su humor. Aceptar debe hacer `goto: "_age_accept"`; rechazar puede ir a cualquier escena (por ejemplo un final de burla que termine en `_quit`).
- **Escena genérica** (sin `gateScene`): el `GameLoader` inyecta `_age_gate` con el narrador del juego, las `warnings` y dos opciones (aceptar → `_age_accept`, rechazar → `_quit`).
- `_restart` y cargar partida no vuelven a preguntar.
- Para volver a ver el control en desarrollo: borrar la clave `<juego>:age_gate:<edad>` del store `meta` de IndexedDB (`calabosos-y-babosos`).

## Puntos seguros (`checkpoint`)

`effects: { "checkpoint": true }` guarda una copia del estado del jugador y la escena actual en `PlayerState.checkpoint` (se guarda con la partida). Ir a `_checkpoint` restaura esa copia y vuelve a esa escena.

- Los **contadores meta** no se restauran (las muertes siguen contando, y el narrador lo sabe).
- Uso típico: al inicio de cada acto y en los "hubs"; la escena de muerte ofrece «Volver al último punto seguro».
