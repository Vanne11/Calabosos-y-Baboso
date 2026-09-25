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

### scenarios/habitacion_bob.png — La habitación de Alex
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

### dialogs/protagonist_misterioso.png — Alex (Misterioso)
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

### scenarios/fogata.png — Fogata en el bosque
**Escenas:** `acto2_fogata`, `acto2_cancion`, `acto2_dormir`

16-bit pixel art. Claro de bosque de noche con una fogata pequeña en el centro. A un lado, Alex sentado en un tronco con cara de cansancio; al otro, Nerly (babosa azul brillante) iluminando su alrededor más que el fuego. Árboles húmedos y retorcidos alrededor, ojos brillantes entre las sombras, luciérnagas. El suelo con rastros de baba fosforescente. Cielo estrellado morado. Ambiente cálido y un poco inquietante.

---

### scenarios/arbol_baboso.png — El Árbol Baboso
**Escenas:** `acto2_arbol`

16-bit pixel art. Árbol ancestral enorme que bloquea un sendero del bosque. El tronco tiene una cara serena tallada por el tiempo, con ojos que brillan en verde suave. Cubierto de musgo que parece respirar y ramas que gotean baba luminosa. Raíces que forman un arco sobre el camino. Luz de atardecer filtrándose entre las hojas. Solemne, mágico y un poco pegajoso.

---

### dialogs/bandido.png — Bandido Tuerto
**Personaje:** `bandido`

16-bit pixel art. Retrato de busto. Bandido flaco con parche en un ojo (torcido), sonrisa con dos dientes menos, pañuelo rojo en la cabeza y barba de tres días. Sostiene un cuchillo pequeño y oxidado con orgullo excesivo. Expresión de creerse muy ingenioso. Fondo de bosque oscuro.

---

### dialogs/takashi.png — Takashi
**Personaje:** `takashi`

16-bit pixel art. Retrato de busto. Chico adolescente de pelo negro despeinado con uniforme escolar genérico (chaqueta azul oscuro, camisa blanca), sudado y jadeando, con un bate de béisbol de madera apoyado en el hombro. Mira a todos lados con expresión de alerta exagerada, buscando zombis que no existen. Diseño original, sin parecido a ningún personaje existente. Fondo de sendero del bosque.

---

### dialogs/arbol_baboso.png — Baboba Guardiana
**Personaje:** `arbol_baboso`

16-bit pixel art. Retrato del rostro del árbol ancestral: corteza con arrugas profundas formando una cara sabia, ojos verdes brillantes, barba de musgo y gotas de baba luminosa cayendo de las ramas como lágrimas. Hojas en el borde del retrato. Fondo verde oscuro con destellos.

---

### dialogs/babosita.png — Babosita Perdida
**Personaje:** `babosita`

16-bit pixel art. Retrato de una cría de babosa pequeñita de color verde claro, con ojos enormes llenos de lágrimas, antenas caídas y un moquito colgando. Adorable y triste. Fondo del hueco de un tronco.

---

### items/ — Objetos del Acto II (256×256, fondo transparente)

| Archivo | Objeto | Descripción para el prompt |
|---|---|---|
| `bate_beisbol.png` | Bate de béisbol | Bate de madera clara con cinta gris en el mango y algunas abolladuras |
| `camiseta_sobrevivi.png` | Camiseta «Sobreviví (casi) al Abismo» | Camiseta gris doblada con una babosa estampada; la palabra de arriba tachada a mano (sin texto legible) |
| `cuchara_abuela.png` | Cuchara de madera de la abuela | Cuchara de madera vieja y gastada, con marcas de quemadura y una pequeña escama de dragón pegada al mango; un leve brillo cálido |

---

### scenarios/tunel_sigiloso.png — Túnel de las Babosas Mineras
**Escenas:** `acto3_tunel_sigilo`

16-bit pixel art. Túnel estrecho y bajo excavado en roca húmeda, visto desde dentro, en perspectiva hacia una luz lejana. Paredes con parches de esporas brillantes (rosa, cian) y marcas de raspado de babosas mineras. Raíces colgando, charcos de baba. Claustrofóbico y asqueroso. Paleta: marrones oscuros, verdes, destellos rosa y cian.

---

