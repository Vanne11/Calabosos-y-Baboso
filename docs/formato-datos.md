← [Volver al índice](README.md)

# Formato de Datos del Juego

Un juego se compone de **2 archivos JSON** en `public/games/{nombre}/`:

## `game.json` — Manifiesto del juego (GameManifest)

Define metadatos, personajes, configuración inicial y sistemas RPG.

```jsonc
{
  // --- Metadatos ---
  "name": "Mi Aventura",
  "description": "Una historia viscosa",
  "author": "Narrador Malévolo",
  "version": "1.0.0",

  // --- Personajes ---
  "characters": {
    "narrator": {
      "name": "Narrador",
      "description": "El narrador omnisciente",
      "role": "narrator"                    // narrator | protagonist | companion | npc
    },
    "bob": {
      "name": "BOB",
      "description": "El héroe involuntario",
      "image": "images/bob.png",
      "role": "protagonist",
      "altImages": {                        // Imágenes alternativas (selección visual)
        "masculino": "images/bob_m.png",
        "femenino": "images/bob_f.png"
      },
      "skillTree": "guerrero",             // ID del árbol de habilidades
      "baseStats": { "hp": 100, "atk": 10 },
      "maxLevel": 10,
      "xpCurve": [100, 200, 400, 800],     // XP necesaria por nivel
      "initialTraits": ["valiente"]
    },
    "nerly": {
      "name": "Nerly la Babosa",
      "description": "Compañera comerciante",
      "image": "images/nerly.png",
      "role": "companion",
      "joinFlag": "nerly_joined"            // Flag que activa al compañero
    }
  },

  // --- Estado inicial ---
  "initialStats": {
    "will_to_live": 100,
    "hunger": 0,
    "reputation": 50,
    "gold": 20
  },
  "initialFlags": {
    "intro_done": false
  },
  "initialInventory": ["bread"],

  // --- Sistema temporal ---
  "time": {
    "duration": 5,                          // Acciones por fase
    "phases": ["morning", "afternoon", "night"],
    "initial": "morning"
  },

  // --- Items (opcional) ---
  "items": {
    "bread": {
      "name": "Pan",
      "description": "Un trozo de pan mohoso",
      "image": "images/bread.png"
    },
    "sword": {
      "name": "Espada Oxidada",
      "description": "Apenas corta mantequilla"
    }
  },

  // --- Árboles de habilidades (opcional) ---
  "skillTrees": {
    "guerrero": {
      "name": "Guerrero",
      "skills": {
        "slash": {
          "name": "Tajo",
          "description": "+5 ataque por nivel",
          "maxLevel": 3,
          "cost": 1,
          "passiveBonus": { "atk": 5 }
        },
        "shield_bash": {
          "name": "Golpe de Escudo",
          "description": "Requiere Tajo nivel 1",
          "maxLevel": 2,
          "cost": 2,
          "prerequisites": ["slash"],
          "passiveBonus": { "def": 3 }
        }
      }
    }
  },

  // --- Rasgos (opcional) ---
  "traits": {
    "valiente": {
      "name": "Valiente",
      "description": "+2 a tiradas de dados",
      "diceModifier": 2,
      "permanent": true,
      "tags": ["personality"]
    },
    "envenenado": {
      "name": "Envenenado",
      "description": "-10 HP por escena",
      "statModifiers": { "will_to_live": -10 },
      "permanent": false,
      "duration": 3                         // Se elimina tras 3 escenas
    }
  },

  // --- Sistema de guardado (opcional) ---
  "saveSystem": {
    "mode": "free",                         // "free" (manual) | "checkpoint" (automático)
    "slots": 3,                             // Número de slots (1-10, default: 3)
    "allowOverwrite": true,                 // Permitir sobreescribir slots ocupados
    "checkpointScenes": []                  // Escenas de autoguardado (solo modo checkpoint)
  }
}
```

### Campos opcionales adicionales

```jsonc
{
  // --- Stats visibles en la barra de estado ---
  // Si no se define, la barra usa etiquetas por defecto (will_to_live, hunger, pee, fear, reputation).
  "statDefs": {
    "ganas_de_vivir": { "label": "Ganas de vivir", "icon": "❤️" },
    "sexi": { "label": "Qué tan sexi", "icon": "💋" },
    "secreto": { "label": "Secreto", "hidden": true },  // usable en condiciones/dados, no se muestra
    "pis": { "label": "Pis", "min": 0, "max": 100 }     // el motor recorta tras cada efecto
  },

  // --- Escenas en varios archivos ---
  // Si se define, se cargan en orden y se fusionan; si no, se usa scenes.json.
  // Un ID de escena repetido entre archivos es un error de carga.
  "sceneFiles": ["scenes/00_edad.json", "scenes/01_prologo.json", "scenes/02_acto1.json"],

  // --- Texto narrativo (ver narrativa.md) ---
  "linePools": { "pifia": ["Estamos jodidos."] },
  "statRules": [{ "id": "muerte", "condition": { "stats": { "vida": "<=0" } }, "goto": "muerte" }],
  "diceHooks": { "critical_failure": { "pool": "pifia" } },
  "diceModifiers": [{ "stat": "miedo", "per": 25, "amount": -1 }],

  // --- Control de edad (ver navegacion.md) ---
  "contentRating": {
    "minAge": 18,
    "warnings": ["groserías", "humor de pis"],  // las menciona la escena genérica
    "gateScene": "edad"                          // opcional: escena propia; debe ir a "_age_accept"
  }
}
```

## `scenes.json` — Escenas del juego (ScenesFile)

Contiene todas las escenas con sus secuencias de pasos. **Debe existir una escena `start`**.

Con `sceneFiles` en el manifiesto, cada archivo tiene este mismo formato (`{ "scenes": { ... } }`) y el editor los importa fusionados; al exportar desde el editor se genera un único `scenes.json`.

```jsonc
{
  "scenes": {
    "start": {
      "scenario": {
        "name": "Plaza Principal",
        "image": "images/plaza.png",
        "music": "audio/town.mp3",
        "description": "La plaza principal al amanecer...",
        "variants": {                       // Descripciones por fase temporal
          "morning": "El sol ilumina la plaza...",
          "afternoon": "La plaza está concurrida...",
          "night": "Antorchas iluminan la oscuridad..."
        }
      },
      "sequence": [
        // Array de SequenceStep (ver sección de pasos)
      ]
    }
  }
}
```

## Resolución de rutas de assets

El `GameLoader` resuelve automáticamente las rutas relativas de imágenes y música:
- `"images/plaza.png"` → `"games/demo/images/plaza.png"`
- Se aplica al `scenario.image`, `scenario.music` y `characters[*].image`
- Las rutas dentro de pasos (`sound.src`) se resuelven en el `GameEngine`
