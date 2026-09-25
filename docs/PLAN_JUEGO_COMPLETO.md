# Plan: Calabosos y Babosos — Juego Completo

## Objetivo

Pasar de demo a **juego completo de ~1 hora por partida**, con el sarcasmo como sello: el narrador se burla, rompe la cuarta pared, recuerda tus errores y te humilla con cariño.

Además, una **IA (DeepSeek) servida desde un backend PHP propio** que:
- genera texto variado (burlas, reacciones, recaps),
- **analiza cómo juega el jugador** para que el narrador se adapte,
- permite **modos chat donde el jugador escribe libremente**: convencer a un guardia, componer una canción con Nerly, una guerra de rap, un duelo de insultos...

Humor adulto **sin filtro**, con un control de edad +18 que es parte del motor pero se siente natural dentro del juego.

## Decisiones tomadas

| Tema | Decisión |
|---|---|
| Carpeta | Juego nuevo en `public/games/calabosos/`. `demo` y `demo2` quedan como demos de capacidades |
| IA | DeepSeek (`deepseek-chat`) vía **API PHP en servidor propio**. La key nunca llega al navegador |
| Prompts | Configurables desde un **panel admin** en el servidor |
| Imágenes | `IMAGENES.md` con instrucciones por imagen + placeholders mientras tanto |
| Duración | ~1 hora por partida |
| Humor | Sin filtro. Control +18 integrado en el motor |

## Estado actual

| Pieza | Qué hay | Problema |
|---|---|---|
| `public/games/demo` | Historia real: 21 escenas / 136 pasos | Solo `dialog`, `choice`, `dice`. Termina en Grutas de Cristal, sin Rey Baboso |
| `public/games/demo2` | Demo técnica con los 18 tipos de paso | No es la historia |
| `public/games/Calabosos y Babosos/original_datos` | Guion completo en markdown (~2000 líneas) + `Ideas.txt` | El motor no lo lee |
| Motor | 18 step types, RPG (skills, traits, relaciones, level up), editor visual | Un único `scenes.json` por juego, sin IA, sin texto libre en la historia |

---

## Estructura del juego (~1 hora)

Estimación: ~70-90 escenas y ~700 pasos (5-6 veces la demo), más los modos chat, que alargan cada encuentro.

```
Gate +18    El narrador pregunta la edad a su manera (ver "Control de edad")
   │
Prólogo     El Despertar ─ tutorial en la habitación (examine / use_item / craft)       ~5 min
   │
Acto I      El Pueblo ─ plaza, dinero, tienda, taberna, callejón, Nerly                 ~15 min
   │
Acto II     El Camino ─ viaje con encuentros, anciano, taxonomía, canción con Nerly    ~10 min
   │
Acto III    El Abismo ─ guardia (persuasión) o túnel sigiloso → 3 zonas jugables        ~20 min
   │                     Cavernas de Cría · Abismo Profundo · Grutas de Cristal
   │
Acto IV     El Rey ─ visión, corazón / pasaje secreto, trono (negociación), batalla     ~10 min
   │
Finales     Heroico · Nuevas Aventuras · Retiro Pacífico · Secreto: "El Verdadero Narrador"
            + finales de muerte/cobardía con burla
```

### Prólogo — El Despertar
Toma la misión tutorial de `Historia Juego Rol.txt`: mochila, lámpara, llave, carta misteriosa, ventana.
- Enseña `examine`, `use_item`, `craft` e inventario **mientras el narrador se burla de lo básico**.
- Pide el nombre con `input`. El narrador reacciona ("jamás usaríamos ese nombre, tiene derechos de autor"), con IA si está disponible.
- **Primer modo chat, corto:** "Explícale al narrador por qué deberías ser el héroe". Sirve como tutorial de escritura libre, y la respuesta alimenta el perfil del jugador.

### Acto I — El Pueblo
Migrar `demo` y completarlo con `md-introduccion`, `md-conseguir-dinero` y `md-tienda-callejon`.
- Tres vías de dinero con los 6 tramos de dado completos.
- Tendero: `shop` + **regateo libre** (chat), con dado como alternativa sin IA.
- **Taberna (nueva): guerra de rap** contra un bardo babosa. El premio es reputación, oro o un trait.
- Prestamista como deuda persistente que vuelve a cobrar en el Acto IV.
- Nerly se une y arranca su relación.
- Item: **bolso de escroto de elefante**, que aumenta la capacidad de oro.