### scenarios/cavernas_cria.png — Cavernas de Cría
**Escenas:** `acto3_cria`, `acto3_cria_madres`, `acto3_cria_huevos`

16-bit pixel art. Caverna cálida y húmeda llena de nidos de baba con cientos de huevos translúcidos que laten con siluetas diminutas dentro. En el centro, un huevo más grande con vetas doradas. Al fondo, una babosa madre enorme vigilando. Techo alto con babosas saltarinas colgando. Luz rosada y ámbar, vapor en el aire.

---

### scenarios/abismo_profundo.png — Abismo Profundo (Sistema Digestivo)
**Escenas:** `acto3_profundo`, `acto3_masa`, `acto3_explosiva`, `acto3_gemelas`, `acto3_profundo_fin`, `acto3_hacia_trono`

16-bit pixel art. Pasaje orgánico cuyas paredes parecen tejido vivo: pulsan, tienen venas brillantes y formaciones que parecen órganos. Suelo de baba densa. Una masa gelatinosa con boca bloquea parcialmente el camino. Al fondo, una luz verde que late como un corazón. Perturbador. Paleta: rojos oscuros, morados, verde tóxico.

---

### scenarios/tienda_abismo.png — Sucursal Subterránea
**Escenas:** `acto3_tienda`

16-bit pixel art. Nicho excavado en la roca del Abismo convertido en tienda improvisada: mostrador de tablones, estantes con antorchas, sacos de sal y pociones de colores, un cartel de madera torcido (sin texto legible). Detrás, el Tendero borracho con su delantal manchado, saludando. Luz cálida de velas contra la oscuridad verde del Abismo. Absurdo y acogedor.

---

### dialogs/ian.png — Ian
**Personaje:** `ian`

16-bit pixel art. Retrato de busto. Joven delgado de sonrisa demasiado amplia y ojos entrecerrados de vendedor ambulante. Abrigo lleno de bolsillos con frascos burbujeantes de colores asomando. Pelo engominado, un pequeño bigote. Un leve humo morado a su alrededor (el mismo del Mago). Simpático y nada confiable. Fondo del Abismo.

---

### dialogs/ — Las cinco especies (se usan como imagen del enemigo en combate)

Retratos de babosa, 256×256, pixel art 16 bits, fondo oscuro de caverna. Cada una con personalidad propia.

| Archivo | Especie | Descripción para el prompt |
|---|---|---|
| `babosa_acida.png` | Babosa Ácida | Babosa rojiza del tamaño de un perro grande, cuerpo que gotea líquido verde humeante, ojos malvados, suelo derretido bajo ella |
| `babosa_saltarina.png` | Babosa Saltarina | Babosa amarilla musculosa y compacta, en pleno salto desde el techo, antenas hacia atrás, expresión de alegría sádica |
| `babosas_gemelas.png` | Babosas Gemelas | Dos babosas moradas idénticas y sincronizadas, una con un tajo a medio cerrar, sonriendo igual |
| `babosa_fantasma.png` | Babosa Fantasma | Babosa blanca semitransparente, sin cara visible, atravesando una pared de cristal, rastro de niebla |
| `babosa_explosiva.png` | Babosa Explosiva | Babosa naranja hinchada como un globo, brillando por dentro, con la piel tensa y cara de ofendida |

---

### items/ — Objetos del Acto III (256×256, fondo transparente)

