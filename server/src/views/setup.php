<section class="login card">
  <h1>🐌 Instalación</h1>
  <p class="muted">Crea el primer usuario del panel admin.</p>

  <?php if ($cookieWillFail): ?>
    <p class="error">Tu sitio usa <strong>http://</strong> pero <code>secure_cookie</code> está en <code>true</code> en config.php: el navegador no guardará la sesión y no podrás entrar. Activa HTTPS en el hosting (recomendado) o pon <code>'secure_cookie' => false</code>.</p>
  <?php endif; ?>

  <?php if (!$tokenReady): ?>
    <p class="error">Falta el código de instalación.</p>
    <p class="small">En <code>cyb-api/config.php</code>, dentro de <code>'admin'</code>, pon un texto largo y aleatorio (mínimo 16 caracteres):</p>
    <pre>'setup_token' => 'algo-largo-y-aleatorio-que-solo-tu-sepas',</pre>
    <p class="small">Sube el archivo de nuevo por FTP y recarga esta página. El código evita que otra persona cree el admin antes que tú.</p>
  <?php else: ?>
    <?php if ($error !== ''): ?><p class="error"><?= e($error) ?></p><?php endif; ?>
    <form method="post" action="<?= e(url('setup')) ?>">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <label>Código de instalación <span class="muted small">(el <code>setup_token</code> de config.php)</span>
        <input name="setup_token" type="password" autocomplete="off" required autofocus>
      </label>
      <label>Usuario <input name="username" value="<?= e($username) ?>" autocomplete="username" required></label>
      <label>Contraseña <span class="muted small">(mínimo 12 caracteres)</span> <input name="password" type="password" autocomplete="new-password" minlength="12" required></label>
      <label>Repite la contraseña <input name="password2" type="password" autocomplete="new-password" minlength="12" required></label>
      <button class="primary">Crear usuario y entrar</button>
    </form>
    <p class="muted small">Este formulario desaparece en cuanto exista un usuario.</p>
  <?php endif; ?>
</section>
