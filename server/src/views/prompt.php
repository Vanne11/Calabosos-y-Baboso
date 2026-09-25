<?php
$params = $shown ? json_decode((string) $shown['params'], true) : [];
$isActive = $shown && $active && (int) $shown['id'] === (int) $active['version'];
$bodyValue = (string) ($_POST['body'] ?? ($shown['body'] ?? ''));
$paramsValue = (string) ($_POST['params'] ?? json_encode((object) ($params ?: []), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
?>
<p><a href="<?= e(url('prompts')) ?>">← Prompts</a></p>
<h1><?= e($meta['title']) ?> <code class="small"><?= e($meta['key']) ?></code></h1>

<?php if ($formError !== ''): ?><p class="error"><?= e($formError) ?></p><?php endif; ?>

<div class="grid">
  <section class="card">
    <h2>
      <?php if ($shown): ?>Versión #<?= (int) $shown['id'] ?> <?= $isActive ? '<span class="badge on">activa</span>' : '<span class="badge">no activa</span>' ?><?php endif; ?>
    </h2>
    <form method="post" action="<?= e(url('prompt', ['key' => $meta['key']])) ?>">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <label>Título <input name="title" value="<?= e($_POST['title'] ?? $meta['title']) ?>"></label>
      <label>Descripción <input name="description" value="<?= e($_POST['description'] ?? $meta['description']) ?>"></label>
      <label>Prompt <span class="muted small">(variables: <code>{{nombre}}</code>; en modos chat también <code>{{turn}}</code>, <code>{{max_turns}}</code>, <code>{{score}}</code>, <code>{{npc}}</code>)</span>
        <textarea name="body" rows="18" class="mono"><?= e($bodyValue) ?></textarea>
      </label>
      <label>Parámetros (JSON)
        <textarea name="params" rows="9" class="mono"><?= e($paramsValue) ?></textarea>
      </label>
      <details class="help">
        <summary>¿Qué parámetros hay?</summary>
        <ul class="small">
          <li><code>temperature</code> creatividad (0-2) · <code>max_tokens</code> largo máximo de la respuesta del modelo</li>
          <li>Narración: <code>max_chars</code> recorte final del texto</li>
          <li>Chat: <code>max_turns</code>, <code>initial_score</code>, <code>success_at</code> / <code>partial_at</code> (umbrales del veredicto), <code>max_step</code> (cuánto puede cambiar el puntaje por turno), <code>max_reply_chars</code>, <code>verdict: false</code> (sin ganar ni perder)</li>
          <li><code>use_base: false</code> para no anteponer la hoja del narrador</li>
        </ul>
      </details>
      <label>Nota de la versión <input name="note" placeholder="Qué cambiaste y por qué"></label>
      <label class="check"><input type="checkbox" name="activate" value="1" checked> Activar al guardar</label>
      <div class="actions">
        <button class="primary" name="action" value="save">Guardar como versión nueva</button>
      </div>

      <h2>Probar</h2>
      <p class="muted small">Prueba el texto de arriba tal como está (sin guardarlo) con variables de ejemplo. Consume tokens reales.</p>
      <label>Variables de prueba (JSON)
        <textarea name="test_vars" rows="5" class="mono"><?= e($testVars) ?></textarea>
      </label>
      <?php if ($meta['kind'] === 'chat'): ?>
      <label>Mensaje del jugador <input name="test_message" value="<?= e($testMessage) ?>"></label>
      <?php endif; ?>
      <div class="actions">
        <button name="action" value="test">Probar ahora</button>
      </div>
    </form>

    <?php if ($test !== null): ?>
    <div class="test-result">
      <?php if (!empty($test['error'])): ?><p class="error"><?= e($test['error']) ?></p><?php endif; ?>
      <?php if (isset($test['parsed'])): ?>
        <p class="reply"><?= e($test['parsed']['reply']) ?></p>
        <p class="small">Puntaje: <strong><?= (int) $test['parsed']['score'] ?></strong> · Terminó: <?= $test['parsed']['done'] ? 'sí' : 'no' ?></p>
      <?php elseif (isset($test['text'])): ?>
        <p class="reply"><?= e($test['text']) ?></p>
      <?php endif; ?>
      <?php if (isset($test['tokens'])): ?><p class="muted small"><?= num($test['tokens']) ?> tokens · <?= num($test['latency']) ?> ms</p><?php endif; ?>
      <?php if (isset($test['raw'])): ?><details><summary>Respuesta cruda</summary><pre><?= e($test['raw']) ?></pre></details><?php endif; ?>
      <?php if (isset($test['system'])): ?><details><summary>Prompt de sistema enviado</summary><pre><?= e($test['system']) ?></pre></details><?php endif; ?>
    </div>
    <?php endif; ?>
  </section>

  <section class="card">
    <h2>Versiones</h2>
    <ul class="versions">
    <?php foreach ($versions as $v): $vActive = $active && (int) $v['id'] === (int) $active['version']; ?>
      <li class="<?= $shown && (int) $shown['id'] === (int) $v['id'] ? 'current' : '' ?>">
        <a href="<?= e(url('prompt', ['key' => $meta['key'], 'v' => $v['id']])) ?>">#<?= (int) $v['id'] ?></a>
        <?php if ($vActive): ?><span class="badge on">activa</span><?php endif; ?>
        <span class="muted small"><?= e(substr((string) $v['created_at'], 0, 16)) ?> · <?= e($v['created_by']) ?></span>
        <?php if ($v['note'] !== ''): ?><br><span class="small"><?= e($v['note']) ?></span><?php endif; ?>
        <?php if (!$vActive): ?>
        <form method="post" action="<?= e(url('prompt', ['key' => $meta['key']])) ?>" class="inline">
          <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
          <input type="hidden" name="version" value="<?= (int) $v['id'] ?>">
          <button class="link" name="action" value="activate">Activar</button>
        </form>
        <?php endif; ?>
      </li>
    <?php endforeach; ?>
    </ul>
  </section>
</div>
