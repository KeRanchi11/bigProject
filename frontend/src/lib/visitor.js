const KEY = 'bigproject-visitor';
const RE = /^[A-Za-z0-9_-]{8,64}$/;

export function getVisitorId() {
  try {
    let v = localStorage.getItem(KEY);
    if (v && RE.test(v)) return v;
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
