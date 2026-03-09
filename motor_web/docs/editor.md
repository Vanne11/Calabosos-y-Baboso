← [Volver al índice](README.md)

# Editor Visual

**Directorio:** `src/editor/` (~5.900 líneas)

Editor visual completo para crear juegos sin escribir JSON manualmente.

## Características

- **Canvas con nodos** — cada escena es un nodo, conectados por aristas que representan navegación (`goto`)
- **Drag & drop** — reposicionar escenas libremente
- **Auto-layout** — disposición automática de nodos
- **18 editores de pasos** — cada tipo de `SequenceStep` tiene su propio formulario visual
- **Preview integrado** — probar el juego directamente desde el editor
- **Validación** — detecta errores (escenas huérfanas, gotos rotos, etc.)
- **Undo/Redo** — middleware de Zustand para deshacer/rehacer
- **Export/Import** — exportar a ZIP (game.json + scenes.json + assets), importar desde JSON o ZIP
- **Asset Picker** — selector visual de imágenes y sonidos del proyecto
- **Atajos de teclado** — Ctrl+Z, Ctrl+S, Ctrl+Shift+Z, etc.
- **Templates** — escenas pre-configuradas (diálogo, combate, tienda, puzzle, etc.)
- **Nodos especiales** — `_quit`, `_game_over`, `_restart` como nodos visuales

## Store del Editor

**Archivo:** `src/editor/store/useEditorStore.ts`

Estado del editor gestionado con Zustand + middleware de undo:

```typescript
// Campos principales
project: EditorProject | null       // Proyecto actual
scenes: Record<string, Scene>       // Escenas del proyecto
nodes: SceneFlowNode[]              // Nodos de ReactFlow
edges: SceneFlowEdge[]              // Aristas de ReactFlow
selectedSceneId: string | null      // Escena seleccionada
editingScene: { id: string; scene: Scene } | null  // Escena en edición

// Acciones
addScene(id, scene)                 // Crear escena
updateScene(id, scene)              // Actualizar escena
deleteScene(id)                     // Eliminar escena
setProject(project)                 // Cargar proyecto
undo() / redo()                     // Deshacer/rehacer
```

## Validación

**Archivo:** `src/editor/utils/validation.ts`

Detecta:
- Escenas sin conexiones de entrada (huérfanas)
- `goto` apuntando a escenas inexistentes
- Escenas vacías (sin pasos)
- Diálogos con personajes no definidos
- Items referenciados no definidos
- Stats referenciadas no definidas en `initialStats`

## Export/Import

**Archivo:** `src/editor/utils/exportProject.ts`, `importProject.ts`

- **Export:** Genera un ZIP con `game.json` (manifest) + `scenes.json` + assets embebidos
- **Import:** Acepta ZIP o JSON sueltos. Puede importar juegos del formato legacy (routes/dialogs/widgets/scenarios separados) o del formato nuevo (game.json + scenes.json)
