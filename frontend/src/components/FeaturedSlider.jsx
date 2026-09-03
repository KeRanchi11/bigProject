import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Fixed: old version returned null before hooks when no featured items (Rules of Hooks crash).
export default function FeaturedSlider({ items, onOpen }) {
  const [i, setI] = useState(0);
  const list = (items || []).filter((p) => p.featured);
  const show = list.length > 0 ? list : (items || []).slice(0, 5);

  useEffect(() => {
    setI(0);
  }, [show.length]);

  useEffect(() => {
    if (show.length < 2) return;
    const t = setInterval(() => setI((v) => (v + 1) % show.length), 5000);
    return () => clearInterval(t);
  }, [show.length]);

  if (!show.length) return null;
  const cur = show[i % show.length];

  return (
    <section aria-label="منتخب‌ها">
      <div className="card overflow-hidden relative">
        <button onClick={() => onOpen(cur.id)} className="block w-full text-right">
          <img src={cur.image} alt={cur.title} loading="lazy" className="w-full h-64 md:h-80 object-cover" />
          <span className="absolute bottom-4 right-4 left-4 flex items-end justify-between gap-3">
            <span className="card px-4 py-2 text-sm font-bold">{cur.title}</span>
            <span className="chip on !cursor-default">منتخب ❤️ {cur.likes || 0}</span>
          </span>
        </button>
        {show.length > 1 && (
          <>
            <button aria-label="قبلی" onClick={() => setI((v) => (v - 1 + show.length) % show.length)} className="absolute top-1/2 -translate-y-1/2 right-3 card !rounded-full p-2"><ChevronRight size={18} /></button>
            <button aria-label="بعدی" onClick={() => setI((v) => (v + 1) % show.length)} className="absolute top-1/2 -translate-y-1/2 left-3 card !rounded-full p-2"><ChevronLeft size={18} /></button>
            <span className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {show.map((_, d) => (
                <span key={d} className="h-1.5 rounded-full" style={{ width: d === i % show.length ? 22 : 8, background: d === i % show.length ? 'var(--acc)' : 'var(--line)' }} />
              ))}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
