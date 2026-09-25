<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Escribe config.php desde el instalador y los Ajustes del admin (para hostings solo con FTP).
 * Conserva los valores actuales y aplica solo los cambios pedidos.
 */
final class ConfigWriter
{
    public static function canWrite(): bool
    {
        $path = App::configPath();
        return is_file($path) ? is_writable($path) : is_writable(dirname($path));
    }

    /**
     * Configuración resultante: la actual + cambios + valores que conviene completar.
     * @param array<string, mixed> $changes  claves con punto: ['deepseek.api_key' => '...']; null = quitar la clave
     * @return array<string, mixed>
     */
    public static function merged(array $changes): array
    {
        $config = App::allConfig();
        foreach ($changes as $key => $value) {
            $parts = explode('.', $key);
            $last = array_pop($parts);
            $ref =& $config;
            foreach ($parts as $part) {
                if (!isset($ref[$part]) || !is_array($ref[$part])) {
                    $ref[$part] = $ref[$part] ?? [];
                }
                $ref =& $ref[$part];
            }
            if ($value === null) {
                unset($ref[$last]);
            } else {
                $ref[$last] = $value;
            }
            unset($ref);
        }
        // Sal para anonimizar IPs: si falta o es la del ejemplo, se genera una aleatoria
        $salt = (string) ($config['ip_salt'] ?? '');
        if ($salt === '' || $salt === 'cambia-esto-por-algo-largo-y-aleatorio') {
            $config['ip_salt'] = bin2hex(random_bytes(24));
        }
        return $config;
    }

    /** Contenido PHP de config.php */
    public static function render(array $config): string
    {
        $defaultDb = dirname(__DIR__) . '/data/cyb.sqlite';
        $dbPath = (string) ($config['db_path'] ?? $defaultDb);
        $dbCode = $dbPath === $defaultDb ? "__DIR__ . '/data/cyb.sqlite'" : var_export($dbPath, true);
        unset($config['db_path']);

        $body = var_export($config, true);
        // var_export usa "array (": se deja con sintaxis corta y sangría de 4 espacios
        $body = preg_replace(['/array \(/', '/\)(,?)$/m', "/=> \n\s+\[/"], ['[', ']$1', '=> ['], $body);
        $body = (string) preg_replace('/^  /m', '    ', (string) $body);
        $body = substr((string) $body, 0, -1); // quitar "]" final para insertar db_path al comienzo
        $body = "[\n    'db_path' => $dbCode," . substr($body, 1) . ']';

        return "<?php\n// Configuración del servidor de IA de Calabosos y Babosos.\n"
            . '// Generada por el panel admin el ' . gmdate('Y-m-d H:i') . " UTC. Se puede editar a mano.\n"
            . "// NUNCA subas este archivo a un repositorio: contiene tu API key.\n\n"
            . 'return ' . $body . ";\n";
    }

    /** Escribe config.php de forma atómica. Devuelve false si el hosting no lo permite. */
    public static function write(array $config): bool
    {
        $path = App::configPath();
        if (!self::canWrite()) {
            return false;
        }
        $tmp = $path . '.tmp-' . bin2hex(random_bytes(4));
        if (@file_put_contents($tmp, self::render($config)) === false) {
            return false;
        }
        @chmod($tmp, 0640);
        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            return false;
        }
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate($path, true);
        }
        return true;
    }
}
