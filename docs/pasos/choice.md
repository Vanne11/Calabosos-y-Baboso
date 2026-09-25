← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `choice` — Opciones del jugador

Presenta botones de opciones. Cada opción puede tener efectos y/o navegar a otra escena.

```jsonc
{
  "type": "choice",
  "options": [
    {
      "text": "Ir a la tienda",
      "effects": {                  // Opcional
        "stats": { "curiosity": 5 },
        "flags": { "visited_shop": true }
      },
      "goto": "tienda",            // Opcional: escena destino
      "tags": ["curioso"],          // Opcional: suma al perfil del jugador (ver ../ia.md)
      "condition": { ... }          // Opcional: oculta la opción si no se cumple
    },
    {
      "text": "Explorar el callejón",
      "goto": "callejon"
    },
    {
      "text": "[Requiere llave] Abrir la puerta",
      "goto": "puerta_secreta",
      "condition": { "inventory": ["master_key"] }
    }
  ]
}
```

**Comportamiento:** Filtra opciones visibles evaluando `condition`. Yield-ea `choice_prompt` y espera `{ type: 'choose', index }`. Aplica efectos de la opción elegida y navega si hay `goto`.

## Acción libre con IA (`freeText`)

Además de las opciones, el jugador puede **escribir lo que quiere hacer**. Aparece una opción extra
«✍️ Hacer otra cosa…» y también se puede escribir el texto directo en vez del número.

```jsonc
{
  "type": "choice",
  "options": [ ... ],
  "freeText": {                                   // o simplemente "freeText": true
    "situation": "Los guardias de la puerta no dejan salir sin permiso.",  // default: nombre + descripción del escenario
    "consequences": {                             // se suman a game.json → ai.freeText.consequences
      "soborno": { "hint": "intenta sobornar a alguien", "effects": { "stats": { "dinero": -5 } } }
    },
    "maxUses": 2,                                 // acciones libres por decisión (default 2)
    "label": "✍️ Hacer otra cosa…",               // opcionales
    "prompt": "¿Qué haces? Escríbelo con tus palabras."
  }
}
```

La IA (prompt `libre.accion` del servidor) hace una de tres cosas:

1. **Lo lleva a una opción** si en el fondo es lo mismo («le pego un combo al guardia» → *Intimidar*): narra cómo lo
   hace con sus palabras y sigue como si hubiera elegido esa opción (tags, efectos, goto).
2. **Aplica una consecuencia** de la lista (sus efectos) y narra qué pasa; después se vuelve a decidir.
   Las reglas automáticas se evalúan en medio (mearse, morir...).
3. **Nada**: se burla (imposible, absurdo, trampa) y se vuelve a decidir.

El servidor valida la opción y la consecuencia: la IA no puede inventar ninguna. Sin IA, con la función apagada
(Ajustes → «Acción libre») o si la IA falla, la opción extra no aparece y la decisión funciona como siempre.
Lo escrito se guarda para la IA tal cual (`como_escribe`, `decisiones`).

## Reacción del narrador (`aiReact`)

Probabilidad (0-1) de que el narrador con IA comente la decisión elegida (prompt `narrate.reaccion`):
`option.aiReact` > `choice.aiReact` > `game.json → ai.reactChance` (este último solo para opciones con `tags`).
`"aiReact": 0` lo apaga en una opción.
