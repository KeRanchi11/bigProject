<?php
// Bootstrap: errors, sessions, CORS (same-origin), auto-migrate.
// PHP 8.1 compatible.
declare(strict_types=1);

$isDev = (getenv('APP_ENV') === 'development');
if ($isDev) {
  ini_set('display_errors', '1');
  error_reporting(E_ALL);
} else {
  ini_set('display_errors', '0');
  error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
}

require_once __DIR__ . '/response.php';
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/validators.php';
require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/upload.php';

// Same-origin only: reflect Origin solely for local Vite dev, never "*".
$origin = (string)($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedDev = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (in_array($origin, $allowedDev, true) && $isDev) {
  header('Access-Control-Allow-Origin: ' . $origin);
  header('Access-Control-Allow-Credentials: true');
  header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
  header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
  if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
}

// Security headers (Apache may override, but helps on php -S too)
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');

// Auto-create tables on first run (helps cPanel without SSH). Cheap + idempotent.
try {
  db_init_tables();
} catch (Throwable $e) {
  // Surface as JSON only for health checks; otherwise let route handlers report db_error
  if (parse_api_path() === '/health') json_err('db_error', 500);
}
