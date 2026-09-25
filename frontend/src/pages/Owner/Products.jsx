import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { centsToMznInput, mznToCents } from '../../utils/money';
import { Card, CardHead, Button, Badge, Input, PageHead, Modal, Table, EmptyState, Skeleton, useToast } from '../../components/ui';
import { Package } from 'lucide-react';

/* PRODUTOS — CRUD movido do antigo Dashboard monolitico (Lote D2).
   REGRA DE MOEDA: os campos mostram MZN ao utilizador e sao convertidos
   para CENTAVOS (mznToCents) antes de ir para a API. */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const EMPTY = { name: '', category: 'Geral', barcode: '', sell_price: 0, cost_price: 0, stock_qty: 0, min_stock: 5, is_active: true };

function level(qty) {
  const q = Number(qty || 0);
  if (q <= 10) return 'danger';
  if (q <= 20) return 'warn';
  return 'ok';
}

export default function Products() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/api/products');
      setProducts(res.data || []);
    } catch { toast.push('Nao foi possivel carregar os produtos.', 'err'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => `${p.name} ${p.category || ''} ${p.barcode || ''}`.toLowerCase().includes(q));
  }, [products, search]);

  const totals = useMemo(() => ({
    count: products.length,
    stock: products.reduce((s, p) => s + Number(p.stock_qty || 0), 0),
    value: products.reduce((s, p) => s + Number(p.cost_price || 0) * Number(p.stock_qty || 0), 0),
    low: products.filter((p) => Number(p.stock_qty || 0) <= Number(p.min_stock || 0)).length,
  }), [products]);

  function reset() { setEditingId(null); setForm(EMPTY); }

  function edit(p) {
    setEditingId(p.id);
    setForm({
      name: p.name, category: p.category || 'Geral', barcode: p.barcode || '',
      sell_price: centsToMznInput(p.sell_price), cost_price: centsToMznInput(p.cost_price),
      stock_qty: Number(p.stock_qty || 0), min_stock: Number(p.min_stock || 5),
      is_active: p.is_active !== false,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        sell_price: mznToCents(form.sell_price),
        cost_price: mznToCents(form.cost_price),
        stock_qty: Number(form.stock_qty),
        min_stock: Number(form.min_stock),
        is_active: form.is_active !== false,
      };
      if (editingId) { await api.patch(`/api/products/${editingId}`, payload); toast.push('Produto actualizado.', 'ok'); }
      else { await api.post('/api/products', payload); toast.push('Produto criado.', 'ok'); }
      reset();
      await load();
    } catch (err) {
      toast.push(err?.response?.data?.error || 'Erro ao guardar o produto.', 'err');
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!toDelete) return;
    try {
      await api.delete(`/api/products/${toDelete.id}`);
      toast.push('Produto removido.', 'ok');
      setToDelete(null);
      await load();
    } catch (err) {
      toast.push(err?.response?.data?.error || 'Erro ao remover o produto.', 'err');
    }
  }

  async function adjust(p, delta) {
    try {
      await api.patch(`/api/products/${p.id}/stock`, { delta, reason: 'manual_adjustment' });
      await load();
    } catch (err) {
      toast.push(err?.response?.data?.error || 'Erro ao ajustar o stock.', 'err');
    }
  }

  return (
    <div className="g-page">
      <PageHead title="Produtos" sub="Catalogo, precos e stock minimo do teu estabelecimento"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />

      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Produtos</span><span className="g-stat-value">{totals.count}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Unidades em stock</span><span className="g-stat-value">{totals.stock}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Valor em stock</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(totals.value)}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Abaixo do minimo</span><span className="g-stat-value" style={{ color: totals.low ? 'var(--warn)' : 'var(--ok)' }}>{totals.low}</span></div></Card>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <CardHead title={editingId ? 'Editar produto' : 'Adicionar produto'}
          action={editingId ? <Button variant="ghost" small onClick={reset}>Cancelar</Button> : null} />
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Arroz Agulha 5kg" />
            <Input label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Ex: Mercearia" />
            <Input label="Codigo de barras" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Opcional" />
            <Input label="Preco de venda (MZN)" type="number" step="0.01" min="0" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} />
            <Input label="Preco de custo (MZN)" type="number" step="0.01" min="0" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} />
            <Input label="Stock inicial" type="number" min="0" value={form.stock_qty} onChange={(e) => setForm({ ...form, stock_qty: e.target.value })} />
            <Input label="Stock minimo" type="number" min="0" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} hint="Alerta quando atingir" />
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 10 }}>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'A guardar...' : (editingId ? 'Guardar alteracoes' : 'Adicionar produto')}</Button>
          </div>
        </form>
      </Card>

      <Card tight>
        <div style={{ padding: '4px 4px 14px' }}>
          <input className="g-input" placeholder="Procurar produto, categoria ou codigo..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={200} /></div> : (
          <Table
            rowKey={(r) => r.id}
            rows={filtered}
            empty={<EmptyState icon={<Package size={26} aria-hidden="true" />} title="Sem produtos" hint="Adiciona o primeiro produto no formulario acima." />}
            columns={[
              { key: 'name', label: 'Produto', render: (r) => (<div><div style={{ fontWeight: 700 }}>{r.name}</div><div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{r.category || 'Geral'}{r.barcode ? ` · ${r.barcode}` : ''}</div></div>) },
              { key: 'stock_qty', label: 'Stock', numeric: true, render: (r) => (<span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}><Badge tone={level(r.stock_qty)}>{r.stock_qty ?? 0}</Badge><button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => adjust(r, -1)}>−</button><button type="button" className="g-btn g-btn-ghost g-btn-sm" onClick={() => adjust(r, 1)}>+</button></span>) },
              { key: 'cost_price', label: 'Custo', align: 'right', numeric: true, render: (r) => MZN(r.cost_price) },
              { key: 'sell_price', label: 'Venda', align: 'right', numeric: true, render: (r) => MZN(r.sell_price) },
              { key: 'margin', label: 'Margem', align: 'right', numeric: true, render: (r) => { const m = Number(r.sell_price || 0) - Number(r.cost_price || 0); return <span style={{ color: m > 0 ? 'var(--ok)' : 'var(--danger)' }}>{MZN(m)}</span>; } },
              { key: 'is_active', label: 'Estado', render: (r) => <Badge tone={r.is_active === false ? 'neutral' : 'ok'}>{r.is_active === false ? 'INACTIVO' : 'ACTIVO'}</Badge> },
              { key: 'actions', label: '', align: 'right', render: (r) => (<span style={{ display: 'inline-flex', gap: 8 }}><Button variant="ghost" small onClick={() => edit(r)}>Editar</Button><Button variant="danger" small onClick={() => setToDelete(r)}>Remover</Button></span>) },
            ]}
          />
        )}
      </Card>

      <Modal open={Boolean(toDelete)} title="Remover produto" hint="Esta accao fica registada na auditoria."
        onClose={() => setToDelete(null)} width={460}
        footer={<><Button variant="ghost" onClick={() => setToDelete(null)}>Cancelar</Button><Button variant="danger" onClick={remove}>Sim, remover</Button></>}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Tens a certeza que queres remover <strong style={{ color: 'var(--text)' }}>{toDelete?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
