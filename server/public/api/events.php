<?php
// POST { sessionId, game, events: [{ type, scene?, data?, t? }] } → { stored }
// Eventos de juego para la analítica del admin (decisiones, muertes, finales...).

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\Api;
use Cyb\ApiException;
use Cyb\App;
use Cyb\Guard;
use Cyb\Http;

const MAX_EVENTS = 50;
const MAX_DATA_BYTES = 2048;

Api::handle('POST', static function (): array {
    Http::requireMethod('POST');
    $body = Http::jsonBody();
    $settings = App::settings();
    if (!$settings->get('events_enabled')) {
        return ['stored' => 0];
    }
    $sessionId = (string) ($body['sessionId'] ?? '');
    if (!Guard::validSessionId($sessionId)) {
        throw new ApiException(400, 'bad_session', 'sessionId inválido');
    }
    $events = $body['events'] ?? null;
    if (!is_array($events)) {
        throw new ApiException(400, 'bad_events', 'Falta events');
    }

    $db = App::db();
    $guard = new Guard($db, $settings);
    // Los lotes de eventos cuentan aparte de las llamadas de IA, con un límite más holgado
    if (!$guard->hitRateLimit('events', $settings->limit('ip_per_minute') * 3)) {
        throw new ApiException(429, 'rate_limited', 'Demasiadas peticiones');
    }
    $game = Api::gameName($body);
    $guard->touchSession($sessionId, $game);

    $now = gmdate('c');
    $stored = $db->transaction(static function () use ($db, $events, $sessionId, $game, $now): int {
        $count = 0;
        foreach (array_slice($events, 0, MAX_EVENTS) as $event) {
            if (!is_array($event)) {
                continue;
            }
            $type = (string) ($event['type'] ?? '');
            if (!preg_match('/^[a-z0-9_.]{1,40}$/', $type)) {
                continue;
            }
            $scene = (string) ($event['scene'] ?? '');
            $scene = preg_match('/^[a-zA-Z0-9_]{0,60}$/', $scene) ? $scene : '';
            $data = json_encode($event['data'] ?? new \stdClass(), JSON_UNESCAPED_UNICODE);
            if ($data === false || strlen($data) > MAX_DATA_BYTES) {
                $data = '{}';
            }
            $clientTime = isset($event['t']) && is_numeric($event['t']) ? (int) $event['t'] : null;
            $db->run(
                'INSERT INTO events (session_id, game, type, scene, data, client_time, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [$sessionId, $game, $type, $scene, $data, $clientTime, $now]
            );
            $count++;
        }
        return $count;
    });

    return ['stored' => $stored];
});
