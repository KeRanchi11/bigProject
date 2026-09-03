import { Heart, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { faNum } from '../lib/pricing';

export default function Gallery({ hook, likes, onOpen, notify }) {
  const { projects, total, page, setPage, limit, category, setCategory, sort, setSort, q, setQ, loading } = hook;
  const [box, setBox] = useState(q);
  const cats = ['همه', 'نئون', 'سردر فروشگاه', 'حروف برجسته', 'بیلبورد'];

  // debounce search -> server-side query (old version filtered huge list in memory)
  useEffect(() => {
    const t = setTimeout(() => { setQ(box); setPage(1); }, 450);
    return () => clearTimeout(t);
  }, [box, setQ, setPage]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <section id="gallery" className="stack-sm">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative grow min-w-[220px]">
          <input className="inp !pr-10" placeholder="جست‌وجو در نمونه‌کارها…" value={box} onChange={(e) => setBox(e.target.value)} />
          <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 mut" />
        </div>
        <select className="sel !w-auto" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="new">جدیدترین</option>
          <option value="popular">پرطرفدارترین</option>
        </select>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {cats.map((c) => (
          <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={'chip' + (category === c ? ' on' : '')}>{c}</button>
        ))}
      </div>
      {loading ? (
        <div className="grid-gal">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-64 animate-pulse" />)}</div>
      ) : projects.length === 0 ? (
        <div className="card pad-lg text-center mut">نمونه‌کاری پیدا نشد. عبارت دیگری را امتحان کنید.</div>
      ) : (
        <>
          <div className="grid-gal">
            {projects.map((p) => {
              const count = likes.counts[p.id] ?? p.likes ?? 0;
              const isLiked = likes.liked.has(p.id);
              return (
                <article key={p.id} className="card overflow-hidden">
                  <button onClick={() => onOpen(p.id)} className="block w-full">
                    <img src={p.image} alt={p.title} loading="lazy" className="gal-img" />
                  </button>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">{p.title}</h3>
                      <p className="mut text-xs mt-0.5">{p.category}</p>
                    </div>
                    <button
                      aria-label="پسندیدن"
                      onClick={() => likes.toggle(p, p.likes)}
                      className="btn-ghost !px-2.5 !py-2 flex items-center gap-1 text-sm"
                    >
                      <Heart size={16} fill={isLiked ? 'var(--acc)' : 'none'} color={isLiked ? 'var(--acc)' : 'currentColor'} />
                      {faNum(count)}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-3 text-sm">
            <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</button>
            <span className="mut">صفحه {faNum(page)} از {faNum(pages)} — {faNum(total)} نمونه‌کار</span>
            <button className="btn-ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>بعدی</button>
          </div>
        </>
      )}
    </section>
  );
}
