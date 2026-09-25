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

## Rasgos del enemigo y armas

Campos opcionales en `enemy` para darle personalidad a cada combate:

| Campo | Efecto |
|---|---|
| `firstStrike` (+ `firstStrikeText`) | Ataca una vez antes del primer turno del jugador |
| `dodgeChance` | Probabilidad (0-1) de esquivar ataques normales. Un item con `reveal: true` la anula el resto del combate |
| `damagePerTurn` (+ `damagePerTurnText`) | Daño extra al jugador cada ronda mientras siga vivo |
| `corrodes` (+ `corrodeChance`, default 0.5) | Armas (item ids) que puede destruir cuando la atacas con ellas |
| `split: { hp, text }` | Al llegar a 0 HP se divide una vez y vuelve con `hp`, salvo que muera por un item con `preventSplit: true` |
| `deathDamage` (+ `deathText`) | Daño al jugador si muere por un ataque cuerpo a cuerpo (con items no hay riesgo) |

Armas (`weapons`): se usa automáticamente la de mayor `bonus` que el jugador tenga en el inventario; si una se corroe, pasa a la siguiente.

```jsonc
"weapons": [{ "itemId": "espada_oxidada", "name": "la espada oxidada", "bonus": 4 }],
"combatItems": [
  { "itemId": "sal", "name": "Lanzar sal", "damage": 12, "consume": false, "preventSplit": true, "text": "..." },
  { "itemId": "antorcha", "name": "Alzar la antorcha", "damage": 6, "consume": false, "reveal": true, "text": "..." }
]
```

Los textos de resultado (`victory`/`defeat`/`flee`) admiten variables. El botón genérico «use_item» no se muestra: cada item usable tiene su propio botón.

## Protección de objetos (`items.armor`)

Un objeto con `"armor": N` en `game.json → items` protege por llevarlo encima: cada golpe enemigo hace N menos de
daño (mínimo 1; cada objeto cuenta una vez aunque tengas varios). Al empezar el combate se avisa qué te protege.
En Calabosos: amuletos y la camiseta del Abismo.

## Acciones pagadas con stats (`combatItems[].cost`)

Un objeto de combate con `"cost": { "dinero": 10 }` no pide tener un objeto: se ofrece si alcanzan las stats y al
usarlo las cobra. En Calabosos: lanzar monedas (10), barrera de cobre (15, las Gemelas no se dividen) y darle de
comer monedas al Rey (30).
