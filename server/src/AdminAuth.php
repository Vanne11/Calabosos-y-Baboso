<?php

declare(strict_types=1);

namespace Cyb;

/** Sesión del panel admin: login con bcrypt, límite de intentos y CSRF */
final class AdminAuth
{
    private const SESSION_NAME = 'cyb_admin';
    private const MAX_ATTEMPTS = 5;
    private const ATTEMPT_WINDOW = 900; // 15 minutos
    private const IDLE_TIMEOUT = 7200;  // 2 horas sin actividad
    /** Hash bcrypt de un valor aleatorio: iguala el tiempo de respuesta cuando el usuario no existe */
    private const DUMMY_HASH = '$2y$12$4yvvrsFIkK6w4rU6YBcnsONuXytE/RB25OBr2GJ2gOPVOOwfSIkw2';

    /** @var Db */
    private $db;

    public function __construct(Db $db)
    {
        $this->db = $db;
    }

    public function startSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        session_name(self::SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => 0,
            'path' => '/',
            'secure' => (bool) App::config('admin.secure_cookie', true),
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
        ini_set('session.use_strict_mode', '1');
        session_start();

        if (isset($_SESSION['admin_id'], $_SESSION['last_seen']) && time() - (int) $_SESSION['last_seen'] > self::IDLE_TIMEOUT) {
            $this->logout();
            session_start();
        }
        $_SESSION['last_seen'] = time();
    }

    public function user(): ?string
    {
        return isset($_SESSION['admin_user']) ? (string) $_SESSION['admin_user'] : null;
    }

    public function isLocked(): bool
    {
        $count = (int) $this->db->value(
            'SELECT COUNT(*) FROM login_attempts WHERE ip_hash = ? AND attempted_at > ?',
            [App::ipHash(), time() - self::ATTEMPT_WINDOW]
        );
        return $count >= self::MAX_ATTEMPTS;
    }

    public function login(string $username, string $password): bool
    {
        if ($this->isLocked()) {
            return false;
        }
        $row = $this->db->one('SELECT id, username, password_hash FROM admins WHERE username = ?', [$username]);
        // Verificar siempre algún hash para no revelar por tiempo si el usuario existe
        $hash = $row !== null ? (string) $row['password_hash'] : self::DUMMY_HASH;
        if ($row === null || !password_verify($password, $hash)) {
            $this->db->run('INSERT INTO login_attempts (ip_hash, attempted_at) VALUES (?, ?)', [App::ipHash(), time()]);
            return false;
        }
        if (password_needs_rehash($hash, PASSWORD_DEFAULT)) {
            $this->db->run('UPDATE admins SET password_hash = ? WHERE id = ?', [password_hash($password, PASSWORD_DEFAULT), $row['id']]);
        }
        $this->db->run('DELETE FROM login_attempts WHERE ip_hash = ?', [App::ipHash()]);
        $this->db->run('UPDATE admins SET last_login_at = ? WHERE id = ?', [gmdate('c'), $row['id']]);

        session_regenerate_id(true);
        $_SESSION['admin_id'] = (int) $row['id'];
        $_SESSION['admin_user'] = (string) $row['username'];
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
        return true;
    }

    public function logout(): void
    {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }
    }

    public function csrfToken(): string
    {
        if (empty($_SESSION['csrf'])) {
            $_SESSION['csrf'] = bin2hex(random_bytes(32));
        }
        return (string) $_SESSION['csrf'];
    }

    public function checkCsrf(?string $token): bool
    {
        return is_string($token) && !empty($_SESSION['csrf']) && hash_equals((string) $_SESSION['csrf'], $token);
    }

    public static function createAdmin(Db $db, string $username, string $password): void
    {
        $db->run(
            'INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)
             ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash',
            [$username, password_hash($password, PASSWORD_DEFAULT), gmdate('c')]
        );
    }
}
