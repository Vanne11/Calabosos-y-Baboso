# Publicar Calabosos y Babosos en tu servidor

El paquete trae dos carpetas que van en el mismo dominio:

| Carpeta | URL | Qué es |
|---|---|---|
| `cyb/` | `https://tudominio/cyb/` | El juego compilado: archivos estáticos (HTML, JS, imágenes WebP, audio) |
| `cyb-api/` | `https://tudominio/cyb-api/` | El servidor de IA en PHP (API + panel admin) |

El juego busca la API en `/cyb-api/` del **mismo dominio**, así que no hace falta configurar CORS. Si usas otra ruta, cambia `ai.endpoint` en `public/games/calabosos/game.json` antes de generar el paquete.

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
