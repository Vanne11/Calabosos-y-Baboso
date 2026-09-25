<h1>Panel</h1>

<section class="card status <?= $aiEnabled ? 'on' : 'off' ?>">
  <div>
    <h2><?= $aiEnabled ? '🟢 IA activa' : '🔴 IA apagada' ?></h2>
    <p class="muted">
      <?= $aiEnabled ? 'El juego usa DeepSeek para narración y modos chat.' : 'El juego usa solo los textos fijos y los dados como alternativa.' ?>
      <?php if ($mock): ?><br><strong>Modo mock:</strong> no se llama a DeepSeek (respuestas de prueba).<?php endif; ?>
      <?php if (!$mock && !$hasKey): ?><br><strong class="error-text">Falta la API key en config.php.</strong><?php endif; ?>
    </p>
  </div>
  <form method="post" action="<?= e(url('toggle_ai')) ?>">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <button class="<?= $aiEnabled ? 'danger' : 'primary' ?>"><?= $aiEnabled ? 'Apagar IA' : 'Encender IA' ?></button>
  </form>
</section>

<?php
$used = (int) ($today['tokens_in'] ?? 0) + (int) ($today['tokens_out'] ?? 0);
$budget = max(1, (int) ($limits['global_tokens_per_day'] ?? 1));
$pct = min(100, (int) round($used * 100 / $budget));
?>
<section class="tiles">
  <div class="tile"><span class="label">Peticiones hoy</span><span class="value"><?= num($today['requests'] ?? 0) ?></span></div>
  <div class="tile"><span class="label">Tokens hoy</span><span class="value"><?= num($used) ?></span><span class="muted"><?= $pct ?>% del presupuesto diario</span></div>
  <div class="tile"><span class="label">Errores hoy</span><span class="value"><?= num($today['errors'] ?? 0) ?></span></div>
  <div class="tile"><span class="label">Jugadores hoy</span><span class="value"><?= num($sessionsToday) ?></span></div>
  <div class="tile"><span class="label">Conversaciones hoy</span><span class="value"><?= num($chatsToday) ?></span></div>
</section>
<progress class="meter" max="100" value="<?= $pct ?>"><?= $pct ?>%</progress>

<section class="card">
  <h2>Últimos 14 días</h2>
  <?php if (!$days): ?><p class="muted">Todavía no hay uso registrado.</p><?php else: ?>
  <table>
    <thead><tr><th>Día (UTC)</th><th class="num">Peticiones</th><th class="num">Tokens entrada</th><th class="num">Tokens salida</th><th class="num">Errores</th></tr></thead>
    <tbody>
    <?php foreach ($days as $d): ?>
      <tr><td><?= e($d['day']) ?></td><td class="num"><?= num($d['requests']) ?></td><td class="num"><?= num($d['tokens_in']) ?></td><td class="num"><?= num($d['tokens_out']) ?></td><td class="num"><?= num($d['errors']) ?></td></tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>

<?php if ($errors): ?>
<section class="card">
  <h2>Errores recientes</h2>
  <ul class="plain">
  <?php foreach ($errors as $err): ?>
    <li><span class="muted"><?= e($err['created_at']) ?> · <?= e($err['prompt_key']) ?></span><br><?= e($err['error']) ?></li>
  <?php endforeach; ?>
  </ul>
  <a href="<?= e(url('logs', ['errors' => 1])) ?>">Ver todos los errores →</a>
</section>
<?php endif; ?>
