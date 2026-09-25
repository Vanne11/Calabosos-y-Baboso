<?php
$history = json_decode((string) $chat['history'], true) ?: [];
$vars = json_decode((string) $chat['vars'], true) ?: [];
?>
<p><a href="<?= e(url('chats')) ?>">← Conversaciones</a></p>
<h1><?= e(ucfirst((string) $chat['mode'])) ?> <span class="muted">con <?= e($chat['npc']) ?></span></h1>
<p class="small">
  Puntaje <strong><?= (int) $chat['score'] ?></strong> · Turnos <?= (int) $chat['turn'] ?>/<?= (int) $chat['max_turns'] ?> ·
  Resultado <span class="badge <?= e((string) $chat['verdict']) ?>"><?= e($chat['verdict'] ?? 'sin veredicto') ?></span> ·
  Prompt <a href="<?= e(url('prompt', ['key' => $chat['prompt_key'], 'v' => $chat['prompt_version']])) ?>"><?= e($chat['prompt_key']) ?> #<?= (int) $chat['prompt_version'] ?></a>
</p>
<section class="card transcript">
  <?php foreach ($history as $h): ?>
    <p class="<?= $h['role'] === 'player' ? 'player' : 'npc' ?>"><strong><?= $h['role'] === 'player' ? 'Jugador' : e($chat['npc'] ?: 'NPC') ?>:</strong> <?= nl2br(e($h['text'])) ?></p>
  <?php endforeach; ?>
  <?php if (!$history): ?><p class="muted">Sin mensajes.</p><?php endif; ?>
</section>
<details class="card"><summary>Variables</summary><pre><?= e(json_encode((object) $vars, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) ?></pre></details>
