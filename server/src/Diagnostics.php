<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Diagnóstico del servidor desde la web (equivalente a bin/selftest.php, para instalaciones por FTP).
 * Cada chequeo devuelve: label, status (ok | warn | fail | info) y detail.
 */
final class Diagnostics
{
    /** @var Db */
    private $db;

    public function __construct(Db $db)
    {
        $this->db = $db;
    }

    /**
     * @param array{label: string, status: string, detail: string}[] $out
     */
    private static function add(array &$out, string $label, string $status, string $detail = ''): void
    {
        $out[] = ['label' => $label, 'status' => $status, 'detail' => $detail];
    }

    /** @return array{label: string, status: string, detail: string}[] */
    public function environment(): array
    {
        $out = [];
        self::add($out, 'PHP ' . PHP_VERSION, PHP_VERSION_ID >= 70400 ? 'ok' : 'fail', PHP_VERSION_ID >= 70400 ? '' : 'Se necesita PHP 7.4 o superior.');
        self::add($out, 'Extensión pdo_sqlite', extension_loaded('pdo_sqlite') ? 'ok' : 'fail', 'Base de datos SQLite.');
        self::add($out, 'Extensión curl', extension_loaded('curl') ? 'ok' : 'fail', extension_loaded('curl') ? 'Para llamar a DeepSeek.' : 'Sin curl no se puede llamar a DeepSeek: pídele al hosting que la active.');
        self::add($out, 'Extensión mbstring', extension_loaded('mbstring') ? 'ok' : 'info', extension_loaded('mbstring') ? '' : 'No está, pero se usa un reemplazo. Funciona igual.');

        $mock = (bool) App::config('deepseek.mock', false);
        $hasKey = (string) App::config('deepseek.api_key', '') !== '';
        if ($mock) {
            self::add($out, 'DeepSeek en modo mock', 'warn', 'Las respuestas son de prueba. Pon mock => false en config.php para usar la IA de verdad.');
        } else {
            self::add($out, 'API key de DeepSeek', $hasKey ? 'ok' : 'fail', $hasKey ? 'Configurada (no se muestra).' : 'Falta deepseek.api_key en config.php.');
        }
        $salt = (string) App::config('ip_salt', '');
        $saltOk = $salt !== '' && $salt !== 'cambia-esto-por-algo-largo-y-aleatorio';
        self::add($out, 'ip_salt personalizada', $saltOk ? 'ok' : 'warn', $saltOk ? '' : 'Cámbiala en config.php por un texto largo y aleatorio.');
        self::add($out, 'HTTPS', AdminAuth::isHttps() ? 'ok' : 'warn', AdminAuth::isHttps() ? '' : 'El sitio no usa HTTPS: las contraseñas y conversaciones viajan sin cifrar. Activa HTTPS en el hosting (Let\'s Encrypt suele ser gratis).');

        $dir = dirname((string) App::config('db_path'));
        self::add($out, 'Carpeta de datos escribible', is_writable($dir) ? 'ok' : 'fail', is_writable($dir) ? '' : "Dale permisos de escritura a $dir (775 desde tu cliente FTP).");
        $version = (int) $this->db->pdo()->query('PRAGMA user_version')->fetchColumn();
        self::add($out, "Base de datos (esquema v$version)", $version >= 1 ? 'ok' : 'fail');
        $sqlite = (string) $this->db->value('SELECT sqlite_version()');
        self::add($out, "SQLite $sqlite", 'info');
        return $out;
    }

