<?php

declare(strict_types=1);

namespace Cyb;

/** Prompts versionados: cada edición crea una versión nueva; se activa la que se elija */
final class PromptRepository
{
    /** @var Db */
    private $db;

    public function __construct(Db $db)
    {
        $this->db = $db;
    }

    /** @param array<string, mixed> $params */
    public static function create(
        Db $db,
        string $key,
        string $kind,
        string $title,
        string $description,
        string $body,
        array $params,
        string $author
    ): void {
        $now = gmdate('c');
        $db->run(
            'INSERT INTO prompts (key, kind, title, description, updated_at) VALUES (?, ?, ?, ?, ?)',
            [$key, $kind, $title, $description, $now]
        );
        (new self($db))->addVersion($key, $body, $params, 'Versión inicial', $author, true);
    }

    /** @return array<int, array<string, mixed>> */
    public function list(): array
    {
        return $this->db->all(
            'SELECT p.*, (SELECT COUNT(*) FROM prompt_versions v WHERE v.prompt_key = p.key) AS versions
             FROM prompts p ORDER BY p.kind, p.key'
        );
    }

    /** @return array<string, mixed>|null */
    public function find(string $key): ?array
    {
        return $this->db->one('SELECT * FROM prompts WHERE key = ?', [$key]);
    }

    /**
     * Prompt con su versión activa: body y params decodificados.
     * @return array{key: string, kind: string, title: string, version: int, body: string, params: array<string, mixed>}|null
     */
    public function active(string $key): ?array
    {
        $row = $this->db->one(
            'SELECT p.key, p.kind, p.title, v.id AS version, v.body, v.params
             FROM prompts p JOIN prompt_versions v ON v.id = p.active_version
             WHERE p.key = ?',
            [$key]
        );
        if ($row === null) {
            return null;
        }
        $params = json_decode((string) $row['params'], true);
        return [
            'key' => (string) $row['key'],
            'kind' => (string) $row['kind'],
            'title' => (string) $row['title'],
            'version' => (int) $row['version'],
            'body' => (string) $row['body'],
            'params' => is_array($params) ? $params : [],
        ];
    }

    /** @return array<int, array<string, mixed>> */
    public function versions(string $key): array
    {
        return $this->db->all(
            'SELECT * FROM prompt_versions WHERE prompt_key = ? ORDER BY id DESC',
            [$key]
        );
    }

    /** @return array<string, mixed>|null */
    public function version(int $id): ?array
    {
        return $this->db->one('SELECT * FROM prompt_versions WHERE id = ?', [$id]);
    }

    /** @param array<string, mixed> $params */
    public function addVersion(string $key, string $body, array $params, string $note, string $author, bool $activate): int
    {
        $now = gmdate('c');
        $this->db->run(
            'INSERT INTO prompt_versions (prompt_key, body, params, note, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)',
            [$key, $body, json_encode((object) $params, JSON_UNESCAPED_UNICODE), $note, $author, $now]
        );
        $id = (int) $this->db->pdo()->lastInsertId();
        if ($activate) {
            $this->activate($key, $id);
        }
        return $id;
    }

    public function activate(string $key, int $versionId): bool
    {
        $belongs = $this->db->value(
            'SELECT COUNT(*) FROM prompt_versions WHERE id = ? AND prompt_key = ?',
            [$versionId, $key]
        );
        if ((int) $belongs !== 1) {
            return false;
        }
        $this->db->run(
            'UPDATE prompts SET active_version = ?, updated_at = ? WHERE key = ?',
            [$versionId, gmdate('c'), $key]
        );
        return true;
    }

    public function updateMeta(string $key, string $title, string $description): void
    {
        $this->db->run(
            'UPDATE prompts SET title = ?, description = ?, updated_at = ? WHERE key = ?',
            [$title, $description, gmdate('c'), $key]
        );
    }
}
