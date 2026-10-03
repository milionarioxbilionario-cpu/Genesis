import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Printer } from 'lucide-react';
import api from '../../utils/api';
import db from '../../db/localDb';
import { newUuid, SYNC_STATE } from '../../utils/syncPolicy';
import { printReceipt } from '../../utils/receiptPrinter';
import { money, time, errorMessage, PAYMENT_LABEL } from '../../utils/format';
import { Alert, Badge, Button, Dialog, Input, KeyValue, MoneyInput, Select, Spinner, useToast } from '../../components/ui';

export function AuthorizationPinDialog({ title, description, error, onCancel, onSubmit }) {
  const [pin, setPin] = useState('');
  return (
    <Dialog
      open
      size="sm"
      title={title}
      description={description}
      onClose={onCancel}
      footer={<><Button onClick={onCancel}>Cancelar</Button><Button variant="primary" disabled={!/^\d{4,6}$/.test(pin)} onClick={() => onSubmit(pin)}>Autorizar</Button></>}
    >
      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
      <form onSubmit={(e) => { e.preventDefault(); if (/^\d{4,6}$/.test(pin)) onSubmit(pin); }}>
        <Input label="PIN do dono" type="password" inputMode="numeric" autoFocus maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputClassName="num text-center tracking-[0.4em]" />
      </form>
    </Dialog>
  );
}

export function ReceiptDialog({ store, cashier, sale, items, onClose }) {
  const [qr, setQr] = useState('');
  const [printing, setPrinting] = useState(false);
  useEffect(() => {
    QRCode.toDataURL(`https://genesis.co.mz/verify/${sale.id}`, { width: 120, margin: 1 }).then(setQr).catch(() => setQr(''));
  }, [sale.id]);
  const subtotal = items.reduce((s, l) => s + l.quantity * l.unit_sell_price, 0);
  async function print() {
    setPrinting(true);
    try {
      await printReceipt({
        shopName: store.name, shopLocation: store.location, cashierName: cashier.name,
        sale: { ...sale, payment_method: PAYMENT_LABEL[sale.payment_method] || sale.payment_method, created_at: sale.created_at || new Date().toISOString() },
        items: items.map((l) => ({ product_name: l.product_name, quantity: l.quantity, unit_sell_price: l.unit_sell_price })),
      });
    } finally { setPrinting(false); }
  }
  return (
    <Dialog
      open
      size="sm"
      title="Venda registada"
      onClose={onClose}
      footer={<><Button icon={Printer} loading={printing} onClick={print}>Imprimir recibo</Button><Button variant="primary" onClick={onClose} autoFocus>Nova venda</Button></>}
    >
      <div className="mb-3 flex items-center gap-2 text-positive"><CheckCircle2 size={18} /><span className="font-medium">Venda n.º {String(sale.daily_number || '').padStart(3, '0')}</span></div>
      <div className="rounded border border-border p-3">
        {items.map((l) => <KeyValue key={l.product_id} label={`${l.quantity} × ${l.product_name}`} value={money(l.quantity * l.unit_sell_price)} />)}
        <div className="my-1 border-t border-border" />
        {sale.discount_amount > 0 && <><KeyValue label="Subtotal" value={money(subtotal)} /><KeyValue label="Desconto" value={'−' + money(sale.discount_amount)} /></>}
        <KeyValue label="Total" value={money(sale.total_amount)} strong />
        <KeyValue label={PAYMENT_LABEL[sale.payment_method]} value={money(sale.amount_received)} />
        {sale.change_given > 0 && <KeyValue label="Troco" value={money(sale.change_given)} strong tone="positive" />}
      </div>
      {qr && <img src={qr} alt="QR de verificação da venda" className="mx-auto mt-3 h-24 w-24" />}
    </Dialog>
  );
}

// Fecho cego: o caixista conta a gaveta ANTES de saber quanto o sistema espera.
export function CloseShiftDialog({ shift, onClose, onDone }) {
  const [counted, setCounted] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true); setError('');
    try {
      const res = await api.post('/api/pos/shift/close', { declared_amount: counted });
      setResult({ ok: true, ...res.data });
      onDone();
    } catch (err) {
      const d = err?.response?.data;
      if (d && d.accepted === false) { setResult({ ok: false, ...d }); onDone(); } else setError(errorMessage(err));
    } finally { setBusy(false); }
  }
  const noShift = shift && !shift.hasOpenSales;
  return (
    <Dialog
      open
      size="sm"
      title="Fechar turno"
      description="Conte o dinheiro da gaveta e introduza o total. O sistema só compara depois."
      onClose={onClose}
      footer={result?.ok ? <Button variant="primary" onClick={onClose}>Concluir</Button> : (
        <><Button onClick={onClose}>Cancelar</Button><Button variant="primary" loading={busy} disabled={noShift || shift?.locked || result?.locked} onClick={submit}>Confirmar contagem</Button></>
      )}
    >
      {shift?.locked || result?.locked ? (
        <Alert tone="danger" title="Perfil bloqueado">Três contagens abaixo do esperado. O dono tem de desbloquear este perfil no painel (Equipa).</Alert>
      ) : noShift && !result ? (
        <Alert tone="info">Não há vendas desde o último fecho. O turno já está fechado.</Alert>
      ) : result?.ok ? (
        <Alert tone="positive" title="Turno fechado">{result.message}</Alert>
      ) : (
        <>
          {result && !result.ok && <Alert tone="warning" className="mb-3">{result.error}</Alert>}
          {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
          <MoneyInput label="Dinheiro contado na gaveta" valueCents={counted} onChangeCents={setCounted} autoFocus />
          <p className="mt-2 text-xs text-ink-muted">Conta só o dinheiro físico. Vendas por cartão e M-Pesa não entram na gaveta.</p>
        </>
      )}
    </Dialog>
  );
}

