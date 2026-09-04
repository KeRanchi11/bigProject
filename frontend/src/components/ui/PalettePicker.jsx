import { Moon, Sun } from 'lucide-react';

export const PALETTE_META = [
  { id: 'ember', name: 'آتشی', dot: '#ff5a3c' },
  { id: 'ocean', name: 'اقیانوس', dot: '#22b8e6' },
  { id: 'forest', name: 'جنگل', dot: '#4ade80' },
  { id: 'violet', name: 'بنفش', dot: '#a78bfa' },
  { id: 'gold', name: 'طلایی', dot: '#f5b301' },
  { id: 'rose', name: 'رز', dot: '#fb4d6d' },
  { id: 'teal', name: 'سبزآبی', dot: '#2dd4bf' },
  { id: 'midnight', name: 'نیمه‌شب', dot: '#5b8cff' },
];

const metaOf = (id) => PALETTE_META.find((m) => m.id === id) || { id, name: id, dot: '#888' };

// Public header: pass only theme+toggleTheme (palette is global, admin-controlled).
// Admin settings: pass palette+setPalette+palettes to show the dots.
export default function PalettePicker({ palette, setPalette, theme, toggleTheme, palettes = [] }) {
  const showDots = typeof setPalette === 'function' && palettes.length > 0;
  return (
    <div className="flex items-center gap-2">
      {showDots && (
        <div className="flex items-center gap-1.5" role="group" aria-label="پالت رنگ">
          {palettes.map((p) => {
            const m = metaOf(p);
            return (
              <button
                key={p}
                title={m.name}
                aria-label={m.name}
                onClick={() => setPalette(p)}
                className={'sw' + (palette === p ? ' on' : '')}
                style={{ background: m.dot }}
              />
            );
          })}
        </div>
      )}
      <button className="btn-ghost !px-3 !py-2" onClick={toggleTheme} aria-label="روشن / تیره">
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </div>
  );
}
