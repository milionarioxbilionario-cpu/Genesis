import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BarChart3, ChevronsLeft, ChevronsRight, ChevronsUpDown, Eye, EyeOff, HandCoins, House, LogOut, Menu, Package, Receipt, Settings, Truck, Users, WifiOff, X } from 'lucide-react';
import { PrivacyContext, usePrivacy, usePrivacyState } from '../utils/privacy';
import api, { saveLanguage } from '../utils/api';
import { useSession, FullPageSpinner, isManager } from '../utils/session';
import { BrandMark, cx, IconButton, LanguageSwitch } from '../components/ui';
import { useI18n } from '../i18n/react';
import '../i18n/en/owner';
import MonthCloseDialog from '../components/MonthCloseDialog';
import NotificationBell from '../components/NotificationBell';
import LiveSales from '../components/LiveSales';
import EstablishmentSwitcher from '../components/EstablishmentSwitcher';
import BirthdayDialog from '../components/BirthdayDialog';
import GroupCongrats from '../components/GroupCongrats';

// Navegacao do dono: 8 seccoes, sem duplicados. Cada funcao da especificacao
// vive num so sitio (ex.: Metas no Inicio; Terminais e Auditoria nas Definicoes).
// label em portugues = chave da traducao.
export const NAV = [
  { to: '/app', label: 'Início', icon: House, end: true },
  { to: '/app/vendas', label: 'Vendas', icon: Receipt },
  { to: '/app/produtos', label: 'Produtos', icon: Package },
  { to: '/app/fornecedores', label: 'Fornecedores', icon: Truck },
  { to: '/app/txenekas', label: 'Txenekas', icon: HandCoins },
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

// Etapa A (27/10): recolhida mostra so os icones (o nome aparece ao passar o rato).
const SIDEBAR_KEY = 'genesis.sidebar.collapsed';
function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(SIDEBAR_KEY) === '1'; } catch { return false; } });
  const toggle = () => setCollapsed((v) => { try { localStorage.setItem(SIDEBAR_KEY, v ? '0' : '1'); } catch { /* sem armazenamento */ } return !v; });
  return [collapsed, toggle];
}

