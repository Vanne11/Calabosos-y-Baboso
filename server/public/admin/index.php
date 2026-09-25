<?php
// Panel admin: prompts, ajustes, uso y conversaciones.

declare(strict_types=1);

/**
 * Errores de instalación con explicación (en vez de una página 500 en blanco).
 * No muestra detalles internos: solo qué falta y cómo arreglarlo.
 */
function installError(string $title, string $help): void
{
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    $t = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    echo "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">"
        . "<meta name=\"robots\" content=\"noindex\"><title>Instalación · Calabosos</title><link rel=\"stylesheet\" href=\"admin.css\"></head>"
        . "<body><main><section class=\"login card\"><h1>🐌 Falta un paso</h1><p class=\"error\">$t</p><p>$help</p>"
        . "<p class=\"muted small\">Guía completa: docs/DEPLOY.md, sección «Subir por FTP».</p></section></main></body></html>";
    exit;
}

try {
    require __DIR__ . '/../../src/bootstrap.php';
} catch (\Throwable $e) {
    installError(
        'config.php tiene un error.',
        'Borra <code>cyb/api/config.php</code> por FTP y vuelve a abrir esta página: el instalador lo crea de nuevo.'
    );
}

use Cyb\AdminAuth;
use Cyb\Analytics;
use Cyb\AiException;
use Cyb\AiLines;
use Cyb\App;
use Cyb\ChatService;
use Cyb\ConfigWriter;
use Cyb\DeepSeekClient;
use Cyb\Diagnostics;
use Cyb\FreeActionService;
use Cyb\Guard;
use Cyb\NarrateService;
use Cyb\PromptRenderer;
use Cyb\PromptRepository;
use Cyb\Settings;
use Cyb\View;

header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header("Content-Security-Policy: default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'");

if (!in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
    installError('El hosting no tiene la extensión pdo_sqlite de PHP.', 'Actívala en el panel del hosting (sección de extensiones de PHP) o pídeselo a soporte.');
}
try {
    $db = App::db();
} catch (\Throwable $e) {
    installError(
        'No se pudo crear o abrir la base de datos.',
        'Dale permisos de escritura a la carpeta <code>cyb/api/data/</code> (775, o 777 si tu hosting lo exige) desde tu cliente FTP.'
    );
}
$auth = new AdminAuth($db);
$auth->startSession();

$page = (string) ($_GET['p'] ?? 'dashboard');
$isPost = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';
$needsSetup = $auth->adminCount() === 0;

/** Redirigir con un mensaje flash */
function redirect(string $page, array $query = [], string $flash = ''): void
{
    if ($flash !== '') {
        $_SESSION['flash'] = $flash;
    }
    header('Location: ' . View::url($page, $query));
    exit;
}

function takeFlash(): string
{
    $flash = (string) ($_SESSION['flash'] ?? '');
    unset($_SESSION['flash']);
    return $flash;
}

// --- Primer usuario (instalación por FTP, sin consola) ---
if ($needsSetup && $page !== 'setup') {
    redirect('setup');
}
if ($page === 'setup') {
    if (!$needsSetup) {
        redirect('login');
    }
    $error = '';
    if ($isPost) {
        $username = trim((string) ($_POST['username'] ?? ''));
        $password = (string) ($_POST['password'] ?? '');
        $apiKey = trim((string) ($_POST['api_key'] ?? ''));
        if (!$auth->checkCsrf($_POST['csrf'] ?? null)) {
            $error = 'La sesión expiró. Intenta de nuevo.';
        } elseif (!preg_match('/^[a-zA-Z0-9_.-]{3,40}$/', $username)) {
            $error = 'El usuario debe tener entre 3 y 40 caracteres: letras, números, _ . -';
        } elseif (strlen($password) < 12) {
            $error = 'La contraseña debe tener al menos 12 caracteres.';
        } elseif ($password !== (string) ($_POST['password2'] ?? '')) {
            $error = 'Las contraseñas no coinciden.';
        } elseif ($apiKey !== '' && !preg_match('/^[\x21-\x7e]{10,200}$/', $apiKey)) {
            $error = 'La key de DeepSeek no parece válida (sin espacios; empieza con sk-).';
        } else {
            // config.php: se conserva lo que ya hubiera y se completa lo que falta
            $changes = [
                'admin.setup_token' => null,   // ya no se usa
                'admin.secure_cookie' => null, // automático: segura si el sitio usa HTTPS
            ];
            if ($apiKey !== '') {
                $changes['deepseek.api_key'] = $apiKey;
                $changes['deepseek.mock'] = false;
            }
            $config = ConfigWriter::merged($changes);
            $written = ConfigWriter::write($config);
            AdminAuth::createAdmin($db, $username, $password);
            $auth->login($username, $password);
            if ($written) {
                redirect('diagnostics', [], '¡Instalado! Revisa que todo esté en verde y prueba DeepSeek.');
            }
            View::render('config_manual', [
                'user' => $username, 'csrf' => $auth->csrfToken(), 'flash' => '', 'ctx' => 'setup',
                'content' => ConfigWriter::render($config),
            ]);
            exit;
        }
    }
    View::render('setup', [
        'error' => $error, 'csrf' => $auth->csrfToken(), 'user' => null,
        'cookieWillFail' => AdminAuth::cookieWillFail(),
        'username' => (string) ($_POST['username'] ?? ''),
        'hasKey' => (string) App::config('deepseek.api_key', '') !== '',
    ]);
    exit;
}

