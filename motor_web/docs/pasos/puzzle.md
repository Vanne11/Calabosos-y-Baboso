← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `puzzle` — Acertijos interactivos

Cuatro tipos de puzzles: código, secuencia, acertijo y candado.

## Tipo: `code` (escribir respuesta)

```jsonc
{
  "type": "puzzle",
  "puzzleType": "code",
  "description": "Una puerta con inscripciones...",
  "config": {
    "type": "code",
    "answers": ["viscaria", "babosa"],  // Respuestas válidas (case-insensitive)
    "prompt": "Escribe la contraseña:",
    "hint": "El nombre del reino..."
  },
  "maxAttempts": 3,                // 0 = infinitos
  "hintText": "Piensa en el reino...",
  "success": {
    "text": "¡La puerta se abre!",
    "effects": { "flags": { "puzzle_solved": true } },
    "goto": "interior"
  },
  "failure": {
    "text": "La puerta permanece cerrada.",
    "goto": "buscar_pista"
  }
}
```

## Tipo: `riddle` (respuesta libre, match parcial)

```jsonc
{
  "puzzleType": "riddle",
  "config": {
    "type": "riddle",
    "question": "¿Qué tiene raíces que nadie ve, es más alta que los árboles?",
    "answers": ["montaña", "la montaña"],
    "hint": "Piensa en grande..."
  }
}
```

## Tipo: `lock` (combinación numérica)

```jsonc
{
  "puzzleType": "lock",
  "config": {
    "type": "lock",
    "digits": 4,
    "combination": "4829",
    "hint": "Mira los números en la pared..."
  }
}
```

## Tipo: `sequence` (ordenar elementos)

```jsonc
{
  "puzzleType": "sequence",
  "config": {
    "type": "sequence",
    "elements": [
      { "id": "sun", "label": "☀️ Sol" },
      { "id": "moon", "label": "🌙 Luna" },
      { "id": "star", "label": "⭐ Estrella" }
    ],
    "hint": "Del más grande al más pequeño..."
  }
}
```
