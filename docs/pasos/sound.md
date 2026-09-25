← [Volver a Pasos](README.md) | [Volver al índice](../README.md)

# `sound` — Efecto de sonido puntual

Reproduce un sonido one-shot (no reemplaza la música de fondo). Puede ser un efecto **sintetizado**
del catálogo (`sfx`) o un archivo del juego (`src`).

```jsonc
{
  "type": "sound",
  "sfx": "puerta",                 // efecto del catálogo (lista: /debug sfx)
  "volume": 0.8,                   // 0-1, por defecto 1
  "wait": true                     // esperar a que termine antes del siguiente paso
}

{ "type": "sound", "src": "audio/explosion.ogg" }   // archivo propio
```

Para sonidos al entrar a una escena, en opciones, dados, enemigos, etc., ver [Sistema de Audio](../audio.md).
