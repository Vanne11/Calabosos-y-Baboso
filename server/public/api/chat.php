<?php
// POST acciones del modo chat:
//   { action: "start", sessionId, game, mode, npc, vars: {...}, maxTurns? } → { chatId, maxTurns, turnsLeft, score, maxInputChars }
//   { action: "say", sessionId, chatId, message }                          → { reply, score, done, verdict, turn, turnsLeft }
//   { action: "giveup", sessionId, chatId }                                → { done, verdict, score }

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\Api;
use Cyb\ApiException;
use Cyb\App;
use Cyb\ChatService;
use Cyb\DeepSeekClient;
use Cyb\Http;

Api::handle('POST', static function (): array {
    Http::requireMethod('POST');
    $body = Http::jsonBody();
    $guard = Api::aiRequest($body, 'chat');
    $service = new ChatService(App::db(), App::settings(), $guard, DeepSeekClient::fromConfig());
    $sessionId = (string) $body['sessionId'];
    $action = (string) ($body['action'] ?? '');

    if ($action === 'start') {
        return $service->start(
            $sessionId,
            Api::gameName($body),
            (string) ($body['mode'] ?? ''),
            (string) ($body['npc'] ?? ''),
            $body['vars'] ?? [],
            (int) ($body['maxTurns'] ?? 0)
        );
    }
    if ($action === 'say') {
        return $service->say($sessionId, (string) ($body['chatId'] ?? ''), (string) ($body['message'] ?? ''));
    }
    if ($action === 'giveup') {
        return $service->giveUp($sessionId, (string) ($body['chatId'] ?? ''));
    }
    throw new ApiException(400, 'bad_action', 'Acción desconocida');
});
