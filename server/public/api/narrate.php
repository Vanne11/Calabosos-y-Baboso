<?php
// POST { sessionId, game, prompt: "muerte", vars: {...}, message? } → { text, tone, lineId }
// message: lo que escribió el jugador (solo para prompts con player_message, como "charla" = /narrador)

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\Api;
use Cyb\App;
use Cyb\DeepSeekClient;
use Cyb\Http;
use Cyb\NarrateService;

Api::handle('POST', static function (): array {
    Http::requireMethod('POST');
    $body = Http::jsonBody();
    $guard = Api::aiRequest($body, 'narrate');
    $service = new NarrateService(App::db(), App::settings(), $guard, DeepSeekClient::fromConfig());
    return $service->narrate(
        (string) $body['sessionId'],
        (string) ($body['prompt'] ?? ''),
        $body['vars'] ?? [],
        is_string($body['message'] ?? null) ? $body['message'] : ''
    );
});
