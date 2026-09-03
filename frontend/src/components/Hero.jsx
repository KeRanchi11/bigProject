export default function Hero({ content, onCta, onGallery }) {
  return (
    <section className="grid md:grid-cols-2 gap-6 md:gap-8 items-center hero-top">
      <div>
        <p className="mut text-sm mb-2">{content.heroEyebrow || 'طراحی شده برای دیده شدن'}</p>
        <h1 className="text-4xl md:text-5xl font-black leading-[1.4] mb-3">
          {content.heroHeadline1 || 'تابلوی شما،'}
          <br />
          <span style={{ color: 'var(--acc)' }}>{content.heroHeadline2 || 'امضای ماست.'}</span>
        </h1>
        <p className="mut leading-8 mb-5">{content.heroDescription}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-acc" onClick={onCta}>{content.heroCta || 'شروع یک همکاری'}</button>
          <button className="btn-ghost" onClick={onGallery}>دیدن نمونه‌کارها</button>
        </div>
        <div className="flex items-center gap-3 mt-6 text-sm">
          <span className="text-2xl font-black" style={{ color: 'var(--acc)' }}>{content.heroProofNumber || '+۱۲۰'}</span>
          <span className="mut">{content.heroProofText || 'پروژه موفق در سراسر ایران'}</span>
        </div>
      </div>
      <div className="card pad-lg text-center">
        <div className="neon-demo text-3xl mb-1" style={{ color: 'var(--acc)', textShadow: '0 0 18px var(--glow), 0 0 46px var(--glow)' }}>
          SHINE BRIGHT
        </div>
        <div className="mut text-sm mb-4">GOOD IDEAS</div>
        <div className="flex justify-center gap-2 text-xs">
          <span className="chip on">از ایده</span>
          <span className="chip">تا اجرا</span>
        </div>
        <p className="mut text-xs mt-4 leading-6">پیش‌نمایش زنده با پالت انتخابی شما — سبک و بدون افکت سنگین</p>
      </div>
    </section>
  );
}
