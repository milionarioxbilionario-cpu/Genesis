import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Package, Boxes, Truck, UserCog, Receipt, BarChart3, Target,
  Rocket, KeyRound, ShieldCheck, Settings, ShoppingCart, Search, Menu,
  PanelLeftClose, PanelLeftOpen, LogOut, WifiOff, Store,
} from 'lucide-react';
import api from '../utils/api';
import { Modal } from '../components/ui';

/* ==========================================================================
   SHELL DO GENESIS (donos e caixistas).
   - Todos os valores visuais vem de tokens.css (var(--x)) via ui/shell.css.
   - O nome da loja vem da BASE DE DADOS (/api/owner/tenant), nunca de dados
     de demonstracao.
   - Paleta de comandos (Ctrl+K) com navegacao por teclado e botao de SAIR.
   - Sidebar recolhivel (persistida), drawer em mobile, estado online/offline
     e transicao suave de pagina a cada mudanca de rota.
   - Icones: lucide-react (substituem os emojis anteriores).
   ========================================================================== */
const BUSINESS_LABEL = {
  bottle_store: 'Bottle Store',
  mercearia: 'Mercearia',
  padaria: 'Padaria',
  talho: 'Talho',
  supermercado: 'Supermercado',
  restaurante: 'Restaurante',
  boutique: 'Boutique',
  outro: 'Negocio',
};

const OWNER_NAV = [
  { section: 'Principal', items: [
    { to: '/owner', label: 'Visao Geral', icon: LayoutDashboard, end: true },
    { to: '/hub', label: 'Caixistas - Hub do Balcao', icon: Users },
    { to: '/owner/products', label: 'Produtos', icon: Package },
    { to: '/owner/stock', label: 'Stock', icon: Boxes },
    { to: '/owner/suppliers', label: 'Fornecedores', icon: Truck },
    { to: '/owner/employees', label: 'Trabalhadores', icon: UserCog },
    { to: '/owner/debts', label: 'Chenecas', icon: Receipt },
  ] },
  { section: 'Analise', items: [
    { to: '/owner/reports', label: 'Relatorios', icon: BarChart3 },
    { to: '/owner/goals', label: 'Metas', icon: Target },
  ] },
  { section: 'Sistema', items: [
    { to: '/onboarding', label: 'Onboarding', icon: Rocket },
    { to: '/owner/device-keys', label: 'Chaves de Dispositivo', icon: KeyRound },
    { to: '/owner/audit', label: 'Auditoria', icon: ShieldCheck },
    { to: '/owner/settings', label: 'Definicoes', icon: Settings },
  ] },
];

const CASHIER_NAV = [
  { section: 'Caixa', items: [{ to: '/pos', label: 'Vendas / POS', icon: ShoppingCart }] },
];