// --- Login / logout ---
if ($page === 'login') {
    $error = '';
    if ($isPost) {
        if (!$auth->checkCsrf($_POST['csrf'] ?? null)) {
            $error = 'La sesión expiró. Intenta de nuevo.';
        } elseif ($auth->isLocked()) {
            $error = 'Demasiados intentos. Espera 15 minutos.';
        } elseif ($auth->login((string) ($_POST['username'] ?? ''), (string) ($_POST['password'] ?? ''))) {
            redirect('dashboard');
        } else {
            $error = 'Usuario o contraseña incorrectos.';
        }
    }
    View::render('login', ['error' => $error, 'csrf' => $auth->csrfToken(), 'user' => null, 'cookieWillFail' => AdminAuth::cookieWillFail()]);
    exit;
}

if ($auth->user() === null) {
    redirect('login');
}

if ($isPost && !$auth->checkCsrf($_POST['csrf'] ?? null)) {
    http_response_code(400);
    exit('Token CSRF inválido. Vuelve atrás y recarga la página.');
}

if ($page === 'logout' && $isPost) {
    $auth->logout();
    redirect('login');
}

$settings = App::settings();
$prompts = new PromptRepository($db);
$user = (string) $auth->user();
$common = ['user' => $user, 'csrf' => $auth->csrfToken(), 'flash' => takeFlash(), 'page' => $page];

// --- Interruptor general de IA (desde el dashboard) ---
if ($page === 'toggle_ai' && $isPost) {
    $settings->set('ai_enabled', !$settings->get('ai_enabled'));
    redirect('dashboard', [], $settings->get('ai_enabled') ? 'IA activada.' : 'IA APAGADA: el juego usará los textos fijos.');
}

// --- Dashboard ---
if ($page === 'dashboard') {
    $today = gmdate('Y-m-d');
    View::render('dashboard', $common + [
        'aiEnabled' => (bool) $settings->get('ai_enabled'),
        'mock' => (bool) App::config('deepseek.mock', false),
        'hasKey' => (string) App::config('deepseek.api_key', '') !== '',
        'today' => $db->one('SELECT * FROM usage_daily WHERE day = ?', [$today]) ?? [],
        'days' => $db->all('SELECT * FROM usage_daily ORDER BY day DESC LIMIT 14'),
        'limits' => $settings->get('limits'),
        'sessionsToday' => (int) $db->value('SELECT COUNT(*) FROM sessions WHERE last_seen_at >= ?', [$today]),
        'chatsToday' => (int) $db->value('SELECT COUNT(*) FROM chats WHERE created_at >= ?', [$today]),
        'errors' => $db->all('SELECT * FROM ai_log WHERE error IS NOT NULL ORDER BY id DESC LIMIT 5'),
    ]);
    exit;
}

// --- Lista de prompts ---
if ($page === 'prompts') {
    View::render('prompts', $common + ['prompts' => $prompts->list()]);
    exit;
}