| Archivo | Objeto | Descripción para el prompt |
|---|---|---|
| `monedas_dobladas.png` | Monedas dobladas | Cinco monedas de cobre dobladas y retorcidas, una encima de otra, con marcas de palanca |
| `cobre_verde.png` | Cobre verde | Frasco de vidrio con una pasta verde brillante y monedas de cobre medio disueltas flotando; humo verdoso |
| `paraguas_baba.png` | Paraguas anti-baba | Paraguas cerrado de tela amarilla chillona con gotas de baba resbalando; mango de madera |
| `casco_linterna.png` | Casco con linterna | Casco de minero abollado con una linterna encendida al frente, rayo de luz amarillo |
| `tonico_plateado.png` | Tónico de baba plateada | Frasquito con líquido plateado y brillante, etiqueta con una babosa sonriente (sin texto legible) |
| `llavero_babosa.png` | Llavero de babosa azul | Llavero con una babosa de goma azul brillante y cara simpática, argolla metálica |
| `postal_abismo.png` | Postal del Abismo | Postal con una babosa guiñando un ojo sobre un fondo de cueva verde (sin texto legible) |
| `corazon_cristalino.png` | Corazón de Babosa Cristalina | Cristal con forma de corazón que contiene luz líquida azul |
| `residuo_acido.png` | Residuo ácido | Frasco con líquido verde que burbujea y humea |
| `baba_maternal.png` | Baba maternal | Frasco con baba verde clara brillante y un lazo |
| `huevo_babosa.png` | Huevo dorado de babosa | Huevo translúcido con vetas doradas y una silueta dormida dentro |
| `pocion_ian.png` | Poción sospechosa de Ian | Frasco violeta burbujeante con etiqueta de «garantizado» |
| `mapa_dudoso.png` | Mapa dudoso de Ian | Mapa dibujado a mano con garabatos y una calavera sonriente |
| `antidoto_real.png` | Antídoto real | Frasco pequeño transparente con tapón de cera verde |
| `repelente_genuino.png` | Repelente genuino | Atomizador de latón con líquido azul |
| `mapa_secreto_mago.png` | Mapa secreto del Mago | Pergamino morado con runas y una ruta marcada que brilla |
| `fragmentos_lagrima.png` | Fragmentos de la Lágrima | Puñado de cristales multicolor brillantes |
| `antorcha.png` | Antorcha | Antorcha de madera con llama naranja viva |

---

### scenarios/corazon_abismo.png — El Corazón del Abismo
**Escenas:** `acto4_trono`, `acto4_guardianas`, `acto4_distraer`, `acto4_pasaje*`

16-bit pixel art. Corredor orgánico cuyas paredes laten como un corazón gigante, con venas de luz verde. Al fondo, una puerta enorme de cristal vivo que pulsa con luz interna, flanqueada por dos babosas colosales con protuberancias como armadura. En una pared, una grieta estrecha casi invisible. Paleta: verde tóxico, morado oscuro, destellos de cristal.

---

### scenarios/cabana.png — Final: Retiro Pacífico
**Escenas:** `final_retiro`

16-bit pixel art. Cabaña de madera acogedora a las afueras de un pueblo medieval, con un huerto de zanahorias y coles. Nerly (babosa azul brillante) se desliza feliz entre las plantas. Alex con sombrero de paja y una azada. A lo lejos, en la plaza del pueblo, una estatua de Alex con proporciones exageradas. Atardecer cálido y pacífico. Colores suaves, verdes y dorados.

---

### scenarios/narrador_revelado.png — Final Secreto: El Verdadero Narrador
**Escenas:** `final_secreto`

16-bit pixel art. Espacio etéreo y abstracto, entre planos: páginas de guion flotando, humo lila y estrellas. En el centro, una babosa enorme, antigua y majestuosa, con patrones iridiscentes que cambian de color, y la máscara de teatro del Narrador (mitad comedia, mitad tragedia) flotando frente a ella. Solemne, misterioso y un poco burlón. Paleta: lilas, dorados, iridiscencias.

---

### dialogs/ — Acto IV

| Archivo | Personaje / enemigo | Descripción para el prompt |
|---|---|---|
| `babosas_guardianas.png` | Babosas Guardianas | Dos babosas colosales grises con protuberancias como placas de armadura, ojos rojos pequeños, postura de guardia leal |
| `tentaculos_rey.png` | Tentáculos del Rey | Varios tentáculos gelatinosos verdes y morados emergiendo de una masa enorme, goteando baba, con ventosas |
| `alcalde.png` | Alcalde de Viscaria | Político regordete con banda de alcalde, bigote enorme y un papel en la mano para leer tu nombre |

---

### items/ — Objetos del Acto IV (256×256, fondo transparente)

| Archivo | Objeto | Descripción para el prompt |
|---|---|---|
| `cristal_ocultamiento.png` | Cristal de Ocultamiento | Fragmento de cristal azul que emite un halo difuso |
| `daga_rompecristal.png` | Daga rompe-cristal | Daga de hoja translúcida con runas brillantes y empuñadura envuelta en tela encerada |
| `esencia_plateada.png` | Esencia de Babosa Plateada | Frasco con líquido plateado brillante que se mueve solo |

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
