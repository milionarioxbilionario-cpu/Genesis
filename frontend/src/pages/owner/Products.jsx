import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Plus, Search } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, dateTime, errorMessage } from '../../utils/format';
import { photoToDataUrl } from '../../utils/imageResize';
import ShoppingLists from './ShoppingLists';
import { Badge, Button, Drawer, Input, MoneyInput, PageHeader, ProductImage, Select, Table, Tabs, Toolbar, useConfirm, useToast, Alert } from '../../components/ui';

const stockTone = (p) => (p.stock_qty <= 0 ? 'danger' : p.stock_qty <= 10 ? 'danger' : p.stock_qty <= 20 ? 'warning' : p.stock_qty <= (p.min_stock || 0) ? 'warning' : 'neutral');

export default function Products() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'catalog';
  const products = useApi('/api/products');
  return (
    <>
      <PageHeader title="Produtos" description="Catálogo, stock e custos de compra." />
      <Tabs className="mb-5" value={tab} onChange={(v) => setParams({ tab: v })} items={[
        { value: 'catalog', label: 'Catálogo', count: products.data?.filter((p) => p.is_active).length },
        { value: 'stock', label: 'Stock' },
        { value: 'shopping', label: 'Lista de compras' },
        { value: 'prices', label: 'Histórico de custos' },
      ]} />
      {tab === 'catalog' && <Catalog products={products} />}
      {tab === 'stock' && <Stock products={products} />}
      {tab === 'shopping' && <ShoppingLists products={products} />}
      {tab === 'prices' && <PriceHistory />}
    </>
  );
}

const EMPTY = { name: '', category: 'Geral', barcode: '', image_url: null, sell_price: 0, cost_price: 0, stock_qty: 0, min_stock: 5, has_expiry: false, expiry_date: '' };

