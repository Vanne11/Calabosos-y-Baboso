<h1>Conversaciones</h1>
<p class="filters">
  <a href="<?= e(url('chats')) ?>" class="<?= $mode === '' ? 'active' : '' ?>">Todas</a>
  <?php foreach ($modes as $m): ?>
    <a href="<?= e(url('chats', ['mode' => $m])) ?>" class="<?= $mode === $m ? 'active' : '' ?>"><?= e(ucfirst($m)) ?></a>
  <?php endforeach; ?>
</p>
<section class="card">
  <?php if (!$chats): ?><p class="muted">Todavía no hay conversaciones.</p><?php else: ?>
  <table>
    <thead><tr><th>Fecha</th><th>Modo</th><th>NPC</th><th class="num">Turnos</th><th class="num">Puntaje</th><th>Resultado</th></tr></thead>
    <tbody>
    <?php foreach ($chats as $c): ?>
      <tr>
        <td class="small"><a href="<?= e(url('chat', ['id' => $c['id']])) ?>"><?= e(substr((string) $c['created_at'], 0, 16)) ?></a></td>
        <td><?= e($c['mode']) ?></td>
        <td><?= e($c['npc']) ?></td>
        <td class="num"><?= (int) $c['turn'] ?>/<?= (int) $c['max_turns'] ?></td>
        <td class="num"><?= (int) $c['score'] ?></td>
        <td><span class="badge <?= e((string) $c['verdict']) ?>"><?= e($c['verdict'] ?? ((int) $c['done'] ? 'terminada' : 'en curso')) ?></span></td>
      </tr>
    <?php endforeach; ?>
    </tbody>
  </table>
  <?php endif; ?>
</section>
