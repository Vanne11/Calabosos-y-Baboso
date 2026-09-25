<?php

declare(strict_types=1);

namespace Cyb;

/** Respuestas JSON, CORS y lectura del cuerpo para los endpoints de la API */
final class Http
{
    private const MAX_BODY_BYTES = 32768;

    /** Encabezados comunes + CORS. Responde el preflight OPTIONS y termina. */
    public static function apiHeaders(string $methods): void
    {
        header('Content-Type: application/json; charset=utf-8');
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: no-store');

        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        $allowed = App::config('allowed_origins', []);
        if ($origin !== '' && is_array($allowed) && in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
            header('Access-Control-Allow-Methods: ' . $methods . ', OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type');
            header('Access-Control-Max-Age: 600');
        }
        if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }

    public static function requireMethod(string $method): void
    {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== $method) {
            self::error(405, 'method_not_allowed', 'Método no permitido');
        }
    }

    /** @return array<string, mixed> */
    public static function jsonBody(): array
    {
        $raw = file_get_contents('php://input', false, null, 0, self::MAX_BODY_BYTES + 1);
        if ($raw === false || strlen($raw) > self::MAX_BODY_BYTES) {
            self::error(413, 'too_large', 'Petición demasiado grande');
        }
        $data = json_decode((string) $raw, true);
        if (!is_array($data)) {
            self::error(400, 'bad_json', 'JSON inválido');
        }
        return $data;
    }

    /** @param array<string, mixed> $data */
    public static function json(array $data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    public static function error(int $status, string $code, string $message): void
    {
        self::json(['error' => $code, 'message' => $message], $status);
    }

    /** Ejecuta un endpoint capturando errores inesperados (sin filtrar detalles al cliente) */
    public static function run(callable $handler): void
    {
        try {
            $handler();
        } catch (\Throwable $e) {
            error_log('[cyb/api] ' . get_class($e) . ': ' . $e->getMessage());
            self::error(500, 'server_error', 'Error interno');
        }
    }
}
