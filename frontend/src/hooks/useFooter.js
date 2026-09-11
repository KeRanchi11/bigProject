import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export const DEFAULT_FOOTER = {
  phone: '',
  phone_link: '',
  insta_label: '',
  insta_link: '',
  address: '',
  map_link: ''
};

// Footer contact block reads its dedicated table (GET /api/footer).
// Empty by default: the block renders only what the admin fills in.
export function useFooter() {
  const [info, setInfo] = useState(DEFAULT_FOOTER);
  useEffect(() => {
    api.getFooter()
      .then((j) => { if (j.footer) setInfo({ ...DEFAULT_FOOTER, ...j.footer }); })
      .catch(() => {});
  }, []);
  return { info };
}
