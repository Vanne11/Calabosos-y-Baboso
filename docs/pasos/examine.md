← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `examine` — Inspeccionar entorno

El jugador puede examinar múltiples elementos de un escenario. Loop interactivo.

```jsonc
{
  "type": "examine",
  "description": "Observas la habitación detenidamente...",
  "subjects": [
    {
      "id": "desk",
      "label": "📋 Escritorio",
      "text": "Un escritorio polvoriento con cajones cerrados.",
      "effects": { "flags": { "saw_desk": true } },
      "condition": { ... },         // Opcional: oculta si no se cumple
      "oneTime": true               // Desaparece tras examinar
    },
    {
      "id": "painting",
      "label": "🖼️ Cuadro",
      "text": "Un retrato del Rey Baboso en su mejor momento."
    }
  ],
  "exitText": "Dejar de investigar",
  "goto": "siguiente_area"
}
```

**Comportamiento:** Muestra sujetos disponibles en loop. El jugador selecciona uno, ve su texto, y puede seguir examinando o salir. Los sujetos `oneTime` desaparecen tras ser examinados.
