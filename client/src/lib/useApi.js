// Loads one API resource for a screen and tracks the loading and error states
// that every data-fetching page must show.
import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useApi(path, query) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const queryKey = JSON.stringify(query ?? {});

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }));
    try {
      const data = await api(path, { query: JSON.parse(queryKey) });
      setState({ data, loading: false, error: '' });
    } catch (error) {
      setState({ data: null, loading: false, error: error.message });
    }
  }, [path, queryKey]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!path.endsWith('/activity')) return undefined;
    window.addEventListener('subscription:changed', load);
    return () => window.removeEventListener('subscription:changed', load);
  }, [load, path]);

  return { ...state, reload: load };
}
