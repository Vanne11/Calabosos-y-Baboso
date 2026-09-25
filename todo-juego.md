# TODO del juego — Calabosos y Babosos

Pendientes de **contenido y pruebas** del juego (lo de la IA está en `todo.md`, completo).
Auditoría automática del 2026-09-25: no hay condiciones rotas (ningún flag u objeto se pide sin que el juego
lo entregue), pero hay promesas del guion que nunca se cumplen y consecuencias que no vuelven.

## 1. Promesas que el jugador nota y nunca se cumplen

Objetos que se reciben y no sirven para nada (21), con una idea de uso:

- [ ] **Llave misteriosa** (robo al noble) — "Abre algo. Algún día." → que abra un cofre en el Abismo (Sala de Entrada o Grutas).
- [ ] **Huevo rúnico** (truco del Mago) — "Aparecerá cuando más lo necesites" → que eclosione en la pelea con el Rey (ventaja o ayuda).
- [ ] **Residuo ácido** (Babosa Ácida) — la visión habla de "sal mezclada con residuo" → combinarlo con sal (crafteo) en un proyectil ácido.
- [ ] **Bolsa misteriosa** (caballos) — "Nadie sabe qué hay dentro. Tintinea." → poder abrirla (monedas o sorpresa).
- [ ] **Poción de Ian** — "Nerly quiere olerla antes" → que Nerly la huela y diga qué es (útil o trampa).
- [ ] **Cristal de Ocultamiento** — "Confunde los sentidos de las babosas" → pasar sin pelear a las Guardianas o evitar un combate.
- [ ] **Mapas** (detallado, parcial, sospechoso, de Ian) — ninguno sirve → pistas de rutas, bajar dificultad de una tirada o llevar a una trampa (el de Ian).
- [ ] **Amuletos** (protección, extraño, equino) — ninguno protege → efecto pasivo en combate o al morir.
- [ ] **Silbato para caballos** — "Los caballos te obedecen" → algún uso en el camino (Acto II).
- [ ] **Cristal de visión** — "Proyecta lo que imaginas" → pista o distracción (Acto IV).
- [ ] **Baba maternal** — "Las babosas de la cría te reconocen" → que cambie algo al volver a las Cavernas de Cría.
- [ ] **Carta, mochila, camiseta, relicario** — decorativos; decidir si está bien así.
- [ ] **Recompensa del Narrador** (`promesa_recompensa` / `promesa_estatua` al negociar con él) → que los finales la paguen o se burlen de que no la paga.

## 2. Consecuencias que se anotan y no vuelven (sin IA se pierden)

Con IA, la memoria hace que personajes y narrador puedan mencionarlas; sin IA ninguna escena ni final cambia.
Elegir cuáles deberían cambiar algo (texto de un final, una reacción, un precio):

- [ ] Rap: `rap_ganado`, `rap_perdido` (el Bardo podría reaparecer o nombrarse en el final heroico)
- [ ] Canción con Nerly: `cancion_bonita`, `cancion_regular`, `cancion_horrible` (el final ya usa la letra; la calidad no)
- [ ] Tendero: `mintio_tendero` · Prestamista: `deuda_pagada`, `prestamista_comido`
- [ ] Guardia: `guardia_convencido` · Bandidos: `bandidos_humillados` · Árbol: `confeso_arbol`
- [ ] Rey: `rey_dudoso`, `rey_furioso`, `rey_derrotado`, `golpe_critico_rey`, `ventaja_sorpresa`, `entrada_frontal`, `entrada_real`
- [ ] Lágrima: `vision_completa`, `vision_parcial`, `vision_confusa`, `vision_origen`, `pista_lagrima`, `lagrima_ignorada`
- [ ] Nerly: `nerly_ayudo`, `nerly_confianza` · Otros: `se_meo`, `ian_sospechoso`, `alianza_babosa`, `afinidad_magica`,
      `cristal_expuesto`, `taxonomia_babosa`, `ventana_cerrada`

## 3. Final secreto

- [ ] El bot no lo alcanzó en 300 partidas: pide Nerly leal + tocar la Lágrima + usar el pasaje secreto.
      Decidir si es a propósito; si no, dejar una pista (el anciano, Nerly o el narrador).

## 4. Probar con DeepSeek real (en el hosting)

