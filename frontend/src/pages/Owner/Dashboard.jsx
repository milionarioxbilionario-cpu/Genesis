import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../utils/api';

const formatMoney = (value) => `MZN ${(Number(value || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OwnerDashboard() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [summary, setSummary] = useState({
    productsCount: 0,
    stockTotal: 0,
    lowStockCount: 0,
    lowStockProducts: [],
    salesToday: 0,
    salesMonth: 0,
    revenueToday: 0,
    revenueMonth: 0,
    recentSales: []
  });
  const [reports, setReports] = useState({ salesByDay: [], topProducts: [], totalRevenue: 0, totalOrders: 0, averageTicket: 0 });
  const [editingProductId, setEditingProductId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Geral',
    barcode: '',
    sell_price: 0,
    cost_price: 0,
    stock_qty: 0,
    min_stock: 5,
    is_active: true
  });
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    phone: '',
    delivery_cost_per_visit: 0
  });
  const [stockForm, setStockForm] = useState({
    product_id: '',
    quantity: 1,
    unit_cost: 0,
    supplier_id: ''
  });
  const [message, setMessage] = useState('');
  const [cancelPin, setCancelPin] = useState('');
  const [cancelPinConfigured, setCancelPinConfigured] = useState(false);

  const loadProducts = async () => {
    try {
      const res = await api.get('/api/products');
      setProducts(res.data.filter((product) => product.is_active !== false));
    } catch (err) {
      console.error(err);
      setMessage('Erro ao carregar produtos');
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await api.get('/api/inventory/suppliers');
      setSuppliers(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStockEntries = async () => {
    try {
      const res = await api.get('/api/inventory/stock');
      setStockEntries(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSummary = async () => {
    try {
      const res = await api.get('/api/dashboard/summary');
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadReports = async () => {
    try {
      const res = await api.get('/api/dashboard/reports');
      setReports(res.data || { salesByDay: [], topProducts: [], totalRevenue: 0, totalOrders: 0, averageTicket: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  const loadCancelPinStatus = async () => {
    try {
      const res = await api.get('/api/sales/cancel-pin-status');
      setCancelPinConfigured(Boolean(res.data?.configured));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelPinSubmit = async (e) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(cancelPin)) {
      setMessage('O PIN de cancelamento deve ter 4 a 6 dígitos.');
      return;
    }

    try {
      await api.post('/api/sales/cancel-pin', { pin: cancelPin });
      setCancelPin('');
      setCancelPinConfigured(true);
      setMessage('PIN de cancelamento guardado com sucesso.');
    } catch (err) {
      console.error(err);
      setMessage('Não foi possível guardar o PIN de cancelamento.');
    }
  };

  const resetSupplierForm = () => {
    setSupplierForm({ name: '', phone: '', delivery_cost_per_visit: 0 });
  };

  const resetStockForm = () => {
    setStockForm({
      product_id: products[0]?.id || '',
      quantity: 1,
      unit_cost: Number(products[0]?.cost_price || 0),
      supplier_id: ''
    });
  };

  useEffect(() => {
    loadProducts();
    loadSummary();
    loadReports();
    loadSuppliers();
    loadStockEntries();
    loadCancelPinStatus();
  }, []);

  useEffect(() => {
    if (products.length > 0 && !stockForm.product_id) {
      setStockForm((prev) => ({
        ...prev,
        product_id: products[0].id,
        unit_cost: Number(products[0].cost_price || 0)
      }));
    }
  }, [products, stockForm.product_id]);

  const resetForm = () => {
    setEditingProductId(null);
    setForm({
      name: '',
      category: 'Geral',
      barcode: '',
      sell_price: 0,
      cost_price: 0,
      stock_qty: 0,
      min_stock: 5,
      is_active: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sell_price: Number(form.sell_price),
        cost_price: Number(form.cost_price),
        stock_qty: Number(form.stock_qty),
        min_stock: Number(form.min_stock),
        is_active: form.is_active !== false
      };

      if (editingProductId) {
        await api.patch(`/api/products/${editingProductId}`, payload);
        setMessage('Produto atualizado com sucesso');
      } else {
        await api.post('/api/products', payload);
        setMessage('Produto criado com sucesso');
      }

      resetForm();
      await Promise.all([loadProducts(), loadSummary(), loadReports()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao guardar produto');
    }
  };

  const handleEdit = (product) => {
    setEditingProductId(product.id);
    setForm({
      name: product.name,
      category: product.category || 'Geral',
      barcode: product.barcode || '',
      sell_price: Number(product.sell_price || 0),
      cost_price: Number(product.cost_price || 0),
      stock_qty: Number(product.stock_qty || 0),
      min_stock: Number(product.min_stock || 5),
      is_active: product.is_active !== false
    });
  };

  const handleDelete = async (productId) => {
    try {
      await api.delete(`/api/products/${productId}`);
      setMessage('Produto removido com sucesso');
      await Promise.all([loadProducts(), loadSummary(), loadReports(), loadStockEntries()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao remover produto');
    }
  };

  const handleSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/suppliers', {
        ...supplierForm,
        delivery_cost_per_visit: Number(supplierForm.delivery_cost_per_visit || 0)
      });
      setMessage('Fornecedor registado com sucesso');
      resetSupplierForm();
      await loadSuppliers();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao guardar fornecedor');
    }
  };

  const handleStockEntrySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/inventory/stock', {
        product_id: stockForm.product_id,
        quantity: Number(stockForm.quantity || 0),
        unit_cost: Number(stockForm.unit_cost || 0),
        supplier_id: stockForm.supplier_id || null
      });
      setMessage('Entrada de stock registada com sucesso');
      resetStockForm();
      await Promise.all([loadProducts(), loadSummary(), loadReports(), loadStockEntries()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao registar entrada de stock');
    }
  };

  const adjustStock = async (productId, delta) => {
    try {
      await api.patch(`/api/products/${productId}/stock`, { delta, reason: 'manual_adjustment' });
      setMessage('Stock atualizado com sucesso');
      await Promise.all([loadProducts(), loadSummary(), loadReports(), loadStockEntries()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao ajustar stock');
    }
  };

  const metrics = useMemo(() => ({
    total: summary.productsCount || products.length,
    stock: summary.stockTotal || products.reduce((sum, p) => sum + Number(p.stock_qty || 0), 0),
    totalValue: products.reduce((sum, p) => sum + (Number(p.cost_price || 0) * Number(p.stock_qty || 0)), 0),
    lowStock: summary.lowStockCount || products.filter((p) => Number(p.stock_qty || 0) <= Number(p.min_stock || 0)).length,
    lowStockProducts: summary.lowStockProducts || products.filter((p) => Number(p.stock_qty || 0) <= Number(p.min_stock || 0)),
    salesToday: summary.salesToday || 0,
    salesMonth: summary.salesMonth || 0,
    revenueToday: summary.revenueToday || 0,
    revenueMonth: summary.revenueMonth || 0,
    recentSales: summary.recentSales || []
  }), [products, summary]);

  const exportCsv = () => {
    const rows = [
      ['Data', 'Pagamento', 'Total', 'Itens'],
      ...(metrics.recentSales || []).map((sale) => [
        new Date(sale.created_at).toLocaleString('pt-MZ'),
        sale.payment_method,
        Number(sale.total_amount || 0),
        Number(sale.itemCount || 0)
      ])
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'genesis-relatorio-vendas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Genesis</p>
            <h1 className="text-3xl font-black text-slate-900">Dashboard do negócio</h1>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Exportar CSV
          </button>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Produtos', value: metrics.total },
            { label: 'Stock total', value: metrics.stock },
            { label: 'Valor em stock', value: formatMoney(metrics.totalValue) },
            { label: 'Baixo stock', value: metrics.lowStock, accent: 'text-amber-600' }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className={`mt-2 text-2xl font-black ${item.accent || 'text-slate-900'}`}>{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[{ label: 'Vendas hoje', value: metrics.salesToday }, { label: 'Vendas mês', value: metrics.salesMonth }, { label: 'Receita hoje', value: formatMoney(metrics.revenueToday) }, { label: 'Receita mês', value: formatMoney(metrics.revenueMonth) }].map((item) => (
            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-2 text-2xl font-black text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>

        {metrics.lowStockProducts.length > 0 && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="mb-2 font-semibold">Alertas de stock mínimo</div>
            <ul className="ml-5 list-disc space-y-1">
              {metrics.lowStockProducts.map((product) => (
                <li key={product.id}>{product.name}: stock {product.stock_qty} / mínimo {product.min_stock}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Vendas por dia</h2>
              <span className="text-sm text-slate-500">Últimos 7 dias</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reports.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip formatter={(value) => formatMoney(value)} />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Produtos mais vendidos</h2>
              <span className="text-sm text-slate-500">{reports.totalOrders} vendas</span>
            </div>
            <div className="space-y-3">
              {(reports.topProducts || []).map((product) => (
                <div key={product.name} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                  <div>
                    <div className="font-medium text-slate-800">{product.name}</div>
                    <div className="text-xs text-slate-500">{product.qty} itens</div>
                  </div>
                  <div className="font-bold text-slate-900">{formatMoney(product.revenue)}</div>
                </div>
              ))}
              {(!reports.topProducts || reports.topProducts.length === 0) && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Sem dados suficientes para mostrar ranking.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">PIN de cancelamento</h2>
            <p className="mt-2 text-sm text-slate-600">
              {cancelPinConfigured ? 'PIN configurado e ativo.' : 'Ainda não foi definido um PIN para cancelar vendas.'}
            </p>
            <form onSubmit={handleCancelPinSubmit} className="mt-4 space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 focus:border-sky-500 focus:outline-none"
                placeholder="Digite 4 a 6 dígitos"
                value={cancelPin}
                onChange={(e) => setCancelPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button type="submit" className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white transition hover:bg-slate-800">
                Guardar PIN
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900">Resumo financeiro</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Receita total (7 dias)</span>
                <span className="font-bold text-slate-900">{formatMoney(reports.totalRevenue)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Ticket médio</span>
                <span className="font-bold text-slate-900">{formatMoney(reports.averageTicket)}</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-slate-600">Ordens</span>
                <span className="font-bold text-slate-900">{reports.totalOrders}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-4">{editingProductId ? 'Editar produto' : 'Adicionar produto'}</h2>
            {message && <div className="mb-4 rounded-xl bg-amber-100 p-2 text-sm text-amber-900">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 focus:border-sky-500 focus:outline-none" placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 focus:border-sky-500 focus:outline-none" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 focus:border-sky-500 focus:outline-none" placeholder="Código de barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Preço venda" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
                <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Custo" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Stock" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
                <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Stock mínimo" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700">{editingProductId ? 'Guardar alterações' : 'Guardar produto'}</button>
                {editingProductId && (
                  <button type="button" onClick={resetForm} className="rounded-xl bg-slate-200 px-4 py-2.5 font-medium text-slate-700">Cancelar</button>
                )}
              </div>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Produto em stock</h2>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">Stock</th>
                    <th className="p-2 text-left">Preço</th>
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-slate-100 align-top">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.stock_qty}</td>
                      <td className="p-2">{formatMoney(product.sell_price)}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => handleEdit(product)} className="text-blue-600">Editar</button>
                          <button type="button" onClick={() => adjustStock(product.id, 1)} className="text-green-600">+1</button>
                          <button type="button" onClick={() => adjustStock(product.id, -1)} className="text-amber-600">-1</button>
                          <button type="button" onClick={() => handleDelete(product.id)} className="text-red-600">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Registar entrada de stock</h2>
            <form onSubmit={handleStockEntrySubmit} className="space-y-3">
              <select className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" value={stockForm.product_id} onChange={(e) => setStockForm({ ...stockForm, product_id: e.target.value })}>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="1" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Quantidade" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
                <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Custo unitário" value={stockForm.unit_cost} onChange={(e) => setStockForm({ ...stockForm, unit_cost: e.target.value })} />
              </div>
              <select className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" value={stockForm.supplier_id} onChange={(e) => setStockForm({ ...stockForm, supplier_id: e.target.value })}>
                <option value="">Fornecedor (opcional)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              <button type="submit" className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700">Registar entrada</button>
            </form>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Últimas vendas</h2>
            <div className="space-y-3">
              {(metrics.recentSales || []).map((sale) => (
                <div key={sale.id} className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-800">{new Date(sale.created_at).toLocaleString('pt-MZ')}</span>
                    <span className="text-sm text-slate-500">{sale.payment_method}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{sale.itemCount || 0} itens</span>
                    <span className="font-bold text-slate-900">{formatMoney(sale.total_amount)}</span>
                  </div>
                </div>
              ))}
              {(!metrics.recentSales || metrics.recentSales.length === 0) && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Sem vendas registadas ainda.</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-bold mb-4">Registar fornecedor</h2>
          <form onSubmit={handleSupplierSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <input className="rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Nome" value={supplierForm.name} onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })} required />
            <input className="rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Telefone" value={supplierForm.phone} onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
            <div className="flex gap-2">
              <input type="number" min="0" className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3" placeholder="Custo visita" value={supplierForm.delivery_cost_per_visit} onChange={(e) => setSupplierForm({ ...supplierForm, delivery_cost_per_visit: e.target.value })} />
              <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2.5 font-semibold text-white">Guardar</button>
            </div>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-3">
            <h2 className="text-xl font-bold mb-3">Histórico de stock</h2>
            <div className="max-h-72 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="p-2 text-left">Produto</th>
                    <th className="p-2 text-left">Qtd</th>
                    <th className="p-2 text-left">Custo</th>
                    <th className="p-2 text-left">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {stockEntries.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100">
                      <td className="p-2">{entry.product?.name || 'Produto'}</td>
                      <td className="p-2">{entry.quantity}</td>
                      <td className="p-2">{formatMoney(entry.unit_cost)}</td>
                      <td className="p-2">{new Date(entry.created_at).toLocaleString('pt-MZ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
