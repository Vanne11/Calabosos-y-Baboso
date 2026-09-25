<h1>Prompts</h1>
<p class="muted">Cada edición crea una versión nueva. El juego usa siempre la versión activa. La <strong>hoja del narrador</strong> se antepone a todos los demás.</p>
<?php
$kinds = ['base' => 'Base', 'narrate' => 'Narración', 'chat' => 'Modos chat'];
foreach ($kinds as $kind => $label):
    $group = array_filter($prompts, static function ($p) use ($kind) { return $p['kind'] === $kind; });
    if (!$group) { continue; }
?>
<section class="card">
  <h2><?= e($label) ?></h2>
  <table>
    <thead><tr><th>Prompt</th><th>Clave</th><th class="num">Versiones</th><th>Actualizado</th></tr></thead>
    <tbody>
    <?php foreach ($group as $p): ?>
      <tr>
        <td><a href="<?= e(url('prompt', ['key' => $p['key']])) ?>"><?= e($p['title']) ?></a><br><span class="muted small"><?= e($p['description']) ?></span></td>
        <td><code><?= e($p['key']) ?></code></td>
        <td class="num"><?= num($p['versions']) ?></td>
        <td class="small"><?= e(substr((string) $p['updated_at'], 0, 16)) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
</section>
<?php endforeach; ?>
