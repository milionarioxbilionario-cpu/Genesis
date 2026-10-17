import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, dateTime, errorMessage } from '../../utils/format';
import { foldText, productMatches } from '../../utils/search';
import { useI18n } from '../../i18n/react';
import ShoppingLists from './ShoppingLists';
import ProductDrawer, { EMPTY_PRODUCT, LotRows, emptyLot, filledLots } from './ProductDrawer';
import { Alert, Badge, Button, Drawer, Input, MoneyInput, PageHeader, ProductImage, Segmented, Select, Table, Tabs, Toolbar, useToast } from '../../components/ui';

const stockTone = (p) => (p.stock_qty <= 0 ? 'danger' : p.stock_qty <= 10 ? 'danger' : p.stock_qty <= 20 ? 'warning' : p.stock_qty <= (p.min_stock || 0) ? 'warning' : 'neutral');

export default function Products() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'catalog';
  const products = useApi('/api/products');
  return (
    <>
      <PageHeader title={t('Produtos')} description={t('Catálogo, stock e custos de compra.')} />
      <Tabs className="mb-5" value={tab} onChange={(v) => setParams({ tab: v })} items={[
        { value: 'catalog', label: t('Catálogo'), count: products.data?.filter((p) => p.is_active).length },
        { value: 'stock', label: t('Stock') },
        { value: 'shopping', label: t('Lista de compras') },
        { value: 'prices', label: t('Histórico de custos') },
      ]} />
      {tab === 'catalog' && <Catalog products={products} />}
      {tab === 'stock' && <Stock products={products} />}
      {tab === 'shopping' && <ShoppingLists products={products} />}
      {tab === 'prices' && <PriceHistory />}
    </>
  );
}

function Catalog({ products }) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null);
  const list = useMemo(() => { const f = foldText(q); return (products.data || []).filter((p) => p.is_active && (productMatches(p, f) || (p.barcode || '').includes(q.trim()))); }, [products.data, q]);

  const columns = [
    { key: 'name', header: t('Produto'), render: (p) => <div className="flex items-center gap-3"><ProductImage product={p} size={36} /><div><p className="text-ink">{p.name}</p>{p.barcode && <p className="num text-xs text-ink-muted">{p.barcode}</p>}</div></div> },
    { key: 'category', header: t('Categoria'), render: (p) => <span className="text-ink-2">{p.category}</span> },
    { key: 'sell', header: t('Preço'), align: 'right', render: (p) => money(p.sell_price) },
    { key: 'cost', header: t('Custo'), align: 'right', render: (p) => <span className="text-ink-2">{money(p.cost_price)}</span> },
    { key: 'margin', header: t('Margem'), align: 'right', render: (p) => (p.sell_price > 0 ? <span className={p.sell_price <= p.cost_price ? 'text-danger' : 'text-ink-2'}>{Math.round(((p.sell_price - p.cost_price) / p.sell_price) * 100)}%</span> : '—') },
    { key: 'stock', header: t('Stock'), align: 'right', render: (p) => <Badge tone={stockTone(p)}>{int(p.stock_qty)}</Badge> },
  ];

  return (
    <>
      <Toolbar>
        <div className="relative w-full max-w-xs">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <Input aria-label={t('Pesquisar')} placeholder={t('Pesquisar nome ou código')} value={q} onChange={(e) => setQ(e.target.value)} inputClassName="pl-9" className="pl-9" />
        </div>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => setEditing({ ...EMPTY_PRODUCT })}>{t('Novo produto')}</Button>
      </Toolbar>
      <Table columns={columns} rows={list} loading={products.loading && !products.data} onRowClick={(p) => setEditing({ ...EMPTY_PRODUCT, ...p, barcode: p.barcode || '', icon: p.icon || null })} empty={<p className="py-10 text-center text-ink-muted">{q ? t('Nenhum produto encontrado.') : t('Ainda não há produtos.')}</p>} />
      <ProductDrawer editing={editing} setEditing={setEditing} products={products} />
    </>
  );
}

