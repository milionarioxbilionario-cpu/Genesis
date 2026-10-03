import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api from './api';
import { Spinner } from '../components/ui';

// Sessao do painel (dono / suporte). O terminal POS tem o seu proprio estado
// (pages/pos/Terminal.jsx) — nunca partilha a sessao do dono.
const SessionCtx = createContext(null);

export function SessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null });
  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me', { silent: true });
      setState({ loading: false, user: res.data.user });
      return res.data.user;
    } catch {
      setState({ loading: false, user: null });
      return null;
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* sem rede: o cookie expira sozinho */ }
    setState({ loading: false, user: null });
  }, []);
  return <SessionCtx.Provider value={{ ...state, reload: load, logout }}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);

export function FullPageSpinner() {
  return <div className="flex min-h-screen items-center justify-center text-ink-muted"><Spinner /></div>;
}

// So o dono (ou o Super Admin em modo suporte, que entra como dono so leitura).
export function RequireOwner({ children }) {
  const { loading, user } = useSession();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to={'/entrar?voltar=' + encodeURIComponent(location.pathname)} replace />;
  if (user.role === 'cashier' || user.scope === 'pos') return <Navigate to="/terminal" replace />;
  if (user.role !== 'owner') return <Navigate to="/entrar" replace />;
  return children;
}
