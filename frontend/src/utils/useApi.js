import { useCallback, useEffect, useRef, useState } from 'react';
import api from './api';
import { errorMessage } from './format';

// Carrega `url` e expoe { data, loading, error, reload }. url null = nao carrega.
// Ao mudar de url (ex.: filtro), os dados anteriores ficam visiveis com
// loading=true ate chegarem os novos; respostas de urls antigas que cheguem
// depois sao ignoradas (com a rede lenta, um filtro trocado duas vezes podia
// mostrar o resultado errado).
export default function useApi(url, { initial = null } = {}) {
  const [state, setState] = useState({ data: initial, loading: Boolean(url), error: '' });
  const latest = useRef(url);
  latest.current = url;
  const reload = useCallback(async () => {
    if (!url) return null;
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await api.get(url);
      if (latest.current !== url) return null;
      setState({ data: res.data, loading: false, error: '' });
      return res.data;
    } catch (err) {
      if (latest.current !== url) return null;
      setState((s) => ({ ...s, loading: false, error: errorMessage(err) }));
      return null;
    }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}
