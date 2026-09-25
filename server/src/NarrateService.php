<?php

declare(strict_types=1);

namespace Cyb;

/** Líneas sueltas del narrador (burlas, reacciones, recaps) */
final class NarrateService
{
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

    /** @param mixed $rawVars */
    public function narrate(string $sessionId, string $name, $rawVars): string
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
        $system = (new PromptRenderer($repo))->system($prompt, $vars);

        try {
            $result = $this->ai->chat(
                (string) $this->settings->get('model'),
                [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => 'Escribe la línea ahora.'],
                ],
                (float) ($params['temperature'] ?? 1.0),
                (int) ($params['max_tokens'] ?? 150),
                false
            );
        } catch (AiException $e) {
            $this->guard->recordError($sessionId, 'narrate', $key, $e->getMessage());
            throw new ApiException(502, 'ai_unavailable', 'La IA no respondió');
        }
        $this->guard->recordUsage($sessionId, 'narrate', $key, $result);

        return self::cleanLine($result->content, (int) ($params['max_chars'] ?? 400));
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
