← [Volver al índice](README.md)

# Comunicación Motor <> UI (StepResult / PlayerAction)

**Archivo:** `src/types/engine.ts`

## StepResult (Motor → UI)

El motor yield-ea estos tipos. La UI renderiza cada uno según su tipo.

| Tipo | Requiere input | Descripción |
|---|---|---|
| `scenario` | No | Cambio de escena (nombre, descripción, imagen, música) |
| `dialog` | No* | Diálogo de personaje (espera Enter) |
| `choice_prompt` | Sí | Opciones para elegir |
| `dice_prompt` | Sí | Solicitud de tirar dados |
| `dice_result` | No | Resultado de la tirada |
| `input_prompt` | Sí | Solicitud de texto libre |
| `effects` | No | Efectos aplicados (para debug/sync) |
| `navigate` | No | Ir a otra escena |
| `game_end` | No | Fin del juego |
| `check_result` | No | Resultado de comprobación |
| `random_result` | No | Resultado aleatorio |
| `shop_prompt` | Sí | Interfaz de tienda |
| `combat_prompt` | Sí | Turno de combate |
| `combat_turn` | No | Resultado de un turno |
| `combat_end` | No | Fin del combate |
| `notify` | No | Notificación visual |
| `wait` | No | Pausa dramática |
| `sound` | No | Reproducir sonido |
| `craft_prompt` | Sí | Interfaz de crafting |
| `craft_result` | No | Resultado del craft |
| `puzzle_prompt` | Sí | Interfaz de puzzle |
| `puzzle_attempt` | No | Resultado de intento |
| `examine_prompt` | Sí | Interfaz de examinar |
| `examine_result` | No | Texto de examen |
| `use_item_prompt` | Sí | Interfaz de usar item |
| `use_item_result` | No | Resultado de uso |
| `timed_choice_prompt` | Sí | Opciones con timer |
| `level_up_prompt` | Sí | Interfaz de level up |
| `level_up_result` | No | Resultado del level up |
| `xp_gain` | No | Ganancia de XP |
| `relationship_change` | No | Cambio de afinidad |
| `trait_change` | No | Rasgos ganados/perdidos |

## PlayerAction (UI → Motor)

Acciones que la UI envía cuando el motor espera input:

```typescript
type PlayerAction =
  | { type: 'choose'; index: number }           // Elegir opción
  | { type: 'roll_dice' }                        // Tirar dado
  | { type: 'submit_input'; value: string }      // Enviar texto
  | { type: 'continue' }                         // Continuar
  | { type: 'shop_buy'; itemIndex: number }      // Comprar item
  | { type: 'shop_sell'; itemId: string }         // Vender item
  | { type: 'shop_exit' }                        // Salir de tienda
  | { type: 'combat_action'; action: string }    // Acción de combate
  | { type: 'craft_combine'; items: string[] }   // Combinar items
  | { type: 'craft_apply'; substance: string; target: string } // Aplicar sustancia
  | { type: 'craft_cut'; item: string }          // Cortar item
  | { type: 'craft_chop'; item: string }         // Picar item
  | { type: 'craft_pickup'; item: string }       // Recoger de la mesa
  | { type: 'craft_exit' }                       // Salir de craft
  | { type: 'puzzle_attempt'; answer: string | string[] }  // Intentar puzzle
  | { type: 'puzzle_exit' }                      // Rendirse en puzzle
  | { type: 'examine_select'; subjectId: string } // Examinar sujeto
  | { type: 'examine_exit' }                     // Dejar de examinar
  | { type: 'use_item_on'; itemId: string; targetId: string } // Usar item
  | { type: 'use_item_exit' }                    // Dejar de intentar
  | { type: 'level_up_skill'; skillId: string }  // Aprender skill
  | { type: 'level_up_done' }                    // Terminar level up
```
