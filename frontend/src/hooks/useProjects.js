import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

// Server-side pagination/search/sort (fixes old fetch-all + N+1).
export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState('همه');
  const [sort, setSort] = useState('new'); // new | popular
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 100; // single-page gallery (server clamps to 60)

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const j = await api.projects({ page, limit, category, sort, q });
      setProjects(j.projects || []);
      setTotal(j.total || 0);
    } catch (e) {
      setError('load_failed');
    } finally {
      setLoading(false);
    }
  }, [page, category, sort, q]);

  useEffect(() => { load(); }, [load]);

  return { projects, setProjects, page, setPage, total, limit, category, setCategory, sort, setSort, q, setQ, loading, error, reload: load };
}