function Sidebar({ tenant, onNavigate, collapsed = false, onToggle }) {
  const { user, logout } = useSession();
  const { t } = useI18n();
  const navigate = useNavigate();
  const support = user?.scope === 'support';
  // E2: o gerente trabalha so no seu estabelecimento (sem trocar nem painel geral).
  const manager = isManager(user);
  const fixed = support || manager;
  const [switching, setSwitching] = useState(false);
  return (
    <div className="flex h-full flex-col">
      <div className={cx('flex h-14 items-center border-b border-border', collapsed ? 'justify-center px-2' : 'gap-2.5 px-5')}>
        {!collapsed && <BrandMark />}
        {!collapsed && (
          // Etapa D: tocar no nome abre os estabelecimentos (trocar, painel geral, acrescentar).
          <button type="button" disabled={fixed} onClick={() => setSwitching(true)} className="min-w-0 flex-1 rounded text-left hover:bg-subtle disabled:hover:bg-transparent" aria-label={t('Os seus estabelecimentos')}>
            <p className="flex items-center gap-1 truncate text-base font-semibold leading-5 text-ink">{tenant?.name || 'Genesis'}{!fixed && <ChevronsUpDown size={14} className="shrink-0 text-ink-muted" />}</p>
            <p className="truncate text-xs text-ink-muted">{tenant?.location || t('Gestão comercial')}</p>
          </button>
        )}
        {!fixed && <EstablishmentSwitcher open={switching} onClose={() => setSwitching(false)} />}
        {onToggle && <IconButton label={collapsed ? t('Mostrar o menu') : t('Esconder o menu')} icon={collapsed ? ChevronsRight : ChevronsLeft} size="sm" onClick={onToggle} />}
      </div>
      <nav className={cx('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')} aria-label={t('Navegação principal')}>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? t(label) : undefined}
            aria-label={collapsed ? t(label) : undefined}
            className={({ isActive }) => cx(
              'mb-0.5 flex h-9 items-center rounded text-base transition-colors',
              collapsed ? 'justify-center px-0' : 'gap-3 px-3',
              isActive ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-subtle hover:text-ink',
            )}
          >
            <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
            {!collapsed && t(label)}
          </NavLink>
        ))}
      </nav>
      <div className={cx('border-t border-border', collapsed ? 'flex flex-col items-center gap-2 p-2' : 'p-3')}>
        {/* Modo suporte e so leitura: a lingua muda o ecra, nao a conta do dono. */}
        {!collapsed && <LanguageSwitch className="mb-2 px-2" onChange={support ? undefined : saveLanguage} />}
        {collapsed ? (
          <IconButton label={t('Sair')} icon={LogOut} size="sm" onClick={async () => { await logout(); navigate('/entrar'); }} />
        ) : (
        <div className="flex items-center justify-between gap-2 rounded px-2 py-1.5">
          {/* Fase 16: o nome abre o Perfil (senha, e-mail, plano, aniversario). */}
          {support ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{t('Suporte Genesis')}</p>
            </div>
          ) : (
            <NavLink to="/app/perfil" onClick={onNavigate} className="min-w-0 rounded hover:text-accent" title={t('Perfil')}>
              <p className="truncate text-sm font-medium text-ink">{user?.name}</p>
              <p className="truncate text-xs text-ink-muted">{manager ? t('Gerente') : t('Dono')} · {t('Perfil')}</p>
            </NavLink>
          )}
          <IconButton label={t('Sair')} icon={LogOut} size="sm" onClick={async () => { await logout(); navigate('/entrar'); }} />
        </div>
        )}
      </div>
    </div>
  );
}

// Olho do modo privado: esconde os valores em dinheiro de todo o painel.
function PrivacyToggle() {
  const { hidden, toggle } = usePrivacy();
  const { t } = useI18n();
  return <IconButton label={hidden ? t('Mostrar valores') : t('Esconder valores')} icon={hidden ? EyeOff : Eye} variant={hidden ? 'secondary' : 'ghost'} onClick={toggle} aria-pressed={hidden} />;
}

