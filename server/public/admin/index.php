<?php
// Panel admin: prompts, ajustes, uso y conversaciones.

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\AdminAuth;
use Cyb\AiException;
use Cyb\App;
use Cyb\ChatService;
use Cyb\DeepSeekClient;
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

$db = App::db();
$auth = new AdminAuth($db);
$auth->startSession();

$page = (string) ($_GET['p'] ?? 'dashboard');
$isPost = ($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST';

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
    View::render('login', ['error' => $error, 'csrf' => $auth->csrfToken(), 'user' => null]);
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
        redirect('settings', [], 'Ajustes guardados.');
    }
    View::render('settings', $common + ['s' => $settings->all(), 'modes' => Settings::MODES]);
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
    if ($isChat) {
        $vars += ['turn' => '1', 'max_turns' => (string) ($params['max_turns'] ?? 6), 'score' => (string) ($params['initial_score'] ?? 0)];
    }
    $prompt = ['kind' => $kind, 'body' => (string) ($_POST['body'] ?? ''), 'params' => $params];
    $renderer = new PromptRenderer($prompts);
    $system = $renderer->system($prompt, $vars, $isChat ? PromptRenderer::chatContract((int) ($params['max_reply_chars'] ?? 400)) : '');
    $userMessage = $isChat ? trim((string) ($_POST['test_message'] ?? '')) : 'Escribe la línea ahora.';

    $guard = new Guard(App::db(), $settings);
    try {
        $result = DeepSeekClient::fromConfig()->chat(
            (string) $settings->get('model'),
            [['role' => 'system', 'content' => $system], ['role' => 'user', 'content' => $userMessage]],
            (float) ($params['temperature'] ?? 1.0),
            (int) ($params['max_tokens'] ?? 300),
            $isChat
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
    } else {
        $out['text'] = NarrateService::cleanLine($result->content, (int) ($params['max_chars'] ?? 400));
    }
    return $out;
}