- [ ] Subir `release/calabosos-v1.1.0/cyb/` encima (la base se migra sola a la versión 9) y recargar con Ctrl+Shift+R.
- [ ] Admin → Prompts → «Probar ahora»: `narrador.base`, `narrate.charla`, `narrate.charla_npc`, `narrate.epitafio`,
      `libre.accion`, `chat.negociar`, `chat.rap`, `chat.persuadir`.
- [ ] El Bardo rima en el rap y en la charla libre.
- [ ] El Tendero: el trato se mueve turno a turno y después recuerda lo que le compraste.
- [ ] Acción libre: distingue bien "es una opción" de "es una consecuencia".
- [ ] Textos en femenino y con x (elegir Femenino y Andrógino al empezar).
- [ ] Revisar Admin → Calificaciones después de unas partidas y elegir ejemplos.

## 5. Arte provisorio (64 imágenes, fichas en `public/games/calabosos/IMAGENES.md`)

- [ ] Objetos: 36
- [ ] Escenarios: 15
- [ ] Personajes: 13

## 6. Mejoras pendientes de decidir

- [ ] Autoguardado por escena + "Continuar" al hacer `run calabosos` (hoy solo `/save` manual; cerrar la pestaña pierde la partida).
- [ ] Comando `/reiniciar` (borrar partidas guardadas y contadores de este juego, con confirmación).
- [ ] Borrar `release/calabosos-v1.0.0/` (versión vieja con BOB) para no confundirla.
- [ ] Push de los commits locales y PR `cyb-web` → `main`.

## 7. Rutas para probar a mano

Cada escena con decisiones o mecánicas (entre corchetes: dados, combate, chat IA, tienda...). Marcar al probar.

### Prólogo

- [ ] `start`: Masculino · Femenino · Andrógino · Misterioso (con capucha, para ocultar la vergüenza)
- [ ] `prologo_reaccion_nombre`: Mirar alrededor
- [ ] `prologo_habitacion` [revisar]
- [ ] `prologo_puerta` [usar objeto]
- [ ] `prologo_salida`: Salir a la calle

### Acto I — El pueblo

- [ ] `acto1_plaza`: "Está bien, acepto la misión. ¿Cuál es el plan?" · "Ni hablar. Buscaré una taberna y me emborracharé." · "¿Y qué gano yo con todo esto?" + ✍️ acción libre
- [ ] `acto1_negociar_narrador` [chat IA]
- [ ] `acto1_decision`: Buscar un trabajo rápido (tablón de anuncios) · Buscar algo de valor que vender · Tomar prestado algo de dinero... sin permiso · Pedir un préstamo en la casa de empeños · Ir a la tienda del Tendero · Ir a la tienda con los bolsillos vacíos (a ver qué pasa) + ✍️ acción libre
- [ ] `acto1_tablon`: Limpiar establos (suena lo menos peligroso) · Probar pociones (al menos será interesante) · Ayudar al verdugo (debe pagar bien)
- [ ] `acto1_verdugo`: Volver al tablón
- [ ] `acto1_establos` [dados]: Volver a la plaza
- [ ] `acto1_pociones` [azar]: Volver a la plaza
- [ ] `acto1_relicario`: Vender el relicario, supongo · "Mis zapatos no, los necesito para la aventura"
- [ ] `acto1_zapatos`: Vender el relicario de una vez · Guardar el relicario y volver
- [ ] `acto1_empenos` [dados]: Volver a la plaza
- [ ] `acto1_prestamo`: Aceptar el préstamo (¿qué podría salir mal?) · Rechazarlo y retroceder lentamente
- [ ] `acto1_robo` [dados]: Alejarse silbando
- [ ] `acto1_tienda`: "Tengo {dinero} monedas." (la verdad) · "Tengo... la mitad de eso." (mentir para regatear) · "¿Aceptas trueque?" + ✍️ acción libre
- [ ] `acto1_regateo` [chat IA]
- [ ] `acto1_tienda_compra` [tienda]
- [ ] `acto1_expulsado`: Levantarte con la dignidad que te queda
- [ ] `acto1_tienda_salida`: Ir hacia la puerta de la ciudad · Tomar un descanso en la taberna
- [ ] `acto1_taberna`: Aceptar la guerra de rap · Solo pedir una cerveza · Irse con la cola entre las piernas + ✍️ acción libre
- [ ] `acto1_rap` [chat IA]
- [ ] `acto1_cerveza` [azar]: Salir de la taberna
- [ ] `acto1_callejon`: Investigar el sonido · Ignorarlo y seguir adelante
- [ ] `acto1_callejon_ignorar`: Mirar qué es, ya que insistes
- [ ] `acto1_nerly`: "¿Por qué debería confiar en una babosa?" · "Gracias. Me vendría bien la ayuda." · "¿Y tú qué ganas con esto?" + ✍️ acción libre
- [ ] `acto1_nerly_explica`: "Vale. Vienes conmigo."
- [ ] `acto1_nerly_motivo`: "Está bien. Vamos juntos."
- [ ] `acto1_nerly_se_une` [dados]: Ir a la puerta de la ciudad
- [ ] `acto1_puerta`: Buscar ese permiso · "¿No hay otra forma de salir?" (saltar el muro) · "Soy el héroe elegido. Déjenme pasar." + ✍️ acción libre
- [ ] `acto1_muro` [dados]
- [ ] `acto1_intimidar` [dados]
- [ ] `acto1_mago`: "Aquí tienes 50 monedas." · "¿Para qué quieres mi pelo y mi sangre?" · "No tengo 50 monedas." (mirar al suelo)
- [ ] `acto1_mago_truco` [dados]: "¿Y mi permiso?"
- [ ] `acto1_permiso`: Volver a la puerta con el permiso
- [ ] `acto1_salida`: Ir directo al Abismo · Buscar un arbusto primero · "¿Seguro que quiero hacer esto?"
- [ ] `acto1_duda`: Caminar hacia el Abismo, resignado

