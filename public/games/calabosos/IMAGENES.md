# Imágenes — Calabosos y Babosos

Guía de arte del juego. Cada imagen tiene su ficha con archivo, tamaño, escenas donde aparece y un prompt listo para generarla.

## Cómo funciona

- Toda imagen que el juego usa y todavía no existe se genera como **provisoria** con `npm run placeholders -- calabosos` (fondo morado con el nombre del archivo).
- Para poner el arte final, **reemplaza el archivo con el mismo nombre**. No hay que tocar ningún JSON.
- Las provisorias quedan registradas en `images/.placeholders.json`. Al volver a correr `npm run placeholders -- calabosos`, las que ya reemplazaste salen de la lista solas.
- `npm run validate -- calabosos` muestra cuántas provisorias quedan.
- En `npm run build` todas las imágenes se convierten a WebP automáticamente, así que entrégalas en PNG.

## Estilo general

**Pixel art 16 bits**, fantasía oscura con toque cómico y satírico. Paleta dominante: morados, lilas y verdes viscosos. **Sin texto ni UI dentro de la imagen.**

| Tipo | Carpeta | Tamaño | Notas |
|---|---|---|---|
| Escenario | `images/scenarios/` | 768×432 (16:9) | Vista panorámica |
| Retrato | `images/dialogs/` | 256×256 | Busto (cabeza y hombros), fondo oscuro o viñeta sutil |
| Item | `images/items/` | 256×256 | Objeto centrado, fondo transparente |

---

## POR CREAR (hoy son provisorias)

### scenarios/habitacion_bob.png — La habitación de BOB
**Escenas:** `start` (Prólogo: El Despertar)

16-bit pixel art. Habitación medieval pequeña y desordenada, vista panorámica. Cama de paja deshecha con una sábana que ha visto cosas. Ropa tirada por el suelo, un plato con restos de algo verde que ya tiene vida propia. Una mochila vieja colgando de un gancho, una lámpara de aceite apagada sobre una mesa coja, una carta con sello de cera morado sobre el suelo junto a la puerta. Ventana abierta con cortinas raídas que dejan entrar luz de mañana. Póster medieval de un héroe musculoso en la pared (contraste irónico). Paleta: marrones cálidos, luz amarilla de mañana, detalles morados.

---

### scenarios/camino.png — El camino al Abismo
**Escenas:** `acto2_camino`

16-bit pixel art. Camino de tierra serpenteante que se aleja de un pueblo medieval (pequeño al fondo izquierdo) hacia unas montañas oscuras en el horizonte derecho, donde se ve un resplandor verde viscoso. Bosque de árboles retorcidos a los lados. Un cartel de madera torcido apuntando al horizonte (sin texto legible). Rastros brillantes de baba cruzando el camino. Cielo de atardecer morado y naranja. Sensación de viaje hacia algo que no deberías hacer.

---

### scenarios/trono_rey.png — Sala del Trono del Rey Baboso
**Escenas:** `acto4_trono`

16-bit pixel art. Enorme caverna subterránea convertida en sala del trono. Al fondo, un trono gigante hecho de mucosidad solidificada, cristales y huesos de aventureros anteriores. Estalactitas goteando baba luminosa verde. Estandartes andrajosos con un símbolo de babosa coronada. Charcos brillantes en el suelo. Babosas guardianas pequeñas a los lados. El trono está vacío o con una silueta enorme en sombra. Iluminación dramática desde abajo en verde y morado. Grandioso y ridículo a la vez.

---

### scenarios/muerte.png — Has muerto
**Escenas:** `muerte` (se llega aquí cuando las ganas de vivir llegan a 0)

16-bit pixel art. Lápida torcida de piedra en un cementerio de pueblo al atardecer, con un epitafio ilegible (garabatos, sin texto real). Sobre la lápida, una babosa pequeña sentada comiéndose una flor del ramo funerario. Al lado, el perro de tres ojos del pueblo mirando la tumba con cara de burla. Pasto seco, cuervos en una rama. Otras tumbas al fondo, muchas, algunas recién cavadas (insinuando muertes anteriores del jugador). Paleta: morados apagados, grises, un rayo de luz dorada ridículamente heroico sobre la lápida.

---

### dialogs/protagonist_misterioso.png — BOB (Misterioso)
**Personaje:** `protagonist` (variante "misterioso")

