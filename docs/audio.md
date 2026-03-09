← [Volver al índice](README.md)

# Sistema de Audio

**Archivo:** `src/engine/AudioManager.ts`

## Características

- **Singleton** global: `audioManager`
- **Crossfade** entre pistas de música (1.5s de transición)
- **Auto-unlock** del audio en la primera interacción del usuario
- **Loop** automático de la música
- **Efectos de sonido** one-shot separados (via `SoundStep`)

## API

```typescript
audioManager.play(src)    // Reproduce música con crossfade
audioManager.stop()       // Para con fade out
audioManager.pause()      // Pausa
audioManager.resume()     // Reanuda
audioManager.volume = 0.5 // Volumen (0-1)
```

## Flujo

1. La escena define `scenario.music` → el `GameEngine` yield-ea un `ScenarioResult` con `music`
2. `useGameLoop` detecta `result.music` → llama `audioManager.play(src)`
3. Si la música es la misma que la actual, no hace nada
4. Si es diferente, hace crossfade de la anterior a la nueva
5. Al salir del juego (`resetGame`), `audioManager.stop()`
