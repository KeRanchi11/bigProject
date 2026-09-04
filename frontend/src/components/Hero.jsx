import { useHero } from '../hooks/useHero';

export default function Hero({ onCta, onGallery }) {
  const { hero } = useHero();
  return (
    <section className="grid md:grid-cols-2 gap-6 md:gap-8 items-center hero-top">
      <div>
        <p className="mut text-sm mb-2">{hero.eyebrow}</p>
        <h1 className="text-4xl md:text-5xl font-black leading-[1.4] mb-3">
          {hero.headline1}
          <br />
          <span style={{ color: 'var(--acc)' }}>{hero.headline2}</span>
        </h1>
        <p className="mut leading-8 mb-5">{hero.description}</p>
        <div className="flex flex-wrap gap-2">
          <button className="btn-acc" onClick={onCta}>{hero.cta}</button>
          <button className="btn-ghost" onClick={onGallery}>دیدن نمونه‌کارها</button>
        </div>
        <div className="flex items-center gap-3 mt-6 text-sm">
          <span className="text-2xl font-black" style={{ color: 'var(--acc)' }}>{hero.proof_number}</span>
          <span className="mut">{hero.proof_text}</span>
        </div>
      </div>
      <div className="card pad-lg text-center neon-frame overflow-hidden" aria-label="نمایش نئون">
        <div className="neon-small mut text-sm">{hero.neon_small}</div>
        <div className="neon-big">
          {hero.neon_line1}
          <br />
          {hero.neon_line2}
        </div>
      </div>
    </section>
  );
}
