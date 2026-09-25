<?php
// POST { sessionId, game, prompt: "accion", vars: {...}, action: "lo que escribió", options: ["..."], consequences: {id: "..."} }
// → { text, tone, option (índice desde 0 o null), consequence (id o null) }

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\Api;
use Cyb\App;
use Cyb\DeepSeekClient;
use Cyb\FreeActionService;
use Cyb\Http;

Api::handle('POST', static function (): array {
    Http::requireMethod('POST');
    $body = Http::jsonBody();
    $guard = Api::aiRequest($body, 'libre');
    $service = new FreeActionService(App::db(), App::settings(), $guard, DeepSeekClient::fromConfig());
    return $service->interpret(
        (string) $body['sessionId'],
        (string) ($body['prompt'] ?? ''),
        $body['vars'] ?? [],
        (string) ($body['action'] ?? ''),
        $body['options'] ?? [],
        $body['consequences'] ?? []
    );
});
