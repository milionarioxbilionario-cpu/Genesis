import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Modal, Badge } from '../components/ui';
import '../ui/components.css';
import '../ui/animations.css';
import '../ui/main.css';

/* ==========================================================================
   SHELL DO GENESIS (donos).
   - Todos os valores visuais vem de tokens.css (var(--x)).
   - O nome da loja vem da BASE DE DADOS (/api/owner/tenant), nunca de dados
     de demonstracao.
   - Paleta de comandos (Ctrl+K) e botao de SAIR (antes nao existia logout).
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
    { to: '/owner', label: 'Visao Geral', icon: '\uD83D\uDCCA', end: true },
    { to: '/hub', label: 'Caixistas - Hub do Balcao', icon: '\uD83D\uDC65' },
    { to: '/owner/products', label: 'Produtos', icon: '\uD83D\uDCE6' },
    { to: '/owner/stock', label: 'Stock', icon: '\uD83C\uDFF7\uFE0F' },
    { to: '/owner/suppliers', label: 'Fornecedores', icon: '\uD83D\uDE9A' },
    { to: '/owner/employees', label: 'Trabalhadores', icon: '\uD83E\uDDD1' },
    { to: '/owner/debts', label: 'Chenecas', icon: '\uD83D\uDCD2' },
  ] },
  { section: 'Analise', items: [
    { to: '/owner/reports', label: 'Relatorios', icon: '\uD83D\uDCC8' },
    { to: '/owner/goals', label: 'Metas', icon: '\uD83C\uDFAF' },
  ] },
  { section: 'Sistema', items: [
    { to: '/onboarding', label: 'Onboarding', icon: '\uD83D\uDE80' },
    { to: '/owner/device-keys', label: 'Chaves de Dispositivo', icon: '\uD83D\uDD11' },
    { to: '/owner/audit', label: 'Auditoria', icon: '\uD83D\uDEE1\uFE0F' },
    { to: '/owner/settings', label: 'Definicoes', icon: '\u2699\uFE0F' },
  ] },
];

const CASHIER_NAV = [
  { section: 'Caixa', items: [{ to: '/pos', label: 'Vendas / POS', icon: '\uD83E\uDDFE' }] },
];

export default function CRMLayout({ children, title }) {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [query, setQuery] = useState('');

  const role = user?.role || null;
  const nav = role === 'cashier' ? CASHIER_NAV : OWNER_NAV;

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => setUser(res.data?.user || null))
      .catch(() => setUser(null));
    api.get('/api/owner/tenant')
      .then((res) => setTenant(res.data || null))
      .catch(() => setTenant(null));
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuery('');
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = useMemo(() => {
    const all = nav.flatMap((g) => g.items.map((i) => ({ ...i, section: g.section })));
    if (!query.trim()) return all;
    const q = query.trim().toLowerCase();
    return all.filter((i) => i.label.toLowerCase().includes(q));
  }, [nav, query]);

  async function handleLogout() {
    try { await api.post('/api/auth/logout'); } catch { /* sessao ja invalida */ }
    window.location.href = '/login';
  }

  function runCommand(item) {
    setPaletteOpen(false);
    navigate(item.to);
  }

  const tenantName = tenant?.name || 'Genesis';
  const planLabel = tenant?.business_type ? (BUSINESS_LABEL[tenant.business_type] || tenant.business_type) : 'Demo';
  const initials = String(user?.name || 'Genesis').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <aside style={{ width: collapsed ? 78 : 262, flexShrink: 0, background: 'var(--bg-elev2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', transition: 'width var(--t)' }}>
        <div style={{ padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 'var(--r-md)', background: 'linear-gradient(135deg, var(--brand), #7a1017)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 19 }}>
            {initials[0] || 'G'}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: 'var(--text)', fontWeight: 800, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenantName}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{planLabel}</div>
            </div>
          )}
          <button type="button" onClick={() => setCollapsed((c) => !c)} aria-label="Alternar menu"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 15 }}>
            {collapsed ? '\u00BB' : '\u00AB'}
          </button>
        </div>

        <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 10px 16px' }}>
          {nav.map((group) => (
            <div key={group.section}>
              {!collapsed && <div style={{ color: 'var(--text-dim)', fontSize: '0.63rem', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', padding: '16px 10px 7px' }}>{group.section}</div>}
              {group.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 11,
                    padding: collapsed ? '11px 0' : '10px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 'var(--r-sm)', marginBottom: 3,
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem',
                    color: isActive ? 'var(--text)' : 'var(--text-muted)',
                    background: isActive ? 'var(--brand-weak)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--brand)' : '3px solid transparent',
                    transition: 'background var(--t), color var(--t)',
                  })}>
                  <span style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, flexShrink: 0, borderRadius: 'var(--r-sm)', background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem' }}>{initials || 'G'}</div>
          {!collapsed && (
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'A carregar...'}</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>{role === 'cashier' ? 'Caixista' : 'Dono'}</div>
            </div>
          )}
          <button type="button" onClick={handleLogout} title="Sair" aria-label="Sair" style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 15 }} >⏻</button>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'rgba(10, 10, 12, 0.72)', backdropFilter: 'blur(14px)', position: 'sticky', top: 0, zIndex: 'var(--z-header)' }}>
          <button type="button" onClick={() => { setQuery(''); setPaletteOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'var(--surface)', border: '1px solid var(--border-strong)', borderRadius: 'var(--r-md)', padding: '9px 14px', color: 'var(--text-muted)', cursor: 'pointer', minWidth: 250 }}>
            <span>🔍</span>
            <span style={{ flex: 1, textAlign: 'left', fontSize: '0.85rem' }}>Buscar no Genesis</span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', border: '1px solid var(--border-strong)', borderRadius: 5, padding: '1px 6px' }}>Ctrl K</span>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge tone={tenant?.status === 'active' ? 'ok' : tenant?.status === 'trial' ? 'info' : 'neutral'}>{tenant?.status || 'demo'}</Badge>
            <div style={{ textAlign: 'right', display: 'none' }}>{tenantName}</div>
          </div>
        </header>

        <main style={{ flex: 1, minHeight: 0, background: 'radial-gradient(circle at 30% -10%, rgba(229, 9, 20, 0.07), transparent 45%), var(--bg-base)' }}>
          {title && (
            <div style={{ padding: '22px 24px 0' }}>
              <h1 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem', letterSpacing: '-0.035em', fontWeight: 800 }}>{title}</h1>
            </div>
          )}
          <div>{children}</div>
        </main>
      </div>

      <Modal open={paletteOpen} title="Buscar no Genesis" hint="Escreve para filtrar; Enter abre o primeiro resultado." onClose={() => setPaletteOpen(false)} width={520}>
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && commands[0]) runCommand(commands[0]); }}
          placeholder="Ex: produtos, metas, chenecas..." className="g-input" />
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflow: 'auto' }}>
          {commands.length === 0 && <div style={{ color: 'var(--text-dim)', padding: 12, textAlign: 'center' }}>Nada encontrado.</div>}
          {commands.map((item) => (
            <button key={item.to} type="button" onClick={() => runCommand(item)}
              style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 'var(--r-sm)', background: 'transparent', border: '1px solid transparent', color: 'var(--text)', cursor: 'pointer', textAlign: 'left', fontWeight: 600, fontSize: '0.88rem' }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>{item.section}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
