← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `ai_chat` — Conversación libre con un NPC

El jugador **escribe lo que quiera** y un NPC le responde con IA (servidor en `server/`). Un medidor muestra cómo va (convencimiento, público, trato...) y al final el servidor da un veredicto: `success`, `partial` o `failure`. Si no hay IA, se decide con una tirada.

```jsonc
{
  "type": "ai_chat",
  "mode": "persuadir",              // persuadir | negociar | cancion | rap | insultos | confesion
  "npc": "guardia",                 // id del personaje (nombre, retrato y descripción van al prompt)
  "intro": ["Alto ahí, bípedo."],   // Opcional: líneas fijas del NPC antes de que el jugador escriba
  "vars": {                         // Variables del prompt del modo (admiten {stat} y {meta.x})
    "objetivo": "que el guardia lo deje entrar",
    "debilidad": "adora los halagos a su baba"
  },
  "maxTurns": 5,                    // Opcional (default: el del prompt; tope en Ajustes del admin)
  "meterLabel": "Convencimiento",   // Opcional (default según el modo)
  "saveAs": "cancion_nerly",        // Opcional: guarda la conversación como texto en esa stat
  "fallback": { "stat": "sexi", "difficulty": 13, "description": "Convencer al guardia" },
  "outcomes": {
    "success": { "text": "Te deja pasar.", "effects": { ... }, "goto": "sala_entrada" },
    "partial": { "text": "Pasa, pero paga peaje.", "goto": "sala_entrada" },
    "failure": { "text": "Te empuja al túnel.", "goto": "tunel" },
    "done":    { ... }               // Modos sin veredicto (confesion)
  },
  "condition": { ... }
}
```

## Variables por modo

| Modo | Variables que usa el prompt | Medidor |
|---|---|---|
| `persuadir` | `objetivo`, `debilidad` | Convencimiento |
| `negociar` | `objeto`, `precio_inicial`, `precio_minimo` | Trato |
| `cancion` | `tema` | Armonía |
| `rap` | `rival_nombre`, `rival_descripcion` | Público |
| `insultos` | `rival_nombre`, `rival_descripcion` | Duelo |
| `confesion` | `pregunta` | Honestidad (sin veredicto) |

Siempre se agregan: `npc_nombre`, `npc_descripcion`, `perfil`, `nombre_jugador`, `nombre_real`, `muertes`, `partidas`, `escena`, `escena_anterior`. Los prompts se editan en el panel admin (`chat.<modo>`).

## Comportamiento

1. Si la IA está disponible (servidor + modo activo + preferencia del jugador), empieza la conversación: encabezado del modo, medidor y la `intro`.
2. Por turno: el jugador escribe → el NPC responde → el medidor muestra el puntaje y el cambio (+/-). `/rendirse` abandona (→ `failure`).
3. Termina cuando se alcanza el umbral de éxito (salvo que el prompt tenga `early_success: false`, como la canción y el rap, que se juegan completos), el NPC da la conversación por terminada o se acaban los turnos. Se muestra el resultado y el `text` del outcome.
4. Se aplica el outcome: `partial` usa `failure` si no está definido; sin veredicto usa `done` (o `success`).

**Respaldo:** si no hay IA (o falla a mitad), se muestra la `intro` y se tira `fallback` (éxito o crítico → `success`, fallo → `failure`).

Suma al perfil `chat_<modo>` (y `se_rinde` si abandona) y emite el evento `chat`.
