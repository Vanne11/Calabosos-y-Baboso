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
  "pool": "burlas",                 // Opcional: pool de game.json → linePools
  "count": 1,                       // Opcional: cuántas líneas sacar del pool (default 1)
  "condition": { ... }              // Opcional: condición para mostrar
}
```

- Las líneas admiten variables: `{nombre_jugador}`, `{dinero}`, `{meta.muertes}` (ver [Texto Narrativo](../narrativa.md)).
- Con `pool`, las líneas del pool se muestran después de `lines` (que puede ser `[]`). No se repiten hasta agotar las elegibles.
- Si al final no hay ninguna línea (pool vacío o sin líneas elegibles), el paso no muestra nada.

**Comportamiento:** Muestra header con nombre/imagen del personaje, luego cada línea con delay. Espera Enter entre diálogos. En la primera aparición de un personaje con imagen, se muestra con animación especial.
