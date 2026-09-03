import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import db from '../db/localDb';
import { printReceipt } from '../utils/receiptPrinter';

const money = (cents) => {
  const value = Number(cents || 0) / 100;
  return `MZN ${value.toFixed(2).replace('.', ',')}`;
};

const currencyNumber = (cents) => Number(cents || 0) / 100;

export default function CashierDashboard() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [message, setMessage] = useState('');
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingOpen, setClosingOpen] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('0');
  const [cancelPinConfigured, setCancelPinConfigured] = useState(false);

  const handleUnauthorized = (err) => {
    if (err?.response?.status === 401) {
      window.location.href = '/login';
      return true;
    }
    return false;
  };

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.filter((p) => p.is_active !== false));
    } catch (err) {
      console.error(err);
      if (!handleUnauthorized(err)) {
        setMessage('Não foi possível carregar os produtos.');
      }
    }
  };

  const loadRecentSales = async () => {
    try {
      const res = await api.get('/api/sales');
      setRecentSales(res.data || []);
    } catch (err) {
      console.error(err);
      if (!handleUnauthorized(err)) {
        setRecentSales([]);
      }
    }
  };

  const syncPendingSales = async () => {
    try {
      const pendingSales = await db.sales.where('status').equals('pending').toArray();
      for (const queuedSale of pendingSales) {
        await api.post('/api/sales', queuedSale.payload);
        await db.sales.delete(queuedSale.id);
      }
    } catch (err) {
      handleUnauthorized(err);
      console.warn('Offline sync skipped:', err.message || err);
    }
  };

  const loadCancelPinStatus = async () => {
    try {
      const res = await api.get('/api/sales/cancel-pin-status');
      setCancelPinConfigured(Boolean(res.data?.configured));
    } catch (err) {
      console.error('Cancel PIN status query failed', err);
      setCancelPinConfigured(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadRecentSales();
    syncPendingSales();
    loadCancelPinStatus();
  }, []);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock_qty || 0)) }
            : item
        );
      }

      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_sell_price: Number(product.sell_price || 0),
          unit_cost_price: Number(product.cost_price || 0),
          stock_qty: Number(product.stock_qty || 0),
        },
      ];
    });
  };

  const adjustQuantity = (productId, delta) => {
    setCart((current) =>
      current
        .map((item) => {
          if (item.product_id !== productId) return item;
          const nextQty = item.quantity + delta;
          return nextQty > 0 ? { ...item, quantity: nextQty } : null;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  const totals = useMemo(() => {
    const totalAmount = cart.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_sell_price || 0),
      0
    );
    const totalCost = cart.reduce(
      (sum, item) => sum + item.quantity * Number(item.unit_cost_price || 0),
      0
    );
    return { totalAmount, totalCost };
  }, [cart]);

  useEffect(() => {
    setExpectedAmount(String(Math.round(totals.totalAmount || 0)));
  }, [totals.totalAmount]);

  const currentReceived = paymentMethod === 'cash'
    ? Number(amountReceived || totals.totalAmount) || 0
    : totals.totalAmount;

  const changeGiven = Math.max(0, currentReceived - totals.totalAmount);

  const submitSale = async () => {
    if (!cart.length) {
      setMessage('Adicione pelo menos um produto ao carrinho.');
      return;
    }

    const payload = {
      items: cart.map((item) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: Number(item.quantity),
        unit_sell_price: Number(item.unit_sell_price),
        unit_cost_price: Number(item.unit_cost_price),
      })),
      total_amount: Number(totals.totalAmount),
      total_cost: Number(totals.totalCost),
      payment_method: paymentMethod,
      amount_received: Number(currentReceived),
      change_given: Number(changeGiven),
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const res = await api.post('/api/sales', payload);
      const receiptSale = {
        id: res?.data?.id || crypto.randomUUID(),
        total_amount: Number(totals.totalAmount),
        amount_received: Number(currentReceived),
        change_given: Number(changeGiven),
        payment_method: paymentMethod,
        created_at: new Date().toISOString(),
      };
      try {
        await printReceipt({ shopName: 'Genesis', sale: receiptSale, items: cart });
      } catch (printerErr) {
        console.warn('Receipt printing failed', printerErr);
      }
      setMessage('Venda registada com sucesso.');
      setCart([]);
      setAmountReceived('');
      await loadProducts();
      await loadRecentSales();
    } catch (err) {
      const queuedSale = {
        id: crypto.randomUUID(),
        tenant_id: 'offline',
        status: 'pending',
        created_at: new Date().toISOString(),
        sync: false,
        payload,
      };

      await db.sales.put(queuedSale);
      setMessage('Servidor indisponível. Venda guardada localmente e vai sincronizar quando o backend voltar.');
      setCart([]);
      setAmountReceived('');
      await loadRecentSales();
    } finally {
      setLoading(false);
    }
  };

  const closeShift = async () => {
    const payload = {
      counted_amount: Number(countedAmount || 0),
      expected_amount: Number(expectedAmount || 0)
    };

    if (!payload.counted_amount && !payload.expected_amount) {
      setMessage('Insira o valor contado e o valor esperado antes de fechar o turno.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/api/shift_closings', payload);
      setClosingOpen(false);
      setCountedAmount('');
      setExpectedAmount(String(Math.round(totals.totalAmount || 0)));
      setMessage(`Fecho de turno registado com sucesso. Diferença: ${money(res.data.difference || 0)}`);
    } catch (err) {
      console.error(err);
      setMessage('Não foi possível registar o fecho de turno.');
    } finally {
      setLoading(false);
    }
  };

  const cancelSale = async (sale) => {
    if (!cancelPinConfigured) {
      setMessage('O PIN de cancelamento ainda não foi configurado no painel do proprietário.');
      return;
    }

    const pin = window.prompt('Digite o PIN de cancelamento do proprietário:');
    if (!pin || !pin.trim()) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/sales/${sale.id}/cancel`, {
        pin: pin.trim(),
        reason: 'Cancelado no POS'
      });
      setMessage('Venda cancelada com sucesso.');
      await loadRecentSales();
    } catch (err) {
      console.error(err);
      const errorMessage = err?.response?.data?.error || 'Não foi possível cancelar a venda.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">Genesis</p>
            <h1 className="text-3xl font-bold">Ponto de venda</h1>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="bg-slate-800 text-white px-4 py-2 rounded"
          >
            Sair
          </button>
        </div>

        {message && (
          <div className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {message}
          </div>
        )}

        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => setClosingOpen(true)}
            className="rounded bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
          >
            Fechar turno
          </button>
        </div>

        {closingOpen && (
          <div className="mb-4 rounded bg-white p-4 shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Valor contado no caixa</span>
                <input
                  type="number"
                  step="1"
                  value={countedAmount}
                  onChange={(e) => setCountedAmount(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Ex.: 150000"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Valor esperado</span>
                <input
                  type="number"
                  step="1"
                  value={expectedAmount}
                  onChange={(e) => setExpectedAmount(e.target.value)}
                  className="w-full rounded border px-3 py-2"
                  placeholder="Ex.: 150000"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClosingOpen(false)}
                className="rounded border px-4 py-2 text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={closeShift}
                className="rounded bg-slate-900 px-4 py-2 text-white"
              >
                Registar fecho de turno
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white rounded shadow p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="text-left rounded border p-3 hover:border-blue-400 hover:bg-blue-50"
                >
                  <div className="font-semibold">{product.name}</div>
                  <div className="text-sm text-slate-600">{product.category || 'Geral'}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <span>{money(product.sell_price)}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">Stock: {product.stock_qty || 0}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded shadow p-4">
            <h2 className="text-xl font-bold mb-4">Cesto</h2>

            {cart.length === 0 ? (
              <p className="text-slate-500">Nenhum produto adicionado.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product_id} className="border rounded p-3">
                    <div className="flex justify-between items-center gap-3">
                      <div>
                        <div className="font-medium">{item.product_name}</div>
                        <div className="text-sm text-slate-600">{money(item.unit_sell_price)} cada</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-xs text-red-500"
                      >
                        Remover
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border rounded">
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item.product_id, -1)}
                          className="px-2"
                        >
                          −
                        </button>
                        <span className="min-w-[2rem] text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => adjustQuantity(item.product_id, 1)}
                          className="px-2"
                        >
                          +
                        </button>
                      </div>
                      <div className="font-semibold">{money(item.quantity * item.unit_sell_price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6 border-t pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{money(totals.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Custo total</span>
                <span>{money(totals.totalCost)}</span>
              </div>

              <label className="block">
                <span className="text-sm text-slate-700">Método de pagamento</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="mt-1 w-full border rounded p-2"
                >
                  <option value="cash">Dinheiro</option>
                  <option value="card">Cartão</option>
                  <option value="mobile_money">M-Pesa</option>
                </select>
              </label>

              {paymentMethod === 'cash' && (
                <label className="block">
                  <span className="text-sm text-slate-700">Dinheiro recebido</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="mt-1 w-full border rounded p-2"
                  />
                </label>
              )}

              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{money(totals.totalAmount)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Troco</span>
                <span>{money(changeGiven)}</span>
              </div>

              <button
                type="button"
                onClick={submitSale}
                disabled={loading || cart.length === 0}
                className="w-full rounded bg-blue-600 text-white p-3 font-semibold disabled:bg-slate-300"
              >
                {loading ? 'Processando...' : 'Finalizar venda'}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-4">Últimas vendas</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Pagamento</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Itens</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-3 text-slate-500">Sem vendas registadas.</td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="border-t">
                      <td className="p-2">{new Date(sale.created_at).toLocaleString('pt-MZ')}</td>
                      <td className="p-2">{sale.payment_method}</td>
                      <td className="p-2">{money(sale.total_amount)}</td>
                      <td className="p-2">{sale.items?.length || 0}</td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => cancelSale(sale)}
                          disabled={!cancelPinConfigured || loading}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancelPinConfigured ? 'Cancelar' : 'PIN indisponível'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
