import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.filter(p => p.is_active !== false));
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Produtos</h2>
      {loading ? <div>Carregando produtos...</div> : (
        <div className="rounded-xl border bg-white p-4">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-slate-700">
                <th className="p-2">Nome</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Preço</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">{p.category}</td>
                  <td className="p-2">{p.stock_qty || p.stock || 0}</td>
                  <td className="p-2">MZN {(Number(p.sell_price || 0)/100).toFixed(2)}</td>
                  <td className="p-2">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
