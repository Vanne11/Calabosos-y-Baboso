← [Volver al índice](../README.md)

# Sistema de Tipos de Pasos (SequenceStep)

El motor soporta **18 tipos de pasos** que se pueden combinar libremente en la secuencia de una escena.

| Tipo | Descripción | Input | Documentación |
|---|---|---|---|
| `dialog` | Diálogo de personaje | No (espera Enter) | [dialog.md](dialog.md) |
| `choice` | Opciones del jugador | Sí | [choice.md](choice.md) |
| `dice` | Tirada D20 con modificadores | Sí | [dice.md](dice.md) |
| `input` | Entrada de texto libre | Sí | [input.md](input.md) |
| `effects` | Aplicar efectos silenciosamente | No | [effects.md](effects.md) |
| `branch` | Bifurcación automática por condiciones | No | [branch.md](branch.md) |
| `random` | Resultado aleatorio con pesos | No | [random.md](random.md) |
| `check` | Comprobación determinista de stat | No | [check.md](check.md) |
| `shop` | Interfaz de tienda compra/venta | Sí | [shop.md](shop.md) |
| `combat` | Combate por turnos | Sí | [combat.md](combat.md) |
| `notify` | Notificación visual | No | [notify.md](notify.md) |
| `wait` | Pausa dramática | No | [wait.md](wait.md) |
| `sound` | Efecto de sonido | No | [sound.md](sound.md) |
| `craft` | Combinar items | Sí | [craft.md](craft.md) |
| `puzzle` | Acertijo (code/riddle/lock/sequence) | Sí | [puzzle.md](puzzle.md) |
| `examine` | Inspeccionar entorno | Sí | [examine.md](examine.md) |
| `use_item` | Usar item en objetivo (estilo LucasArts) | Sí | [use-item.md](use-item.md) |
| `timed_choice` | Opciones con temporizador | Sí | [timed-choice.md](timed-choice.md) |
| `level_up` | Pantalla de subir nivel / skills | Sí | [level-up.md](level-up.md) |
