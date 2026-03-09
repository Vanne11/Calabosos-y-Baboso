← [Volver al índice](README.md)

# Sistema de Dados (DiceRoller)

**Archivo:** `src/engine/DiceRoller.ts`

## Mecánica

1. Se lanza un dado de N caras (normalmente D20)
2. Se calcula el modificador basado en la stat relevante
3. Se suma: `total = roll + modifier`
4. Se compara con la dificultad

## Cálculo del modificador

```
modifier = floor(statValue / divider) - 5
```

Con `divider = 10` (default):
- Stat 100 → +5
- Stat 70 → +2
- Stat 50 → 0
- Stat 30 → -2
- Stat 0 → -5

## Resultados

| Resultado | Condición |
|---|---|
| `critical_success` | El dado sacó el valor máximo (nat 20 en D20) |
| `success` | total ≥ difficulty |
| `failure` | total < difficulty |
| `critical_failure` | El dado sacó 1 (nat 1) |

Los críticos tienen prioridad sobre el resultado normal.
