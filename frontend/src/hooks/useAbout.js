import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DEFAULT_ABOUT = {
  eyebrow: 'داستان ما',
  headline1: 'ما فقط تابلو',
  headline2: 'نمی‌سازیم.',
  description: 'کمک می‌کنیم برند شما دیده و به یاد سپرده شود.',
  image: ''
};

// About reads its dedicated table (GET /api/about) — independent of site_content.
export function useAbout() {
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  useEffect(() => {
    api.getAbout()
      .then((j) => { if (j.about) setAbout({ ...DEFAULT_ABOUT, ...j.about }); })
      .catch(() => {});
  }, []);
  return { about };
}
