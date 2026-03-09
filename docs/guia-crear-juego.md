← [Volver al índice](README.md)

# Guía para Crear un Juego

## Paso 1: Crear la estructura

```
public/games/mi_juego/
├── game.json          # Manifiesto
├── scenes.json        # Escenas
├── images/            # Imágenes
│   ├── plaza.png
│   └── personaje.png
└── audio/             # Música y sonidos
    └── theme.mp3
```

## Paso 2: Crear game.json

Definir personajes, stats iniciales, items:

```json
{
  "name": "Mi Aventura",
  "description": "Una aventura de prueba",
  "author": "Yo",
  "version": "1.0.0",
  "characters": {
    "narrator": { "name": "Narrador", "role": "narrator" }
  },
  "initialStats": { "will_to_live": 100 },
  "initialFlags": {},
  "initialInventory": [],
  "time": { "duration": 5, "phases": ["morning"], "initial": "morning" }
}
```

## Paso 3: Crear scenes.json con escena `start`

```json
{
  "scenes": {
    "start": {
      "scenario": { "name": "Inicio", "description": "El comienzo..." },
      "sequence": [
        {
          "type": "dialog",
          "character": "narrator",
          "lines": ["Bienvenido a la aventura."]
        },
        {
          "type": "choice",
          "options": [
            { "text": "Explorar", "goto": "exploracion" },
            { "text": "Salir", "goto": "_quit" }
          ]
        }
      ]
    },
    "exploracion": {
      "scenario": { "name": "Exploración" },
      "sequence": [
        {
          "type": "dialog",
          "character": "narrator",
          "lines": ["Has llegado al final de la demo."]
        },
        {
          "type": "choice",
          "options": [
            { "text": "Reiniciar", "goto": "_restart" },
            { "text": "Salir", "goto": "_quit" }
          ]
        }
      ]
    }
  }
}
```

## Paso 4: Registrar en index.json

```json
{ "games": ["demo", "mi_juego"] }
```

## Paso 5: Probar

```bash
npm run dev
# En la terminal: run mi_juego
```

## Alternativa: Usar el Editor Visual

```
# En la terminal del motor:
editor
# o para editar un juego existente:
editor demo
```

El editor permite crear escenas, conectarlas visualmente, añadir pasos, y exportar el juego como ZIP.

---

## Apéndice: Ejemplo Completo de Secuencia

```jsonc
// scenes.json — Escena de la tienda
{
  "scenes": {
    "tienda": {
      "scenario": {
        "name": "Tienda de Nerly",
        "image": "images/tienda.png",
        "music": "audio/shop.mp3",
        "description": "Una tienda húmeda llena de objetos dudosos."
      },
      "sequence": [
        // 1. Diálogo de bienvenida
        {
          "type": "dialog",
          "character": "nerly",
          "lines": [
            "¡Bienvenido a mi tienda, querido!",
            "Tengo ofertas especiales para aventureros suicidas."
          ]
        },

        // 2. Diálogo condicional (solo si es la primera visita)
        {
          "type": "dialog",
          "character": "nerly",
          "lines": ["Es tu primera vez aquí, ¿verdad? Te haré un descuento."],
          "condition": { "unvisitedScenes": ["tienda"] }
        },

        // 3. Notificación si tiene reputación alta
        {
          "type": "notify",
          "style": "info",
          "title": "Descuento VIP",
          "text": "Tu reputación te precede. 20% de descuento.",
          "condition": { "stats": { "reputation": ">=80" } }
        },

        // 4. Tirada para regatear
        {
          "type": "dice",
          "stat": "reputation",
          "difficulty": 12,
          "faces": 20,
          "description": "Tirada de Regateo",
          "results": {
            "success": {
              "text": "Nerly se ríe: 'Eres bueno regateando...'",
              "effects": { "stats": { "gold": 5 }, "affinity": { "nerly": 5 } }
            },
            "failure": {
              "text": "Nerly te mira fijamente. 'Precio completo.'",
              "effects": { "affinity": { "nerly": -2 } }
            }
          }
        },

        // 5. Tienda
        {
          "type": "shop",
          "title": "Tienda de Nerly",
          "currency": "gold",
          "items": [
            { "id": "sword", "name": "Espada", "price": 15 },
            { "id": "potion", "name": "Poción", "price": 8 }
          ],
          "sellable": true,
          "sellRatio": 0.5
        },

        // 6. Despedida
        {
          "type": "dialog",
          "character": "nerly",
          "lines": ["¡Vuelve cuando quieras! O cuando puedas..."]
        },

        // 7. Opciones de salida
        {
          "type": "choice",
          "options": [
            { "text": "Ir a la plaza", "goto": "plaza" },
            { "text": "Explorar el callejón", "goto": "callejon" },
            {
              "text": "[Llave maestra] Abrir la trastienda",
              "goto": "trastienda",
              "condition": { "inventory": ["master_key"] }
            }
          ]
        }
      ]
    }
  }
}
```
