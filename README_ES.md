<p align="center">
  <img src="public/images/logo.png" alt="Calabosos y Babosos Logo" width="200">
</p>

<h1 align="center">Motor Baboso</h1>

<p align="center">
  <em>Un motor de ficcion interactiva viscoso para el navegador. Crea aventuras textuales con imagenes, tiradas de dados, combate, crafteo, puzzles, y una terminal que te juzga. Porque el mundo necesitaba otro motor de juegos que nadie pidio.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript" alt="TypeScript 5.9">
  <img src="https://img.shields.io/badge/Vite-6.2-646cff?logo=vite" alt="Vite 6.2">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="MIT License">
</p>

<p align="center">
  <a href="README.md">English</a> | <b>Español</b>
</p>

---

## ¿Que es Motor Baboso?

**Motor Baboso** es un motor para crear y ejecutar juegos de ficcion interactiva en el navegador. No es un juego — es la cosa que *ejecuta* juegos. Pensalo como un RPG Maker con opiniones demasiado fuertes, terminal sarcastica y complejo de superioridad.

Definis tu juego entero en JSON (escenas, dialogos, items, arboles de habilidades, encuentros de combate, puzzles...) y el motor se encarga del resto: renderizado, manejo de estado, tiradas de dados, guardado/carga, audio, todo. No necesitas escribir codigo para hacer un juego. Solo JSON y decisiones de vida cuestionables.

### ¿Que podes construir con esto?

- Aventuras textuales con imagenes y narrativa ramificada
- RPGs con stats, niveles, XP, arboles de habilidades, rasgos y relaciones
- Juegos con mecanicas de dados D20, combate por turnos, tiendas y crafteo
- Juegos de puzzles con codigos, acertijos, candados y secuencias
- Cualquier cosa narrativa, realmente. Al motor no le importa tu genero. Al Narrador, por otro lado...

### Actualmente viene con dos demos:

- **Calabosos y Babosos** — Una aventura de fantasia satirica en el reino de Viscaria donde controlas a BOB intentando derrotar al Rey Baboso. Narrativa completa con tiendas, combate, NPCs, y un narrador que te odia con pasion.
- **Demo Tecnica** — Un showcase tecnico que demuestra los 18 tipos de pasos: puzzles, crafteo, combate, opciones con tiempo, pantallas de subir nivel, y mas.

---

## Capturas de Pantalla

<p align="center">
  <img src="public/images/screenshots/terminal.png" alt="Terminal de juego" width="45%">
  &nbsp;
  <img src="public/images/screenshots/editor.png" alt="Editor visual de historias" width="45%">
</p>

<p align="center">
  <img src="public/images/screenshots/game.png" alt="Escena del juego" width="45%">
  &nbsp;
  <img src="public/images/screenshots/combat.png" alt="Combate o widget interactivo" width="45%">
</p>

<p align="center">
  <sub>La terminal, el editor visual, y escenas del juego. Casi se ve profesional si entrecerras los ojos.</sub>
</p>

---

## Inicio Rapido

```bash
# Clonar el repo (ya estas aca, genio)
npm install          # Arrastrarte al abismo de dependencias
npm run dev          # Lanzar en localhost:5173 (donde las esperanzas van a morir)
```

Eso es todo. Ya no hay `cd motor_web` — todo vive en la raiz porque nos reorganizamos como adultos. Casi.

---

## Caracteristicas (Las Que Nos Enorgullecen, Al Menos)

### La Terminal

Todo corre dentro de una terminal Linux falsa. Secuencia de arranque, prompt de login, comandos de shell — la experiencia completa de cosplay de hacker. Escribi `help` y fingi que sabes lo que haces.

### El Motor

TypeScript puro. Cero dependencias de React. Usa generadores asincronos (`async *enterScene()`) para yield-ear objetos `StepResult` que la UI renderiza. La UI responde con `PlayerAction` cuando necesita input. Separacion limpia. El motor no sabe que es un DOM, y es mas feliz asi.

