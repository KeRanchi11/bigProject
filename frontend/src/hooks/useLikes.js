import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getVisitorId, getLegacyVisitorId, getVisitorRaw } from '../lib/visitor';

export function useLikes() {
  const [visitor] = useState(getVisitorId);
  const [liked, setLiked] = useState(new Set());
  const [counts, setCounts] = useState({});

  const refresh = useCallback(() => {
    const legacy = getLegacyVisitorId();
    const raw = getVisitorRaw();
    api.myLikes(visitor, legacy, raw).then((j) => {
      setLiked(new Set(j.liked || []));
      if (j.counts) setCounts((prev) => ({ ...prev, ...j.counts }));
    }).catch(() => {});
  }, [visitor]);

  useEffect(() => {
    refresh();
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  const toggle = useCallback(async (project, currentCount) => {
    const was = liked.has(project.id);
    const next = new Set(liked);
    if (was) next.delete(project.id); else next.add(project.id);
    setLiked(next);
    setCounts((c) => ({ ...c, [project.id]: (currentCount ?? project.likes ?? 0) + (was ? -1 : 1) }));
    try {
      const legacy = getLegacyVisitorId();
      const j = await api.like(project.id, visitor, !was, legacy);
      setCounts((c) => ({ ...c, [project.id]: j.count }));
      return j;
    } catch {
      setLiked(liked); // rollback
      return null;
    }
  }, [liked, visitor]);

  return { visitor, liked, counts, toggle, refresh };
}
