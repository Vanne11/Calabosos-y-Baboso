<section class="login card">
  <h1>🐌 Instalación</h1>
  <p class="muted">Un solo paso: crea tu usuario del panel y, si ya la tienes, pega tu key de DeepSeek.</p>

  <?php if ($error !== ''): ?><p class="error"><?= e($error) ?></p><?php endif; ?>
  <form method="post" action="<?= e(url('setup')) ?>">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <label>Usuario <input name="username" value="<?= e($username) ?>" autocomplete="username" required autofocus></label>
    <label>Contraseña <span class="muted small">(mínimo 12 caracteres)</span> <input name="password" type="password" autocomplete="new-password" minlength="12" required></label>
    <label>Repite la contraseña <input name="password2" type="password" autocomplete="new-password" minlength="12" required></label>
    <label>Key de DeepSeek <span class="muted small"><?= $hasKey ? '(ya hay una guardada; déjalo vacío para conservarla)' : '(opcional: también puedes ponerla después en Ajustes)' ?></span>
      <input name="api_key" type="password" autocomplete="off" placeholder="sk-...">
    </label>
    <button class="primary">Instalar</button>
  </form>
  <p class="muted small">Esta pantalla aparece solo una vez: desaparece en cuanto existe tu usuario.</p>
</section>
