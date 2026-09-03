import { X } from 'lucide-react';
import { useEffect } from 'react';
import { faNum } from '../lib/pricing';

export default function Lightbox({ project, all, liked, count, onClose, onPrev, onNext, onLike, whatsapp }) {
  useEffect(() => {
    const fn = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onNext();
      if (e.key === 'ArrowRight') onPrev();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose, onNext, onPrev]);

  if (!project) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center p-4" style={{ background: 'rgba(0,0,0,.65)' }} onClick={onClose} role="dialog" aria-modal="true">
      <div className="card max-w-3xl w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          <img src={project.image} alt={project.title} className="w-full max-h-[60vh] object-contain bg-black" />
          <button onClick={onClose} aria-label="بستن" className="absolute top-3 left-3 card !rounded-full p-2"><X size={18} /></button>
        </div>
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold">{project.title}</h3>
            <p className="mut text-sm mt-1">{project.category}{project.location?.address ? ' — ' + project.location.address : ''}</p>
            {Array.isArray(project.tags) && project.tags.length > 0 && (
              <p className="mut text-xs mt-1">{project.tags.join(' • ')}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-ghost" onClick={onLike}>❤️ {faNum(count ?? project.likes ?? 0)} {liked ? 'پسندیده شد' : 'بپسند'}</button>
            <a className="btn-acc" target="_blank" rel="noreferrer" href={'https://wa.me/' + (whatsapp || '989121234567') + '?text=' + encodeURIComponent('سلام، درباره «' + project.title + '» مشاوره می‌خواهم.')}>سفارش در واتساپ</a>
          </div>
        </div>
      </div>
    </div>
  );
}
