← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `random` — Resultado aleatorio con pesos

Selecciona un resultado al azar basándose en pesos relativos.

```jsonc
{
  "type": "random",
  "outcomes": [
    {
      "weight": 3,                  // 3/5 = 60% de probabilidad
      "text": "No encuentras nada interesante.",
      "effects": { "stats": { "hunger": 5 } }
    },
    {
      "weight": 1,                  // 1/5 = 20%
      "text": "¡Encuentras una moneda!",
      "effects": { "inventory": ["gold_coin"] },
      "goto": "moneda_encontrada"
    },
    {
      "weight": 1,                  // 1/5 = 20%
      "text": "¡Una babosa te ataca!",
      "goto": "encuentro_babosa"
    }
  ]
}
```

**Condiciones por salida:** cada salida puede llevar `"condition"`; solo se sortea entre las que se cumplen (si no
queda ninguna, el paso no hace nada). Ej.: el sueño «vendiste mi relicario» solo si lo vendiste.
