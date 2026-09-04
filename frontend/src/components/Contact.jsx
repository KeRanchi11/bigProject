import { useState } from 'react';
import { useContact } from '../hooks/useContact';

export default function Contact({ notify }) {
  const { contact } = useContact();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [msg, setMsg] = useState('');
  const wa = contact.whatsapp || '989121234567';

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) { notify('نام و شماره تماس لازم است'); return; }
    const text = 'سلام، من ' + name + ' هستم (' + phone + '). ' + msg;
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(text), '_blank');
    notify('در واتساپ ادامه دهید');
  };

  return (
    <section id="contact">
      <div className="card pad-lg grid md:grid-cols-2 gap-5 md:gap-6">
        <div>
          <p className="mut text-sm mb-1">{contact.eyebrow || 'وقتشه بدرخشید'}</p>
          <h2 className="text-3xl font-black leading-[1.6] mb-2">
            {contact.headline1 || 'برای دیده شدن'}
            <br />
            <span style={{ color: 'var(--acc)' }}>{contact.headline2 || 'آماده‌ید؟'}</span>
          </h2>
          <p className="mut leading-7 mb-4">{contact.description}</p>
          <div className="flex flex-wrap gap-2 text-sm">
            <a className="btn-acc" target="_blank" rel="noreferrer" href={'https://wa.me/' + wa}>گفت‌وگو در واتساپ</a>
            {contact.instagram && <a className="btn-ghost" target="_blank" rel="noreferrer" href={contact.instagram}>اینستاگرام</a>}
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
