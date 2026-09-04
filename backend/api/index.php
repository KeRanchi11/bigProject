<?php
// bigProject API front-controller. Plain PHP 8.1 + PDO, no framework.
// Deploy: copy backend/api/* to public_html/api/, backend/uploads+fonts next to it,
// backend/includes + backend/config one level above docroot when possible.
// Supports both mod_rewrite clean URLs (/api/projects) and ?route= fallback.
declare(strict_types=1);

require_once __DIR__ . '/../includes/bootstrap.php';

$method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
$path = parse_api_path();
check_csrf();

function route_key(string $method, string $path): string {
  // normalize /api/projects/123 -> projects_one
  if ($path === '/health') return 'GET /health';
  if ($path === '/csrf') return 'GET /csrf';
  if ($path === '/projects') return $method . ' /projects';
  if (preg_match('#^/projects/([^/]+)$#u', $path, $m)) return $method . ' /projects_one';
  if ($path === '/likes') return $method . ' /likes';
  if ($path === '/me/likes') return 'GET /me/likes';
  if ($path === '/content') return $method . ' /content';
  if ($path === '/upload') return 'POST /upload';
  if ($path === '/upload-font') return 'POST /upload-font';
  if ($path === '/admin/login') return 'POST /admin/login';
  if ($path === '/admin/logout') return 'POST /admin/logout';
  if ($path === '/admin/status') return 'GET /admin/status';
  if ($path === '/admin/password') return 'POST /admin/password';
  if ($path === '/admin/projects') return $method . ' /admin/projects';
  if (preg_match('#^/admin/projects/([^/]+)$#u', $path)) return $method . ' /admin/projects_one';
  if ($path === '/admin/reorder') return 'POST /admin/reorder';
  if ($path === '/admin/fonts') return $method . ' /admin/fonts';
  return $method . ' ' . $path;
}

function project_row_to_api(array $r): array {
  $tags = null;
  if (isset($r['tags']) && $r['tags'] !== null && $r['tags'] !== '') {
    $d = json_decode((string)$r['tags'], true);
    $tags = is_array($d) ? array_values($d) : null;
  }
  return [
    'id' => (string)$r['id'],
    'title' => (string)$r['title'],
    'category' => (string)$r['category'],
    'image' => (string)$r['image'],
    'portrait' => (int)$r['portrait'] === 1,
    'featured' => (int)$r['featured'] === 1,
    'tags' => $tags,
    'likes' => isset($r['likes']) ? (int)$r['likes'] : 0,
    'location' => ($r['lat'] !== null || $r['lng'] !== null || !empty($r['address'])) ? [
      'lat' => $r['lat'] !== null ? (float)$r['lat'] : null,
      'lng' => $r['lng'] !== null ? (float)$r['lng'] : null,
      'address' => (string)($r['address'] ?? ''),
    ] : null,
    'sortOrder' => (int)($r['sort_order'] ?? 0),
    'createdAt' => (string)($r['created_at'] ?? ''),
  ];
}

