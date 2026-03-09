← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `input` — Entrada de texto libre

Pide al jugador que escriba texto. Se guarda como stat.

```jsonc
{
  "type": "input",
  "prompt": "¿Cuál es tu nombre, aventurero?",
  "saveAs": "player_name",         // Se guarda en stats[saveAs]
  "goto": "despues_del_nombre",    // Opcional
  "condition": { ... }
}
```

**Uso común:** Nombre del personaje, contraseñas, respuestas libres.
