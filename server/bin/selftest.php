<?php
// Diagnóstico del servidor: extensiones, base de datos, prompts y (opcional) una llamada real a DeepSeek.
// Uso:
//   php bin/selftest.php          → revisa todo sin gastar tokens
//   php bin/selftest.php --live   → además hace una llamada real a DeepSeek

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit;
}

$live = in_array('--live', $argv, true);
$fails = 0;

function check(bool $ok, string $label, string $hint = ''): void
{
    global $fails;
    fwrite(STDOUT, ($ok ? '  ✔ ' : '  ✘ ') . $label . (!$ok && $hint !== '' ? "\n      → $hint" : '') . "\n");
    if (!$ok) {
        $fails++;
    }
}

fwrite(STDOUT, "Calabosos · diagnóstico del servidor\n\n");
check(PHP_VERSION_ID >= 70400, 'PHP ' . PHP_VERSION . ' (mínimo 7.4)');
check(extension_loaded('pdo_sqlite'), 'Extensión pdo_sqlite', 'Actívala en php.ini (extension=pdo_sqlite)');
check(extension_loaded('curl'), 'Extensión curl (para llamar a DeepSeek)', 'Actívala en php.ini (extension=curl)');
check(extension_loaded('json'), 'Extensión json');
fwrite(STDOUT, '  · mbstring: ' . (extension_loaded('mbstring') ? 'sí' : 'no (se usa un reemplazo, funciona igual)') . "\n");

try {
    require __DIR__ . '/../src/bootstrap.php';
} catch (\Throwable $e) {
    check(false, 'config.php', $e->getMessage());
    exit(1);
}

use Cyb\App;
use Cyb\PromptRepository;

check(App::hasConfigFile(), 'config.php cargado', 'No existe: instala desde /cyb/api/admin/ o copia config.example.php como config.php');
$mock = (bool) App::config('deepseek.mock', false);
$hasKey = (string) App::config('deepseek.api_key', '') !== '';
check($mock || $hasKey, $mock ? 'DeepSeek en modo mock (sin llamadas reales)' : 'API key de DeepSeek configurada', 'Completa deepseek.api_key en config.php');
check(App::config('ip_salt', '') !== 'cambia-esto-por-algo-largo-y-aleatorio', 'ip_salt personalizada', 'Cambia ip_salt en config.php por un texto largo y aleatorio');

try {
    $db = App::db();
    check(true, 'Base de datos SQLite (' . App::config('db_path') . ')');
    $version = (int) $db->pdo()->query('PRAGMA user_version')->fetchColumn();
    check($version >= 1, "Esquema de base de datos (versión $version)");
    $count = count((new PromptRepository($db))->list());
    check($count > 0, "Prompts cargados ($count)");
    $admins = (int) $db->value('SELECT COUNT(*) FROM admins');
    check($admins > 0, "Usuarios admin ($admins)", 'Crea uno: php bin/create-admin.php <usuario>');
    $dir = dirname((string) App::config('db_path'));
    check(is_writable($dir), "Carpeta de datos escribible ($dir)", 'Dale permisos de escritura al usuario de PHP');
} catch (\Throwable $e) {
    check(false, 'Base de datos', $e->getMessage());
}

if ($live) {
    fwrite(STDOUT, "\nLlamada real a DeepSeek...\n");
    try {
        $result = \Cyb\DeepSeekClient::fromConfig()->chat(
            (string) App::settings()->get('model'),
            [
                ['role' => 'system', 'content' => 'Eres un narrador sarcástico. Responde con una sola frase corta.'],
                ['role' => 'user', 'content' => 'Saluda al héroe que acaba de llegar.'],
            ],
            1.0,
            60,
            false
        );
        check(true, 'DeepSeek respondió en ' . $result->latencyMs . ' ms: "' . trim($result->content) . '"');
    } catch (\Throwable $e) {
        check(false, 'DeepSeek', $e->getMessage());
    }
}

fwrite(STDOUT, "\n" . ($fails === 0 ? "Todo OK.\n" : "$fails problema(s).\n"));
exit($fails === 0 ? 0 : 1);