export function RecentSalesDialog({ onClose, onChanged }) {
  const toast = useToast();
  const [sales, setSales] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = () => api.get('/api/sales').then((r) => setSales(r.data)).catch(() => setSales([]));
  useEffect(() => { load(); }, []);

  async function cancel() {
    setBusy(true); setError('');
    try {
      await api.post(`/api/sales/${cancelling.id}/cancel`, { pin, reason });
      toast('Venda cancelada e stock reposto.');
      setCancelling(null); setPin(''); setReason('');
      load(); onChanged();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  if (cancelling) {
    return (
      <Dialog
        open
        size="sm"
        title={`Cancelar venda n.º ${String(cancelling.daily_number || '').padStart(3, '0')}`}
        description={`${money(cancelling.total_amount)} · ${time(cancelling.created_at)}. Exige o PIN do dono e fica registado.`}
        onClose={() => setCancelling(null)}
        footer={<><Button onClick={() => setCancelling(null)}>Voltar</Button><Button variant="danger" loading={busy} disabled={!/^\d{4,6}$/.test(pin) || reason.trim().length < 3} onClick={cancel}>Cancelar venda</Button></>}
      >
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        <div className="flex flex-col gap-3">
          <Input label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: cliente desistiu" autoFocus />
          <Input label="PIN do dono" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open title="As minhas últimas vendas" description="Só é possível cancelar vendas de hoje." onClose={onClose} size="md">
      {!sales ? <div className="flex justify-center py-8"><Spinner /></div> : sales.length === 0 ? (
        <p className="py-6 text-center text-ink-muted">Ainda não há vendas.</p>
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((s) => {
            const today = new Date(s.created_at).toDateString() === new Date().toDateString();
            return (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <span className="num w-10 text-sm text-ink-muted">{String(s.daily_number || '').padStart(3, '0')}</span>
                <div className="min-w-0 flex-1">
                  <p className="num font-medium text-ink">{money(s.total_amount)}</p>
                  <p className="text-xs text-ink-muted">{time(s.created_at)} · {PAYMENT_LABEL[s.payment_method] || s.payment_method} · {s.items.length} artigo(s)</p>
                </div>
                {s.status === 'cancelled' ? <Badge tone="danger">Cancelada</Badge> : today && <Button size="sm" variant="danger-ghost" onClick={() => setCancelling(s)}>Cancelar</Button>}
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}

function ProductPicker({ products, value, onChange }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => products.filter((p) => p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 50), [products, q]);
  return (
    <div className="flex flex-col gap-2">
      <Input label="Produto" placeholder="Pesquisar…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      <Select aria-label="Escolher produto" value={value} onChange={(e) => onChange(e.target.value)} size={6} selectClassName="h-auto py-1">
        {list.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.stock_qty} un.</option>)}
      </Select>
    </div>
  );
}

// Quebra / consumo interno (especificacao 6.2): guardado no terminal e
// enviado pela fila (funciona offline).
export function ShrinkageDialog({ products, onClose, onSaved }) {
  const toast = useToast();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('broken');
  const p = products.find((x) => x.id === productId);
  const qty = Number(quantity);
  async function save() {
    await db.shrinkage_records.add({ id: newUuid(), product_id: productId, quantity: qty, reason, recorded_at: new Date().toISOString(), sync_state: SYNC_STATE.PENDING });
    toast(`Quebra registada: ${qty} × ${p.name}.`);
    onSaved(); onClose();
  }
  return (
    <Dialog open title="Registar quebra ou consumo" description="Produtos partidos, vencidos ou consumidos na loja." onClose={onClose}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={!p || !Number.isInteger(qty) || qty <= 0 || qty > (p?.stock_qty || 0)} onClick={save}>Registar</Button></>}>
      <div className="flex flex-col gap-3">
        <ProductPicker products={products} value={productId} onChange={setProductId} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Quantidade" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))} />
          <Select label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="broken">Partido</option>
            <option value="expired">Vencido</option>
            <option value="internal_consumption">Consumo interno</option>
            <option value="other">Outro</option>
          </Select>
        </div>
      </div>
    </Dialog>
  );
}

// "Cliente pediu produto em falta" (especificacao 6.2) — oportunidade perdida.
export function DemandDialog({ products, onClose, onSaved }) {
  const toast = useToast();
  const [productId, setProductId] = useState('');
  const p = products.find((x) => x.id === productId);
  async function save() {
    await db.demand_captures.add({ id: newUuid(), product_id: productId, requested_at: new Date().toISOString(), sync_state: SYNC_STATE.PENDING });
    toast(`Pedido registado: ${p.name}.`);
    onSaved(); onClose();
  }
  return (
    <Dialog open title="Produto em falta" description="O cliente pediu um produto que não havia. Fica no relatório de oportunidades perdidas." onClose={onClose}
      footer={<><Button onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={!p} onClick={save}>Registar pedido</Button></>}>
      <ProductPicker products={products} value={productId} onChange={setProductId} />
    </Dialog>
  );
}