### 18 Tipos de Pasos

Porque 17 no era suficiente y 19 se sentia avaroso:

| Tipo | Que hace | ¿Input? |
|---|---|---|
| `dialog` | Muestra dialogo de personaje (preparate para insultos) | No |
| `choice` | El jugador elige una opcion (la ilusion de control) | Si |
| `dice` | Tirada D20 con modificadores (que las matematicas arruinen tu dia) | Si |
| `input` | Texto libre (vamos a juzgar tu ortografia) | Si |
| `effects` | Aplica consecuencias en silencio (¡sorpresa!) | No |
| `branch` | Rutea automaticamente segun condiciones | No |
| `random` | Resultado aleatorio con pesos (como la vida, pero mas justo) | No |
| `check` | Chequeo determinista de stat (spoiler: vas a fallar) | No |
| `shop` | Interfaz compra/venta (capitalismo en la fantasia) | Si |
| `combat` | Combate por turnos (la violencia siempre es una opcion) | Si |
| `notify` | Notificacion visual (malas noticias, generalmente) | No |
| `wait` | Pausa dramatica (matando esperanzas lentamente) | No |
| `sound` | Efecto de sonido (el trauma necesita banda sonora) | No |
| `craft` | Combinar items (jugar al alquimista de mentira) | Si |
| `puzzle` | Codigo/acertijo/candado/secuencia (cerebro no incluido) | Si |
| `examine` | Inspeccionar entorno (toca todo, arrepentite) | Si |
| `use_item` | Usar item en objetivo, estilo LucasArts | Si |
| `timed_choice` | Opciones con temporizador (simulador de panico) | Si |
| `level_up` | Subir nivel / elegir skills (progreso falso) | Si |

### El Editor Visual

Un editor completo de drag-and-drop construido con ReactFlow. Crea escenas, conectalas, edita los 18 tipos de pasos visualmente, valida tu juego, exporta/importa proyectos. Es como un diagrama de flujo pero que realmente hace algo util.

### Sistemas RPG

Niveles, XP, arboles de habilidades, rasgos, relaciones entre personajes con puntajes de afinidad, eventos temporales, ciclos dia/noche. Tus personajes van a tener mas crecimiento personal que vos en toda tu vida.

### Guardado/Carga

Guardado libre, basado en checkpoints, o por slots. Impulsado por localforage (IndexedDB). Tus malas decisiones van a persistir entre sesiones del navegador. De nada.

### Audio

Musica de fondo con crossfade, tracks por escena, efectos de sonido. Porque un buen trauma necesita una banda sonora apropiada.

---

## Arquitectura

```
React UI (componentes, widgets, terminal)
    ↕ useGameLoop (consume StepResults, envia PlayerActions)
    ↕ Zustand Store (useAppStore)
    ↕
GameEngine (TypeScript puro, generadores asincronos)
    ├── ConditionEvaluator    (juzga cada movimiento tuyo)
    ├── EffectsApplier        (aplica lo que te mereces)
    ├── DiceRoller            (frias matematicas)
    └── AudioManager          (banda sonora del sufrimiento)
```

En otras palabras: el motor piensa porque vos claramente no podes.

---

## Fases de la Aplicacion (Etapas del Duelo)

```
boot → login → shell → game
                 └──── editor
```

| Fase | Que pasa |
|---|---|
| `boot` | Arranque animado estilo Linux (maximo roleplay de hacker) |
| `login` | Prompt sarcastico (toda respuesta es incorrecta) |
| `shell` | Terminal libre donde fingis que sabes comandos |
| `game` | Empieza el sufrimiento de verdad |
| `editor` | Editor visual de historias (crea sufrimiento para otros) |

---

## Formato de Datos del Juego

Un juego son solo 2 archivos JSON en `public/games/{nombre}/`. Eso es todo. Sin codigo, sin compilacion, sin dignidad.

**game.json** — Manifiesto: personajes, items, stats, arboles de habilidades, rasgos, config de guardado