try {
  $rk = route_key($method, $path);

  // ---- public ----
  if ($rk === 'GET /health') json_ok(['ok' => true]);
  if ($rk === 'GET /csrf') json_ok(['token' => csrf_token()]);

  if ($rk === 'GET /projects') {
    $page = page_int($_GET['page'] ?? 1, 1, 1, 1000);
    $limit = page_int($_GET['limit'] ?? 24, 24, 1, 60);
    $cat = clean_str($_GET['category'] ?? '', 100);
    $sort = in_array(($_GET['sort'] ?? 'new'), ALLOWED_SORTS, true) ? (string)$_GET['sort'] : 'new';
    $q = clean_str($_GET['q'] ?? '', 120);
    $featured = isset($_GET['featured']) ? (int)(bool)$_GET['featured'] : null;
    $off = ($page - 1) * $limit;
    $db = pdo();
    $where = [];
    $args = [];
    if ($cat !== '' && $cat !== 'همه') { $where[] = 'p.category = ?'; $args[] = $cat; }
    if ($featured !== null) { $where[] = 'p.featured = ?'; $args[] = $featured; }
    if ($q !== '') { $where[] = '(p.title LIKE ? OR p.address LIKE ? OR p.tags LIKE ?)'; $args[] = "%$q%"; $args[] = "%$q%"; $args[] = "%$q%"; }
    $w = $where ? ('WHERE ' . implode(' AND ', $where)) : '';
    $order = $sort === 'popular' ? 'ORDER BY likes DESC, p.sort_order ASC, p.created_at DESC' : 'ORDER BY p.sort_order ASC, p.created_at DESC';
    $cnt = $db->prepare("SELECT COUNT(*) c FROM projects p $w");
    $cnt->execute($args);
    $total = (int)$cnt->fetch()['c'];
    // single query with LEFT JOIN aggregate (fixes old N+1 COUNT per row)
    $sql = "SELECT p.*, COUNT(l.visitor_id) AS likes FROM projects p
            LEFT JOIN project_likes l ON l.project_id = p.id
            $w GROUP BY p.id $order LIMIT $limit OFFSET $off";
    $st = $db->prepare($sql);
    $st->execute($args);
    $rows = $st->fetchAll();
    json_ok(['projects' => array_map('project_row_to_api', $rows), 'page' => $page, 'limit' => $limit, 'total' => $total]);
  }

  if ($rk === 'GET /projects_one') {
    preg_match('#^/projects/([^/]+)$#u', $path, $m);
    $id = clean_str($m[1] ?? '', 64);
    if (!valid_project_id($id)) json_err('invalid_id', 400);
    $db = pdo();
    $st = $db->prepare('SELECT p.*, COUNT(l.visitor_id) AS likes FROM projects p LEFT JOIN project_likes l ON l.project_id = p.id WHERE p.id = ? GROUP BY p.id');
    $st->execute([$id]);
    $r = $st->fetch();
    if (!$r) json_err('not_found', 404);
    json_ok(['project' => project_row_to_api($r)]);
  }

  if ($rk === 'GET /likes' || $rk === 'POST /likes') {
    // toggle/read like counts publicly; visitor-proofed by regex + rate limit
    $body = $method === 'GET' ? $_GET : array_merge($_GET, read_json_body());
    $pid = clean_str($body['projectId'] ?? $body['id'] ?? '', 64);
    $visitor = clean_str($body['visitorId'] ?? ($_SERVER['HTTP_X_VISITOR_ID'] ?? ''), 64);
    if (!valid_project_id($pid)) json_err('invalid_id', 400);
    if (!valid_visitor($visitor)) json_err('invalid_visitor', 400);
    if (!rate_limit("like:$visitor:$pid", 30, 60)) json_err('rate_limited', 429, ['retryAfter' => 60]);
    $db = pdo();
    $e = $db->prepare('SELECT id FROM projects WHERE id = ?');
    $e->execute([$pid]);
    if (!$e->fetch()) json_err('not_found', 404);
    if ($method === 'GET') {
      $s = $db->prepare('SELECT COUNT(*) c FROM project_likes WHERE project_id = ?');
      $s->execute([$pid]);
      $mine = $db->prepare('SELECT 1 FROM project_likes WHERE project_id = ? AND visitor_id = ?');
      $mine->execute([$pid, $visitor]);
      json_ok(['count' => (int)$s->fetch()['c'], 'liked' => (bool)$mine->fetch()]);
    }
    $liked = !empty($body['liked']) && $body['liked'] !== '0' && $body['liked'] !== false;
    if ($liked) {
      $ins = $db->prepare('INSERT IGNORE INTO project_likes (project_id, visitor_id) VALUES (?, ?)');
      $ins->execute([$pid, $visitor]);
    } else {
      $del = $db->prepare('DELETE FROM project_likes WHERE project_id = ? AND visitor_id = ?');
      $del->execute([$pid, $visitor]);
    }
    $s = $db->prepare('SELECT COUNT(*) c FROM project_likes WHERE project_id = ?');
    $s->execute([$pid]);
    json_ok(['liked' => $liked, 'count' => (int)$s->fetch()['c']]);
  }

  if ($rk === 'GET /me/likes') {
    $visitor = clean_str($_SERVER['HTTP_X_VISITOR_ID'] ?? ($_GET['visitorId'] ?? ''), 64);
    if (!valid_visitor($visitor)) json_err('invalid_visitor', 400);
    $db = pdo();
    $st = $db->prepare('SELECT project_id FROM project_likes WHERE visitor_id = ?');
    $st->execute([$visitor]);
    json_ok(['liked' => array_column($st->fetchAll(), 'project_id')]);
  }

  if ($rk === 'GET /content') {
    $db = pdo();
    $rows = $db->query('SELECT `key`, `value` FROM site_content')->fetchAll();
    $out = [];
    foreach ($rows as $r) $out[$r['key']] = $r['value'];
    json_ok(['content' => $out]);
  }

  // ---- admin auth ----
  if ($rk === 'POST /admin/login') {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'x');
    if (!rate_limit("login:$ip", 8, 60)) json_err('rate_limited', 429);
    $b = read_json_body();
    $u = clean_str($b['username'] ?? $b['user'] ?? 'admin', 50);
    $p = (string)($b['password'] ?? '');
    if ($p === '' || strlen($p) > 256) json_err('password_required', 400);
    if (admin_login($u === '' ? 'admin' : $u, $p)) json_ok(['success' => true, 'csrf' => csrf_token()]);
    json_err('invalid_password', 401);
  }
  if ($rk === 'POST /admin/logout') { admin_logout(); json_ok(['success' => true]); }
  if ($rk === 'GET /admin/status') json_ok(['admin' => is_admin()]);

  if ($rk === 'POST /admin/password') {
    require_admin();
    $b = read_json_body();
    $cur = (string)($b['currentPassword'] ?? '');
    $new = (string)($b['newPassword'] ?? '');
    if (mb_strlen($new) < 8) json_err('password_too_short', 400);
    if (strlen($new) > 128) json_err('password_too_long', 400);
    $db = pdo();
    ensure_session();
    $u = (string)($_SESSION['admin_user'] ?? 'admin');
    $st = $db->prepare('SELECT id, password_hash FROM admins WHERE username = ?');
    $st->execute([$u]);
    $row = $st->fetch();
    if (!$row || !password_verify($cur, (string)$row['password_hash'])) json_err('current_password_incorrect', 401);
    $h = password_hash($new, PASSWORD_BCRYPT);
    $up = $db->prepare('UPDATE admins SET password_hash = ? WHERE id = ?');
    $up->execute([$h, $row['id']]);
    json_ok(['success' => true]);
  }

  // ---- admin writes ----
  if ($rk === 'POST /upload') {
    require_admin();
    if (empty($_FILES['file'])) json_err('no_file', 400);
    $url = store_image($_FILES['file']);
    json_ok(['url' => $url]);
  }
  if ($rk === 'POST /upload-font') {
    require_admin();
    if (empty($_FILES['file'])) json_err('no_file', 400);
    $url = store_font($_FILES['file']);
    json_ok(['url' => $url]);
  }

  if ($rk === 'POST /content') {
    require_admin();
    $b = read_json_body();
    if (!is_array($b) || $b === []) json_err('empty', 400);
    $allow = ['brandName','slogan','copyright','logoUrl','navItems','headerCta','heroEyebrow','heroHeadline1','heroHeadline2','heroDescription','heroCta','heroProofNumber','heroProofText','heroProofAvatars','aboutEyebrow','aboutHeadline1','aboutHeadline2','aboutDescription','aboutImage','aboutBadgeNumber','aboutBadgeLine1','aboutBadgeLine2','aboutValues','contactEyebrow','contactHeadline1','contactHeadline2','contactDescription','contactMethods','footerAdminLabel','categories','signFonts','defaultSignFont','fontFamily','fontSize','activePalette','whatsapp','phone','instagram','address'];
    $db = pdo();
    // Logo is a singleton: remember the current one so a replacement deletes the old file.
    $oldLogo = null;
    if (array_key_exists('logoUrl', $b)) {
      $q = $db->prepare('SELECT `value` FROM site_content WHERE `key` = ?');
      $q->execute(['logoUrl']);
      $r = $q->fetch();
      $oldLogo = $r ? (string)$r['value'] : '';
    }
    $st = $db->prepare('INSERT INTO site_content (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)');
    foreach ($b as $k => $v) {
      if (!in_array((string)$k, $allow, true)) continue;
      $val = is_string($v) ? $v : json_encode($v, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
      if ((string)$k === 'activePalette' && !in_array($val, ALLOWED_PALETTES, true)) continue;
      if (mb_strlen((string)$val) > 200000) continue;
      // sanitize URL-ish keys
      if (in_array((string)$k, ['logoUrl','aboutImage'], true)) $val = clean_url($val);
      $st->execute([(string)$k, (string)$val]);
    }
    // Single logo record: the upsert above replaces it; remove the orphaned old file.
    if ($oldLogo !== null) {
      $newLogo = clean_url($b['logoUrl'] ?? '');
      if ($oldLogo !== '' && $oldLogo !== $newLogo && str_starts_with($oldLogo, '/uploads/')) {
        $base = basename($oldLogo);
        if (preg_match('/^[a-f0-9]{16}\.(jpg|png|webp|gif|avif)$/i', $base)) {
          $f = uploads_dir() . '/' . $base;
          // Retry once: on Windows a just-written file can be briefly locked (AV/indexer).
          if (is_file($f) && !@unlink($f)) { usleep(300000); @unlink($f); }
        }
      }
    }
    json_ok(['success' => true]);
  }

  if ($rk === 'POST /admin/projects') {
    require_admin();
    $b = read_json_body();
    $id = clean_str($b['id'] ?? bin2hex(random_bytes(8)), 64);
    $title = clean_str($b['title'] ?? '', 255);
    $cat = clean_str($b['category'] ?? 'نئون', 100);
    $img = clean_url($b['image'] ?? '');
    if ($title === '' || $img === '') json_err('missing_required_fields', 400);
    if (!valid_project_id($id)) $id = bin2hex(random_bytes(8));
    $tags = !empty($b['tags']) && is_array($b['tags']) ? json_encode(array_values(array_slice($b['tags'], 0, 12)), JSON_UNESCAPED_UNICODE) : null;
    $db = pdo();
    $st = $db->prepare('INSERT INTO projects (id, title, category, image, portrait, featured, tags, lat, lng, address, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title=VALUES(title), category=VALUES(category), image=VALUES(image), portrait=VALUES(portrait), featured=VALUES(featured), tags=VALUES(tags), lat=VALUES(lat), lng=VALUES(lng), address=VALUES(address), sort_order=VALUES(sort_order)');
    $st->execute([$id, $title, $cat, $img, as_bool($b['portrait'] ?? 0), as_bool($b['featured'] ?? 0), $tags,
      isset($b['lat']) ? (float)$b['lat'] : null, isset($b['lng']) ? (float)$b['lng'] : null,
      clean_str($b['address'] ?? '', 500), (int)($b['sortOrder'] ?? 0)]);
    json_ok(['success' => true, 'id' => $id]);
  }

  if ($rk === 'PUT /admin/projects_one' || $rk === 'DELETE /admin/projects_one') {
    require_admin();
    preg_match('#^/admin/projects/([^/]+)$#u', $path, $m);
    $id = clean_str($m[1] ?? '', 64);
    if (!valid_project_id($id)) json_err('invalid_id', 400);
    $db = pdo();
    if ($method === 'DELETE') {
      $st = $db->prepare('DELETE FROM projects WHERE id = ?');
      $st->execute([$id]);
      json_ok(['success' => true]);
    }
    $b = read_json_body();
    $fields = [];
    $args = [];
    $map = ['title' => 255, 'category' => 100, 'address' => 500];
    foreach ($map as $k => $max) {
      if (array_key_exists($k, $b)) { $fields[] = "$k = ?"; $args[] = clean_str($b[$k], $max); }
    }
    if (array_key_exists('image', $b)) { $fields[] = 'image = ?'; $args[] = clean_url($b['image']); }
    foreach (['portrait', 'featured', 'sortOrder'] as $k) {
      if (array_key_exists($k, $b)) {
        $col = $k === 'sortOrder' ? 'sort_order' : $k;
        $fields[] = "$col = ?";
        $args[] = $k === 'sortOrder' ? (int)$b[$k] : as_bool($b[$k]);
      }
    }
    if (array_key_exists('tags', $b)) {
      $fields[] = 'tags = ?';
      $args[] = is_array($b['tags']) ? json_encode(array_values(array_slice($b['tags'], 0, 12)), JSON_UNESCAPED_UNICODE) : null;
    }
    if (array_key_exists('lat', $b)) { $fields[] = 'lat = ?'; $args[] = $b['lat'] === null ? null : (float)$b['lat']; }
    if (array_key_exists('lng', $b)) { $fields[] = 'lng = ?'; $args[] = $b['lng'] === null ? null : (float)$b['lng']; }
    if (!$fields) json_err('empty', 400);
    $args[] = $id;
    $st = $db->prepare('UPDATE projects SET ' . implode(', ', $fields) . ' WHERE id = ?');
    $st->execute($args);
    json_ok(['success' => true]);
  }

  if ($rk === 'POST /admin/reorder') {
    require_admin();
    $b = read_json_body();
    $orders = $b['orders'] ?? null;
    if (!is_array($orders) || count($orders) > 200) json_err('invalid_orders', 400);
    $db = pdo();
    $db->beginTransaction();
    $st = $db->prepare('UPDATE projects SET sort_order = ? WHERE id = ?');
    foreach ($orders as $o) {
      if (!is_array($o)) continue;
      $pid = clean_str($o['id'] ?? '', 64);
      if (!valid_project_id($pid)) continue;
      $st->execute([(int)($o['sortOrder'] ?? 0), $pid]);
    }
    $db->commit();
    json_ok(['success' => true]);
  }

  if ($rk === 'DELETE /admin/fonts') {
    require_admin();
    $b = read_json_body();
    $url = clean_str($b['url'] ?? '', 200);
    if (!str_starts_with($url, '/fonts/')) json_err('bad_url', 400);
    // Only files this app generated (16 hex chars + ttf/otf) — never .htaccess/.gitkeep.
    $base = basename($url);
    if (!preg_match('/^[a-f0-9]{16}\.(ttf|otf)$/i', $base)) json_err('bad_url', 400);
    $f = fonts_dir() . '/' . $base;
    if (is_file($f)) @unlink($f);
    json_ok(['success' => true]);
  }

  json_err('not_found', 404);
} catch (PDOException $e) {
  error_log('API db_error: ' . $e->getMessage());
  json_err('db_error', 500);
} catch (Throwable $e) {
  error_log('API error: ' . $e->getMessage());
  json_err('server_error', 500);
}