function Catalog({ products }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const photoInput = useRef(null);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { const url = await photoToDataUrl(file); setEditing((x) => ({ ...x, image_url: url })); } catch (err) { setError(err.message); }
  }
  const list = useMemo(() => (products.data || []).filter((p) => p.is_active && (!q || p.name.toLowerCase().includes(q.toLowerCase()) || (p.barcode || '').includes(q))), [products.data, q]);
  const categories = useMemo(() => [...new Set((products.data || []).map((p) => p.category))].sort(), [products.data]);

  const set = (k) => (v) => setEditing((e) => ({ ...e, [k]: v }));
  async function save() {
    setSaving(true); setError('');
    const body = {
      name: editing.name.trim(), category: editing.category.trim() || 'Geral', barcode: editing.barcode.trim() || null,
      image_url: editing.image_url || null,
      sell_price: editing.sell_price, cost_price: editing.cost_price, min_stock: Number(editing.min_stock) || 0,
      has_expiry: editing.has_expiry, expiry_date: editing.has_expiry && editing.expiry_date ? editing.expiry_date : null,
    };
    try {
      if (editing.id) await api.patch('/api/products/' + editing.id, body);
      else await api.post('/api/products', { ...body, stock_qty: Number(editing.stock_qty) || 0 });
      toast(editing.id ? 'Produto actualizado.' : 'Produto criado.');
      setEditing(null);
      products.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }
  async function remove(p) {
    if (!(await confirm({ title: 'Remover produto', message: `"${p.name}" deixa de aparecer no terminal. O histórico de vendas mantém-se.`, confirmLabel: 'Remover', danger: true }))) return;
    try { await api.delete('/api/products/' + p.id); toast('Produto removido.'); setEditing(null); products.reload(); } catch (err) { toast(errorMessage(err), 'danger'); }
  }

  const columns = [
    { key: 'name', header: 'Produto', render: (p) => <div className="flex items-center gap-3"><ProductImage product={p} size={36} /><div><p className="text-ink">{p.name}</p>{p.barcode && <p className="num text-xs text-ink-muted">{p.barcode}</p>}</div></div> },
    { key: 'category', header: 'Categoria', render: (p) => <span className="text-ink-2">{p.category}</span> },
    { key: 'sell', header: 'Preço', align: 'right', render: (p) => money(p.sell_price) },
    { key: 'cost', header: 'Custo', align: 'right', render: (p) => <span className="text-ink-2">{money(p.cost_price)}</span> },
    { key: 'margin', header: 'Margem', align: 'right', render: (p) => (p.sell_price > 0 ? <span className={p.sell_price <= p.cost_price ? 'text-danger' : 'text-ink-2'}>{Math.round(((p.sell_price - p.cost_price) / p.sell_price) * 100)}%</span> : '—') },
    { key: 'stock', header: 'Stock', align: 'right', render: (p) => <Badge tone={stockTone(p)}>{int(p.stock_qty)}</Badge> },
  ];

  return (
    <>
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input aria-label="Pesquisar" placeholder="Pesquisar nome ou código" value={q} onChange={(e) => setQ(e.target.value)} inputClassName="pl-9" className="pl-9" />
        </div>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ ...EMPTY }); }}>Novo produto</Button>
      </Toolbar>
      <Table columns={columns} rows={list} loading={products.loading && !products.data} onRowClick={(p) => { setError(''); setEditing({ ...EMPTY, ...p, barcode: p.barcode || '', expiry_date: p.expiry_date ? p.expiry_date.slice(0, 10) : '' }); }} empty={<p className="py-10 text-center text-ink-muted">{q ? 'Nenhum produto encontrado.' : 'Ainda não há produtos.'}</p>} />

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar produto' : 'Novo produto'}
        footer={(
          <>
            {editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={() => remove(editing)}>Remover</Button>}
            <Button onClick={() => setEditing(null)}>Cancelar</Button>
            <Button variant="primary" loading={saving} disabled={!editing?.name?.trim() || !editing?.sell_price} onClick={save}>Guardar</Button>
          </>
        )}
      >
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <div className="flex items-center gap-4">
              <ProductImage product={editing} size={72} />
              <div className="flex flex-col items-start gap-1.5">
                <Button size="sm" icon={Camera} onClick={() => photoInput.current?.click()}>{editing.image_url ? 'Trocar foto' : 'Tirar ou carregar foto'}</Button>
                {editing.image_url && <Button size="sm" variant="ghost" onClick={() => set('image_url')(null)}>Remover foto</Button>}
                <p className="text-xs text-ink-muted">Aparece no terminal do balcão. Sem foto, mostra o ícone da categoria.</p>
              </div>
              <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Foto do produto" onChange={onPhoto} />
            </div>
            <Input label="Nome" value={editing.name} onChange={(e) => set('name')(e.target.value)} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Categoria" list="categorias" value={editing.category} onChange={(e) => set('category')(e.target.value)} />
              <Input label="Código de barras" value={editing.barcode} onChange={(e) => set('barcode')(e.target.value)} inputClassName="num" />
            </div>
            <datalist id="categorias">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Preço de venda" valueCents={editing.sell_price} onChangeCents={set('sell_price')} />
              <MoneyInput label="Custo de compra" valueCents={editing.cost_price} onChangeCents={set('cost_price')} />
            </div>
            {editing.sell_price > 0 && editing.sell_price <= editing.cost_price && <Alert tone="warning">O preço de venda não cobre o custo.</Alert>}
            <div className="grid grid-cols-2 gap-3">
              {!editing.id && <Input label="Stock inicial" inputMode="numeric" value={editing.stock_qty} onChange={(e) => set('stock_qty')(e.target.value.replace(/\D/g, ''))} />}
              <Input label="Stock mínimo" hint="Alerta abaixo deste valor" inputMode="numeric" value={editing.min_stock} onChange={(e) => set('min_stock')(e.target.value.replace(/\D/g, ''))} />
            </div>
            <label className="flex items-center gap-2 text-base text-ink-2">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={editing.has_expiry} onChange={(e) => set('has_expiry')(e.target.checked)} />
              Produto com validade
            </label>
            {editing.has_expiry && !editing.id && <Input label="Validade do stock inicial" type="date" value={editing.expiry_date} onChange={(e) => set('expiry_date')(e.target.value)} />}
            {editing.has_expiry && editing.id && <p className="text-sm text-ink-muted">Cada compra tem a sua validade: registe-a em Stock → Entrada de stock.</p>}
          </div>
        )}
      </Drawer>
    </>
  );
}

