← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `timed_choice` — Decisión con temporizador

Como `choice` pero con cuenta atrás. Si se acaba el tiempo, se selecciona la opción por defecto.

```jsonc
{
  "type": "timed_choice",
  "duration": 10000,               // Milisegundos para decidir
  "defaultIndex": 0,                // Opción seleccionada al expirar
  "timeoutText": "Tardaste demasiado...",
  "options": [
    {
      "text": "¡Saltar!",
      "goto": "saltar",
      "effects": { "stats": { "courage": 10 } }
    },
    {
      "text": "Quedarse quieto",
      "goto": "quieto"
    }
  ]
}
```
