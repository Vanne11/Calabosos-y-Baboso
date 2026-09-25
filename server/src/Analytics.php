<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Analítica de partidas a partir de la tabla events (enviada por el juego).
 * Se calcula en PHP (sin funciones JSON de SQLite, que no todos los hostings tienen).
 */
final class Analytics
{
    /** Máximo de eventos a procesar por consulta (protege la memoria en hostings chicos) */
    private const MAX_EVENTS = 250000;

    /** @var Db */
    private $db;

    public function __construct(Db $db)
    {
        $this->db = $db;
    }

    /** @return array<int, string> */
    public function games(): array
    {
        return array_map('strval', array_column(
            $this->db->all("SELECT DISTINCT game FROM events WHERE game <> '' ORDER BY game"),
            'game'
        ));
    }

    /**
     * @param array<int, array{scene: string, label: string}> $funnel
     * @return array<string, mixed>
     */
    public function report(string $game, int $days, array $funnel): array
    {
        $since = gmdate('c', time() - $days * 86400);
        $stmt = $this->db->pdo()->prepare(
            'SELECT session_id, type, scene, data, client_time, created_at FROM events
             WHERE game = ? AND created_at >= ? ORDER BY session_id, id LIMIT ' . self::MAX_EVENTS
        );
        $stmt->execute([$game, $since]);

        $sessions = [];
        $deathsFrom = [];
        $choices = [];
        $dice = [];
        $chats = [];
        $perDay = [];
        $truncated = false;
        $count = 0;

        while (($row = $stmt->fetch()) !== false) {
            $count++;
            $sid = (string) $row['session_id'];
            if (!isset($sessions[$sid])) {
                $sessions[$sid] = ['scenes' => [], 'last' => '', 'first_t' => null, 'last_t' => null, 'finals' => [], 'deaths' => 0];
                $day = substr((string) $row['created_at'], 0, 10);
                $perDay[$day] = ($perDay[$day] ?? 0) + 1;
            }
            $s =& $sessions[$sid];
            $t = $row['client_time'] !== null ? (int) $row['client_time'] : null;
            if ($t !== null) {
                $s['first_t'] = $s['first_t'] === null ? $t : min($s['first_t'], $t);
                $s['last_t'] = $s['last_t'] === null ? $t : max($s['last_t'], $t);
            }
            $data = json_decode((string) $row['data'], true);
            $data = is_array($data) ? $data : [];
            $scene = (string) $row['scene'];

            switch ($row['type']) {
                case 'scene':
                    $s['scenes'][$scene] = true;
                    $s['last'] = $scene;
                    if (strncmp($scene, 'final_', 6) === 0) {
                        $s['finals'][$scene] = true;
                    }
                    if ($scene === 'muerte') {
                        $s['deaths']++;
                        $from = (string) ($data['from'] ?? '?');
                        $deathsFrom[$from] = ($deathsFrom[$from] ?? 0) + 1;
                    }
                    break;
                case 'choice':
                    $key = $scene . ' → ' . mb_substr((string) ($data['text'] ?? ''), 0, 80, 'UTF-8');
                    $choices[$key] = ($choices[$key] ?? 0) + 1;
                    break;
                case 'dice':
                    $outcome = (string) ($data['outcome'] ?? '?');
                    $dice[$outcome] = ($dice[$outcome] ?? 0) + 1;
                    break;
                case 'chat':
                    $mode = (string) ($data['mode'] ?? '?');
                    if (!isset($chats[$mode])) {
                        $chats[$mode] = ['total' => 0, 'success' => 0, 'partial' => 0, 'failure' => 0, 'none' => 0, 'fallback' => 0, 'gaveUp' => 0];
                    }
                    $chats[$mode]['total']++;
                    $verdict = $data['verdict'] ?? null;
                    $chats[$mode][in_array($verdict, ['success', 'partial', 'failure'], true) ? $verdict : 'none']++;
                    if (!empty($data['fallback'])) {
                        $chats[$mode]['fallback']++;
                    }
                    if (!empty($data['gaveUp'])) {
                        $chats[$mode]['gaveUp']++;
                    }
                    break;
            }
            unset($s);
        }
        if ($count >= self::MAX_EVENTS) {
            $truncated = true;
        }

        $total = count($sessions);
        $funnelRows = [];
        foreach ($funnel as $step) {
            $reached = 0;
            foreach ($sessions as $s) {
                if (isset($s['scenes'][$step['scene']])) {
                    $reached++;
                }
            }
            $funnelRows[] = ['label' => $step['label'], 'scene' => $step['scene'], 'count' => $reached];
        }

        $finals = [];
        $abandon = [];
        $durations = [];
        $deaths = 0;
        foreach ($sessions as $s) {
            $deaths += $s['deaths'];
            foreach (array_keys($s['finals']) as $f) {
                $finals[$f] = ($finals[$f] ?? 0) + 1;
            }
            if (!$s['finals']) {
                if ($s['last'] !== '') {
                    $abandon[$s['last']] = ($abandon[$s['last']] ?? 0) + 1;
                }
            } elseif ($s['first_t'] !== null && $s['last_t'] !== null) {
                $durations[] = ($s['last_t'] - $s['first_t']) / 60000;
            }
        }
        sort($durations);

        arsort($deathsFrom);
        arsort($abandon);
        arsort($choices);
        arsort($finals);
        ksort($perDay);

        return [
            'sessions' => $total,
            'finished' => count(array_filter($sessions, static function ($s) { return (bool) $s['finals']; })),
            'deaths' => $deaths,
            'events' => $count,
            'truncated' => $truncated,
            'funnel' => $funnelRows,
            'finals' => $finals,
            'deathsFrom' => array_slice($deathsFrom, 0, 12, true),
            'abandon' => array_slice($abandon, 0, 12, true),
            'choices' => array_slice($choices, 0, 20, true),
            'dice' => $dice,
            'chats' => $chats,
            'perDay' => $perDay,
            'durationMedian' => $durations ? $durations[intdiv(count($durations), 2)] : null,
            'durationAvg' => $durations ? array_sum($durations) / count($durations) : null,
            'durationCount' => count($durations),
        ];
    }

    /** Borra eventos más viejos que N días. Devuelve cuántos borró. */
    public function purge(int $olderThanDays): int
    {
        $cutoff = gmdate('c', time() - max(1, $olderThanDays) * 86400);
        return $this->db->run('DELETE FROM events WHERE created_at < ?', [$cutoff])->rowCount();
    }
}
