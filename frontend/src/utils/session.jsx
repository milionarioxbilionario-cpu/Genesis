import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import api, { setShownEstablishment, onEstablishmentChange } from './api';
import { Spinner } from '../components/ui';
import PanelLockGate from '../components/PanelLock';
import { setLang } from '../i18n/core';
import { clearSnapshots, isOfflineError, loadSnapshot, saveSnapshot } from './offlinePin';

// Sessao do painel (dono / suporte). O terminal POS tem o seu proprio estado
// (pages/pos/Terminal.jsx) — nunca partilha a sessao do dono.
//
// Fase 12.3: sem rede, o painel abre com o ultimo utilizador visto neste
// aparelho (`offline: true`) e as paginas mostram o que o service worker
// guardou. Ao entrar OUTRA conta, ou ao sair, tudo o que estava guardado da
// conta anterior e apagado (nunca se mostra uma loja a outra).
const SessionCtx = createContext(null);
const ME_KEY = 'owner:me';
export const API_CACHE = 'genesis-api';

export async function forgetOwnerData() {
  await clearSnapshots('owner:');
  try { if ('caches' in window) await caches.delete(API_CACHE); } catch { /* sem Cache API */ }
}

export function SessionProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, offline: false });
  const load = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me', { silent: true });
      const u = res.data.user;
      // A lingua da conta manda (9.3). O modo suporte fica com a do aparelho;
      // o caixista no terminal muda o ecra sem mudar a lingua do aparelho.
      if (u?.language && u.scope !== 'support') setLang(u.language, { remember: u.scope !== 'pos' });
      // E2: o gerente tambem usa o painel (so o seu estabelecimento).
      if ((u?.role === 'owner' || u?.role === 'manager') && !u.scope) {
        setShownEstablishment(u.tenant_id);
        const prev = await loadSnapshot(ME_KEY);
        // Primeira entrada neste aparelho ou outra conta: nada da anterior fica guardado.
        if (!prev || prev.data?.id !== u.id) await forgetOwnerData();
        saveSnapshot(ME_KEY, { ...u, lock: u.lock ? { has_pin: u.lock.has_pin, unlocked: false } : u.lock });
      }
      setState({ loading: false, user: u, offline: false });
      return u;
    } catch (err) {
      const snap = isOfflineError(err) ? await loadSnapshot(ME_KEY) : null;
      if (snap?.data) {
        setState({ loading: false, user: snap.data, offline: true, savedAt: snap.saved_at });
        return snap.data;
      }
      setState({ loading: false, user: null, offline: false });
      return null;
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  // Etapa D: outro separador trocou de estabelecimento -> este recarrega com o novo.
  useEffect(() => onEstablishmentChange((id) => { if (state.user?.role === 'owner' && id !== state.user.tenant_id) window.location.reload(); }), [state.user]);
  // A rede voltou: confirma a sessao no servidor.
  useEffect(() => {
    if (!state.offline) return undefined;
    const on = () => load();
    window.addEventListener('online', on);
    const timer = setInterval(on, 30000);
    return () => { window.removeEventListener('online', on); clearInterval(timer); };
  }, [state.offline, load]);
  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout'); } catch { /* sem rede: o cookie expira sozinho */ }
    await forgetOwnerData();
    try { sessionStorage.removeItem('genesis.unlocked'); } catch { /* nada */ }
    setState({ loading: false, user: null, offline: false });
  }, []);
  const setLock = useCallback((lock) => setState((s) => (s.user ? { ...s, user: { ...s.user, lock } } : s)), []);
  return <SessionCtx.Provider value={{ ...state, reload: load, logout, setLock }}>{children}</SessionCtx.Provider>;
}

export const useSession = () => useContext(SessionCtx);

export function FullPageSpinner() {
  return <div className="flex min-h-screen items-center justify-center text-ink-muted"><Spinner /></div>;
}

// E2 (31/10): o gerente entra no mesmo painel, com menos (utils/managerPolicy.js no servidor).
export const isManager = (user) => user?.role === 'manager';
// Os ecras escondem custos, margens e lucro a quem nao os recebe do servidor.
export function useSeesCosts() { const { user } = useContext(SessionCtx) || {}; return !isManager(user); }

// So o dono (ou o Super Admin em modo suporte, que entra como dono so leitura) e o gerente.
export function RequireOwner({ children }) {
  const { loading, user } = useSession();
  const location = useLocation();
  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to={'/entrar?voltar=' + encodeURIComponent(location.pathname)} replace />;
  if (user.role === 'cashier' || user.scope === 'pos') return <Navigate to="/terminal" replace />;
  if (user.role !== 'owner' && user.role !== 'manager') return <Navigate to="/entrar" replace />;
  return <PanelLockGate>{children}</PanelLockGate>;
}
