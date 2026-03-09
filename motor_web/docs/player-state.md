← [Volver al índice](README.md)

# Estado del Jugador (PlayerState)

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

## Inicialización

El `PlayerState` se crea desde el `GameManifest`:
- `stats` ← `manifest.initialStats`
- `flags` ← `manifest.initialFlags`
- `inventory` ← `manifest.initialInventory`
- `characters` ← se crean `CharacterState` para personajes con `role: 'protagonist'` o `'companion'`, usando `baseStats`, `initialTraits` del manifest
