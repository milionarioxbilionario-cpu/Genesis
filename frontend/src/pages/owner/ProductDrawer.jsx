import React, { useMemo, useRef, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Boxes, Camera, Plus, ScanBarcode, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { int, errorMessage } from '../../utils/format';
import { formatQty, isMeasured, parseQty, qtyInput } from '../../utils/units';
import { photoToDataUrl } from '../../utils/imageResize';
import { useI18n } from '../../i18n/react';
import BarcodeScanner from '../../components/BarcodeScanner';
import { Button, Drawer, IconButton, Input, MoneyInput, PRODUCT_ICONS, ProductImage, Select, Skeleton, categoryIcon, cx, useConfirm, useToast, Alert } from '../../components/ui';

// Formulario do produto (novo ou editar). Usado pelo Catalogo ("Novo produto")
// e pelo separador Stock ("Entrada de stock" = produto que a loja ainda nao
// tem, Fase 8.3).
export const EMPTY_PRODUCT = { name: '', category: 'Geral', barcode: '', image_url: null, icon: null, unit: 'un', sell_price: 0, cost_price: 0, min_stock: 5, has_expiry: false, lots: [{ quantity: '', expiry_date: '' }], supplier_id: '' };

export const emptyLot = () => ({ quantity: '', expiry_date: '' });
// Fase 15.5: a quantidade escrita (1,25 kg) passa a milesimos inteiros pela unidade do produto.
export const lotQty = (l, unit = 'un') => parseQty(l.quantity, unit) || 0;
export const filledLots = (lots, unit = 'un') => lots.filter((l) => lotQty(l, unit) > 0);
// «12 un.» ou «1,25 kg».
export const qtyLabel = (q, unit, t) => (isMeasured(unit) ? formatQty(q, unit) : `${int(q)} ${t('un.')}`);

// Linhas quantidade + validade ("Outra validade" para separar 50 a 17/10 e 50 a
// 20/10). `withExpiry`: mostra a coluna da validade; `expiryRequired`: cada
// linha com quantidade precisa de data.
export function LotRows({ lots, onChange, withExpiry, expiryRequired = withExpiry, unit = 'un' }) {
  const { t } = useI18n();
  const setLot = (i, k, v) => onChange(lots.map((l, j) => (j === i ? { ...l, [k]: v } : l)));
  const missing = expiryRequired && filledLots(lots, unit).some((l) => !l.expiry_date);
  const clean = (v) => (isMeasured(unit) ? v.replace(/[^\d.,]/g, '') : v.replace(/\D/g, ''));
  return (
    <>
      <div className="flex flex-col gap-2">
        {lots.map((l, i) => (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] items-end gap-2">
            <Input label={i === 0 ? (isMeasured(unit) ? t('Quantidade ({unit})', { unit }) : t('Quantidade')) : undefined} aria-label={t('Quantidade {n}', { n: i + 1 })} inputMode={isMeasured(unit) ? 'decimal' : 'numeric'} value={l.quantity} onChange={(e) => setLot(i, 'quantity', clean(e.target.value))} inputClassName="num" />
            {withExpiry ? <Input label={i === 0 ? (expiryRequired ? t('Validade') : t('Validade (opcional)')) : undefined} aria-label={t('Validade {n}', { n: i + 1 })} type="date" value={l.expiry_date} onChange={(e) => setLot(i, 'expiry_date', e.target.value)} /> : <span />}
            {lots.length > 1 ? <IconButton label={t('Tirar esta linha')} icon={Trash2} onClick={() => onChange(lots.filter((_, j) => j !== i))} /> : <span className="w-9" />}
          </div>
        ))}
      </div>
      {withExpiry && <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => onChange([...lots, emptyLot()])}>{t('Outra validade')}</Button>}
      {missing && <p className="mt-2 text-sm text-danger">{t('Indique a validade de cada linha.')}</p>}
    </>
  );
}