16-bit pixel art. Retrato de busto. Figura completamente envuelta en una capucha y capa marrón gastada, con el rostro en sombra total salvo dos ojos redondos brillantes con expresión de "¿qué hago aquí?". Una gota de sudor visible. Mismo chaleco de campesino que las otras versiones asomando por la capa. Intenta verse enigmático y fracasa. Fondo oscuro.

---

### dialogs/bardo.png — Bardo Babosa
**Personaje:** `bardo` (taberna, guerra de rap)

16-bit pixel art. Retrato de busto. Babosa verde lima con un sombrero de bardo con pluma exagerada, ladeado. Un laúd diminuto sostenido por sus antenas. Gafas de sol redondas totalmente fuera de época. Cadena de oro falso colgando. Sonrisa arrogante. Baba brillante goteando del laúd. Aspecto de alguien que se cree mucho mejor artista de lo que es. Fondo oscuro con luz cálida de taberna.

---

### dialogs/guardia.png — Guardia del Abismo
**Personaje:** `guardia` (entrada del Abismo, modo "convénceme")

16-bit pixel art. Retrato de busto. Babosa gris verdosa grande con un yelmo medieval oxidado demasiado pequeño para su cabeza. Coraza abollada. Sostiene una lanza apoyada con desgana. Ojos entrecerrados de aburrimiento extremo, una antena doblada. Se nota que lleva horas de turno y odia su trabajo. Fondo oscuro de caverna con luz verde.

---

### dialogs/rey_baboso.png — El Rey Baboso
**Personaje:** `rey_baboso` (Acto IV)

16-bit pixel art. Retrato de busto. Babosa colosal morada oscura, con una corona dorada hundida en su carne gelatinosa. Capa real de terciopelo rojo empapada de baba. Múltiples papadas. Ojos pequeños, crueles y engreídos sobre antenas largas. Sonrisa enorme con dientes diminutos (las babosas tienen miles). Joyas pegadas al cuerpo por la mucosidad. Aura verde tóxica. Temible y ridículo a partes iguales. Fondo oscuro con resplandor verde.

---

### scenarios/taberna.png — Taberna «La Babosa Ebria»
**Escenas:** `acto1_taberna`, `acto1_rap`, `acto1_cerveza`, `acto1_taberna_salida`

16-bit pixel art. Taberna medieval llena y ruidosa vista en panorámica. Mesas de madera pegajosas con jarras volcadas, clientes humanos borrachos mezclados con babosas de colores sentadas en taburetes. Al fondo, un pequeño escenario con una babosa verde con laúd y gafas de sol (el Bardo) bajo un foco de velas. Letrero de madera con una babosa sosteniendo una jarra. Chimenea encendida, luz cálida naranja contra sombras moradas. Charcos brillantes de baba en el suelo. Ambiente de batalla de rap improvisada.

---

### scenarios/puerta_ciudad.png — Puerta de la Ciudad
**Escenas:** `acto1_puerta`, `acto1_muro`, `acto1_intimidar`, `acto1_salida`, `acto1_duda`

16-bit pixel art. Enorme portón de madera reforzado con hierro en una muralla de piedra, visto de frente. Dos guardias con armaduras abolladas y cara de aburrimiento extremo, uno bostezando, el otro apoyado en su lanza. Un cartel clavado en la puerta (sin texto legible) y una garita pequeña. Del otro lado de la muralla se adivina un camino y montañas oscuras con resplandor verde. Atardecer morado. La muralla tiene grietas por donde alguien claramente intentó trepar.

---

### dialogs/mago.png — Mago de las Calles
**Personaje:** `mago`

16-bit pixel art. Retrato de busto. Hombre flaco y anguloso con túnica morada raída llena de parches y estrellas cosidas torcidas. Sombrero puntiagudo abollado. Barba de chivo mal cuidada, sonrisa de estafador con un diente de oro. Ojos brillantes y demasiado abiertos. Un pañuelo de colores asomando de la manga y humo morado a su alrededor. Da escalofríos y confianza a partes iguales (más escalofríos). Fondo oscuro.

---

### dialogs/guardias.png — Guardias de la Puerta
**Personaje:** `guardias`

16-bit pixel art. Retrato de dos guardias juntos, hombro con hombro. Uno alto y flaco con casco que le tapa los ojos; otro bajo y gordo con bigote enorme. Armaduras de cuero y metal abolladas, lanzas cruzadas. Expresión de lunes eterno. Fondo de piedra de muralla en penumbra.

