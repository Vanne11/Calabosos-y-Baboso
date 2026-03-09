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
| `/inventario` | Abre/cierra el overlay expandido del inventario (aliases: `/inv`, `/inventory`) |
| `/quit` / `/exit` | Sale de la partida y vuelve a la shell (no cierra sesión) |

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
