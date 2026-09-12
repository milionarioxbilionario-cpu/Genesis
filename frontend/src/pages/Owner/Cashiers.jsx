import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Cashiers() {
  const [cashiers, setCashiers] = useState([]);
  useEffect(() => { load(); }, []);
  async function load() {
    try { const res = await api.get('/api/owner/cashiers'); setCashiers(res.data || []); } catch (e) { console.error(e); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Caixistas</h2>
      <div className="rounded-xl border bg-white p-4">
        {cashiers.length === 0 ? <div>Sem caixistas</div> : (
          <table className="min-w-full text-sm">
            <thead><tr className="bg-slate-100"><th className="p-2">Nome</th><th className="p-2">Email</th><th className="p-2">Ativo</th></tr></thead>
            <tbody>
              {cashiers.map(c => (<tr key={c.id}><td className="p-2">{c.name}</td><td className="p-2">{c.email}</td><td className="p-2">{c.is_active ? 'Sim' : 'Não'}</td></tr>))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
