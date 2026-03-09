← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `branch` — Bifurcación automática

Evalúa condiciones en orden y navega a la primera que se cumpla. No requiere input del jugador.

```jsonc
{
  "type": "branch",
  "branches": [
    {
      "condition": { "flags": { "has_key": true } },
      "goto": "puerta_abierta"
    },
    {
      "condition": { "stats": { "strength": ">=80" } },
      "goto": "puerta_forzada"
    },
    {
      "goto": "puerta_cerrada"     // Sin condición = fallback
    }
  ]
}
```

**Comportamiento:** Evalúa cada `condition` en orden. La primera que pasa, navega a su `goto`. Si ninguna pasa, continúa con el siguiente paso.
