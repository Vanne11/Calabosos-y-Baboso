# Publicar Calabosos y Babosos en tu servidor

El paquete trae dos carpetas que van en el mismo dominio:

| Carpeta | URL | Qué es |
|---|---|---|
| `cyb/` | `https://tudominio/cyb/` | El juego compilado: archivos estáticos (HTML, JS, imágenes WebP, audio) |
| `cyb-api/` | `https://tudominio/cyb-api/` | El servidor de IA en PHP (API + panel admin) |

El juego busca la API en `/cyb-api/` del **mismo dominio**, así que no hace falta configurar CORS. Si usas otra ruta, cambia `ai.endpoint` en `public/games/calabosos/game.json` antes de generar el paquete.

## Subir por FTP (sin consola) — la forma más simple

Si tu hosting solo tiene FTP (lo típico con cPanel), sigue esto. No necesitas SSH.

1. **Genera el paquete** en tu PC: `npm run package -- --sin-demos`. Queda en `release/calabosos-v1.0.0/`.
2. **Crea `config.php`** en tu PC, dentro de `release/calabosos-v1.0.0/cyb-api/`: copia `config.example.php` como `config.php` y completa:
   - `deepseek.api_key`: tu key de DeepSeek.
   - `ip_salt`: un texto largo y aleatorio.
   - `admin.setup_token`: **otro** texto largo y aleatorio (mínimo 16 caracteres). Lo vas a escribir una sola vez para crear tu usuario.
   - `admin.secure_cookie`: `true` si tu sitio usa `https://` (recomendado); `false` si usa `http://`, o no podrás entrar al panel.
   - `db_path` se deja como está.
3. **Sube por FTP** (modo binario o automático) dentro de la carpeta pública del hosting (`public_html/` o `www/`):
   - `release/calabosos-v1.0.0/cyb/` → `public_html/cyb/`
   - `release/calabosos-v1.0.0/cyb-api/` → `public_html/cyb-api/` (**la carpeta entera**, con `config.php`)
4. **Permisos:** en tu cliente FTP, dale permisos de escritura a `public_html/cyb-api/data/` (775; si el panel da error, 777).
5. **Crea tu usuario:** abre `https://tudominio/cyb-api/admin/`. Aparece la pantalla de **Instalación**: escribe el `setup_token`, tu usuario y una contraseña de 12 caracteres o más. El formulario desaparece en cuanto existe un admin.
6. **Revisa el Diagnóstico** (se abre solo después de crear el usuario). Todo debe estar en ✔. Lo más importante:
   - **«La base de datos NO debe poder descargarse»** tiene que estar en ✔. Si sale ✘, tu hosting no aplica el `.htaccess` (pasa con Nginx): pide a soporte que bloquee `cyb-api/data/`, o mueve `cyb-api` fuera de `public_html` y publica solo `cyb-api/public` (opción A de abajo).
   - `pdo_sqlite` y `curl` en ✔ (si faltan, se activan en el panel del hosting, sección de extensiones de PHP).
   - Botón **Probar DeepSeek**: debe responder con una frase sarcástica.
7. **Juega:** `https://tudominio/cyb/` → `run calabosos` → dentro del juego, `/ia` debe decir «Servidor de IA conectado».

Si algo falta (sin `config.php`, sin `pdo_sqlite` o `data/` sin permisos), el panel muestra qué es y cómo arreglarlo, en lugar de una página en blanco.

**Actualizar por FTP:** sube la carpeta `cyb/` nueva encima de la vieja. Del `cyb-api/` nuevo sube todo **menos** `config.php` y la carpeta `data/`, para no pisar tu configuración ni tu base de datos.

---

## Con acceso por consola (SSH)

## 1. Generar el paquete

```bash
npm install
npm run package        # → release/calabosos-v1.0.0.tar.gz
```

El script valida el juego, compila con base `/cyb/`, convierte las imágenes a WebP y copia el servidor **sin** `config.php` ni la base de datos.

## 2. Subir y descomprimir

```bash
scp release/calabosos-v1.0.0.tar.gz usuario@tuservidor:~
ssh usuario@tuservidor
tar -xzf calabosos-v1.0.0.tar.gz
```

- `calabosos-v1.0.0/cyb/` → cópiala al webroot, por ejemplo `/var/www/html/cyb/`.
- `calabosos-v1.0.0/cyb-api/` → mira el paso 3.

