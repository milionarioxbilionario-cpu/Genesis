import React, { useState } from 'react';

export default function PosCart({ cart = [], onUpdateQty, onRemove, onCheckout, formatMoney }) {
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const total = cart.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  function handleCheckout() {
    const cents = amountReceived ? Math.round(parseFloat(amountReceived) * 100) : null;
    onCheckout({ amountReceived: cents, paymentMethod });
  }

  return (
    <div className="bg-gray-50 p-3 rounded shadow h-[70vh] flex flex-col">
      <h2 className="font-bold mb-2">Carrinho</h2>
      <div className="flex-1 overflow-auto">
        {cart.length === 0 && <div className="text-gray-500">Carrinho vazio</div>}
        {cart.map((it) => (
          <div key={it.id} className="flex items-center justify-between border-b py-2">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-gray-500">{(it.unit_price/100).toFixed(2)} MZN</div>
            </div>
            <div className="flex items-center gap-2">
              <input type="number" className="w-16 p-1 border rounded" value={it.quantity} min={1} onChange={(e) => onUpdateQty(it.id, Number(e.target.value || 0))} />
              <div className="w-20 text-right">{formatMoney(it.unit_price * it.quantity)}</div>
              <button onClick={() => onRemove(it.id)} className="text-red-600">X</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3">
        <div className="flex justify-between text-lg font-semibold">
          <div>Total:</div>
          <div>{formatMoney(total)}</div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="p-2 border rounded">
            <option value="cash">Dinheiro</option>
            <option value="mpesa">M-Pesa</option>
            <option value="emola">E-Mola</option>
            <option value="pos_bank">POS Banco</option>
          </select>
          <input placeholder="Valor recebido (MZN)" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} className="p-2 border rounded" />
        </div>

        <div className="mt-3 flex gap-2">
          <button onClick={handleCheckout} className="flex-1 bg-green-600 text-white py-2 rounded">Finalizar Venda</button>
          <button onClick={() => window.print()} className="px-3 py-2 border rounded">Imprimir</button>
        </div>
      </div>
    </div>
  );
}
