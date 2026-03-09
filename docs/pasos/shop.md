← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `shop` — Interfaz de tienda

Sistema de compra/venta interactivo con una stat como moneda.

```jsonc
{
  "type": "shop",
  "title": "Tienda de Nerly",
  "currency": "gold",              // Stat usada como dinero
  "items": [
    {
      "id": "sword",
      "name": "Espada Oxidada",
      "price": 15,
      "description": "Apenas corta mantequilla",
      "effects": {                  // Efectos extra al comprar
        "stats": { "attack": 5 }
      }
    },
    {
      "id": "potion",
      "name": "Poción de Vida",
      "price": 10,
      "description": "Sabe a barro"
    }
  ],
  "sellable": true,                // ¿Se puede vender?
  "sellRatio": 0.5,                // Precio de venta = precio * ratio
  "goto": "despues_de_tienda"      // Escena al salir
}
```

**Comportamiento:** Loop interactivo de compra/venta. El jugador ve sus monedas, items disponibles y puede comprar/vender. Sale con `shop_exit`.
