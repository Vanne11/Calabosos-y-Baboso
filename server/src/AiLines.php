<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Líneas generadas por la IA que el jugador puede calificar (/bien, /mal).
 * Las mejores se convierten en ejemplos de los prompts (tabla prompt_examples) desde el admin.
 */
final class AiLines
{
    /** Guarda una línea generada y devuelve su id (el cliente lo usa para calificarla) */
    public static function record(Db $db, string $sessionId, string $kind, string $promptKey, int $promptVersion, string $text): int
    {
        $db->run(
            'INSERT INTO ai_lines (session_id, kind, prompt_key, prompt_version, text, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$sessionId, $kind, $promptKey, $promptVersion, $text, gmdate('c')]
        );
        return (int) $db->pdo()->lastInsertId();
    }

    /** Califica una línea de la propia sesión: 1 (le gustó) o -1. Devuelve false si no existe o no es suya. */
    public static function rate(Db $db, string $sessionId, int $lineId, int $rating): bool
    {
        if ($lineId <= 0 || ($rating !== 1 && $rating !== -1)) {
            return false;
        }
        return $db->run(
            'UPDATE ai_lines SET rating = ?, rated_at = ? WHERE id = ? AND session_id = ?',
            [$rating, gmdate('c'), $lineId, $sessionId]
        )->rowCount() === 1;
    }

    /**
     * Resumen por prompt y versión: cuántas líneas, 👍 y 👎.
     * @return array<int, array<string, mixed>>
     */
    public static function summary(Db $db): array
    {
        return $db->all(
            'SELECT prompt_key, prompt_version, COUNT(*) AS lines,
                    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) AS up,
                    SUM(CASE WHEN rating = -1 THEN 1 ELSE 0 END) AS down
             FROM ai_lines GROUP BY prompt_key, prompt_version ORDER BY prompt_key, prompt_version DESC'
        );
    }

    /**
     * Últimas líneas calificadas (1, -1) de un prompt (o de todos).
     * @return array<int, array<string, mixed>>
     */
    public static function rated(Db $db, int $rating, string $promptKey = '', int $limit = 100): array
    {
        $sql = 'SELECT l.*, (SELECT COUNT(*) FROM prompt_examples e WHERE e.prompt_key = l.prompt_key AND e.text = l.text) AS is_example
                FROM ai_lines l WHERE l.rating = ?';
        $params = [$rating];
        if ($promptKey !== '') {
            $sql .= ' AND l.prompt_key = ?';
            $params[] = $promptKey;
        }
        $sql .= ' ORDER BY l.rated_at DESC LIMIT ' . max(1, min(500, $limit));
        return $db->all($sql, $params);
    }

    /** Borra las líneas sin calificar más viejas que N días */
    public static function purge(Db $db, int $olderThanDays): int
    {
        $cutoff = gmdate('c', time() - max(1, $olderThanDays) * 86400);
        return $db->run('DELETE FROM ai_lines WHERE rating IS NULL AND created_at < ?', [$cutoff])->rowCount();
    }
}
