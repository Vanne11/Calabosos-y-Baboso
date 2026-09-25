# Calabosos y Babosos — Guía para Claude

Motor de aventuras de texto en terminal (React + TypeScript) con editor visual, más el juego completo **Calabosos y Babosos** (~1 hora, humor adulto sarcástico) y un servidor de IA propio en PHP (DeepSeek).

- Responder siempre en **español**. No agregar `Co-Authored-By` en los commits.
- Rama de trabajo: **`cyb-web`** (remoto `Vanne11/Calabosos-y-Baboso`).
- Plan y estado de fases: `docs/PLAN_JUEGO_COMPLETO.md`. Wiki técnica: `docs/README.md`.

## Estructura

```
src/
  engine/        Motor puro TS (sin React, sin red): GameEngine, GameLoader, ConditionEvaluator,
                 EffectsApplier, DiceRoller, NarrativeText (variables/pools), AiProvider (contrato IA)
  ai/            AiClient (fetch a la API PHP, sesión anónima, eventos) + session.ts
  audio/         Efectos y ambientes sintetizados (WebAudio): synth, sfxCatalog, ambience, SfxPlayer,
                 feedback (diff de estado → sonido/pantalla, puro) + gameFeedback
  hooks/         useGameLoop (consume StepResults, UI de chat), useTerminalCommands (/comandos)
  components/    Terminal, widgets (dados, combate, tienda...), layout (barra de estado, inventario)
  editor/        Editor visual (ReactFlow): editores de pasos, import/export, validación
  types/         game.ts (formato JSON), engine.ts (StepResult, PlayerAction, PlayerState)
public/games/
  calabosos/     EL JUEGO: game.json + scenes/0X_*.json (sceneFiles) + images/ + audio/ + IMAGENES.md
  demo/, demo2/  Demos de capacidades del motor
  Calabosos y Babosos/original_datos/   Guion original en markdown (solo referencia)
server/          API de IA en PHP 7.4/8.x + SQLite + panel admin (ver server/README.md)
tests/           Vitest: engine/ (narrativa, ia, combate, audio), audio/ (catálogo, feedback), game/ (calabosos real), editor/, helpers.ts
scripts/         validate-game.mjs, playtest.ts, make-placeholders.mjs, package-release.mjs,
                 optimize-images.mjs, shared/game-data.mjs, compose-music.mjs + music/ (tracker chiptune),
                 sfx-names.ts
docs/            Wiki del motor, plan, DEPLOY.md
```

**Principio:** el `GameEngine` es TS puro. `async *enterScene()` produce `StepResult`s; la UI responde con `sendAction()`. La IA se inyecta (`engine.setAiProvider`) y **todo tiene respaldo sin IA** (texto fijo, pools o dados): el juego se completa sin servidor.

## Flujo de trabajo con contenido

```bash
npm run dev                             # http://127.0.0.1:5173/cyb/  → run calabosos
npm run validate -- calabosos           # gotos rotos, alcanzabilidad, personajes, items, pools, códice, assets
npm run playtest -- calabosos 500       # bot: cobertura, atascos, variables {x} sin resolver, muertes por causa
npm run placeholders -- calabosos       # imágenes provisorias para toda referencia que falte
npm run music                           # renderiza las pistas compuestas (scripts/music/songs.mjs) a cyb_*.ogg (ffmpeg)
npm run sfx-names                       # tras agregar un efecto/ambiente al catálogo
npm test                                # Vitest: motor, IA, combate, datos reales del juego, editor
npx tsc --noEmit -p .                   # debe quedar sin errores
```

- Dentro del juego: `/debug on` y `/debug goto <escena>` para saltar a cualquier escena; `/debug sfx [nombre]` y `/debug ambiente [nombre]` para oír el catálogo.
- Sonido (detalle en `docs/audio.md`): `sfx` en pasos sound, `scenario.sfx/ambience`, opciones, examine, use_item, dados, random, notify y `enemy.sfx`; stats/objetos suenan solos según `game.json → audio`. La IA devuelve un `tono` (lista cerrada, `PromptRenderer::TONES` = `TONES` en AiProvider.ts) que suena como reacción (`src/audio/tones.ts`, `audio.toneSfx`).
- **Los JSON de `public/games/calabosos/scenes/` son la fuente de verdad** (se editan a mano o con el editor).
- Condiciones de visita: la escena actual **ya cuenta como visitada al entrar**; para "primera vez" usar un flag (el validador lo avisa).
- Al agregar imágenes nuevas: referenciarlas en el JSON, `npm run placeholders`, y agregar su ficha en `IMAGENES.md`.

