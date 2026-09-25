<?php
// Crea (o cambia la contraseña de) un usuario del panel admin.
// Uso: php bin/create-admin.php <usuario>
// La contraseña se pide por consola sin mostrarla.

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

require __DIR__ . '/../src/bootstrap.php';

use Cyb\AdminAuth;
use Cyb\App;

$username = $argv[1] ?? '';
if (!preg_match('/^[a-zA-Z0-9_.-]{3,40}$/', $username)) {
    fwrite(STDERR, "Uso: php bin/create-admin.php <usuario>  (3-40 caracteres: letras, números, _ . -)\n");
    exit(1);
}

function ask(string $prompt): string
{
    fwrite(STDOUT, $prompt);
    $hidden = DIRECTORY_SEPARATOR === '/' && shell_exec('stty -g 2>/dev/null');
    if ($hidden) {
        shell_exec('stty -echo');
    }
    $value = rtrim((string) fgets(STDIN), "\r\n");
    if ($hidden) {
        shell_exec('stty echo');
        fwrite(STDOUT, "\n");
    }
    return $value;
}

$password = getenv('CYB_ADMIN_PASSWORD') ?: ask('Contraseña (mínimo 12 caracteres): ');
if (strlen($password) < 12) {
    fwrite(STDERR, "La contraseña debe tener al menos 12 caracteres.\n");
    exit(1);
}
if (!getenv('CYB_ADMIN_PASSWORD') && ask('Repite la contraseña: ') !== $password) {
    fwrite(STDERR, "Las contraseñas no coinciden.\n");
    exit(1);
}

AdminAuth::createAdmin(App::db(), $username, $password);
fwrite(STDOUT, "Usuario \"$username\" listo. Entra en /admin/\n");
