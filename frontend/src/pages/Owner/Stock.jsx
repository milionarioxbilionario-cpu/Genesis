import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Stock() {
  const [stock, setStock] = useState([]);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get('/api/inventory/stock');
      setStock(res.data || []);
    } catch (e) { console.error(e); }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Stock & Entradas</h2>
      <div className="rounded-xl border bg-white p-4">
        {stock.length === 0 ? <div>Nenhuma entrada de stock registada</div> : (
          <table className="min-w-full text-sm">
            <thead><tr className="bg-slate-100"><th className="p-2">Produto</th><th className="p-2">Quantidade</th><th className="p-2">Custo</th><th className="p-2">Data</th></tr></thead>
            <tbody>
              {stock.map(s => (
                <tr key={s.id} className="border-t"><td className="p-2">{s.product_name || s.product?.name}</td><td className="p-2">{s.quantity}</td><td className="p-2">MZN {(Number(s.unit_cost||0)/100).toFixed(2)}</td><td className="p-2">{new Date(s.created_at).toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
