← [Volver al índice](README.md)

# Sistemas RPG Avanzados

## Sistema de Niveles y XP

Cada personaje con `role: 'protagonist'` o `'companion'` tiene:
- **Nivel** (empieza en 1)
- **XP** (experiencia acumulada)
- **Curva de XP**: array donde `xpCurve[i]` = XP para pasar de nivel `i+1` a `i+2`
- **Puntos de habilidad**: se ganan al subir de nivel

XP se otorga mediante efectos: `{ "xp": { "bob": 50 } }`

## Sistema de Habilidades (Skill Trees)

Cada personaje puede tener un `skillTree` asignado. Las skills:
- Tienen `maxLevel` (nivel máximo)
- Cuestan `cost` puntos de habilidad por nivel
- Pueden requerir `prerequisites` (otras skills)
- Otorgan `passiveBonus` (stats permanentes al aprender)
- Tienen `tags` para condicionales

## Sistema de Rasgos (Traits)

Los rasgos son estados que afectan al personaje:
- **Permanentes**: nunca expiran
- **Temporales**: expiran tras N escenas (`duration`)
- Pueden modificar stats (`statModifiers`)
- Pueden modificar tiradas de dados (`diceModifier`)
- Se usan en condiciones (`hasTraits`, `notTraits`)

## Sistema de Relaciones (Affinity)

Cada NPC tiene un valor de afinidad (-100 a +100) que determina su `tier`:

| Tier | Rango |
|---|---|
| Hostil | < -30 |
| Desconfiado | -30 a -10 |
| Neutral | -10 a 20 |
| Amigable | 20 a 50 |
| Aliado | 50 a 80 |
| Leal | >= 80 |

Se modifica con efectos: `{ "affinity": { "nerly": 10 } }`
Se evalúa en condiciones: `{ "affinity": { "nerly": ">=50" } }` o `{ "relationshipTier": { "nerly": "friendly" } }`

## Sistema de Compañeros

Los personajes con `role: 'companion'` se activan cuando su `joinFlag` es `true` en el estado. Los compañeros activos se muestran en la barra de estado.

## Stats especiales

| Stat | Efecto |
|---|---|
| `_protagonist_image` | Si se asigna como string, cambia la imagen del protagonista |
