← [Volver al índice](README.md)

# Navegación Especial

Los `goto` pueden apuntar a IDs de escenas normales o a destinos especiales:

| Destino | Efecto |
|---|---|
| `_quit` | Cierra el juego, vuelve a la terminal shell |
| `_game_over` | Muestra pantalla de Game Over con banner |
| `_restart` | Reinicia completamente el juego (estado inicial, escena `start`) |
| `start` | Escena inicial obligatoria de todo juego |

Estos destinos se manejan en `useGameLoop.consumeResults()`.
