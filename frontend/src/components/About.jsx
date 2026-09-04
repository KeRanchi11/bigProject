import { useAbout } from '../hooks/useAbout';

export default function About() {
  const { about } = useAbout();
  return (
    <section id="about" className="grid md:grid-cols-2 gap-6 items-center">
      <div>
        <p className="mut text-sm mb-1">{about.eyebrow || 'داستان ما'}</p>
        <h2 className="text-3xl font-black leading-[1.6] mb-3">
          {about.headline1 || 'ما فقط تابلو'}
          <br />
          <span style={{ color: 'var(--acc)' }}>{about.headline2 || 'نمی‌سازیم.'}</span>
        </h2>
        <p className="mut leading-8">{about.description || 'کمک می‌کنیم برند شما دیده و به یاد سپرده شود.'}</p>
      </div>
      <div className="card overflow-hidden">
        {about.image
          ? <img src={about.image} alt="درباره ما" loading="lazy" className="w-full h-72 object-cover" />
          : <div className="h-72 grid place-items-center mut">تصویر کارگاه / نمونه‌کار شاخص</div>}
      </div>
    </section>
  );
}
