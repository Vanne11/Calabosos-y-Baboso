<section class="login card">
  <h1>🐌 Admin</h1>
  <p class="muted">Calabosos y Babosos</p>
  <?php if (!empty($cookieWillFail)): ?><p class="error">Tu sitio usa <strong>http://</strong> pero <code>secure_cookie</code> está en <code>true</code>: el navegador no guardará la sesión. Activa HTTPS o pon <code>'secure_cookie' => false</code> en config.php.</p><?php endif; ?>
  <?php if ($error !== ''): ?><p class="error"><?= e($error) ?></p><?php endif; ?>
  <form method="post" action="<?= e(url('login')) ?>">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <label>Usuario <input name="username" autocomplete="username" required autofocus></label>
    <label>Contraseña <input name="password" type="password" autocomplete="current-password" required></label>
    <button class="primary">Entrar</button>
  </form>
</section>