    /**
     * Comprueba desde afuera que lo privado no se pueda descargar y que la API responda.
     * @return array{label: string, status: string, detail: string}[]
     */
    public function exposure(string $apiRootUrl): array
    {
        $out = [];
        if (!function_exists('curl_init')) {
            self::add($out, 'Comprobación de exposición', 'warn', 'No se puede comprobar sin la extensión curl. Revisa a mano las URLs de docs/DEPLOY.md.');
            return $out;
        }
        $dbFile = basename((string) App::config('db_path'));
        $checks = [
            ["data/$dbFile", 'La base de datos NO debe poder descargarse', true],
            ['config.php', 'config.php no debe ser accesible', false],
            ['src/App.php', 'La carpeta src/ no debe ser accesible', false],
            ['bin/selftest.php', 'La carpeta bin/ no debe ser accesible', false],
        ];
        foreach ($checks as [$path, $label, $critical]) {
            [$status, $body] = self::fetch($apiRootUrl . $path);
            if ($status === 0) {
                self::add($out, $label, 'warn', "No se pudo comprobar ($apiRootUrl$path): el hosting no deja que el servidor se llame a sí mismo. Pruébalo en el navegador: debe dar 403 o 404.");
            } elseif ($status === 403 || $status === 404) {
                self::add($out, $label, 'ok', "$path → $status");
            } elseif ($critical) {
                self::add($out, $label, 'fail', "¡$path responde $status! Cualquiera podría descargar tus conversaciones y ajustes. Tu hosting no aplica el .htaccess (¿Nginx?): mueve cyb-api fuera de la carpeta pública o bloquea data/ en la configuración del servidor.");
            } else {
                self::add($out, $label, 'warn', "$path responde $status. No expone datos (PHP lo ejecuta sin mostrar nada), pero indica que el .htaccess no se está aplicando.");
            }
        }
        [$status, $body] = self::fetch($apiRootUrl . 'api/config.php');
        $json = json_decode((string) $body, true);
        if ($status === 200 && is_array($json) && array_key_exists('aiEnabled', $json)) {
            self::add($out, 'La API responde (api/config.php)', 'ok', 'El juego podrá conectarse.');
        } elseif ($status === 0) {
            self::add($out, 'La API responde (api/config.php)', 'warn', 'No se pudo comprobar desde el servidor. Ábrela en el navegador: debe mostrar un JSON.');
        } else {
            self::add($out, 'La API responde (api/config.php)', 'fail', "Respondió $status. El juego no podrá usar la IA.");
        }
        return $out;
    }

    /** @return array{0: int, 1: string} [código HTTP (0 si falló), cuerpo] */
    private static function fetch(string $url): array
    {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 6,
            CURLOPT_CONNECTTIMEOUT => 4,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_RANGE => '0-2048', // no bajar la base de datos entera si está expuesta
        ]);
        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if (PHP_VERSION_ID < 80000) {
            curl_close($ch);
        }
        return [$body === false ? 0 : $status, $body === false ? '' : (string) $body];
    }

    /**
     * URL raíz de la API (…/cyb-api/) a partir de la petición actual al admin.
     * Sirve tanto con Alias (…/cyb-api/admin/) como con la carpeta entera en el webroot.
     */
    public static function apiRootUrl(): string
    {
        $scheme = AdminAuth::isHttps() ? 'https' : 'http';
        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');
        $path = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);
        $pos = strpos($path, '/admin');
        $root = $pos === false ? '/' : substr($path, 0, $pos + 1);
        // Con la carpeta entera en el webroot la URL puede incluir /public/: la raíz es la de arriba
        $root = (string) preg_replace('#/public/$#', '/', $root);
        return $scheme . '://' . $host . $root;
    }

    /** @return array{label: string, status: string, detail: string} */
    public static function testDeepSeek(Settings $settings): array
    {
        try {
            $result = DeepSeekClient::fromConfig()->chat(
                (string) $settings->get('model'),
                [
                    ['role' => 'system', 'content' => 'Eres un narrador sarcástico. Responde con una sola frase corta.'],
                    ['role' => 'user', 'content' => 'Saluda al administrador que acaba de instalar el juego.'],
                ],
                1.0,
                60,
                false
            );
            (new Guard(App::db(), $settings))->recordUsage('admin', 'test', 'diagnostico', $result);
            return ['label' => 'DeepSeek respondió', 'status' => 'ok', 'detail' => '«' . trim($result->content) . '» (' . $result->latencyMs . ' ms)'];
        } catch (\Throwable $e) {
            return ['label' => 'DeepSeek no respondió', 'status' => 'fail', 'detail' => $e->getMessage()];
        }
    }
}
