← [Volver al índice](README.md)

# IA en el juego

El juego puede usar un servidor de IA propio ([`server/`](../server/README.md), PHP + DeepSeek) para **narración generada** y **modos chat**. Es opcional: si el juego no lo declara, si el servidor no responde o si el jugador lo apaga, todo usa los textos fijos, los pools y los dados. **El juego siempre se puede completar sin IA.**

## Activar en un juego

```jsonc
// game.json
"ai": { "endpoint": "/cyb-api/" }   // URL base del servidor (default "/cyb-api/", mismo dominio)
```

- En producción el juego vive en `/cyb/` y la API en `/cyb-api/` del mismo dominio.
- En desarrollo, Vite hace de proxy: `/cyb-api` → `http://127.0.0.1:8099` (cambiable con `CYB_API_TARGET`). Levantar la API con `php -S 127.0.0.1:8099 -t server/public` (con `'mock' => true` en `server/config.php` no gasta tokens).

## Arquitectura

```
GameEngine (puro) ──usa──▶ AiProvider (interfaz, engine/AiProvider.ts)
                                ▲
                  src/ai/AiClient.ts (fetch, timeouts, sesión, eventos)
                                │
                     server/public/api/*.php
```

- El motor no hace red: `useGameLoop.startGame()` crea el `AiClient`, lee `api/config.php` y lo inyecta con `engine.setAiProvider()` / `engine.setEventSink()`.
- Todas las llamadas devuelven `null` ante cualquier problema (sin servidor, timeout, 4xx/5xx) y el motor usa su respaldo.
- El texto de la IA se sanea (`sanitizeAiText`): los corchetes pasan a «» para que no se interpreten como formato.
- Sesión anónima: UUID en `localStorage` (`cyb_ai_session`). Preferencia del jugador: `cyb_ai_pref` (comando `/ia on|off`).

## Narración con IA (`dialog.ai`)

```jsonc
{ "type": "dialog", "character": "narrator", "lines": [], "pool": "muerte",
  "ai": { "prompt": "muerte", "vars": { "causa": "lo mordió el perro" } } }
```

Si la IA responde, su línea **reemplaza** a `lines` + `pool`; si no, se muestran `lines` + `pool`. Así el mismo paso sirve con y sin IA. `prompt` es el nombre del prompt `narrate.<prompt>` del servidor.

## Modos chat

Ver [`ai_chat`](pasos/ai-chat.md).

## Perfil del jugador

Etiquetas que se acumulan en `PlayerState.profile` (se guardan con la partida):

- `choice.options[].tags`: `["cobarde"]` suma 1 a `cobarde` al elegir esa opción.
- Automáticas: `chat_<modo>` por cada conversación, `se_rinde` al usar `/rendirse`.
- Condición: `{ "profile": { "cobarde": ">=3" } }`.
- La IA recibe `{{perfil}}`: resumen como `"cobarde ×3, valiente ×1, murió 2 veces en total"`.

## Eventos (analítica)

Si el servidor tiene los eventos activos, el cliente envía en lotes (cada 15 s, y al cerrar la página con `sendBeacon`):

| Evento | Datos |
|---|---|
| `scene` | escena en la que entra |
| `choice` | texto, destino y tags de la opción |
| `dice` | stat, resultado, total, dificultad |
| `rule` | id de la regla automática que se disparó (ej. `muerte`) |
| `chat` | modo, npc, veredicto, puntaje, turnos, si se rindió o fue por dados |

No se envían datos personales en los eventos (el nombre escrito por el jugador solo viaja en las variables de los prompts de IA; el control de edad del juego lo avisa).
