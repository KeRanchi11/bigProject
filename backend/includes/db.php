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
  migrate_about_once();
  migrate_contact_once();
  migrate_hero_once();
}

// One-time, non-destructive: copy About texts into the dedicated table on first run.
// Old site_content rows are left untouched as fallback; reads/writes use about_content.
function migrate_about_once(): void {
  $db = pdo();
  $n = (int)$db->query('SELECT COUNT(*) AS c FROM about_content')->fetch()['c'];
  if ($n > 0) return;
  $map = ['aboutEyebrow' => 'eyebrow', 'aboutHeadline1' => 'headline1', 'aboutHeadline2' => 'headline2', 'aboutDescription' => 'description', 'aboutImage' => 'image'];
  $vals = ['eyebrow' => '', 'headline1' => '', 'headline2' => '', 'description' => '', 'image' => ''];
  $q = $db->prepare('SELECT `value` FROM site_content WHERE `key` = ?');
  foreach ($map as $k => $col) {
    $q->execute([$k]);
    $r = $q->fetch();
    if ($r) $vals[$col] = (string)$r['value'];
  }
  if (implode('', $vals) === '') {
    $vals = ['eyebrow' => 'داستان ما', 'headline1' => 'ما فقط تابلو', 'headline2' => 'نمی‌سازیم.', 'description' => 'کمک می‌کنیم برند شما دیده و به یاد سپرده شود.', 'image' => ''];
  }
  $ins = $db->prepare('INSERT INTO about_content (id, eyebrow, headline1, headline2, description, image) VALUES (1, ?, ?, ?, ?, ?)');
  $ins->execute([$vals['eyebrow'], $vals['headline1'], $vals['headline2'], $vals['description'], $vals['image']]);
}

// One-time, non-destructive: copy Contact texts into the dedicated table on first run.
// Old site_content rows are left untouched as fallback; reads/writes use contact_content.
function migrate_contact_once(): void {
  $db = pdo();
  $n = (int)$db->query('SELECT COUNT(*) AS c FROM contact_content')->fetch()['c'];
  if ($n > 0) return;
  $map = ['contactEyebrow' => 'eyebrow', 'contactHeadline1' => 'headline1', 'contactHeadline2' => 'headline2', 'contactDescription' => 'description', 'whatsapp' => 'whatsapp', 'instagram' => 'instagram'];
  $vals = ['eyebrow' => '', 'headline1' => '', 'headline2' => '', 'description' => '', 'whatsapp' => '', 'instagram' => ''];
  $q = $db->prepare('SELECT `value` FROM site_content WHERE `key` = ?');
  foreach ($map as $k => $col) {
    $q->execute([$k]);
    $r = $q->fetch();
    if ($r) $vals[$col] = (string)$r['value'];
  }
  if (implode('', $vals) === '') {
    $vals = ['eyebrow' => 'وقتشه بدرخشید', 'headline1' => 'برای دیده شدن', 'headline2' => 'آماده‌ید؟', 'description' => 'یک تماس کوتاه، شروع یک اتفاق بزرگ است.', 'whatsapp' => '989121234567', 'instagram' => ''];
  }
  $ins = $db->prepare('INSERT INTO contact_content (id, eyebrow, headline1, headline2, description, whatsapp, instagram) VALUES (1, ?, ?, ?, ?, ?, ?)');
  $ins->execute([$vals['eyebrow'], $vals['headline1'], $vals['headline2'], $vals['description'], $vals['whatsapp'], $vals['instagram']]);
}

// One-time, non-destructive: copy Hero texts into the dedicated table on first run.
// Old site_content rows are left untouched as fallback; reads/writes use hero_content.
function migrate_hero_once(): void {
  $db = pdo();
  $n = (int)$db->query('SELECT COUNT(*) AS c FROM hero_content')->fetch()['c'];
  if ($n > 0) return;
  $map = ['heroEyebrow' => 'eyebrow', 'heroHeadline1' => 'headline1', 'heroHeadline2' => 'headline2', 'heroDescription' => 'description', 'heroCta' => 'cta', 'heroProofNumber' => 'proof_number', 'heroProofText' => 'proof_text'];
  $vals = ['eyebrow' => '', 'headline1' => '', 'headline2' => '', 'description' => '', 'cta' => '', 'proof_number' => '', 'proof_text' => '', 'neon_small' => 'GOOD IDEAS', 'neon_line1' => 'SHINE', 'neon_line2' => 'BRIGHT', 'chip1' => 'از ایده', 'chip2' => 'تا اجرا'];
  $q = $db->prepare('SELECT `value` FROM site_content WHERE `key` = ?');
  foreach ($map as $k => $col) {
    $q->execute([$k]);
    $r = $q->fetch();
    if ($r) $vals[$col] = (string)$r['value'];
  }
  if (implode('', array_slice($vals, 0, 7)) === '') {
    $vals['eyebrow'] = 'طراحی شده برای دیده شدن';
    $vals['headline1'] = 'تابلوی شما،';
    $vals['headline2'] = 'امضای ماست.';
    $vals['description'] = 'ما برای برندهایی تابلو می‌سازیم که می‌خواهند در ذهن‌ها بمانند. از ایده تا اجرا، کنار شما هستیم.';
    $vals['cta'] = 'شروع یک همکاری';
    $vals['proof_number'] = '+۱۲۰';
    $vals['proof_text'] = 'پروژه موفق در سراسر ایران';
  }
  $ins = $db->prepare('INSERT INTO hero_content (id, eyebrow, headline1, headline2, description, cta, proof_number, proof_text, neon_small, neon_line1, neon_line2, chip1, chip2) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  $ins->execute([$vals['eyebrow'], $vals['headline1'], $vals['headline2'], $vals['description'], $vals['cta'], $vals['proof_number'], $vals['proof_text'], $vals['neon_small'], $vals['neon_line1'], $vals['neon_line2'], $vals['chip1'], $vals['chip2']]);
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
  reset_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS about_content (
  id TINYINT UNSIGNED PRIMARY KEY,
  eyebrow VARCHAR(255) NOT NULL DEFAULT '',
  headline1 VARCHAR(255) NOT NULL DEFAULT '',
  headline2 VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_about_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS contact_content (
  id TINYINT UNSIGNED PRIMARY KEY,
  eyebrow VARCHAR(255) NOT NULL DEFAULT '',
  headline1 VARCHAR(255) NOT NULL DEFAULT '',
  headline2 VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  whatsapp VARCHAR(20) NOT NULL DEFAULT '',
  instagram TEXT NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_contact_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS hero_content (
  id TINYINT UNSIGNED PRIMARY KEY,
  eyebrow VARCHAR(255) NOT NULL DEFAULT '',
  headline1 VARCHAR(255) NOT NULL DEFAULT '',
  headline2 VARCHAR(255) NOT NULL DEFAULT '',
  description TEXT NOT NULL,
  cta VARCHAR(255) NOT NULL DEFAULT '',
  proof_number VARCHAR(50) NOT NULL DEFAULT '',
  proof_text VARCHAR(255) NOT NULL DEFAULT '',
  neon_small VARCHAR(120) NOT NULL DEFAULT '',
  neon_line1 VARCHAR(120) NOT NULL DEFAULT '',
  neon_line2 VARCHAR(120) NOT NULL DEFAULT '',
  chip1 VARCHAR(120) NOT NULL DEFAULT '',
  chip2 VARCHAR(120) NOT NULL DEFAULT '',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_hero_single CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL;
}
