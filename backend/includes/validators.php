<?php
// Input validators. PHP 8.1 compatible.
declare(strict_types=1);

const VISITOR_RE = '/^[A-Za-z0-9_\-]{8,64}$/';
const ALLOWED_CATEGORIES = ['نئون', 'سردر فروشگاه', 'حروف برجسته', 'بیلبورد'];
const ALLOWED_SORTS = ['new', 'popular'];

function valid_visitor(?string $id): bool {
  return is_string($id) && (bool)preg_match(VISITOR_RE, $id);
}

function valid_project_id(?string $id): bool {
  return is_string($id) && $id !== '' && strlen($id) <= 64 && (bool)preg_match('/^[A-Za-z0-9_\-]+$/u', $id);
}

function clean_str(mixed $v, int $max = 500): string {
  if (!is_string($v)) return '';
  $v = trim($v);
  // strip control chars, keep Persian/unicode
  $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v);
  if ($v === null) $v = '';
  if (mb_strlen($v) > $max) $v = mb_substr($v, 0, $max);
  return $v;
}

function clean_url(mixed $v, int $max = 2000): string {
  $s = clean_str($v, $max);
  if ($s === '') return '';
  // Allow relative uploads/fonts + https http. Block javascript:/data: to prevent XSS.
  if (str_starts_with($s, '/uploads/') || str_starts_with($s, '/fonts/')) return $s;
  if (str_starts_with($s, 'https://') || str_starts_with($s, 'http://')) {
    if (preg_match('/^https?:\/\/[^\s<>"\']+$/u', $s)) return $s;
    return '';
  }
  return '';
}

function as_bool(mixed $v): int {
  return $v ? 1 : 0;
}

function page_int(mixed $v, int $def, int $min, int $max): int {
  $n = (int)$v;
  if ($n < $min) return $def;
  if ($n > $max) return $max;
  return $n;
}
