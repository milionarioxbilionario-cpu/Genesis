import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-MZ');
};

export default function AuditLogViewer() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/owner/audit');
        setLogs(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Auditoria</h2>
      </div>

      <div className="rounded-xl border bg-white p-4">
        {loading ? (
          <div>Carregando histórico...</div>
        ) : logs.length === 0 ? (
          <div className="text-slate-500">Sem eventos registados.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="p-2">Ação</th>
                  <th className="p-2">Entidade</th>
                  <th className="p-2">Utilizador</th>
                  <th className="p-2">Data</th>
                  <th className="p-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 align-top">
                    <td className="p-2 font-medium text-slate-800">{log.action}</td>
                    <td className="p-2 text-slate-600">{log.entity_type} / {log.entity_id || '—'}</td>
                    <td className="p-2 text-slate-600">{log.user_name}</td>
                    <td className="p-2 text-slate-600">{formatDate(log.created_at)}</td>
                    <td className="p-2 text-slate-600">{log.ip_address || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
