import { Menu, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import PalettePicker from './ui/PalettePicker';

// Fixed: old file added window listener during render and returned cleanup
// instead of JSX, so header never rendered. Now uses useEffect correctly.
export default function Header({ content, themeProps, onNav, onAdmin }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn();
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const go = (id) => {
    setOpen(false);
    onNav(id);
  };

  return (
    <header className={'site-header' + (scrolled ? ' scrolled' : '')}>
      <div className="wrap flex items-center justify-between py-3 gap-3">
        <button onClick={() => go('top')} className="flex items-center gap-2 font-extrabold text-lg">
          {content.logoUrl
            ? <img src={content.logoUrl} alt={content.brandName} className="h-9 w-9 rounded-xl object-cover" />
            : <span className="grid place-items-center h-9 w-9 rounded-xl btn-acc"><Sparkles size={19} /></span>}
          <span>{content.brandName || 'تابلوسازی ملکی'}</span>
        </button>
        <nav className="hidden md:flex items-center gap-5 text-[15px]" aria-label="منوی اصلی">
          <button onClick={() => go('gallery')} className="mut hover:text-[var(--ink)]">نمونه‌کارها</button>
          <button onClick={() => go('about')} className="mut hover:text-[var(--ink)]">درباره ما</button>
          <button onClick={() => go('contact')} className="mut hover:text-[var(--ink)]">تماس</button>
          <button onClick={() => go('price')} className="mut hover:text-[var(--ink)]">محاسبه قیمت</button>
          <button onClick={() => go('fonts')} className="mut hover:text-[var(--ink)]">پیش‌نمایش فونت</button>
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <PalettePicker theme={themeProps.theme} toggleTheme={themeProps.toggleTheme} />
          <button className="btn-acc" onClick={() => go('contact')}>{content.headerCta || 'مشاوره رایگان'}</button>
        </div>
        <button className="md:hidden btn-ghost !px-3 !py-2" onClick={() => setOpen((o) => !o)} aria-label="منو" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <div className="md:hidden wrap pb-4 flex flex-col gap-2">
          {[['gallery', 'نمونه‌کارها'], ['about', 'درباره ما'], ['contact', 'تماس'], ['price', 'محاسبه قیمت'], ['fonts', 'پیش‌نمایش فونت']].map(([id, label]) => (
            <button key={id} onClick={() => go(id)} className="card px-4 py-3 text-right">{label}</button>
          ))}
          <PalettePicker theme={themeProps.theme} toggleTheme={themeProps.toggleTheme} />
          <button className="btn-ghost" onClick={onAdmin}>ورود مدیر</button>
        </div>
      )}
    </header>
  );
}
