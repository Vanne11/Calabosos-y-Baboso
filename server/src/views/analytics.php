<?php
$pct = static function (int $n, int $total): string {
    return $total > 0 ? (string) round($n * 100 / $total) : '0';
};
$fmtMin = static function ($m): string {
    return $m === null ? '—' : number_format((float) $m, 1, ',', '.') . ' min';
};
$finalNames = [
    'final_heroico' => 'Celebración Heroica', 'final_nuevas_aventuras' => 'Nuevas Aventuras',
    'final_retiro' => 'Retiro Pacífico', 'final_secreto' => 'Final Secreto',
];
$diceNames = ['critical_success' => 'Crítico (20)', 'success' => 'Éxito', 'failure' => 'Fallo', 'critical_failure' => 'Pifia (1)'];
?>
<h1>Analítica</h1>

<form method="get" class="filters">
  <input type="hidden" name="p" value="analytics">
  <?php if (!$games): ?>
    <span class="muted">Todavía no hay eventos. Aparecen cuando la gente juega con el servidor conectado.</span>
  <?php else: ?>
    <?php foreach ($games as $g): ?>
      <a href="<?= e(url('analytics', ['game' => $g, 'days' => $days])) ?>" class="<?= $g === $game ? 'active' : '' ?>"><?= e($g) ?></a>
    <?php endforeach; ?>
    <span class="muted">·</span>
    <?php foreach ([1 => 'Hoy', 7 => '7 días', 30 => '30 días', 90 => '90 días', 365 => '1 año'] as $d => $label): ?>
      <a href="<?= e(url('analytics', ['game' => $game, 'days' => $d])) ?>" class="<?= $d === $days ? 'active' : '' ?>"><?= e($label) ?></a>
    <?php endforeach; ?>
  <?php endif; ?>
</form>

<?php if ($r): $total = (int) $r['sessions']; ?>
<?php if ($r['truncated']): ?><p class="error">Hay demasiados eventos en el período: se analizaron los primeros <?= num($r['events']) ?>. Elige un período más corto.</p><?php endif; ?>

<section class="tiles">
  <div class="tile"><span class="label">Jugadores</span><span class="value"><?= num($total) ?></span></div>
  <div class="tile"><span class="label">Terminaron el juego</span><span class="value"><?= num($r['finished']) ?></span><span class="muted"><?= $pct((int) $r['finished'], $total) ?>%</span></div>
  <div class="tile"><span class="label">Muertes</span><span class="value"><?= num($r['deaths']) ?></span><span class="muted"><?= $total ? number_format($r['deaths'] / $total, 2, ',', '.') : '0' ?> por jugador</span></div>
  <div class="tile"><span class="label">Duración (mediana)</span><span class="value"><?= e($fmtMin($r['durationMedian'])) ?></span><span class="muted">promedio <?= e($fmtMin($r['durationAvg'])) ?> · <?= num($r['durationCount']) ?> partidas terminadas</span></div>
</section>

<div class="grid">
  <section class="card">
    <h2>Embudo: ¿hasta dónde llega la gente?</h2>
    <?php if (!$r['funnel']): ?><p class="muted">Configura las escenas del embudo en <a href="<?= e(url('settings')) ?>">Ajustes</a>.</p><?php endif; ?>
    <table>
      <tbody>
      <?php foreach ($r['funnel'] as $f): ?>
        <tr>
          <td><?= e($f['label']) ?><br><code class="small muted"><?= e($f['scene']) ?></code></td>
          <td class="bar"><meter min="0" max="<?= max(1, $total) ?>" value="<?= (int) $f['count'] ?>"></meter></td>
          <td class="num"><?= num($f['count']) ?> <span class="muted">(<?= $pct((int) $f['count'], $total) ?>%)</span></td>
        </tr>
      <?php endforeach; ?>
      </tbody>
    </table>
  </section>

  <section class="card">
    <h2>Finales</h2>
    <?php if (!$r['finals']): ?><p class="muted">Nadie terminó todavía.</p><?php else: ?>
    <table><tbody>
      <?php foreach ($r['finals'] as $scene => $n): ?>
        <tr><td><?= e($finalNames[$scene] ?? $scene) ?></td><td class="num"><?= num($n) ?></td></tr>
      <?php endforeach; ?>
    </tbody></table>
    <?php endif; ?>
  </section>
</div>