---

### dialogs/jefe_guardia.png — Jefe de la Guardia
**Personaje:** `jefe_guardia`

16-bit pixel art. Retrato de busto. Hombre robusto de mediana edad quitándose un disfraz de noble: peluca empolvada a medio caer que revela una cabeza rapada con cicatriz, casaca de noble abierta sobre la armadura de la guardia. Sonrisa satisfecha de quien acaba de atrapar a un ratero. Fondo oscuro.

---

### items/ — Objetos del Prólogo y el Acto I (256×256, fondo transparente)

Mismo estilo pixel art 16 bits, objeto centrado, contorno oscuro marcado para que se lea sobre fondos morados.

| Archivo | Objeto | Descripción para el prompt |
|---|---|---|
| `mochila.png` | Mochila raída | Mochila de cuero gastada con un agujero grande y remiendos |
| `lampara.png` | Lámpara de aceite | Lámpara de aceite de latón con llama pequeña y hollín |
| `llave_oxidada.png` | Llave oxidada | Llave de hierro antigua cubierta de óxido naranja y pelusa |
| `carta_misteriosa.png` | Carta misteriosa | Sobre de pergamino con sello de cera morado con forma de máscara de teatro |
| `baba_caballo.png` | Baba de caballo | Frasco con líquido verde brillante y burbujas |
| `silbato_caballos.png` | Silbato para caballos | Silbato de hueso con cordón rojo |
| `amuleto_equino.png` | Amuleto equino | Herradura dorada pequeña con una gema, algo sucia |
| `mapa_sospechoso.png` | Mapa sospechoso | Pergamino arrugado con manchas de sangre seca y una X |
| `amuleto_proteccion.png` | Amuleto de protección menor | Colgante de madera tallada con un ojo, cordón deshilachado |
| `mapa_detallado.png` | Mapa detallado del Abismo | Mapa enrollado con cinta verde y bordes limpios |
| `daga_ceremonial.png` | Daga ceremonial | Daga ornamentada con empuñadura dorada y hoja corta |
| `amuleto_extrano.png` | Amuleto extraño | Piedra negra pulida con runas verdes brillantes |
| `llave_misteriosa.png` | Llave misteriosa | Llave de plata con cabeza en forma de babosa |
| `mapa_parcial.png` | Mapa parcial del Abismo | Mapa roto por la mitad, borde irregular |
| `pocion_sospechosa.png` | Poción sospechosa | Botella con líquido rosa que burbujea y una etiqueta tachada |
| `panal.png` | Pañal de aventurero | Pañal de tela con remaches de cuero, estilo armadura |
| `boton_luminiscente.png` | Botón luminiscente | Botón de madera que brilla en verde en la oscuridad |
| `huevo_runico.png` | Huevo rúnico | Huevo blanco con runas azules grabadas y un leve brillo |
| `cristal_vision.png` | Cristal de visión | Cristal violeta facetado con una imagen tenue flotando dentro |
| `permiso_salida.png` | Permiso de Salida Suicida | Documento oficial con sello y una firma hecha con crayón |

---

## YA EXISTEN (copiadas de la demo)

**Escenarios:** `intro`, `plaza`, `establos`, `casa_empenos`, `mercado`, `tienda`, `tienda_2`, `callejon`, `entrada_abismo`, `sala_entrada`, `grutas_cristal`, `final`

**Retratos:** `narrator`, `protagonist_male`, `protagonist_female`, `protagonist_andro`, `nerly`, `tendero`, `noble`, `dueno_establos`, `prestamista`, `anciano`, `system`

**Items:** `bolsa_monedas` (bolsa misteriosa), `espada_oxidada`, `relicario_familiar`, `relicario_familiar_2`, `sal_anti_babosas` (saco de sal), `zurron_espacioso` (bolso de escroto de elefante)

---

## PRÓXIMAS (se agregan a medida que se escriben los actos)

Se sumarán fichas a este documento en cada fase. Ya están previstas:
- **Escenarios:** fogata del camino, Cavernas de Cría, Abismo Profundo, túnel sigiloso, Corazón del Abismo, pasaje secreto, finales (retiro pacífico, nuevas aventuras, el verdadero narrador).
- **Retratos:** las 5 especies de babosa (ácida, saltarina, gemelas, fantasma, explosiva), bandidos, Takashi Komuro.
- **Items:** huevo de babosa, Lágrima de Cristal.
