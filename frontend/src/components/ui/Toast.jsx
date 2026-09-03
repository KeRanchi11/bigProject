import { useEffect, useState } from 'react';

export default function Toast({ toast }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (toast) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 2600);
      return () => clearTimeout(t);
    }
  }, [toast]);
  if (!toast || !show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 card px-5 py-3 text-sm" role="status">
      {toast}
    </div>
  );
}
