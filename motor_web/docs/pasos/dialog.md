← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `dialog` — Diálogo de personaje

Muestra líneas de texto de un personaje, con su nombre e imagen.

```jsonc
{
  "type": "dialog",
  "character": "narrator",          // ID del personaje en characters
  "lines": [
    "Bienvenido a Viscaria, tierra de babosas.",
    "Espero que hayas traído zapatos impermeables."
  ],
  "condition": { ... }              // Opcional: condición para mostrar
}
```

**Comportamiento:** Muestra header con nombre/imagen del personaje, luego cada línea con delay. Espera Enter entre diálogos. En la primera aparición de un personaje con imagen, se muestra con animación especial.
