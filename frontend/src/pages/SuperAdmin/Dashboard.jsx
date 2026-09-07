import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';

const SuperAdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsRes, tenantsRes] = await Promise.all([
        api.get('/api/admin/requests'),
        api.get('/api/admin/tenants')
      ]);
      setRequests(requestsRes.data);
      setTenants(tenantsRes.data);
    } catch (err) {
      console.error('Erro ao buscar dados do admin', err);
      setMessage('Não foi possível carregar o painel do Super Admin. Verifique a sessão.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approve = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/requests/${tenantId}/approve`);
      setMessage(res.data.message || 'Conta aprovada');
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao aprovar');
    }
  };

  const reject = async (tenantId) => {
    const reason = window.prompt('Motivo da rejeição:', 'Dados incompletos');
    if (!reason) return;
    try {
      const res = await api.post(`/api/admin/requests/${tenantId}/reject`, { reason });
      setMessage(res.data.message || 'Pedido rejeitado');
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao rejeitar');
    }
  };

  const suspend = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/suspend`);
      setMessage(res.data.message || 'Tenant suspenso');
      await loadData();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao suspender');
    }
  };

  const metrics = useMemo(() => ({
    totalTenants: tenants.length,
    pendingRequests: requests.length,
    activeStores: tenants.filter((tenant) => tenant.status === 'trial' || tenant.status === 'active').length,
    suspended: tenants.filter((tenant) => tenant.status === 'suspended').length
  }), [requests, tenants]);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ color: 'var(--text-main)' }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.22em', color: 'var(--text-subtle)' }}>Genesis</p>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>Super Admin</h1>
          </div>
          <button
            type="button"
            onClick={() => window.location.href = '/login'}
            style={{ borderRadius: 12, background: 'rgba(17,28,43,0.6)', padding: '8px 14px', color: 'var(--text-main)', fontWeight: 700 }}
          >
            Sair
          </button>
        </div>

        {message && (
          <div style={{ marginBottom: 18, borderRadius: 18, border: '1px solid var(--accent-amber-light)', background: 'rgba(245,158,11,0.08)', padding: '10px 14px', color: 'var(--accent-amber)' }}>
            {message}
          </div>
        )}

        <div style={{ marginBottom: 20, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))' }}>
          {[
            { label: 'Lojas ativas', value: metrics.activeStores },
            { label: 'Tenants totais', value: metrics.totalTenants },
            { label: 'Pedidos pendentes', value: metrics.pendingRequests },
            { label: 'Suspensas', value: metrics.suspended }
          ].map((item) => (
            <div key={item.label} style={{ borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)', padding: 16 }}>
              <div style={{ color: 'var(--text-subtle)', fontSize: 13 }}>{item.label}</div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: 'var(--text-main)' }}>{item.value}</div>
            </div>
          ))}
        </div>

        <section style={{ marginBottom: 24, borderRadius: 24, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Pedidos pendentes</h2>
            <span style={{ borderRadius: 999, background: 'rgba(99,102,241,0.08)', padding: '6px 10px', color: 'var(--text-subtle)', fontSize: 12 }}>{requests.length} em fila</span>
          </div>

          {loading ? (
            <p style={{ color: 'var(--text-subtle)' }}>Carregando...</p>
          ) : requests.length === 0 ? (
            <div style={{ borderRadius: 18, border: '1px dashed var(--border-subtle)', background: 'rgba(255,255,255,0.02)', padding: 20, color: 'var(--text-subtle)' }}>Nenhum pedido pendente.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ minWidth: '100%', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                    <th style={{ padding: 12 }}>Loja</th>
                    <th style={{ padding: 12 }}>Dono</th>
                    <th style={{ padding: 12 }}>Contacto</th>
                    <th style={{ padding: 12 }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: 12, fontWeight: 700, color: 'var(--text-main)' }}>{req.name}</td>
                      <td style={{ padding: 12, color: 'var(--text-subtle)' }}>{req.owner_name}</td>
                      <td style={{ padding: 12, color: 'var(--text-subtle)' }}>{req.phone}</td>
                      <td style={{ padding: 12 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => approve(req.id)} style={{ borderRadius: 12, background: 'var(--accent-emerald)', padding: '8px 12px', color: '#fff' }}>Aprovar</button>
                          <button onClick={() => reject(req.id)} style={{ borderRadius: 12, background: 'var(--accent-rose)', padding: '8px 12px', color: '#fff' }}>Rejeitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section style={{ borderRadius: 24, border: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', padding: 20 }}>
          <h2 style={{ marginBottom: 12, fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }}>Clientes / tenants</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '100%', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-subtle)' }}>
                  <th style={{ padding: 12 }}>Loja</th>
                  <th style={{ padding: 12 }}>Estado</th>
                  <th style={{ padding: 12 }}>Tipo</th>
                  <th style={{ padding: 12 }}>Contacto</th>
                  <th style={{ padding: 12 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: 12, fontWeight: 700, color: 'var(--text-main)' }}>{tenant.name}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ borderRadius: 999, padding: '4px 8px', background: tenant.status === 'suspended' ? 'rgba(244,63,94,0.08)' : 'rgba(16,185,129,0.08)', color: tenant.status === 'suspended' ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                        {tenant.status}
                      </span>
                    </td>
                    <td style={{ padding: 12, color: 'var(--text-subtle)' }}>{tenant.business_type}</td>
                    <td style={{ padding: 12, color: 'var(--text-subtle)' }}>{tenant.phone}</td>
                    <td style={{ padding: 12 }}>
                      {tenant.status !== 'suspended' && (
                        <button onClick={() => suspend(tenant.id)} style={{ borderRadius: 12, background: 'rgba(245,158,11,0.9)', padding: '8px 12px', color: '#111' }}>Suspender</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
