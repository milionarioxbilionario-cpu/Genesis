import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, HandCoins, House, LogOut, Menu, Package, Receipt, Settings, Truck, Users, WifiOff, X } from 'lucide-react';
import api from '../utils/api';
import { useSession, FullPageSpinner } from '../utils/session';
import { cx, IconButton } from '../components/ui';

// Navegacao do dono: 8 seccoes, sem duplicados. Cada funcao da especificacao
// vive num so sitio (ex.: Metas no Inicio; Terminais e Auditoria nas Definicoes).
export const NAV = [
  { to: '/app', label: 'Início', icon: House, end: true },
  { to: '/app/vendas', label: 'Vendas', icon: Receipt },
  { to: '/app/produtos', label: 'Produtos', icon: Package },
  { to: '/app/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/app/chenecas', label: 'Chenecas', icon: HandCoins },
  { to: '/app/equipa', label: 'Equipa', icon: Users },
  { to: '/app/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/app/definicoes', label: 'Definições', icon: Settings },
];

function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

function Sidebar({ tenant, onNavigate }) {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-5 text-ink">{tenant?.name || 'Genesis'}</p>
          <p className="truncate text-xs text-ink-muted">{tenant?.location || 'Gestão comercial'}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Navegação principal">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) => cx(
              'mb-0.5 flex h-9 items-center gap-3 rounded px-3 text-base transition-colors',
              isActive ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-subtle hover:text-ink',
            )}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border p-3">
        <div className="flex items-center justify-between gap-2 rounded px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{user?.scope === 'support' ? 'Suporte Genesis' : 'Dono'}</p>
          </div>
          <IconButton label="Sair" icon={LogOut} size="sm" onClick={async () => { await logout(); navigate('/entrar'); }} />
        </div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const { user, loading } = useSession();
  const location = useLocation();
  const online = useOnline();
  const [tenant, setTenant] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/api/owner/tenant').then((r) => setTenant(r.data)).catch(() => setTenant(null));
  }, [user]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return <FullPageSpinner />;
  if (tenant && tenant.onboarding_completed === false && user?.scope !== 'support') return <Navigate to="/onboarding" replace />;

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
  const trialDays = tenant?.status === 'trial' && tenant.trial_ends_at
    ? Math.ceil((new Date(tenant.trial_ends_at) - Date.now()) / 86400000) : null;

  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-surface lg:block">
        <Sidebar tenant={tenant} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(28,25,23,0.30)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
          <aside className="h-full w-64 border-r border-border bg-surface">
            <Sidebar tenant={tenant} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-60">
        {user?.scope === 'support' && (
          <div className="no-print bg-info px-4 py-1.5 text-center text-sm font-medium text-white">Modo suporte Genesis — só leitura. Nenhuma alteração é possível.</div>
        )}
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-8">
          <IconButton label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} icon={mobileOpen ? X : Menu} className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} />
          {/* No desktop o titulo ja esta no cabecalho da pagina (sem duplicar). */}
          <p className="text-base font-medium text-ink lg:hidden">{current?.label || 'Genesis'}</p>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {trialDays !== null && (
              <span className={cx('hidden sm:inline', trialDays <= 7 ? 'text-warning' : 'text-ink-muted')}>
                {trialDays > 0 ? `Período de teste: ${trialDays} dia(s)` : 'Período de teste terminado — só leitura'}
              </span>
            )}
            {!online && <span className="flex items-center gap-1.5 text-warning"><WifiOff size={15} /> Sem ligação</span>}
          </div>
        </header>
        <main className="print-full mx-auto max-w-content px-4 py-6 lg:px-8 lg:py-8">
          <Outlet context={{ tenant, reloadTenant: () => api.get('/api/owner/tenant').then((r) => setTenant(r.data)) }} />
        </main>
      </div>
    </div>
  );
}
