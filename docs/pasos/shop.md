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

### Multiplicadores de precio (`priceMultipliers`)

Cambian todos los precios según una condición (el primero que se cumpla). Útil para que un regateo previo (por ejemplo un `ai_chat` en modo `negociar`) afecte a la tienda.

```jsonc
"priceMultipliers": [
  { "condition": { "flags": { "descuento_grande": true } }, "multiplier": 0.5, "text": "Todo a mitad de precio." },
  { "condition": { "flags": { "precio_ofendido": true } }, "multiplier": 1.5 }
]
```

Si hay `text`, se muestra como aviso antes de abrir la tienda. Los precios se redondean y nunca bajan de 1.


**Comportamiento:** Loop interactivo de compra/venta. El jugador ve sus monedas, items disponibles y puede comprar/vender. Sale con `shop_exit`.

**Memoria de la IA:** al salir, lo que hizo el jugador (compras, ventas, regateos, robos, engaños, si lo echaron) queda
en la memoria general y en la del dueño: `"npc": "tendero"` (si falta, el último personaje que habló en el lugar).
Así, cuando después le hablas, sabe lo que le compraste.
