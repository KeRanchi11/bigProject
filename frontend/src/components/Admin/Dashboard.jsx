import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { PALETTE_META } from '../ui/PalettePicker';

const CATS = ['نئون', 'سردر فروشگاه', 'حروف برجسته', 'بیلبورد'];

export default function Dashboard({ content, onContent, notify, onExit }) {
  const [tab, setTab] = useState('projects');
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'نئون', image: '', featured: false });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [brand, setBrand] = useState(content.brandName || '');
  const [wa, setWa] = useState(content.whatsapp || '');
  const [pal, setPal] = useState(content.activePalette || 'ember');
  const [fontQueue, setFontQueue] = useState([]);
  const [fontBusy, setFontBusy] = useState('');

  const fonts = Array.isArray(content.signFonts) ? content.signFonts : [];

  const load = async () => {
    try {
      const j = await api.projects({ page: 1, limit: 60, sort: 'new' });
      setRows(j.projects || []);
    } catch { notify('خطا در بارگذاری'); }
  };
  useEffect(() => { load(); }, []);

  const uploadThenCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { notify('عنوان لازم است'); return; }
    setBusy(true);
    try {
      let image = form.image.trim();
      if (file) {
        const j = await api.uploadImage(file);
        image = j.url;
      }
      if (!image) { notify('تصویر لازم است (آپلود یا آدرس)'); setBusy(false); return; }
      await api.createProject({ id: 'p_' + Date.now().toString(36), title: form.title.trim(), category: form.category, image, featured: form.featured });
      setForm({ title: '', category: 'نئون', image: '', featured: false });
      setFile(null);
      await load();
      notify('ذخیره شد');
    } catch (err) {
      notify('خطا: ' + (err.message || 'save_failed'));
    } finally { setBusy(false); }
  };

  const del = async (id) => {
    if (!confirm('حذف شود؟')) return;
    await api.deleteProject(id);
    await load();
  };

  const toggleFeat = async (p) => {
    await api.updateProject(p.id, { featured: !p.featured });
    await load();
  };

  const saveSettings = async () => {
    await onContent({ brandName: brand, whatsapp: wa, activePalette: pal });
    notify('تنظیمات ذخیره شد — پالت جدید برای همه اعمال شد');
  };

  const uploadFonts = async () => {
    if (!fontQueue.length || fontBusy) return;
    setFontBusy('شروع آپلود…');
    const list = [...fonts];
    let done = 0;
    for (let i = 0; i < fontQueue.length; i++) {
      const f = fontQueue[i];
      setFontBusy('در حال آپلود ' + (i + 1) + ' از ' + fontQueue.length + '…');
      try {
        const j = await api.uploadFont(f);
        const base = (f.name || 'font').replace(/\.(ttf|otf)$/i, '').replace(/[_-]+/g, ' ').trim() || 'فونت';
        list.push({
          name: base.slice(0, 60),
          family: 'F' + Date.now().toString(36) + i,
          fileUrl: j.url,
          googleUrl: ''
        });
        done++;
      } catch { notify('خطا در آپلود ' + (f.name || '')); }
    }
    // One DB write for the whole batch (metadata stored in site_content).
    await onContent({ signFonts: list });
    setFontQueue([]);
    setFontBusy('');
    notify(done + ' فونت ذخیره و در پایگاه داده ثبت شد');
  };

  const delFont = async (idx) => {
    if (!confirm('این فونت حذف شود؟')) return;
    const list = [...fonts];
    const [rm] = list.splice(idx, 1);
    if (rm && rm.fileUrl) {
      try { await api.deleteFont(rm.fileUrl); } catch { /* entry still removed below */ }
    }
    await onContent({ signFonts: list });
    notify('فونت حذف شد');
  };

  const changePass = async () => {
    if (nw.length < 8) { notify('رمز جدید حداقل ۸ حرف'); return; }
    try {
      await api.changePassword(cur, nw);
      setCur(''); setNw('');
      notify('رمز عوض شد');
    } catch { notify('رمز فعلی اشتباه است'); }
  };

  return (
    <section className="wrap page">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {[['projects', 'نمونه‌کارها'], ['fonts', 'فونت‌ها'], ['settings', 'تنظیمات سایت'], ['password', 'رمز عبور']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={'chip' + (tab === k ? ' on' : '')}>{label}</button>
        ))}
        <span className="grow" />
        <button className="btn-ghost" onClick={onExit}>خروج از مدیریت</button>
      </div>

      {tab === 'projects' && (
        <>
          <form onSubmit={uploadThenCreate} className="card card-pad grid md:grid-cols-5 gap-2 mb-4">
            <input className="inp md:col-span-2" placeholder="عنوان نمونه‌کار" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="sel" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATS.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="inp" placeholder="آدرس تصویر (اختیاری اگر آپلود می‌کنید)" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} dir="ltr" />
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> منتخب</label>
            <button className="btn-acc md:col-span-5" disabled={busy}>{busy ? 'در حال ذخیره…' : 'افزودن نمونه‌کار'}</button>
          </form>
          <div className="grid-gal">
            {rows.map((p) => (
              <div key={p.id} className="card overflow-hidden">
                <img src={p.image} alt={p.title} loading="lazy" className="gal-img !h-36" />
                <div className="p-3 text-sm grid gap-2">
                  <b className="truncate">{p.title}</b>
                  <span className="mut text-xs">{p.category} — ❤️ {p.likes}</span>
                  <div className="flex gap-2">
                    <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => toggleFeat(p)}>{p.featured ? 'حذف از منتخب' : 'منتخب کن'}</button>
                    <button className="btn-ghost !py-1 !px-2 text-xs" onClick={() => del(p.id)}>حذف</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'fonts' && (
        <>
          <div className="card card-pad mb-4 grid gap-3">
            <h3 className="font-extrabold">آپلود گروهی فونت <span className="mut font-normal text-sm">(TTF / OTF — هر تعداد)</span></h3>
            <input type="file" multiple accept=".ttf,.otf" onChange={(e) => setFontQueue(Array.from(e.target.files || []).slice(0, 100))} />
            {fontQueue.length > 0 && <p className="mut text-sm">{fontQueue.length} فایل انتخاب شد</p>}
            {fontBusy && <p className="text-sm" style={{ color: 'var(--acc)' }}>{fontBusy}</p>}
            <button className="btn-acc" disabled={!fontQueue.length || !!fontBusy} onClick={uploadFonts}>
              {fontBusy || 'آپلود و ثبت در پایگاه داده'}
            </button>
          </div>
          <div className="grid gap-2">
            {fonts.length === 0 && <div className="card card-pad mut text-sm text-center">هنوز فونتی ثبت نشده است.</div>}
            {fonts.map((f, i) => (
              <div key={(f.family || '') + i} className="card px-4 py-3 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <b className="block truncate" style={{ fontFamily: f.fileUrl ? "'" + f.family + "', Tahoma, sans-serif" : undefined }}>{f.name || f.family}</b>
                  <span className="mut text-xs">{f.fileUrl ? 'فونت آپلودشده' : 'فونت گوگل'}</span>
                </div>
                <button className="btn-ghost !py-1 !px-2 text-xs shrink-0" onClick={() => delFont(i)}>حذف</button>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'settings' && (
        <div className="card card-pad grid gap-3 max-w-xl">
          <label className="text-sm">نام برند<input className="inp mt-1" value={brand} onChange={(e) => setBrand(e.target.value)} /></label>
          <label className="text-sm">واتساپ (فقط عدد، مثل 989121234567)<input className="inp mt-1" value={wa} onChange={(e) => setWa(e.target.value)} dir="ltr" /></label>
          <div className="text-sm">پالت رنگ سایت (برای همه کاربران)
            <div className="flex items-center gap-2 mt-2">
              {PALETTE_META.map((m) => (
                <button key={m.id} type="button" title={m.name} aria-label={m.name} onClick={() => setPal(m.id)} className={'sw' + (pal === m.id ? ' on' : '')} style={{ background: m.dot }} />
              ))}
              <span className="mut text-xs">{(PALETTE_META.find((m) => m.id === pal) || {}).name || pal}</span>
            </div>
            <p className="mut text-xs leading-6 mt-1">روشن/تیره همچنان انتخاب هر کاربر است و تغییر نمی‌کند.</p>
          </div>
          <button className="btn-acc" onClick={saveSettings}>ذخیره تنظیمات</button>
        </div>
      )}

      {tab === 'password' && (
        <div className="card card-pad grid gap-3 max-w-xl">
          <label className="text-sm">رمز فعلی<input className="inp mt-1" type="password" value={cur} onChange={(e) => setCur(e.target.value)} /></label>
          <label className="text-sm">رمز جدید (حداقل ۸ حرف)<input className="inp mt-1" type="password" value={nw} onChange={(e) => setNw(e.target.value)} /></label>
          <button className="btn-acc" onClick={changePass}>تغییر رمز</button>
        </div>
      )}
    </section>
  );
}