// --- Editar / probar un prompt ---
if ($page === 'prompt') {
    $key = (string) ($_GET['key'] ?? '');
    $meta = $prompts->find($key);
    if ($meta === null) {
        redirect('prompts', [], 'Prompt no encontrado.');
    }
    $action = (string) ($_POST['action'] ?? '');
    $formError = '';
    $test = null;

    if ($isPost && $action === 'save') {
        $params = json_decode((string) ($_POST['params'] ?? '{}'), true);
        $body = trim((string) ($_POST['body'] ?? ''));
        if (!is_array($params)) {
            $formError = 'Los parámetros deben ser un objeto JSON válido.';
        } elseif ($body === '') {
            $formError = 'El prompt no puede quedar vacío.';
        } else {
            $prompts->updateMeta($key, trim((string) ($_POST['title'] ?? $meta['title'])), trim((string) ($_POST['description'] ?? '')));
            $id = $prompts->addVersion($key, $body, $params, trim((string) ($_POST['note'] ?? '')), $user, !empty($_POST['activate']));
            redirect('prompt', ['key' => $key], 'Versión #' . $id . ' guardada' . (!empty($_POST['activate']) ? ' y activada.' : ' (sin activar).'));
        }
    }

    if ($isPost && $action === 'activate') {
        $ok = $prompts->activate($key, (int) ($_POST['version'] ?? 0));
        redirect('prompt', ['key' => $key], $ok ? 'Versión activada.' : 'Esa versión no existe.');
    }

    if ($isPost && $action === 'test') {
        $test = runPromptTest($meta, $prompts, $settings);
    }

    $active = $prompts->active($key);
    $viewVersion = isset($_GET['v']) ? $prompts->version((int) $_GET['v']) : null;
    if ($viewVersion !== null && $viewVersion['prompt_key'] !== $key) {
        $viewVersion = null;
    }
    $shown = $viewVersion ?? ($active !== null ? $prompts->version($active['version']) : null);

    View::render('prompt', $common + [
        'meta' => $meta,
        'active' => $active,
        'shown' => $shown,
        'versions' => $prompts->versions($key),
        'formError' => $formError,
        'test' => $test,
        'testVars' => (string) ($_POST['test_vars'] ?? "{\n  \"npc_nombre\": \"Guardia del Abismo\",\n  \"objetivo\": \"entrar al Abismo\"\n}"),
        'testMessage' => (string) ($_POST['test_message'] ?? 'Déjame pasar, traigo galletas de baba.'),
    ]);
    exit;
}

// --- Ajustes ---
if ($page === 'settings') {
    if ($isPost) {
        $settings->set('ai_enabled', !empty($_POST['ai_enabled']));
        $settings->set('narrate_enabled', !empty($_POST['narrate_enabled']));
        $settings->set('free_action_enabled', !empty($_POST['free_action_enabled']));
        $settings->set('events_enabled', !empty($_POST['events_enabled']));
        $model = trim((string) ($_POST['model'] ?? ''));
        if (preg_match('/^[a-zA-Z0-9._-]{1,60}$/', $model)) {
            $settings->set('model', $model);
        }
        $modes = [];
        foreach (Settings::MODES as $mode) {
            $modes[$mode] = !empty($_POST['modes'][$mode]);
        }
        $settings->set('modes_enabled', $modes);
        $limits = [];
        foreach (array_keys(Settings::defaults()['limits']) as $name) {
            $limits[$name] = max(0, (int) ($_POST['limits'][$name] ?? 0));
        }
        $settings->set('limits', $limits);
        // Embudo: una línea por paso, "escena | Etiqueta"
        $funnel = [];
        foreach (preg_split('/\r?\n/', (string) ($_POST['funnel'] ?? '')) ?: [] as $line) {
            $parts = array_map('trim', explode('|', $line, 2));
            if ($parts[0] !== '' && preg_match('/^[a-zA-Z0-9_]{1,60}$/', $parts[0])) {
                $funnel[] = ['scene' => $parts[0], 'label' => ($parts[1] ?? '') !== '' ? mb_substr($parts[1], 0, 60, 'UTF-8') : $parts[0]];
            }
        }
        $settings->set('funnel', $funnel);

        // Conexión con DeepSeek: se guarda en config.php
        $apiKey = trim((string) ($_POST['api_key'] ?? ''));
        $mock = !empty($_POST['mock']);
        if ($apiKey !== '' && !preg_match('/^[\x21-\x7e]{10,200}$/', $apiKey)) {
            redirect('settings', [], 'La key de DeepSeek no parece válida (sin espacios; empieza con sk-). El resto se guardó.');
        }
        $changes = [];
        if ($apiKey !== '') {
            $changes['deepseek.api_key'] = $apiKey;
        }
        if ($mock !== (bool) App::config('deepseek.mock', false)) {
            $changes['deepseek.mock'] = $mock;
        }
        if ($changes !== [] || !App::hasConfigFile()) {
            $config = ConfigWriter::merged($changes);
            if (!ConfigWriter::write($config)) {
                View::render('config_manual', $common + ['content' => ConfigWriter::render($config), 'ctx' => 'settings']);
                exit;
            }
        }
        redirect('settings', [], $apiKey !== '' ? 'Ajustes guardados. Key de DeepSeek actualizada: pruébala en Diagnóstico.' : 'Ajustes guardados.');
    }
    View::render('settings', $common + [
        's' => $settings->all(), 'modes' => Settings::MODES,
        'hasKey' => (string) App::config('deepseek.api_key', '') !== '',
        'mock' => (bool) App::config('deepseek.mock', false),
    ]);
    exit;
}

