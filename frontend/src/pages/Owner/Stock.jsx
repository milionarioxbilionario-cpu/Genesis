import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { mznToCents } from '../../utils/money';
import { Card, CardHead, Button, Badge, Input, PageHead, Table, EmptyState, Skeleton, useToast } from '../../components/ui';
import { CheckCircle2, Package, Download } from 'lucide-react';

/* STOCK & ENTRADAS — registo de restock + historico (movido do Dashboard). */
const MZN = (c) => `MZN ${(Number(c || 0) / 100).toLocaleString('pt-MZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function level(qty) {
  const q = Number(qty || 0);
  if (q <= 10) return { tone: 'danger', label: 'CRITICO' };
  if (q <= 20) return { tone: 'warn', label: 'SEVERO' };
  return { tone: 'ok', label: 'NORMAL' };
}

export default function Stock() {
  const toast = useToast();
  const [entries, setEntries] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product_id: '', quantity: 1, unit_cost: '', supplier_id: '' });

  async function load() {
    setLoading(true);
    const safe = (p) => p.then((r) => r.data).catch(() => null);
    const [e, pr, su] = await Promise.all([
      safe(api.get('/api/inventory/stock')),
      safe(api.get('/api/products')),
      safe(api.get('/api/inventory/suppliers')),
    ]);
    setEntries(Array.isArray(e) ? e : []);
    setProducts(Array.isArray(pr) ? pr : []);
    setSuppliers(Array.isArray(su) ? su : []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (products.length && !form.product_id) {
      setForm((prev) => ({ ...prev, product_id: products[0].id, unit_cost: ((Number(products[0].cost_price || 0)) / 100).toString() }));
    }
  }, [products]);

  const totalMonth = useMemo(() => {
    const now = new Date();
    return entries
      .filter((s) => { const d = new Date(s.created_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); })
      .reduce((sum, s) => sum + (Number(s.unit_cost || 0) * Number(s.quantity || 0)), 0);
  }, [entries]);

  const lowStock = products.filter((p) => Number(p.stock_qty || 0) <= Number(p.min_stock || 0));

  async function submit(e) {
    e.preventDefault();
    if (!form.product_id) { toast.push('Escolhe um produto.', 'warn'); return; }
    setSaving(true);
    try {
      await api.post('/api/inventory/stock', {
        product_id: form.product_id,
        quantity: Number(form.quantity || 0),
        unit_cost: mznToCents(form.unit_cost),
        supplier_id: form.supplier_id || null,
      });
      toast.push('Entrada de stock registada.', 'ok');
      setForm((prev) => ({ ...prev, quantity: 1 }));
      await load();
    } catch (err) {
      toast.push(err?.response?.data?.error || 'Erro ao registar a entrada.', 'err');
    } finally { setSaving(false); }
  }

  return (
    <div className="g-page">
      <PageHead title="Stock & Entradas" sub="Regista o restock e acompanha o que precisa de reposicao"
        actions={<Button variant="ghost" onClick={load}>Atualizar</Button>} />

      <div className="g-kpis" style={{ marginBottom: 24 }}>
        <Card tight><div className="g-stat"><span className="g-stat-label">Entradas registadas</span><span className="g-stat-value">{entries.length}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Investimento este mes</span><span className="g-stat-value" style={{ color: 'var(--ok)' }}>{MZN(totalMonth)}</span></div></Card>
        <Card tight><div className="g-stat"><span className="g-stat-label">Produtos abaixo do minimo</span><span className="g-stat-value" style={{ color: lowStock.length ? 'var(--warn)' : 'var(--ok)' }}>{lowStock.length}</span></div></Card>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <CardHead title="Registar entrada de stock" hint="Custo em MZN — o sistema converte para centavos" />
        <form onSubmit={submit}>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <label>
              <span className="g-label">Produto</span>
              <select className="g-input" value={form.product_id} onChange={(e) => {
                const p = products.find((x) => x.id === e.target.value);
                setForm({ ...form, product_id: e.target.value, unit_cost: p ? ((Number(p.cost_price || 0)) / 100).toString() : form.unit_cost });
              }}>
                <option value="">Escolher...</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <Input label="Quantidade" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            <Input label="Custo unitario (MZN)" type="number" step="0.01" min="0" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: e.target.value })} />
            <label>
              <span className="g-label">Fornecedor</span>
              <select className="g-input" value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}>
                <option value="">Sem fornecedor</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>
          </div>
          <div style={{ marginTop: 18 }}>
            <Button variant="primary" type="submit" disabled={saving}>{saving ? 'A registar...' : 'Registar entrada'}</Button>
          </div>
        </form>
      </Card>

      <div className="g-cols-2" style={{ marginBottom: 24 }}>
        <Card>
          <CardHead title="Produtos a repor" hint="Severo <= 20 · critico <= 10" />
          {lowStock.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {lowStock.map((p) => {
                const lvl = level(p.stock_qty);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--r-md)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'var(--text)', fontWeight: 700, fontSize: '0.88rem' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.76rem' }}>actual {p.stock_qty ?? 0} · minimo {p.min_stock ?? 0}</div>
                    </div>
                    <Badge tone={lvl.tone}>{lvl.label}</Badge>
                  </div>
                );
              })}
            </div>
          ) : <EmptyState icon={<CheckCircle2 size={26} aria-hidden="true" />} title="Stock em ordem" hint="Nenhum produto abaixo do minimo." />}
        </Card>

        <Card>
          <CardHead title="Stock actual" hint="Quantidades por produto" />
          {loading ? <Skeleton height={220} /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
              {products.slice(0, 12).map((p) => {
                const lvl = level(p.stock_qty);
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <Badge tone={lvl.tone}>{p.stock_qty ?? 0}</Badge>
                  </div>
                );
              })}
              {products.length === 0 && <EmptyState icon={<Package size={26} aria-hidden="true" />} title="Sem produtos" />}
            </div>
          )}
        </Card>
      </div>

      <Card tight>
        <div style={{ padding: '14px 16px 0' }}><CardHead title="Historico de entradas" hint="O preco de compra fica registado para acompanhar a inflacao" /></div>
        {loading ? <div style={{ padding: 16 }}><Skeleton height={180} /></div> : (
          <Table
            rowKey={(r) => r.id}
            rows={entries}
            empty={<EmptyState icon={<Download size={26} aria-hidden="true" />} title="Sem entradas registadas" hint="Regista a primeira compra de restock acima." />}
            columns={[
              { key: 'product_name', label: 'Produto', render: (r) => r.product_name || r.product?.name || '—' },
              { key: 'quantity', label: 'Qtd', numeric: true },
              { key: 'unit_cost', label: 'Custo unit.', align: 'right', numeric: true, render: (r) => MZN(r.unit_cost) },
              { key: 'total', label: 'Total', align: 'right', numeric: true, render: (r) => MZN(Number(r.unit_cost || 0) * Number(r.quantity || 0)) },
              { key: 'created_at', label: 'Data', render: (r) => new Date(r.created_at).toLocaleString('pt-MZ', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            ]}
          />
        )}
      </Card>
      <div style={{ height: 28 }} />
    </div>
  );
}
