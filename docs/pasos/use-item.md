← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `use_item` — Usar item en objetivo del entorno

Estilo LucasArts: "Usar [item] en [objetivo]".

```jsonc
{
  "type": "use_item",
  "description": "Hay una puerta cerrada y una cerradura oxidada.",
  "targets": [
    {
      "id": "door_lock",
      "label": "🔒 Cerradura",
      "accepts": [
        {
          "itemId": "rusty_key",
          "text": "¡La llave encaja! La puerta se abre con un chirrido.",
          "consume": true,          // Consume el item (default: true)
          "effects": { "flags": { "door_opened": true } },
          "goto": "habitacion_secreta"
        },
        {
          "itemId": "lockpick",
          "text": "Fuerzas la cerradura... funciona.",
          "consume": true,
          "goto": "habitacion_secreta"
        }
      ],
      "defaultText": "Eso no funciona con la cerradura."
    }
  ],
  "failText": "No puedes usar eso aquí.",
  "exitText": "Olvidarlo",
  "goto": "siguiente_area"
}
```

**Comportamiento:** El jugador ve los targets y su inventario. Selecciona un item y un target. Si el item está en `accepts`, éxito. Si no, muestra `defaultText` o `failText`.
