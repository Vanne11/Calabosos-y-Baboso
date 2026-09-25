<?php

declare(strict_types=1);

namespace Cyb;

use PDO;
use PDOStatement;
use RuntimeException;

/** Envoltorio de PDO/SQLite con migraciones versionadas (PRAGMA user_version) */
final class Db
{
    /** @var PDO */
    private $pdo;

    public function __construct(string $path)
    {
        if ($path === '') {
            throw new RuntimeException('Falta db_path en config.php');
        }
        if (!in_array('sqlite', PDO::getAvailableDrivers(), true)) {
            throw new RuntimeException('PHP no tiene pdo_sqlite habilitado.');
        }
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0770, true) && !is_dir($dir)) {
            throw new RuntimeException('No se pudo crear la carpeta de datos: ' . $dir);
        }
        $this->pdo = new PDO('sqlite:' . $path, null, null, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
        $this->pdo->exec('PRAGMA journal_mode = WAL');
        $this->pdo->exec('PRAGMA foreign_keys = ON');
        $this->pdo->exec('PRAGMA busy_timeout = 3000');
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    /** @param array<int|string, mixed> $params */
    public function run(string $sql, array $params = []): PDOStatement
    {
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    /**
     * @param array<int|string, mixed> $params
     * @return array<string, mixed>|null
     */
    public function one(string $sql, array $params = []): ?array
    {
        $row = $this->run($sql, $params)->fetch();
        return $row === false ? null : $row;
    }

    /**
     * @param array<int|string, mixed> $params
     * @return array<int, array<string, mixed>>
     */
    public function all(string $sql, array $params = []): array
    {
        return $this->run($sql, $params)->fetchAll();
    }

    /**
     * @param array<int|string, mixed> $params
     * @return mixed
     */
    public function value(string $sql, array $params = [])
    {
        $value = $this->run($sql, $params)->fetchColumn();
        return $value === false ? null : $value;
    }

    /**
     * @template T
     * @param callable(): T $fn
     * @return T
     */
    public function transaction(callable $fn)
    {
        $this->pdo->beginTransaction();
        try {
            $result = $fn();
            $this->pdo->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    /** Aplica las migraciones pendientes y los datos iniciales */
    public function migrate(): void
    {
        $version = (int) $this->pdo->query('PRAGMA user_version')->fetchColumn();
        $migrations = self::migrations();
        foreach ($migrations as $target => $sql) {
            if ($target <= $version) {
                continue;
            }
            $this->transaction(function () use ($sql, $target): void {
                $this->pdo->exec($sql);
                $this->pdo->exec('PRAGMA user_version = ' . (int) $target);
            });
            if ($target === 1) {
                Seed::run($this);
            }
            if ($target === 3) {
                Seed::upgrade($this, 'Actualización: memoria de la partida, voz menos de IA y cómo escribe el jugador');
            }
            if ($target === 4) {
                Seed::upgrade($this, 'Actualización: acción libre en las decisiones');
            }
            if ($target === 5) {
                Seed::upgrade($this, 'Actualización: epitafio al morir');
            }
            if ($target === 6) {
                Seed::upgrade($this, 'Actualización: charla con el narrador (/narrador)');
            }
            if ($target === 7) {
                Seed::upgrade($this, 'Actualización: charla libre con los personajes');
            }
            if ($target === 8) {
                Seed::upgrade($this, 'Actualización: el protagonista puede ser de cualquier género');
            }
            if ($target === 9) {
                Seed::upgrade($this, 'Actualización: el protagonista ahora se llama Alex');
            }
        }
    }

    /** @return array<int, string> versión → SQL */
    private static function migrations(): array
    {
        return [
            1 => <<<'SQL'
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
CREATE TABLE prompts (
    key TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    active_version INTEGER,
    updated_at TEXT NOT NULL
);
CREATE TABLE prompt_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_key TEXT NOT NULL REFERENCES prompts(key) ON DELETE CASCADE,
    body TEXT NOT NULL,
    params TEXT NOT NULL DEFAULT '{}',
    note TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
);
CREATE INDEX idx_prompt_versions_key ON prompt_versions(prompt_key, id);
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
);
CREATE TABLE login_attempts (
    ip_hash TEXT NOT NULL,
    attempted_at INTEGER NOT NULL
);
CREATE INDEX idx_login_attempts ON login_attempts(ip_hash, attempted_at);
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    game TEXT NOT NULL DEFAULT '',
    ip_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    requests INTEGER NOT NULL DEFAULT 0,
    tokens INTEGER NOT NULL DEFAULT 0,
    tokens_day TEXT NOT NULL DEFAULT '',
    tokens_today INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE rate_hits (
    bucket TEXT NOT NULL,
    window INTEGER NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (bucket, window)
);
CREATE TABLE usage_daily (
    day TEXT PRIMARY KEY,
    requests INTEGER NOT NULL DEFAULT 0,
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE chats (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    game TEXT NOT NULL DEFAULT '',
    mode TEXT NOT NULL,
    npc TEXT NOT NULL DEFAULT '',
    prompt_key TEXT NOT NULL,
    prompt_version INTEGER NOT NULL,
    vars TEXT NOT NULL DEFAULT '{}',
    max_turns INTEGER NOT NULL,
    turn INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    verdict TEXT,
    done INTEGER NOT NULL DEFAULT 0,
    history TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE INDEX idx_chats_created ON chats(created_at);
CREATE TABLE ai_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    session_id TEXT NOT NULL DEFAULT '',
    kind TEXT NOT NULL,
    prompt_key TEXT NOT NULL DEFAULT '',
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    error TEXT
);
CREATE INDEX idx_ai_log_created ON ai_log(created_at);
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    game TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL,
    scene TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL DEFAULT '{}',
    client_time INTEGER,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_events_type ON events(game, type, created_at);
SQL,
            2 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_events_session ON events(game, created_at, session_id);
SQL,
            3 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_chats_session ON chats(session_id, npc, created_at);
SQL,
            4 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_ai_log_kind ON ai_log(kind, created_at);
SQL,
            5 => <<<'SQL'
ALTER TABLE chats ADD COLUMN gestures TEXT NOT NULL DEFAULT '{}';
ALTER TABLE chats ADD COLUMN gestures_used TEXT NOT NULL DEFAULT '[]';
CREATE TABLE ai_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    prompt_key TEXT NOT NULL,
    prompt_version INTEGER NOT NULL DEFAULT 0,
    text TEXT NOT NULL,
    rating INTEGER,
    created_at TEXT NOT NULL,
    rated_at TEXT
);
CREATE INDEX idx_ai_lines_rating ON ai_lines(rating, prompt_key, rated_at);
CREATE INDEX idx_ai_lines_created ON ai_lines(created_at);
CREATE TABLE prompt_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_key TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT NOT NULL
);
CREATE INDEX idx_prompt_examples_key ON prompt_examples(prompt_key);
SQL,
            6 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_ai_lines_session ON ai_lines(session_id, id);
SQL,
            7 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_ai_lines_prompt ON ai_lines(prompt_key, created_at);
SQL,
            8 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_chats_npc ON chats(npc, created_at);
SQL,
            9 => <<<'SQL'
CREATE INDEX IF NOT EXISTS idx_prompt_versions_created ON prompt_versions(created_at);
SQL,
        ];
    }
}
