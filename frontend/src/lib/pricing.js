// Pricing preserved from old project (user confirmed). Amounts in Toman.
export const PRICE_RULES = {
  neon: { base: 2500000, perMeter: 1800000, minSize: 0.5, label: 'تابلو نئون' },
  '3d': { base: 3500000, perMeter: 2200000, minSize: 0.3, label: 'حروف برجسته' },
  sign: { base: 4500000, perMeter: 2800000, minSize: 1, label: 'سردر فروشگاه' },
  billboard: { base: 15000000, perMeter: 5000000, minSize: 4, label: 'بیلبورد' }
};

export const EXTRAS = {
  installation: { label: 'نصب و راه‌اندازی', price: 3000000 },
  wiring: { label: 'سیم‌کشی و الکتریسیته', price: 1500000 },
  permit: { label: 'اخذ مجوز از شهرداری', price: 2000000 },
  design: { label: 'طراحی اختصاصی', price: 2500000 },
  maintenance: { label: 'یک سال تعمیرات رایگان', price: 1000000 }
};

export const TAX_RATE = 0.09;

export function calcPrice(type, width, height, extras, quantity) {
  const rule = PRICE_RULES[type] || PRICE_RULES.neon;
  const area = Math.max(0, width * height);
  const basePrice = rule.base + area * rule.perMeter;
  const extrasPrice = Object.entries(extras || {}).reduce(
    (s, [k, on]) => s + (on && EXTRAS[k] ? EXTRAS[k].price : 0), 0);
  const subtotal = Math.round((basePrice + extrasPrice) * Math.max(1, quantity));
  const tax = Math.round(subtotal * TAX_RATE);
  return { area, basePrice: Math.round(basePrice), extrasPrice, subtotal, tax, total: subtotal + tax };
}

export const faPrice = (n) => new Intl.NumberFormat('fa-IR').format(Math.round(n)) + ' تومان';
export const faNum = (n) => new Intl.NumberFormat('fa-IR').format(n);
