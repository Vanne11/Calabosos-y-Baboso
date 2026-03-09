<p align="center">
  <img src="public/images/logo.png" alt="Calabosos y Babosos Logo" width="200">
</p>

<h1 align="center">Calabosos y Babosos</h1>

<p align="center">
  <em>La plataforma terminal viscosa para aventuras textuales con imagenes que el mundo no sabia que necesitaba.</em>
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

<p align="center">
  <img src="public/games/demo/images/scenarios/intro.png" alt="Escenario intro" width="700">
</p>

¡Bienvenido al Motor Baboso! Una plataforma de terminal interactiva impulsada por React + Vite, diseñada para cargar y ejecutar juegos textuales con imagenes. Con mas ego que logica, el sistema esta optimizado para crear y disfrutar aventuras narrativas grotescas, gloriosas y absolutamente jugables desde el navegador.

Si estas aca, ya tomaste una decision de vida cuestionable. Felicidades.

---

## ¿Que es esta cosa?

**Calabosos y Babosos** es un motor de ficcion interactiva para navegador disfrazado de terminal retro. Porque las aventuras de texto plano son para gente sin ambicion, esta viene con:

- **Narrativa ramificada** con multiples caminos y decisiones del jugador (la ilusion del libre albedrio, que emocionante)
- **Sistema de dados D20** con modificadores de estadisticas y chequeos de habilidad (porque tu destino deberia depender de matematicas que no entiendes)
- **Combate por turnos**, tiendas, crafteo, puzzles, y 18 tipos de pasos (si, dieciocho. Tenemos problemas de compromiso con la simplicidad)
- **Sistemas RPG**: niveles, XP, arboles de habilidades, rasgos, relaciones (tu personaje tendra mas crecimiento personal que tu en toda tu vida)
- **Un narrador sarcastico** que rompe la cuarta pared y juzga cada decision que tomas
- **Editor visual de historias** con ReactFlow (para gente que cree que puede hacer mejores juegos que nosotros. Spoiler: no pueden)
- **Estetica pixel-art** con escenas preciosas hechas a mano (lo unico bonito de este proyecto)

¿El objetivo? Derrotar al **Rey Baboso** en el *Abismo de las Babosas* dentro del reino de **Viscaria**. Controlas a **BOB**. Buena suerte. La vas a necesitar. El Narrador definitivamente no te va a ayudar.

<p align="center">
  <img src="public/games/demo/images/scenarios/plaza.png" alt="La Plaza de Viscaria" width="700">
</p>

---

## Capturas de Pantalla

<p align="center">
  <img src="public/games/demo/images/scenarios/mercado.png" alt="El Mercado" width="45%">
  &nbsp;
  <img src="public/games/demo/images/scenarios/grutas_cristal.png" alt="Grutas de Cristal" width="45%">
</p>

<p align="center">
  <img src="public/games/demo/images/scenarios/callejon.png" alt="Callejon Oscuro" width="45%">
  &nbsp;
  <img src="public/games/demo/images/scenarios/entrada_abismo.png" alt="Entrada al Abismo" width="45%">
</p>

<p align="center">
  <sub>Todas las escenas renderizadas en precioso pixel art. Lo unico aca que no te va a decepcionar.</sub>
</p>

---

## Conoce al Elenco (Vas a Desear No Haberlo Hecho)

<p align="center">
  <img src="public/games/demo/images/dialogs/narrator.png" alt="El Narrador" width="180">
  &nbsp;&nbsp;
  <img src="public/games/demo/images/dialogs/nerly.png" alt="Nerly" width="180">
  &nbsp;&nbsp;
  <img src="public/games/demo/images/dialogs/anciano.png" alt="El Anciano" width="180">
</p>

<p align="center">
  <b>El Narrador</b> (te odia) &bull; <b>Nerly la Babosa</b> (te tolera) &bull; <b>El Anciano</b> (te tiene lastima)
</p>

> Si, podes discutir con el Narrador. Y si, el siempre es mas inteligente y mas sexy que vos.

---

## Instalacion Pegajosa

```bash
# Arrastrarte al directorio como la babosa que sos
cd motor_web

# Instalar dependencias porque nunca tenemos suficientes node_modules
npm install

# Lanzar el sufrimiento
npm run dev
```

