← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `level_up` — Pantalla de subir nivel

Muestra interfaz de selección de habilidades al subir de nivel.

```jsonc
{
  "type": "level_up",
  "characterId": "bob",            // Opcional: vacío = protagonista
  "description": "¡Has ganado experiencia!",
  "force": true,                    // true = sube sin chequear XP
  "skillPoints": 2,                 // Puntos de habilidad otorgados (default: 1)
  "goto": "despues_level_up"
}
```

**Comportamiento:** Si `force: false`, verifica que el personaje tenga suficiente XP. Muestra UI con habilidades disponibles del `skillTree`. El jugador gasta puntos en skills. Los `passiveBonus` de las skills se aplican automáticamente como stats del personaje.
