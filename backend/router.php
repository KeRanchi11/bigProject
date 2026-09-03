<?php
// Local-dev router for PHP built-in server ONLY (cPanel uses .htaccess instead).
// Usage (PowerShell, two terminals):
//   1) php -S 127.0.0.1:8000 backend/router.php   (run from G:\bigProject)
//   2) cd frontend; npm run dev   -> open http://localhost:5173
// Requires MySQL running (XAMPP: G:\xampp\mysql_start.bat) + backend/config/config.php.
declare(strict_types=1);

$docroot = __DIR__;
$uri = (string)($_SERVER['REQUEST_URI'] ?? '/');
$path = parse_url($uri, PHP_URL_PATH) ?? '/';

// Serve uploaded static files directly. NOTE: `return false` would make php -S
// look in its startup directory (repo root), not backend/ — so stream the file
// ourselves. Restricted to uploads/ + fonts/ so nothing else leaks.
$upDir = realpath($docroot . '/uploads');
$fontDir = realpath($docroot . '/fonts');
$fsPath = realpath($docroot . $path);
if ($path !== '/' && $fsPath !== false && is_file($fsPath)) {
  $allowed = false;
  foreach ([$upDir, $fontDir] as $base) {
    if ($base !== false && str_starts_with($fsPath, $base . DIRECTORY_SEPARATOR)) { $allowed = true; break; }
  }
  if ($allowed) {
    $ext = strtolower(pathinfo($fsPath, PATHINFO_EXTENSION));
    $mime = [
      'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
      'webp' => 'image/webp', 'gif' => 'image/gif', 'avif' => 'image/avif',
      'ttf' => 'font/ttf', 'otf' => 'font/otf',
    ][$ext] ?? 'application/octet-stream';
    header('Content-Type: ' . $mime);
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . filesize($fsPath));
    readfile($fsPath);
    return true;
  }
}

// Everything under /api goes to the front-controller.
if (str_starts_with($path, '/api')) {
  require $docroot . '/api/index.php';
  return true;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'not_found']);
