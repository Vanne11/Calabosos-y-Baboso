# Estructura de Carpetas y Archivos para Calabozos y Babosos

```
dialogos/                         # Carpeta principal
│
├── rutas.json                    # Archivo principal con todas las rutas
│
├── dialogos/                     # Carpeta de archivos de diálogos
│   ├── historia.json             # Diálogos principales del juego
│   ├── introduccion.json         # Diálogos de introducción del juego
│   └── secundarios.json          # Diálogos de personajes secundarios
│
├── tiradas/                      # Carpeta de archivos de tiradas
│   ├── ciudad.json               # Tiradas en la ciudad
│   ├── combate.json              # Tiradas de combate con babosas
│   ├── social.json               # Tiradas de interacción social
│   └── taberna.json              # Tiradas específicas de la taberna
│
└── relleno/                      # Carpeta de fragmentos reutilizables
    └── relleno.json              # Fragmentos de texto reutilizables
```

## Formato del archivo rutas.json

```json
{
  "rutas": [
    {
      "id": "plaza_principal",
      "nombre": "Plaza Principal",
      "dialogo_tipo": "historia",
      "dialogo_id": "encuentro_plaza",
      "escenario": {
        "descripcion": "Una bulliciosa plaza medieval con puestos de mercado y una fuente central.",
        "ambiente": "Día soleado, mucho ruido de mercaderes y compradores",
        "color_fondo": "#F5DEB3",
        "color_texto": "#8B4513",
        "elementos_destacados": ["fuente de piedra", "puestos de mercado", "guardias patrullando"],
        "sonidos": ["multitud", "pregones", "caballos"]
      }
    }
  ]
}
```

## Formato de archivos de diálogos

```json
{
  "dialogos": [
    {
      "id": "encuentro_plaza",
      "secuencia": [
        {
          "personaje": "NARRADOR",
          "texto": "Te encuentras en la bulliciosa plaza de Viscaria.",
          "pausa": true
        },
        {
          "personaje": "PROTAGONISTA",
          "texto": "¿Dónde estoy? ¿Quién eres? ¿Por qué me llamas BOB?"
        }
      ],
      "opciones": [
        {
          "texto": "Buscaré algún trabajo rápido en la ciudad.",
          "siguiente_ruta": "buscar_trabajo"
        },
        {
          "texto": "¿Hay algo de valor que pueda vender?",
          "siguiente_ruta": "vender_objeto"
        }
      ]
    }
  ]
}
```

## Formato de archivos de tiradas

```json
{
  "tiradas": [
    {
      "id": "tirada_robo",
      "descripcion": "El protagonista intenta robar a un noble",
      "stat_principal": "Reputación",
      "dificultad": 13,
      "accion_descripcion": "Intentas deslizar tu mano en el bolsillo del noble...",
      "resultados": {
        "1": {
          "secuencia": [
            {
              "personaje": "NARRADOR",
              "texto": "¡Oh, esto es MAGNIFICO! Has logrado no solo fallar estrepitosamente, sino que el noble al que intentabas robar resulta ser el Jefe de la Guardia disfrazado."
            }
          ],
          "efectos_stats": {
            "Reputación": -30,
            "Miedo": 20
          },
          "objetos_ganados": [],
          "siguiente_ruta": "mision_guardia"
        },
        "2-5": {
          "secuencia": [
            {
              "personaje": "NOBLE",
              "texto": "¡Ladrón/a! ¡Guardias! ¡Guardias!"
            }
          ],
          "siguiente_ruta": "persecucion_guardias"
        },
        "6-10": {
          "secuencia": [...],
          "siguiente_ruta": "plaza_principal"
        },
        "11-15": {...},
        "16-19": {...},
        "20": {...}
      }
    }
  ]
}
```

## Formato de archivos de relleno

```json
{
  "fragmentos": [
    {
      "id": "narracion_mision",
      "texto": "¿De verdad tengo que explicártelo todo? Bien, versión resumida: eres el/la \"héroe/heroína/heroine\" elegido/a para adentrarte en el Abismo de las Babosas y derrotar al Rey Baboso."
    },
    {
      "id": "tendero_ebrio",
      "texto": "¿El Abismo? *hic* ¡Ja! Nadie vuelve de ahí con... con vida. ¡Excepto yo! Fui tres... no, siete veces. O quizás fue un sueño. *hic*"
    }
  ]
}
```
