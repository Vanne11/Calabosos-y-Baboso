<?php

declare(strict_types=1);

namespace Cyb;

/** Resultado de una llamada al modelo */
final class AiResult
{
    /** @var string */
    public $content;
    /** @var int */
    public $tokensIn;
    /** @var int */
    public $tokensOut;
    /** @var int */
    public $latencyMs;

    public function __construct(string $content, int $tokensIn, int $tokensOut, int $latencyMs)
    {
        $this->content = $content;
        $this->tokensIn = $tokensIn;
        $this->tokensOut = $tokensOut;
        $this->latencyMs = $latencyMs;
    }
}
