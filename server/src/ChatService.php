<?php

declare(strict_types=1);

namespace Cyb;

/**
 * Modos chat: el jugador escribe libremente y un NPC responde.
 * El historial vive en el servidor (el cliente solo manda su mensaje nuevo),
 * y el veredicto se calcula aquí a partir del puntaje, nunca lo decide el cliente.
 */
final class ChatService
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

    /** Largo máximo del recuerdo que devuelve la IA al terminar */
    const MEMORY_CHARS = 200;

    /**
     * @param mixed $rawVars
     * @param mixed $rawGestures gestos que el NPC puede hacer: id → cuándo (el juego define sus efectos)
     * @return array<string, mixed>
     */
    public function start(string $sessionId, string $game, string $mode, string $npc, $rawVars, int $requestedTurns, $rawGestures = []): array
    {
        if (!in_array($mode, Settings::MODES, true)) {
            throw new ApiException(400, 'bad_mode', 'Modo desconocido');
        }
        if (!$this->settings->modeEnabled($mode)) {
            throw new ApiException(503, 'mode_disabled', 'Este modo está desactivado');
        }
        $repo = new PromptRepository($this->db);
        $prompt = $repo->active('chat.' . $mode);
        if ($prompt === null) {
            throw new ApiException(404, 'unknown_prompt', 'Prompt del modo no encontrado');
        }

        $params = $prompt['params'];
        $cap = $this->settings->limit('max_turns_cap');
        $turns = $requestedTurns > 0 ? $requestedTurns : (int) ($params['max_turns'] ?? 6);
        $turns = max(1, min($turns, $cap));
        $vars = PromptRenderer::sanitizeVars(
            $rawVars,
            $this->settings->limit('max_vars'),
            $this->settings->limit('max_var_chars'),
            $this->settings->limit('max_context_chars')
        );

        $gestures = FreeActionService::sanitizeConsequences($rawGestures);

        $id = bin2hex(random_bytes(16));
        $now = gmdate('c');
        $this->db->run(
            'INSERT INTO chats (id, session_id, game, mode, npc, prompt_key, prompt_version, vars, gestures, max_turns, score, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                $id, $sessionId, $game, $mode, mb_substr($npc, 0, 40, 'UTF-8'), $prompt['key'], $prompt['version'],
                json_encode((object) $vars, JSON_UNESCAPED_UNICODE), json_encode((object) $gestures, JSON_UNESCAPED_UNICODE), $turns,
                self::clampScore((int) ($params['initial_score'] ?? 0)), $now, $now,
            ]
        );

        return [
            'chatId' => $id,
            'maxTurns' => $turns,
            'turnsLeft' => $turns,
            'score' => self::clampScore((int) ($params['initial_score'] ?? 0)),
            'maxInputChars' => $this->settings->limit('max_input_chars'),
        ];
    }

    /** @return array<string, mixed> */
    public function say(string $sessionId, string $chatId, string $message): array
    {
        $chat = $this->loadChat($sessionId, $chatId);
        if ((int) $chat['done'] === 1) {
            throw new ApiException(409, 'chat_done', 'La conversación ya terminó');
        }
        $message = trim(str_replace(["\r\n", "\r"], "\n", $message));
        if ($message === '') {
            throw new ApiException(400, 'empty_message', 'Mensaje vacío');
        }
        $message = PromptRenderer::truncate($message, $this->settings->limit('max_input_chars'));
        if (!$this->guard->hasBudget($sessionId)) {
            throw new ApiException(429, 'budget_exceeded', 'Presupuesto de IA agotado por hoy');
        }

        $repo = new PromptRepository($this->db);
        $version = $repo->version((int) $chat['prompt_version']);
        $meta = $repo->find((string) $chat['prompt_key']);
        if ($version === null || $meta === null) {
            throw new ApiException(404, 'unknown_prompt', 'Prompt del modo no encontrado');
        }
        $params = json_decode((string) $version['params'], true);
        $params = is_array($params) ? $params : [];
        $prompt = ['key' => (string) $chat['prompt_key'], 'kind' => (string) $meta['kind'], 'body' => (string) $version['body'], 'params' => $params];

        $turn = (int) $chat['turn'] + 1;
        $maxTurns = (int) $chat['max_turns'];
        $prevScore = (int) $chat['score'];
        $maxReply = (int) ($params['max_reply_chars'] ?? 400);

        $vars = json_decode((string) $chat['vars'], true);
        $vars = is_array($vars) ? $vars : [];
        $vars['turn'] = (string) $turn;
        $vars['max_turns'] = (string) $maxTurns;
        $vars['score'] = (string) $prevScore;
        $vars['npc'] = (string) $chat['npc'];

        // Gestos que quedan: cada uno se puede hacer una sola vez por conversación
        $gestures = json_decode((string) ($chat['gestures'] ?? '{}'), true);
        $gestures = is_array($gestures) ? $gestures : [];
        $used = json_decode((string) ($chat['gestures_used'] ?? '[]'), true);
        $used = is_array($used) ? $used : [];
        $available = array_diff_key($gestures, array_flip($used));

        $system = (new PromptRenderer($repo))->system($prompt, $vars, PromptRenderer::chatContract($maxReply, $available));
        $messages = [['role' => 'system', 'content' => $system]];
        $history = json_decode((string) $chat['history'], true);
        $history = is_array($history) ? $history : [];
        foreach ($history as $entry) {
            $messages[] = [
                'role' => $entry['role'] === 'player' ? 'user' : 'assistant',
                'content' => (string) $entry['text'],
            ];
        }
        $messages[] = ['role' => 'user', 'content' => $message];

        try {
            $result = $this->ai->chat(
                (string) $this->settings->get('model'),
                $messages,
                (float) ($params['temperature'] ?? 1.0),
                (int) ($params['max_tokens'] ?? 350),
                true
            );
            $parsed = self::parseReply($result->content);
        } catch (AiException $e) {
            $this->guard->recordError($sessionId, 'chat', (string) $chat['prompt_key'], $e->getMessage());
            throw new ApiException(502, 'ai_unavailable', 'La IA no respondió');
        }
        $this->guard->recordUsage($sessionId, 'chat', (string) $chat['prompt_key'], $result);

        $reply = PromptRenderer::truncate($parsed['reply'], $maxReply);
        // El puntaje no puede saltar más de max_step por turno (protege contra "dame 100")
        $maxStep = max(1, (int) ($params['max_step'] ?? 35));
        $score = self::clampScore(max($prevScore - $maxStep, min($prevScore + $maxStep, $parsed['score'])));

        $hasVerdict = !array_key_exists('verdict', $params) || $params['verdict'] !== false;
        $successAt = (int) ($params['success_at'] ?? 70);
        $partialAt = (int) ($params['partial_at'] ?? 40);
        $done = $turn >= $maxTurns || ($parsed['done'] && $turn >= 1);
        // Por defecto, alcanzar el umbral de éxito termina la conversación.
        // Modos que deben jugarse completos (canción, rap) usan early_success: false.
        $earlySuccess = !array_key_exists('early_success', $params) || $params['early_success'] !== false;
        if ($hasVerdict && $earlySuccess && $score >= $successAt) {
            $done = true;
        }
        $verdict = null;
        if ($done && $hasVerdict) {
            $verdict = $score >= $successAt ? 'success' : ($score >= $partialAt ? 'partial' : 'failure');
        }

        $gesture = $parsed['gesture'] !== null && isset($available[$parsed['gesture']]) ? $parsed['gesture'] : null;
        if ($gesture !== null) {
            $used[] = $gesture;
        }
        $memory = $done && $parsed['memory'] !== '' ? PromptRenderer::truncate($parsed['memory'], self::MEMORY_CHARS) : null;

        $history[] = ['role' => 'player', 'text' => $message];
        $history[] = ['role' => 'npc', 'text' => $reply] + ($gesture !== null ? ['gesture' => $gesture] : []);
        $this->db->run(
            'UPDATE chats SET turn = ?, score = ?, done = ?, verdict = ?, history = ?, gestures_used = ?, updated_at = ? WHERE id = ?',
            [$turn, $score, $done ? 1 : 0, $verdict, json_encode($history, JSON_UNESCAPED_UNICODE), json_encode($used), gmdate('c'), $chatId]
        );

        return [
            'reply' => $reply,
            'score' => $score,
            'done' => $done,
            'verdict' => $verdict,
            'turn' => $turn,
            'turnsLeft' => max(0, $maxTurns - $turn),
            'tone' => $parsed['tone'],
            'gesture' => $gesture,
            'memory' => $memory,
            'lineId' => AiLines::record($this->db, $sessionId, 'chat', (string) $chat['prompt_key'], (int) $chat['prompt_version'], $reply),
        ];
    }

    /**
     * El jugador se rinde (/rendirse): fracaso inmediato.
     * @return array<string, mixed>
     */
    public function giveUp(string $sessionId, string $chatId): array
    {
        $chat = $this->loadChat($sessionId, $chatId);
        $params = [];
        $version = (new PromptRepository($this->db))->version((int) $chat['prompt_version']);
        if ($version !== null) {
            $decoded = json_decode((string) $version['params'], true);
            $params = is_array($decoded) ? $decoded : [];
        }
        $hasVerdict = !array_key_exists('verdict', $params) || $params['verdict'] !== false;
        $verdict = $hasVerdict ? 'failure' : null;
        $this->db->run(
            'UPDATE chats SET done = 1, verdict = ?, updated_at = ? WHERE id = ?',
            [$verdict, gmdate('c'), $chatId]
        );
        return ['done' => true, 'verdict' => $verdict, 'score' => (int) $chat['score']];
    }

    /** @return array<string, mixed> */
    private function loadChat(string $sessionId, string $chatId): array
    {
        if (!preg_match('/^[a-f0-9]{32}$/', $chatId)) {
            throw new ApiException(400, 'bad_chat', 'chatId inválido');
        }
        $chat = $this->db->one('SELECT * FROM chats WHERE id = ?', [$chatId]);
        if ($chat === null || !hash_equals((string) $chat['session_id'], $sessionId)) {
            throw new ApiException(404, 'unknown_chat', 'Conversación no encontrada');
        }
        return $chat;
    }

    private static function clampScore(int $score): int
    {
        return max(0, min(100, $score));
    }

    /**
     * Interpreta la respuesta JSON del modelo (tolera texto o bloques ``` alrededor).
     * @return array{reply: string, score: int, done: bool, tone: ?string, gesture: ?string, memory: string}
     */
    public static function parseReply(string $content): array
    {
        $data = json_decode($content, true);
        if (!is_array($data) && preg_match('/\{.*\}/s', $content, $m)) {
            $data = json_decode($m[0], true);
        }
        if (!is_array($data) || !isset($data['reply']) || !is_string($data['reply']) || trim($data['reply']) === '') {
            throw new AiException('Respuesta del modelo sin el formato esperado');
        }
        $score = $data['score'] ?? 0;
        return [
            'reply' => trim($data['reply']),
            'score' => is_numeric($score) ? (int) round((float) $score) : 0,
            'done' => !empty($data['done']),
            'tone' => PromptRenderer::normalizeTone($data['tono'] ?? ($data['tone'] ?? null)),
            'gesture' => isset($data['gesto']) && is_string($data['gesto']) && trim($data['gesto']) !== '' ? strtolower(trim($data['gesto'])) : null,
            'memory' => isset($data['recuerdo']) && is_string($data['recuerdo']) ? trim($data['recuerdo']) : '',
        ];
    }
}
