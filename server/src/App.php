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

    /** @var bool */
    private static $hasConfigFile = false;

    /**
     * Carga config.php. Si todavía no existe (recién subido por FTP), arranca con valores
     * por defecto: el instalador web del admin lo crea después.
     */
    public static function boot(): void
    {
        date_default_timezone_set('UTC');
        $path = self::configPath();
        self::$hasConfigFile = is_file($path);
        if (!self::$hasConfigFile) {
            self::$config = self::defaults();
            return;
        }
        $config = require $path;
        if (!is_array($config)) {
            throw new RuntimeException('config.php debe devolver un array.');
        }
        self::$config = array_replace_recursive(self::defaults(), $config);
    }

    public static function configPath(): string
    {
        return getenv('CYB_CONFIG') ?: dirname(__DIR__) . '/config.php';
    }

    public static function hasConfigFile(): bool
    {
        return self::$hasConfigFile;
    }

    /** Configuración completa (para que el instalador la reescriba) */
    public static function allConfig(): array
    {
        return self::$config;
    }

    /** Valores por defecto: permiten funcionar sin config.php (la IA queda sin key hasta configurarla) */
    public static function defaults(): array
    {
        return [
            'db_path' => dirname(__DIR__) . '/data/cyb.sqlite',
            'deepseek' => ['api_key' => '', 'base_url' => 'https://api.deepseek.com', 'timeout' => 20, 'mock' => false],
            'allowed_origins' => [],
            'ip_salt' => '',
            'admin' => ['setup_token' => ''],
        ];
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
