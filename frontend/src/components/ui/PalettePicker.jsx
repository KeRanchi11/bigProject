import { Moon, Sun } from 'lucide-react';

const NAMES = {
  ember: 'آتشی', ocean: 'اقیانوس', forest: 'جنگل', violet: 'بنفش',
  gold: 'طلایی', rose: 'رز', teal: 'سبزآبی', midnight: 'نیمه‌شب'
};
const DOTS = {
  ember: '#ff5a3c', ocean: '#22b8e6', forest: '#4ade80', violet: '#a78bfa',
  gold: '#f5b301', rose: '#fb4d6d', teal: '#2dd4bf', midnight: '#5b8cff'
};

export default function PalettePicker({ palette, setPalette, theme, toggleTheme, palettes = [] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5" role="group" aria-label="پالت رنگ">
        {palettes.map((p) => (
          <button
            key={p}
            title={NAMES[p] || p}
            aria-label={NAMES[p] || p}
            onClick={() => setPalette(p)}
            className={'sw' + (palette === p ? ' on' : '')}
            style={{ background: DOTS[p] }}
          />
        ))}
      </div>
      <button className="btn-ghost !px-3 !py-2" onClick={toggleTheme} aria-label="روشن / تیره">
        {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
      </button>
    </div>
  );
}
