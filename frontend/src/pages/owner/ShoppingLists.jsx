import React, { useState } from 'react';
import { MessageCircle, Plus, Sparkles, X } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, errorMessage } from '../../utils/format';
import { locale } from '../../i18n/core';
import { useI18n } from '../../i18n/react';
import { useSeesCosts } from '../../utils/session';
import { Alert, Badge, Button, Drawer, IconButton, Input, KeyValue, Select, Table, Toolbar, useConfirm, useToast } from '../../components/ui';
import { formatQty, isMeasured, lineAmount, parseQty, qtyInput } from '../../utils/units';

// Lista de compras (Produtos -> Lista de compras): gerada da recomendacao de
// restock ou feita a mao, guardada e enviada ao fornecedor por WhatsApp.
// Marcar "recebida" nao mexe no stock: a entrada faz-se em Stock, com o custo
// e a validade reais. label em portugues = chave da traducao.
const STATUS = { draft: { label: 'Rascunho', tone: 'neutral' }, sent: { label: 'Enviada', tone: 'info' }, received: { label: 'Recebida', tone: 'positive' } };
const COVER = [7, 14, 30];

export default function ShoppingLists({ products }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useI18n();
  const lists = useApi('/api/shopping-lists');
  const suppliers = useApi('/api/inventory/suppliers');
  // E2: o gerente faz a lista so com quantidades (o custo e do dono).
  const seesCosts = useSeesCosts();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [addId, setAddId] = useState('');
  const active = (products.data || []).filter((p) => p.is_active);
  const supplier = (suppliers.data || []).find((s) => s.id === editing?.supplier_id);
  const investment = (editing?.items || []).reduce((s, it) => s + lineAmount(it.quantity, it.unit_cost, it.unit), 0);
  const delivery = supplier?.delivery_cost_per_visit || 0;
  const readOnly = editing?.status === 'received';
  const statusLabel = (s) => (STATUS[s] ? t(STATUS[s].label) : s);

  async function suggestion(d) {
    const r = await api.get('/api/shopping-lists/suggestion?days=' + d);
    return r.data.items.map((i) => ({ product_id: i.product_id, product_name: i.name, quantity: i.quantity, unit: i.unit || 'un', unit_cost: i.unit_cost, reason: i.reason }));
  }
  async function openNew(fromSuggestion) {
    setError(''); setAddId('');
    const name = t('Compra de {d}', { d: new Date().toLocaleDateString(locale()) });
    if (!fromSuggestion) { setEditing({ name, supplier_id: '', items: [], status: 'draft' }); return; }
    setBusy('suggest');
    try {
      const items = await suggestion(days);
      setEditing({ name, supplier_id: '', items, status: 'draft' });
      if (items.length === 0) toast(t('O stock actual chega para {n} dias. Pode juntar produtos à mão.', { n: days }));
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function openExisting(row) {
    setError(''); setAddId('');
    try {
      const r = await api.get('/api/shopping-lists/' + row.id);
      setEditing({ ...r.data, supplier_id: r.data.supplier_id || '', items: r.data.items.map(({ product_id, product_name, quantity, unit_cost, unit }) => ({ product_id, product_name, quantity, unit_cost, unit: unit || 'un' })) });
    } catch (err) { setError(errorMessage(err)); }
  }
  const setItem = (id, patch) => setEditing((e) => ({ ...e, items: e.items.map((it) => (it.product_id === id ? { ...it, ...patch } : it)) }));
  function addProduct() {
    const p = active.find((x) => x.id === addId);
    if (!p) return;
    setEditing((e) => ({ ...e, items: [...e.items, { product_id: p.id, product_name: p.name, quantity: 1, unit_cost: p.cost_price || 0 }] }));
    setAddId('');
  }
  async function refill() {
    setBusy('suggest'); setError('');
    try {
      const items = await suggestion(days);
      setEditing((e) => ({ ...e, items }));
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  // Guarda e devolve o id (lista nova ou existente).
  async function persist() {
    const body = { name: editing.name.trim(), supplier_id: editing.supplier_id || null, items: editing.items.map(({ product_id, quantity, unit_cost }) => ({ product_id, quantity, unit_cost })) };
    const r = editing.id ? await api.put('/api/shopping-lists/' + editing.id, body) : await api.post('/api/shopping-lists', body);
    return r.data;
  }
  async function save() {
    setBusy('save'); setError('');
    try { await persist(); toast(t('Lista guardada.')); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function sendWhatsApp() {
    // A janela abre ja (no clique), senao o browser bloqueia o pop-up.
    const win = window.open('', '_blank');
    setBusy('wa'); setError('');
    try {
      const saved = await persist();
      const wa = await api.get(`/api/shopping-lists/${saved.id}/whatsapp`);
      if (win) win.location.href = wa.data.url; else window.location.href = wa.data.url;
      if (saved.status === 'draft') await api.put(`/api/shopping-lists/${saved.id}/status`, { status: 'sent' });
      toast(wa.data.has_phone ? t('Mensagem aberta no WhatsApp.') : t('O fornecedor não tem telefone válido: escolha o contacto no WhatsApp.'));
      setEditing(null); lists.reload();
    } catch (err) { win?.close(); setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function setStatus(status) {
    setBusy('status'); setError('');
    try { await api.put(`/api/shopping-lists/${editing.id}/status`, { status }); toast(status === 'received' ? t('Lista marcada como recebida. Registe a entrada em Stock.') : t('Estado actualizado.')); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function remove() {
    if (!(await confirm({ title: t('Apagar lista'), message: t('"{name}" é apagada.', { name: editing.name }), confirmLabel: t('Apagar'), danger: true }))) return;
    try { await api.delete('/api/shopping-lists/' + editing.id); toast(t('Lista apagada.')); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); }
  }

  const valid = editing && editing.name.trim().length >= 2 && editing.items.length > 0 && editing.items.every((it) => it.quantity > 0);
  const inList = new Set((editing?.items || []).map((it) => it.product_id));

  return (
    <>
      <Toolbar>
        <Select aria-label={t('Cobrir quantos dias')} value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-44">
          {COVER.map((d) => <option key={d} value={d}>{t('Para {n} dias', { n: d })}</option>)}
        </Select>
        <Button variant="primary" icon={Sparkles} loading={busy === 'suggest' && !editing} onClick={() => openNew(true)}>{t('Gerar da recomendação')}</Button>
        <Button icon={Plus} onClick={() => openNew(false)}>{t('Lista vazia')}</Button>
      </Toolbar>
      <p className="mb-3 text-sm text-ink-muted">{t('A recomendação usa o ritmo de vendas das últimas 4 semanas e os pedidos de clientes quando não havia, menos o stock actual.')}</p>
      {(lists.error || (error && !editing)) && <Alert tone="danger" className="mb-3">{lists.error || error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: t('Lista'), render: (l) => <div><p className="text-ink">{l.name}</p><p className="text-xs text-ink-muted">{date(l.created_at)}</p></div> },
          { key: 'supplier', header: t('Fornecedor'), render: (l) => <span className="text-ink-2">{l.supplier_name || '—'}</span> },
          { key: 'status', header: t('Estado'), render: (l) => <Badge tone={STATUS[l.status]?.tone}>{statusLabel(l.status)}</Badge> },
          { key: 'items', header: t('Produtos'), align: 'right', render: (l) => int(l.item_count) },
          ...(seesCosts ? [{ key: 'total', header: t('Total'), align: 'right', render: (l) => money(l.totals.total) }] : []),
        ]}
        rows={lists.data || []}
        loading={lists.loading && !lists.data}
        onRowClick={openExisting}
        empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não há listas. Gere uma a partir da recomendação.')}</p>}
      />

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? editing.name : t('Nova lista de compras')}
        description={editing?.id ? statusLabel(editing.status) : undefined}
        footer={editing && (readOnly ? (
          <><Button variant="danger-ghost" className="mr-auto" onClick={remove}>{t('Apagar')}</Button><Button onClick={() => setEditing(null)}>{t('Fechar')}</Button></>
        ) : (
          <>
            {editing.id && <Button variant="danger-ghost" className="mr-auto" onClick={remove}>{t('Apagar')}</Button>}
            <Button onClick={() => setEditing(null)}>{t('Cancelar')}</Button>
            <Button loading={busy === 'save'} disabled={!valid} onClick={save}>{t('Guardar')}</Button>
            <Button variant="primary" icon={MessageCircle} loading={busy === 'wa'} disabled={!valid} onClick={sendWhatsApp}>{t('Enviar por WhatsApp')}</Button>
          </>
        ))}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {readOnly && <Alert tone="info">{t('Lista recebida. A entrada no stock regista-se em Produtos → Stock → Entrada de stock, com o custo e a validade de cada lote.')}</Alert>}
            <Input label={t('Nome da lista')} value={editing.name} disabled={readOnly} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Select label={t('Fornecedor')} value={editing.supplier_id} disabled={readOnly} onChange={(e) => setEditing({ ...editing, supplier_id: e.target.value })}
              hint={supplier ? (supplier.phone ? (seesCosts ? t('WhatsApp {phone} · entrega {v}', { phone: supplier.phone, v: money(supplier.delivery_cost_per_visit) }) : t('WhatsApp {phone}', { phone: supplier.phone })) : t('Sem telefone: no WhatsApp escolhe o contacto')) : t('Sem fornecedor, o WhatsApp pede para escolher o contacto.')}>
              <option value="">{t('Sem fornecedor')}</option>
              {(suppliers.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium text-ink">{t('Produtos ({n})', { n: editing.items.length })}</p>
                {!readOnly && <Button size="sm" loading={busy === 'suggest'} onClick={refill}>{t('Repor sugestão ({n} dias)', { n: days })}</Button>}
              </div>
              {editing.items.length === 0 ? <p className="rounded border border-border p-4 text-center text-sm text-ink-muted">{t('Sem produtos. Junte abaixo ou use a sugestão.')}</p> : (
                <ul className="divide-y divide-border rounded border border-border">
                  {editing.items.map((it) => (
                    <li key={it.product_id} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-ink">{it.product_name}</p>
                        <p className="num text-xs text-ink-muted">{seesCosts ? <>{money(it.unit_cost)} × {formatQty(it.quantity, it.unit)} = {money(lineAmount(it.quantity, it.unit_cost, it.unit))}</> : formatQty(it.quantity, it.unit)}{it.reason === 'pedido por clientes sem stock' ? ' · ' + t('pedido por clientes') : ''}</p>
                      </div>
                      <Input aria-label={t('Quantidade de {name}', { name: it.product_name })} inputMode="numeric" className="w-20" inputClassName="num text-right" disabled={readOnly}
                        value={it.qty_text ?? qtyInput(it.quantity, it.unit)} onChange={(e) => { const v = isMeasured(it.unit) ? e.target.value.replace(/[^\d.,]/g, '').slice(0, 9) : e.target.value.replace(/\D/g, '').slice(0, 5); setItem(it.product_id, { qty_text: v, quantity: parseQty(v, it.unit) || 0 }); }} />
                      {!readOnly && <IconButton label={t('Tirar {name}', { name: it.product_name })} icon={X} size="sm" onClick={() => setEditing((e) => ({ ...e, items: e.items.filter((x) => x.product_id !== it.product_id) }))} />}
                    </li>
                  ))}
                </ul>
              )}
              {!readOnly && (
                <div className="mt-2 flex items-end gap-2">
                  <Select aria-label={t('Juntar produto')} value={addId} onChange={(e) => setAddId(e.target.value)} className="flex-1">
                    <option value="">{t('Juntar produto…')}</option>
                    {active.filter((p) => !inList.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} ({t('stock {n}', { n: int(p.stock_qty) })})</option>)}
                  </Select>
                  <Button icon={Plus} disabled={!addId} onClick={addProduct}>{t('Juntar')}</Button>
                </div>
              )}
            </div>

            {seesCosts && <div className="rounded border border-border p-3">
              <KeyValue label={t('Investimento (ao custo)')} value={money(investment)} />
              <KeyValue label={t('Entrega do fornecedor')} value={money(delivery)} />
              <KeyValue label={t('Total')} value={money(investment + delivery)} strong />
            </div>}
            {editing.id && editing.status === 'sent' && <Button onClick={() => setStatus('received')} loading={busy === 'status'}>{t('Marcar como recebida')}</Button>}
          </div>
        )}
      </Drawer>
    </>
  );
}