// --- Conversaciones ---
if ($page === 'chats') {
    $mode = (string) ($_GET['mode'] ?? '');
    $rows = in_array($mode, Settings::MODES, true)
        ? $db->all('SELECT * FROM chats WHERE mode = ? ORDER BY created_at DESC LIMIT 100', [$mode])
        : $db->all('SELECT * FROM chats ORDER BY created_at DESC LIMIT 100');
    View::render('chats', $common + ['chats' => $rows, 'mode' => $mode, 'modes' => Settings::MODES]);
    exit;
}

if ($page === 'chat') {
    $chat = $db->one('SELECT * FROM chats WHERE id = ?', [(string) ($_GET['id'] ?? '')]);
    if ($chat === null) {
        redirect('chats', [], 'Conversación no encontrada.');
    }
    View::render('chat', $common + ['chat' => $chat]);
    exit;
}

// --- Diagnóstico del servidor ---
if ($page === 'diagnostics') {
    $diag = new Diagnostics($db);
    $aiTest = null;
    if ($isPost && ($_POST['action'] ?? '') === 'test_ai') {
        $aiTest = Diagnostics::testDeepSeek($settings);
    }
    $apiRoot = Diagnostics::apiRootUrl();
    View::render('diagnostics', $common + [
        'environment' => $diag->environment(),
        'exposure' => $diag->exposure($apiRoot),
        'apiRoot' => $apiRoot,
        'aiTest' => $aiTest,
    ]);
    exit;
}

// --- Analítica de partidas ---
if ($page === 'analytics') {
    $analytics = new Analytics($db);
    if ($isPost && ($_POST['action'] ?? '') === 'purge') {
        $days = max(7, (int) ($_POST['older_than'] ?? 90));
        $deleted = $analytics->purge($days);
        redirect('analytics', [], "Se borraron $deleted eventos de más de $days días.");
    }
    $games = $analytics->games();
    $game = (string) ($_GET['game'] ?? ($games[0] ?? ''));
    $days = (int) ($_GET['days'] ?? 7);
    $days = in_array($days, [1, 7, 30, 90, 365], true) ? $days : 7;
    $funnel = $settings->get('funnel');
    View::render('analytics', $common + [
        'games' => $games,
        'game' => $game,
        'days' => $days,
        'r' => $game !== '' ? $analytics->report($game, $days, is_array($funnel) ? $funnel : []) : null,
        'eventsTotal' => (int) $db->value('SELECT COUNT(*) FROM events'),
    ]);
    exit;
}

// --- Calificaciones de los jugadores (/bien, /mal) y ejemplos de los prompts ---
if ($page === 'ratings') {
    $rating = (int) ($_GET['r'] ?? 1) === -1 ? -1 : 1;
    $key = (string) ($_GET['key'] ?? '');
    $action = (string) ($_POST['action'] ?? '');
    if ($isPost && $action === 'add_example') {
        $line = $db->one('SELECT * FROM ai_lines WHERE id = ?', [(int) ($_POST['line'] ?? 0)]);
        if ($line !== null) {
            $prompts->addExample((string) $line['prompt_key'], (string) $line['text']);
        }
        redirect('ratings', ['r' => $rating, 'key' => $key], $line !== null ? 'Ejemplo agregado.' : 'Línea no encontrada.');
    }
    if ($isPost && $action === 'delete_example') {
        $prompts->deleteExample((int) ($_POST['example'] ?? 0));
        redirect('ratings', ['r' => $rating, 'key' => $key], 'Ejemplo quitado.');
    }
    $export = [];
    foreach (AiLines::rated($db, 1, '', 500) as $l) {
        $export[(string) $l['prompt_key']][] = (string) $l['text'];
    }
    View::render('ratings', $common + [
        'summary' => AiLines::summary($db),
        'lines' => AiLines::rated($db, $rating, $key),
        'rating' => $rating,
        'key' => $key,
        'examples' => $prompts->allExamples(),
        'examplesPerPrompt' => PromptRenderer::EXAMPLES_PER_PROMPT,
        'export' => json_encode($export, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) ?: '{}',
    ]);
    exit;
}