<div class="grid">
  <section class="card">
    <h2>¿Dónde muere la gente?</h2>
    <p class="muted small">Escena desde la que llegaron a la muerte.</p>
    <?php if (!$r['deathsFrom']): ?><p class="muted">Sin muertes. Sospechoso.</p><?php else: ?>
    <table><tbody>
      <?php foreach ($r['deathsFrom'] as $scene => $n): ?>
        <tr><td><code><?= e($scene) ?></code></td><td class="bar"><meter min="0" max="<?= max(1, (int) $r['deaths']) ?>" value="<?= (int) $n ?>"></meter></td><td class="num"><?= num($n) ?></td></tr>
      <?php endforeach; ?>
    </tbody></table>
    <?php endif; ?>
  </section>

  <section class="card">
    <h2>¿Dónde abandonan?</h2>
    <p class="muted small">Última escena de quienes no llegaron a un final (incluye partidas en curso).</p>
    <?php if (!$r['abandon']): ?><p class="muted">Nadie abandonó.</p><?php else: ?>
    <table><tbody>
      <?php foreach ($r['abandon'] as $scene => $n): ?>
        <tr><td><code><?= e($scene) ?></code></td><td class="num"><?= num($n) ?></td></tr>
      <?php endforeach; ?>
    </tbody></table>
    <?php endif; ?>
  </section>
</div>

<div class="grid">
  <section class="card">
    <h2>Modos chat</h2>
    <?php if (!$r['chats']): ?><p class="muted">Sin conversaciones en el período.</p><?php else: ?>
    <table>
      <thead><tr><th>Modo</th><th class="num">Total</th><th class="num">Éxito</th><th class="num">A medias</th><th class="num">Fracaso</th><th class="num">Sin IA (dados)</th><th class="num">Se rindió</th></tr></thead>
      <tbody>
      <?php foreach ($r['chats'] as $mode => $c): ?>
        <tr><td><?= e(ucfirst($mode)) ?></td><td class="num"><?= num($c['total']) ?></td><td class="num"><?= num($c['success']) ?></td><td class="num"><?= num($c['partial']) ?></td><td class="num"><?= num($c['failure']) ?></td><td class="num"><?= num($c['fallback']) ?></td><td class="num"><?= num($c['gaveUp']) ?></td></tr>
      <?php endforeach; ?>
      </tbody>
    </table>
    <?php endif; ?>
  </section>

  <section class="card">
    <h2>Dados</h2>
    <?php $diceTotal = array_sum($r['dice']); if (!$diceTotal): ?><p class="muted">Sin tiradas.</p><?php else: ?>
    <table><tbody>
      <?php foreach ($diceNames as $k => $label): $n = (int) ($r['dice'][$k] ?? 0); ?>
        <tr><td><?= e($label) ?></td><td class="bar"><meter min="0" max="<?= $diceTotal ?>" value="<?= $n ?>"></meter></td><td class="num"><?= num($n) ?> <span class="muted">(<?= $pct($n, $diceTotal) ?>%)</span></td></tr>
      <?php endforeach; ?>
    </tbody></table>
    <?php endif; ?>
  </section>
</div>

<section class="card">
  <h2>Decisiones más elegidas</h2>
  <?php if (!$r['choices']): ?><p class="muted">Sin decisiones registradas.</p><?php else: ?>
  <table><tbody>
    <?php foreach ($r['choices'] as $choice => $n): ?>
      <tr><td class="small"><?= e($choice) ?></td><td class="num"><?= num($n) ?></td></tr>
    <?php endforeach; ?>
  </tbody></table>
  <?php endif; ?>
</section>

<section class="card">
  <h2>Jugadores nuevos por día</h2>
  <table><tbody>
    <?php $maxDay = $r['perDay'] ? max($r['perDay']) : 1; foreach ($r['perDay'] as $day => $n): ?>
      <tr><td><?= e($day) ?></td><td class="bar"><meter min="0" max="<?= max(1, $maxDay) ?>" value="<?= (int) $n ?>"></meter></td><td class="num"><?= num($n) ?></td></tr>
    <?php endforeach; ?>
  </tbody></table>
</section>
<?php endif; ?>

<section class="card">
  <h2>Privacidad y espacio</h2>
  <p class="muted small">Hay <?= num($eventsTotal) ?> eventos guardados. Son anónimos (sesión aleatoria, sin IP en claro), pero conviene no guardarlos para siempre.</p>
  <form method="post" action="<?= e(url('analytics')) ?>" class="actions">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="action" value="purge">
    <label class="inline-label">Borrar eventos de más de
      <input type="number" name="older_than" value="90" min="7" class="short"> días
    </label>
    <button class="danger">Borrar</button>
  </form>
</section>
