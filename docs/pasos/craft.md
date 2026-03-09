← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `craft` — Sistema de Crafting

Sistema de crafting con mesa dinámica, múltiples acciones y herramientas fijas.

## Formato JSON

```jsonc
{
  "type": "craft",
  "description": "Mesa de alquimia",
  "tableItems": ["olla_alquimia", "cuchillo_alquimia"],  // Items fijos en la mesa (no se pueden recoger)
  "recipes": [
    {
      "action": "combine",                // Acción requerida (ver tabla abajo)
      "ingredients": ["hierba_curativa", "frasco_vacio"],
      "result": "elixir_baboso",
      "text": "¡Has creado un Elixir Baboso!",
      "consume": true,                    // Consume ingredientes (default: true)
      "effects": { "stats": { "alchemy": 5 } },
      "goto": "pocion_creada"             // Opcional
    },
    {
      "action": "cut",
      "tool": "cuchillo_alquimia",        // Herramienta requerida (debe estar en mesa)
      "ingredients": ["hierba_curativa"],
      "result": "hierba_picada",
      "text": "Picas la hierba en trozos finos.",
      "consumeTool": false                // No consume la herramienta (default: false)
    },
    {
      "action": "apply",
      "substance": "grasa_babosa",        // Sustancia a aplicar
      "target": "espada_oxidada",         // Objetivo
      "ingredients": ["grasa_babosa", "espada_oxidada"],
      "result": "espada_engrasada",
      "bonusResults": [],                 // Items extra creados (opcional)
      "text": "La espada brilla con un resplandor viscoso.",
      "consume": true
    }
  ],
  "failText": "Eso no tiene ningún sentido...",
  "goto": "despues_del_craft"             // Escena al salir
}
```

## 5 Tipos de Acción (`CraftAction`)

| Acción | Sintaxis terminal | Descripción |
|---|---|---|
| `combine` | `combinar item1 + item2` | Combina dos o más items (default) |
| `use` | `usar item` | Usa un item solo |
| `apply` | `aplicar sustancia en objetivo` | Aplica una sustancia sobre un objetivo |
| `cut` | `cortar item` | Corta un item con una herramienta |
| `chop` | `picar item` | Pica un item con una herramienta |

## Mesa Dinámica

La mesa de craft es **dinámica**: los resultados de recetas se quedan en la mesa en lugar de ir al inventario. El jugador debe recogerlos explícitamente.

- **Items fijos** (`tableItems`): Definidos en el paso. No se pueden recoger (ej: olla, alambique).
- **Items del jugador**: Se colocan desde el inventario al inicio.
- **Resultados**: Al craftear, el resultado aparece en la mesa. El jugador puede usarlo en otra receta o recogerlo.

### Recoger items

El jugador escribe `recoger [item]` o `pickup [item]` para mover un item de la mesa a su inventario. Los items fijos (`isFixed: true`) no se pueden recoger.

## Campos de CraftRecipe

| Campo | Tipo | Descripción |
|---|---|---|
| `action` | `CraftAction` | Tipo de acción (default: `"combine"`) |
| `tool` | `string` | ID del item herramienta requerida |
| `ingredients` | `string[]` | Items necesarios (en mesa o inventario) |
| `substance` | `string` | Sustancia a aplicar (para `apply`) |
| `target` | `string` | Objetivo de la aplicación (para `apply`) |
| `result` | `string` | ID del item resultante |
| `bonusResults` | `string[]` | Items extra producidos |
| `text` | `string` | Texto al craftear exitosamente |
| `consume` | `boolean` | Consume ingredientes (default: `true`) |
| `consumeTool` | `boolean` | Consume la herramienta (default: `false`) |
| `effects` | `Effects` | Efectos al craftear |
| `goto` | `string` | Escena de destino tras craftear |

## CraftPrompt (StepResult)

```typescript
interface CraftPrompt {
  type: 'craft_prompt';
  description?: string;
  tableItems: { id: string; name: string; isFixed: boolean }[];
  availableActions: CraftAction[];
  failText: string;
}
```

## PlayerActions de Craft

```typescript
| { type: 'craft_combine'; items: string[] }     // Combinar items
| { type: 'craft_apply'; substance: string; target: string }  // Aplicar
| { type: 'craft_cut'; item: string }             // Cortar
| { type: 'craft_chop'; item: string }            // Picar
| { type: 'craft_pickup'; index: number }           // Recoger de la mesa (por índice)
| { type: 'craft_exit' }                           // Salir
```

## Ejemplo completo (demo2)

```jsonc
{
  "type": "craft",
  "description": "Una mesa de alquimia con una olla ennegrecida, un alambique y un cuchillo afilado.",
  "tableItems": ["olla_alquimia", "alambique", "cuchillo_alquimia"],
  "recipes": [
    {
      "action": "combine",
      "ingredients": ["hierba_curativa", "frasco_vacio"],
      "result": "elixir_baboso",
      "text": "Mezclas la hierba en el frasco con agua de la mazmorra. ¡Elixir Baboso creado!",
      "consume": true
    },
    {
      "action": "cut",
      "tool": "cuchillo_alquimia",
      "ingredients": ["hierba_curativa"],
      "result": "hierba_picada",
      "text": "Picas la hierba curativa en trozos finos con el cuchillo.",
      "consumeTool": false
    },
    {
      "action": "apply",
      "substance": "grasa_babosa",
      "target": "espada_oxidada",
      "ingredients": ["grasa_babosa", "espada_oxidada"],
      "result": "espada_engrasada",
      "text": "Untas la grasa sobre la espada. El óxido se disuelve y el metal brilla.",
      "consume": true
    }
  ],
  "failText": "Miras los ingredientes con confusión. Eso no va a funcionar.",
  "goto": "post_craft"
}
```
