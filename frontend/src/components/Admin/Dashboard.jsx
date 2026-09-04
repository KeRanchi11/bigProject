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
  const [logoFile, setLogoFile] = useState(null);
  const [logoBusy, setLogoBusy] = useState(false);
  const [aboutForm, setAboutForm] = useState(null);
  const [aboutFile, setAboutFile] = useState(null);
  const [aboutBusy, setAboutBusy] = useState(false);
  const [contactForm, setContactForm] = useState(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [fontQueue, setFontQueue] = useState([]);
  const [fontBusy, setFontBusy] = useState('');
  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState(null);
  const [editCatVal, setEditCatVal] = useState('');

  const fonts = Array.isArray(content.signFonts) ? content.signFonts : [];
  // Categories come from the database; hardcoded list is only a fallback.
  const catList = Array.isArray(content.categories) && content.categories.length ? content.categories : CATS;

  const load = async () => {
    try {
      const j = await api.projects({ page: 1, limit: 60, sort: 'new' });
      setRows(j.projects || []);
    } catch { notify('خطا در بارگذاری'); }
  };
  useEffect(() => {
    load();
    api.getAbout().then((j) => { if (j.about) setAboutForm({ ...j.about }); }).catch(() => {});
    api.getContact().then((j) => { if (j.contact) setContactForm({ ...j.contact }); }).catch(() => {});
  }, []);

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
      const category = catList.includes(form.category) ? form.category : (catList[0] || 'نئون');
      await api.createProject({ id: 'p_' + Date.now().toString(36), title: form.title.trim(), category, image, featured: form.featured });
      setForm({ title: '', category, image: '', featured: false });
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

  const changeProjectCategory = async (p, category) => {
    try {
      await api.updateProject(p.id, { category });
      await load();
    } catch { notify('خطا در تغییر دسته‌بندی'); }
  };

  const saveSettings = async () => {
    await onContent({ brandName: brand, whatsapp: wa, activePalette: pal });
    notify('تنظیمات ذخیره شد — پالت جدید برای همه اعمال شد');
  };

  // ---- categories (stored in DB via site_content) ----
  const addCat = async (e) => {
    e.preventDefault();
    const name = newCat.trim().slice(0, 60);
    if (!name) return;
    if (catList.includes(name)) { notify('این دسته‌بندی وجود دارد'); return; }
    if (catList.length >= 20) { notify('حداکثر ۲۰ دسته‌بندی'); return; }
    await onContent({ categories: [...catList, name] });
    setNewCat('');
    notify('دسته‌بندی اضافه شد');
  };

  const saveRenameCat = async () => {
    const to = editCatVal.trim().slice(0, 60);
    const from = editingCat;
    if (!to || !from) { setEditingCat(null); return; }
    if (to === from) { setEditingCat(null); return; }
    if (catList.includes(to)) { notify('این نام وجود دارد'); return; }
    try {
      const j = await api.renameCategory(from, to);
      await onContent({ categories: catList.map((c) => (c === from ? to : c)) });
      setEditingCat(null);
      notify('ویرایش شد (' + (j.moved || 0) + ' پروژه منتقل شد)');
      await load();
    } catch { notify('خطا در ویرایش دسته‌بندی'); }
  };

  const delCat = async (name) => {
    if (!confirm('«' + name + '» حذف شود؟')) return;
    try {
      await api.deleteCategory(name);
      await onContent({ categories: catList.filter((c) => c !== name) });
      notify('دسته‌بندی حذف شد');
    } catch (err) {
      if (err.code === 'category_in_use' || err.status === 409) {
        const n = (err.data && err.data.count) || rows.filter((p) => p.category === name).length;
        notify('اول پروژه‌ها را از این دسته منتقل کنید (' + n + ' پروژه)');
        await load();
      } else notify('خطا در حذف دسته‌بندی');
    }
  };

  // Single logo record: upload replaces logoUrl in DB; server deletes the old file.
  const uploadLogo = async () => {
    if (!logoFile || logoBusy) return;
    setLogoBusy(true);
    try {
      const j = await api.uploadImage(logoFile);
      await onContent({ logoUrl: j.url });
      setLogoFile(null);
      notify('لوگو جایگزین شد');
    } catch { notify('خطا در آپلود لوگو'); }
    finally { setLogoBusy(false); }
  };

  const removeLogo = async () => {
    if (!confirm('لوگو حذف شود؟')) return;
    await onContent({ logoUrl: '' });
    notify('لوگو حذف شد');
  };

  // About section lives in its dedicated about_content table.
  const saveAbout = async () => {
    if (!aboutForm || aboutBusy) return;
    setAboutBusy(true);
    try {
      await api.saveAbout({
        eyebrow: String(aboutForm.eyebrow || '').slice(0, 255),
        headline1: String(aboutForm.headline1 || '').slice(0, 255),
        headline2: String(aboutForm.headline2 || '').slice(0, 255),
        description: String(aboutForm.description || '').slice(0, 10000),
        image: aboutForm.image || ''
      });
      notify('بخش درباره ما ذخیره شد');
    } catch { notify('خطا در ذخیره'); }
    finally { setAboutBusy(false); }
  };

  const uploadAboutImage = async () => {
    if (!aboutFile) return;
    try {
      const j = await api.uploadImage(aboutFile);
      setAboutForm((f) => ({ ...(f || {}), image: j.url }));
      setAboutFile(null);
      notify('تصویر آپلود شد — برای ثبت نهایی «ذخیره» را بزنید');
    } catch { notify('خطا در آپلود تصویر'); }
  };

  // Contact section lives in its dedicated contact_content table.
  const saveContact = async () => {
    if (!contactForm || contactBusy) return;
    setContactBusy(true);
    try {
      await api.saveContact({
        eyebrow: String(contactForm.eyebrow || '').slice(0, 255),
        headline1: String(contactForm.headline1 || '').slice(0, 255),
        headline2: String(contactForm.headline2 || '').slice(0, 255),
        description: String(contactForm.description || '').slice(0, 10000),
        whatsapp: String(contactForm.whatsapp || '').replace(/\D/g, '').slice(0, 20),
        instagram: String(contactForm.instagram || '').slice(0, 500)
      });
      notify('بخش تماس ذخیره شد');
    } catch { notify('خطا در ذخیره'); }
    finally { setContactBusy(false); }
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
        {[['projects', 'نمونه‌کارها'], ['cats', 'دسته‌بندی‌ها'], ['about', 'درباره ما'], ['contact', 'تماس'], ['fonts', 'فونت‌ها'], ['settings', 'تنظیمات سایت'], ['password', 'رمز عبور']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={'chip' + (tab === k ? ' on' : '')}>{label}</button>
        ))}
        <span className="grow" />
        <button className="btn-ghost" onClick={onExit}>خروج از مدیریت</button>
      </div>

      {tab === 'projects' && (
        <>
          <form onSubmit={uploadThenCreate} className="card card-pad grid md:grid-cols-5 gap-2 mb-4">
            <input className="inp md:col-span-2" placeholder="عنوان نمونه‌کار" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <select className="sel" value={catList.includes(form.category) ? form.category : (catList[0] || '')} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {catList.map((c) => <option key={c} value={c}>{c}</option>)}
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
                  <div className="flex items-center gap-2">
                    <select className="sel !py-1 !px-2 text-xs" value={catList.includes(p.category) ? p.category : ''} onChange={(e) => changeProjectCategory(p, e.target.value)} aria-label="دسته‌بندی">
                      {!catList.includes(p.category) && <option value={p.category}>{p.category} (قدیمی)</option>}
                      {catList.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="mut text-xs shrink-0">❤️ {p.likes}</span>
                  </div>
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

      {tab === 'cats' && (
        <>
          <form onSubmit={addCat} className="card card-pad mb-4 flex gap-2">
            <input className="inp" placeholder="نام دسته‌بندی جدید (مثلاً چلنیوم)" value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={60} />
            <button className="btn-acc shrink-0" type="submit">افزودن</button>
          </form>
          <div className="grid gap-2">
            {catList.map((c) => {
              const used = rows.filter((p) => p.category === c).length;
              return (
                <div key={c} className="card px-4 py-3 flex items-center gap-2 text-sm">
                  {editingCat === c ? (
                    <>
                      <input className="inp" value={editCatVal} onChange={(e) => setEditCatVal(e.target.value)} maxLength={60} />
                      <button className="btn-acc !py-1 !px-3 text-xs shrink-0" onClick={saveRenameCat}>ذخیره</button>
                      <button className="btn-ghost !py-1 !px-3 text-xs shrink-0" onClick={() => setEditingCat(null)}>لغو</button>
                    </>
                  ) : (
                    <>
                      <b className="grow truncate">{c}</b>
                      <span className="mut text-xs shrink-0">{used} پروژه</span>
                      <button className="btn-ghost !py-1 !px-2 text-xs shrink-0" onClick={() => { setEditingCat(c); setEditCatVal(c); }}>ویرایش</button>
                      <button className="btn-ghost !py-1 !px-2 text-xs shrink-0" disabled={used > 0} title={used > 0 ? 'ابتدا پروژه‌ها را به دسته دیگری منتقل کنید' : 'حذف'} onClick={() => delCat(c)}>حذف</button>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mut text-xs leading-6 mt-3">ویرایش نام، همه پروژه‌های آن دسته را هم منتقل می‌کند. حذف فقط وقتی ممکن است که هیچ پروژه‌ای در آن دسته نباشد.</p>
        </>
      )}

      {tab === 'about' && (
        <div className="card card-pad grid gap-3 max-w-xl">
          <h3 className="font-extrabold">بخش «درباره ما» <span className="mut font-normal text-sm">(جدول اختصاصی about_content)</span></h3>
          {!aboutForm ? <p className="mut text-sm">در حال بارگذاری…</p> : (
            <>
              <label className="text-sm">عنوان کوچک<input className="inp mt-1" value={aboutForm.eyebrow || ''} onChange={(e) => setAboutForm({ ...aboutForm, eyebrow: e.target.value })} /></label>
              <label className="text-sm">تیتر (خط اول)<input className="inp mt-1" value={aboutForm.headline1 || ''} onChange={(e) => setAboutForm({ ...aboutForm, headline1: e.target.value })} /></label>
              <label className="text-sm">تیتر (خط دوم)<input className="inp mt-1" value={aboutForm.headline2 || ''} onChange={(e) => setAboutForm({ ...aboutForm, headline2: e.target.value })} /></label>
              <label className="text-sm">توضیحات<textarea className="inp mt-1" rows={4} value={aboutForm.description || ''} onChange={(e) => setAboutForm({ ...aboutForm, description: e.target.value })} /></label>
              <div className="text-sm">تصویر
                <div className="flex items-center gap-3 mt-2">
                  {aboutForm.image
                    ? <img src={aboutForm.image} alt="تصویر درباره ما" className="h-20 w-auto max-w-[220px] object-contain rounded-lg border" style={{ borderColor: 'var(--line)' }} />
                    : <span className="mut text-xs">بدون تصویر</span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(e) => setAboutFile(e.target.files?.[0] || null)} />
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="btn-ghost !min-h-0 !py-2 !px-4 text-sm" disabled={!aboutFile} onClick={uploadAboutImage}>آپلود تصویر</button>
                  {aboutForm.image && <button className="btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={() => setAboutForm({ ...aboutForm, image: '' })}>حذف تصویر</button>}
                </div>
              </div>
              <button className="btn-acc" disabled={aboutBusy} onClick={saveAbout}>{aboutBusy ? '…' : 'ذخیره درباره ما'}</button>
            </>
          )}
        </div>
      )}

      {tab === 'contact' && (
        <div className="card card-pad grid gap-3 max-w-xl">
          <h3 className="font-extrabold">بخش «تماس» <span className="mut font-normal text-sm">(جدول اختصاصی contact_content)</span></h3>
          {!contactForm ? <p className="mut text-sm">در حال بارگذاری…</p> : (
            <>
              <label className="text-sm">عنوان کوچک<input className="inp mt-1" value={contactForm.eyebrow || ''} onChange={(e) => setContactForm({ ...contactForm, eyebrow: e.target.value })} /></label>
              <label className="text-sm">تیتر (خط اول)<input className="inp mt-1" value={contactForm.headline1 || ''} onChange={(e) => setContactForm({ ...contactForm, headline1: e.target.value })} /></label>
              <label className="text-sm">تیتر (خط دوم)<input className="inp mt-1" value={contactForm.headline2 || ''} onChange={(e) => setContactForm({ ...contactForm, headline2: e.target.value })} /></label>
              <label className="text-sm">توضیحات<textarea className="inp mt-1" rows={3} value={contactForm.description || ''} onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })} /></label>
              <label className="text-sm">واتساپ (فقط عدد)<input className="inp mt-1" value={contactForm.whatsapp || ''} onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })} dir="ltr" /></label>
              <label className="text-sm">اینستاگرام (آدرس کامل)<input className="inp mt-1" value={contactForm.instagram || ''} onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })} dir="ltr" placeholder="https://instagram.com/..." /></label>
              <button className="btn-acc" disabled={contactBusy} onClick={saveContact}>{contactBusy ? '…' : 'ذخیره تماس'}</button>
            </>
          )}
        </div>
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
          <div className="text-sm">لوگوی سایت (تک‌رکورد — آپلود جدید جایگزین قبلی می‌شود)
            <div className="flex items-center gap-3 mt-2">
              {content.logoUrl
                ? <img src={content.logoUrl} alt="لوگوی سایت" className="h-14 w-auto max-w-[220px] object-contain rounded-lg border" style={{ borderColor: 'var(--line)' }} />
                : <span className="mut text-xs">بدون لوگو (آیکون پیش‌فرض)</span>}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn-acc !min-h-0 !py-2 !px-4 text-sm" disabled={!logoFile || logoBusy} onClick={uploadLogo}>{logoBusy ? '…' : 'آپلود و جایگزینی لوگو'}</button>
              {content.logoUrl && <button className="btn-ghost !min-h-0 !py-2 !px-4 text-sm" onClick={removeLogo}>حذف لوگو</button>}
            </div>
          </div>
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
