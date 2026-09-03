import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import OnboardingWizard from '../OnboardingWizard';

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
      await Promise.all([loadProducts(), loadSummary()]);
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
      await Promise.all([loadProducts(), loadSummary(), loadStockEntries()]);
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
      await Promise.all([loadProducts(), loadSummary(), loadStockEntries()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao registar entrada de stock');
    }
  };

  const adjustStock = async (productId, delta) => {
    try {
      await api.patch(`/api/products/${productId}/stock`, { delta, reason: 'manual_adjustment' });
      setMessage('Stock atualizado com sucesso');
      await Promise.all([loadProducts(), loadSummary(), loadStockEntries()]);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Erro ao ajustar stock');
    }
  };

  const metrics = {
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
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Genesis — Loja</h1>
        <p className="mb-6 text-slate-600">Dashboard do proprietário e gestão de stock.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Produtos</div>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Stock total</div>
            <div className="text-2xl font-bold">{metrics.stock}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Valor em stock</div>
            <div className="text-2xl font-bold">{formatMoney(metrics.totalValue)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Baixo stock</div>
            <div className="text-2xl font-bold text-amber-600">{metrics.lowStock}</div>
          </div>
        </div>

        {metrics.lowStockProducts.length > 0 && (
          <div className="mb-8 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="font-semibold mb-2">Alertas de stock mínimo</div>
            <ul className="list-disc ml-5 space-y-1">
              {metrics.lowStockProducts.map((product) => (
                <li key={product.id}>
                  {product.name}: stock {product.stock_qty} / mínimo {product.min_stock}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Vendas hoje</div>
            <div className="text-2xl font-bold">{metrics.salesToday}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Vendas no mês</div>
            <div className="text-2xl font-bold">{metrics.salesMonth}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Receita hoje</div>
            <div className="text-2xl font-bold">{formatMoney(metrics.revenueToday)}</div>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <div className="text-slate-500">Receita do mês</div>
            <div className="text-2xl font-bold">{formatMoney(metrics.revenueMonth)}</div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">PIN de cancelamento</h2>
            <p className="mb-3 text-sm text-slate-600">
              {cancelPinConfigured ? 'PIN configurado e ativo.' : 'Ainda não foi definido um PIN para cancelar vendas.'}
            </p>
            <form onSubmit={handleCancelPinSubmit} className="space-y-3">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="w-full border p-2 rounded"
                placeholder="Digite 4 a 6 dígitos"
                value={cancelPin}
                onChange={(e) => setCancelPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <button type="submit" className="w-full bg-slate-900 text-white rounded p-2">
                Guardar PIN
              </button>
            </form>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-2">Controlo de caixa</h2>
            <p className="text-sm text-slate-600">
              O proprietário deve definir o PIN para permitir o cancelamento de vendas com validação segura.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">{editingProductId ? 'Editar produto' : 'Adicionar produto'}</h2>
            {message && <div className="mb-4 text-sm rounded bg-amber-100 p-2 text-amber-900">{message}</div>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input className="w-full border p-2 rounded" placeholder="Nome do produto" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <input className="w-full border p-2 rounded" placeholder="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <input className="w-full border p-2 rounded" placeholder="Código de barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Preço venda" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
                <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Custo" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Stock" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
                <input type="number" min="0" className="w-full border p-2 rounded" placeholder="Stock mínimo" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 bg-blue-600 text-white rounded p-2">{editingProductId ? 'Guardar alterações' : 'Guardar produto'}</button>
                {editingProductId && (
                  <button type="button" onClick={resetForm} className="bg-slate-200 rounded p-2">Cancelar</button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-xl font-bold mb-4">Produto em stock</h2>
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Nome</th>
                    <th className="p-2 text-left">Stock</th>
                    <th className="p-2 text-left">Preço</th>
                    <th className="p-2 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b align-top">
                      <td className="p-2">{product.name}</td>
                      <td className="p-2">{product.stock_qty}</td>
                      <td className="p-2">{formatMoney(product.sell_price)}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
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

        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-4">Stock e fornecedores</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-slate-500 mb-2">Indicadores</p>
              <div className="bg-slate-50 rounded p-3 text-sm space-y-1">
                <p>• Produtos abaixo do mínimo: <strong>{metrics.lowStock}</strong></p>
                <p>• Stock total: <strong>{metrics.stock}</strong></p>
                <p>• Custo em stock: <strong>{formatMoney(metrics.totalValue)}</strong></p>
              </div>
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-2">Ações rápidas</p>
              <div className="bg-slate-50 rounded p-3 text-sm space-y-1">
                <p>• Ajustar stock por produto na tabela acima</p>
                <p>• Registrar entradas de compra por fornecedor</p>
                <p>• Monitorizar stock mínimo e custo médio</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <form onSubmit={handleSupplierSubmit} className="space-y-3 border rounded p-4 bg-slate-50">
              <h3 className="text-lg font-semibold">Adicionar fornecedor</h3>
              <input
                className="w-full border p-2 rounded"
                placeholder="Nome do fornecedor"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                required
              />
              <input
                className="w-full border p-2 rounded"
                placeholder="Telefone"
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              />
              <input
                type="number"
                min="0"
                className="w-full border p-2 rounded"
                placeholder="Custo de entrega por visita"
                value={supplierForm.delivery_cost_per_visit}
                onChange={(e) => setSupplierForm({ ...supplierForm, delivery_cost_per_visit: e.target.value })}
              />
              <button type="submit" className="bg-blue-600 text-white rounded p-2 w-full">Guardar fornecedor</button>
            </form>

            <form onSubmit={handleStockEntrySubmit} className="space-y-3 border rounded p-4 bg-slate-50">
              <h3 className="text-lg font-semibold">Registrar entrada de stock</h3>
              <select
                className="w-full border p-2 rounded"
                value={stockForm.product_id}
                onChange={(e) => setStockForm({ ...stockForm, product_id: e.target.value, unit_cost: Number(products.find((product) => product.id === e.target.value)?.cost_price || 0) })}
              >
                <option value="">Selecione um produto</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  className="w-full border p-2 rounded"
                  placeholder="Quantidade"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })}
                />
                <input
                  type="number"
                  min="0"
                  className="w-full border p-2 rounded"
                  placeholder="Custo unitário"
                  value={stockForm.unit_cost}
                  onChange={(e) => setStockForm({ ...stockForm, unit_cost: e.target.value })}
                />
              </div>
              <select
                className="w-full border p-2 rounded"
                value={stockForm.supplier_id}
                onChange={(e) => setStockForm({ ...stockForm, supplier_id: e.target.value })}
              >
                <option value="">Fornecedor (opcional)</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              <button type="submit" className="bg-emerald-600 text-white rounded p-2 w-full">Registar entrada</button>
            </form>
          </div>

          <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Fornecedores</h4>
              <div className="max-h-64 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Telefone</th>
                      <th className="p-2 text-left">Entrega</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.length === 0 ? (
                      <tr><td colSpan="3" className="p-2 text-slate-500">Sem fornecedores registados.</td></tr>
                    ) : (
                      suppliers.map((supplier) => (
                        <tr key={supplier.id} className="border-b">
                          <td className="p-2">{supplier.name}</td>
                          <td className="p-2">{supplier.phone || '-'}</td>
                          <td className="p-2">{formatMoney(supplier.delivery_cost_per_visit)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Entradas recentes</h4>
              <div className="max-h-64 overflow-auto border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="p-2 text-left">Produto</th>
                      <th className="p-2 text-left">Qtde</th>
                      <th className="p-2 text-left">Custo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockEntries.length === 0 ? (
                      <tr><td colSpan="3" className="p-2 text-slate-500">Sem entradas de stock.</td></tr>
                    ) : (
                      stockEntries.map((entry) => (
                        <tr key={entry.id} className="border-b">
                          <td className="p-2">{entry.product?.name || 'Produto'}</td>
                          <td className="p-2">{entry.quantity}</td>
                          <td className="p-2">{formatMoney(entry.unit_cost)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded shadow p-4">
          <h2 className="text-xl font-bold mb-4">Resumo de vendas recentes</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Pagamento</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Itens</th>
                </tr>
              </thead>
              <tbody>
                {(metrics.recentSales || []).length === 0 ? (
                  <tr><td colSpan="4" className="p-2 text-slate-500">Sem vendas recentes.</td></tr>
                ) : (
                  (metrics.recentSales || []).map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-2">{new Date(sale.created_at).toLocaleString('pt-MZ')}</td>
                      <td className="p-2">{sale.payment_method}</td>
                      <td className="p-2">{formatMoney(sale.total_amount)}</td>
                      <td className="p-2">{sale.itemCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8">
          <OnboardingWizard />
        </div>
      </div>
    </div>
  );
}
