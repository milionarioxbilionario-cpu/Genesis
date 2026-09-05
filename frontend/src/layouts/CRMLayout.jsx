import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import '../ui/components.css';
import '../ui/animations.css';
import '../ui/main.css';

export default function CRMLayout({ children, title = 'Genesis CRM' }) {
  const [collapsed, setCollapsed] = useState(false);
  const [tenant, setTenant] = useState(null);
  const location = useLocation();

  useEffect(() => {
    // load demo tenant from mock data if present
    try {
      const data = window.GENESIS_DATA || {};
      const t = data.tenants ? data.tenants.find((x) => x.id === data.activeTenantId) : null;
      setTenant(t || (data.tenants && data.tenants[0]) || { name: 'Genesis Demo', color: '#6366f1', logoText: 'G' });
    } catch (e) {
      setTenant({ name: 'Genesis Demo', color: '#6366f1', logoText: 'G' });
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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div className="tenant-logo" style={{ background: tenant?.color }}>{tenant?.logoText}</div>
            <div className="tenant-info">
              <div className="tenant-name">{tenant?.name}</div>
              <div className="tenant-plan">Demo</div>
            </div>
          </div>
          <button onClick={() => setCollapsed((c) => !c)} aria-label="Toggle sidebar" style={{ background: 'transparent', border: 'none' }}>
            <span className="tenant-chevron">{collapsed ? '»' : '«'}</span>
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Principal</div>
          {navItem('/owner', 'Visão Geral')}
          {navItem('/pos', 'Vendas / POS')}
          {navItem('/products', 'Produtos')}
          {navItem('/inventory', 'Stock')}

          <div className="nav-section-title">Gestão</div>
          {navItem('/owner', 'Painel do Dono')}
          {navItem('/owner/device-keys', 'Chaves de Dispositivo')}
          {navItem('/admin', 'Super Admin')}
        </nav>

        <div className="sidebar-footer" style={{ padding: 12, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="user-avatar" style={{ width: 40, height: 40, borderRadius: 8, background: tenant?.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>AD</div>
            <div style={{ fontSize: 12.5 }}>
              <div style={{ fontWeight: 600 }}>Admin</div>
              <div style={{ color: 'var(--text-subtle)', fontSize: 12 }}>{tenant?.code || 'GEN-DEMO'}</div>
            </div>
          </div>
        </div>
      </aside>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button className="search-trigger" id="global-search-trigger" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <span style={{ color: 'var(--text-subtle)' }}>Buscar no Genesis (Ctrl+K)</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="btn btn-ghost">PT</button>
              <button className="btn btn-ghost">Tema</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600 }}>{tenant?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-subtle)' }}>{tenant?.plan}</div>
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: 18, background: 'var(--bg-page)', minHeight: 'calc(100vh - 64px)' }}>
          <div className="page-header" style={{ marginBottom: 18 }}>
            <h1 style={{ margin: 0 }}>{title}</h1>
          </div>

          <div className="page-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
