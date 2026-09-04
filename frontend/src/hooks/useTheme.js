import { useCallback, useEffect, useState } from 'react';

export const PALETTES = ['ember', 'ocean', 'forest', 'violet', 'gold', 'rose', 'teal', 'midnight'];
const T_KEY = 'bigproject-theme';

// Palette is GLOBAL: controlled by admin via site content (activePalette).
// Light/dark stays per-user in localStorage.
export function useTheme(globalPalette) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(T_KEY) || 'dark'; } catch { return 'dark'; }
  });
  const palette = PALETTES.includes(globalPalette) ? globalPalette : 'ember';

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
    try { localStorage.setItem(T_KEY, theme); } catch { /* ignore */ }
  }, [palette, theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
  return { palette, theme, setTheme, toggleTheme, palettes: PALETTES, PALETTES };
}