## Formato del juego (resumen; detalle en docs/)

`game.json`: `characters`, `statDefs` (label/icon/min/max/hidden), `initialStats`, `items`, `traits`, `contentRating` (+18, `gateScene`), `sceneFiles`, `ai.endpoint`, `audio` (combatMusic, gameOverMusic, statSfx, itemSfx), `linePools`, `statRules`, `diceHooks`, `diceModifiers`, `codex` (bestiario), `saveSystem`.

**20 tipos de paso:** dialog (con `pool`, `count`, `ai`), choice (con `tags` de perfil, `freeText` = acción libre con IA, `aiReact`), dice (con `tiers` por tramos), input, effects, branch, random, check, shop (`priceMultipliers`, haggle/steal), combat (`weapons`, rasgos del enemigo: firstStrike, dodgeChance/reveal, damagePerTurn, corrodes, split/preventSplit, deathDamage), notify, wait, sound, craft, puzzle, examine, use_item, timed_choice, level_up, **ai_chat** (persuadir, negociar, cancion, rap, insultos, confesion; con `fallback` de dados y `gestures` del NPC).

**Condiciones:** stats, flags, inventory, notInventory, visited/unvisitedScenes, skillLevel, affinity, relationshipTier, hasTraits/notTraits, characterLevel, meta, textMatches, profile, codex.

**Efectos:** stats, setStats, flags, inventory, removeInventory, clearInventory, xp, affinity, add/removeTraits, learnSkill, giveSkillPoints, meta (persisten entre partidas), unlockCodex, checkpoint, memo (hecho para la memoria de la IA), npcMemo (recuerdo de un personaje).

**Destinos especiales:** `_quit`, `_game_over`, `_restart`, `_age_accept`, `_checkpoint`.

**Textos:** variables `{stat}` y `{meta.clave}`; rich text `[bold red]...[/bold red]`. El texto de la IA se sanea (`[` → `«`).

## Servidor de IA (server/)

- PHP **7.4 y 8.x** (sin sintaxis de PHP 8: nada de match, enums, named args, union types, readonly). SQLite con migraciones (`PRAGMA user_version`).
- La key de DeepSeek va **solo** en `server/config.php` (gitignored). En producción lo crea el instalador web (`/cyb/api/admin/`, `ConfigWriter`) y la key se cambia en Ajustes; sin config.php la API arranca con valores por defecto. Modo `mock` para desarrollo.
- Desarrollo: `php -S 127.0.0.1:8099 -t server/public` (Vite hace proxy de `/cyb/api`). En Arch el PHP del sistema no trae `pdo_sqlite`; hay un PHP 7.4 de prueba vía `micromamba create -c conda-forge php=7.4.26`.
- Memoria de la IA (`src/engine/AiContext.ts`): memos, decisiones con tags, citas, cómo escribe el jugador, ánimo y fichas (`characters.x.ai`); el servidor las agrega en un bloque de contexto (`PromptRenderer::contextBlock`). Detalle: `docs/ia.md`.
- Charla libre: texto sin `/` lo contesta quien esté (`engine.talk`, `ai.talk`, prompts `narrate.charla` y `narrate.charla_npc`).
- Calificaciones (`/bien`, `/mal` → `ai_lines`) y ejemplos por prompt (`prompt_examples`, admin → Calificaciones).
- Cambiar prompts semilla (`Seed.php`) requiere una migración nueva que llame a `Seed::upgrade()` (no pisa prompts editados por el admin).
- Prompts editables y versionados en el admin; el contrato JSON de los modos chat lo fija el servidor. El veredicto lo calcula el servidor; el puntaje sube como máximo `max_step` por turno.

## Publicar

`npm run package` (o `-- --sin-demos`) → `release/calabosos-v<versión>/cyb/` (una sola carpeta: el juego, con la IA en `cyb/api/`). Actualizar = subir encima sin borrar `cyb/` (ahí viven `api/config.php` y `api/data/`). Guía: `docs/DEPLOY.md`.
