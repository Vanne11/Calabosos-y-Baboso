← [Volver al índice](README.md)

# Sistema de Condiciones

**Archivo:** `src/engine/ConditionEvaluator.ts`

Las condiciones se evalúan con lógica AND: **todas** las reglas deben cumplirse.

## StepCondition

```typescript
interface StepCondition {
  stats?: Record<string, string>;          // { "perception": ">=50" }
  flags?: Record<string, boolean>;         // { "intro_done": true }
  inventory?: string[];                    // ["sword", "key"]
  visitedScenes?: string[];                // ["tienda", "callejon"]
  unvisitedScenes?: string[];              // ["final"]
  skillLevel?: Record<string, string>;     // { "fireball": ">=2" }
  affinity?: Record<string, string>;       // { "nerly": ">=50" }
  hasTraits?: string[];                    // ["valiente"]
  notTraits?: string[];                    // ["envenenado"]
  characterLevel?: Record<string, string>; // { "bob": ">=3" }
  relationshipTier?: Record<string, RelationshipTier>; // { "nerly": "friendly" }
}
```

## Operadores de comparación

Se usan en `stats`, `skillLevel`, `affinity`, `characterLevel`:

| Operador | Significado |
|---|---|
| `>=50` | Mayor o igual a 50 |
| `<=30` | Menor o igual a 30 |
| `>0` | Estrictamente mayor que 0 |
| `<100` | Estrictamente menor que 100 |
| `==42` | Exactamente igual a 42 |
| `!=0` | Diferente de 0 |
| `50` | Sin operador → se usa `>=` por defecto |

## Tiers de relación

```
hostile    (afinidad < -30)
distrustful (-30 ≤ afinidad < -10)
neutral    (-10 ≤ afinidad < 20)
friendly   (20 ≤ afinidad < 50)
allied     (50 ≤ afinidad < 80)
loyal      (afinidad ≥ 80)
```

## Uso en pasos

Cada paso tiene un campo `condition` opcional. Si la condición no se cumple, el paso se salta:

```jsonc
{
  "type": "dialog",
  "character": "nerly",
  "lines": ["¡Veo que tienes la espada legendaria!"],
  "condition": {
    "inventory": ["legendary_sword"],
    "flags": { "nerly_met": true }
  }
}
```

Las opciones de `choice` también pueden tener condiciones individuales (se ocultan si no se cumplen).
