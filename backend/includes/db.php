<?php
// PDO singleton + auto-migrate (handy for cPanel shared where SSH is unavailable).
// PHP 8.1 compatible.
declare(strict_types=1);

function load_config(): array {
  static $cfg = null;
  if ($cfg !== null) return $cfg;
  $try = [
    __DIR__ . '/../config/config.php',
    __DIR__ . '/../../config/config.php', // when api/ is copied alone to public_html/api
  ];
  foreach ($try as $f) {
    if (is_file($f)) { $cfg = require $f; return $cfg; }
  }
  $ex = __DIR__ . '/../config/config.example.php';
  $base = is_file($ex) ? require $ex : [];
  $cfg = $base;
  return $cfg;
}

function pdo(): PDO {
  static $pdo = null;
  if ($pdo instanceof PDO) return $pdo;
  $c = load_config();
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $c['db_host'], $c['db_port'], $c['db_name']);
  $pdo = new PDO($dsn, $c['db_user'], $c['db_pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
  ]);
  $pdo->exec("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci");
  return $pdo;
}

function db_init_tables(): void {
  $sqlFile = __DIR__ . '/../../sql/001_schema.sql';
  if (!is_file($sqlFile)) {
    // fallback when only api/ was uploaded: inline minimal schema
    $sql = inline_schema();
  } else {
    $sql = (string)file_get_contents($sqlFile);
  }
  $db = pdo();
  // split on ";\n" boundaries — schema file has one statement per block
  $stmts = array_filter(array_map('trim', explode(';', $sql)));
  foreach ($stmts as $s) {
    if ($s === '') continue;
    $db->exec($s);
  }
}

function inline_schema(): string {
  return <<<SQL
CREATE TABLE IF NOT EXISTS admins (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'نئون',
  image TEXT NOT NULL,
  portrait TINYINT(1) NOT NULL DEFAULT 0,
  featured TINYINT(1) NOT NULL DEFAULT 0,
  tags JSON NULL,
  lat DOUBLE NULL,
  lng DOUBLE NULL,
  address VARCHAR(500) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_featured (featured),
  INDEX idx_sort (sort_order),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS project_likes (
  project_id VARCHAR(64) NOT NULL,
  visitor_id VARCHAR(64) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, visitor_id),
  INDEX idx_visitor (visitor_id),
  CONSTRAINT fk_likes_project FOREIGN KEY (project_id)
    REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS site_content (
  `key` VARCHAR(100) PRIMARY KEY,
  `value` LONGTEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS rate_limits (
  `key` VARCHAR(128) PRIMARY KEY,
  attempts INT NOT NULL DEFAULT 1,
  reset_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;
}
