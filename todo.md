# TODO — IA más humana e interactiva

Diagnóstico (2026-09-25): 117 escenas, 362 diálogos, solo 5 `dialog.ai` y 9 `ai_chat`. Cada llamada a la IA
llega sin memoria de la partida (solo perfil de ≤6 etiquetas), los NPCs tienen una descripción de una línea
y el recap final recibe solo números. Resultado: humor genérico, sin callbacks.

## 1. Memoria de la partida ("diario de BOB") — HECHO

- [x] `Effects.memo` (string | string[]): hechos en `PlayerState.memoria` (admite `{variables}`; tope 30, viajan 10).
- [x] Hechos automáticos: resultado de cada `ai_chat` (también por dados) y memos de `statRules`, con la escena.
- [x] `PlayerState.decisiones`: opciones con `tags` elegidas, tal cual y con su escena (tope 12, viajan 6).
- [x] `PlayerState.citas`: la frase del jugador que más subió el medidor en cada chat (tope 8, viajan 3).
- [x] `PlayerState.iaDijo`: últimas 5 líneas del narrador → `ya_dijiste` (no repetir chistes).
- [x] La memoria de la IA sobrevive a `_checkpoint` (el narrador recuerda tus muertes).
- [x] Servidor: límite aparte `max_context_chars` (1200) y bloque "CONTEXTO DE LA PARTIDA" automático.
- [x] Contenido: memos en 22 desenlaces de dados/azar, 5 escenas (muerte, babosita, Takashi, prestamista, desenlace) y 4 reglas.
- [x] Recap, muerte y reacción v2: piden usar la memoria y citar a BOB tal cual.
- [x] Tests (4 nuevos en `tests/engine/ia.test.ts`) y docs (`docs/ia.md`, `docs/efectos.md`, CLAUDE.md).

## 1b. Cómo escribe el jugador (modismos y faltas) — HECHO

- [x] `PlayerState.habla`: últimos 4 mensajes del jugador sin corregir → `como_escribe`.
- [x] Hoja del narrador v2: contestar en su registro, usar sus modismos, burlarse a veces de UNA falta,
      nunca corregir como profesor, la ortografía no baja el puntaje.
- [ ] Más adelante: apodos del narrador según cómo escribe (memo automático tras N faltas detectadas por la IA).

## 2. Fichas de personaje y voz menos "de IA" — HECHO

- [x] `CharacterDef.ai`: `voz`, `muletillas[]`, `quiere`, `teme`, `secreto`, `ejemplos[]`.
- [x] Motor: `npc_ficha` en los chats y `ficha_narrador` en la narración.
- [x] `animo` del narrador desde la stat `animo_narrador` (inicial + cambia al empezar cada acto).
- [x] Hoja del narrador v2 con reglas anti-IA.
- [x] Migración 3 + `Seed::upgrade()`: activa la v2 solo si el admin no editó el prompt.
- [x] Fichas: narrador, Nerly, tendero, bardo, guardia, rey, bandido, árbol, prestamista, mago, anciano.

## Pendiente de probar (usuario)

- [ ] Subir el servidor actualizado: la migración 3 corre sola; revisar en el admin que `narrador.base` quedó en v2.
- [ ] Probar con DeepSeek real ("Probar ahora" del admin) y jugar los chats escribiendo con faltas y modismos.
- [ ] Ajustar fichas/ánimos según cómo suenen.

## 3. Conversaciones con consecuencias — PENDIENTE

- [ ] Campo `"gesto"` en el contrato del chat, validado contra una lista del paso (`regala`, `revela`, `se_ofende`).
- [ ] Campo `"recuerdo"`: resumen de una línea de la conversación → memoria.
- [ ] Historial por NPC (`{{historial_npc}}`): los personajes recuerdan encuentros anteriores.

## 4. Elecciones con texto libre — PENDIENTE

- [ ] `choice.freeText`: el jugador escribe lo que quiere hacer y la IA lo mapea a una opción y narra el resultado.
- [ ] Respaldo: sin IA o sin coincidencia, se muestran las opciones normales. Usar en 5-10 momentos clave.

## 5. Más narrador, sin esperas — PENDIENTE

- [ ] Pedido adelantado: la narración sale al entrar a la escena y se espera recién al llegar al paso.
- [ ] `option.aiReact: 0.3`: probabilidad de que el narrador comente la decisión.

## 6. Comando `/narrador <texto>` — PENDIENTE

- [ ] Hablarle al narrador en cualquier momento, con límite por acto, sabiendo escena y memoria.

## 7. Muertes y recap personales — PENDIENTE (en parte cubierto por 1)

- [ ] Epitafio al morir basado en la última decisión.

## 8. Mejora continua — PENDIENTE

- [ ] `/bien` y `/mal` para calificar líneas; el admin convierte las mejores en ejemplos few-shot.
- [ ] Las mejores líneas pasan a los pools de respaldo sin IA.