### Acto II — El camino

- [ ] `acto2_camino`: Preguntarle a Nerly por el Rey Baboso · Preguntar por los tipos de babosas · Seguir avanzando en silencio
- [ ] `acto2_rey`: "¿Cómo conoces el Abismo tan bien?" · "¿Tiene alguna debilidad?" · "Sigamos."
- [ ] `acto2_nerly_historia`: "Lo siento, Nerly." · "¿Con la lengua?"
- [ ] `acto2_rey_debilidad`: "Sigamos."
- [ ] `acto2_taxonomia`: "¿Algún consejo para enfrentarlas?" · "¿Por qué me ayudas contra tu propia especie?" · "Continuemos, ya casi llegamos."
- [ ] `acto2_consejos`: "Gracias, Nerly."
- [ ] `acto2_nerly_motivo`: "Lo derrotaremos juntos." · "Vaya. Bueno. ¿Seguimos?"
- [ ] `acto2_camino_menu`: Preguntar por el Rey Baboso · Preguntar por los tipos de babosas · Ponerse en marcha
- [ ] `acto2_viaje` [azar]
- [ ] `acto2_bandidos`: Retarlo a un duelo de insultos · Pagar el "peaje" (15 monedas) · Huir gritando entre los árboles + ✍️ acción libre
- [ ] `acto2_insultos` [chat IA]
- [ ] `acto2_huida_bandidos`: Volver por Nerly (y fingir que era una estrategia) · Seguir corriendo (Nerly ya te alcanzará)
- [ ] `acto2_takashi`: "No, amigo. Aquí solo hay babosas. Vete a casa." · "¡Únete a nosotros! Nos vendría bien alguien con un bate." · "Sí. Los zombis están en el Abismo. Corre, ve primero."
- [ ] `acto2_takashi_despedida`: Seguir el camino
- [ ] `acto2_takashi_unirse`: Seguir el camino
- [ ] `acto2_takashi_mentira`: Seguir el camino (silbando)
- [ ] `acto2_viaje2` [azar]
- [ ] `acto2_babosita`: Ayudarla a volver a su tronco y darle una miga de pan · Echarle sal (¿por qué harías eso?) · Ignorarla y seguir + ✍️ acción libre
- [ ] `acto2_babosita_sal`: Seguir, sintiéndote un monstruo
- [ ] `acto2_arbol` [chat IA]
- [ ] `acto2_fogata`: Componer la canción con Nerly · Contar historias de terror junto al fuego · Dormir. Mañana hay que morir temprano. + ✍️ acción libre
- [ ] `acto2_cancion` [chat IA]
- [ ] `acto2_dormir` [azar]: Seguir hacia el Abismo
- [ ] `acto2_llegada`: Hablar con el anciano
- [ ] `acto2_anciano`: "¿Algún consejo útil para sobrevivir ahí dentro?" · "¿Qué pasó con tu camiseta?" · Es hora de entrar al Abismo
- [ ] `acto2_anciano_consejos`: "Gracias, abuelo."
- [ ] `acto2_anciano_historia`: Ponerte la camiseta encima (por qué no) · Guardarla

