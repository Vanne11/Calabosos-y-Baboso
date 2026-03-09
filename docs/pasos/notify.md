← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `notify` — Notificación/toast

Muestra una notificación visual con estilo.

```jsonc
{
  "type": "notify",
  "style": "achievement",          // achievement | warning | info | discovery
  "title": "¡Logro Desbloqueado!",
  "text": "Has sobrevivido al primer día.",
  "icon": "🏆",                   // Opcional (se deduce del style)
  "effects": { ... }               // Opcional
}
```
