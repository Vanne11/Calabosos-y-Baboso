← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `combat` — Combate por turnos

Sistema de combate con HP, ataque, defensa y acciones.

```jsonc
{
  "type": "combat",
  "enemy": {
    "name": "Rey Baboso",
    "image": "images/rey_baboso.png",
    "hp": 50,
    "attack": 8,
    "defense": 3
  },
  "playerStat": "will_to_live",    // Stat del jugador como HP
  "attackStat": "attack",           // Stat que afecta daño
  "defenseStat": "defense",         // Stat que reduce daño (opcional)
  "actions": ["attack", "defend", "flee", "use_item"],
  "combatItems": [                  // Items usables en combate (opcional)
    {
      "itemId": "sal_anti_babosas",
      "name": "Sal Anti-Babosas",
      "text": "¡Lanzas sal al Rey Baboso! Se retuerce de dolor.",
      "damage": 25,
      "consume": true
    },
    {
      "itemId": "potion",
      "name": "Poción de Vida",
      "text": "Bebes la poción y sientes vigor renovado.",
      "heal": 30,
      "consume": true
    }
  ],
  "results": {
    "victory": {
      "text": "¡Has derrotado al Rey Baboso!",
      "effects": {
        "flags": { "rey_derrotado": true },
        "xp": { "bob": 100 }
      },
      "goto": "victoria_final"
    },
    "defeat": {
      "text": "El Rey Baboso te ha aplastado...",
      "goto": "_game_over"
    },
    "flee": {                       // Opcional
      "text": "Huyes cobardemente.",
      "effects": { "stats": { "reputation": -10 } },
      "goto": "huida"
    }
  }
}
```

## Mecánica de combate

| Acción | Efecto |
|---|---|
| `attack` | Daño = `floor(attackStat/10) + random(1-6)`. Enemigo contraataca |
| `defend` | Daño recibido reducido al 50%. No atacas |
| `flee` | Sale del combate si hay resultado `flee` definido |
| `use_item:ID` | Usa un item de `combatItems`. Puede hacer daño, curar, y/o tener efectos. Enemigo contraataca si sobrevive |

**Daño enemigo:** `max(1, enemy.attack - floor(defenseStat/20)) + random(0-3)`
**Defendiendo:** `max(1, floor(daño_base * 0.5))`