### Acto III — El Abismo

- [ ] `acto3_abismo`: "Entraré sigilosamente." (túnel lateral) · "¡A la carga!" (entrada principal) · "Primero lanzaré algo para ver si es seguro." + ✍️ acción libre
- [ ] `acto3_prueba`: Entrar por el túnel lateral · Entrar por la puerta principal
- [ ] `acto3_guardia` [chat IA]
- [ ] `acto3_tunel_sigilo` [dados]: Salir del túnel
- [ ] `acto3_sala_entrada` [combate]
- [ ] `acto3_hub`: Izquierda: Cavernas de Cría · Centro: Abismo Profundo · Derecha: Grutas de Cristal · Visitar la "Sucursal Subterránea" del Tendero · Descansar un momento contra la pared · Avanzar hacia el trono del Rey Baboso
- [ ] `acto3_descanso`: Levantarse
- [ ] `acto3_tienda` [tienda]
- [ ] `acto3_cria` [decisión con tiempo]: Tirarte al suelo entre los huevos · Correr hacia la oscuridad · Quedarte quieto como una estatua
- [ ] `acto3_cria_madres` [combate]
- [ ] `acto3_cria_huevos`: Robar el huevo dorado · Dejar los huevos en paz · Volver a la Sala de Entrada
- [ ] `acto3_profundo` [dados]: Seguir por el pasaje orgánico
- [ ] `acto3_masa` [acertijo]
- [ ] `acto3_explosiva`: Pasar de puntillas sin mirarla · Atacarla antes de que despierte
- [ ] `acto3_explosiva_sigilo` [dados]
- [ ] `acto3_explosiva_pelea` [combate]
- [ ] `acto3_gemelas` [combate]
- [ ] `acto3_profundo_fin`: Volver a la Sala de Entrada
- [ ] `acto3_grutas` [combate]
- [ ] `acto3_lagrima`: Tocar la Lágrima de Cristal · Dejarla donde está
- [ ] `acto3_vision` [dados]: Recuperar el aliento
- [ ] `acto3_grutas_fin`: Volver a la Sala de Entrada
- [ ] `acto3_hacia_trono`: Enfrentar al Rey Baboso

### Acto IV — El Rey

- [ ] `acto4_trono`: Enfrentarlas directamente · Buscar un pasaje alternativo · Intentar distraerlas
- [ ] `acto4_guardianas` [combate]
- [ ] `acto4_distraer` [dados]
- [ ] `acto4_pasaje_real`: Entrar al trono por la puerta de la familia
- [ ] `acto4_pasaje_mapa`: Seguir el pasaje hasta el trono
- [ ] `acto4_pasaje_grieta` [dados]: Salir de la grieta
- [ ] `acto4_sala_trono`: Atacar directamente · Distraerlo mientras preparas un ataque · Intentar negociar con el Rey + ✍️ acción libre
- [ ] `acto4_distraer_rey` [dados]
- [ ] `acto4_negociacion` [chat IA]
- [ ] `acto4_fase1` [combate]
- [ ] `acto4_prestamista`: Pagarle lo que tengas ({dinero} monedas) · Señalarle al Rey: "Majestad, él tiene más carne que yo" · Ignorarlo y seguir peleando
- [ ] `acto4_prestamista_comido`: Aprovechar la indigestión real
- [ ] `acto4_fase2` [dados]
- [ ] `acto4_fase3_debil` [combate]
- [ ] `acto4_fase3` [combate]
- [ ] `acto4_fase3_fuerte` [combate]
- [ ] `acto4_desenlace`: Regresar a la ciudad como héroe · Seguir aventurándote con Nerly · Retirarte a una vida tranquila

### Finales

- [ ] `muerte`: Volver al último punto seguro (el narrador no olvida) · Empezar de cero (masoquista) · Rendirse
- [ ] `final_heroico`: …¿Qué es esa presencia que se siente en el aire? · Jugar de nuevo (el narrador te espera) · Salir
- [ ] `final_nuevas_aventuras`: …¿Qué es esa presencia que se siente en el aire? · Jugar de nuevo (el narrador te espera) · Salir
- [ ] `final_retiro`: …¿Qué es esa presencia que se siente en el aire? · Jugar de nuevo (el narrador te espera) · Salir
- [ ] `final_secreto` [chat IA]: Jugar de nuevo (ahora sabes quién te narra) · Salir
