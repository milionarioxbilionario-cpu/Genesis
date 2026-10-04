import React, { useState } from 'react';
import { MessageCircle, Plus, Sparkles, X } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, int, date, errorMessage } from '../../utils/format';
import { Alert, Badge, Button, Drawer, IconButton, Input, KeyValue, Select, Table, Toolbar, useConfirm, useToast } from '../../components/ui';

// Lista de compras (Produtos -> Lista de compras): gerada da recomendacao de
// restock ou feita a mao, guardada e enviada ao fornecedor por WhatsApp.
// Marcar "recebida" nao mexe no stock: a entrada faz-se em Stock, com o custo
// e a validade reais.
const STATUS = { draft: { label: 'Rascunho', tone: 'neutral' }, sent: { label: 'Enviada', tone: 'info' }, received: { label: 'Recebida', tone: 'positive' } };
const COVER = [7, 14, 30];

export default function ShoppingLists({ products }) {
  const toast = useToast();
  const confirm = useConfirm();
  const lists = useApi('/api/shopping-lists');
  const suppliers = useApi('/api/inventory/suppliers');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);
  const [addId, setAddId] = useState('');
  const active = (products.data || []).filter((p) => p.is_active);
  const supplier = (suppliers.data || []).find((s) => s.id === editing?.supplier_id);
  const investment = (editing?.items || []).reduce((s, it) => s + it.quantity * it.unit_cost, 0);
  const delivery = supplier?.delivery_cost_per_visit || 0;
  const readOnly = editing?.status === 'received';

  async function suggestion(d) {
    const r = await api.get('/api/shopping-lists/suggestion?days=' + d);
    return r.data.items.map((i) => ({ product_id: i.product_id, product_name: i.name, quantity: i.quantity, unit_cost: i.unit_cost, reason: i.reason }));
  }
  async function openNew(fromSuggestion) {
    setError(''); setAddId('');
    const name = 'Compra de ' + new Date().toLocaleDateString('pt-PT');
    if (!fromSuggestion) { setEditing({ name, supplier_id: '', items: [], status: 'draft' }); return; }
    setBusy('suggest');
    try {
      const items = await suggestion(days);
      setEditing({ name, supplier_id: '', items, status: 'draft' });
      if (items.length === 0) toast('O stock actual chega para ' + days + ' dias. Pode juntar produtos à mão.');
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function openExisting(row) {
    setError(''); setAddId('');
    try {
      const r = await api.get('/api/shopping-lists/' + row.id);
      setEditing({ ...r.data, supplier_id: r.data.supplier_id || '', items: r.data.items.map(({ product_id, product_name, quantity, unit_cost }) => ({ product_id, product_name, quantity, unit_cost })) });
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
    try { await persist(); toast('Lista guardada.'); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
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
      toast(wa.data.has_phone ? 'Mensagem aberta no WhatsApp.' : 'O fornecedor não tem telefone válido: escolha o contacto no WhatsApp.');
      setEditing(null); lists.reload();
    } catch (err) { win?.close(); setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function setStatus(status) {
    setBusy('status'); setError('');
    try { await api.put(`/api/shopping-lists/${editing.id}/status`, { status }); toast(status === 'received' ? 'Lista marcada como recebida. Registe a entrada em Stock.' : 'Estado actualizado.'); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function remove() {
    if (!(await confirm({ title: 'Apagar lista', message: `"${editing.name}" é apagada.`, confirmLabel: 'Apagar', danger: true }))) return;
    try { await api.delete('/api/shopping-lists/' + editing.id); toast('Lista apagada.'); setEditing(null); lists.reload(); } catch (err) { setError(errorMessage(err)); }
  }

  const valid = editing && editing.name.trim().length >= 2 && editing.items.length > 0 && editing.items.every((it) => it.quantity > 0);
  const inList = new Set((editing?.items || []).map((it) => it.product_id));

  return (
    <>
      <Toolbar>
        <Select aria-label="Cobrir quantos dias" value={days} onChange={(e) => setDays(Number(e.target.value))} className="w-44">
          {COVER.map((d) => <option key={d} value={d}>Para {d} dias</option>)}
        </Select>
        <Button variant="primary" icon={Sparkles} loading={busy === 'suggest' && !editing} onClick={() => openNew(true)}>Gerar da recomendação</Button>
        <Button icon={Plus} onClick={() => openNew(false)}>Lista vazia</Button>
      </Toolbar>
      <p className="mb-3 text-sm text-ink-muted">A recomendação usa o ritmo de vendas das últimas 4 semanas e os pedidos de clientes quando não havia, menos o stock actual.</p>
      {(lists.error || (error && !editing)) && <Alert tone="danger" className="mb-3">{lists.error || error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: 'Lista', render: (l) => <div><p className="text-ink">{l.name}</p><p className="text-xs text-ink-muted">{date(l.created_at)}</p></div> },
          { key: 'supplier', header: 'Fornecedor', render: (l) => <span className="text-ink-2">{l.supplier_name || '—'}</span> },
          { key: 'status', header: 'Estado', render: (l) => <Badge tone={STATUS[l.status]?.tone}>{STATUS[l.status]?.label || l.status}</Badge> },
          { key: 'items', header: 'Produtos', align: 'right', render: (l) => int(l.item_count) },
          { key: 'total', header: 'Total', align: 'right', render: (l) => money(l.totals.total) },
        ]}
        rows={lists.data || []}
        loading={lists.loading && !lists.data}
        onRowClick={openExisting}
        empty={<p className="py-10 text-center text-ink-muted">Ainda não há listas. Gere uma a partir da recomendação.</p>}
      />

      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? editing.name : 'Nova lista de compras'}
        description={editing?.id ? STATUS[editing.status]?.label : undefined}
        footer={editing && (readOnly ? (
          <><Button variant="danger-ghost" className="mr-auto" onClick={remove}>Apagar</Button><Button onClick={() => setEditing(null)}>Fechar</Button></>
        ) : (
          <>
            {editing.id && <Button variant="danger-ghost" className="mr-auto" onClick={remove}>Apagar</Button>}
            <Button onClick={() => setEditing(null)}>Cancelar</Button>
            <Button loading={busy === 'save'} disabled={!valid} onClick={save}>Guardar</Button>
            <Button variant="primary" icon={MessageCircle} loading={busy === 'wa'} disabled={!valid} onClick={sendWhatsApp}>Enviar por WhatsApp</Button>
          </>
        ))}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {readOnly && <Alert tone="info">Lista recebida. A entrada no stock regista-se em Produtos → Stock → Entrada de stock, com o custo e a validade de cada lote.</Alert>}
            <Input label="Nome da lista" value={editing.name} disabled={readOnly} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <Select label="Fornecedor" value={editing.supplier_id} disabled={readOnly} onChange={(e) => setEditing({ ...editing, supplier_id: e.target.value })}
              hint={supplier ? (supplier.phone ? `WhatsApp ${supplier.phone} · entrega ${money(supplier.delivery_cost_per_visit)}` : 'Sem telefone: no WhatsApp escolhe o contacto') : 'Sem fornecedor, o WhatsApp pede para escolher o contacto.'}>
              <option value="">Sem fornecedor</option>
              {(suppliers.data || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-medium text-ink">Produtos ({editing.items.length})</p>
                {!readOnly && <Button size="sm" loading={busy === 'suggest'} onClick={refill}>Repor sugestão ({days} dias)</Button>}
              </div>
              {editing.items.length === 0 ? <p className="rounded border border-border p-4 text-center text-sm text-ink-muted">Sem produtos. Junte abaixo ou use a sugestão.</p> : (
                <ul className="divide-y divide-border rounded border border-border">
                  {editing.items.map((it) => (
                    <li key={it.product_id} className="flex items-center gap-3 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-ink">{it.product_name}</p>
                        <p className="num text-xs text-ink-muted">{money(it.unit_cost)} × {int(it.quantity)} = {money(it.unit_cost * it.quantity)}{it.reason === 'pedido por clientes sem stock' ? ' · pedido por clientes' : ''}</p>
                      </div>
                      <Input aria-label={'Quantidade de ' + it.product_name} inputMode="numeric" className="w-20" inputClassName="num text-right" disabled={readOnly}
                        value={it.quantity ? String(it.quantity) : ''} onChange={(e) => setItem(it.product_id, { quantity: Number(e.target.value.replace(/\D/g, '').slice(0, 5)) || 0 })} />
                      {!readOnly && <IconButton label={'Tirar ' + it.product_name} icon={X} size="sm" onClick={() => setEditing((e) => ({ ...e, items: e.items.filter((x) => x.product_id !== it.product_id) }))} />}
                    </li>
                  ))}
                </ul>
              )}
              {!readOnly && (
                <div className="mt-2 flex items-end gap-2">
                  <Select aria-label="Juntar produto" value={addId} onChange={(e) => setAddId(e.target.value)} className="flex-1">
                    <option value="">Juntar produto…</option>
                    {active.filter((p) => !inList.has(p.id)).map((p) => <option key={p.id} value={p.id}>{p.name} (stock {int(p.stock_qty)})</option>)}
                  </Select>
                  <Button icon={Plus} disabled={!addId} onClick={addProduct}>Juntar</Button>
                </div>
              )}
            </div>

            <div className="rounded border border-border p-3">
              <KeyValue label="Investimento (ao custo)" value={money(investment)} />
              <KeyValue label="Entrega do fornecedor" value={money(delivery)} />
              <KeyValue label="Total" value={money(investment + delivery)} strong />
            </div>
            {editing.id && editing.status === 'sent' && <Button onClick={() => setStatus('received')} loading={busy === 'status'}>Marcar como recebida</Button>}
          </div>
        )}
      </Drawer>
    </>
  );
}