### Acto II — El Camino
Desde `md-abismo-babosas`.
- Viaje con `random` de encuentros: bandidos incompetentes, cameo de Takashi Komuro, **duelo de insultos** (estilo Monkey Island, en chat).
- Anciano con la historia del Rey.
- Taxonomía babosa que desbloquea un **bestiario** (`/bestiario`).
- Fogata: **componer una canción con Nerly** (chat colaborativo). Sube la afinidad según cómo colabores y la canción queda guardada; Nerly la canta en el final.

### Acto III — El Abismo
- **Guardia de la entrada: "Convénceme de dejarte pasar"** (chat de persuasión). Si fallas, combate o túnel sigiloso.
- **Tres zonas jugables** (hoy dos solo te redirigen):
  - **Cavernas de Cría**: sigilo, `timed_choice` para huir de las madres, huevo robable.
  - **Abismo Profundo**: puzzle `sequence`/`lock` en la masa gelatinosa, combate con la Explosiva.
  - **Grutas de Cristal**: laberinto con `examine`, Lágrima de Cristal (visión).
- Cinco especies, cada una con su gimmick en `combat`: ácida, saltarina, gemelas, fantasma, explosiva.
- Hay que completar al menos 2 zonas para abrir el trono.

### Acto IV — El Rey
Desde `md-confrontacion-final`.
- Visión mística (ventaja en la batalla), Corazón del Abismo o Pasaje Secreto.
- **Sala del trono: negociación libre con el Rey Baboso** (chat). Puedes evitar parte de la batalla, provocarlo o hacerlo dudar.
- Batalla final en 3 fases, con Nerly interviniendo según el tier de relación y el prestamista cobrando en el peor momento.

### Finales
| Final | Condición |
|---|---|
| Celebración heroica | Ganar la batalla. Nerly canta *tu* canción del Acto II |
| Nuevas aventuras | Ganar + seguir |
| Retiro pacífico | Ganar + retirarse |
| **Secreto: El Verdadero Narrador** | Nerly `loyal` + visión + pasaje secreto. El narrador te habla directamente, en chat |
| Finales de burla | Morir, huir o quedar sin "ganas de vivir" |

Al terminar, el narrador hace un **recap personalizado** con IA a partir del perfil del jugador: "Fuiste un cobarde con buen ritmo, que murió 4 veces en establos".

---

## Sistemas de sarcasmo (de `Ideas.txt`)

| # | Sistema | Implementación |
|---|---|---|
| 2 | **Qué tan sexi** | Stat `sexi` que modifica precios, dados y resultados de persuasión |
| 4 | "Debimos buscar a alguien más competente" | Pool al morir + contador de muertes meta; la burla escala |
| 5 | "Y tú eres nuestro futuro, estamos jodidos" | Pool en pifias (dado = 1) y malas decisiones |
| 6 | Consumibles | Pociones, comida y "algo para el pis" |
| 7 | Stats: ganas de vivir, pis, sexi, miedo | `pis` sube con el miedo; a 100 hay evento humillante con penalización a `sexi`. `miedo` penaliza combate |
| 8 | Reacción al nombre | Casos especiales + IA |
| — | Memoria del narrador | Recuerda muertes, reinicios y cobardías entre partidas |

**Motor:** `linesPool` (frases aleatorias sin repetir) + contador meta persistente en localforage, fuera del save.

---

## Control de edad (+18) — parte del motor

Es una capacidad del motor que cualquier juego puede activar, no algo propio de Calabosos.

```jsonc
// game.json
"contentRating": {
  "minAge": 18,
  "warnings": ["lenguaje soez", "humor escatológico", "babosas con intenciones dudosas"],
  "gateScene": "_age_gate"        // opcional: escena propia del juego; si no, usa la genérica
}
```

