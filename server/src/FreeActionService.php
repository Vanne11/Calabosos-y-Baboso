<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Acción libre en una decisión: el jugador escribe lo que quiere hacer y la IA lo interpreta.
 * Puede elegir una de las opciones del juego o una consecuencia de la lista que manda el juego
 * (o ninguna). El servidor valida ambas: la IA nunca inventa opciones ni efectos.
 */
final class FreeActionService
{
    /** Máximo de opciones y consecuencias que acepta un pedido */
    const MAX_OPTIONS = 8;
    const MAX_CONSEQUENCES = 10;
    const MAX_ITEM_CHARS = 200;
    /** Tokens extra para el envoltorio json */
    const JSON_TOKENS = 60;

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
     * @param mixed $rawOptions lista de textos de las opciones visibles
     * @param mixed $rawConsequences objeto id → descripción
     * @return array{text: string, tone: ?string, option: ?int, consequence: ?string}
     */
    public function interpret(string $sessionId, string $name, $rawVars, string $action, $rawOptions, $rawConsequences): array
    {
        if (!$this->settings->get('free_action_enabled')) {
            throw new ApiException(503, 'mode_disabled', 'Acción libre desactivada');
        }
        if (!preg_match('/^[a-z0-9_]{1,40}$/', $name)) {
            throw new ApiException(400, 'bad_prompt', 'Prompt inválido');
        }
        $action = trim(str_replace(["\r\n", "\r"], "\n", $action));
        if ($action === '') {
            throw new ApiException(400, 'empty_message', 'Acción vacía');
        }
        $action = PromptRenderer::truncate($action, $this->settings->limit('max_input_chars'));
        $options = self::sanitizeOptions($rawOptions);
        $consequences = self::sanitizeConsequences($rawConsequences);

        $repo = new PromptRepository($this->db);
        $key = 'libre.' . $name;
        $prompt = $repo->active($key);
        if ($prompt === null || $prompt['kind'] !== 'libre') {
            throw new ApiException(404, 'unknown_prompt', 'Prompt desconocido');
        }
        if (!$this->guard->hasBudget($sessionId)) {
            throw new ApiException(429, 'budget_exceeded', 'Presupuesto de IA agotado por hoy');
        }

        $vars = PromptRenderer::sanitizeVars(
            $rawVars,
            $this->settings->limit('max_vars'),
            $this->settings->limit('max_var_chars'),
            $this->settings->limit('max_context_chars')
        );
        $vars['opciones'] = self::listOptions($options);
        $vars['consecuencias'] = self::listConsequences($consequences);
        $params = $prompt['params'];
        $maxChars = (int) ($params['max_chars'] ?? 400);
        $system = (new PromptRenderer($repo))->system($prompt, $vars, PromptRenderer::freeActionContract($maxChars));

        try {
            $result = $this->ai->chat(
                (string) $this->settings->get('model'),
                [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user', 'content' => $action],
                ],
                (float) ($params['temperature'] ?? 1.0),
                (int) ($params['max_tokens'] ?? 200) + self::JSON_TOKENS,
                true
            );
            $parsed = self::parseReply($result->content, $maxChars, count($options), array_keys($consequences));
        } catch (AiException $e) {
            $this->guard->recordError($sessionId, 'libre', $key, $e->getMessage());
            throw new ApiException(502, 'ai_unavailable', 'La IA no respondió');
        }
        $this->guard->recordUsage($sessionId, 'libre', $key, $result);
        return $parsed;
    }

    /**
     * Interpreta y valida la respuesta: opción 1..N (devuelve el índice desde 0) o consecuencia de la lista.
     * Si viene una opción válida, la consecuencia se ignora.
     * @param array<int, string> $consequenceIds
     * @return array{text: string, tone: ?string, option: ?int, consequence: ?string}
     */
    public static function parseReply(string $content, int $maxChars, int $optionCount, array $consequenceIds): array
    {
        $data = json_decode($content, true);
        if (!is_array($data) && preg_match('/\{.*\}/s', $content, $m)) {
            $data = json_decode($m[0], true);
        }
        if (!is_array($data)) {
            throw new AiException('Respuesta del modelo sin el formato esperado');
        }
        $line = $data['line'] ?? ($data['text'] ?? ($data['reply'] ?? null));
        if (!is_string($line) || trim($line) === '') {
            throw new AiException('Respuesta del modelo sin "line"');
        }
        $option = null;
        if (isset($data['option']) && is_numeric($data['option'])) {
            $n = (int) $data['option'];
            $option = $n >= 1 && $n <= $optionCount ? $n - 1 : null;
        }
        $consequence = null;
        if ($option === null && isset($data['consequence']) && is_string($data['consequence'])) {
            $id = strtolower(trim($data['consequence']));
            $consequence = in_array($id, $consequenceIds, true) ? $id : null;
        }
        return [
            'text' => NarrateService::cleanLine($line, $maxChars),
            'tone' => PromptRenderer::normalizeTone($data['tono'] ?? ($data['tone'] ?? null)),
            'option' => $option,
            'consequence' => $consequence,
        ];
    }

    /**
     * @param mixed $raw
     * @return array<int, string>
     */
    public static function sanitizeOptions($raw): array
    {
        $out = [];
        if (!is_array($raw)) {
            return $out;
        }
        foreach ($raw as $text) {
            if (count($out) >= self::MAX_OPTIONS) {
                break;
            }
            if (is_scalar($text) && trim((string) $text) !== '') {
                $out[] = PromptRenderer::truncate(trim((string) $text), self::MAX_ITEM_CHARS);
            }
        }
        return $out;
    }

    /**
     * @param mixed $raw
     * @return array<string, string>
     */
    public static function sanitizeConsequences($raw): array
    {
        $out = [];
        if (!is_array($raw)) {
            return $out;
        }
        foreach ($raw as $id => $hint) {
            if (count($out) >= self::MAX_CONSEQUENCES) {
                break;
            }
            if (is_string($id) && preg_match('/^[a-z0-9_]{1,30}$/', $id) && is_scalar($hint)) {
                $out[$id] = PromptRenderer::truncate(trim((string) $hint), self::MAX_ITEM_CHARS);
            }
        }
        return $out;
    }

    /** @param array<int, string> $options */
    public static function listOptions(array $options): string
    {
        $lines = [];
        foreach ($options as $i => $text) {
            $lines[] = ($i + 1) . '. ' . $text;
        }
        return $lines ? implode("\n", $lines) : '(ninguna)';
    }

    /** @param array<string, string> $consequences */
    public static function listConsequences(array $consequences): string
    {
        $lines = [];
        foreach ($consequences as $id => $hint) {
            $lines[] = '- ' . $id . ': ' . $hint;
        }
        return $lines ? implode("\n", $lines) : '(ninguna: si no es una opción, no pasa nada)';
    }
}
