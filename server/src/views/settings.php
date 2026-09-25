<h1>Ajustes</h1>
<form method="post" action="<?= e(url('settings')) ?>">
  <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
  <section class="card">
    <h2>General</h2>
    <label class="check"><input type="checkbox" name="ai_enabled" value="1" <?= $s['ai_enabled'] ? 'checked' : '' ?>> IA activa (interruptor general)</label>
    <label class="check"><input type="checkbox" name="narrate_enabled" value="1" <?= $s['narrate_enabled'] ? 'checked' : '' ?>> Narración con IA (burlas, reacciones, recap)</label>
    <label class="check"><input type="checkbox" name="events_enabled" value="1" <?= $s['events_enabled'] ? 'checked' : '' ?>> Guardar eventos de juego (analítica)</label>
    <label>Modelo <input name="model" value="<?= e($s['model']) ?>"></label>
  </section>
  <section class="card">
    <h2>Modos chat</h2>
    <?php foreach ($modes as $mode): ?>
      <label class="check"><input type="checkbox" name="modes[<?= e($mode) ?>]" value="1" <?= !empty($s['modes_enabled'][$mode]) ? 'checked' : '' ?>> <?= e(ucfirst($mode)) ?></label>
    <?php endforeach; ?>
  </section>
  <section class="card">
    <h2>Límites</h2>
    <?php
    $labels = [
        'ip_per_minute' => 'Peticiones de IA por minuto por IP',
        'session_tokens_per_day' => 'Tokens por jugador por día',
        'global_tokens_per_day' => 'Tokens totales por día (presupuesto)',
        'max_input_chars' => 'Largo máximo del mensaje del jugador (caracteres)',
        'max_turns_cap' => 'Turnos máximos por conversación',
        'max_vars' => 'Variables máximas por pedido',
        'max_var_chars' => 'Largo máximo de cada variable',
    ];
    foreach ($labels as $name => $label): ?>
      <label><?= e($label) ?> <input type="number" min="0" name="limits[<?= e($name) ?>]" value="<?= (int) ($s['limits'][$name] ?? 0) ?>"></label>
    <?php endforeach; ?>
  </section>
  <section class="card">
    <h2>Embudo de la analítica</h2>
    <p class="muted small">Escenas clave del juego, en orden. Una por línea: <code>id_escena | Etiqueta</code>.</p>
    <textarea name="funnel" rows="8" class="mono"><?php foreach ((array) $s['funnel'] as $f) { echo e($f['scene'] . ' | ' . $f['label']) . "\n"; } ?></textarea>
  </section>
  <div class="actions"><button class="primary">Guardar ajustes</button></div>
</form>