// `entry`: aberto pela "Entrada de stock" (titulo e textos de compra).
export default function ProductDrawer({ editing, setEditing, products, entry = false }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useI18n();
  const [, setParams] = useSearchParams();
  const suppliers = useApi('/api/inventory/suppliers');
  const withVat = (useOutletContext() || {}).tenant?.vat_mode === 'iva';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const photoInput = useRef(null);
  const categories = useMemo(() => [...new Set((products.data || []).map((p) => p.category))].sort(), [products.data]);

  async function onPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try { const url = await photoToDataUrl(file); setEditing((x) => ({ ...x, image_url: url })); } catch (err) { setError(t(err.message)); }
  }
  const set = (k) => (v) => setEditing((e) => ({ ...e, [k]: v }));
  const unit = editing?.unit || 'un';
  const measured = isMeasured(unit);
  const newLots = editing && !editing.id ? filledLots(editing.lots, unit) : [];
  const newStock = newLots.reduce((s, l) => s + lotQty(l, unit), 0);
  // Stock minimo: nos produtos a peso escreve-se em kg (guarda-se em gramas).
  const minText = editing ? (editing.min_text ?? (measured ? qtyInput(editing.min_stock, unit) : String(editing.min_stock ?? ''))) : '';
  const lotsValid = !editing || editing.id || !editing.has_expiry || newLots.every((l) => l.expiry_date);
  const close = () => { setError(''); setEditing(null); };

  // goStock: guarda e abre o separador Stock com este produto ja escolhido.
  async function save(goStock = false) {
    setSaving(true); setError('');
    const body = {
      name: editing.name.trim(), category: editing.category.trim() || 'Geral', barcode: editing.barcode.trim() || null,
      image_url: editing.image_url || null, icon: editing.icon || null,
      sell_price: editing.sell_price, cost_price: editing.cost_price, min_stock: (measured ? parseQty(minText, unit) : Number(minText)) || 0, unit,
      has_expiry: editing.has_expiry,
      ...(withVat ? { vat_rate: editing.vat_rate === 0 ? 0 : null } : {}),
    };
    try {
      let id = editing.id;
      if (id) await api.patch('/api/products/' + id, body);
      else {
        const lots = newLots.map((l) => ({ quantity: lotQty(l, unit), expiry_date: editing.has_expiry && l.expiry_date ? l.expiry_date : null }));
        id = (await api.post('/api/products', { ...body, lots, supplier_id: newStock > 0 && editing.supplier_id ? editing.supplier_id : null })).data.id;
      }
      toast(editing.id ? t('Produto actualizado.')
        : entry ? (newStock ? t('Entrada registada: {name} ({n}).', { name: editing.name.trim(), n: qtyLabel(newStock, unit, t) }) : t('Entrada registada: {name}.', { name: editing.name.trim() }))
          : t('Produto criado.'));
      close();
      products.reload();
      if (goStock) setParams({ tab: 'stock', ajustar: id });
    } catch (err) { setError(errorMessage(err)); } finally { setSaving(false); }
  }
  async function remove(p) {
    if (!(await confirm({ title: t('Remover produto'), message: t('"{name}" deixa de aparecer no terminal. O histórico de vendas mantém-se.', { name: p.name }), confirmLabel: t('Remover'), danger: true }))) return;
    try { await api.delete('/api/products/' + p.id); toast(t('Produto removido.')); close(); products.reload(); } catch (err) { toast(errorMessage(err), 'danger'); }
  }
  const canSave = editing?.name?.trim() && editing?.sell_price && lotsValid;

  return (
    <Drawer
      open={Boolean(editing)}
      onClose={close}
      title={editing?.id ? t('Editar produto') : entry ? t('Entrada de stock') : t('Novo produto')}
      description={editing?.id ? undefined : entry
        ? t('Para um produto que a loja ainda não tem. Para mais unidades de um produto que já tem, use «Ajuste manual» › Adicionar.')
        : t('Para produtos que ainda não tem. Se não estiver no catálogo do Genesis, avisamos a equipa para o acrescentar.')}
      footer={(
        <>
          {editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={() => remove(editing)}>{t('Remover')}</Button>}
          <Button onClick={close}>{t('Cancelar')}</Button>
          {editing?.id && <Button icon={Boxes} loading={saving} disabled={!canSave} onClick={() => save(true)}>{t('Stock')}</Button>}
          <Button variant="primary" loading={saving} disabled={!canSave} onClick={() => save(false)}>{t('Guardar')}</Button>
        </>
      )}
    >
      {editing && (
        <div className="flex flex-col gap-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <div className="flex items-center gap-4">
            <ProductImage product={editing} size={72} />
            <div className="flex flex-col items-start gap-1.5">
              <Button size="sm" icon={Camera} onClick={() => photoInput.current?.click()}>{editing.image_url ? t('Trocar foto') : t('Tirar ou carregar foto')}</Button>
              {editing.image_url && <Button size="sm" variant="ghost" onClick={() => set('image_url')(null)}>{t('Remover foto')}</Button>}
              <p className="text-xs text-ink-muted">{t('Aparece no terminal do balcão. Sem foto, mostra o ícone escolhido abaixo.')}</p>
            </div>
            <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden" aria-label={t('Foto do produto')} onChange={onPhoto} />
          </div>
          <Input label={t('Nome')} value={editing.name} onChange={(e) => set('name')(e.target.value)} autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('Categoria')} list="categorias" value={editing.category} onChange={(e) => set('category')(e.target.value)} />
            <div className="flex items-end gap-1.5">
              <Input label={t('Código de barras')} value={editing.barcode || ''} onChange={(e) => set('barcode')(e.target.value)} inputClassName="num" className="min-w-0 flex-1" />
              <IconButton label={t('Ler código com a câmara')} icon={ScanBarcode} variant="secondary" className="h-10 w-10 shrink-0" onClick={() => setScanning(true)} />
            </div>
          </div>
          <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onCode={(code) => { set('barcode')(code); return { ok: true, message: t('Código lido: {code}', { code }) }; }} />
          <datalist id="categorias">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          <IconPicker product={editing} value={editing.icon} onChange={set('icon')} />
          <div className="grid grid-cols-2 gap-3">
            <MoneyInput label={measured ? t('Preço de compra (por {unit})', { unit }) : t('Preço de compra')} hint={measured ? t('Quanto paga por {unit}', { unit }) : t('Quanto paga por unidade')} valueCents={editing.cost_price} onChangeCents={set('cost_price')} />
            <MoneyInput label={measured ? t('Preço de venda (por {unit})', { unit }) : t('Preço de venda')} hint={t('Quanto cobra ao cliente')} valueCents={editing.sell_price} onChangeCents={set('sell_price')} />
          </div>
          {editing.sell_price > 0 && editing.sell_price <= editing.cost_price && <Alert tone="warning">{t('O preço de venda não cobre o custo.')}</Alert>}
          {withVat && (
            <Select label={t('IVA')} hint={t('O preço de venda já inclui o IVA.')} value={editing.vat_rate === 0 ? '0' : '16'} onChange={(e) => set('vat_rate')(e.target.value === '0' ? 0 : null)}>
              <option value="16">{t('Taxa normal (16%)')}</option>
              <option value="0">{t('Isento (arroz, pão, farinha de milho…)')}</option>
            </Select>
          )}
          <Select label={t('Vende-se por')} hint={editing.id && editing.stock_qty ? t('Com stock ou vendas a unidade já não muda.') : t('Para vender ao peso (carne, açúcar a granel, peixe…), escolha kg.')} value={unit} disabled={Boolean(editing.id && editing.stock_qty)} onChange={(e) => setEditing((x) => ({ ...x, unit: e.target.value, min_text: undefined, lots: [emptyLot()] }))}>
            <option value="un">{t('Unidade')}</option>
            <option value="kg">{t('Peso (kg)')}</option>
            <option value="l">{t('Litro (l)')}</option>
            <option value="m">{t('Metro (m)')}</option>
          </Select>
          <Input label={measured ? t('Stock mínimo ({unit})', { unit }) : t('Stock mínimo')} hint={t('Alerta abaixo deste valor')} inputMode={measured ? 'decimal' : 'numeric'} value={minText} onChange={(e) => set('min_text')(measured ? e.target.value.replace(/[^\d.,]/g, '') : e.target.value.replace(/\D/g, ''))} />
          <label className="flex items-center gap-2 text-base text-ink-2">
            <input type="checkbox" className="h-4 w-4 accent-[color:var(--accent)]" checked={editing.has_expiry} onChange={(e) => set('has_expiry')(e.target.checked)} />
            {t('Produto com validade')}
          </label>
          {editing.id ? (
            <ProductLots productId={editing.id} hasExpiry={editing.has_expiry} unit={unit} onChanged={() => products.reload()} />
          ) : (
            <section className="rounded-lg border border-border p-3">
              <h3 className="font-medium text-ink">{entry ? t('Unidades que entram') : t('Stock que já tem')}</h3>
              <p className="mb-3 text-sm text-ink-muted">{editing.has_expiry ? t('Se as unidades não expiram todas no mesmo dia, separe-as (ex.: 50 a 17/10 e 50 a 20/10).') : entry ? t('Quantas unidades recebeu.') : t('Deixe vazio se ainda não tem nenhuma unidade.')}</p>
              <LotRows lots={editing.lots} onChange={set('lots')} withExpiry={editing.has_expiry} unit={unit} />
              {newStock > 0 && (
                <Select className="mt-3" label={t('Fornecedor (opcional)')} hint={t('Se comprou agora a um fornecedor, o custo de entrega dele entra no relatório mensal.')} value={editing.supplier_id} onChange={(e) => set('supplier_id')(e.target.value)}>
                  <option value="">{entry ? t('Sem fornecedor') : t('Sem fornecedor (já tinha este stock)')}</option>
                  {(suppliers.data || []).filter((s) => s.is_active !== false).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Select>
              )}
              {newStock > 0 && <p className="mt-2 text-sm text-ink-2">{t('Total:')} <span className="num font-medium text-ink">{qtyLabel(newStock, unit, t)}</span></p>}
            </section>
          )}
        </div>
      )}
    </Drawer>
  );
}

