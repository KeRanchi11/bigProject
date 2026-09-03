<?php
// Copy to config.php and fill with cPanel MySQL credentials.
// Keep config.php OUTSIDE public_html when possible. If public_html/api is the
// docroot, place this one level above and the bootstrap will still find env vars.
// On typical shared cPanel: DB_HOST=localhost, DB_NAME=cpuser_tablo, DB_USER=cpuser_tablouser
// PHP 8.1 compatible, no framework.

return [
  'db_host' => getenv('DB_HOST') ?: 'localhost',
  'db_port' => (int)(getenv('DB_PORT') ?: 3306),
  'db_name' => getenv('DB_NAME') ?: 'tablosazimaleki',
  'db_user' => getenv('DB_USER') ?: 'root',
  'db_pass' => getenv('DB_PASS') !== false ? (string)getenv('DB_PASS') : '',
  'app_env' => getenv('APP_ENV') ?: 'production', // production | development
  // Only used by backend/install.php to create the first admin. Not used at runtime.
  'admin_user' => getenv('ADMIN_USER') ?: 'admin',
  'admin_pass' => getenv('ADMIN_PASS') ?: 'change-me-immediately',
];
