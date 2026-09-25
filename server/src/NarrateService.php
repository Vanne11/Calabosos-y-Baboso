<?php

declare(strict_types=1);

namespace Cyb;

/** Líneas sueltas del narrador (burlas, reacciones, recaps) */
final class NarrateService
{
    /** Tokens extra que se piden para el formato json de la respuesta */
    const JSON_TOKENS = 40;

    /** @var Db */
    private $db;
    /** @var Settings */
    private $settings;
    /** @var Guard */
    private $guard;
    /** @var DeepSeekClient */
    private $ai;

    public function __construct(Db $db, Settings $settings, Guard $guard, DeepSeekClient $ai)
    {
        $this->db = $db;
        $this->settings = $settings;
        $this->guard = $guard;
        $this->ai = $ai;
    }

    /**
     * @param mixed $rawVars
     * @return array{text: string, tone: ?string}
     */
    public function narrate(string $sessionId, string $name, $rawVars): array
    {
        if (!$this->settings->get('narrate_enabled')) {
            throw new ApiException(503, 'mode_disabled', 'Narración con IA desactivada');
        }
        if (!preg_match('/^[a-z0-9_]{1,40}$/', $name)) {
            throw new ApiException(400, 'bad_prompt', 'Prompt inválido');
        }
        $repo = new PromptRepository($this->db);
        $key = 'narrate.' . $name;
        $prompt = $repo->active($key);
        if ($prompt === null || $prompt['kind'] !== 'narrate') {
            throw new ApiException(404, 'unknown_prompt', 'Prompt desconocido');
        }
        if (!$this->guard->hasBudget($sessionId)) {
            throw new ApiException(429, 'budget_exceeded', 'Presupuesto de IA agotado por hoy');
        }

        $vars = PromptRenderer::sanitizeVars(
            $rawVars,
            $this->settings->limit('max_vars'),
            $this->settings->limit('max_var_chars')
        );
        $params = $prompt['params'];
        $maxChars = (int) ($params['max_chars'] ?? 400);
        $system = (new PromptRenderer($repo))->system($prompt, $vars, PromptRenderer::narrateContract($maxChars));

        try {
            $result = $this->ai->chat(
                (string) $this->settings->get('model'),
                [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => 'Escribe la línea ahora.'],
                ],
                (float) ($params['temperature'] ?? 1.0),
                // Margen para el envoltorio json ({"line": ..., "tono": ...})
                (int) ($params['max_tokens'] ?? 150) + self::JSON_TOKENS,
                true
            );
        } catch (AiException $e) {
            $this->guard->recordError($sessionId, 'narrate', $key, $e->getMessage());
            throw new ApiException(502, 'ai_unavailable', 'La IA no respondió');
        }
        $this->guard->recordUsage($sessionId, 'narrate', $key, $result);

        return self::parseLine($result->content, $maxChars);
    }

    /**
     * Interpreta la respuesta del modelo: {"line", "tono"} en json; si no viene en json,
     * se toma el texto tal cual (sin tono) para no perder la línea.
     * @return array{text: string, tone: ?string}
     */
    public static function parseLine(string $content, int $maxChars): array
    {
        $data = json_decode($content, true);
        if (!is_array($data) && preg_match('/\{.*\}/s', $content, $m)) {
            $data = json_decode($m[0], true);
        }
        if (is_array($data)) {
            $line = $data['line'] ?? ($data['text'] ?? ($data['reply'] ?? null));
            if (is_string($line) && trim($line) !== '') {
                return [
                    'text' => self::cleanLine($line, $maxChars),
                    'tone' => PromptRenderer::normalizeTone($data['tono'] ?? ($data['tone'] ?? null)),
                ];
            }
        }
        if (trim($content) === '') {
            throw new AiException('Respuesta vacía del modelo');
        }
        // json cortado por el límite de tokens: rescatar el texto de "line"
        if (preg_match('/"line"\s*:\s*"((?:[^"\\\\]|\\\\.)*)/su', $content, $m)) {
            $decoded = json_decode('"' . $m[1] . '"');
            $line = is_string($decoded) ? $decoded : stripslashes($m[1]);
            if (trim($line) !== '') {
                return ['text' => self::cleanLine($line, $maxChars), 'tone' => null];
            }
        }
        return ['text' => self::cleanLine($content, $maxChars), 'tone' => null];
    }

    /** Quita comillas envolventes y espacios; recorta al largo máximo */
    public static function cleanLine(string $text, int $maxChars): string
    {
        $text = trim($text);
        $text = (string) preg_replace('/^["“«\']+|["”»\']+$/u', '', $text);
        $text = (string) preg_replace("/\n{3,}/", "\n\n", $text);
        return PromptRenderer::truncate(trim($text), $maxChars);
    }
}
