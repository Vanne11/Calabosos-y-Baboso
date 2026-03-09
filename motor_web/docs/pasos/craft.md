← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `craft` — Combinar items del inventario

Sistema de crafting: el jugador selecciona items para combinar.

```jsonc
{
  "type": "craft",
  "description": "Mesa de alquimia",
  "recipes": [
    {
      "ingredients": ["herb", "water"],
      "result": "potion",
      "text": "¡Has creado una Poción de Vida!",
      "consume": true,             // Consume los ingredientes (default: true)
      "effects": { "stats": { "alchemy": 5 } },
      "goto": "pocion_creada"      // Opcional
    },
    {
      "ingredients": ["stick", "rock"],
      "result": "crude_axe",
      "text": "Has improvisado un hacha tosca.",
      "consume": true
    }
  ],
  "failText": "Eso no tiene ningún sentido...",
  "goto": "despues_del_craft"      // Escena al salir sin craftear
}
```

**Comportamiento:** Compara ingredientes sin importar el orden. Si coincide una receta y el jugador tiene todos los ingredientes, craftea y sale. Si no, muestra `failText`.
