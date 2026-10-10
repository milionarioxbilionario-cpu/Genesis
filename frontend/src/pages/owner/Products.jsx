import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Boxes, Camera, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, dateTime, errorMessage } from '../../utils/format';
import { foldText, nameMatches } from '../../utils/search';
import { photoToDataUrl } from '../../utils/imageResize';
import ShoppingLists from './ShoppingLists';
import { Badge, Button, Drawer, IconButton, Input, MoneyInput, PageHeader, PRODUCT_ICONS, ProductImage, Select, Skeleton, Table, Tabs, Toolbar, categoryIcon, cx, useConfirm, useToast, Alert } from '../../components/ui';

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

const EMPTY = { name: '', category: 'Geral', barcode: '', image_url: null, icon: null, sell_price: 0, cost_price: 0, min_stock: 5, has_expiry: false, lots: [{ quantity: '', expiry_date: '' }], supplier_id: '' };

function Catalog({ products }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [, setParams] = useSearchParams();
  const suppliers = useApi('/api/inventory/suppliers');
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
  const list = useMemo(() => { const f = foldText(q); return (products.data || []).filter((p) => p.is_active && (nameMatches(p.name, f) || (p.barcode || '').includes(q.trim()))); }, [products.data, q]);
  const categories = useMemo(() => [...new Set((products.data || []).map((p) => p.category))].sort(), [products.data]);

  const set = (k) => (v) => setEditing((e) => ({ ...e, [k]: v }));
  const setLot = (i, k) => (v) => setEditing((e) => ({ ...e, lots: e.lots.map((l, j) => (j === i ? { ...l, [k]: v } : l)) }));
  const newLots = editing && !editing.id ? editing.lots.filter((l) => Number(l.quantity) > 0) : [];
  const newStock = newLots.reduce((s, l) => s + Number(l.quantity), 0);
  const lotsValid = !editing || editing.id || !editing.has_expiry || newLots.every((l) => l.expiry_date);

  // goStock: guarda e abre o separador Stock com este produto ja escolhido.
  async function save(goStock = false) {
    setSaving(true); setError('');
    const body = {
      name: editing.name.trim(), category: editing.category.trim() || 'Geral', barcode: editing.barcode.trim() || null,
      image_url: editing.image_url || null, icon: editing.icon || null,
      sell_price: editing.sell_price, cost_price: editing.cost_price, min_stock: Number(editing.min_stock) || 0,
      has_expiry: editing.has_expiry,
    };
    try {
      let id = editing.id;
      if (id) await api.patch('/api/products/' + id, body);
      else {
        const lots = newLots.map((l) => ({ quantity: Number(l.quantity), expiry_date: editing.has_expiry && l.expiry_date ? l.expiry_date : null }));
        id = (await api.post('/api/products', { ...body, lots, supplier_id: newStock > 0 && editing.supplier_id ? editing.supplier_id : null })).data.id;
      }
      toast(editing.id ? 'Produto actualizado.' : 'Produto criado.');
      setEditing(null);
      products.reload();
      if (goStock) setParams({ tab: 'stock', ajustar: id });
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
  const canSave = editing?.name?.trim() && editing?.sell_price && lotsValid;

  return (
    <>
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input aria-label="Pesquisar" placeholder="Pesquisar nome ou código" value={q} onChange={(e) => setQ(e.target.value)} inputClassName="pl-9" className="pl-9" />
        </div>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ ...EMPTY }); }}>Novo produto</Button>
      </Toolbar>
      <Table columns={columns} rows={list} loading={products.loading && !products.data} onRowClick={(p) => { setError(''); setEditing({ ...EMPTY, ...p, barcode: p.barcode || '', icon: p.icon || null }); }} empty={<p className="py-10 text-center text-ink-muted">{q ? 'Nenhum produto encontrado.' : 'Ainda não há produtos.'}</p>} />

      <Drawer
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Editar produto' : 'Novo produto'}
        description={editing?.id ? undefined : 'Para produtos que ainda não tem. Se não estiver no catálogo do Genesis, avisamos a equipa para o acrescentar.'}
        footer={(
          <>
            {editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={() => remove(editing)}>Remover</Button>}
            <Button onClick={() => setEditing(null)}>Cancelar</Button>
            {editing?.id && <Button icon={Boxes} loading={saving} disabled={!canSave} onClick={() => save(true)}>Stock</Button>}
            <Button variant="primary" loading={saving} disabled={!canSave} onClick={() => save(false)}>Guardar</Button>
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
                <p className="text-xs text-ink-muted">Aparece no terminal do balcão. Sem foto, mostra o ícone escolhido abaixo.</p>
              </div>
              <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden" aria-label="Foto do produto" onChange={onPhoto} />
            </div>
            <Input label="Nome" value={editing.name} onChange={(e) => set('name')(e.target.value)} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Categoria" list="categorias" value={editing.category} onChange={(e) => set('category')(e.target.value)} />
              <Input label="Código de barras" value={editing.barcode} onChange={(e) => set('barcode')(e.target.value)} inputClassName="num" />
            </div>
            <datalist id="categorias">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <IconPicker product={editing} value={editing.icon} onChange={set('icon')} />
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Preço de compra" hint="Quanto paga por unidade" valueCents={editing.cost_price} onChangeCents={set('cost_price')} />
              <MoneyInput label="Preço de venda" hint="Quanto cobra ao cliente" valueCents={editing.sell_price} onChangeCents={set('sell_price')} />
            </div>
            {editing.sell_price > 0 && editing.sell_price <= editing.cost_price && <Alert tone="warning">O preço de venda não cobre o custo.</Alert>}
            <Input label="Stock mínimo" hint="Alerta abaixo deste valor" inputMode="numeric" value={editing.min_stock} onChange={(e) => set('min_stock')(e.target.value.replace(/\D/g, ''))} />
            <label className="flex items-center gap-2 text-base text-ink-2">
              <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={editing.has_expiry} onChange={(e) => set('has_expiry')(e.target.checked)} />
              Produto com validade
            </label>
            {editing.id ? (
              <ProductLots productId={editing.id} hasExpiry={editing.has_expiry} onChanged={() => products.reload()} />
            ) : (
              <section className="rounded-lg border border-border p-3">
                <h3 className="font-medium text-ink">Stock que já tem</h3>
                <p className="mb-3 text-sm text-ink-muted">{editing.has_expiry ? 'Se as unidades não expiram todas no mesmo dia, separe-as (ex.: 50 a 17/10 e 50 a 20/10).' : 'Deixe vazio se ainda não tem nenhuma unidade.'}</p>
                <div className="flex flex-col gap-2">
                  {editing.lots.map((l, i) => (
                    <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-end gap-2">
                      <Input label={i === 0 ? 'Quantidade' : undefined} aria-label={`Quantidade ${i + 1}`} inputMode="numeric" value={l.quantity} onChange={(e) => setLot(i, 'quantity')(e.target.value.replace(/\D/g, ''))} inputClassName="num" />
                      {editing.has_expiry ? <Input label={i === 0 ? 'Validade' : undefined} aria-label={`Validade ${i + 1}`} type="date" value={l.expiry_date} onChange={(e) => setLot(i, 'expiry_date')(e.target.value)} /> : <span />}
                      {editing.lots.length > 1 ? <IconButton label="Tirar esta linha" icon={Trash2} onClick={() => setEditing((e) => ({ ...e, lots: e.lots.filter((_, j) => j !== i) }))} /> : <span className="w-9" />}
                    </div>
                  ))}
                </div>
                {editing.has_expiry && <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => setEditing((e) => ({ ...e, lots: [...e.lots, { quantity: '', expiry_date: '' }] }))}>Outra validade</Button>}
                {!lotsValid && <p className="mt-2 text-sm text-danger">Indique a validade de cada linha.</p>}
                {newStock > 0 && (
                  <Select className="mt-3" label="Fornecedor (opcional)" hint="Se comprou agora a um fornecedor, o custo de entrega dele entra no relatório mensal." value={editing.supplier_id} onChange={(e) => set('supplier_id')(e.target.value)}>
                    <option value="">Sem fornecedor (já tinha este stock)</option>
                    {(suppliers.data || []).filter((s) => s.is_active !== false).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                )}
                {newStock > 0 && <p className="mt-2 text-sm text-ink-2">Total: <span className="num font-medium text-ink">{int(newStock)} un.</span></p>}
              </section>
            )}
          </div>
        )}
      </Drawer>
    </>
  );
}

