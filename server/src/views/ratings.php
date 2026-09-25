<h1>Calificaciones</h1>
<p class="muted small">Los jugadores califican las líneas de la IA con <code>/bien</code> y <code>/mal</code>. Las que más gustan se pueden
  usar como <strong>ejemplos</strong>: se agregan (hasta <?= (int) $examplesPerPrompt ?> al azar) a cada pedido de ese prompt, para que la IA imite el nivel.</p>

<section class="card">
  <h2>Por prompt y versión</h2>
  <?php if (!$summary): ?><p class="muted">Todavía no hay líneas guardadas.</p><?php else: ?>
  <table>
    <thead><tr><th>Prompt</th><th class="num">Versión</th><th class="num">Líneas</th><th class="num">👍</th><th class="num">👎</th><th class="num">% 👍 (de las calificadas)</th></tr></thead>
    <tbody>
    <?php foreach ($summary as $r): $rated = (int) $r['up'] + (int) $r['down']; ?>
      <tr>
        <td><a href="<?= e(url('ratings', ['key' => $r['prompt_key'], 'r' => $rating])) ?>"><code class="small"><?= e($r['prompt_key']) ?></code></a></td>
        <td class="num">#<?= (int) $r['prompt_version'] ?></td>
        <td class="num"><?= num($r['lines']) ?></td>
        <td class="num"><?= num($r['up']) ?></td>
        <td class="num"><?= num($r['down']) ?></td>
        <td class="num"><?= $rated ? round(100 * (int) $r['up'] / $rated) . '%' : '—' ?></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>

<p class="filters">
  <a href="<?= e(url('ratings', ['r' => 1, 'key' => $key])) ?>" class="<?= $rating === 1 ? 'active' : '' ?>">👍 Les gustó</a>
  <a href="<?= e(url('ratings', ['r' => -1, 'key' => $key])) ?>" class="<?= $rating === -1 ? 'active' : '' ?>">👎 No les gustó</a>
  <?php if ($key !== ''): ?> · <code class="small"><?= e($key) ?></code> <a href="<?= e(url('ratings', ['r' => $rating])) ?>">(ver todos)</a><?php endif; ?>
</p>
<section class="card">
  <?php if (!$lines): ?><p class="muted">Sin líneas calificadas así.</p><?php else: ?>
  <table>
    <thead><tr><th>Fecha</th><th>Prompt</th><th>Línea</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($lines as $l): ?>
      <tr>
        <td class="small"><?= e(substr((string) $l['rated_at'], 0, 16)) ?></td>
        <td><code class="small"><?= e($l['prompt_key']) ?></code> <span class="muted small">#<?= (int) $l['prompt_version'] ?></span></td>
        <td><?= e($l['text']) ?></td>
        <td>
          <?php if ((int) $l['is_example'] > 0): ?><span class="muted small">✔ ejemplo</span>
          <?php elseif ($rating === 1): ?>
          <form method="post" action="<?= e(url('ratings', ['r' => $rating, 'key' => $key])) ?>">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input type="hidden" name="action" value="add_example">
            <input type="hidden" name="line" value="<?= (int) $l['id'] ?>">
            <button class="small">Usar como ejemplo</button>
          </form>
          <?php endif; ?>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>

<section class="card">
  <h2>Ejemplos activos</h2>
  <?php if (!$examples): ?><p class="muted">Ninguno todavía.</p><?php else: ?>
  <table>
    <tbody>
    <?php foreach ($examples as $x): ?>
      <tr>
        <td><code class="small"><?= e($x['prompt_key']) ?></code></td>
        <td><?= e($x['text']) ?></td>
        <td>
          <form method="post" action="<?= e(url('ratings', ['r' => $rating, 'key' => $key])) ?>">
            <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
            <input type="hidden" name="action" value="delete_example">
            <input type="hidden" name="example" value="<?= (int) $x['id'] ?>">
            <button class="small link">Quitar</button>
          </form>
        </td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>

<section class="card">
  <h2>Exportar 👍 para los pools sin IA</h2>
  <p class="muted small">Las líneas que gustaron, agrupadas por prompt. Cópialas a <code>game.json → linePools</code> para que también salgan cuando no hay IA
    (revísalas antes: pueden mencionar cosas de una partida concreta).</p>
  <textarea rows="10" class="mono" readonly><?= e($export) ?></textarea>
</section>
