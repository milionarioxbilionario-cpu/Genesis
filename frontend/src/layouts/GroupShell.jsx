import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeftRight, BarChart3, Boxes, Eye, EyeOff, History, LayoutGrid, LogOut, Map as MapIcon, Menu, Store, UserCog, X } from 'lucide-react';
import { PrivacyContext, usePrivacy, usePrivacyState } from '../utils/privacy';
import useApi from '../utils/useApi';
import { saveLanguage } from '../utils/api';
import { useSession, FullPageSpinner, isManager } from '../utils/session';
import { BrandMark, IconButton, LanguageSwitch, cx } from '../components/ui';
import { useI18n } from '../i18n/react';
import '../i18n/en/owner';

// E2 (31/10/2026): PAINEL GERAL com barra propria — so o dono, so com 2 ou mais
// estabelecimentos. Cada numero vem do servidor ja lido dentro de cada
// estabelecimento (backend/src/routes/group.js). label em portugues = chave da traducao.
export const GROUP_NAV = [
  { to: '/geral', label: 'Visão geral', icon: LayoutGrid, end: true },
  { to: '/geral/estabelecimentos', label: 'Estabelecimentos', icon: Store },
  { to: '/geral/relatorios', label: 'Relatórios', icon: BarChart3 },
  { to: '/geral/rastreio', label: 'Rastreio geral', icon: History },
  { to: '/geral/stock', label: 'Stock geral', icon: Boxes },
  { to: '/geral/gerentes', label: 'Gerentes', icon: UserCog },
  { to: '/geral/mapa', label: 'Mapa', icon: MapIcon },
];

function Nav({ onNavigate }) {
  const { t } = useI18n();
  const { user, logout } = useSession();
  const navigate = useNavigate();
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <BrandMark />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold leading-5 text-ink">{t('Painel geral')}</p>
          <p className="truncate text-xs text-ink-muted">{t('Todos os seus estabelecimentos')}</p>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label={t('Navegação do painel geral')}>
        {GROUP_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => cx('mb-0.5 flex h-9 items-center gap-3 rounded px-3 text-base transition-colors', isActive ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-subtle hover:text-ink')}>
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            {t(label)}
          </NavLink>
        ))}
        <NavLink to="/escolher" onClick={onNavigate} className="mt-3 flex h-9 items-center gap-3 rounded border border-border px-3 text-base text-ink-2 hover:bg-subtle hover:text-ink">
          <ArrowLeftRight size={17} strokeWidth={1.8} aria-hidden="true" />
          {t('Entrar num estabelecimento')}
        </NavLink>
      </nav>
      <div className="border-t border-border p-3">
        <LanguageSwitch className="mb-2 px-2" onChange={saveLanguage} />
        <div className="flex items-center justify-between gap-2 rounded px-2 py-1.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
            <p className="truncate text-xs text-ink-muted">{t('Dono')}</p>
          </div>
          <IconButton label={t('Sair')} icon={LogOut} size="sm" onClick={async () => { await logout(); navigate('/entrar'); }} />
        </div>
      </div>
    </div>
  );
}

function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();
  const { t } = useI18n();
  return <IconButton label={hidden ? t('Mostrar valores') : t('Esconder valores')} icon={hidden ? EyeOff : Eye} variant={hidden ? 'secondary' : 'ghost'} onClick={toggle} aria-pressed={hidden} />;
}

export default function GroupShell() {
  const { user, loading } = useSession();
  const { t } = useI18n();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const privacy = usePrivacyState(user?.id);
  const owner = user && !isManager(user) && !user.scope;
  const list = useApi(owner ? '/api/establishments' : null);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return <FullPageSpinner />;
  // O painel geral e so do dono, na sessao normal, com 2 ou mais estabelecimentos.
  if (!owner) return <Navigate to="/app" replace />;
  if (list.data && list.data.length < 2) return <Navigate to="/app" replace />;
  const current = GROUP_NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  return (
    <PrivacyContext.Provider value={privacy}>
      <div className="min-h-screen bg-bg">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-surface lg:block"><Nav /></aside>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 bg-[rgba(28,25,23,0.30)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
            <aside className="h-full w-64 border-r border-border bg-surface"><Nav onNavigate={() => setMobileOpen(false)} /></aside>
          </div>
        )}
        <div className="lg:pl-60">
          <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-8">
            <IconButton label={mobileOpen ? t('Fechar menu') : t('Abrir menu')} icon={mobileOpen ? X : Menu} className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} />
            <p className="text-base font-medium text-ink lg:hidden">{current ? t(current.label) : t('Painel geral')}</p>
            <div className="ml-auto flex items-center gap-3"><PrivacyToggle /></div>
          </header>
          <main className="print-full mx-auto max-w-content px-4 py-6 lg:px-8 lg:py-8">
            {!list.data ? <FullPageSpinner /> : <Outlet key={privacy.hidden ? 'privado' : 'visivel'} context={{ establishments: list.data, reloadEstablishments: list.reload }} />}
          </main>
        </div>
      </div>
    </PrivacyContext.Provider>
  );
}