// Escolha do icone (relampago para energeticos, gota para agua...). "Automatico"
// usa o icone da categoria.
function IconPicker({ product, value, onChange }) {
  const Auto = categoryIcon(product.category, product.name);
  const chosen = PRODUCT_ICONS.find((i) => i.key === value);
  const btn = (active) => cx('flex h-10 items-center justify-center rounded border', active ? 'border-accent bg-accent-soft text-accent-text' : 'border-border text-ink-2 hover:bg-subtle');
  return (
    <div role="radiogroup" aria-label="Ícone do produto">
      <p className="mb-1.5 text-sm font-medium text-ink">Ícone</p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        <button type="button" role="radio" aria-checked={!value} aria-label="Automático (pela categoria)" title="Automático (pela categoria)" className={btn(!value)} onClick={() => onChange(null)}><Auto size={18} strokeWidth={1.8} /></button>
        {PRODUCT_ICONS.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="radio" aria-checked={value === key} aria-label={label} title={label} className={btn(value === key)} onClick={() => onChange(key)}><Icon size={18} strokeWidth={1.8} /></button>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{chosen ? chosen.label : 'Automático, pela categoria'}. Com foto, a foto aparece no lugar do ícone.</p>
    </div>
  );
}

// Stock actual e validades por lote, no proprio produto. Mudar a validade de
// so parte das unidades divide o lote (ex.: 20 das 50 com outra data).
function ProductLots({ productId, hasExpiry, onChanged }) {
  const { data, error, reload } = useApi(`/api/products/${productId}/lots`);
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <Skeleton className="h-20 w-full" />;
  return (
    <section className="rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium text-ink">Stock actual</h3>
        <span className="num text-lg font-semibold text-ink">{int(data.stock_qty)} un.</span>
      </div>
      <p className="mb-2 text-sm text-ink-muted">Para mudar a quantidade use o botão «Stock» em baixo.{hasExpiry ? ' Validades: mude a data aqui; para só parte das unidades, mude também o número.' : ''}</p>
      {hasExpiry && (data.lots.length === 0 ? <p className="text-sm text-ink-muted">Sem unidades em stock.</p> : (
        <div className="flex flex-col gap-2">
          {data.lots.map((l) => <LotRow key={l.id + (l.expiry_date || '')} productId={productId} lot={l} onSaved={() => { reload(); onChanged(); }} />)}
        </div>
      ))}
    </section>
  );
}

function LotRow({ productId, lot, onSaved }) {
  const toast = useToast();
  const [date, setDate] = useState(lot.expiry_date || '');
  const [qty, setQty] = useState(String(lot.quantity));
  const [busy, setBusy] = useState(false);
  const n = Number(qty);
  const validQty = n > 0 && n <= lot.quantity;
  const dirty = date !== (lot.expiry_date || '') || n !== lot.quantity;
  async function save() {
    setBusy(true);
    try {
      await api.patch(`/api/products/${productId}/lots/${lot.id}`, { expiry_date: date || null, ...(n < lot.quantity ? { quantity: n } : {}) });
      toast(n < lot.quantity ? `${n} un. passam a ter outra validade.` : 'Validade guardada.');
      onSaved();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(false); }
  }
  return (
    <div className="border-t border-border pt-2 first:border-t-0 first:pt-0">
      <p className="mb-1 text-xs text-ink-muted">Lote de {int(lot.quantity)} un.{lot.expiry_date ? '' : ' · sem validade'}</p>
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] items-end gap-2">
        <Input label="Unidades" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} inputClassName="num" />
        <Input label="Validade" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button loading={busy} disabled={!dirty || !validQty} onClick={save}>Guardar</Button>
      </div>
    </div>
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

  function open(m, productId = '') { setError(''); const p = active.find((x) => x.id === productId); setForm({ product_id: p ? p.id : '', quantity: '', unit_cost: p?.cost_price || 0, supplier_id: '', delta: '', reason: '', expiry_date: '' }); setMode(m); }
  // Vindo do botao "Stock" do produto: abre o ajuste com o produto ja escolhido.
  const [params, setParams] = useSearchParams();
  const target = params.get('ajustar');
  useEffect(() => {
    if (!target || !products.data) return;
    open('adjust', target);
    setParams({ tab: 'stock' }, { replace: true });
  }, [target, products.data]); // eslint-disable-line react-hooks/exhaustive-deps
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
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
