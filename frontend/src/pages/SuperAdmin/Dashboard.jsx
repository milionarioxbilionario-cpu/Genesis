import React, { useEffect, useState } from 'react';
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

  return (
    <div className="p-8 bg-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Painel Super Admin</h1>

        {message && (
          <div className="mb-4 rounded bg-amber-100 border border-amber-300 p-3 text-amber-900">
            {message}
          </div>
        )}

        <section className="bg-white rounded shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Pedidos Pendentes</h2>
          {loading ? (
            <p>Carregando...</p>
          ) : requests.length === 0 ? (
            <p>Nenhum pedido pendente.</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="p-3">Loja</th>
                  <th className="p-3">Dono</th>
                  <th className="p-3">Contacto</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b">
                    <td className="p-3">{req.name}</td>
                    <td className="p-3">{req.owner_name}</td>
                    <td className="p-3">{req.phone}</td>
                    <td className="p-3">
                      <button onClick={() => approve(req.id)} className="bg-green-600 text-white px-3 py-1 rounded mr-2">Aprovar</button>
                      <button onClick={() => reject(req.id)} className="bg-red-600 text-white px-3 py-1 rounded">Rejeitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="bg-white rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Tenants</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th className="p-3">Loja</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="border-b">
                  <td className="p-3">{tenant.name}</td>
                  <td className="p-3">{tenant.status}</td>
                  <td className="p-3">{tenant.business_type}</td>
                  <td className="p-3">{tenant.phone}</td>
                  <td className="p-3">
                    {tenant.status !== 'suspended' && (
                      <button onClick={() => suspend(tenant.id)} className="bg-yellow-500 text-white px-3 py-1 rounded">Suspender</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
