import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const businessOptions = [
  { value: 'bottle_store', label: 'Bottle Store', description: 'Cervejas, bebidas, água e snacks' },
  { value: 'mercearia', label: 'Mercearia', description: 'Secos, higiene, enlatados e básicos' },
  { value: 'padaria', label: 'Padaria', description: 'Pães, sobremesas e laticínios' },
  { value: 'talho', label: 'Talho', description: 'Frango, bovino, suíno e embutidos' },
  { value: 'supermercado', label: 'Supermercado', description: 'Frescos, limpeza e casa' },
  { value: 'outro', label: 'Outro', description: 'Personalize o catálogo da sua loja' }
];

export default function OnboardingWizard() {
  const [businessType, setBusinessType] = useState('bottle_store');
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTemplate(businessType);
  }, [businessType]);

  async function fetchTemplate(type) {
    setLoading(true);
    setMessage(null);
    try {
      const resp = await api.get(`/api/catalogs/${type}`);
      const products = (resp.data.template?.sampleProducts || []).map((p) => ({
        id: cryptoRandomId(),
        name: p.name || '',
        sku: p.sku || '',
        price_mzn: Number(p.price_mzn || 0),
        cost_mzn: Number(p.cost_mzn || 0),
        stock: Number(p.stock || 0),
        category: p.category || ''
      }));
      setTemplate({ ...resp.data.template, products });
    } catch (err) {
      console.error(err);
      setMessage('Erro ao carregar o catálogo sugerido.');
    } finally {
      setLoading(false);
    }
  }

  function cryptoRandomId() {
    try {
      return crypto.randomUUID();
    } catch (e) {
      return Math.random().toString(36).slice(2, 10);
    }
  }

  function updateProductField(id, field, value) {
    setTemplate((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    }));
  }

  function addEmptyProduct() {
    const newP = { id: cryptoRandomId(), name: '', sku: '', price_mzn: 0, cost_mzn: 0, stock: 0, category: '' };
    setTemplate((prev) => ({ ...prev, products: [newP, ...(prev.products || [])] }));
  }

  function removeProduct(id) {
    setTemplate((prev) => ({ ...prev, products: (prev.products || []).filter((p) => p.id !== id) }));
  }

  function validateProducts(products) {
    if (!products || products.length === 0) return false;
    for (const p of products) {
      if (!p.name || p.name.trim().length < 1) return false;
      if (Number.isNaN(Number(p.price_mzn)) || Number(p.price_mzn) < 0) return false;
      if (Number.isNaN(Number(p.cost_mzn)) || Number(p.cost_mzn) < 0) return false;
      if (!Number.isInteger(Number(p.stock)) || Number(p.stock) < 0) return false;
    }
    return true;
  }

  async function handleImport() {
    if (!template || !template.products) return;
    if (!validateProducts(template.products)) {
      setMessage('Corrija os produtos antes de importar. Preencha nome, preços válidos e stock inteiro.');
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      const products = template.products.map((p) => ({
        name: (p.name || '').trim(),
        sku: p.sku || undefined,
        sell_price: Math.round(Number(p.price_mzn || 0) * 100),
        cost_price: Math.round(Number(p.cost_mzn || 0) * 100),
        stock: Number(p.stock),
        category: p.category || undefined,
        is_active: true
      }));

      const resp = await api.post(`/api/catalogs/${businessType}/import`, { products });
      const imported = resp.data.imported || products.length;
      setMessage(`Catálogo importado com sucesso. ${imported} produtos adicionados e a sua loja foi marcada como pronta.`);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.error || 'Erro na importação do catálogo.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-600">Genesis</p>
            <h1 className="text-3xl font-black text-slate-900">Assistente de onboarding</h1>
          </div>
          <Link to="/owner" className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400">
            Voltar ao dashboard
          </Link>
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-3">
          {[
            '1. Escolher tipo de negócio',
            '2. Ajustar catálogo',
            '3. Importar e vender'
          ].map((step, index) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-700 shadow-sm">
              <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-700">{index + 1}</span>
              {step}
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-slate-900">Escolha o tipo de negócio</h2>
            <p className="mt-1 text-sm text-slate-600">O Genesis sugere produtos e categorias conforme o tipo da sua loja.</p>
          </div>

          <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {businessOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBusinessType(option.value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  businessType === option.value
                    ? 'border-sky-500 bg-sky-50 shadow-sm ring-2 ring-sky-100'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="text-lg font-bold text-slate-900">{option.label}</div>
                <div className="mt-1 text-sm text-slate-600">{option.description}</div>
              </button>
            ))}
          </div>

          {loading && <div className="mb-4 text-sm text-slate-600">A carregar o catálogo sugerido...</div>}

          {template && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800" onClick={addEmptyProduct}>
                  + Adicionar produto
                </button>
                <label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
                  <input
                    type="file"
                    accept="text/csv"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const text = await file.text();
                      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
                      const hasHeader = lines[0]?.toLowerCase().includes('name') && lines[0]?.toLowerCase().includes('price');
                      const parsed = [];

                      for (let i = hasHeader ? 1 : 0; i < lines.length; i += 1) {
                        const row = lines[i].split(/,|;|\t/).map((cell) => cell.trim());
                        if (!row.length) continue;
                        parsed.push({
                          id: cryptoRandomId(),
                          name: row[0] || '',
                          sku: row[1] || '',
                          price_mzn: Number(row[2] || 0),
                          cost_mzn: Number(row[3] || 0),
                          stock: Number(row[4] || 0),
                          category: row[5] || ''
                        });
                      }

                      setTemplate((prev) => ({ ...prev, products: [...(prev.products || []), ...parsed] }));
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  Carregar CSV
                </label>
                <button type="button" className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500" onClick={handleImport} disabled={importing}>
                  {importing ? 'Importando...' : 'Importar catálogo'}
                </button>
              </div>

              <div>
                <h3 className="mb-2 text-base font-bold text-slate-800">Categorias sugeridas</h3>
                <div className="flex flex-wrap gap-2">
                  {(template.categories || []).map((category, index) => (
                    <span key={`${category}-${index}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {category}
                    </span>
                  ))}
                </div>
              </div>

              <div className="overflow-auto rounded-2xl border border-slate-200 bg-slate-50">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-700">
                      <th className="p-3">Nome</th>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Preço</th>
                      <th className="p-3">Custo</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {(template.products || []).map((p) => (
                      <tr key={p.id} className="border-t border-slate-200 bg-white align-top">
                        <td className="p-2"><input value={p.name} onChange={(e) => updateProductField(p.id, 'name', e.target.value)} className="w-36 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><input value={p.sku} onChange={(e) => updateProductField(p.id, 'sku', e.target.value)} className="w-28 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><input type="number" step="0.01" value={p.price_mzn} onChange={(e) => updateProductField(p.id, 'price_mzn', Number(e.target.value))} className="w-24 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><input type="number" step="0.01" value={p.cost_mzn} onChange={(e) => updateProductField(p.id, 'cost_mzn', Number(e.target.value))} className="w-24 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><input type="number" value={p.stock} onChange={(e) => updateProductField(p.id, 'stock', Number(e.target.value))} className="w-20 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><input value={p.category} onChange={(e) => updateProductField(p.id, 'category', e.target.value)} className="w-32 rounded border border-slate-300 p-2" /></td>
                        <td className="p-2"><button type="button" className="text-sm font-medium text-red-600" onClick={() => removeProduct(p.id)}>Remover</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {message && (
            <div className={`mt-5 rounded-xl border p-3 text-sm ${message.includes('sucesso') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
