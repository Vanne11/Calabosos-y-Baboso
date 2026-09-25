← [Volver al índice](README.md)

# Sistema de Efectos

**Archivo:** `src/engine/EffectsApplier.ts`

## Estructura de Effects

```typescript
interface Effects {
  // --- Stats ---
  stats?: Record<string, number | string>;     // Suma relativa: { "gold": 10 } → gold += 10
  setStats?: Record<string, number | string>;  // Asignación absoluta: { "gold": 100 } → gold = 100

  // --- Flags ---
  flags?: Record<string, boolean>;              // { "door_opened": true }

  // --- Inventario ---
  inventory?: string[];                         // Añadir items: ["sword", "shield"]
  removeInventory?: string[];                   // Quitar items: ["old_key"]
  clearInventory?: boolean;                     // Vaciar todo el inventario

  // --- RPG ---
  xp?: Record<string, number>;                 // Dar XP: { "bob": 50, "nerly": 20 }
  affinity?: Record<string, number>;            // Cambiar afinidad: { "nerly": 10 }
  addTraits?: string[];                         // Añadir rasgos: ["envenenado"]
  removeTraits?: string[];                      // Quitar rasgos: ["maldito"]
  learnSkill?: Record<string, number>;          // Aprender skill: { "fireball": 1 }
  giveSkillPoints?: Record<string, number>;     // Dar puntos: { "bob": 2 }

  // --- Meta (persisten entre partidas) ---
  meta?: Record<string, number>;                // Sumar a contadores: { "muertes": 1 }
  unlockCodex?: string[];                       // Desbloquear entradas del códice: ["babosa_acida"]
  checkpoint?: boolean;                         // Guardar punto seguro aquí (volver con goto "_checkpoint")
}
```

Después de aplicar cualquier efecto, el motor recorta las stats a los `min`/`max` de `statDefs` y evalúa las [reglas automáticas](narrativa.md#reglas-automáticas-statrules). Todos los pasos (tienda, combate, crafteo...) aplican efectos por el mismo camino (`GameEngine.applyState`).

## Comportamiento de stats vs setStats

```jsonc
// Estado: { gold: 50 }
{ "stats": { "gold": 10 } }       // → gold = 60 (suma)
{ "stats": { "gold": -20 } }      // → gold = 30 (resta)
{ "setStats": { "gold": 100 } }   // → gold = 100 (asignación directa)

// Strings se asignan directamente
{ "stats": { "player_name": "BOB" } }  // → player_name = "BOB"
```

## Afinidad

La afinidad se clampea entre -100 y +100:
```jsonc
{ "affinity": { "nerly": 10 } }   // nerly.affinity += 10 (max 100)
{ "affinity": { "nerly": -20 } }  // nerly.affinity -= 20 (min -100)
```
