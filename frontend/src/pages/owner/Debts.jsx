import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, date, isoDay, errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Alert, Badge, Button, Dialog, Drawer, Input, KeyValue, MoneyInput, PageHeader, Segmented, Stat, Table, Toolbar, useToast } from '../../components/ui';

// label em portugues = chave da traducao (t(label) no ecra).
const STATUS = {
  active: { label: 'Em dia', tone: 'info' },
  partially_paid: { label: 'Pago em parte', tone: 'warning' },
  paid: { label: 'Paga', tone: 'positive' },
  overdue: { label: 'Vencida', tone: 'danger' },
};

// Especificacao 6.5 — chenecas (fiados).
export default function Debts() {
  const toast = useToast();
  const { t } = useI18n();
  const debts = useApi('/api/owner/debts');
  const [filter, setFilter] = useState('open');
  const [creating, setCreating] = useState(null);
  const [paying, setPaying] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const all = debts.data || [];
  const open = all.filter((d) => d.status !== 'paid');
  const week = Date.now() + 7 * 86400000;
  const rows = useMemo(() => (filter === 'open' ? open : filter === 'overdue' ? all.filter((d) => d.status === 'overdue') : all), [filter, all, open]);

  async function create() {
    setBusy(true); setError('');
    try {
      await api.post('/api/owner/debts', { ...creating, debtor_name: creating.debtor_name.trim(), debtor_phone: creating.debtor_phone.trim() });
      toast(t('Cheneca registada.'));
      setCreating(null); debts.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function pay() {
    setBusy(true); setError('');
    try {
      await api.post(`/api/owner/debts/${paying.id}/payment`, { amount });
      toast(t('Pagamento registado.'));
      setPaying(null); debts.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title={t('Chenecas')} description={t('Vendas a crédito e pagamentos.')} actions={<Button variant="primary" icon={Plus} onClick={() => { setError(''); setCreating({ debtor_name: '', debtor_phone: '', total_amount: 0, due_date: isoDay(new Date(Date.now() + 14 * 86400000)) }); }}>{t('Nova cheneca')}</Button>} />
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat label={t('Total em dívida')} value={money(open.reduce((s, d) => s + d.remaining, 0))} hint={t('{n} cliente(s)', { n: open.length })} />
        <Stat label={t('Vencidas')} value={String(all.filter((d) => d.status === 'overdue').length)} tone={all.some((d) => d.status === 'overdue') ? 'danger' : undefined} hint={money(all.filter((d) => d.status === 'overdue').reduce((s, d) => s + d.remaining, 0))} />
        <Stat label={t('A vencer em 7 dias')} value={String(open.filter((d) => d.status !== 'overdue' && new Date(d.due_date) < week).length)} />
      </div>
      <Toolbar>
        <Segmented value={filter} onChange={setFilter} options={[{ value: 'open', label: t('Em aberto') }, { value: 'overdue', label: t('Vencidas') }, { value: 'all', label: t('Todas') }]} />
      </Toolbar>
      <Table
        columns={[
          { key: 'debtor', header: t('Cliente'), render: (d) => <div><p className="text-ink">{d.debtor_name}</p><p className="num text-xs text-ink-muted">{d.debtor_phone}</p></div> },
          { key: 'due', header: t('Vencimento'), render: (d) => <span className={d.status === 'overdue' ? 'text-danger' : 'text-ink-2'}>{date(d.due_date)}</span> },
          { key: 'status', header: t('Estado'), render: (d) => <Badge tone={STATUS[d.status].tone}>{t(STATUS[d.status].label)}</Badge> },
          { key: 'total', header: t('Total'), align: 'right', render: (d) => <span className="text-ink-2">{money(d.total_amount)}</span> },
          { key: 'remaining', header: t('Em falta'), align: 'right', render: (d) => <span className="font-medium">{money(d.remaining)}</span> },
          { key: 'pay', header: '', align: 'right', render: (d) => d.status !== 'paid' && <Button size="sm" onClick={(e) => { e.stopPropagation(); setError(''); setAmount(d.remaining); setPaying(d); }}>{t('Receber')}</Button> },
        ]}
        rows={rows}
        loading={debts.loading && !debts.data}
        onRowClick={setViewing}
        empty={<p className="py-10 text-center text-ink-muted">{t('Nada aqui.')}</p>}
      />

      <Drawer open={Boolean(creating)} onClose={() => setCreating(null)} title={t('Nova cheneca')}
        footer={<><Button onClick={() => setCreating(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!creating || creating.debtor_name.trim().length < 2 || creating.debtor_phone.trim().length < 8 || creating.total_amount <= 0} onClick={create}>{t('Registar')}</Button></>}>
        {creating && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label={t('Nome do cliente')} value={creating.debtor_name} onChange={(e) => setCreating({ ...creating, debtor_name: e.target.value })} autoFocus />
            <Input label="WhatsApp" inputMode="tel" placeholder="84 000 0000" hint={t('Para os lembretes de pagamento.')} value={creating.debtor_phone} onChange={(e) => setCreating({ ...creating, debtor_phone: e.target.value })} />
            <MoneyInput label={t('Valor em dívida')} valueCents={creating.total_amount} onChangeCents={(v) => setCreating({ ...creating, total_amount: v })} />
            <Input label={t('Data limite de pagamento')} type="date" value={creating.due_date} onChange={(e) => setCreating({ ...creating, due_date: e.target.value })} />
          </div>
        )}
      </Drawer>

      <Dialog open={Boolean(paying)} size="sm" title={paying ? t('Receber de {name}', { name: paying.debtor_name }) : ''} description={paying ? t('Em falta: {v}', { v: money(paying.remaining) }) : ''} onClose={() => setPaying(null)}
        footer={<><Button onClick={() => setPaying(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!paying || amount <= 0 || amount > paying.remaining} onClick={pay}>{t('Registar pagamento')}</Button></>}>
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        <MoneyInput label={t('Valor recebido')} valueCents={amount} onChangeCents={setAmount} autoFocus />
      </Dialog>

      <Drawer open={Boolean(viewing)} onClose={() => setViewing(null)} title={viewing?.debtor_name} description={viewing ? t('Criada a {a} · vence a {b}', { a: date(viewing.created_at), b: date(viewing.due_date) }) : ''}>
        {viewing && (
          <>
            <KeyValue label={t('Total')} value={money(viewing.total_amount)} />
            <KeyValue label={t('Pago')} value={money(viewing.amount_paid)} tone="positive" />
            <KeyValue label={t('Em falta')} value={money(viewing.remaining)} strong />
            <h3 className="mb-2 mt-5 text-sm font-medium text-ink-muted">{t('Pagamentos')}</h3>
            {viewing.payments.length === 0 ? <p className="text-ink-muted">{t('Ainda sem pagamentos.')}</p> : viewing.payments.map((p) => <KeyValue key={p.id} label={date(p.paid_at)} value={money(p.amount)} />)}
          </>
        )}
      </Drawer>
    </>
  );
}
