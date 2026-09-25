<?php

declare(strict_types=1);

namespace Cyb;

/** Ajustes editables desde el admin (JSON en la tabla settings), con valores por defecto */
final class Settings
{
    public const MODES = ['persuadir', 'negociar', 'cancion', 'rap', 'insultos', 'confesion'];

    /** @var Db */
    private $db;
    /** @var array<string, mixed>|null */
    private $cache = null;

    public function __construct(Db $db)
    {
        $this->db = $db;
    }

    /** @return array<string, mixed> */
    public static function defaults(): array
    {
        return [
            'ai_enabled' => true,
            'events_enabled' => true,
            'model' => 'deepseek-chat',
            // Embudo de la analítica: escenas clave del juego, en orden
            'funnel' => [
                ['scene' => 'start', 'label' => 'Empieza la partida'],
                ['scene' => 'acto1_plaza', 'label' => 'Acto I: el pueblo'],
                ['scene' => 'acto2_camino', 'label' => 'Acto II: el camino'],
                ['scene' => 'acto3_abismo', 'label' => 'Acto III: el Abismo'],
                ['scene' => 'acto3_hacia_trono', 'label' => 'Termina el Acto III'],
                ['scene' => 'acto4_sala_trono', 'label' => 'Llega al trono'],
                ['scene' => 'acto4_desenlace', 'label' => 'Derrota al Rey'],
            ],
            'narrate_enabled' => true,
            'free_action_enabled' => true,
            'modes_enabled' => array_fill_keys(self::MODES, true),
            'limits' => [
                'ip_per_minute' => 20,
                'session_tokens_per_day' => 60000,
                'global_tokens_per_day' => 2000000,
                'max_input_chars' => 400,
                'max_turns_cap' => 12,
                'max_vars' => 30,
                'max_var_chars' => 300,
                // Variables de contexto (memoria, citas, fichas): PromptRenderer::CONTEXT_VARS
                'max_context_chars' => 1200,
            ],
        ];
    }

    /** @return array<string, mixed> */
    public function all(): array
    {
        if ($this->cache === null) {
            $stored = [];
            foreach ($this->db->all('SELECT key, value FROM settings') as $row) {
                $stored[$row['key']] = json_decode((string) $row['value'], true);
            }
            $this->cache = self::merge(self::defaults(), $stored);
        }
        return $this->cache;
    }

    /** @return mixed */
    public function get(string $key)
    {
        $all = $this->all();
        return $all[$key] ?? null;
    }

    /** @param mixed $value */
    public function set(string $key, $value): void
    {
        $this->db->run(
            'INSERT INTO settings (key, value) VALUES (?, ?)
             ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            [$key, json_encode($value, JSON_UNESCAPED_UNICODE)]
        );
        $this->cache = null;
    }

    public function limit(string $name): int
    {
        $limits = $this->get('limits');
        return (int) ($limits[$name] ?? self::defaults()['limits'][$name] ?? 0);
    }

    public function modeEnabled(string $mode): bool
    {
        $modes = $this->get('modes_enabled');
        return !empty($modes[$mode]);
    }

    /** @param array<mixed> $value */
    private static function isList(array $value): bool
    {
        return $value === [] || array_keys($value) === range(0, count($value) - 1);
    }

    /**
     * Mezcla recursiva: los valores guardados pisan a los defaults,
     * pero los defaults nuevos aparecen aunque no estén guardados.
     * @param array<string, mixed> $defaults
     * @param array<string, mixed> $stored
     * @return array<string, mixed>
     */
    private static function merge(array $defaults, array $stored): array
    {
        foreach ($stored as $key => $value) {
            // Solo se mezclan objetos (arrays asociativos); las listas se reemplazan enteras
            if (isset($defaults[$key]) && is_array($defaults[$key]) && is_array($value) && !self::isList($value) && !self::isList($defaults[$key])) {
                $defaults[$key] = self::merge($defaults[$key], $value);
            } else {
                $defaults[$key] = $value;
            }
        }
        return $defaults;
    }
}
