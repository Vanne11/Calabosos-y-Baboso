← [Volver al índice](README.md)

# Store Global (Zustand)

**Archivo:** `src/store/useAppStore.ts`

Store centralizado que maneja todo el estado de la aplicación.

## Campos principales

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

## Acciones

| Acción | Efecto |
|---|---|
| `addEntry(entry)` | Añade una entrada al historial |
| `clearHistory()` | Limpia historial |
| `fadeOldEntries()` | Atenúa entradas antiguas |
| `setEngine(engine)` | Establece el motor activo |
| `setPlayerState(state)` | Sincroniza estado del jugador |
| `setPendingResult(result)` | Establece prompt pendiente |
| `resetGame()` | Reinicia todo (engine, state, image, etc.) y vuelve a shell/editor |

## Tipos de TerminalEntry

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