Abri `http://localhost:5173` y preparate para una experiencia viscosa. Si no sabes usar una terminal, este juego te va a odiar tanto como nosotros.

---

## Stack Tecnologico (El Pegamento que Mantiene Este Desastre Unido)

| Tecnologia | Proposito |
|---|---|
| **React 19** + **TypeScript 5.9** | UI y tipado (aparentando que somos profesionales) |
| **Vite 6.2** | Bundler y dev server (porque reinventar la rueda es para gente sin imaginacion) |
| **Zustand 5.0** | Estado global (alias: registro detallado de tus fracasos) |
| **@xyflow/react 12.10** | Editor visual de historias (para gente que cree que arrastrar cajitas es "diseño de juegos") |
| **styled-components 6.1** | CSS-in-JS (porque hasta las babosas merecen verse lindas) |
| **localforage** | Persistencia local via IndexedDB (tus malas decisiones te van a seguir para siempre) |
| **jszip + file-saver** | Export/import (tus esperanzas y sueños, empaquetados en un ZIP) |

---

## Arquitectura (El "Cerebro", Si las Babosas Tuvieran Cerebro)

```
React UI (componentes, widgets, terminal)
    ↕ useGameLoop (consume StepResults, envia PlayerActions)
    ↕ Zustand Store (useAppStore)
    ↕
GameEngine (TypeScript puro, generadores asincronos)
    ├── ConditionEvaluator    (juzga cada movimiento tuyo)
    ├── EffectsApplier        (aplica las consecuencias que te mereces)
    ├── DiceRoller            (decide tu destino con frias matematicas)
    └── AudioManager          (banda sonora para tu sufrimiento)
```

El `GameEngine` es **TypeScript puro** sin ninguna dependencia de React. Usa `async *enterScene()` como generador que yield-ea objetos `StepResult` para que la UI los renderize. La UI responde con `sendAction(PlayerAction)` cuando necesita input del jugador.

En otras palabras: el motor piensa porque vos claramente no podes.

---

## 18 Tipos de Pasos Narrativos (Porque 17 No Era Suficiente)

| Tipo | Descripcion | Input del Jugador |
|---|---|---|
| `dialog` | Dialogo de personaje (preparate para insultos) | No (Enter) |
| `choice` | Opciones del jugador (la ilusion de control) | Si |
| `dice` | Tirada D20 con modificadores (tu destino en un numero) | Si |
| `input` | Entrada de texto libre (si, vamos a juzgar tu ortografia) | Si |
| `effects` | Aplicar efectos silenciosamente (¡sorpresa, consecuencias!) | No |
| `branch` | Bifurcacion automatica por condiciones (el motor decide por vos) | No |
| `random` | Resultado aleatorio con pesos (como la vida, pero mas justo) | No |
| `check` | Comprobacion determinista de stat (spoiler: vas a fallar) | No |
| `shop` | Interfaz de compra/venta (capitalismo, hasta en la fantasia) | Si |
| `combat` | Combate por turnos (la violencia siempre es una opcion) | Si |
| `notify` | Notificacion visual (malas noticias, generalmente) | No |
| `wait` | Pausa dramatica (matando tus esperanzas lentamente) | No |
| `sound` | Efecto de sonido (banda sonora para tu miseria) | No |
| `craft` | Combinar items (jugar al alquimista de mentira) | Si |
| `puzzle` | Acertijo/codigo/candado/secuencia (cerebro no incluido) | Si |
| `examine` | Inspeccionar entorno (toca todo, arrepentite despues) | Si |
| `use_item` | Usar item en objetivo, estilo LucasArts (impuesto a la nostalgia) | Si |
| `timed_choice` | Opciones con temporizador (simulador de panico) | Si |
| `level_up` | Subir nivel / seleccion de skills (falsa sensacion de progreso) | Si |

---

## Fases de la Aplicacion (Etapas del Duelo)

```
boot → login → shell → game
                 └──── editor
```

| Fase | Descripcion |
|---|---|
| `boot` | Secuencia de arranque animada estilo Linux (para maximo roleplay de "hacker") |
| `login` | Prompt sarcastico de usuario/contraseña (toda respuesta es incorrecta) |
| `shell` | Terminal libre donde fingis que sabes comandos |
| `game` | Empieza el sufrimiento de verdad |
| `editor` | Editor visual de historias (crea tu propio sufrimiento para otros) |

