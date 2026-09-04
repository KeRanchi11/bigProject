import { useMemo, useState } from 'react';

export default function FontPreview({ content, onBack }) {
  const fonts = Array.isArray(content.signFonts) && content.signFonts.length
    ? content.signFonts
    : [{ name: 'Vazirmatn', family: 'Vazirmatn', googleUrl: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap', fileUrl: '' }];
  const [text, setText] = useState('تابلوسازی ملکی');
  const [size, setSize] = useState(44);
  const [color, setColor] = useState('#ffb03c');
  const [glow, setGlow] = useState(true);
  const [fq, setFq] = useState('');

  const css = useMemo(() => fonts.map((f) => {
    if (!f.fileUrl) return '';
    const fmt = String(f.fileUrl).toLowerCase().endsWith('.otf') ? 'opentype' : 'truetype';
    return "@font-face{font-family:'" + f.family + "';src:url('" + f.fileUrl + "') format('" + fmt + "');font-display:swap}";
  }).join('\n'), [fonts]);

  const shown = fq.trim()
    ? fonts.filter((f) => String(f.name || '').includes(fq.trim()))
    : fonts;

  return (
    <section className="wrap page">
      <button className="btn-ghost mb-4" onClick={onBack}>→ بازگشت</button>
      <div className="card card-pad mb-4 grid md:grid-cols-4 gap-3">
        <input className="inp md:col-span-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="متن تابلو… همین متن با همه فونت‌ها نمایش داده می‌شود" />
        <input className="inp" value={fq} onChange={(e) => setFq(e.target.value)} placeholder="جست‌وجوی فونت…" />
        <label className="text-sm mut flex items-center gap-2">اندازه
          <input type="range" min={20} max={110} value={size} onChange={(e) => setSize(+e.target.value)} className="grow" />
          {size}
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="رنگ" />
          <label className="mut flex items-center gap-1.5"><input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} /> درخشش نئون</label>
        </div>
      </div>
      <p className="mut text-sm mb-3">مقایسه زنده در {shown.length} فونت</p>
      <style>{css}</style>
      {shown.map((f) => (
        <div key={f.family || f.name} className="card card-pad mb-3 text-center overflow-hidden">
          <p className="mut text-xs mb-2">{f.name}</p>
          <p
            className="neon-demo break-words"
            style={{
              fontFamily: "'" + (f.family || 'Vazirmatn') + "', Vazirmatn, Tahoma, sans-serif",
              fontSize: size,
              color,
              textShadow: glow ? '0 0 14px ' + color + '88, 0 0 44px ' + color + '55' : 'none'
            }}
          >
            {text || '…'}
          </p>
          {!f.fileUrl && f.googleUrl && <link rel="stylesheet" href={f.googleUrl} media="print" onLoad={(e) => { e.currentTarget.media = 'all'; }} />}
        </div>
      ))}
      {shown.length === 0 && <div className="card card-pad mut text-sm text-center">فونتی با این نام پیدا نشد.</div>}
    </section>
  );
}
