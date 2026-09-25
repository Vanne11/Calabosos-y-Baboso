<?php
// POST { sessionId, lineId, rating: 1 | -1 } → { ok } (el jugador califica una línea de la IA con /bien o /mal)

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\AiLines;
use Cyb\Api;
use Cyb\ApiException;
use Cyb\App;
use Cyb\Guard;
use Cyb\Http;

Api::handle('POST', static function (): array {
    Http::requireMethod('POST');
    $body = Http::jsonBody();
    $sessionId = (string) ($body['sessionId'] ?? '');
    if (!Guard::validSessionId($sessionId)) {
        throw new ApiException(400, 'bad_session', 'sessionId inválido');
    }
    $settings = App::settings();
    $guard = new Guard(App::db(), $settings);
    if (!$guard->hitRateLimit('rate', $settings->limit('ip_per_minute'))) {
        throw new ApiException(429, 'rate_limited', 'Demasiadas peticiones, espera un momento');
    }
    $ok = AiLines::rate(App::db(), $sessionId, (int) ($body['lineId'] ?? 0), (int) ($body['rating'] ?? 0));
    if (!$ok) {
        throw new ApiException(404, 'unknown_line', 'Línea no encontrada');
    }
    return ['ok' => true];
});
