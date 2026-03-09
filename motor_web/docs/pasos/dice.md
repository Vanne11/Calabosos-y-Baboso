← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `dice` — Tirada de dados

Sistema D20 con modificadores basados en stats del jugador.

```jsonc
{
  "type": "dice",
  "stat": "reputation",            // Stat que modifica la tirada
  "difficulty": 13,                 // Número a superar
  "faces": 20,                     // Caras del dado (normalmente 20)
  "description": "Tirada de Reputación",
  "results": {
    "critical_success": {           // Opcional: dado == faces (nat 20)
      "text": "¡Éxito legendario!",
      "effects": { "stats": { "reputation": 20 } },
      "goto": "resultado_epico"
    },
    "success": {                    // Obligatorio: total >= difficulty
      "text": "Has logrado convencer al guardia.",
      "effects": { "stats": { "reputation": 5 } },
      "goto": "exito"
    },
    "failure": {                    // Obligatorio: total < difficulty
      "text": "El guardia te mira con desprecio.",
      "effects": { "stats": { "reputation": -5 } },
      "goto": "fallo"
    },
    "critical_failure": {           // Opcional: dado == 1 (nat 1)
      "text": "Has tropezado y caído en barro.",
      "effects": { "stats": { "reputation": -15 } },
      "goto": "desastre"
    }
  }
}
```

**Mecánica:** Ver [Sistema de Dados](../dados.md).
