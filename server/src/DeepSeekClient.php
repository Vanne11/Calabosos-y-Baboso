<?php

declare(strict_types=1);

namespace Cyb;

/** Cliente de la API de DeepSeek (compatible con OpenAI: /chat/completions) */
final class DeepSeekClient
{
    /** @var string */
    private $apiKey;
    /** @var string */
    private $baseUrl;
    /** @var int */
    private $timeout;
    /** @var bool */
    private $mock;

    public function __construct(string $apiKey, string $baseUrl, int $timeout, bool $mock)
    {
        $this->apiKey = $apiKey;
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->timeout = max(3, $timeout);
        $this->mock = $mock;
    }

    public static function fromConfig(): self
    {
        return new self(
            (string) App::config('deepseek.api_key', ''),
            (string) App::config('deepseek.base_url', 'https://api.deepseek.com'),
            (int) App::config('deepseek.timeout', 20),
            (bool) App::config('deepseek.mock', false)
        );
    }

    /**
     * @param array<int, array{role: string, content: string}> $messages
     */
    public function chat(string $model, array $messages, float $temperature, int $maxTokens, bool $json): AiResult
    {
        if ($this->mock) {
            return $this->mockResponse($messages, $json);
        }
        if ($this->apiKey === '') {
            throw new AiException('Falta la key de DeepSeek (ponla en el panel: Ajustes)');
        }
        if (!function_exists('curl_init')) {
            throw new AiException('PHP no tiene la extensión curl');
        }

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'temperature' => max(0.0, min(2.0, $temperature)),
            'max_tokens' => max(16, min(4000, $maxTokens)),
            'stream' => false,
        ];
        if ($json) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $start = microtime(true);
        $ch = curl_init($this->baseUrl . '/chat/completions');
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->apiKey,
            ],
            CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        ]);
        $raw = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        if (PHP_VERSION_ID < 80000) {
            curl_close($ch); // desde PHP 8 no hace nada y en 8.5 está obsoleta
        }
        $latency = (int) round((microtime(true) - $start) * 1000);

        if ($raw === false || $curlError !== '') {
            throw new AiException('Error de red con DeepSeek: ' . $curlError);
        }
        $data = json_decode((string) $raw, true);
        if ($status !== 200 || !is_array($data)) {
            $detail = is_array($data) && isset($data['error']['message']) ? $data['error']['message'] : substr((string) $raw, 0, 200);
            throw new AiException('DeepSeek respondió ' . $status . ': ' . $detail);
        }
        $content = $data['choices'][0]['message']['content'] ?? null;
        if (!is_string($content) || $content === '') {
            throw new AiException('DeepSeek devolvió una respuesta vacía');
        }
        return new AiResult(
            $content,
            (int) ($data['usage']['prompt_tokens'] ?? 0),
            (int) ($data['usage']['completion_tokens'] ?? 0),
            $latency
        );
    }

    /** @param array<int, array{role: string, content: string}> $messages */
    private function mockResponse(array $messages, bool $json): AiResult
    {
        $last = end($messages);
        $said = is_array($last) ? (string) $last['content'] : '';
        $len = mb_strlen($said, 'UTF-8');
        $system = is_array($messages[0] ?? null) ? (string) $messages[0]['content'] : '';
        // Tono de prueba rotativo, para oír los sonidos sin gastar tokens
        $tone = PromptRenderer::TONES[$len % count(PromptRenderer::TONES)];
        if ($json && strpos($system, '"option"') !== false) {
            // Acción libre: cada tanto elige la opción 1; si no, la primera consecuencia de la lista
            preg_match('/^- ([a-z0-9_]+):/m', $system, $m);
            $content = json_encode([
                'option' => $len % 3 === 0 ? 1 : 0,
                'consequence' => $m[1] ?? '',
                'line' => '[mock] ¿«' . mb_substr($said, 0, 40, 'UTF-8') . '»? Qué idea tan tuya.',
                'tono' => $tone,
            ], JSON_UNESCAPED_UNICODE);
        } elseif ($json && strpos($system, '"line"') !== false) {
            $content = json_encode([
                'line' => '[mock] El narrador suspira: qué forma tan original de fracasar.',
                'tono' => $tone,
            ], JSON_UNESCAPED_UNICODE);
        } elseif ($json) {
            // Puntaje determinista según el largo del mensaje (para pruebas)
            $score = min(100, $len * 2);
            // Primer gesto disponible cuando el mensaje es largo (para probar los gestos sin gastar tokens)
            preg_match('/Gestos disponibles:\n- ([a-z0-9_]+):/', $system, $g);
            $content = json_encode([
                'reply' => '[mock] Escuché: "' . mb_substr($said, 0, 60, 'UTF-8') . '". No me convences del todo.',
                'score' => $score,
                'done' => false,
                'tono' => $tone,
                'gesto' => $len > 20 ? ($g[1] ?? '') : '',
                'recuerdo' => '[mock] BOB dijo "' . mb_substr($said, 0, 40, 'UTF-8') . '" y nadie aplaudió.',
            ], JSON_UNESCAPED_UNICODE);
        } else {
            $content = '[mock] El narrador suspira: qué forma tan original de fracasar.';
        }
        return new AiResult((string) $content, 100, 30, 5);
    }
}
