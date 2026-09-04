export default function Footer({ content, onAdmin, onHome, isAdminPage }) {
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());
  return (
    <footer className="wrap foot">
      <div className="card px-5 py-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-bold">{content.brandName} <span className="mut font-normal">— {content.slogan || 'تابلوی شما، امضای ما'}</span></span>
        <span className="mut">{content.copyright || ('© ' + year + ' تابلوسازی ملکی')}</span>
        {isAdminPage
          ? <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={onHome}>مشاهده وبسایت</button>
          : <button className="btn-ghost !py-1.5 !px-3 text-xs" onClick={onAdmin}>ورود مدیر</button>}
      </div>
    </footer>
  );
}