- El motor ejecuta el gate **antes de `start`** y guarda la aceptación en localforage (no se pregunta en cada partida).
- **Natural en el juego:** el gate es una escena normal dicha por el narrador, con la voz del juego. Ejemplo: *"Antes de empezar: aquí hay groserías, humor de pis y babosas con intenciones dudosas. ¿Tienes 18 o más?"* Decir "No" lleva a un final de burla que cierra el juego ("Vuelve cuando te crezca vello donde ahora no").
- El mismo gate informa que los modos chat envían tu texto al servidor. Así se cubre el consentimiento de IA en un solo paso.
- Editor: pestaña de configuración para `contentRating`. Exportador y ejecutable lo respetan.

---

## IA: arquitectura

```
┌─────────────── Navegador (motor React) ───────────────┐
│ src/ai/client.ts   → llama a la API PHP (nunca a DeepSeek) │
│ src/ai/profile.ts  → perfil del jugador (local, determinista) │
│ steps: ai_narrate · ai_chat                                   │
│ fallback siempre: texto fijo / dado / choice                  │
└──────────────────────────┬────────────────────────────┘
                           │ HTTPS + CORS (solo origen del juego)
┌──────────────────────────▼────────────────────────────┐
│ server/ (PHP, tu servidor)                             │
│  api/narrate.php   api/chat.php   api/events.php  api/config.php │
│  admin/            → login, prompts, parámetros, límites, analítica │
│  DB (SQLite o MySQL): prompts, sesiones, eventos, transcripts │
│  DeepSeek: deepseek-chat (API compatible con OpenAI, JSON mode) │
└────────────────────────────────────────────────────────┘
```

### Regla de oro
La IA **no escribe lógica del juego**. En los modos chat, la IA devuelve un **veredicto estructurado** (JSON) dentro de los resultados que el autor definió, y el motor aplica los `goto`/efectos del autor. Si la IA falla, se usa el `fallback`. **El juego se completa sin IA.**

### Backend PHP (`server/` en este repo)
- **Endpoints**
  - `POST api/narrate.php` — `{ promptId, vars }` → una línea de texto.
  - `POST api/chat.php` — `{ sessionId, mode, npc, turn, history, vars }` → `{ reply, verdict?, score?, done }`.
  - `POST api/events.php` — eventos de juego para la analítica (en lote).
  - `GET api/config.php` — modos activos, límites y kill switch (el cliente se adapta).
- **El cliente nunca envía prompts de sistema**, solo `promptId` + variables. Los prompts viven en la DB y se editan en el admin.
- **Seguridad:** key de DeepSeek en config del servidor fuera de webroot, CORS restringido, rate limit por IP/sesión, tope de tokens por sesión y por día, largo máximo de entrada del jugador, texto del jugador siempre como mensaje `user` (nunca concatenado en el system), log de errores.
- **Panel admin**
  - Login (usuario único o pocos, hash bcrypt).
  - **Prompts**: CRUD por juego/modo/NPC, con variables `{{nombre}}`, `{{stats}}`, `{{perfil}}`, `{{historial}}`, **versionado** y botón "probar" con variables de ejemplo.
  - **Parámetros**: modelo, temperature, max_tokens y turnos máximos por modo.
  - **Hoja del narrador**: prompt base con la voz sarcástica, heredado por todos los prompts.
  - **Límites**: presupuesto diario, kill switch global y por modo.
  - **Analítica** (ver abajo) y visor de transcripts de chat.

### Análisis del jugador
- **En el cliente (`profile.ts`), determinista:** a partir de eventos (decisiones, dados, muertes, huidas, tiempo por escena, rendimiento en chats) calcula rasgos: cobarde↔temerario, charlatán↔violento, explorador↔apurado, amable↔cruel con Nerly. Los rasgos se exponen como condiciones del motor (`condition.profile`) para diálogos y ramas, y como `{{perfil}}` para la IA.
- **En el servidor, agregado:** dónde muere la gente, dónde abandona, qué decisiones se toman, duración real de la partida, tasa de éxito por modo chat. Dashboard en el admin para balancear.
- Sesión anónima (UUID local), sin datos personales.

### Modos chat (`ai_chat`)
Step nuevo, configurable desde el editor:

