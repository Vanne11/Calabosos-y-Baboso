<?php
$gamesDir = __DIR__ . '/../games';
$gameList = [];

foreach (scandir($gamesDir) as $folder) {
    if ($folder === '.' || $folder === '..') continue;

    $infoPath = "$gamesDir/$folder/info.json";
    if (file_exists($infoPath)) {
        $info = json_decode(file_get_contents($infoPath), true);
        $gameList[] = [
            'name' => $folder,
            'description' => $info['description'] ?? 'Sin descripción',
            'author' => $info['author'] ?? 'Anónimo',
            'version' => $info['version'] ?? '0.1'
        ];
    }
}

header('Content-Type: application/json');
echo json_encode($gameList);
