import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DEFAULT_HERO = {
  eyebrow: 'طراحی شده برای دیده شدن',
  headline1: 'تابلوی شما،',
  headline2: 'امضای ماست.',
  description: 'ما برای برندهایی تابلو می‌سازیم که می‌خواهند در ذهن‌ها بمانند. از ایده تا اجرا، کنار شما هستیم.',
  cta: 'شروع یک همکاری',
  proof_number: '+۱۲۰',
  proof_text: 'پروژه موفق در سراسر ایران',
  neon_small: 'GOOD IDEAS',
  neon_line1: 'SHINE',
  neon_line2: 'BRIGHT',
  chip1: 'از ایده',
  chip2: 'تا اجرا'
};

// Hero reads its dedicated table (GET /api/hero) — independent of site_content.
export function useHero() {
  const [hero, setHero] = useState(DEFAULT_HERO);
  useEffect(() => {
    api.getHero()
      .then((j) => { if (j.hero) setHero({ ...DEFAULT_HERO, ...j.hero }); })
      .catch(() => {});
  }, []);
  return { hero };
}