export default function AppShell() {
  const { user, loading, offline: sessionOffline } = useSession();
  const { t } = useI18n();
  const location = useLocation();
  const online = useOnline();
  const [tenant, setTenant] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();
  const privacy = usePrivacyState(user?.id);

  useEffect(() => {
    if (!user) return;
    api.get('/api/owner/tenant').then((r) => setTenant(r.data)).catch(() => setTenant(null));
  }, [user]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return <FullPageSpinner />;
  // A configuracao inicial e do dono; o gerente espera por ela (aviso em baixo).
  if (tenant && tenant.onboarding_completed === false && user?.scope !== 'support' && !isManager(user)) return <Navigate to="/onboarding" replace />;

  const current = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));
  const trialDays = tenant?.status === 'trial' && tenant.trial_ends_at
    ? Math.ceil((new Date(tenant.trial_ends_at) - Date.now()) / 86400000) : null;
  // Etapa A: subscricao paga ate uma data; avisa 7 dias antes e depois de vencer.
  const paidDays = tenant?.status === 'active' && tenant.subscription_until
    ? Math.ceil((new Date(tenant.subscription_until) - Date.now()) / 86400000) : null;

  return (
    <PrivacyContext.Provider value={privacy}>
    <div className="min-h-screen bg-bg">
      <aside className={cx('fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface transition-[width] duration-200 lg:block', collapsed ? 'w-16' : 'w-60')}>
        <Sidebar tenant={tenant} collapsed={collapsed} onToggle={toggleCollapsed} />
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-[rgba(28,25,23,0.30)] lg:hidden" onMouseDown={(e) => { if (e.target === e.currentTarget) setMobileOpen(false); }}>
          <aside className="h-full w-64 border-r border-border bg-surface">
            <Sidebar tenant={tenant} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cx('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        {(sessionOffline || !online) && (
          <div className="no-print bg-warning px-4 py-1.5 text-center text-sm font-medium text-white">
            {t('Sem ligação — a mostrar os dados guardados neste aparelho. Só consulta: nada pode ser alterado até a internet voltar.')}
          </div>
        )}
        {user?.tenant?.status === 'closed' && (
          <div className="no-print bg-ink-2 px-4 py-1.5 text-center text-sm font-medium text-white">{t('Este estabelecimento está encerrado: só consulta. Pode reabri-lo nos 30 dias seguintes, na lista dos seus estabelecimentos.')}</div>
        )}
        {isManager(user) && tenant && tenant.onboarding_completed === false && (
          <div className="no-print bg-warning px-4 py-1.5 text-center text-sm font-medium text-white">{t('O dono ainda está a configurar este estabelecimento. Alguns dados podem faltar.')}</div>
        )}
        {user?.scope === 'support' && (
          <div className="no-print bg-info px-4 py-1.5 text-center text-sm font-medium text-white">{t('Modo suporte Genesis — só leitura. Nenhuma alteração é possível.')}</div>
        )}
        <header className="no-print sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4 lg:px-8">
          <IconButton label={mobileOpen ? t('Fechar menu') : t('Abrir menu')} icon={mobileOpen ? X : Menu} className="lg:hidden" onClick={() => setMobileOpen((v) => !v)} />
          {/* No desktop o titulo ja esta no cabecalho da pagina (sem duplicar). */}
          <p className="text-base font-medium text-ink lg:hidden">{current ? t(current.label) : 'Genesis'}</p>
          <div className="ml-auto flex items-center gap-3 text-sm">
            {trialDays !== null && (
              <span className={cx('hidden sm:inline', trialDays <= 7 ? 'text-warning' : 'text-ink-muted')}>
                {trialDays > 0 ? t('Período de teste: {n} dia(s)', { n: trialDays }) : t('Período de teste terminado — só leitura')}
              </span>
            )}
            {paidDays !== null && paidDays <= 7 && (
              <span className={cx('hidden sm:inline', paidDays > 0 ? 'text-warning' : 'text-danger')}>
                {paidDays > 0 ? t('Subscrição: renove em {n} dia(s)', { n: paidDays }) : t('Subscrição em atraso — só leitura')}
              </span>
            )}
            {!online && <span className="flex items-center gap-1.5 text-warning"><WifiOff size={15} /> {t('Sem ligação')}</span>}
            <PrivacyToggle />
            {(user?.role === 'owner' || isManager(user)) && <NotificationBell />}
            {(user?.role === 'owner' || isManager(user)) && !user?.scope && online && !sessionOffline && <LiveSales />}
          </div>
        </header>
        <main className="print-full mx-auto max-w-content px-4 py-6 lg:px-8 lg:py-8">
          {/* key: o React Router devolve sempre o mesmo elemento da pagina; ao mudar o modo
              privado a pagina volta a montar para todos os money() mudarem. */}
          <Outlet key={privacy.hidden ? 'privado' : 'visivel'} context={{ tenant, reloadTenant: () => api.get('/api/owner/tenant').then((r) => setTenant(r.data)) }} />
        </main>
        {tenant?.onboarding_completed && user?.role === 'owner' && user?.scope !== 'support' && <MonthCloseDialog />}
        {tenant?.onboarding_completed && user?.role === 'owner' && user?.scope !== 'support' && <BirthdayDialog />}
        {tenant?.onboarding_completed && user?.role === 'owner' && !user?.scope && <GroupCongrats />}
      </div>
    </div>
    </PrivacyContext.Provider>
  );
}
