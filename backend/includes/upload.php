<?php
// Multipart upload handling with real MIME validation (finfo + getimagesize).
// PHP 8.1 compatible. Light limits for shared hosting (8MB image / 10MB font).
declare(strict_types=1);

const IMG_MAX_BYTES = 8 * 1024 * 1024;
const FONT_MAX_BYTES = 10 * 1024 * 1024;

function uploads_dir(): string {
  // Prefer directory next to api/ so cPanel public_html/api/../uploads works.
  $d = __DIR__ . '/../uploads';
  if (!is_dir($d)) @mkdir($d, 0755, true);
  return $d;
}

function fonts_dir(): string {
  $d = __DIR__ . '/../fonts';
  if (!is_dir($d)) @mkdir($d, 0755, true);
  return $d;
}

function store_image(array $file): string {
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) json_err('upload_failed', 400);
  if (($file['size'] ?? 0) > IMG_MAX_BYTES) json_err('too_large', 413);
  $tmp = (string)$file['tmp_name'];
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = (string)$finfo->file($tmp);
  $map = ['image/jpeg' => '.jpg', 'image/png' => '.png', 'image/webp' => '.webp', 'image/gif' => '.gif', 'image/avif' => '.avif'];
  if (!isset($map[$mime])) json_err('bad_type', 415);
  // getimagesize blocks SVG-as-image / polyglot uploads served as image
  $info = @getimagesize($tmp);
  if ($info === false) json_err('bad_image', 415);
  if ($info[0] < 8 || $info[1] < 8 || $info[0] > 8000 || $info[1] > 8000) json_err('bad_dimensions', 422);
  $name = bin2hex(random_bytes(8)) . $map[$mime];
  $dest = uploads_dir() . '/' . $name;
  if (!@move_uploaded_file($tmp, $dest)) json_err('write_failed', 500);
  @chmod($dest, 0644);
  return '/uploads/' . $name;
}

function store_font(array $file): string {
  if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) json_err('upload_failed', 400);
  if (($file['size'] ?? 0) > FONT_MAX_BYTES) json_err('too_large', 413);
  $tmp = (string)$file['tmp_name'];
  $finfo = new finfo(FILEINFO_MIME_TYPE);
  $mime = strtolower((string)$finfo->file($tmp));
  $orig = strtolower((string)($file['name'] ?? ''));
  $ext = str_ends_with($orig, '.otf') ? '.otf' : '.ttf';
  $okMime = in_array($mime, ['font/ttf', 'font/otf', 'application/font-sfnt', 'application/x-font-ttf', 'application/octet-stream', 'font/sfnt'], true);
  if (!$okMime) json_err('bad_type', 415);
  // basic magic check: TTF starts 00 01 00 00 / OTTO / wOFF
  $head = @file_get_contents($tmp, false, null, 0, 8);
  $magicOk = is_string($head) && (
    str_starts_with($head, "\x00\x01\x00\x00") || str_starts_with($head, 'OTTO') ||
    str_starts_with($head, 'wOFF') || str_starts_with($head, 'true')
  );
  if (!$magicOk) json_err('bad_font', 415);
  $name = bin2hex(random_bytes(8)) . $ext;
  $dest = fonts_dir() . '/' . $name;
  if (!@move_uploaded_file($tmp, $dest)) json_err('write_failed', 500);
  @chmod($dest, 0644);
  return '/fonts/' . $name;
}
