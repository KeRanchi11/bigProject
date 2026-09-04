import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DEFAULT_CONTACT = {
  eyebrow: 'وقتشه بدرخشید',
  headline1: 'برای دیده شدن',
  headline2: 'آماده‌ید؟',
  description: 'یک تماس کوتاه، شروع یک اتفاق بزرگ است.',
  whatsapp: '989121234567',
  instagram: ''
};

// Contact reads its dedicated table (GET /api/contact) — independent of site_content.
export function useContact() {
  const [contact, setContact] = useState(DEFAULT_CONTACT);
  useEffect(() => {
    api.getContact()
      .then((j) => { if (j.contact) setContact({ ...DEFAULT_CONTACT, ...j.contact }); })
      .catch(() => {});
  }, []);
  return { contact };
}
