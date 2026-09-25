import { useState, useEffect } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:4000', withCredentials: true });

function AdminLogin() {
  const [email, setEmail] = useState('admin@genesis.co.mz');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.user.role !== 'super_admin') {
        throw new Error('Conta sem permissão de super admin');
      }
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Erro ao iniciar sessão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="card login-card">
        <h1 style={{ margin: 0, fontSize: '2rem' }}>Genesis Admin</h1>
        <p style={{ marginTop: '8px', color: '#475569' }}>Acesso restrito para gestão da plataforma</p>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Senha</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p style={{ color: '#dc2626', marginTop: '16px' }}>{error}</p>}
          <div className="field">
            <button disabled={loading} className="btn btn-primary" type="submit">{loading ? 'Entrando...' : 'Entrar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [tenants, setTenants] = useState([]);
  const [requests, setRequests] = useState([]);
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [reqRes, tenantRes] = await Promise.all([
        api.get('/api/admin/requests'),
        api.get('/api/admin/tenants')
      ]);
      setRequests(reqRes.data || []);
      setTenants(tenantRes.data || []);
    } catch (err) {
      console.error(err);
      setMessage('Não foi possível carregar o painel do Super Admin. Verifique a sessão.');
    }
  };

  useEffect(() => { load(); }, []);

  const approve = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/requests/${tenantId}/approve`);
      setMessage(res.data.message || 'Tenant aprovado com sucesso.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao aprovar tenant.');
    }
  };

  const reject = async (tenantId) => {
    const reason = window.prompt('Qual o motivo da rejeição?', 'Dados incompletos');
    if (!reason) return;
    try {
      const res = await api.post(`/api/admin/requests/${tenantId}/reject`, { reason });
      setMessage(res.data.message || 'Pedido rejeitado com sucesso.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao rejeitar pedido.');
    }
  };

  const suspend = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/suspend`);
      setMessage(res.data.message || 'Tenant suspenso.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao suspender tenant.');
    }
  };

  const unsuspend = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/unsuspend`);
      setMessage(res.data.message || 'Tenant reativado.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao reativar tenant.');
    }
  };

  const block = async (tenantId) => {
    const reason = window.prompt('Qual o motivo do bloqueio?', 'Pagamento em falta / incumprimento');
    if (!reason) return;
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/block`, { reason });
      setMessage(res.data.message || 'Tenant bloqueado.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao bloquear tenant.');
    }
  };

  const unblock = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/unblock`);
      setMessage(res.data.message || 'Tenant desbloqueado.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao desbloquear tenant.');
    }
  };

  const restore = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/restore`);
      setMessage(res.data.message || 'Tenant recuperado.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao recuperar tenant.');
    }
  };

  const removeTenant = async (tenantId) => {
    const confirmed = window.confirm('Eliminar este tenant permanentemente? Esta ação marca o tenant como eliminado e desativa o acesso do owner.');
    if (!confirmed) return;
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/delete`);
      setMessage(res.data.message || 'Tenant eliminado.');
      await load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao eliminar tenant.');
    }
  };

  const impersonateOwner = async (tenantId) => {
    try {
      const res = await api.post(`/api/admin/tenants/${tenantId}/impersonate`);
      const targetUrl = res.data.redirectUrl || 'http://localhost:5173/owner';
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      setMessage(res.data.message || 'Sessão do owner carregada.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao abrir a conta do owner.');
    }
  };

  const statusOrder = ['pending', 'trial', 'active', 'suspended', 'blocked', 'rejected', 'deleted'];
  const statusClean = { pending: 'Pendente', trial: 'Trial', active: 'Ativo', suspended: 'Suspenso', blocked: 'Bloqueado', rejected: 'Rejeitado', deleted: 'Eliminado' };
  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = tenants.filter((tenant) => tenant.status === status);
    return acc;
  }, {});

  const metrics = {
    totalTenants: tenants.length,
    pendingRequests: requests.length,
    activeStores: tenants.filter((tenant) => ['trial', 'active'].includes(tenant.status)).length,
    suspended: tenants.filter((tenant) => tenant.status === 'suspended').length,
    blocked: tenants.filter((tenant) => tenant.status === 'blocked').length,
  };

  const renderTenantRow = (tenant) => (
    <tr key={tenant.id}>
      <td>{tenant.name}</td>
      <td><span className="badge">{statusClean[tenant.status] || tenant.status}</span></td>
      <td>{tenant.owner_name || '—'}</td>
      <td>{tenant.business_type || '—'}</td>
      <td>{tenant.phone || '—'}</td>
      <td>{tenant.email || '—'}</td>
      <td>{tenant.created_at ? new Date(tenant.created_at).toLocaleDateString('pt-MZ') : '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tenant.status === 'pending' && (
            <>
              <button className="btn btn-primary" onClick={() => approve(tenant.id)}>Aprovar</button>
              <button className="btn btn-secondary" onClick={() => reject(tenant.id)}>Rejeitar</button>
            </>
          )}
          {['trial', 'active'].includes(tenant.status) && (
            <>
              <button className="btn btn-secondary" onClick={() => suspend(tenant.id)}>Suspender</button>
              <button className="btn btn-secondary" onClick={() => block(tenant.id)}>Bloquear</button>
            </>
          )}
          {tenant.status === 'suspended' && (
            <>
              <button className="btn btn-primary" onClick={() => unsuspend(tenant.id)}>Reativar</button>
              <button className="btn btn-secondary" onClick={() => block(tenant.id)}>Bloquear</button>
            </>
          )}
          {tenant.status === 'blocked' && (
            <>
              <button className="btn btn-primary" onClick={() => unblock(tenant.id)}>Desbloquear</button>
              <button className="btn btn-secondary" onClick={() => restore(tenant.id)}>Recuperar</button>
            </>
          )}
          {['rejected', 'deleted'].includes(tenant.status) && (
            <button className="btn btn-primary" onClick={() => restore(tenant.id)}>Recuperar</button>
          )}
          {tenant.status !== 'deleted' && (
            <button className="btn btn-secondary" onClick={() => removeTenant(tenant.id)}>Eliminar</button>
          )}
          {['trial', 'active', 'suspended', 'blocked'].includes(tenant.status) && (
            <button className="btn btn-primary" onClick={() => impersonateOwner(tenant.id)}>Abrir owner</button>
          )}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="page">
      <div className="shell">
        <div className="topbar">
          <div>
            <h1 style={{ margin: 0 }}>Dashboard do Super Admin</h1>
            <p style={{ margin: '6px 0 0', color: '#475569' }}>Overview da plataforma Genesis</p>
          </div>
          <button className="btn btn-secondary" onClick={() => window.location.href = 'http://localhost:5173/login'}>Voltar para login principal</button>
        </div>

        <div className="nav">
          <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>Geral</NavLink>
        </div>

        {message && <div style={{ margin: '16px 0', padding: '10px 14px', borderRadius: 12, background: '#fef3c7', color: '#92400e' }}>{message}</div>}

        <div className="grid">
          <div className="card stat"><strong>{metrics.activeStores}</strong><div>lojas ativas</div></div>
          <div className="card stat"><strong>{metrics.totalTenants}</strong><div>tenants totais</div></div>
          <div className="card stat"><strong>{metrics.pendingRequests}</strong><div>pedidos pendentes</div></div>
          <div className="card stat"><strong>{metrics.suspended}</strong><div>suspensos</div></div>
          <div className="card stat"><strong>{metrics.blocked}</strong><div>bloqueados</div></div>
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
          <h2>Pedidos pendentes</h2>
          <table>
            <thead><tr><th>Loja</th><th>Status</th><th>Owner</th><th>Contacto</th><th>Ações</th></tr></thead>
            <tbody>
              {requests.length ? requests.map((tenant) => (
                <tr key={tenant.id}>
                  <td>{tenant.name}</td>
                  <td><span className="badge">{statusClean[tenant.status] || tenant.status}</span></td>
                  <td>{tenant.owner_name}</td>
                  <td>{tenant.phone}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary" onClick={() => approve(tenant.id)}>Aprovar</button>
                      <button className="btn btn-secondary" onClick={() => reject(tenant.id)}>Rejeitar</button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan={5}>Nenhum pedido pendente</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ marginTop: '24px', padding: '20px' }}>
          <h2>Todos os tenants</h2>
          {statusOrder.map((status) => {
            const list = grouped[status] || [];
            if (!list.length) return null;
            return (
              <div key={status} style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 18, marginBottom: 12 }}>{statusClean[status] || status} ({list.length})</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Loja</th>
                        <th>Status</th>
                        <th>Owner</th>
                        <th>Tipo</th>
                        <th>Contacto</th>
                        <th>Email</th>
                        <th>Criação</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>{list.map(renderTenantRow)}</tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RequireSuperAdmin() {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        setAllowed(res.data?.user?.role === 'super_admin');
      })
      .catch(() => setAllowed(false))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) return <div className="page"><div className="shell">Validando sessão...</div></div>;
  if (!allowed) return <Navigate to="/login" replace />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/" element={<RequireSuperAdmin />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
