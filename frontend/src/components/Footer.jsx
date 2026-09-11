import { Instagram, MapPin, Phone } from 'lucide-react';
import { useFooter } from '../hooks/useFooter';

export default function Footer({ content, onAdmin, onHome, isAdminPage }) {
  const { info } = useFooter();
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
  const instaHref = info.insta_link
    || (info.insta_label ? 'https://instagram.com/' + info.insta_label.replace(/^@/, '') : null);
  return (
    <footer className="wrap foot">
      <div className="card px-5 py-5">
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex flex-wrap items-center gap-x-5 gap-y-2">
          {info.phone ? (
            info.phone_link
              ? <a href={info.phone_link} className="inline-flex items-center gap-2"><Phone size={16} className="shrink-0" style={{ color: 'var(--acc)' }} /><span>{info.phone}</span></a>
              : <span className="inline-flex items-center gap-2"><Phone size={16} className="shrink-0" style={{ color: 'var(--acc)' }} /><span>{info.phone}</span></span>
          ) : null}
          {instaHref
            ? <a href={instaHref} target="_blank" rel="noreferrer" aria-label="اینستاگرام" className="inline-flex items-center gap-2"><Instagram size={18} style={{ color: 'var(--acc)' }} />{info.insta_label ? <span>{info.insta_label}</span> : null}</a>
            : null}
          {info.address ? (
            info.map_link
              ? <a href={info.map_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2"><MapPin size={16} className="shrink-0" style={{ color: 'var(--acc)' }} /><span>{info.address}</span></a>
              : <span className="inline-flex items-center gap-2"><MapPin size={16} className="shrink-0" style={{ color: 'var(--acc)' }} /><span>{info.address}</span></span>
          ) : null}
          </span>
        </div>
        <div className="border-t my-4" style={{ borderColor: 'var(--line)' }} />
        <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-sm">
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1 min-w-0">
            {content.slogan ? <span className="font-bold">{content.slogan}</span> : null}
            <span className="mut">{content.copyright || ('© ' + year + ' تابلوسازی ملکی')}</span>
          </span>
          <span className="inline-flex items-center gap-3 shrink-0">
            {content.logoUrl
              ? <img src={content.logoUrl} alt={content.brandName} className="h-8 w-auto max-w-[160px] object-contain" />
              : null}
            {content.brandName ? <b className="whitespace-nowrap">{content.brandName}</b> : null}
            {isAdminPage
              ? <button className="btn-ghost !py-1.5 !px-3 text-xs shrink-0" onClick={onHome}>مشاهده وبسایت</button>
              : <button className="btn-ghost !py-1.5 !px-3 text-xs shrink-0" onClick={onAdmin}>ورود مدیر</button>}
          </span>
        </div>
      </div>
    </footer>
  );
}
