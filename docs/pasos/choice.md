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
