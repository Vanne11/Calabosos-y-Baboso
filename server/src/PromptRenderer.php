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

    /**
     * Tonos que la IA puede marcar en su respuesta. El juego los convierte en un efecto de sonido
     * (burla → risa, incomodo → grillos...). Lista cerrada: cualquier otro valor se descarta.
     */
    const TONES = ['neutral', 'burla', 'chiste', 'incomodo', 'enojo', 'impresionado', 'asco', 'miedo', 'ternura', 'triste', 'drama'];

    /** Tono válido o null */
    public static function normalizeTone($value): ?string
    {
        if (!is_string($value)) {
            return null;
        }
        $tone = strtolower(trim($value));
        $tone = strtr($tone, ['ó' => 'o', 'í' => 'i', 'é' => 'e', 'á' => 'a', 'ú' => 'u']);
        return in_array($tone, self::TONES, true) ? $tone : null;
    }

    private static function toneGuide(): string
    {
        return '"tono": el tono emocional de tu respuesta, uno de: ' . implode(', ', self::TONES)
            . ' (burla = te ríes de alguien; chiste = remate de un chiste; incomodo = silencio incómodo; '
            . 'drama = momento dramático o amenazante; usa "neutral" si ninguno encaja)';
    }

    /** Contrato JSON de los modos chat (lo agrega el servidor: no se puede editar desde el admin) */
    public static function chatContract(int $maxReplyChars): string
    {
        return 'FORMATO DE RESPUESTA (obligatorio): responde SOLO con un objeto json válido, sin texto fuera de él, con esta forma exacta: '
            . '{"reply": "lo que dices, máximo ' . $maxReplyChars . ' caracteres", "score": número entero de 0 a 100, "done": true o false, '
            . '"tono": "..."}. ' . self::toneGuide() . '.';
    }

    /** Contrato JSON de las líneas del narrador */
    public static function narrateContract(int $maxChars): string
    {
        return 'FORMATO DE RESPUESTA (obligatorio): responde SOLO con un objeto json válido, sin texto fuera de él, con esta forma exacta: '
            . '{"line": "la línea, máximo ' . $maxChars . ' caracteres", "tono": "..."}. ' . self::toneGuide() . '.';
    }
}
