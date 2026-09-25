<?php
// Helpers globales de las vistas del admin.

/** Escapar para HTML */
function e($value): string
{
    return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** URL interna del admin */
function url(string $page, array $query = []): string
{
    return '?' . http_build_query(array_merge(['p' => $page], $query));
}

/** Número con separador de miles */
function num($value): string
{
    return number_format((int) $value, 0, ',', '.');
}
