<?php
// Punto de entrada común: autoload, configuración y base de datos.
// Compatible con PHP 7.4 y 8.x.

declare(strict_types=1);

if (PHP_VERSION_ID < 70400) {
    http_response_code(500);
    exit('Se requiere PHP 7.4 o superior.');
}

require_once __DIR__ . '/polyfills.php';
require_once __DIR__ . '/helpers.php';

spl_autoload_register(static function (string $class): void {
    $prefix = 'Cyb\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $file = __DIR__ . '/' . str_replace('\\', '/', substr($class, strlen($prefix))) . '.php';
    if (is_file($file)) {
        require_once $file;
    }
});

\Cyb\App::boot();
