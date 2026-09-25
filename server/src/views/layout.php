<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin · Calabosos y Babosos</title>
<link rel="stylesheet" href="admin.css">
</head>
<body>
<?php if (!empty($user)): ?>
<header class="top">
  <strong class="brand">🐌 Calabosos · Admin</strong>
  <nav>
    <?php foreach (['dashboard' => 'Panel', 'prompts' => 'Prompts', 'settings' => 'Ajustes', 'chats' => 'Conversaciones', 'logs' => 'Registro'] as $p => $label): ?>
      <a href="<?= e(url($p)) ?>" class="<?= ($page ?? '') === $p || (($page ?? '') === 'prompt' && $p === 'prompts') || (($page ?? '') === 'chat' && $p === 'chats') ? 'active' : '' ?>"><?= e($label) ?></a>
    <?php endforeach; ?>
  </nav>
  <form method="post" action="<?= e(url('logout')) ?>" class="logout">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <span class="muted"><?= e($user) ?></span>
    <button class="link">Salir</button>
  </form>
</header>
<?php endif; ?>
<main>
<?php if (!empty($flash)): ?><p class="flash"><?= e($flash) ?></p><?php endif; ?>
<?= $content ?>
</main>
</body>
</html>
