<?php

declare(strict_types=1);

namespace Cyb;

/** Plantillas PHP simples del admin (src/views), siempre dentro de layout.php */
final class View
{
    /** @param array<string, mixed> $vars */
    public static function render(string $template, array $vars = []): void
    {
        $file = __DIR__ . '/views/' . $template . '.php';
        extract($vars, EXTR_SKIP);
        ob_start();
        require $file;
        $content = (string) ob_get_clean();
        require __DIR__ . '/views/layout.php';
    }

    public static function url(string $page, array $query = []): string
    {
        return \url($page, $query);
    }

    public static function json(array $value): string
    {
        return (string) json_encode((object) $value, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    }
}
