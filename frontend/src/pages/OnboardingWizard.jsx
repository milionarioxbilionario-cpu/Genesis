import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function OnboardingWizard() {
  const [businessType, setBusinessType] = useState('mercearia');
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchTemplate(businessType);
  }, [businessType]);

  async function fetchTemplate(type) {
    setLoading(true);
    try {
      const resp = await api.get(`/api/catalogs/${type}`);
      // normalize sampleProducts into editable products state
      const products = (resp.data.template.sampleProducts || []).map(p => ({
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
      setMessage('Erro ao carregar template');
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
    setTemplate(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  }

  function addEmptyProduct() {
    const newP = { id: cryptoRandomId(), name: '', sku: '', price_mzn: 0, cost_mzn: 0, stock: 0, category: '' };
    setTemplate(prev => ({ ...prev, products: [newP, ...prev.products] }));
  }

  function removeProduct(id) {
    setTemplate(prev => ({ ...prev, products: prev.products.filter(p => p.id !== id) }));
  }

  function validateProducts(products) {
    if (!products || products.length === 0) return false;
    for (const p of products) {
      if (!p.name || p.name.trim().length < 1) return false;
      if (isNaN(p.price_mzn) || p.price_mzn < 0) return false;
      if (isNaN(p.cost_mzn) || p.cost_mzn < 0) return false;
      if (!Number.isInteger(Number(p.stock)) || p.stock < 0) return false;
    }
    return true;
  }

  async function handleImport() {
    if (!template || !template.products) return;
    if (!validateProducts(template.products)) {
      setMessage('Corrija os produtos antes de importar. Preencha nome, preços não-negativos e stock inteiro.');
      return;
    }

    setImporting(true);
    setMessage(null);
    try {
      // prepare payload: convert to expected shape
      const products = template.products.map(p => ({
        name: p.name,
        sku: p.sku || undefined,
        price_mzn: Number(p.price_mzn),
        cost_mzn: Number(p.cost_mzn),
        stock: Number(p.stock),
        category: p.category || undefined
      }));

      const resp = await api.post(`/api/catalogs/${businessType}/import`, { products });
      setMessage(`Importados: ${resp.data.imported}`);
    } catch (err) {
      console.error(err);
      setMessage(err?.response?.data?.error || 'Erro na importação');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Assistente de Onboarding</h2>
      <p className="mb-4">Escolha o tipo de negócio e importe um catálogo inicial sugerido. Edite os produtos antes de importar.</p>

      <div className="mb-4">
        <label className="mr-2">Tipo:</label>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
          <option value="mercearia">Mercearia</option>
          <option value="restaurante">Restaurante</option>
          <option value="boutique">Boutique</option>
        </select>
      </div>

      <div className="mb-4">
        <button disabled={loading} onClick={() => fetchTemplate(businessType)} className="px-3 py-1 bg-blue-600 text-white rounded">Carregar template</button>
      </div>

      {loading && <p>Carregando template...</p>}

      {template && (
        <div className="mb-4">
          <h3 className="font-semibold">Categorias</h3>
          <ul>
            {template.categories.map((c, i) => <li key={i}>{c}</li>)}
          </ul>

          <h3 className="font-semibold mt-2">Produtos (edite antes de importar)</h3>

          <div className="mb-2">
            <button className="px-2 py-1 bg-gray-200 rounded mr-2" onClick={addEmptyProduct}>Adicionar produto</button>
            <label className="px-2 py-1 bg-gray-100 rounded mr-2 cursor-pointer">
              <input type="file" accept="text/csv" onChange={async (e)=>{
                const f = e.target.files && e.target.files[0];
                if (!f) return;
                const txt = await f.text();
                // simple CSV parser (header optional: name,sku,price_mzn,cost_mzn,stock,category)
                const lines = txt.split(/\r?\n/).filter(l=>l.trim().length>0);
                let parsed = [];
                const hasHeader = lines[0].toLowerCase().includes('name') && lines[0].toLowerCase().includes('price');
                for (let i=(hasHeader?1:0); i<lines.length; i++){
                  const row = lines[i].split(/,|;|\t/).map(c=>c.trim());
                  if (row.length===0) continue;
                  if (hasHeader){
                    // assume header order name,sku,price_mzn,cost_mzn,stock,category
                    parsed.push({ id: cryptoRandomId(), name: row[0]||'', sku: row[1]||'', price_mzn: Number(row[2]||0), cost_mzn: Number(row[3]||0), stock: Number(row[4]||0), category: row[5]||'' });
                  } else {
                    // fallback columns
                    parsed.push({ id: cryptoRandomId(), name: row[0]||'', sku: row[1]||'', price_mzn: Number(row[2]||0), cost_mzn: Number(row[3]||0), stock: Number(row[4]||0), category: row[5]||'' });
                  }
                }
                setTemplate(prev => ({ ...prev, products: [...(prev.products||[]), ...parsed] }));
              }} style={{display:'none'}} />
              Carregar CSV
            </label>
            <button className="px-2 py-1 bg-green-600 text-white rounded" onClick={handleImport} disabled={importing}>Importar para a minha loja</button>
          </div>

          <div className="overflow-auto max-h-64 border p-2 rounded bg-white">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr>
                  <th className="text-left">Nome</th>
                  <th className="text-left">SKU</th>
                  <th className="text-left">Preço (MZN)</th>
                  <th className="text-left">Custo (MZN)</th>
                  <th className="text-left">Stock</th>
                  <th className="text-left">Categoria</th>
                  <th className="text-left">Centavos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {template.products.map(p => (
                  <tr key={p.id} className="align-top border-t">
                    <td><input value={p.name} onChange={e => updateProductField(p.id, 'name', e.target.value)} className="p-1 w-48"/></td>
                    <td><input value={p.sku} onChange={e => updateProductField(p.id, 'sku', e.target.value)} className="p-1 w-28"/></td>
                    <td><input type="number" step="0.01" value={p.price_mzn} onChange={e => updateProductField(p.id, 'price_mzn', Number(e.target.value))} className="p-1 w-28"/></td>
                    <td><input type="number" step="0.01" value={p.cost_mzn} onChange={e => updateProductField(p.id, 'cost_mzn', Number(e.target.value))} className="p-1 w-28"/></td>
                    <td><input type="number" value={p.stock} onChange={e => updateProductField(p.id, 'stock', Number(e.target.value))} className="p-1 w-20"/></td>
                    <td><input value={p.category} onChange={e => updateProductField(p.id, 'category', e.target.value)} className="p-1 w-32"/></td>
                    <td className="px-2">{Math.round(Number(p.price_mzn || 0) * 100)} / {Math.round(Number(p.cost_mzn || 0) * 100)}</td>
                    <td className="px-2"><button className="text-sm text-red-600" onClick={() => removeProduct(p.id)}>Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {message && <div className="mt-4 p-2 bg-yellow-100 rounded">{message}</div>}
    </div>
  );
}
