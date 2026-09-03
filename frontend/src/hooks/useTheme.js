import { useCallback, useEffect, useState } from 'react';

export const PALETTES = ['ember', 'ocean', 'forest', 'violet', 'gold', 'rose', 'teal', 'midnight'];
const P_KEY = 'bigproject-palette';
const T_KEY = 'bigproject-theme';

export function useTheme() {
  const [palette, setPalette] = useState(() => {
    try { return localStorage.getItem(P_KEY) || 'ember'; } catch { return 'ember'; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(T_KEY) || 'dark'; } catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.dataset.palette = PALETTES.includes(palette) ? palette : 'ember';
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
    try {
      localStorage.setItem(P_KEY, palette);
      localStorage.setItem(T_KEY, theme);
    } catch { /* ignore */ }
  }, [palette, theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
  return { palette, setPalette, theme, setTheme, toggleTheme, PALETTES };
}
