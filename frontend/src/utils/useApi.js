import { useCallback, useEffect, useState } from 'react';
import api from './api';
import { errorMessage } from './format';

// Carrega `url` e expoe { data, loading, error, reload }. url null = nao carrega.
export default function useApi(url, { initial = null } = {}) {
  const [state, setState] = useState({ data: initial, loading: Boolean(url), error: '' });
  const reload = useCallback(async () => {
    if (!url) return null;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await api.get(url);
      setState({ data: res.data, loading: false, error: '' });
      return res.data;
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
      return null;
    }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
