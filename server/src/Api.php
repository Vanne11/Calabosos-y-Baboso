<?php

declare(strict_types=1);

namespace Cyb;

/** Utilidades compartidas por los endpoints públicos */
final class Api
{
    /**
     * Ejecuta un endpoint: encabezados, errores controlados y errores inesperados.
     * @param callable(): array<string, mixed> $handler
     */
    public static function handle(string $methods, callable $handler): void
    {
        Http::apiHeaders($methods);
        try {
            $data = $handler();
            Http::json($data);
        } catch (ApiException $e) {
            Http::error($e->status, $e->errorCode, $e->getMessage());
        } catch (\Throwable $e) {
            error_log('[cyb-api] ' . get_class($e) . ': ' . $e->getMessage());
            Http::error(500, 'server_error', 'Error interno');
        }
    }

    /**
     * Validaciones comunes de un pedido de IA: sesión, IA activa y rate limit.
     * @param array<string, mixed> $body
     */
    public static function aiRequest(array $body, string $bucket): Guard
    {
        $sessionId = (string) ($body['sessionId'] ?? '');
        if (!Guard::validSessionId($sessionId)) {
            throw new ApiException(400, 'bad_session', 'sessionId inválido');
        }
        $settings = App::settings();
        if (!$settings->get('ai_enabled')) {
            throw new ApiException(503, 'ai_disabled', 'IA desactivada');
        }
        $guard = new Guard(App::db(), $settings);
        if (!$guard->hitRateLimit($bucket, $settings->limit('ip_per_minute'))) {
            throw new ApiException(429, 'rate_limited', 'Demasiadas peticiones, espera un momento');
        }
        $guard->touchSession($sessionId, self::gameName($body));
        return $guard;
    }

    /** @param array<string, mixed> $body */
    public static function gameName(array $body): string
    {
        $game = (string) ($body['game'] ?? '');
        return preg_match('/^[a-zA-Z0-9_ -]{0,40}$/', $game) ? $game : '';
    }
}
