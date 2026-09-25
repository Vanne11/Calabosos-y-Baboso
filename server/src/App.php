<?php

declare(strict_types=1);

namespace Cyb;

use RuntimeException;

/** Contenedor mínimo: configuración y servicios compartidos (creados bajo demanda) */
final class App
{
    /** @var array<string, mixed> */
    private static $config = [];
    /** @var Db|null */
    private static $db = null;
    /** @var Settings|null */
    private static $settings = null;

    public static function boot(): void
    {
        $path = getenv('CYB_CONFIG') ?: dirname(__DIR__) . '/config.php';
        if (!is_file($path)) {
            throw new RuntimeException('Falta config.php (copia config.example.php como config.php).');
        }
        $config = require $path;
        if (!is_array($config)) {
            throw new RuntimeException('config.php debe devolver un array.');
        }
        self::$config = $config;
        date_default_timezone_set('UTC');
    }

    /** @return mixed */
    public static function config(string $key, $default = null)
    {
        $value = self::$config;
        foreach (explode('.', $key) as $part) {
            if (!is_array($value) || !array_key_exists($part, $value)) {
                return $default;
            }
            $value = $value[$part];
        }
        return $value;
    }

    public static function db(): Db
    {
        if (self::$db === null) {
            self::$db = new Db((string) self::config('db_path'));
            self::$db->migrate();
        }
        return self::$db;
    }

    public static function settings(): Settings
    {
        if (self::$settings === null) {
            self::$settings = new Settings(self::db());
        }
        return self::$settings;
    }

    /** Hash anónimo de la IP del cliente (nunca se guarda la IP real) */
    public static function ipHash(): string
    {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        return substr(hash('sha256', (string) self::config('ip_salt', '') . '|' . $ip), 0, 32);
    }
}