## 3. Instalar la API

Hay dos opciones. La **A** es la recomendada.

### Opción A — Solo `public/` visible (recomendada)

Deja `cyb-api/` **fuera** del webroot (por ejemplo `/var/www/cyb-api/`) y publica solo su carpeta `public/`.

**Apache** (en el VirtualHost):
```apache
Alias /cyb-api /var/www/cyb-api/public
<Directory /var/www/cyb-api/public>
    Require all granted
</Directory>
```

**Nginx** (con PHP-FPM; ajusta el socket a tu versión de PHP):
```nginx
location /cyb-api/ {
    alias /var/www/cyb-api/public/;
    index index.php;
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;
    }
}
```

### Opción B — Toda la carpeta en el webroot (hosting sin acceso a la configuración)

Sube `cyb-api/` completa a `/var/www/html/cyb-api/`. Su `.htaccess` bloquea `src/`, `data/`, `bin/` y `config.php`, y redirige `/cyb-api/api/...` y `/cyb-api/admin/...` a `public/`.

Requisitos: Apache con `mod_rewrite` y `AllowOverride All` para esa carpeta.

> ⚠️ **Verifica esto al instalar** (estas reglas no se pudieron probar con un Apache real durante el desarrollo):
> - `https://tudominio/cyb-api/config.php` → debe dar **403**.
> - `https://tudominio/cyb-api/src/App.php` → **403**.
> - `https://tudominio/cyb-api/api/config.php` → debe devolver un **JSON** (`{"aiEnabled": ...}`).
> - `https://tudominio/cyb-api/admin/` → debe mostrar el **login**.

## 4. Configurar la API

```bash
cd /var/www/cyb-api          # (o donde la hayas puesto)
cp config.example.php config.php
nano config.php
```

- `deepseek.api_key`: tu key de DeepSeek. **Solo aquí**, nunca en el repo.
- `ip_salt`: cualquier texto largo y aleatorio.
- `allowed_origins`: déjalo **vacío** (juego y API en el mismo dominio).
- `admin.secure_cookie`: `true` si usas HTTPS (recomendado).

Permisos: el usuario de PHP (normalmente `www-data`) debe poder escribir en `data/`:
```bash
sudo chown -R www-data:www-data data
sudo chmod 750 data
```

## 5. Usuario admin y diagnóstico

```bash
php bin/create-admin.php tu_usuario      # pide la contraseña (mínimo 12 caracteres)
php bin/selftest.php --live              # revisa todo y hace una llamada real a DeepSeek
```

Todo debe salir con ✔. Si `selftest` falla en `curl` o `pdo_sqlite`, instálalos: en Debian/Ubuntu, `sudo apt install php7.4-curl php7.4-sqlite3`; luego reinicia PHP-FPM o Apache.

## 6. Comprobar que todo funciona

1. Abre `https://tudominio/cyb/`, inicia sesión en la terminal y escribe `run calabosos`.
2. Dentro del juego, escribe `/ia` → debe decir **«Servidor de IA conectado»**.
3. Juega hasta el guardia de la entrada del Abismo o la tienda del Tendero y conversa con la IA.
4. Entra a `https://tudominio/cyb-api/admin/`:
   - **Panel**: deberías ver las peticiones y tokens de hoy.
   - **Conversaciones**: la transcripción de tu chat.
   - **Analítica**: tu partida en el embudo (los eventos se envían cada 15 segundos).

## Actualizar a una versión nueva

```bash
# Respaldo primero (la base de datos tiene prompts, ajustes, conversaciones y analítica)
cp /var/www/cyb-api/data/cyb.sqlite ~/cyb-backup-$(date +%F).sqlite

# Reemplazar el juego
rm -rf /var/www/html/cyb && cp -r calabosos-vX/cyb /var/www/html/cyb

# Reemplazar el código de la API, conservando config.php y data/
rsync -a --exclude config.php --exclude 'data/*' calabosos-vX/cyb-api/ /var/www/cyb-api/
```

Las migraciones de la base de datos se aplican solas en la primera petición.

## Apagar la IA sin tocar nada

En el panel admin, **Panel → Apagar IA**. El juego sigue funcionando al instante con los textos fijos y los dados. Sirve si se acaba el presupuesto o si algo falla con DeepSeek.
