<section class="card">
  <h1><?= ($ctx ?? '') === 'setup' ? '✔ Usuario creado · falta un paso' : 'Falta un paso' ?></h1>
  <p class="error">El hosting no deja que el panel guarde <code>config.php</code>.</p>
  <p>Tienes dos opciones:</p>
  <ol>
    <li><strong>Fácil:</strong> desde tu cliente FTP dale permisos de escritura (775, o 777 si tu hosting lo exige) a la carpeta <code>cyb/api/</code> y vuelve a guardar en <a href="<?= e(url('settings')) ?>">Ajustes</a>.</li>
    <li><strong>A mano:</strong> crea en tu PC un archivo <code>config.php</code> con este contenido y súbelo a <code>cyb/api/</code>:</li>
  </ol>
  <textarea class="mono" rows="22" readonly><?= e($content) ?></textarea>
  <p class="muted small">Contiene tu key: no lo compartas ni lo subas a un repositorio.</p>
  <div class="actions"><a href="<?= e(url('diagnostics')) ?>">Ir al diagnóstico →</a></div>
</section>
