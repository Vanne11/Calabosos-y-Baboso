← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `check` — Comprobación determinista de stat

Similar a `dice` pero sin azar: compara directamente el valor de una stat con un umbral.

```jsonc
{
  "type": "check",
  "stat": "perception",
  "threshold": ">=50",             // Operadores: >=, <=, >, <, ==
  "description": "Comprobación de Percepción",
  "success": {
    "text": "Notas algo brillante entre los arbustos.",
    "effects": { "flags": { "found_gem": true } },
    "goto": "gema_encontrada"
  },
  "failure": {
    "text": "No ves nada fuera de lo normal.",
    "goto": "siguiente_area"
  }
}
```
