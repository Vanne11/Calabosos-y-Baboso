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

## YA EXISTEN (copiadas de la demo)

**Escenarios:** `intro`, `plaza`, `establos`, `casa_empenos`, `mercado`, `tienda`, `tienda_2`, `callejon`, `entrada_abismo`, `sala_entrada`, `grutas_cristal`, `final`

**Retratos:** `narrator`, `protagonist_male`, `protagonist_female`, `protagonist_andro`, `nerly`, `tendero`, `noble`, `dueno_establos`, `prestamista`, `anciano`, `system`

**Items:** `bolsa_monedas`, `espada_oxidada`, `relicario_familiar`, `relicario_familiar_2`, `sal_anti_babosas`, `zurron_espacioso`

---

## PRÓXIMAS (se agregan a medida que se escriben los actos)

Se sumarán fichas a este documento en cada fase. Ya están previstas:
- **Escenarios:** taberna, fogata del camino, Cavernas de Cría, Abismo Profundo, túnel sigiloso, Corazón del Abismo, pasaje secreto, finales (retiro pacífico, nuevas aventuras, el verdadero narrador).
- **Retratos:** las 5 especies de babosa (ácida, saltarina, gemelas, fantasma, explosiva), bandidos, Takashi Komuro.
- **Items:** bolso de escroto de elefante, pociones, "algo para el pis", huevo de babosa, Lágrima de Cristal.
