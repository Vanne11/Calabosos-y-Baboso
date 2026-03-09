← [Volver al índice](README.md)

# El Motor (GameEngine)

**Archivo:** `src/engine/GameEngine.ts` (1.328 líneas)

## Constructor

```typescript
const engine = new GameEngine(manifest, scenes, basePath);
// manifest: GameManifest — datos del juego
// scenes: ScenesFile — escenas
// basePath: string — ruta base para resolver assets (ej: "games/demo")
```

## API Pública

| Método / Propiedad | Tipo | Descripción |
|---|---|---|
| `enterScene(sceneId)` | `AsyncGenerator<StepResult>` | Generador principal: entra en una escena y yield-ea resultados |
| `sendAction(action)` | `void` | Envía una acción del jugador al motor |
| `reset()` | `void` | Reinicia al estado inicial |
| `state` | `PlayerState` | Estado actual del jugador (readonly) |
| `currentScene` | `string` | ID de la escena actual |
| `characters` | `Record<string, CharacterDef>` | Definiciones de personajes |
| `gameName` | `string` | Nombre del juego |
| `items` | `Record<string, ItemDef>` | Definiciones de items |
| `currentSceneImage` | `string \| undefined` | Imagen de la escena actual |
| `currentSceneMusic` | `string \| undefined` | Música de la escena actual |
| `getActiveCompanions()` | `Array` | Compañeros activos (joinFlag == true) |
| `getProtagonist()` | `Object \| null` | Datos del protagonista |
| `getRelationshipTier(charId)` | `string` | Tier de relación con NPC |
| `getCharacterState(charId)` | `CharacterState` | Estado RPG de un personaje |
| `skillTrees` | `Record` | Árboles de habilidades |
| `traitDefs` | `Record` | Definiciones de rasgos |

## Flujo de ejecución

```
enterScene("plaza")
  │
  ├─ Marca escena como visitada
  ├─ Incrementa sceneCount
  ├─ Expira traits temporales
  │
  ├─ yield ScenarioResult (nombre, descripción, imagen, música)
  │
  └─ Para cada paso en scene.sequence:
       │
       ├─ Evalúa step.condition → si false, skip
       │
       └─ processStep(step) → yield* (delega al sub-generador)
            │
            ├─ yield StepResult (datos para la UI)
            ├─ Si requiere input: yield prompt, await waitForAction()
            ├─ Aplica efectos si hay
            └─ Si hay goto: return { type: 'navigate', scene: goto }
                 │
                 └─ consumeResults detecta navigate → llama startScene(goto)
```

## Mecanismo de pausa/reanudación

El motor usa un patrón de **Promise bridge** para pausar la ejecución del generador:

```typescript
// Motor: se pausa esperando input del jugador
const action = await this.waitForAction();

// UI: envía la respuesta del jugador
engine.sendAction({ type: 'choose', index: 0 });
```

Internamente:
1. `waitForAction()` crea una `Promise` y guarda el `resolve` en `_actionResolver`
2. `sendAction()` llama al `resolve` guardado, desbloqueando el generador
3. Si `sendAction` se llama antes de `waitForAction`, la acción se buferea en `_pendingAction`
