<h1>Registro de IA</h1>
<p class="filters">
  <a href="<?= e(url('logs')) ?>" class="<?= !$onlyErrors ? 'active' : '' ?>">Todo</a>
  <a href="<?= e(url('logs', ['errors' => 1])) ?>" class="<?= $onlyErrors ? 'active' : '' ?>">Solo errores</a>
</p>
<section class="card">
  <?php if (!$logs): ?><p class="muted">Sin registros.</p><?php else: ?>
  <table>
    <thead><tr><th>Fecha</th><th>Tipo</th><th>Prompt</th><th class="num">Tokens</th><th class="num">ms</th><th>Error</th></tr></thead>
    <tbody>
    <?php foreach ($logs as $l): ?>
      <tr class="<?= $l['error'] !== null ? 'row-error' : '' ?>">
        <td class="small"><?= e(substr((string) $l['created_at'], 0, 19)) ?></td>
        <td><?= e($l['kind']) ?></td>
        <td><code class="small"><?= e($l['prompt_key']) ?></code></td>
        <td class="num"><?= num((int) $l['tokens_in'] + (int) $l['tokens_out']) ?></td>
        <td class="num"><?= num($l['latency_ms']) ?></td>
        <td class="small"><?= e($l['error']) ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>
