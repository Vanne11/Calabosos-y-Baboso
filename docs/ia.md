← [Volver al índice](README.md)

# IA en el juego

El juego puede usar un servidor de IA propio ([`server/`](../server/README.md), PHP + DeepSeek) para **narración generada** y **modos chat**. Es opcional: si el juego no lo declara, si el servidor no responde o si el jugador lo apaga, todo usa los textos fijos, los pools y los dados. **El juego siempre se puede completar sin IA.**

## Activar en un juego

```jsonc
// game.json
"ai": {}                            // activa la IA; endpoint opcional (default: la carpeta api/ del juego, "/cyb/api/")
```

- En producción la API vive **dentro** del juego: `/cyb/` es el juego y `/cyb/api/` el servidor PHP (ver [DEPLOY.md](DEPLOY.md)).
- En desarrollo, Vite hace de proxy: `/cyb/api` → `http://127.0.0.1:8099` (cambiable con `CYB_API_TARGET`). Levantar la API con `php -S 127.0.0.1:8099 -t server/public` (con `'mock' => true` en `server/config.php` no gasta tokens).

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

## Tono → sonido

La IA marca el tono de cada línea del narrador y de cada respuesta en los modos chat (el servidor lo exige en
su formato JSON). El juego lo convierte en un efecto de reacción, medio segundo después del texto:

| Tono | Efecto | | Tono | Efecto |
|---|---|---|---|---|
| burla | risa | | asco | baba |
| chiste | ba-dum tss | | miedo | latido |
| incomodo | grillos | | ternura | jingle cursi |
| enojo | rugido | | triste | jingle de derrota |
| impresionado | aplausos | | drama | dun dun DUNNN |
| neutral | (nada) | | | |

En una conversación no se repite el mismo efecto dos turnos seguidos. Cada juego puede cambiarlos en
`game.json → audio.toneSfx` (`{ "chiste": "grillo", "enojo": "none" }`). Sin IA no hay tono: suenan solo
los efectos fijos. Tabla por defecto: `src/audio/tones.ts`.

## Modos chat

Ver [`ai_chat`](pasos/ai-chat.md).

## Memoria de la partida

Cada llamada a la IA lleva lo que pasó en la partida, para que haga callbacks concretos en vez de burlas genéricas
(código: `src/engine/AiContext.ts`). Todo vive en `PlayerState`, se guarda con la partida y **no vuelve atrás
con `_checkpoint`** (el narrador recuerda tus muertes).

| Variable | De dónde sale | Viajan |
|---|---|---|
| `memoria` | `effects.memo` en escenas y reglas + el resultado de cada `ai_chat` ("se batió a rap contra Bardo Babosa y perdió (en Taberna)") | últimos 10 de 30 |
| `decisiones` | automático: cada opción **con `tags`** que elige el jugador, con su escena | últimas 6 de 12 |
| `citas` | la frase del jugador que más subió el medidor en cada chat, tal cual | últimas 3 de 8 |
| `como_escribe` | los últimos mensajes del jugador en los chats, **sin corregir** (modismos, faltas) | 4 |
| `ya_dijiste` | las últimas líneas del narrador con IA, para que no se repita | 5 |
| `animo` | la stat `animo_narrador` (texto; el juego la cambia con `setStats` al empezar cada acto) | — |

El servidor agrega esas variables solo, en un bloque "CONTEXTO DE LA PARTIDA" entre el prompt y el contrato de
formato (`PromptRenderer::contextBlock`), salvo las que el prompt ya use con `{{variable}}`. Así funcionan también
con prompts editados en el admin. Tienen su propio límite de largo: Ajustes → `max_context_chars` (1200).

### Cómo escribe el jugador

Los jugadores escriben como hablan y con faltas. No se corrige nada: `como_escribe` y `citas` van tal cual, y la
hoja del narrador pide contestar en el mismo registro, usar sus modismos, burlarse a veces de **una** falta concreta
(nunca corregir como profesor) y no bajar el puntaje por ortografía.

## Fichas de personaje

`characters.<id>.ai` en `game.json` define la voz de un personaje para la IA:

```jsonc
"guardia": {
  "name": "Guardia del Abismo", "description": "...",
  "ai": {
    "voz": "Aburrido hasta el alma, bosteza en medio de las frases",
    "muletillas": ["Mire, joven...", "*bostezo*"],
    "quiere": "Que su turno termine", "teme": "Que el Rey se entere",
    "secreto": "Sueña con ser cantante",          // la IA lo insinúa, no lo dice
    "ejemplos": ["Alto ahí, bípedo. Nadie entra al Abismo sin permiso del Rey."]
  }
}
```

- En un `ai_chat` viaja la ficha del NPC (`npc_ficha`); en la narración, la del narrador (`ficha_narrador`).
- Los `ejemplos` son lo que más define la voz: dos o tres frases reales del personaje valen más que la descripción.

## Actualizar los prompts de un servidor ya instalado

Los prompts semilla viven en `server/src/Seed.php`. Cuando cambian, una migración llama a `Seed::upgrade()`: si
el prompt activo es el de la semilla, se activa la versión nueva; si el admin lo editó, la nueva queda en el
historial **sin activar** (nota "sin activar: este prompt tiene cambios tuyos") para compararla. Las migraciones
corren solas en el primer pedido después de subir los archivos.

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
