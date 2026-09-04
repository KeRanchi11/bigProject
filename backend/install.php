<?php
// One-shot cPanel installer: visit https://your-domain/api/../install.php once,
// then DELETE this file. Creates tables + first admin (bcrypt) + default content.
// PHP 8.1 compatible.
declare(strict_types=1);

header('Content-Type: text/plain; charset=utf-8');

$cfgFile = __DIR__ . '/config/config.php';
if (!is_file($cfgFile)) {
  http_response_code(500);
  echo "Missing backend/config/config.php — copy config.example.php first.\n";
  exit;
}
/** @var array $cfg */
$cfg = require $cfgFile;

try {
  $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $cfg['db_host'], $cfg['db_port'], $cfg['db_name']);
  $db = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
  $db->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
  $schema = (string)file_get_contents(__DIR__ . '/../sql/001_schema.sql');
  foreach (array_filter(array_map('trim', explode(';', $schema))) as $s) {
    if ($s !== '') $db->exec($s);
  }
  echo "tables ok\n";

  $user = (string)($cfg['admin_user'] ?? 'admin');
  $pass = (string)($cfg['admin_pass'] ?? '');
  if ($pass === '' || $pass === 'change-me-immediately') {
    echo "WARNING: set admin_user/admin_pass in config.php via env, then re-run.\n";
    exit;
  }
  $hash = password_hash($pass, PASSWORD_BCRYPT);
  $st = $db->prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?) ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)');
  $st->execute([$user, $hash]);
  echo "admin ok ($user)\n";

  $defaults = [
    'brandName' => 'تابلوسازی ملکی',
    'slogan' => 'تابلوی شما، امضای ما',
    'copyright' => '© ۱۴۰۳ تابلوسازی ملکی',
    'logoUrl' => '',
    'navItems' => json_encode([['label' => 'نمونه‌کارها', 'href' => '#gallery'], ['label' => 'درباره ما', 'href' => '#about'], ['label' => 'تماس با ما', 'href' => '#contact']], JSON_UNESCAPED_UNICODE),
    'headerCta' => 'مشاوره رایگان',
    'heroEyebrow' => 'طراحی شده برای دیده شدن',
    'heroHeadline1' => 'تابلوی شما،',
    'heroHeadline2' => 'امضای ماست.',
    'heroDescription' => 'ما برای برندهایی تابلو می‌سازیم که می‌خواهند در ذهن‌ها بمانند. از ایده تا اجرا، کنار شما هستیم.',
    'heroCta' => 'شروع یک همکاری',
    'heroProofNumber' => '+۱۲۰',
    'heroProofText' => 'پروژه موفق در سراسر ایران',
    'aboutEyebrow' => 'داستان ما',
    'aboutHeadline1' => 'ما فقط تابلو',
    'aboutHeadline2' => 'نمی‌سازیم.',
    'aboutDescription' => 'کمک می‌کنیم برند شما دیده و به یاد سپرده شود.',
    'aboutImage' => '',
    'contactEyebrow' => 'وقتشه بدرخشید',
    'contactHeadline1' => 'برای دیده شدن',
    'contactHeadline2' => 'آماده‌ید؟',
    'contactDescription' => 'یک تماس کوتاه، شروع یک اتفاق بزرگ است.',
    'contactMethods' => json_encode([['type' => 'phone', 'label' => 'تماس مستقیم', 'value' => '۰۲۱-۱۲۳۴۵۶۷۸', 'link' => 'tel:02112345678']], JSON_UNESCAPED_UNICODE),
    'categories' => json_encode(['نئون', 'سردر فروشگاه', 'حروف برجسته', 'بیلبورد'], JSON_UNESCAPED_UNICODE),
    'signFonts' => json_encode([['name' => 'Vazirmatn', 'family' => 'Vazirmatn', 'googleUrl' => 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap', 'fileUrl' => '']], JSON_UNESCAPED_UNICODE),
    'defaultSignFont' => 'Vazirmatn',
    'fontFamily' => 'Vazirmatn',
    'fontSize' => '15',
    'whatsapp' => '989121234567',
    'activePalette' => 'ember',
  ];
  $ins = $db->prepare('INSERT IGNORE INTO site_content (`key`, `value`) VALUES (?, ?)');
  foreach ($defaults as $k => $v) $ins->execute([$k, $v]);
  echo "content ok\n";
  echo "DONE. Now DELETE backend/install.php from the server.\n";
} catch (Throwable $e) {
  http_response_code(500);
  echo 'FAILED: ' . $e->getMessage() . "\n";
}
