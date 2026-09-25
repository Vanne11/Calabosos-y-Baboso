<?php
// Copia este archivo como config.php (junto a este) y completa los valores.
// config.php NUNCA se sube al repo (está en .gitignore).
// Si puedes, deja la carpeta server/ fuera del webroot y publica solo server/public/.

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

    // Sal para anonimizar IPs (cámbiala por cualquier texto largo y aleatorio)
    'ip_salt' => 'cambia-esto-por-algo-largo-y-aleatorio',

    'admin' => [
        // true si el admin se sirve por HTTPS (recomendado)
        'secure_cookie' => true,
    ],
];
