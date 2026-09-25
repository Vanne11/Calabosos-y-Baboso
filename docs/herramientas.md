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
| **aviso** | `visitedScenes`/`unvisitedScenes` que incluyen la propia escena (ya está visitada al entrar), reglas repetibles sin `effects` ni `goto` (se dispararían en bucle), pools vacíos, escenas vacías, escenas sin salida (ningún `goto`), escenas inalcanzables desde `start`, items no definidos en `items` (si el juego define `items`), assets (imágenes/audio) que no existen |
| **info** | Cantidad de imágenes provisorias pendientes |

Los destinos de `statRules[].goto` cuentan como alcanzables (una regla puede dispararse en cualquier escena).

Destinos especiales válidos: `_quit`, `_game_over`, `_restart`, `_age_accept` (y `_age_gate` si hay `contentRating` sin `gateScene`).

## `npm run placeholders -- <juego>`

Genera una imagen provisoria (PNG con el nombre del archivo y dónde se usa) para cada imagen referenciada que no exista, con el tamaño según la carpeta: `scenarios/` 768×432, `dialogs/` y `items/` 256×256.

- Registra cada provisoria en `images/.placeholders.json` (ruta → sha256).
- Al reemplazar un archivo por el arte final, la siguiente ejecución lo saca del registro (el hash ya no coincide).
- El audio faltante solo se informa.
- Usa `sharp` (devDependency).

## `npm run playtest -- <juego> [partidas] [--seed=N]`

Bot que juega muchas partidas al azar con el **motor real** y los datos del juego (sin IA: los modos chat se resuelven con su tirada de respaldo, como en el juego sin servidor).

```bash
npm run playtest -- calabosos              # 300 partidas
npm run playtest -- calabosos 1000 --seed=42
```

Informa:
- cómo terminan las partidas (`_quit`, `_restart`, límite de pasos...) y el % que llega a un final (`final_*`);
- **cobertura**: escenas nunca visitadas;
- escenas donde la partida se queda **atascada** (terminan sin navegar);
- **variables sin resolver** en textos (`{algo}` que no existe);
- errores del motor, y la escena más repetida en partidas que no terminan (bucles);
- **muertes por causa** (stat `causa_muerte`) y escena donde ocurren: sirve para balancear combates.

En combate, el bot juega como un jugador razonable (se cura con poca vida, usa sal y luz, a veces defiende o huye). Al morir reintenta desde el punto seguro hasta 3 veces.

Con la misma semilla, el resultado es reproducible. Sale con código 1 si encuentra problemas.

Para simular jugadores y ver la analítica del admin con datos:

```bash
npm run playtest -- calabosos 200 --send-events=http://127.0.0.1:8099/api/events.php
```

## `npm run package [-- --sin-demos]`

Genera `release/calabosos-v<versión>.tar.gz` listo para subir: valida, compila con base `/cyb/`, convierte y reduce las imágenes (WebP, máximo 1280 px), y copia el servidor sin `config.php` ni base de datos. Con `--sin-demos` publica solo Calabosos. Guía en [DEPLOY.md](DEPLOY.md).