---

## Comandos de Terminal

### Shell (sin juego activo)

| Comando | Descripcion |
|---|---|
| `help` | Muestra ayuda que realmente no te va a ayudar |
| `run [juego]` | Ejecuta un juego |
| `list` | Lista juegos disponibles juzgandolos en silencio |
| `editor [juego]` | Abre el editor visual |
| `debug` | Muestra el estado interno (spoiler: es patetico) |
| `clear` | Limpia la pantalla. Si solo pudieras limpiar tu historial de decisiones... |
| `about` | Pantalla About con musica |
| `quit` / `exit` | Admiti tu derrota |

### In-Game (durante partida, prefijo `/`)

| Comando | Descripcion |
|---|---|
| `/help` | Ayuda de la partida |
| `/save` | Guarda tu progreso para futuros arrepentimientos |
| `/load` | Carga una partida para revivir tus fracasos |
| `/history` | Ultimas 50 entradas narrativas (tu registro de traumas) |
| `/debug` | Modo debug, si te atreves |
| `/quit` | Escapar del sufrimiento (temporalmente) |

---

## Formato de Datos del Juego

Los juegos se definen con 2 archivos JSON en `public/games/{nombre}/`, porque archivos de texto plano serian demasiado sencillos y no queremos eso, ¿verdad?

**game.json** — Manifiesto con personajes, items, stats, arboles de habilidades, rasgos, configuracion de guardado

**scenes.json** — Todas las escenas con secuencias de los 18 tipos de pasos

```jsonc
{
  "scenes": {
    "start": {                          // OBLIGATORIO: toda aventura empieza aca
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

---

## Tu Deplorable Inventario

<p align="center">
  <img src="public/games/demo/images/items/espada_oxidada.png" alt="Espada Oxidada" width="120">
  &nbsp;&nbsp;
  <img src="public/games/demo/images/items/sal_anti_babosas.png" alt="Sal Anti-Babosas" width="120">
  &nbsp;&nbsp;
  <img src="public/games/demo/images/items/relicario_familiar.png" alt="Relicario Familiar" width="120">
  &nbsp;&nbsp;
  <img src="public/games/demo/images/items/bolsa_monedas.png" alt="Bolsa de Monedas" width="120">
</p>

<p align="center">
  <sub>Espada Oxidada (tetanos incluido) &bull; Sal Anti-Babosas (crimen de guerra) &bull; Relicario Familiar (daño emocional) &bull; Bolsa de Monedas (perpetuamente vacia)</sub>
</p>

---

## Documentacion (Para los Valientes y los Tontos)

La documentacion tecnica completa vive en el directorio [`docs/`](docs/). Leela. O no. Al Narrador le da igual.

### Sistemas Centrales
- [Arquitectura](docs/arquitectura.md) — Como se sostiene esta abominacion
- [Game Engine](docs/game-engine.md) — El "cerebro" de la operacion
- [Game Loop](docs/game-loop.md) — El ciclo infinito de sufrimiento
- [Game Loader](docs/game-loader.md) — Carga juegos y juzga tus decisiones de diseño
- [Player State](docs/player-state.md) — Un registro detallado de tus fracasos
- [Store (Zustand)](docs/store.md) — Donde se persiste tu trauma

### Mecanicas de Juego
- [Formato de Datos](docs/formato-datos.md) — Estructuras JSON (no seas creativo, creativo = roto)
- [Condiciones](docs/condiciones.md) — Logica del infierno
- [Efectos](docs/efectos.md) — Consecuencias que te mereces
- [Sistema de Dados](docs/dados.md) — Deja que las matematicas decidan tu destino
- [Navegacion & Goto](docs/navegacion.md) — A donde ir (porque claramente no podes decidir)
- [Sistemas RPG](docs/rpg.md) — XP, Skills, Rasgos (el crecimiento de tu personaje, a diferencia del tuyo)
- [Guardado/Carga](docs/guardado.md) — Inmortaliza tus errores
- [Audio](docs/audio.md) — Banda sonora para cada trauma

### UI y Presentacion
- [Fases de la Aplicacion](docs/fases.md) — Etapas del duelo, explicadas
- [Comandos de Terminal](docs/comandos.md) — Para fingir que sos hacker
- [Formato Rich Text](docs/rich-text.md) — Haciendo que contenido mediocre se vea elegante
- [Referencia StepResult](docs/step-result.md) — Lo que el motor te escupe
- [Estructura de Archivos](docs/estructura-archivos.md) — Donde vive (y muere) todo
- [Stack Tecnologico](docs/stack.md) — El pegamento y la cinta adhesiva
- [Editor Visual](docs/editor.md) — Arrastra cajitas, llámalo diseño de juegos

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
├── motor_web/                  Motor web (~18.000 lineas TS)
│   ├── src/
│   │   ├── engine/             El "cerebro" (si las babosas tuvieran cerebro)
│   │   ├── types/              Definiciones de tipos (aparentando seriedad)
│   │   ├── hooks/              Hooks de React (game loop, terminal, boot)
│   │   ├── store/              Zustand stores (tu trauma, persistido)
│   │   ├── components/         Pedazos de interfaz
│   │   ├── editor/             Editor visual de historias (~5.900 lineas)
│   │   ├── styles/             Temas de "oscuro" a "mas oscuro"
│   │   └── utils/              Rich text parser, helpers ("parches de emergencia")
│   └── public/games/           Juegos disponibles
│       ├── demo/               Demo completa (hecha por profesionales, duele mas)
│       └── demo2/              Demo de dungeon
├── docs/                       Wiki tecnica (~40 documentos)
├── back/                       Terminal Python legacy (el registro fosil)
└── CLAUDE.md                   Instrucciones para asistente IA
```