// Escolha do icone (relampago para energeticos, gota para agua...). "Automatico"
// usa o icone da categoria. O label de cada icone e a chave da traducao.
function IconPicker({ product, value, onChange }) {
  const { t } = useI18n();
  const Auto = categoryIcon(product.category, product.name);
  const chosen = PRODUCT_ICONS.find((i) => i.key === value);
  const btn = (active) => cx('flex h-10 items-center justify-center rounded border', active ? 'border-accent bg-accent-soft text-accent-text' : 'border-border text-ink-2 hover:bg-subtle');
  return (
    <div role="radiogroup" aria-label={t('Ícone do produto')}>
      <p className="mb-1.5 text-sm font-medium text-ink">{t('Ícone')}</p>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8">
        <button type="button" role="radio" aria-checked={!value} aria-label={t('Automático (pela categoria)')} title={t('Automático (pela categoria)')} className={btn(!value)} onClick={() => onChange(null)}><Auto size={18} strokeWidth={1.8} /></button>
        {PRODUCT_ICONS.map(({ key, label, Icon }) => (
          <button key={key} type="button" role="radio" aria-checked={value === key} aria-label={t(label)} title={t(label)} className={btn(value === key)} onClick={() => onChange(key)}><Icon size={18} strokeWidth={1.8} /></button>
        ))}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{chosen ? t(chosen.label) : t('Automático, pela categoria')}. {t('Com foto, a foto aparece no lugar do ícone.')}</p>
    </div>
  );
}

