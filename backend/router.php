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

// Serve real static files (uploads/fonts) directly.
$fsPath = realpath($docroot . $path);
if ($path !== '/' && $fsPath !== false && str_starts_with($fsPath, realpath($docroot)) && is_file($fsPath)) {
  return false;
}

// Everything under /api goes to the front-controller.
if (str_starts_with($path, '/api')) {
  require $docroot . '/api/index.php';
  return true;
}

http_response_code(404);
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['error' => 'not_found']);
