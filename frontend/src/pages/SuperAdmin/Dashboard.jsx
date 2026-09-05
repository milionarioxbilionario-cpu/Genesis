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
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Genesis</p>
            <h1 className="text-3xl font-black text-slate-900">Super Admin</h1>
          </div>
          <button
            type="button"
            onClick={() => window.location.href = '/login'}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Sair
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Lojas ativas', value: metrics.activeStores },
            { label: 'Tenants totais', value: metrics.totalTenants },
            { label: 'Pedidos pendentes', value: metrics.pendingRequests },
            { label: 'Suspensas', value: metrics.suspended }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-2 text-3xl font-black text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>

        <section className="mb-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Pedidos pendentes</h2>
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{requests.length} em fila</span>
          </div>

          {loading ? (
            <p className="text-slate-600">Carregando...</p>
          ) : requests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">Nenhum pedido pendente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-600">
                    <th className="p-3">Loja</th>
                    <th className="p-3">Dono</th>
                    <th className="p-3">Contacto</th>
                    <th className="p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr key={req.id} className="border-b border-slate-200 align-top">
                      <td className="p-3 font-semibold text-slate-800">{req.name}</td>
                      <td className="p-3 text-slate-700">{req.owner_name}</td>
                      <td className="p-3 text-slate-700">{req.phone}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => approve(req.id)} className="rounded-xl bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-500">Aprovar</button>
                          <button onClick={() => reject(req.id)} className="rounded-xl bg-red-600 px-3 py-2 text-white hover:bg-red-500">Rejeitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Clientes / tenants</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="p-3">Loja</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id} className="border-b border-slate-200">
                    <td className="p-3 font-semibold text-slate-800">{tenant.name}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${tenant.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{tenant.business_type}</td>
                    <td className="p-3 text-slate-700">{tenant.phone}</td>
                    <td className="p-3">
                      {tenant.status !== 'suspended' && (
                        <button onClick={() => suspend(tenant.id)} className="rounded-xl bg-yellow-500 px-3 py-2 text-white hover:bg-yellow-400">Suspender</button>
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
