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

### Tramos (`tiers`)

Para más de 4 resultados (como los 6 tramos del guion: 1 / 2-5 / 6-10 / 11-15 / 16-19 / 20), se agregan `tiers`. Si existen, **tienen prioridad** sobre `results` (que se mantiene como resumen para el editor visual).

```jsonc
"tiers": [
  { "natural": 1,  "text": "Pifia...",  "effects": { ... } },   // dado sin modificador
  { "natural": 20, "text": "Crítico...", "goto": "..." },
  { "max": 5,           "text": "Fracaso grave" },             // total = dado + modificador
  { "min": 6, "max": 10, "text": "Fracaso leve" },
  { "min": 11, "max": 15, "text": "Éxito leve" },
  { "min": 16,          "text": "Éxito notable" }
]
```

Primero se busca un tramo con `natural` igual al dado; si no, el primero cuyo total cae en `[min, max]` (límites opcionales). El color y las reacciones del narrador (`diceHooks`) siguen usando el resultado clásico (crítico / éxito / fallo / pifia).


**Mecánica:** Ver [Sistema de Dados](../dados.md).
