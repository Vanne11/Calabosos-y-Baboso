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
        // true si el sitio usa HTTPS (recomendado). Si tu sitio es http://, pon false o no podrás iniciar sesión.
        'secure_cookie' => true,
        // Código para crear el primer usuario desde la web (instalación por FTP).
        // Pon aquí un texto largo y aleatorio (mínimo 16 caracteres); se pide una sola vez en /cyb-api/admin/.
        // Cuando ya exista un admin, el formulario se desactiva solo (puedes borrar el código).
        'setup_token' => '',
    ],
];