function Stock({ products }) {
  const toast = useToast();
  const entries = useApi('/api/inventory/stock');
  const suppliers = useApi('/api/inventory/suppliers');
  const alerts = useApi('/api/owner/alerts');
  const [mode, setMode] = useState(null); // 'entry' | 'adjust'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const active = (products.data || []).filter((p) => p.is_active);
  const low = active.filter((p) => p.stock_qty <= Math.max(p.min_stock || 0, 20)).sort((a, b) => a.stock_qty - b.stock_qty);
  const lots = alerts.data?.expiringLots || [];
  const product = active.find((p) => p.id === form.product_id);

  function open(m) { setError(''); setForm({ product_id: '', quantity: '', unit_cost: 0, supplier_id: '', delta: '', reason: '', expiry_date: '' }); setMode(m); }
  async function save() {
    setSaving(true); setError('');
    try {
      if (mode === 'entry') {
        await api.post('/api/inventory/stock', { product_id: form.product_id, quantity: Number(form.quantity), unit_cost: form.unit_cost || product.cost_price, supplier_id: form.supplier_id || null, expiry_date: form.expiry_date || null });
        toast('Entrada de stock registada.');
      } else {
        await api.patch(`/api/products/${form.product_id}/stock`, { delta: Number(form.delta), reason: form.reason.trim(), ...(Number(form.delta) > 0 && form.expiry_date ? { expiry_date: form.expiry_date } : {}) });
        toast('Ajuste registado na auditoria.');
      }
      setMode(null); products.reload(); entries.reload(); alerts.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <>
      <Toolbar>
        <Button variant="primary" icon={Plus} onClick={() => open('entry')}>Entrada de stock</Button>
        <Button onClick={() => open('adjust')}>Ajuste manual</Button>
      </Toolbar>
      {lots.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-1 font-semibold text-ink">Validades</h2>
          <p className="mb-2 text-sm text-ink-muted">Lotes que expiram nos próximos {alerts.data.alertDays} dias. No dia seguinte à validade, o Genesis regista sozinho a perda e tira-os do stock.</p>
          <Table
            columns={[
              { key: 'name', header: 'Produto', render: (l) => <div><p className="text-ink">{l.name}</p>{l.barcode && <p className="num text-xs text-ink-muted">{l.barcode}</p>}</div> },
              { key: 'qty', header: 'Deste lote', align: 'right', render: (l) => <span>{int(l.quantity)} de {int(l.product_stock ?? l.quantity)} un.</span> },
              { key: 'expiry', header: 'Validade', render: (l) => date(l.expiry_date) },
              { key: 'left', header: '', align: 'right', render: (l) => <Badge tone={l.days_left < 0 ? 'danger' : l.days_left <= 2 ? 'danger' : 'warning'}>{l.days_left < 0 ? 'Expirado' : l.days_left === 0 ? 'Expira hoje' : `${l.days_left} dia(s)`}</Badge> },
              { key: 'value', header: 'Valor (custo)', align: 'right', render: (l) => money(l.value) },
            ]}
            rows={lots}
            rowKey="lot_id"
          />
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-semibold text-ink">A repor</h2>
          <Table
            columns={[
              { key: 'name', header: 'Produto' },
              { key: 'stock_qty', header: 'Stock', align: 'right', render: (p) => <Badge tone={stockTone(p)}>{int(p.stock_qty)}</Badge> },
            ]}
            rows={low}
            loading={products.loading && !products.data}
            empty={<p className="py-8 text-center text-ink-muted">Nada a repor.</p>}
          />
        </div>
        <div className="lg:col-span-3">
          <h2 className="mb-2 font-semibold text-ink">Últimos movimentos</h2>
          <Table
            columns={[
              { key: 'created_at', header: 'Data', render: (e) => dateTime(e.created_at) },
              { key: 'product', header: 'Produto', render: (e) => e.product?.name },
              { key: 'quantity', header: 'Qtd.', align: 'right', render: (e) => <span className={e.quantity < 0 ? 'text-danger' : 'text-positive'}>{e.quantity > 0 ? '+' : ''}{e.quantity}</span> },
              { key: 'unit_cost', header: 'Custo un.', align: 'right', render: (e) => money(e.unit_cost) },
            ]}
            rows={entries.data || []}
            loading={entries.loading && !entries.data}
            empty={<p className="py-8 text-center text-ink-muted">Sem movimentos.</p>}
          />
        </div>
      </div>

      <Drawer
        open={Boolean(mode)}
        onClose={() => setMode(null)}
        title={mode === 'entry' ? 'Entrada de stock' : 'Ajuste manual'}
        description={mode === 'adjust' ? 'Para corrigir contagens. Fica registado na auditoria com o motivo.' : 'Compra a um fornecedor. Actualiza o custo do produto.'}
        footer={<><Button onClick={() => setMode(null)}>Cancelar</Button><Button variant="primary" loading={saving}
          disabled={!product || (mode === 'entry' ? !(Number(form.quantity) > 0) : !Number(form.delta) || form.reason.trim().length < 3)} onClick={save}>Registar</Button></>}
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Select label="Produto" value={form.product_id || ''} onChange={(e) => { const p = active.find((x) => x.id === e.target.value); setForm((f) => ({ ...f, product_id: e.target.value, unit_cost: p?.cost_price || 0 })); }}>
            <option value="">Escolher…</option>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_qty} un.)</option>)}
          </Select>
          {mode === 'entry' ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Quantidade" inputMode="numeric" value={form.quantity || ''} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value.replace(/\D/g, '') }))} />
                <MoneyInput label="Custo unitário" valueCents={form.unit_cost} onChangeCents={(v) => setForm((f) => ({ ...f, unit_cost: v }))} />
              </div>
              <Select label="Fornecedor" hint="O custo de entrega do fornecedor entra no relatório mensal." value={form.supplier_id || ''} onChange={(e) => setForm((f) => ({ ...f, supplier_id: e.target.value }))}>
                <option value="">Sem fornecedor</option>
                {(suppliers.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Input label="Validade deste lote" type="date" hint="Deixe vazio se não tem validade (ex.: bebidas). Com data, o Genesis avisa antes e regista a perda se não vender." value={form.expiry_date || ''} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />
            </>
          ) : (
            <>
              <Input label="Variação" hint="Negativo para retirar (ex.: −3), positivo para acrescentar." value={form.delta || ''} onChange={(e) => setForm((f) => ({ ...f, delta: e.target.value.replace(/[^\d-]/g, '') }))} inputClassName="num" />
              {Number(form.delta) > 0 && <Input label="Validade (opcional)" type="date" value={form.expiry_date || ''} onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))} />}
              <Input label="Motivo" placeholder="Ex.: contagem física de fim de mês" value={form.reason || ''} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}

function PriceHistory() {
  const { data, loading } = useApi('/api/inventory/price-history');
  return (
    <Table
      columns={[
        { key: 'changed_at', header: 'Data', render: (r) => dateTime(r.changed_at) },
        { key: 'product_name', header: 'Produto' },
        { key: 'old', header: 'Custo anterior', align: 'right', render: (r) => money(r.old_cost) },
        { key: 'new', header: 'Custo novo', align: 'right', render: (r) => money(r.new_cost) },
        { key: 'var', header: 'Variação', align: 'right', render: (r) => (r.old_cost ? <span className={r.new_cost > r.old_cost ? 'text-danger' : 'text-positive'}>{r.new_cost > r.old_cost ? '+' : ''}{Math.round(((r.new_cost - r.old_cost) / r.old_cost) * 100)}%</span> : '—') },
        { key: 'changed_by', header: 'Por', render: (r) => <span className="text-ink-2">{r.changed_by || '—'}</span> },
      ]}
      rows={data || []}
      loading={loading}
      empty={<p className="py-10 text-center text-ink-muted">Ainda não houve mudanças de custo. Cada entrada de stock com custo diferente fica aqui.</p>}
    />
  );
}
