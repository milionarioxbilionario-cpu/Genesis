import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() {
    try {
      const res = await api.get('/api/inventory/suppliers');
      setSuppliers(res.data || []);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Fornecedores</h2>
      <div className="rounded-xl border bg-white p-4">
        {suppliers.length === 0 ? <div>Sem fornecedores</div> : (
          <table className="min-w-full text-sm">
            <thead><tr className="bg-slate-100"><th className="p-2">Nome</th><th className="p-2">Telefone</th><th className="p-2">Entregas</th></tr></thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} className="border-t"><td className="p-2">{s.name}</td><td className="p-2">{s.phone}</td><td className="p-2">{s.delivery_cost_per_visit ? 'Sim' : 'Não'}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
