<?php
$icons = ['ok' => '✔', 'warn' => '⚠', 'fail' => '✘', 'info' => '·'];
$renderList = static function (array $items) use ($icons): void {
    foreach ($items as $c) {
        echo '<li class="diag ' . e($c['status']) . '"><span class="icon">' . $icons[$c['status']] . '</span><div><strong>' . e($c['label']) . '</strong>';
        if ($c['detail'] !== '') {
            echo '<br><span class="small">' . e($c['detail']) . '</span>';
        }
        echo '</div></li>';
    }
};
$fails = count(array_filter(array_merge($environment, $exposure), static function ($c) { return $c['status'] === 'fail'; }));
?>
<h1>Diagnóstico</h1>
<p class="<?= $fails ? 'error' : 'flash' ?>"><?= $fails ? "Hay $fails problema(s) que resolver." : 'Todo lo necesario está en orden.' ?></p>

<div class="grid">
  <section class="card">
    <h2>Servidor y configuración</h2>
    <ul class="plain diag-list"><?php $renderList($environment); ?></ul>
  </section>

  <section class="card">
    <h2>Seguridad de la instalación</h2>
    <p class="muted small">El servidor se pide a sí mismo estas rutas desde <code><?= e($apiRoot) ?></code>: lo privado debe responder 403 o 404.</p>
    <ul class="plain diag-list"><?php $renderList($exposure); ?></ul>
    <?php if ($tokenStillSet): ?>
      <p class="small muted">El <code>setup_token</code> sigue en config.php. Ya no sirve (existe un admin), así que puedes borrarlo.</p>
    <?php endif; ?>
  </section>
</div>

<section class="card">
  <h2>Probar DeepSeek</h2>
  <p class="muted small">Hace una llamada real y corta (gasta unos pocos tokens).</p>
  <?php if ($aiTest !== null): ?>
    <ul class="plain diag-list"><?php $renderList([$aiTest]); ?></ul>
  <?php endif; ?>
  <form method="post" action="<?= e(url('diagnostics')) ?>" class="actions">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="action" value="test_ai">
    <button class="primary">Probar ahora</button>
  </form>
</section>
