import { useMemo, useState } from 'react';

export default function FontPreview({ content, onBack }) {
  const fonts = Array.isArray(content.signFonts) && content.signFonts.length
    ? content.signFonts
    : [{ name: 'Vazirmatn', family: 'Vazirmatn', googleUrl: 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap', fileUrl: '' }];
  const [text, setText] = useState('تابلوسازی ملکی');
  const [size, setSize] = useState(44);
  const [color, setColor] = useState('#ffb03c');
  const [glow, setGlow] = useState(true);

  const css = useMemo(() => fonts.map((f) => {
    if (f.fileUrl) return "@font-face{font-family:'" + f.family + "';src:url('" + f.fileUrl + "');font-display:swap}";
    return '';
  }).join('\n'), [fonts]);

  return (
    <section className="wrap py-6">
      <button className="btn-ghost mb-4" onClick={onBack}>→ بازگشت</button>
      <div className="card p-5 mb-4 grid md:grid-cols-4 gap-3">
        <input className="inp md:col-span-2" value={text} onChange={(e) => setText(e.target.value)} placeholder="متن تابلو…" />
        <label className="text-sm mut flex items-center gap-2">اندازه
          <input type="range" min={20} max={110} value={size} onChange={(e) => setSize(+e.target.value)} className="grow" />
          {size}
        </label>
        <div className="flex items-center gap-2 text-sm">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="رنگ" />
          <label className="mut flex items-center gap-1.5"><input type="checkbox" checked={glow} onChange={(e) => setGlow(e.target.checked)} /> درخشش نئون</label>
        </div>
      </div>
      <style>{css}</style>
      {fonts.map((f) => (
        <div key={f.family || f.name} className="card p-6 mb-3 text-center overflow-hidden">
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
    </section>
  );
}