```jsonc
{
  "type": "ai_chat",
  "mode": "persuadir",                 // define el prompt base en el admin
  "npc": "guardia",
  "goal": "Convencer al guardia babosa de dejarte entrar al Abismo",
  "maxTurns": 6,
  "vars": { "debilidad": "le encantan los halagos a su baba" },
  "outcomes": {
    "success": { "goto": "sala_entrada", "effects": { "stats": { "sexi": 5 } } },
    "partial": { "goto": "entrada_con_escolta" },
    "failure": { "goto": "combate_guardia" }
  },
  "fallback": { "type": "dice", "stat": "sexi", "difficulty": 14 }
}
```

| Modo | Mecánica | Dónde |
|---|---|---|
| **persuadir** | El NPC tiene una meta secreta y una resistencia; la IA puntúa cada turno | Guardia del Abismo, noble, prestamista |
| **negociar** | Regateo libre con un precio mínimo oculto | Tendero, Rey Baboso |
| **cancion** | Versos alternados con un NPC; al final se guarda la canción | Fogata con Nerly |
| **rap** | Batalla por rondas; un "medidor de público" decide | Taberna |
| **insultos** | Duelo de réplicas; la IA juzga ingenio | Camino (bandidos) |
| **confesion** | Charla libre con el narrador, sin veredicto; alimenta el perfil | Prólogo, final secreto |

UI: la terminal ya acepta texto (`CommandParser`). Se agrega un sub-modo "chat" con indicador de turnos restantes, medidor (resistencia o público) y `/rendirse` para salir.

---

## Imágenes

- `public/games/calabosos/IMAGENES.md`: una entrada por imagen con nombre de archivo, tamaño, escena donde aparece, descripción, estilo y prompt sugerido para generarla.
- Placeholders generados por script (color + texto con el nombre) para que todo funcione desde el día uno.
- Se reutiliza lo que ya existe en `demo/images`.

---

## Fases de trabajo

| Fase | Contenido | Entregable |
|---|---|---|
| **F0 · Base** ✅ | Carpeta `calabosos/`, escenas en varios archivos (`scenes/*.json`) en loader y exportador, **validador** (`npm run validate`), `contentRating` + gate +18, `IMAGENES.md` + placeholders | Juego vacío que carga, pasa el gate y valida |
| **F1 · Sarcasmo** ✅ | Stats, `linesPool`, contador meta, pools de burlas, reacción al nombre | Sistemas listos |
| **F2 · Servidor PHP** ✅ | `server/`: API DeepSeek, DB, admin con login, prompts versionados, límites, kill switch | Admin funcionando en tu servidor |
| **F3 · IA en el motor** ✅ | `src/ai/`, `ai_narrate`, `ai_chat` con los 6 modos, `profile.ts`, eventos, fallbacks, editores de los steps nuevos | Modos chat jugables con y sin IA |
| **F4 · Prólogo + Acto I** ✅ | Tutorial, migrar demo, taberna/rap, regateo libre | Jugable hasta que Nerly se une |
| **F5 · Acto II** ✅ | Viaje, insultos, anciano, bestiario, canción | Hasta la entrada del abismo |
| **F6 · Acto III** | Guardia, 3 zonas, 5 especies | Hasta el trono |
| **F7 · Acto IV + Finales** | Negociación, batalla en 3 fases, finales, recap | **Juego completo** |
| **F8 · Analítica + Pulido** | Dashboard admin, balance con datos reales, imágenes finales, playtest de 1 hora, deploy | Versión 1.0 |

### Verificación por fase
- `npm run validate` sin errores.
- Playtest en `http://127.0.0.1:5173/cyb/` de cada ruta nueva, **con IA y con IA apagada**.
- `npm run build` sin errores.
- Servidor: probar endpoints con curl, rate limit y kill switch.

---

## Datos para F2 (servidor)

- **PHP:** hoy 7.4 en el servidor → el código debe ser compatible con **PHP 7.4 y 8.x** (sin enums, `match`, readonly, named args, union types en firmas, `str_contains`, etc.; o con polyfills).
- **Hosting:** el juego y la API se publican **en el mismo servidor propio**, así que el CORS puede limitarse al mismo origen.
- **API key de DeepSeek:** la pone el usuario en un archivo de config fuera del webroot. Nunca en el repo ni en el chat.
- Base de datos: **SQLite** (decidido).
- Implementado en `server/` — instalación, API y seguridad en [`server/README.md`](../server/README.md).
