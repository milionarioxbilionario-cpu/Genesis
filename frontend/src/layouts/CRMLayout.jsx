import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import api from '../utils/api';
import '../ui/components.css';
import '../ui/animations.css';
import '../ui/main.css';

export default function CRMLayout({ children, title = 'Genesis CRM' }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tenant, setTenant] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => setRole(res.data?.user?.role || null))
      .catch(() => setRole(null));
    try {
      const data = window.GENESIS_DATA || {};
      const t = data.tenants ? data.tenants.find((x) => x.id === data.activeTenantId) : null;
      setTenant(t || (data.tenants && data.tenants[0]) || { name: 'Genesis Demo', color: '#dfe7ef', logoText: 'G' });
    } catch (e) {
      setTenant({ name: 'Genesis Demo', color: '#dfe7ef', logoText: 'G' });
    }

    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const el = document.getElementById('global-search-trigger');
        if (el) el.click();
        const input = document.querySelector('.search-trigger input');
        if (input) input.focus();
        else alert('Abrir pesquisa (demo)');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navItem = (to, label) => (
    <NavLink to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(180deg, #0a1220 0%, #111c2b 100%)' }}>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`} style={{ background: 'rgba(17, 28, 43, 0.96)', borderRight: '1px solid rgba(148, 163, 184, 0.12)' }}>
        <div className="sidebar-header" style={{ padding: '18px 16px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="tenant-logo" style={{ background: 'linear-gradient(135deg, #dfe7ef 0%, #a7bdd8 100%)', color: '#111c2b' }}>{tenant?.logoText}</div>
            <div className="tenant-info">
              <div className="tenant-name">{tenant?.name}</div>
              <div className="tenant-plan">Demo</div>
            </div>
          </div>
          <button onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
            <span className="tenant-chevron">{collapsed ? '»' : '«'}</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {role === 'cashier' ? (
            <>
              <div className="nav-section-title">Caixa</div>
              {navItem('/pos', 'Vendas / POS')}
            </>
          ) : (
            <>
              <div className="nav-section-title">Principal</div>
              {navItem('/owner', 'Visão Geral')}
              {navItem('/owner/cashiers', 'Caixistas (Hub do Balcão)')}
              {navItem('/owner/stock', 'Stock')}
              {navItem('/onboarding', 'Onboarding')}

              <div className="nav-section-title">Gestão</div>
              {navItem('/owner', 'Painel do Dono')}
              {navItem('/owner/device-keys', 'Chaves de Dispositivo')}
            </>
          )}
        </nav>

        <div className="sidebar-footer" style={{ padding: 12, borderTop: '1px solid rgba(148, 163, 184, 0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="user-avatar" style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #dfe7ef 0%, #7aa5d6 100%)', color: '#111c2b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AD</div>
            <div style={{ fontSize: 12.5 }}>
              <div style={{ fontWeight: 700, color: '#edf2f7' }}>Admin</div>
              <div style={{ color: 'var(--text-subtle)', fontSize: 12 }}>{tenant?.code || 'GEN-DEMO'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid rgba(148, 163, 184, 0.12)', background: 'rgba(17, 28, 43, 0.72)', backdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="search-trigger" id="global-search-trigger" style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(148, 163, 184, 0.12)', borderRadius: 12, padding: '8px 12px', color: '#c6d0df', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span style={{ color: '#9fb0c6' }}>Buscar no Genesis (Ctrl+K)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(148, 163, 184, 0.18)', color: '#edf2f7' }}>PT</button>
              <button className="btn btn-ghost" style={{ background: 'transparent', borderColor: 'rgba(148, 163, 184, 0.18)', color: '#c6d0df' }}>Tema</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: '#edf2f7' }}>{tenant?.name}</div>
                <div style={{ fontSize: 12, color: '#8ca0b8' }}>{tenant?.plan || 'Demo'}</div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: 24, background: 'radial-gradient(circle at top, rgba(122,165,214,0.12), transparent 28%), #0a1220', minHeight: 'calc(100vh - 64px)' }}>
          <div className="page-header" style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0, color: '#edf2f7', fontSize: '2rem', letterSpacing: '-0.05em' }}>{title}</h1>
          </div>

          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
