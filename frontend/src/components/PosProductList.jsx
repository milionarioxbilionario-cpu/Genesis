import React from 'react';

export default function PosProductList({ products = [], onAdd, onDemand, onShrink }) {
  if (!products || products.length === 0) return <div className="p-4">Nenhum produto encontrado.</div>;

  return (
    <div className="grid grid-cols-3 gap-3 h-[70vh] overflow-auto">
      {products.map((p) => (
        <div key={p.id} className="border rounded p-2 bg-white flex flex-col justify-between">
          <div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-500">{p.category || 'Geral'}</div>
            <div className="mt-2">{((Number(p.sell_price) || 0) / 100).toFixed(2)} MZN</div>
            <div className="text-xs text-gray-400">Stock: {Number(p.stock_qty ?? 0)}</div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => onAdd(p)} className="flex-1 bg-blue-600 text-white py-1 rounded">Adicionar</button>
            <button type="button" onClick={() => window.open(`/product/${p.id}`, '_blank')} className="px-2 py-1 border rounded">Ver</button>
          </div>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => typeof onDemand === 'function' ? onDemand(p) : null} className="flex-1 bg-yellow-500 text-white py-1 rounded">Pedido</button>
            <button type="button" onClick={() => typeof onShrink === 'function' ? onShrink(p) : null} className="px-2 py-1 border rounded">Perda</button>
          </div>
        </div>
      ))}
    </div>
  );
}
