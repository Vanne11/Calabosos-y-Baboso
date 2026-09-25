← [Volver al índice](README.md)

# Terminal y Comandos

**Archivos:** `src/hooks/useTerminalCommands.ts`, `src/engine/CommandParser.ts`

## Comandos de Shell (fase `shell`)

Disponibles cuando no hay juego en ejecución. Funcionan con o sin prefijo `/`.

| Comando | Descripción |
|---|---|
| `help` | Lista de comandos con sarcasmo |
| `clear` | Limpia la terminal |
| `version` | Versión del motor |
| `about` | Pantalla About con música y animación |
| `run [juego]` | Carga y ejecuta un juego |
| `list` | Lista juegos disponibles |
| `editor [juego]` | Abre el editor visual (opcionalmente carga un juego) |
| `create` | Alias de `editor` |
| `debug [on\|off\|status\|history\|clear\|report]` | Sistema de depuración |
| `sudo run <juego>` | Abre el juego en modo superpoderes (pide contraseña; ver abajo) |
| `quit` / `exit` | Cierra sesión |

## Comandos In-Game (fase `game`)

Disponibles durante la partida. **Requieren prefijo `/`** para distinguirlos del input de widgets (selección de opciones, tiradas, etc.). Se interceptan incluso cuando hay un widget activo (choice, shop, dice, etc.).

| Comando | Descripción |
|---|---|
| `/help` | Ayuda específica de la partida (comandos disponibles durante el juego) |
| `/about` | Información del juego actual (nombre, descripción, versión, autor del manifest) |
| `/history` | Muestra el historial narrativo de la partida (últimas 50 entradas: diálogos, opciones, eventos) |
| `/clear` | Limpia la terminal conservando el último bloque de diálogo activo (desde el último `dialogHeader`) |
| `/save` | Guarda la partida en un slot (ver [Sistema de Guardado](guardado.md)) |
| `/load` | Carga una partida guardada desde un slot |
| `/version` | Versión del motor |
| `/debug` | Sistema de depuración (funciona igual que en shell) |
| `/ia` · `/ia on` · `/ia off` | Estado del narrador con IA, o activarlo/apagarlo (preferencia guardada en el navegador) |
| `/<códice>` | El comando del códice del juego (ej. `/bestiario`, `/bestiario 3`). Con el bestiario abierto, basta escribir el número; `0` lo cierra. Ver [narrativa.md](narrativa.md#códice--bestiario-codex) |
| `/debug goto <escena>` | Salta a una escena (solo con `/debug on`; para probar contenido) |
| `/rendirse` | Abandona la conversación de un modo chat (`ai_chat`) → resultado *failure* |
| *(texto sin `/`)* | Charla libre: contesta quien esté (el nombrado, el personaje de enfrente, el acompañante o el narrador). No avanza la historia. Límites: `game.json → ai.talk` |
| `/narrador <texto>` · `/hablar <texto>` | Hablarle directamente al narrador (mismos límites que la charla libre) |
| `/bien` · `/mal` | Califica la última línea de la IA (se ve en el admin → Calificaciones) |
| `/inventario` | Abre/cierra el overlay expandido del inventario (aliases: `/inv`, `/inventory`) |
| `/quit` / `/exit` | Sale de la partida y vuelve a la shell (no cierra sesión) |

| `/sudo` · `/sudo salir` | Activa (con contraseña) o apaga el modo superpoderes |

### Modo superpoderes (sudo)

Para probar rutas sin rejugar todo. Se entra con `sudo run calabosos` (o `/sudo` en partida) y la contraseña
de pruebas (el código solo guarda su hash SHA-256 en `src/utils/sudo.ts`; no es seguridad real, el juego corre en
el navegador). La contraseña no se muestra al escribirla; con 3 errores se cancela. La primera vez en el navegador
hay una entrada épica (se recuerda en `localStorage → cyb_sudo_intro_visto`); después, una línea corta. El prompt
cambia a `[root@cyb] #` y cada poder suelta un comentario del narrador al azar (`SUDO_QUIPS`).

| Poder | Qué hace |
|---|---|
| `/atras [n]` | Vuelve n escenas atrás (default 1) con el estado que tenías al entrar a esa escena (máx. 60 guardadas) |
| `/ir <escena>` · `/escenas [filtro]` | Salta a cualquier escena · lista los ids |
| `/dar <objeto> [n]` · `/quitar <objeto>` | Objetos por id o parte del nombre (`/dar sal 2`) |
| `/dinero <n>` · `/stat <nombre> <valor>` · `/flag <nombre> on\|off` · `/curar` | Toca el estado (las `statRules` del juego siguen aplicando: sin bolsa el dinero se topa en 60) |
| `/estado` | Escena, stats, flags e inventario |
| `/poderes` | La lista de arriba |

Sin sudo, estos comandos responden «Permiso denegado». Los cambios pasan por `engine.cheat()` (= `applyState`).

**Comandos bloqueados durante la partida:** `run`, `list`, `editor`, `create` — muestran aviso de que hay una partida activa.

## Interceptación de comandos in-game

En `App.tsx`, el flujo de `handleSubmit()` chequea si el input empieza con `/` **antes** de procesarlo como input de widget:

```
input empieza con "/"?
  → SÍ: processCommand() (comandos in-game)
  → NO: procesar como input de widget (número, texto, etc.)
```

Esto permite escribir `/help` incluso estando en una pantalla de selección de opciones, tienda, combate, etc.

## CommandParser

Simplemente separa nombre y argumentos:
```
"run demo" → { name: "run", args: ["demo"] }
"/editor demo" → { name: "editor", args: ["demo"] }
```
