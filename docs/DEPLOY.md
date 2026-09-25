# Publicar Calabosos y Babosos en tu servidor

Todo va en **una sola carpeta**, `cyb/`:

```
public_html/
└── cyb/                 ← el juego         → https://tudominio/cyb/
    ├── index.html, assets/, games/ ...
    └── api/             ← la IA (PHP)       → https://tudominio/cyb/api/   (admin: /cyb/api/admin/)
        ├── config.php   ← lo crea el instalador web (key de DeepSeek). NUNCA viene en el paquete
        └── data/        ← base de datos: prompts, conversaciones, analítica. NUNCA viene en el paquete
```

El juego encuentra la IA solo, en `api/` dentro de su propia carpeta. Si la IA no responde, el juego sigue funcionando con textos fijos y dados.

> **Regla de oro para actualizar:** sube la carpeta `cyb/` nueva **encima** de la vieja. **Nunca borres `cyb/`** en el servidor: ahí adentro están tu `config.php` y tu base de datos. El paquete jamás trae esos archivos, así que subir encima no pisa nada.

---

## Subir por FTP (sin consola)

Si tu hosting solo tiene FTP (lo típico con cPanel), sigue estos pasos. No necesitas SSH.

1. **Genera el paquete** en tu PC:
   ```bash
   npm run package -- --sin-demos        # solo Calabosos (sin las demos del motor)
   ```
   Queda en `release/calabosos-v1.0.0/cyb/`.

2. **Sube por FTP** la carpeta `release/calabosos-v1.0.0/cyb/` completa a la carpeta pública del hosting (`public_html/` o `www/`). Usa modo binario o automático. **No hace falta crear ni editar ningún archivo.**

3. **Permisos:** en tu cliente FTP, dale permisos de escritura (775; si da error, 777) a:
   - `public_html/cyb/api/data/` (la base de datos).
   - `public_html/cyb/api/` (para que el instalador cree `config.php`). Si prefieres no hacerlo, el instalador te muestra el contenido para que lo subas tú.

4. **Instala:** abre `https://tudominio/cyb/api/admin/`. Aparece **Instalación**, un solo formulario:
   - usuario y contraseña (12 caracteres o más) para el panel;
   - key de DeepSeek (opcional; también se pone después en **Ajustes → Conexión con DeepSeek**).

   Pulsa **Instalar**. Se crea `config.php` solo (con una sal aleatoria para anonimizar IPs) y entras al panel. La pantalla de instalación no vuelve a aparecer.

   > Instala apenas termines de subir: mientras no exista tu usuario, cualquiera que abra esa URL podría crearlo.

5. **Revisa el Diagnóstico** (se abre solo al instalar). Todo debe salir en ✔. Lo más importante:
   - **«La base de datos NO debe poder descargarse»** en ✔. Si sale ✘, tu hosting no aplica el `.htaccess` (pasa con Nginx): pide a soporte que bloquee la carpeta `cyb/api/data/`.
   - `pdo_sqlite` y `curl` en ✔. Si faltan, se activan en el panel del hosting, en la sección de extensiones de PHP.
   - Botón **Probar DeepSeek**: debe responder con una frase sarcástica.

6. **Cambiar la key después:** **Ajustes → Conexión con DeepSeek**. Ahí también está el **modo prueba** (respuestas falsas, sin gastar saldo).

7. **Juega:** abre `https://tudominio/cyb/`, escribe `run calabosos` y, dentro del juego, `/ia`. Debe decir «Servidor de IA conectado».

Si falta algo (`pdo_sqlite` o permisos en `data/`), el panel muestra qué es y cómo arreglarlo, en lugar de una página en blanco.

### Actualizar por FTP

1. Genera el paquete nuevo (`npm run package -- --sin-demos`).
2. Sube `release/calabosos-vX/cyb/` **encima** de `public_html/cyb/` y acepta reemplazar archivos.
3. Listo. Tu `config.php` y tu `data/` quedan intactos, porque el paquete no los trae. Las migraciones de la base de datos se aplican solas.

Respaldo recomendado antes de actualizar: descarga `public_html/cyb/api/data/cyb.sqlite` a tu PC.

---

## Con acceso por consola (SSH)

Igual que por FTP, pero puedes:

```bash
# subir y descomprimir
scp release/calabosos-v1.0.0.tar.gz usuario@tuservidor:~
ssh usuario@tuservidor
tar -xzf calabosos-v1.0.0.tar.gz
cp -r calabosos-v1.0.0/cyb /var/www/html/          # primera vez

# permisos (después, instala desde https://tudominio/cyb/api/admin/)
cd /var/www/html/cyb/api
sudo chown -R www-data:www-data data . && sudo chmod 750 data

# o todo por consola: config.php a mano + usuario + diagnóstico
cp config.example.php config.php && nano config.php
php bin/create-admin.php tu_usuario
php bin/selftest.php --live
```

Para actualizar por consola (sin tocar `config.php` ni `data/`):
```bash
cp /var/www/html/cyb/api/data/cyb.sqlite ~/cyb-backup-$(date +%F).sqlite
rsync -a --exclude api/config.php --exclude 'api/data/*' calabosos-vX/cyb/ /var/www/html/cyb/
```

## Servidores sin `.htaccess` (Nginx)

Con Nginx el `.htaccess` no se aplica: hay que bloquear lo privado en la configuración del sitio y dirigir `/cyb/api/` a `public/`:

```nginx
location ^~ /cyb/api/ {
    alias /var/www/html/cyb/api/public/;
    index index.php;
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_param SCRIPT_FILENAME $request_filename;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;   # ajusta a tu versión de PHP
    }
}
```

Con este bloque solo queda visible `cyb/api/public/`. `src/`, `data/`, `bin/` y `config.php` no se pueden pedir desde internet. Verifícalo en **Diagnóstico**.

## Qué revisar si algo falla

| Síntoma | Causa probable |
|---|---|
| `/cyb/api/admin/` muestra «Falta un paso» | Lo que dice la pantalla: `pdo_sqlite`, permisos de `data/` o un `config.php` con errores (bórralo y el instalador lo crea de nuevo) |
| «El hosting no deja que el panel guarde config.php» | Da permisos de escritura a `cyb/api/`, o sube el `config.php` que muestra la pantalla |
| El juego dice «No hay conexión con el servidor de IA» (`/ia`) | Abre `https://tudominio/cyb/api/api/config.php`: debe mostrar un JSON. Si da 404, el `.htaccess` no se aplica (Nginx: ver arriba) |
| La IA responde «[mock] …» | **Ajustes → Modo prueba** está marcado |
| Error de DeepSeek en Diagnóstico | Key incorrecta, sin saldo o falta la extensión `curl` |

## Apagar la IA sin tocar nada

En el panel admin, **Panel → Apagar IA**. El juego sigue funcionando al instante con los textos fijos y los dados.