// Stock actual e validades por lote, no proprio produto. Mudar a validade de
// so parte das unidades divide o lote (ex.: 20 das 50 com outra data).
function ProductLots({ productId, hasExpiry, unit = 'un', onChanged }) {
  const { t } = useI18n();
  const { data, error, reload } = useApi(`/api/products/${productId}/lots`);
  if (error) return <Alert tone="danger">{error}</Alert>;
  if (!data) return <Skeleton className="h-20 w-full" />;
  return (
    <section className="rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium text-ink">{t('Stock actual')}</h3>
        <span className="num text-lg font-semibold text-ink">{qtyLabel(data.stock_qty, unit, t)}</span>
      </div>
      <p className="mb-2 text-sm text-ink-muted">{t('Para mudar a quantidade use o botão «Stock» em baixo.')}{hasExpiry ? ' ' + t('Validades: mude a data aqui; para só parte das unidades, mude também o número.') : ''}</p>
      {hasExpiry && (data.lots.length === 0 ? <p className="text-sm text-ink-muted">{t('Sem unidades em stock.')}</p> : (
        <div className="flex flex-col gap-2">
          {data.lots.map((l) => <LotRow key={l.id + (l.expiry_date || '')} productId={productId} lot={l} unit={unit} onSaved={() => { reload(); onChanged(); }} />)}
        </div>
      ))}
    </section>
  );
}

function LotRow({ productId, lot, unit = 'un', onSaved }) {
  const toast = useToast();
  const { t } = useI18n();
  const [date, setDate] = useState(lot.expiry_date || '');
  const [qty, setQty] = useState(qtyInput(lot.quantity, unit));
  const [busy, setBusy] = useState(false);
  const n = parseQty(qty, unit) || 0;
  const validQty = n > 0 && n <= lot.quantity;
  const dirty = date !== (lot.expiry_date || '') || n !== lot.quantity;
  async function save() {
    setBusy(true);
    try {
      await api.patch(`/api/products/${productId}/lots/${lot.id}`, { expiry_date: date || null, ...(n < lot.quantity ? { quantity: n } : {}) });
      toast(n < lot.quantity ? t('{n} passam a ter outra validade.', { n: qtyLabel(n, unit, t) }) : t('Validade guardada.'));
      onSaved();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(false); }
  }
  return (
    <div className="border-t border-border pt-2 first:border-t-0 first:pt-0">
      <p className="mb-1 text-xs text-ink-muted">{t('Lote de {n}', { n: qtyLabel(lot.quantity, unit, t) })}{lot.expiry_date ? '' : ' · ' + t('sem validade')}</p>
      <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)_auto] items-end gap-2">
        <Input label={isMeasured(unit) ? t('Quantidade ({unit})', { unit }) : t('Unidades')} inputMode={isMeasured(unit) ? 'decimal' : 'numeric'} value={qty} onChange={(e) => setQty(isMeasured(unit) ? e.target.value.replace(/[^\d.,]/g, '') : e.target.value.replace(/\D/g, ''))} inputClassName="num" />
        <Input label={t('Validade')} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Button loading={busy} disabled={!dirty || !validQty} onClick={save}>{t('Guardar')}</Button>
      </div>
    </div>
  );
}
