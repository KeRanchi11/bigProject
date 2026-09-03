<?php
// Secure session auth (httpOnly cookies) + CSRF + DB rate limiting.
// Replaces old forgeable `x-admin: 1` header. PHP 8.1 compatible.
declare(strict_types=1);

function ensure_session(): void {
  if (session_status() === PHP_SESSION_ACTIVE) return;
  $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
  session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => $secure,
  ]);
  session_start();
}

function is_admin(): bool {
  ensure_session();
  return !empty($_SESSION['admin']) && $_SESSION['admin'] === 1;
}

function require_admin(): void {
  if (!is_admin()) json_err('forbidden', 403);
}

function csrf_token(): string {
  ensure_session();
  if (empty($_SESSION['csrf'])) {
    $_SESSION['csrf'] = bin2hex(random_bytes(32));
  }
  return $_SESSION['csrf'];
}

function check_csrf(): void {
  // Same-origin POSTs must send the token (frontend reads it from GET /api/csrf).
  // GET requests are exempt. Allows PHP built-in server + cPanel without CORS *.
  if ($_SERVER['REQUEST_METHOD'] === 'GET') return;
  ensure_session();
  $sent = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
  if (empty($_SESSION['csrf']) || !hash_equals((string)$_SESSION['csrf'], (string)$sent)) {
    // Back-compat: allow same-origin without token only for like toggles (public).
    $path = parse_api_path();
    if (str_ends_with($path, '/like')) return;
    json_err('bad_csrf', 403);
  }
}

function parse_api_path(): string {
  $uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
  $path = parse_url($uri, PHP_URL_PATH) ?? '/';
  // index.php serves /api/* — strip prefix up to /api
  $pos = strpos($path, '/api');
  if ($pos !== false) $path = substr($path, $pos + 4);
  if ($path === '' || $path[0] !== '/') $path = '/' . $path;
  // support ?route=/projects style for hosts without mod_rewrite
  if (($path === '/' || $path === '/index.php') && !empty($_GET['route'])) {
    $path = '/' . ltrim((string)$_GET['route'], '/');
  }
  return $path;
}

function rate_limit(string $key, int $max, int $windowSec): bool {
  // DB-backed so it works across cPanel processes (unlike old in-memory Map).
  try {
    $db = pdo();
    $now = new DateTimeImmutable('now');
    $stmt = $db->prepare('SELECT attempts, reset_at FROM rate_limits WHERE `key` = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if (!$row) {
      $reset = $now->modify("+{$windowSec} seconds")->format('Y-m-d H:i:s');
      $ins = $db->prepare('INSERT INTO rate_limits (`key`, attempts, reset_at) VALUES (?, 1, ?)');
      $ins->execute([$key, $reset]);
      return true;
    }
    $resetAt = new DateTimeImmutable($row['reset_at']);
    if ($resetAt <= $now) {
      $reset = $now->modify("+{$windowSec} seconds")->format('Y-m-d H:i:s');
      $upd = $db->prepare('UPDATE rate_limits SET attempts = 1, reset_at = ? WHERE `key` = ?');
      $upd->execute([$reset, $key]);
      return true;
    }
    if ((int)$row['attempts'] >= $max) return false;
    $upd = $db->prepare('UPDATE rate_limits SET attempts = attempts + 1 WHERE `key` = ?');
    $upd->execute([$key]);
    return true;
  } catch (Throwable $e) {
    return true; // fail-open for availability; auth still requires password
  }
}

function admin_login(string $username, string $password): bool {
  $db = pdo();
  $stmt = $db->prepare('SELECT id, password_hash FROM admins WHERE username = ? LIMIT 1');
  $stmt->execute([$username]);
  $row = $stmt->fetch();
  if (!$row) return false;
  if (!password_verify($password, (string)$row['password_hash'])) return false;
  // transparent rehash on algorithm/cost change
  if (password_needs_rehash((string)$row['password_hash'], PASSWORD_BCRYPT)) {
    $new = password_hash($password, PASSWORD_BCRYPT);
    $u = $db->prepare('UPDATE admins SET password_hash = ? WHERE id = ?');
    $u->execute([$new, $row['id']]);
  }
  ensure_session();
  session_regenerate_id(true);
  $_SESSION['admin'] = 1;
  $_SESSION['admin_user'] = $username;
  return true;
}

function admin_logout(): void {
  ensure_session();
  $_SESSION = [];
  if (ini_get('session.use_cookies')) {
    $p = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'] ?? false, $p['httponly'] ?? true);
  }
  session_destroy();
}