**scenes.json** — Todas las escenas con secuencias de los 18 tipos de pasos

```jsonc
{
  "scenes": {
    "start": {
      "scenario": { "name": "Inicio", "image": "images/plaza.png" },
      "sequence": [
        { "type": "dialog", "character": "narrator", "lines": ["Bienvenido. Te ves perdido. Como siempre."] },
        { "type": "choice", "options": [
          { "text": "Explorar", "goto": "exploracion" },
          { "text": "Cuestionar mis decisiones de vida", "goto": "_quit" }
        ]}
      ]
    }
  }
}
```

¿Queres hacer un juego? Escribi JSON. ¿La cagaste con el JSON? El motor te lo va a hacer saber. Sarcasticamente.

---

## Documentacion (Para los Valientes y los Tontos)

La documentacion tecnica completa vive en [`docs/`](docs/). Leela. O no. Al Narrador le da igual.

### Sistemas Centrales
- [Arquitectura](docs/arquitectura.md) — Como se sostiene esta abominacion
- [Game Engine](docs/game-engine.md) — El "cerebro" de la operacion
- [Game Loop](docs/game-loop.md) — El ciclo infinito de sufrimiento
- [Game Loader](docs/game-loader.md) — Carga juegos, juzga tu diseño
- [Player State](docs/player-state.md) — Un registro de tus fracasos
- [Store (Zustand)](docs/store.md) — Donde se persiste el trauma

### Mecanicas de Juego
- [Formato de Datos](docs/formato-datos.md) — Estructuras JSON (creativo = roto)
- [Condiciones](docs/condiciones.md) — Logica del infierno
- [Efectos](docs/efectos.md) — Consecuencias que te mereces
- [Sistema de Dados](docs/dados.md) — Las matematicas deciden tu destino
- [Navegacion & Goto](docs/navegacion.md) — A donde ir (no podes decidir)
- [Sistemas RPG](docs/rpg.md) — XP, Skills, Rasgos
- [Guardado/Carga](docs/guardado.md) — Inmortaliza tus errores
- [Audio](docs/audio.md) — Banda sonora para cada trauma

### UI y Presentacion
- [Fases de la Aplicacion](docs/fases.md) — Etapas del duelo, explicadas
- [Comandos de Terminal](docs/comandos.md) — Para fingir que sos hacker
- [Formato Rich Text](docs/rich-text.md) — Contenido mediocre con aspecto elegante
- [Referencia StepResult](docs/step-result.md) — Lo que el motor te escupe
- [Estructura de Archivos](docs/estructura-archivos.md) — Donde vive (y muere) todo
- [Stack Tecnologico](docs/stack.md) — El pegamento y la cinta adhesiva
- [Editor Visual](docs/editor.md) — Arrastra cajitas, llámalo diseño

### Los 18 Tipos de Pasos
- [Dialog](docs/pasos/dialog.md) &bull; [Choice](docs/pasos/choice.md) &bull; [Dice](docs/pasos/dice.md) &bull; [Input](docs/pasos/input.md) &bull; [Effects](docs/pasos/effects.md) &bull; [Branch](docs/pasos/branch.md) &bull; [Random](docs/pasos/random.md) &bull; [Check](docs/pasos/check.md)
- [Shop](docs/pasos/shop.md) &bull; [Combat](docs/pasos/combat.md) &bull; [Notify](docs/pasos/notify.md) &bull; [Wait](docs/pasos/wait.md) &bull; [Sound](docs/pasos/sound.md) &bull; [Craft](docs/pasos/craft.md) &bull; [Puzzle](docs/pasos/puzzle.md) &bull; [Examine](docs/pasos/examine.md)
- [Use Item](docs/pasos/use-item.md) &bull; [Timed Choice](docs/pasos/timed-choice.md) &bull; [Level Up](docs/pasos/level-up.md)

### Guias
- [Como Crear un Juego](docs/guia-crear-juego.md) — (Spoiler: lo vas a arruinar)

