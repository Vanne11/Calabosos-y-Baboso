<?php
// GET: configuración pública para el cliente (qué funciones de IA están activas)

declare(strict_types=1);

require __DIR__ . '/../../src/bootstrap.php';

use Cyb\Api;
use Cyb\App;
use Cyb\Http;
use Cyb\Settings;

Api::handle('GET', static function (): array {
    Http::requireMethod('GET');
    $settings = App::settings();
    $enabled = (bool) $settings->get('ai_enabled');
    $modes = [];
    foreach (Settings::MODES as $mode) {
        $modes[$mode] = $enabled && $settings->modeEnabled($mode);
    }
    return [
        'aiEnabled' => $enabled,
        'narrate' => $enabled && (bool) $settings->get('narrate_enabled'),
        'modes' => $modes,
        'events' => (bool) $settings->get('events_enabled'),
        'maxInputChars' => $settings->limit('max_input_chars'),
    ];
});