---

## Desarrollo

```bash
cd motor_web
npm install          # Primera vez (arrastrarte al abismo de dependencias)
npm run dev          # Dev server en localhost:5173 (donde las esperanzas van a morir)
npm run build        # Build de produccion (asumiendo que llegas tan lejos)
npm run lint         # ESLint (siempre va a encontrar algo de que quejarse. Siempre.)
```

### Ramas Git

- **main** — Release estable (relativamente hablando)
- **cyb-web** — Desarrollo activo (caos en progreso)

---

## Resolucion de Problemas (alias "Caracteristicas")

**"Mi juego se cuelga en cierta escena"** — No es un bug, es una metafora de como la vida se detiene en los peores momentos. (Solucion real: probablemente tenes una condicion circular o referencia invalida)

**"Las imagenes no cargan"** — ¿Consideraste que el motor esta protegiendo a los jugadores de tu "arte"? (Solucion real: verifica las rutas, deben ser relativas a la carpeta del juego)

**"El narrador me insulta demasiado"** — Eso no es un bug, es una caracteristica. De hecho esta siendo amable.

**"No puedo avanzar en el juego"** — Bienvenido a la vida real. (Solucion real: usa `debug` para ver que condiciones no se cumplen)

**"El JSON dice que tiene errores pero se ve bien"** — Lo interesante de la perfeccion es que es imposible de alcanzar, especialmente para vos. (Solucion real: usa un validador externo, hay comas fantasma por ahi)

---

## Autores

<p align="center">
  <img src="public/images/about/about1.png" alt="Vanessa, Nicolas y Nerly" width="400">
</p>

<p align="center">
  Hecho con amor (y baba) por <b>Nicolas & Vanessa</b>
</p>

---

## Licencia

MIT — Con clausula babosa: si usas este motor para hacer un juego serio o, peor aun, *educativo*, una babosa te perseguira en tus sueños por toda la eternidad.

---

> *"Has llegado al final de este README infinito. Tus stats de lectura aumentaron en +5. Tu dignidad, probablemente no. Y recorda: no es solo un juego, es una terminal para cargar juegos. La diferencia es viscosa pero importante. Como tantas cosas en la vida, este proyecto es solo un cascaron vacio esperando a que lo llenes con contenido... igual que tu existencia."*

Disfruta el abismo. Te estara esperando.

Olvidalo, escribiremos como queramos con S. ¡La Z es para el de la mascara negra!

— Nicolas & Vanessa
