<?php

declare(strict_types=1);

namespace Cyb;

/** Arma los mensajes de sistema a partir de un prompt y sus variables */
final class PromptRenderer
{
    public const BASE_KEY = 'narrador.base';

    /** @var PromptRepository */
    private $prompts;

    public function __construct(PromptRepository $prompts)
    {
        $this->prompts = $prompts;
    }

    /**
     * Reemplaza {{variable}} por su valor. Las variables desconocidas quedan vacías.
     * @param array<string, string> $vars
     */
    public static function fill(string $template, array $vars): string
    {
        return (string) preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/',
            static function (array $m) use ($vars): string {
                return $vars[$m[1]] ?? '';
            },
            $template
        );
    }

    /**
     * Limpia las variables que vienen del cliente: solo escalares, cantidad y largo acotados.
     * @param mixed $raw
     * @return array<string, string>
     */
    public static function sanitizeVars($raw, int $maxVars, int $maxChars): array
    {
        $vars = [];
        if (!is_array($raw)) {
            return $vars;
        }
        foreach ($raw as $key => $value) {
            if (count($vars) >= $maxVars) {
                break;
            }
            if (!is_string($key) || !preg_match('/^[a-zA-Z0-9_]{1,40}$/', $key)) {
                continue;
            }
            if (is_bool($value)) {
                $value = $value ? 'sí' : 'no';
            }
            if (!is_scalar($value)) {
                continue;
            }
            $vars[$key] = self::truncate(trim((string) $value), $maxChars);
        }
        return $vars;
    }

    public static function truncate(string $text, int $maxChars): string
    {
        if ($maxChars <= 0 || mb_strlen($text, 'UTF-8') <= $maxChars) {
            return $text;
        }
        return rtrim(mb_substr($text, 0, $maxChars, 'UTF-8')) . '…';
    }

    /**
     * Prompt de sistema completo: hoja del narrador (si corresponde) + prompt + contrato de salida.
     * @param array{kind: string, body: string, params: array<string, mixed>} $prompt
     * @param array<string, string> $vars
     */
    public function system(array $prompt, array $vars, string $contract = ''): string
    {
        $parts = [];
        $useBase = !array_key_exists('use_base', $prompt['params']) || $prompt['params']['use_base'] !== false;
        if ($prompt['kind'] !== 'base' && $useBase) {
            $base = $this->prompts->active(self::BASE_KEY);
            if ($base !== null) {
                $parts[] = self::fill($base['body'], $vars);
            }
        }
        $parts[] = self::fill($prompt['body'], $vars);
        if ($contract !== '') {
            $parts[] = $contract;
        }
        return implode("\n\n", $parts);
    }

    /** Contrato JSON de los modos chat (lo agrega el servidor: no se puede editar desde el admin) */
    public static function chatContract(int $maxReplyChars): string
    {
        return 'FORMATO DE RESPUESTA (obligatorio): responde SOLO con un objeto json válido, sin texto fuera de él, con esta forma exacta: '
            . '{"reply": "lo que dices, máximo ' . $maxReplyChars . ' caracteres", "score": número entero de 0 a 100, "done": true o false}';
    }
}