export default function CRMLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('genesis.side.collapsed') === '1'; } catch { return false; }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [paletteIndex, setPaletteIndex] = useState(0);

  const role = user?.role || null;
  const nav = role === 'cashier' ? CASHIER_NAV : OWNER_NAV;

  useEffect(() => {
    document.title = title ? title + ' - Genesis' : 'Genesis';
  }, [title]);

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => setUser(res.data?.user || null))
      .catch(() => setUser(null));
    api.get('/api/owner/tenant')
      .then((res) => setTenant(res.data || null))
      .catch(() => setTenant(null));
  }, []);

  useEffect(() => {
    try { localStorage.setItem('genesis.side.collapsed', collapsed ? '1' : '0'); } catch { /* modo privado */ }
  }, [collapsed]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const openPalette = useCallback(() => { setQuery(''); setPaletteIndex(0); setPaletteOpen(true); }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openPalette();
      }
      if (e.key === 'Escape') { setPaletteOpen(false); setMobileOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openPalette]);

  useEffect(() => { setPaletteIndex(0); }, [query]);

  const commands = useMemo(() => {
    const all = nav.flatMap((g) => g.items.map((i) => ({ ...i, section: g.section })));
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((i) => i.label.toLowerCase().includes(q) || i.section.toLowerCase().includes(q));
  }, [nav, query]);

  async function handleLogout() {
    try { await api.post('/api/auth/logout'); } catch { /* sessao ja invalida */ }
    window.location.href = '/login';
  }

  function runCommand(item) {
    setPaletteOpen(false);
    navigate(item.to);
  }

  function onPaletteKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setPaletteIndex((i) => Math.min(i + 1, commands.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setPaletteIndex((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && commands[paletteIndex]) runCommand(commands[paletteIndex]);
  }

  const tenantName = tenant?.name || 'Genesis';
  const planLabel = tenant?.business_type ? (BUSINESS_LABEL[tenant.business_type] || tenant.business_type) : 'Demo';
  const initials = String(user?.name || 'Genesis').trim().split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const tenantTone = tenant?.status === 'active' ? 'ok' : tenant?.status === 'trial' ? 'info' : 'neutral';

  return (
    <div className="app-shell">
      {mobileOpen && <div className="app-scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <aside className={'app-side' + (collapsed ? ' is-collapsed' : '') + (mobileOpen ? ' is-open' : '')}>
        <div className="app-side-head">
          <div className="app-brand">
            <span className="app-brand-mark">{initials[0] || 'G'}</span>
            {!collapsed && (
              <span className="app-brand-text">
                <span className="app-brand-name">{tenantName}</span>
                <span className="app-brand-sub">{planLabel}</span>
              </span>
            )}
          </div>
          <button
            type="button"
            className="icon-btn app-collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </button>
        </div>

        <nav className="app-nav">
          {nav.map((group) => (
            <div className="app-nav-group" key={group.section}>
              <span className="app-nav-title">{group.section}</span>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) => 'app-nav-item' + (isActive ? ' is-active' : '')}
                  >
                    <Icon aria-hidden="true" />
                    <span className="app-nav-label">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="app-side-foot">
          <div className="app-user">
            <span className="app-avatar">{initials || 'G'}</span>
            <div className="app-user-info">
              <div className="app-user-name">{user?.name || 'A carregar...'}</div>
              <div className="app-user-role">{role === 'cashier' ? 'Caixista' : 'Dono'}</div>
            </div>
            <button type="button" className="icon-btn is-danger" onClick={handleLogout} title="Sair" aria-label="Sair">
              <LogOut />
            </button>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <button type="button" className="icon-btn app-menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu />
          </button>
          <button type="button" className="app-search" onClick={openPalette} aria-label="Buscar no Genesis">
            <Search aria-hidden="true" />
            <span className="app-search-label">Buscar no Genesis</span>
            <kbd className="app-kbd">Ctrl</kbd>
            <kbd className="app-kbd">K</kbd>
          </button>
          <div className="app-topbar-right">
            <span className={'app-status' + (online ? '' : ' is-offline')} title={online ? 'Ligado a rede' : 'Sem ligacao'}>
              <span className="app-status-dot" />
              {online ? 'Online' : 'Offline'}
            </span>
            <span className="app-chip" title={'Estado da subscricao: ' + (tenant?.status || 'demo')}>
              <Store size={12} aria-hidden="true" />
              {tenant?.status || 'demo'}
            </span>
          </div>
        </header>

        {!online && (
          <div className="app-offline">
            <WifiOff aria-hidden="true" />
            Sem ligacao. As vendas continuam a ser registadas no dispositivo e sincronizam quando a rede voltar.
          </div>
        )}

        <main className="app-content">
          {title && (
            <div style={{ padding: '22px 24px 0' }}>
              <h1 className="g-page-title" style={{ fontSize: '1.55rem' }}>{title}</h1>
            </div>
          )}
          <div className="app-page-anim" key={location.pathname}>{children}</div>
        </main>
      </div>

      <Modal
        open={paletteOpen}
        title="Buscar no Genesis"
        hint="Escreve para filtrar - setas para navegar - Enter abre."
        onClose={() => setPaletteOpen(false)}
        width={540}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onPaletteKey}
          placeholder="Ex: produtos, metas, chenecas..."
          className="g-input"
        />
        <div className="app-cmd-list">
          {commands.length === 0 && <div className="app-cmd-empty">Nada encontrado.</div>}
          {commands.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.to}
                type="button"
                onClick={() => runCommand(item)}
                className={'app-cmd-item' + (idx === paletteIndex ? ' is-selected' : '')}
                onMouseEnter={() => setPaletteIndex(idx)}
              >
                <Icon aria-hidden="true" />
                <span style={{ flex: 1 }}>{item.label}</span>
                <span className="app-cmd-section">{item.section}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}