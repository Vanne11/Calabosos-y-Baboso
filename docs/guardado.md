← [Volver al índice](README.md)

# Sistema de Guardado

**Archivos:** `src/utils/storage.ts`, `src/hooks/useTerminalCommands.ts`

El motor incluye un sistema de guardado persistente basado en **slots** usando IndexedDB (localforage). El creador del juego puede configurar cómo funciona el guardado a través del manifest.

## Configuración en `game.json`

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

## Modos de guardado

### `"free"` (por defecto)

El jugador puede guardar y cargar libremente en cualquier momento con `/save` y `/load`. Menú interactivo de slots.

### `"checkpoint"`

El guardado manual está **desactivado**. El juego guarda automáticamente al completar ciertas escenas clave definidas en `checkpointScenes`. El jugador solo puede usar `/load` para volver a un checkpoint anterior.

- Si el jugador intenta `/save` en modo checkpoint, recibe un mensaje indicando que el guardado es automático.
- Al entrar a una escena listada en `checkpointScenes`, el motor autoguarda en el slot siguiente (rotación cíclica por los slots disponibles).
- El slot más reciente se marca como "último checkpoint" para carga rápida.

## Estructura del SaveData

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

## Almacenamiento

- **Backend:** IndexedDB via `localforage`
- **Clave por slot:** `{gameName}:slot:{n}` (ej: `demo:slot:1`)
- **Instancia:** `calabosos-y-babosos / saves`
- Cada juego tiene sus propios slots, no se mezclan entre juegos.

## Comandos del jugador

### `/save`

1. Si `mode === "checkpoint"`: muestra mensaje de que el guardado es automático.
2. Si `mode === "free"`:
   - Muestra menú de slots con estado (vacío / nombre de escena + fecha).
   - El jugador escribe el número del slot.
   - Si el slot tiene datos y `allowOverwrite === true`: sobreescribe con confirmación.
   - Si `allowOverwrite === false`: solo permite guardar en slots vacíos.
   - Muestra confirmación de guardado exitoso.

### `/load`

1. Muestra menú de slots con datos guardados (slots vacíos se muestran pero no son seleccionables).
2. El jugador escribe el número del slot.
3. Pide confirmación ("Se perderá el progreso actual").
4. Restaura `PlayerState`, navega a la escena guardada, limpia el historial de terminal.

## Autoguardado en checkpoints

Cuando el motor entra a una escena listada en `checkpointScenes`:

1. Determina el siguiente slot disponible (rotación: slot 1 → 2 → 3 → 1...).
2. Guarda automáticamente con `isCheckpoint: true`.
3. Muestra notificación sutil: `[dim]Progreso guardado automáticamente.[/dim]`

## Ejemplo de flujo `/save` (modo free)

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

## Ejemplo de flujo `/load`

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
