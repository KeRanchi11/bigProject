// Device-based fingerprint that stays consistent across browsers on the same device.
// Combines hardware & OS signals that are stable and identical between Chrome/Firefox/Edge:
//   screen resolution (width, height, colorDepth),
//   CPU cores (hardwareConcurrency),
//   operating system family (Windows, Mac, Linux, Android, iOS),
//   touch capabilities (maxTouchPoints),
//   system timezone & timezone offset,
//   WebGL GPU hardware limits and normalized unmasked renderer name.
// Excludes browser-specific properties (e.g. navigator.deviceMemory, canvas 2D rendering,
// browser UI languages) so the fingerprint matches across all browsers on the same machine.

const KEY = 'bigproject-visitor-device';
const LEGACY_KEY = 'bigproject-visitor';
const RE = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * Simple string → 32-char hex hash (FNV-1a 128-bit, deterministic).
 */
function hashFnv(str) {
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0x01000193 >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193) >>> 0;
    h2 ^= c ^ (c << 7);
    h2 = Math.imul(h2, 0x01000193) >>> 0;
  }
  const a = h1 >>> 0;
  const b = h2 >>> 0;
  const c = (h1 ^ (h2 >>> 16)) >>> 0;
  const d = (h2 ^ (h1 >>> 16)) >>> 0;
  return [a, b, c, d].map((n) => n.toString(16).padStart(8, '0')).join('');
}

function getOS() {
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const s = ((nav.platform || '') + ' ' + (nav.userAgent || '')).toLowerCase();
  if (/windows|win32|win64/i.test(s)) return 'windows';
  if (/macintosh|mac os x|macos/i.test(s)) return 'mac';
  if (/android/i.test(s)) return 'android';
  if (/iphone|ipad|ipod/i.test(s)) return 'ios';
  if (/linux/i.test(s)) return 'linux';
  return 'other';
}

function getGpu() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-gl';

    const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0;
    const maxRender = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) || 0;
    const maxVarying = gl.getParameter(gl.MAX_VARYING_VECTORS) || 0;
    const maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS) || 0;

    let renderer = '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '';
    }

    // Normalize renderer string: remove browser and driver wrappers
    let clean = (renderer || '').toLowerCase();
    clean = clean.replace(/google\s+inc\.?|mozilla/gi, '');
    clean = clean.replace(/angle\s*\(([^)]+)\)/gi, '$1');
    clean = clean.replace(/angle/gi, '');
    clean = clean.replace(/direct3d\w*|d3d\w*|vs_\S+|ps_\S+|\/pcie\S*|sse\d*/gi, '');
    clean = clean.replace(/\(r\)|\(tm\)/gi, '');
    clean = clean.replace(/[^a-z0-9]/gi, ' ');
    clean = clean.replace(/\s+/g, ' ').trim();

    return [maxTex, maxRender, maxVarying, maxAttribs, clean].join(';');
  } catch {
    return 'gl-none';
  }
}

function collectSignals() {
  const s = typeof window !== 'undefined' ? window.screen || {} : {};
  const nav = typeof navigator !== 'undefined' ? navigator : {};

  let tz = '';
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {}

  return [
    // Screen resolution & color depth (monitor hardware)
    s.width || 0,
    s.height || 0,
    s.colorDepth || 0,

    // CPU logical cores
    nav.hardwareConcurrency || 0,

    // OS family
    getOS(),

    // Touch support
    nav.maxTouchPoints || 0,

    // Timezone & offset
    tz,
    new Date().getTimezoneOffset(),

    // GPU hardware limits & normalized renderer
    getGpu(),
  ].join('||');
}

export function getVisitorRaw() {
  try {
    return collectSignals();
  } catch {
    return 'err';
  }
}

export function getLegacyVisitorId() {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy && RE.test(legacy)) return legacy;
  } catch {}
  return null;
}

export function getVisitorId() {
  try {
    const raw = collectSignals();
    const fp = 'df_' + hashFnv(raw);

    try {
      localStorage.setItem(KEY, fp);
    } catch {}

    return fp;
  } catch {
    try {
      let v = localStorage.getItem(KEY);
      if (v && RE.test(v)) return v;
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy && RE.test(legacy)) return legacy;
      const base = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx')
        .replace(/-/g, '_')
        .slice(0, 32);
      v = ('v_' + base).slice(0, 40);
      localStorage.setItem(KEY, v);
      return v;
    } catch {
      return 'v_fallback_12345678';
    }
  }
}
