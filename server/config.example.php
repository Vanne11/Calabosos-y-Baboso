<?php
// NO HACE FALTA crear este archivo a mano: al abrir /cyb/api/admin/ por primera vez,
// el instalador web crea config.php solo (y la key de DeepSeek se cambia en Ajustes).
// Úsalo solo si instalas por consola o si tu hosting no deja escribir archivos:
// cópialo como config.php (junto a este) y completa los valores.
// config.php NUNCA se sube al repo (está en .gitignore).

return [
    // Archivo SQLite (se crea solo). La carpeta debe ser escribible por PHP.
    'db_path' => __DIR__ . '/data/cyb.sqlite',

    'deepseek' => [
        'api_key'  => '',                          // ← tu key de DeepSeek
        'base_url' => 'https://api.deepseek.com',
        'timeout'  => 20,                          // segundos
        // true = respuestas falsas sin llamar a DeepSeek (desarrollo y pruebas)
        'mock'     => false,
    ],

    // Orígenes permitidos para CORS. Vacío = solo el mismo origen (juego y API en el mismo dominio).
    // Ejemplo durante desarrollo: ['http://127.0.0.1:5173']
    'allowed_origins' => [],

    // Sal para anonimizar IPs: un texto largo y aleatorio (el instalador la genera sola)
    'ip_salt' => '',

    'admin' => [
        // Cookie segura: si no se indica, se decide sola (segura cuando el sitio usa HTTPS).
        // 'secure_cookie' => true,
    ],
];