---

## Estructura del Proyecto

```
Calabosos-y-Baboso/
├── src/
│   ├── engine/             Motor TypeScript puro (el "cerebro")
│   ├── types/              Definiciones de tipos
│   ├── hooks/              Hooks de React (game loop, terminal, boot)
│   ├── store/              Zustand stores (trauma, persistido)
│   ├── components/         UI (terminal, widgets, layout)
│   ├── editor/             Editor visual de historias (~5.900 lineas)
│   ├── styles/             Temas de "oscuro" a "mas oscuro"
│   └── utils/              Rich text parser, helpers
├── public/games/           Juegos disponibles
│   ├── demo/               Demo "Calabosos y Babosos"
│   └── demo2/              Demo tecnica (los 18 tipos de pasos)
├── docs/                   Wiki tecnica (~40 documentos)
├── back/                   Terminal Python legacy (el registro fosil)
└── CLAUDE.md               Instrucciones para asistente IA
```

---

## Stack Tecnologico

| Tecnologia | Por que |
|---|---|
| **React 19** + **TypeScript 5.9** | UI y tipos (aparentando profesionalismo) |
| **Vite 6.2** | Bundler rapido (reinventar la rueda es para gente sin imaginacion) |
| **Zustand 5.0** | Estado global (registro de tus fracasos) |
| **@xyflow/react 12.10** | Editor visual (arrastrar cajitas = "diseño de juegos") |
| **styled-components 6.1** | CSS-in-JS (hasta las babosas merecen verse lindas) |
| **localforage** | Persistencia IndexedDB (las malas decisiones te siguen para siempre) |
| **jszip + file-saver** | Export/import (esperanzas y sueños en un ZIP) |

---

## Desarrollo

```bash
npm install          # Primera vez (abraza el abismo de node_modules)
npm run dev          # Dev server en localhost:5173
npm run build        # Build de produccion (asumiendo que llegas tan lejos)
npm run lint         # ESLint (siempre encuentra algo de que quejarse)
```

### Ramas Git

- **main** — Estable (relativamente hablando)
- **cyb-web** — Desarrollo activo (caos en progreso)

---

## Resolucion de Problemas (alias "Caracteristicas")

**"Mi juego se cuelga en cierta escena"** — No es un bug, es una metafora de como la vida se detiene en los peores momentos. (Solucion real: condicion circular o referencia invalida)

**"Las imagenes no cargan"** — El motor esta protegiendo a los jugadores de tu "arte". (Solucion real: verifica las rutas, deben ser relativas a la carpeta del juego)

**"El narrador me insulta demasiado"** — Eso no es un bug. Es una caracteristica. De hecho esta siendo amable.

**"No puedo avanzar"** — Bienvenido a la vida real. (Solucion real: usa `debug` para ver condiciones no cumplidas)

**"Mi JSON tiene errores pero se ve bien"** — La perfeccion es imposible de alcanzar, especialmente para vos. (Solucion real: validador externo, hay comas fantasma al acecho)

---

## Autores

<p align="center">
  <img src="public/images/about/about1.png" alt="Vanessa, Nicolas y Nerly" width="400">
</p>

<p align="center">
  Construido con amor (y baba) por <b>Nicolas & Vanessa</b>
</p>

---

## Licencia

MIT — Con clausula babosa: si usas este motor para hacer un juego serio o, peor aun, *educativo*, una babosa te perseguira en tus sueños por toda la eternidad.

---

> *"Has llegado al final de este README. Tus stats de lectura aumentaron en +5. Tu dignidad, probablemente no. Recorda: esto no es un juego, es un motor que ejecuta juegos. La diferencia es viscosa pero importante. Como tantas cosas en la vida, este proyecto es solo un cascaron vacio esperando a que lo llenes con contenido... igual que tu existencia."*

Disfruta el abismo. Te estara esperando.

Olvidalo, escribiremos como queramos con S. ¡La Z es para el de la mascara negra!

— Nicolas & Vanessa
