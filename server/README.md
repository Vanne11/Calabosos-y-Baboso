# Servidor de IA — Calabosos y Babosos

Backend PHP que conecta el juego con DeepSeek. Hace cuatro cosas:
- narración con IA,
- modos chat (persuadir, negociar, canción, rap, insultos, confesión),
- registro de eventos para la analítica,
- un **panel admin** para editar los prompts sin tocar código.

Requisitos y garantías:
- **PHP 7.4 u 8.x** con `pdo_sqlite` y `curl`. `mbstring` es opcional.
- **SQLite**: un solo archivo, que se crea automáticamente.
- La API key de DeepSeek está **solo en `config.php`** y nunca llega al navegador.

## Estructura

```
server/
├── config.example.php   → copiar como config.php (NO se sube al repo)
├── public/              → lo único que debe ser accesible por web
│   ├── api/             config.php · narrate.php · chat.php · events.php
│   └── admin/           panel (index.php + admin.css)
├── src/                 código (privado)
├── bin/                 create-admin.php · selftest.php (solo consola)
└── data/                base de datos SQLite (privado, escribible por PHP)
```

## Instalación en el servidor

1. **Sube la carpeta `server/`.** Lo ideal es dejarla **fuera del webroot** y publicar solo `server/public/` en una ruta como `https://tudominio/cyb-api/`:
   - Apache: `Alias /cyb-api /ruta/a/server/public`, o un enlace simbólico `ln -s /ruta/a/server/public /var/www/html/cyb-api`.
   - Si solo puedes subir dentro del webroot, sube la carpeta completa. Con Apache, los `.htaccess` de la raíz, `src/`, `data/` y `bin/` bloquean lo privado. Con **Nginx**, agrega:
     ```nginx
     location ~ ^/cyb-api/(src|data|bin)/ { deny all; }
     location ~ ^/cyb-api/(config|config\.example)\.php$ { deny all; }
     location ~ \.sqlite { deny all; }
     ```
2. **Configura:**
   ```bash
   cd server
   cp config.example.php config.php
   nano config.php        # API key de DeepSeek, ip_salt aleatoria, allowed_origins
   ```
   - Si el juego y la API están en el **mismo dominio**, deja `allowed_origins` vacío.
   - Pon `secure_cookie => true` si el admin va por HTTPS (recomendado).
3. **Permisos:** el usuario de PHP debe poder escribir en `data/` (`chown www-data data` o similar).
4. **Crea el usuario admin.** Con consola, así (la contraseña se pide sin mostrarla y debe tener al menos 12 caracteres). **Sin consola (solo FTP):** pon un `setup_token` en `config.php` y entra a `/cyb-api/admin/`: aparece un formulario de instalación. Ver `docs/DEPLOY.md`, «Subir por FTP».
   ```bash
   php bin/create-admin.php tu_usuario
   ```
5. **Corre el diagnóstico:**
   ```bash
   php bin/selftest.php          # extensiones, base de datos, prompts, permisos
   php bin/selftest.php --live   # además hace una llamada real a DeepSeek
   ```
6. Entra a `https://tudominio/cyb-api/admin/`.

## Panel admin

| Página | Qué hace |
|---|---|
| **Panel** | Uso de hoy (peticiones, tokens, errores, jugadores), últimos 14 días e **interruptor general de IA** |
| **Prompts** | Edita cada prompt. Cada guardado crea una **versión nueva** y puedes volver a cualquier versión anterior. Botón **Probar** con variables de ejemplo |
| **Ajustes** | Modelo; activar o desactivar la narración, los eventos y cada modo chat; límites y presupuesto |
| **Conversaciones** | Transcripciones de los modos chat, con puntaje y resultado |
| **Analítica** | Embudo por actos, dónde mueren y abandonan, finales, duración real, modos chat, dados y decisiones; borrado de eventos viejos |
| **Registro** | Cada llamada a la IA: tokens, latencia y errores |
| **Diagnóstico** | Extensiones de PHP, permisos, configuración, **si lo privado se puede descargar desde internet** y botón para probar DeepSeek (el equivalente web de `bin/selftest.php`) |

### Prompts

- `narrador.base`: la **hoja del narrador** (voz y reglas). Se antepone a todos los demás prompts.
- `narrate.*`: líneas sueltas (`muerte`, `reaccion`, `recap`).
- `chat.*`: un prompt por modo chat.
- El juego manda variables con la forma `{{nombre}}`. En los modos chat también existen `{{turn}}`, `{{max_turns}}`, `{{score}}` y `{{npc}}`.
- El formato JSON de respuesta de los modos chat lo agrega el servidor y **no se puede editar**, para que el juego siempre pueda leerlo.

## API

Todas las respuestas son JSON. Los errores tienen la forma `{ "error": "codigo", "message": "..." }`. Ante cualquier error, el juego debe usar su texto fijo o el dado.

| Endpoint | Pedido | Respuesta |
|---|---|---|
| `GET api/config.php` | — | `{ aiEnabled, narrate, modes: {persuadir: true, ...}, events, maxInputChars }` |
| `POST api/narrate.php` | `{ sessionId, game, prompt: "muerte", vars }` | `{ text }` |
| `POST api/chat.php` | `{ action: "start", sessionId, game, mode, npc, vars, maxTurns? }` | `{ chatId, maxTurns, turnsLeft, score, maxInputChars }` |
| | `{ action: "say", sessionId, chatId, message }` | `{ reply, score, done, verdict, turn, turnsLeft }` |
| | `{ action: "giveup", sessionId, chatId }` | `{ done, verdict, score }` |
| `POST api/events.php` | `{ sessionId, game, events: [{ type, scene?, data?, t? }] }` | `{ stored }` |

- `sessionId`: UUID anónimo que genera el juego (16 a 64 caracteres `[a-zA-Z0-9-]`).
- `verdict`: `success`, `partial`, `failure` o `null` (modos sin veredicto, o conversación en curso).
- Códigos HTTP:

  | Código | Significado |
  |---|---|
  | `400` | Pedido inválido |
  | `404` | Prompt o conversación desconocida |
  | `409` | Conversación terminada |
  | `429` | Límite por minuto o presupuesto agotado |
  | `502` | La IA no respondió |
  | `503` | IA o modo desactivado |

## Seguridad

- **API key**: solo en `config.php`. El cliente nunca manda prompts de sistema; solo el nombre del prompt y variables, con cantidad y largo limitados.
- **Modos chat**:
  - El historial vive en el servidor, así que el jugador no puede inventar respuestas previas del NPC.
  - El texto del jugador va siempre como mensaje de usuario.
  - El puntaje no puede cambiar más de `max_step` por turno.
  - El veredicto lo calcula el servidor.
- **Límites**: peticiones por minuto por IP, tokens por jugador por día y presupuesto global diario.
- **Privacidad**: las IPs se guardan solo como hash con sal (`ip_salt`).
- **Admin**:
  - Contraseñas con bcrypt.
  - Bloqueo de 15 minutos tras 5 intentos fallidos.
  - CSRF en todos los formularios.
  - Cookie `HttpOnly` y `SameSite=Strict`.
  - Cierre de sesión tras 2 horas de inactividad.
  - CSP estricta.

## Desarrollo local

```bash
cd server
cp config.example.php config.php      # pon 'mock' => true para no gastar tokens
php bin/create-admin.php admin
php -S 127.0.0.1:8099 -t public
# Juego en Vite: agrega 'http://127.0.0.1:5173' a allowed_origins
```
