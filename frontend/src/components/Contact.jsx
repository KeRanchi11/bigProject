import { useState } from 'react';

export default function Contact({ content, notify }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const wa = content.whatsapp || '989121234567';

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { notify('نام و شماره تماس لازم است'); return; }
    const text = 'سلام، من ' + name + ' هستم (' + phone + '). ' + msg;
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank');
    notify('در واتساپ ادامه دهید');
  };

  return (
    <section id="contact" className="wrap py-8">
      <div className="card p-6 md:p-8 grid md:grid-cols-2 gap-6">
        <div>
          <p className="mut text-sm mb-1">{content.contactEyebrow || 'وقتشه بدرخشید'}</p>
          <h2 className="text-3xl font-black leading-[1.6] mb-2">
            {content.contactHeadline1 || 'برای دیده شدن'}
            <br />
            <span style={{ color: 'var(--acc)' }}>{content.contactHeadline2 || 'آماده‌ید؟'}</span>
          </h2>
          <p className="mut leading-7 mb-4">{content.contactDescription}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a className="btn-acc" target="_blank" rel="noreferrer" href={'https://wa.me/' + wa}>گفت‌وگو در واتساپ</a>
            {content.instagram && <a className="btn-ghost" target="_blank" rel="noreferrer" href={content.instagram}>اینستاگرام</a>}
          </div>
        </div>
        <form onSubmit={submit} className="grid gap-3">
          <input className="inp" placeholder="نام شما" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="inp" placeholder="شماره تماس (مثل 09120000000)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <textarea className="inp" rows={4} placeholder="درباره تابلو چه چیزی در ذهن دارید؟ ابعاد، متن، رنگ…" value={msg} onChange={(e) => setMsg(e.target.value)} />
          <button className="btn-acc" type="submit">ارسال درخواست مشاوره</button>
          <p className="mut text-xs leading-6">با ارسال فرم، مستقیم به واتساپ مجموعه وصل می‌شوید. بدون اسپم.</p>
        </form>
      </div>
    </section>
  );
}
