← [Volver al índice](README.md)

# Herramientas de Juego (scripts)

Scripts de Node para trabajar con los juegos de `public/games/`. Comparten `scripts/shared/game-data.mjs` (carga de manifiesto + escenas, `sceneFiles` incluido).

## `npm run validate`

Valida uno o todos los juegos registrados en `public/games/index.json`.

```bash
npm run validate                          # todos
npm run validate -- calabosos             # uno
npm run validate -- calabosos --strict    # los avisos también fallan (exit 1)
```

| Nivel | Qué revisa |
|---|---|
| **ERROR** | JSON inválido, archivos de escenas faltantes, IDs duplicados entre archivos, falta `start`, `gateScene` inexistente, `goto` a escena inexistente (en cualquier profundidad del paso), personaje de `dialog` no definido, `dialog` sin `lines` ni `pool`, pool inexistente (en `dialog`, `statRules` o `diceHooks`), `statRules` sin `id`/`condition` o con `id` duplicado |
| **aviso** | Reglas repetibles sin `effects` ni `goto` (se dispararían en bucle), pools vacíos, escenas vacías, escenas sin salida (ningún `goto`), escenas inalcanzables desde `start`, items no definidos en `items` (si el juego define `items`), assets (imágenes/audio) que no existen |
| **info** | Cantidad de imágenes provisorias pendientes |

Los destinos de `statRules[].goto` cuentan como alcanzables (una regla puede dispararse en cualquier escena).

Destinos especiales válidos: `_quit`, `_game_over`, `_restart`, `_age_accept` (y `_age_gate` si hay `contentRating` sin `gateScene`).

## `npm run placeholders -- <juego>`

Genera una imagen provisoria (PNG con el nombre del archivo y dónde se usa) para cada imagen referenciada que no exista, con el tamaño según la carpeta: `scenarios/` 768×432, `dialogs/` y `items/` 256×256.

- Registra cada provisoria en `images/.placeholders.json` (ruta → sha256).
- Al reemplazar un archivo por el arte final, la siguiente ejecución lo saca del registro (el hash ya no coincide).
- El audio faltante solo se informa.
- Usa `sharp` (devDependency).
