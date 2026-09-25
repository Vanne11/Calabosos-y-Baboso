<?php

declare(strict_types=1);

namespace Cyb;

/** Error controlado de la API: se responde con su código HTTP y código de error */
final class ApiException extends \RuntimeException
{
    /** @var int */
    public $status;
    /** @var string */
    public $errorCode;

    public function __construct(int $status, string $errorCode, string $message)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->errorCode = $errorCode;
    }
}
