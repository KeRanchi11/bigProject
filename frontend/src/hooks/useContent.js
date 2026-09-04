import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DEFAULT_CONTENT = {
  brandName: 'تابلوسازی ملکی',
  slogan: 'تابلوی شما، امضای ما',
  heroHeadline1: 'تابلوی شما،',
  heroHeadline2: 'امضای ماست.',
  heroDescription: 'ما برای برندهایی تابلو می‌سازیم که می‌خواهند در ذهن‌ها بمانند.',
  heroCta: 'شروع یک همکاری',
  headerCta: 'مشاوره رایگان',
  whatsapp: '989121234567',
  activePalette: 'ember'
};

function parseContent(raw) {
  const out = { ...DEFAULT_CONTENT };
  const jsonKeys = ['navItems', 'contactMethods', 'categories', 'signFonts', 'aboutValues', 'heroProofAvatars'];
  for (const [k, v] of Object.entries(raw || {})) {
    if (jsonKeys.includes(k) && typeof v === 'string') {
      try { out[k] = JSON.parse(v); } catch { out[k] = v; }
    } else {
      out[k] = v;
    }
  }
  if (!Array.isArray(out.categories)) out.categories = ['نئون', 'سردر فروشگاه', 'حروف برجسته', 'بیلبورد'];
  return out;
}

export function useContent() {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.content().then((j) => setContent(parseContent(j.content))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = useCallback(async (patch) => {
    await api.saveContent(patch);
    setContent((c) => ({ ...c, ...patch }));
  }, []);

  return { content, setContent, save, loading };
}
