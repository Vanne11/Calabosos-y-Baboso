← [Volver al índice](README.md)

# Sistema de Audio

Tres capas que suenan a la vez, cada una con su volumen (engranaje ⚙ → Música / Efectos / Voces):

| Capa | Dónde | Qué es |
|------|-------|--------|
| **Música** | `src/engine/AudioManager.ts` | Pistas `.ogg` en bucle con crossfade. Se baja sola ("ducking") mientras suena un jingle. |
| **Efectos** | `src/audio/` (`SfxPlayer`, `sfxCatalog`) | ~100 efectos **sintetizados** en el navegador (WebAudio, estética 8-bit). No pesan nada. |
| **Ambientes** | `src/audio/ambience.ts` | Bucles sintetizados bajo la música: lluvia, viento, bosque, noche, fogata, cueva, abismo, taberna, pueblo. |

Todo arranca con la primera interacción del jugador (los navegadores bloquean el audio antes).

## Usar efectos desde el juego (JSON)

Los efectos se nombran por su nombre del catálogo. Lista completa: `/debug sfx` dentro del juego
(y `/debug sfx puerta` para escuchar uno), o `src/audio/sfx-names.json`.

```jsonc
// Paso suelto
{ "type": "sound", "sfx": "puerta" }
{ "type": "sound", "sfx": "tambor", "wait": true }      // espera a que termine
{ "type": "sound", "src": "audio/grito.ogg", "volume": 0.5 }  // o un archivo propio

// Al entrar a una escena: ambiente y efecto(s)
"scenario": { "name": "...", "music": "audio/x.ogg", "ambience": "lluvia", "sfx": ["campana"] }

// En opciones, cosas examinables, usos de objeto, resultados de dados y eventos al azar
{ "text": "Abrir la puerta", "goto": "...", "sfx": "puerta" }
{ "id": "lampara", "label": "...", "text": "...", "sfx": "fuego" }       // examine
{ "itemId": "llave", "text": "...", "sfx": "cerradura" }                 // use_item → accepts
"results": { "failure": { "text": "...", "sfx": "caida" } }              // dice (y tiers)
{ "weight": 1, "text": "...", "sfx": "eructo" }                          // random

// Notificaciones: suena uno según el estilo; se puede cambiar o silenciar
{ "type": "notify", "style": "achievement", "title": "...", "text": "...", "sfx": "final" }  // "none" = nada

// Enemigos: sonido al golpearlos y al morir
"enemy": { "name": "Babosa", "sfx": { "hit": "baba", "death": "explosion_baba" }, ... }
```

**Ambientes:** si una escena no dice `ambience`, una escena con `music` propia lo apaga y una sin `music`
mantiene el que sonaba. `"ambience": "none"` lo apaga explícitamente.

Algunos efectos traen su efecto de pantalla (explosión y derrumbe sacuden; `muerte` tiñe de rojo).

## Automático (sin tocar escenas)

El motor suena solo en: dados (rodando, éxito, fallo, crítico = fanfarria, pifia = trombón triste),
comprobaciones, combate (alarma al empezar, espada/esquiva/bloqueo, victoria, derrota, huida),
conversaciones con IA (medidor que sube/baja, veredicto), notificaciones, códice, experiencia y nivel,
afinidad, rasgos, puzzles, elecciones con tiempo (tic-tac y alarma), guardado, rebobinar (checkpoint/reinicio),
muerte (`_game_over`) y final del juego. Cada línea de diálogo tiene "voz" de blips (timbre según el personaje).

Los **cambios de stats y objetos** se detectan comparando el estado (`src/audio/feedback.ts`, lógica pura)
y se configuran en `game.json`:

```jsonc
"audio": {
  "combatMusic": "audio/rpgchip13_battle_1.ogg",   // música de todo combate (un paso combat puede traer "music")
  "gameOverMusic": "audio/rpgchip15_game_over.ogg",
  "statSfx": {
    "ganas_de_vivir": { "down": "dano", "bigDown": { "amount": 20, "sfx": "dano_fuerte" },
                        "up": "curar", "shake": true, "flashUp": "heal" },
    "dinero": { "up": "moneda", "bigUp": { "amount": 15, "sfx": "monedas" }, "down": "pagar", "flashUp": "gold" }
  },
  "itemSfx": "objeto",          // por defecto "objeto"
  "removeItemSfx": "soltar"     // por defecto nada
}
```

`shake: true` hace que bajar ese stat sacuda la pantalla y la tiña de rojo (proporcional al daño).

**Con IA:** cada modo de conversación tiene su sonido de inicio (rap = redoble, insultos = alarma de combate...)
y la IA marca el tono de lo que dice (burla, chiste, incómodo, drama...), que suena como reacción.
Tabla y cómo cambiarla (`audio.toneSfx`): [ia.md → Tono → sonido](ia.md#tono--sonido).
Todo cambio de stat visible muestra además una cifra flotante (+10 / -5) en la barra de estado.

## Música compuesta (chiptune)

`npm run music` renderiza las pistas de `scripts/music/songs.mjs` a `public/games/calabosos/audio/cyb_*.ogg`
(necesita `ffmpeg`). Es un mini tracker estilo NES: dos pulsos, triángulo y ruido. Se escribe la progresión
de acordes y la melodía; bajo, acompañamiento y batería salen de estilos (`oompah`, `boombap`, `arp16`...).

| Pista | Dónde suena |
|-------|-------------|
| `cyb_taberna` | Taberna «La Babosa Ebria» (polca borracha, con hipo) |
| `cyb_rap` | Guerra de rap con el Bardo |
| `cyb_camino` / `cyb_charla` | Acto II: marcha de viaje / conversaciones por el camino |
| `cyb_takashi` | Takashi (opening de anime equivocado de juego) |
| `cyb_babosita` | La babosita perdida (caja de música) |
| `cyb_sigilo` | Robo, túneles y pasajes secretos |
| `cyb_nerly` | Encuentro con Nerly en el callejón |
| `cyb_trono` | Sala del Trono |
| `cyb_jefe` | Fase final contra el Rey Baboso |

## Agregar un efecto nuevo

1. Receta en `src/audio/sfxCatalog.ts` (con `desc`; `jingle: true` si es musical, baja la música).
2. `npm run sfx-names` (actualiza la lista que usa el validador).
3. `npm test` prueba cada receta contra un AudioContext falso que falla como el real ante parámetros inválidos.

## API

```typescript
audioManager.play(src) / stop() / duck(segundos) / volume / track   // música
sfx.play(nombre, volumen?) → duración   // efecto
sfx.setAmbience(nombre | null)          // ambiente con fundido
sfx.voice(personaje, texto)             // blips de diálogo
playSfx(nombre)                         // (gameFeedback) efecto + su efecto de pantalla
```