// Separador Stock (Fase 8.3):
//  - "Entrada de stock" = produto que a loja ainda nao tem -> o formulario de
//    produto novo (nome, custo, preco, validades por lote, fornecedor);
//  - "Ajuste manual" = produto que ja existe: Adicionar (compra ou contagem a
//    mais, com validades, custo e fornecedor) ou Retirar (com motivo). A
//    quantidade e sempre positiva; o botao diz se entra ou sai.
const emptyAdjust = (p) => ({ product_id: p ? p.id : '', op: 'add', lots: [emptyLot()], unit_cost: p?.cost_price || 0, supplier_id: '', quantity: '', reason: '' });

function Stock({ products }) {
  const toast = useToast();
  const { t } = useI18n();
  const entries = useApi('/api/inventory/stock');
  const suppliers = useApi('/api/inventory/suppliers');
  const alerts = useApi('/api/owner/alerts');
  const [newProduct, setNewProduct] = useState(null);
  const [adjusting, setAdjusting] = useState(false);
  const [form, setForm] = useState(emptyAdjust());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const active = (products.data || []).filter((p) => p.is_active);
  const low = active.filter((p) => p.stock_qty <= Math.max(p.min_stock || 0, 20)).sort((a, b) => a.stock_qty - b.stock_qty);
  const lots = alerts.data?.expiringLots || [];
  const product = active.find((p) => p.id === form.product_id);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const addLots = filledLots(form.lots);
  const addTotal = addLots.reduce((s, l) => s + Number(l.quantity), 0);
  const removeQty = Number(form.quantity) || 0;
  const canSave = product && (form.op === 'add'
    ? addTotal > 0 && (!product.has_expiry || addLots.every((l) => l.expiry_date))
    : removeQty > 0 && removeQty <= product.stock_qty && form.reason.trim().length >= 3);

  function openAdjust(productId = '') { setError(''); setForm(emptyAdjust(active.find((x) => x.id === productId))); setAdjusting(true); }
  // Vindo do botao "Stock" do produto: abre o ajuste com o produto ja escolhido.
  const [params, setParams] = useSearchParams();
  const target = params.get('ajustar');
  useEffect(() => {
    if (!target || !products.data) return;
    openAdjust(target);
    setParams({ tab: 'stock' }, { replace: true });
  }, [target, products.data]); // eslint-disable-line react-hooks/exhaustive-deps
  // O produto novo criado pela "Entrada de stock" aparece logo nos movimentos.
  useEffect(() => { if (!newProduct) { entries.reload(); alerts.reload(); } }, [newProduct]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save() {
    setSaving(true); setError('');
    try {
      if (form.op === 'add') {
        await api.post('/api/inventory/stock', {
          product_id: product.id, unit_cost: form.unit_cost, supplier_id: form.supplier_id || null,
          lots: addLots.map((l) => ({ quantity: Number(l.quantity), expiry_date: l.expiry_date || null })),
        });
        toast(t('{n} un. de {name} adicionadas.', { n: int(addTotal), name: product.name }));
      } else {
        await api.patch(`/api/products/${product.id}/stock`, { delta: -removeQty, reason: form.reason.trim() });
        toast(t('{n} un. de {name} retiradas. Fica na auditoria com o motivo.', { n: int(removeQty), name: product.name }));
      }
      setAdjusting(false); products.reload(); entries.reload(); alerts.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }

  return (
    <>
      <Toolbar>
        <Button variant="primary" icon={Plus} onClick={() => setNewProduct({ ...EMPTY_PRODUCT })}>{t('Entrada de stock')}</Button>
        <Button onClick={() => openAdjust()}>{t('Ajuste manual')}</Button>
      </Toolbar>
      {lots.length > 0 && (
        <div className="mb-5">
          <h2 className="mb-1 font-semibold text-ink">{t('Validades')}</h2>
          <p className="mb-2 text-sm text-ink-muted">{t('Lotes que expiram nos próximos {n} dias. No dia seguinte à validade, o Genesis regista sozinho a perda e tira-os do stock.', { n: alerts.data.alertDays })}</p>
          <Table
            columns={[
              { key: 'name', header: t('Produto'), render: (l) => <div><p className="text-ink">{l.name}</p>{l.barcode && <p className="num text-xs text-ink-muted">{l.barcode}</p>}</div> },
              { key: 'qty', header: t('Deste lote'), align: 'right', render: (l) => <span>{t('{a} de {b} un.', { a: int(l.quantity), b: int(l.product_stock ?? l.quantity) })}</span> },
              { key: 'expiry', header: t('Validade'), render: (l) => date(l.expiry_date) },
              { key: 'left', header: '', align: 'right', render: (l) => <Badge tone={l.days_left < 0 ? 'danger' : l.days_left <= 2 ? 'danger' : 'warning'}>{l.days_left < 0 ? t('Expirado') : l.days_left === 0 ? t('Expira hoje') : t('{n} dia(s)', { n: l.days_left })}</Badge> },
              { key: 'value', header: t('Valor (custo)'), align: 'right', render: (l) => money(l.value) },
            ]}
            rows={lots}
            rowKey="lot_id"
          />
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <h2 className="mb-2 font-semibold text-ink">{t('A repor')}</h2>
          <Table
            columns={[
              { key: 'name', header: t('Produto') },
              { key: 'stock_qty', header: t('Stock'), align: 'right', render: (p) => <Badge tone={stockTone(p)}>{int(p.stock_qty)}</Badge> },
            ]}
            rows={low}
            loading={products.loading && !products.data}
            empty={<p className="py-8 text-center text-ink-muted">{t('Nada a repor.')}</p>}
          />
        </div>
        <div className="lg:col-span-3">
          <h2 className="mb-2 font-semibold text-ink">{t('Últimos movimentos')}</h2>
          <Table
            columns={[
              { key: 'created_at', header: t('Data'), render: (e) => dateTime(e.created_at) },
              { key: 'product', header: t('Produto'), render: (e) => e.product?.name },
              { key: 'quantity', header: t('Qtd.'), align: 'right', render: (e) => <span className={e.quantity < 0 ? 'text-danger' : 'text-positive'}>{e.quantity > 0 ? '+' : ''}{e.quantity}</span> },
              { key: 'unit_cost', header: t('Custo un.'), align: 'right', render: (e) => money(e.unit_cost) },
            ]}
            rows={entries.data || []}
            loading={entries.loading && !entries.data}
            empty={<p className="py-8 text-center text-ink-muted">{t('Sem movimentos.')}</p>}
          />
        </div>
      </div>

      <ProductDrawer editing={newProduct} setEditing={setNewProduct} products={products} entry />
      <Drawer
        open={adjusting}
        onClose={() => setAdjusting(false)}
        title={t('Ajuste manual')}
        description={t('Para um produto que já tem: mais unidades (compra ou contagem) ou unidades que saem. Fica registado na auditoria.')}
        footer={<><Button onClick={() => setAdjusting(false)}>{t('Cancelar')}</Button><Button variant="primary" loading={saving} disabled={!canSave} onClick={save}>
          {form.op === 'add' ? (addTotal > 0 ? t('Adicionar {n} un.', { n: int(addTotal) }) : t('Adicionar')) : (removeQty > 0 ? t('Retirar {n} un.', { n: int(removeQty) }) : t('Retirar'))}
        </Button></>}
      >
        <div className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <Select label={t('Produto')} value={form.product_id} onChange={(e) => { const p = active.find((x) => x.id === e.target.value); setForm((f) => ({ ...emptyAdjust(p), op: f.op })); }}>
            <option value="">{t('Escolher…')}</option>
            {active.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock_qty} {t('un.')})</option>)}
          </Select>
          {product && <p className="text-sm text-ink-2">{t('Stock actual:')} <span className="num font-medium text-ink">{int(product.stock_qty)} {t('un.')}</span></p>}
          <Segmented size="lg" className="w-full" value={form.op} onChange={set('op')} options={[{ value: 'add', label: t('Adicionar') }, { value: 'remove', label: t('Retirar') }]} />
          {form.op === 'add' ? (
            <>
              <section className="rounded-lg border border-border p-3">
                <h3 className="font-medium text-ink">{t('Unidades que entram')}</h3>
                <p className="mb-3 text-sm text-ink-muted">{product?.has_expiry ? t('Se não expiram todas no mesmo dia, separe-as (ex.: 50 a 17/10 e 50 a 20/10).') : t('Com validade, o Genesis avisa antes e regista a perda se não vender.')}</p>
                <LotRows lots={form.lots} onChange={set('lots')} withExpiry expiryRequired={Boolean(product?.has_expiry)} />
                {addTotal > 0 && product && <p className="mt-2 text-sm text-ink-2">{t('Fica com')} <span className="num font-medium text-ink">{int(product.stock_qty + addTotal)} {t('un.')}</span></p>}
              </section>
              <MoneyInput label={t('Custo unitário')} hint={t('Quanto pagou por unidade. Se mudou, o custo do produto é actualizado.')} valueCents={form.unit_cost} onChangeCents={set('unit_cost')} />
              <Select label={t('Fornecedor (opcional)')} hint={t('Se comprou a um fornecedor, o custo de entrega dele entra no relatório mensal.')} value={form.supplier_id} onChange={(e) => set('supplier_id')(e.target.value)}>
                <option value="">{t('Sem fornecedor')}</option>
                {(suppliers.data || []).filter((s) => s.is_active !== false).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </>
          ) : (
            <>
              <Input label={t('Quantidade a retirar')} inputMode="numeric" value={form.quantity} onChange={(e) => set('quantity')(e.target.value.replace(/\D/g, ''))} inputClassName="num"
                hint={product ? t('Saem primeiro as que expiram antes. Fica com {n} un.', { n: int(Math.max(0, product.stock_qty - removeQty)) }) : undefined} />
              {product && removeQty > product.stock_qty && <p className="text-sm text-danger">{t('Só há {n} un. em stock.', { n: int(product.stock_qty) })}</p>}
              <Input label={t('Motivo')} placeholder={t('Ex.: contagem física de fim de mês')} value={form.reason} onChange={(e) => set('reason')(e.target.value)} />
            </>
          )}
        </div>
      </Drawer>
    </>
  );
}

function PriceHistory() {
  const { t } = useI18n();
  const { data, loading } = useApi('/api/inventory/price-history');
  return (
    <Table
      columns={[
        { key: 'changed_at', header: t('Data'), render: (r) => dateTime(r.changed_at) },
        { key: 'product_name', header: t('Produto') },
        { key: 'old', header: t('Custo anterior'), align: 'right', render: (r) => money(r.old_cost) },
        { key: 'new', header: t('Custo novo'), align: 'right', render: (r) => money(r.new_cost) },
        { key: 'var', header: t('Variação'), align: 'right', render: (r) => (r.old_cost ? <span className={r.new_cost > r.old_cost ? 'text-danger' : 'text-positive'}>{r.new_cost > r.old_cost ? '+' : ''}{Math.round(((r.new_cost - r.old_cost) / r.old_cost) * 100)}%</span> : '—') },
        { key: 'changed_by', header: t('Por'), render: (r) => <span className="text-ink-2">{r.changed_by || '—'}</span> },
      ]}
      rows={data || []}
      loading={loading}
      empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não houve mudanças de custo. Cada entrada de stock com custo diferente fica aqui.')}</p>}
    />
  );
}
