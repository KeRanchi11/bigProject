import { useMemo, useState } from 'react';
import { EXTRAS, PRICE_RULES, TAX_RATE, faNum, faPrice } from '../lib/pricing';

export default function PriceCalculator({ content, onBack, notify }) {
  const [type, setType] = useState('neon');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(1);
  const [extras, setExtras] = useState({});
  const [qty, setQty] = useState(1);
  const rule = PRICE_RULES[type];

  const r = useMemo(() => {
    const area = Math.max(0, width * height);
    const base = rule.base + area * rule.perMeter;
    const ex = Object.entries(extras).reduce((s, [k, on]) => s + (on && EXTRAS[k] ? EXTRAS[k].price : 0), 0);
    const sub = Math.round((base + ex) * Math.max(1, qty));
    const tax = Math.round(sub * TAX_RATE);
    return { area, base: Math.round(base), ex, sub, tax, total: sub + tax };
  }, [rule, width, height, extras, qty]);

  const order = () => {
    const wa = content.whatsapp || '989121234567';
    const t = 'سلام، برای ' + rule.label + ' با ابعاد ' + width + '×' + height + ' متر (' + r.area.toFixed(1) + ' مترمربع) قیمت می‌خواهم. مبلغ تقریبی: ' + faPrice(r.total);
    window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(t), '_blank');
    if (notify) notify('در واتساپ ادامه دهید');
  };

  return (
    <section className="wrap page">
      <button className="btn-ghost mb-4" onClick={onBack}>→ بازگشت</button>
      <div className="grid md:grid-cols-5 gap-4">
        <div className="card card-pad md:col-span-3 grid gap-4">
          <div>
            <h3 className="font-extrabold mb-2">نوع تابلو</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRICE_RULES).map(([k, v]) => (
                <button key={k} onClick={() => setType(k)} className={'card !rounded-xl px-4 py-3 text-right ' + (type === k ? '!border-[var(--acc)]' : '')}>
                  <b className="block">{v.label}</b>
                  <span className="mut text-xs">پایه {faPrice(v.base)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <label className="text-sm">عرض (متر)<input className="inp mt-1" type="number" min={rule.minSize} step={0.1} value={width} onChange={(e) => setWidth(Math.max(rule.minSize, +e.target.value || rule.minSize))} /></label>
            <label className="text-sm">ارتفاع (متر)<input className="inp mt-1" type="number" min={0.2} step={0.1} value={height} onChange={(e) => setHeight(Math.max(0.2, +e.target.value || 0.2))} /></label>
            <label className="text-sm">تعداد<input className="inp mt-1" type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, +e.target.value || 1))} /></label>
          </div>
          <p className="mut text-sm">مساحت: {faNum(r.area.toFixed(1))} مترمربع</p>
          <div>
            <h3 className="font-extrabold mb-2">خدمات جانبی</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(EXTRAS).map(([k, v]) => (
                <label key={k} className="card !rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 cursor-pointer text-sm">
                  <span className="flex items-center gap-2"><input type="checkbox" checked={!!extras[k]} onChange={() => setExtras((p) => ({ ...p, [k]: !p[k] }))} />{v.label}</span>
                  <span className="mut">{faPrice(v.price)}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="md:col-span-2">
          <div className="card card-pad sticky top-20">
            <h3 className="font-extrabold mb-3">خلاصه قیمت</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between"><span className="mut">پایه ({rule.label})</span><b>{faPrice(rule.base)}</b></div>
              <div className="flex justify-between"><span className="mut">مساحت ({faNum(r.area.toFixed(1))} متر²)</span><b>{faPrice(r.base - rule.base)}</b></div>
              {Object.entries(extras).filter(([, v]) => v).map(([k]) => (
                <div key={k} className="flex justify-between"><span className="mut">{EXTRAS[k].label}</span><b>{faPrice(EXTRAS[k].price)}</b></div>
              ))}
              <div className="flex justify-between"><span className="mut">مجموع فرعی</span><b>{faPrice(r.sub)}</b></div>
              <div className="flex justify-between"><span className="mut">مالیات (۹٪)</span><b>{faPrice(r.tax)}</b></div>
              <div className="flex justify-between text-base pt-2" style={{ borderTop: '1px solid var(--line)' }}><span>مبلغ قابل پرداخت</span><b style={{ color: 'var(--acc)' }}>{faPrice(r.total)}</b></div>
            </div>
            <button className="btn-acc w-full mt-4" onClick={order}>درخواست مشاوره و سفارش</button>
            <p className="mut text-xs leading-6 mt-2">* قیمت‌ها تقریبی‌اند. قیمت نهایی پس از بازدید کارشناس تعیین می‌شود.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