// --- Registro de llamadas a la IA ---
if ($page === 'logs') {
    $onlyErrors = !empty($_GET['errors']);
    $rows = $onlyErrors
        ? $db->all('SELECT * FROM ai_log WHERE error IS NOT NULL ORDER BY id DESC LIMIT 200')
        : $db->all('SELECT * FROM ai_log ORDER BY id DESC LIMIT 200');
    View::render('logs', $common + ['logs' => $rows, 'onlyErrors' => $onlyErrors]);
    exit;
}

redirect('dashboard');

/**
 * Prueba un prompt con variables de ejemplo, usando el texto del formulario (sin guardarlo).
 * @param array<string, mixed> $meta
 * @return array<string, mixed>
 */
function runPromptTest(array $meta, PromptRepository $prompts, Settings $settings): array
{
    $vars = json_decode((string) ($_POST['test_vars'] ?? '{}'), true);
    if (!is_array($vars)) {
        return ['error' => 'Las variables de prueba deben ser un objeto JSON.'];
    }
    $params = json_decode((string) ($_POST['params'] ?? '{}'), true);
    $params = is_array($params) ? $params : [];
    $kind = (string) $meta['kind'];
    $vars = PromptRenderer::sanitizeVars($vars, 50, 1000);
    $isChat = $kind === 'chat';
    $isFree = $kind === 'libre';
    if ($isFree) {
        $vars += [
            'opciones' => FreeActionService::listOptions(['Aceptar la misión', 'Ir a la taberna']),
            'consecuencias' => FreeActionService::listConsequences(['ridiculo' => 'hace el ridículo', 'susto' => 'se asusta']),
        ];
    }
    if ($isChat) {
        $vars += ['turn' => '1', 'max_turns' => (string) ($params['max_turns'] ?? 6), 'score' => (string) ($params['initial_score'] ?? 0)];
    }
    $prompt = ['key' => (string) $meta['key'], 'kind' => $kind, 'body' => (string) ($_POST['body'] ?? ''), 'params' => $params];
    $renderer = new PromptRenderer($prompts);
    $contract = $isChat
        ? PromptRenderer::chatContract((int) ($params['max_reply_chars'] ?? 400))
        : ($isFree
            ? PromptRenderer::freeActionContract((int) ($params['max_chars'] ?? 400))
            : ($kind === 'narrate' ? PromptRenderer::narrateContract((int) ($params['max_chars'] ?? 400)) : ''));
    $system = $renderer->system($prompt, $vars, $contract);
    $withMessage = $isChat || $isFree || !empty($params['player_message']);
    $userMessage = $withMessage ? trim((string) ($_POST['test_message'] ?? '')) : 'Escribe la línea ahora.';

    $guard = new Guard(App::db(), $settings);
    try {
        $result = DeepSeekClient::fromConfig()->chat(
            (string) $settings->get('model'),
            [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $userMessage]],
            (float) ($params['temperature'] ?? 1.0),
            (int) ($params['max_tokens'] ?? 300),
            $contract !== ''
        );
    } catch (AiException $e) {
        $guard->recordError('admin', 'test', (string) $meta['key'], $e->getMessage());
        return ['system' => $system, 'error' => $e->getMessage()];
    }
    $guard->recordUsage('admin', 'test', (string) $meta['key'], $result);

    $out = ['system' => $system, 'raw' => $result->content, 'tokens' => $result->tokensIn + $result->tokensOut, 'latency' => $result->latencyMs];
    if ($isChat) {
        try {
            $out['parsed'] = ChatService::parseReply($result->content);
        } catch (AiException $e) {
            $out['error'] = 'La respuesta no cumple el formato JSON: ' . $e->getMessage();
        }
    } elseif ($isFree) {
        try {
            $free = FreeActionService::parseReply($result->content, (int) ($params['max_chars'] ?? 400), 2, ['ridiculo', 'susto']);
            $out['text'] = $free['text'];
            $out['tone'] = $free['tone'];
            $out['free'] = $free;
        } catch (AiException $e) {
            $out['error'] = 'La respuesta no cumple el formato JSON: ' . $e->getMessage();
        }
    } else {
        try {
            $line = NarrateService::parseLine($result->content, (int) ($params['max_chars'] ?? 400));
            $out['text'] = $line['text'];
            $out['tone'] = $line['tone'];
        } catch (AiException $e) {
            $out['error'] = $e->getMessage();
        }
    }
    return $out;
}
