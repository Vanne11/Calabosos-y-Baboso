<?php

declare(strict_types=1);

namespace Cyb;

/** Límites de uso: rate limit por IP, presupuesto de tokens por sesión y global, sesiones y registro */
final class Guard
{
    /** @var Db */
    private $db;
    /** @var Settings */
    private $settings;

    public function __construct(Db $db, Settings $settings)
    {
        $this->db = $db;
        $this->settings = $settings;
    }

    public static function validSessionId(string $id): bool
    {
        return (bool) preg_match('/^[a-zA-Z0-9-]{16,64}$/', $id);
    }

    /** Registra/actualiza la sesión anónima del jugador */
    public function touchSession(string $sessionId, string $game): void
    {
        $now = gmdate('c');
        $this->db->run(
            'INSERT INTO sessions (id, game, ip_hash, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(id) DO UPDATE SET last_seen_at = excluded.last_seen_at',
            [$sessionId, $game, App::ipHash(), $now, $now]
        );
    }

    /** Ventana fija de 1 minuto por IP. Devuelve false si se superó el límite. */
    public function hitRateLimit(string $bucket, int $perMinute): bool
    {
        if ($perMinute <= 0) {
            return true;
        }
        $window = intdiv(time(), 60);
        $key = $bucket . ':' . App::ipHash();
        $this->db->run(
            'INSERT INTO rate_hits (bucket, window, count) VALUES (?, ?, 1)
             ON CONFLICT(bucket, window) DO UPDATE SET count = count + 1',
            [$key, $window]
        );
        $count = (int) $this->db->value('SELECT count FROM rate_hits WHERE bucket = ? AND window = ?', [$key, $window]);
        // Limpieza ocasional de ventanas viejas
        if (random_int(1, 50) === 1) {
            $this->db->run('DELETE FROM rate_hits WHERE window < ?', [$window - 5]);
        }
        return $count <= $perMinute;
    }

    /** ¿Queda presupuesto de tokens hoy (global y de la sesión)? */
    public function hasBudget(string $sessionId): bool
    {
        $day = gmdate('Y-m-d');
        $global = $this->db->one('SELECT tokens_in, tokens_out FROM usage_daily WHERE day = ?', [$day]);
        $globalUsed = $global === null ? 0 : (int) $global['tokens_in'] + (int) $global['tokens_out'];
        if ($globalUsed >= $this->settings->limit('global_tokens_per_day')) {
            return false;
        }
        $session = $this->db->one('SELECT tokens_day, tokens_today FROM sessions WHERE id = ?', [$sessionId]);
        $sessionUsed = ($session !== null && $session['tokens_day'] === $day) ? (int) $session['tokens_today'] : 0;
        return $sessionUsed < $this->settings->limit('session_tokens_per_day');
    }

    /** Anota el consumo de una llamada exitosa */
    public function recordUsage(string $sessionId, string $kind, string $promptKey, AiResult $result): void
    {
        $day = gmdate('Y-m-d');
        $tokens = $result->tokensIn + $result->tokensOut;
        $this->db->run(
            'INSERT INTO usage_daily (day, requests, tokens_in, tokens_out) VALUES (?, 1, ?, ?)
             ON CONFLICT(day) DO UPDATE SET requests = requests + 1,
                tokens_in = tokens_in + excluded.tokens_in, tokens_out = tokens_out + excluded.tokens_out',
            [$day, $result->tokensIn, $result->tokensOut]
        );
        $this->db->run(
            'UPDATE sessions SET requests = requests + 1, tokens = tokens + ?,
                tokens_today = CASE WHEN tokens_day = ? THEN tokens_today + ? ELSE ? END,
                tokens_day = ?
             WHERE id = ?',
            [$tokens, $day, $tokens, $tokens, $day, $sessionId]
        );
        $this->log($sessionId, $kind, $promptKey, $result, null);
    }

    /** Anota un error de IA (cuenta en errores del día) */
    public function recordError(string $sessionId, string $kind, string $promptKey, string $error): void
    {
        $day = gmdate('Y-m-d');
        $this->db->run(
            'INSERT INTO usage_daily (day, errors) VALUES (?, 1)
             ON CONFLICT(day) DO UPDATE SET errors = errors + 1',
            [$day]
        );
        $this->log($sessionId, $kind, $promptKey, null, $error);
    }

    private function log(string $sessionId, string $kind, string $promptKey, ?AiResult $result, ?string $error): void
    {
        $this->db->run(
            'INSERT INTO ai_log (created_at, session_id, kind, prompt_key, tokens_in, tokens_out, latency_ms, error)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                gmdate('c'), $sessionId, $kind, $promptKey,
                $result ? $result->tokensIn : 0,
                $result ? $result->tokensOut : 0,
                $result ? $result->latencyMs : 0,
                $error === null ? null : mb_substr($error, 0, 500, 'UTF-8'),
            ]
        );
    }
}
