← [Volver al índice](README.md)

# Cargador de Juegos (GameLoader)

**Archivo:** `src/engine/GameLoader.ts`

## loadGame(gameName)

```typescript
async function loadGame(gameName: string): Promise<LoadedGame>
```

1. Fetch `games/{name}/game.json` (manifest) y `games/{name}/scenes.json` en paralelo
2. Valida: nombre existe, hay escenas, existe escena `start`
3. Resuelve rutas de imágenes relativas a rutas completas
4. Retorna `{ manifest, scenes }`

## listGames()

1. Intenta cargar `games/index.json` → `{ games: ["demo", ...] }`
2. Si falla, usa fallback hardcodeado
3. Para cada juego, carga su `game.json` y extrae metadatos
