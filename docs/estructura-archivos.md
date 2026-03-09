← [Volver al índice](README.md)

# Estructura de Archivos

```
src/
├── main.tsx                          Entrada React
├── App.tsx                           Orquestador principal (201 líneas)
│
├── engine/                           Motor del juego (puro TypeScript)
│   ├── GameEngine.ts                 Núcleo: generadores, procesamiento de pasos (1.328)
│   ├── ConditionEvaluator.ts         Evaluación de condiciones (131)
│   ├── EffectsApplier.ts             Aplicación de efectos al estado (123)
│   ├── DiceRoller.ts                 Tiradas D20 con modificadores (50)
│   ├── AudioManager.ts              Gestión de música con crossfade (153)
│   ├── GameLoader.ts                 Cargador de juegos JSON (92)
│   └── CommandParser.ts              Parser de comandos (23)
│
├── types/                            Definiciones TypeScript
│   ├── game.ts                       Tipos del formato JSON (565)
│   ├── engine.ts                     Tipos del motor y StepResult/PlayerAction (366)
│   ├── terminal.ts                   Tipos de la terminal (28)
│   ├── theme.ts                      Tipos de temas (52)
│   ├── styled.d.ts                   Declaraciones styled-components (9)
│   └── file-saver.d.ts              Declaraciones file-saver (3)
│
├── hooks/                            Custom hooks
│   ├── useGameLoop.ts                Consume StepResults, renderiza en terminal (545)
│   ├── useTerminalCommands.ts        Procesamiento de comandos (385)
│   ├── useBootSequence.ts            Secuencia de arranque (108)
│   ├── useLoginFlow.ts               Flujo de login (107)
│   └── useKeyboardInput.ts           Manejo de teclado (74)
│
├── store/                            Estado global (Zustand)
│   ├── useAppStore.ts                Store principal (201)
│   └── useDebugStore.ts              Store de debugging (58)
│
├── components/                       Componentes React
│   ├── terminal/                     Sistema de terminal
│   │   ├── Terminal.tsx              Contenedor principal (116)
│   │   ├── TerminalHistory.tsx       Historial de mensajes (58)
│   │   ├── TerminalEntry.tsx         Entrada individual (132)
│   │   ├── TerminalInput.tsx         Input de usuario (99)
│   │   └── RichText.tsx              Renderizador de Rich text (35)
│   ├── game/                         Widgets de juego
│   │   ├── ChoiceWidget.tsx          Botones de opciones (54)
│   │   ├── DiceWidget.tsx            Widget de dados (128)
│   │   └── InputWidget.tsx           Widget de entrada de texto (28)
│   ├── layout/                       Layout
│   │   ├── AppShell.tsx              Shell principal (88)
│   │   ├── StatusBar.tsx             Barra de stats (187)
│   │   ├── InventoryPanel.tsx        Panel de inventario (233)
│   │   ├── ImagePanel.tsx            Panel de imagen (88)
│   │   ├── SpeedControl.tsx          Control de velocidad (105)
│   │   └── MobileWarning.tsx         Advertencia móvil (159)
│   ├── sequences/
│   │   └── BootSequence.tsx          Secuencia de boot (84)
│   └── ui/
│       └── HoverPreview.tsx          Preview en hover (94)
│
├── editor/                           Editor visual (~5.877 líneas)
│   ├── components/
│   │   ├── EditorApp.tsx             Raíz del editor (589)
│   │   ├── canvas/                   Canvas con nodos
│   │   ├── panels/                   Paneles de edición
│   │   ├── panels/steps/             18 editores de tipos de paso
│   │   ├── preview/                  Preview del juego
│   │   ├── shared/                   Componentes compartidos
│   │   └── toolbar/                  Barra de herramientas
│   ├── data/
│   │   └── sceneTemplates.ts         Templates de escenas (483)
│   ├── hooks/
│   │   ├── useEditorShortcuts.ts     Atajos de teclado (139)
│   │   └── useProjectContext.ts      Contexto del proyecto (94)
│   ├── store/
│   │   ├── useEditorStore.ts         Store del editor (538)
│   │   └── undoMiddleware.ts         Middleware undo/redo (51)
│   ├── types/
│   │   └── editor.ts                 Tipos del editor (209)
│   └── utils/
│       ├── validation.ts             Validación de proyectos (344)
│       ├── importProject.ts          Importación (220)
│       ├── exportProject.ts          Exportación (174)
│       ├── autoLayout.ts             Auto-layout de nodos (87)
│       ├── assetStorage.ts           Almacenamiento de assets (49)
│       └── editorStorage.ts          Persistencia del editor (42)
│
├── styles/                           Estilos
│   ├── globalStyles.ts               Estilos globales (42)
│   └── themes.ts                     Temas dracula/lilac (104)
│
└── utils/                            Utilidades
    ├── richTextParser.ts             Parser de Rich text (128)
    ├── preloadAssets.ts              Precarga de imágenes (86)
    ├── storage.ts                    LocalForage wrapper (33)
    └── delay.ts                      Función delay con velocidad (4)
```
