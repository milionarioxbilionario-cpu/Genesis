import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { Monitor, Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, date, dateTime, isoDay, errorMessage } from '../../utils/format';
import { Alert, Badge, Button, Card, CardHeader, Dialog, Drawer, Input, MoneyInput, PageHeader, Select, Skeleton, Table, Tabs, useConfirm, useToast } from '../../components/ui';

const TABS = [
  { value: 'store', label: 'Loja' },
  { value: 'costs', label: 'Custos e despesas' },
  { value: 'discounts', label: 'Descontos e PIN' },
  { value: 'terminals', label: 'Terminais' },
  { value: 'audit', label: 'Auditoria' },
];

export default function Settings() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'store';
  const settings = useApi('/api/settings');
  return (
    <>
      <PageHeader title="Definições" />
      <Tabs className="mb-6" value={tab} onChange={(v) => setParams({ tab: v })} items={TABS} />
      {settings.error && <Alert tone="danger" className="mb-4">{settings.error}</Alert>}
      {!settings.data && tab !== 'audit' && tab !== 'terminals' ? <Skeleton className="h-40 w-full max-w-2xl" /> : (
        <div className="max-w-3xl">
          {tab === 'store' && <Store s={settings.data} reload={settings.reload} />}
          {tab === 'costs' && (
            <>
              <h2 className="mb-1 text-lg font-semibold text-ink">Custos fixos</h2>
              <p className="mb-3 text-sm text-ink-muted">O que paga todos os meses (renda, água e luz fixas...). Descontado no lucro de cada mês.</p>
              <FixedCosts s={settings.data} reload={settings.reload} />
              <Expenses />
            </>
          )}
          {tab === 'discounts' && <Discounts s={settings.data} reload={settings.reload} />}
          {tab === 'terminals' && <Terminals />}
          {tab === 'audit' && <Audit />}
        </div>
      )}
    </>
  );
}

function Store({ s, reload }) {
  const toast = useToast();
  const { reloadTenant } = useOutletContext();
  const [store, setStore] = useState(s.store);
  const [hours, setHours] = useState(s.hours);
  const [alertDays, setAlertDays] = useState(String(s.expiry_alert_days ?? 7));
  const [closeDay, setCloseDay] = useState(String(s.month_close_day ?? 1));
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function save(kind) {
    setBusy(kind); setError('');
    try {
      if (kind === 'store') await api.put('/api/settings/store', { name: store.name, location: store.location, phone: store.phone, email: store.email || null });
      else if (kind === 'expiry') await api.put('/api/settings/expiry-alert', { expiry_alert_days: Number(alertDays) });
      else if (kind === 'close') await api.put('/api/settings/month-close', { month_close_day: Number(closeDay) });
      else await api.put('/api/settings/hours', hours);
      toast('Alterações guardadas.');
      reload(); reloadTenant?.();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Card>
        <CardHeader title="Dados da loja" description="Aparecem no recibo e nas mensagens." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Nome" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} className="sm:col-span-2" />
          <Input label="Localização" value={store.location} onChange={(e) => setStore({ ...store, location: e.target.value })} />
          <Input label="Telefone (WhatsApp)" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
          <Input label="Email" type="email" value={store.email || ''} onChange={(e) => setStore({ ...store, email: e.target.value })} className="sm:col-span-2" />
        </div>
        <div className="mt-4 flex justify-end"><Button variant="primary" loading={busy === 'store'} onClick={() => save('store')}>Guardar</Button></div>
      </Card>
      <Card>
        <CardHeader title="Horário" description="Usado no fecho do dia." />
        <div className="grid max-w-sm grid-cols-2 gap-4">
          <Input label="Abertura" type="time" value={hours.opening_time} onChange={(e) => setHours({ ...hours, opening_time: e.target.value })} />
          <Input label="Fecho" type="time" value={hours.closing_time} onChange={(e) => setHours({ ...hours, closing_time: e.target.value })} />
        </div>
        <div className="mt-4 flex justify-end"><Button variant="primary" loading={busy === 'hours'} onClick={() => save('hours')}>Guardar</Button></div>
      </Card>
      <Card>
        <CardHeader title="Validades" description="Quantos dias antes da data de validade um lote aparece nos alertas. No dia seguinte à validade, o que não se vendeu é registado como perda automaticamente." />
        <div className="flex items-end gap-3">
          <Input label="Avisar com" inputMode="numeric" value={alertDays} onChange={(e) => setAlertDays(e.target.value.replace(/\D/g, '').slice(0, 2))} className="w-32" inputClassName="num text-right" />
          <span className="pb-2 text-base text-ink-2">dias de antecedência</span>
          <Button className="ml-auto" variant="primary" loading={busy === 'expiry'} disabled={!(Number(alertDays) >= 1 && Number(alertDays) <= 90)} onClick={() => save('expiry')}>Guardar</Button>
        </div>
      </Card>
      <Card>
        <CardHeader title="Fecho do mês" description="A partir deste dia, ao entrar, o Genesis mostra o resumo do mês anterior e a lista do que comprar, com a opção de a enviar ao fornecedor." />
        <div className="flex items-end gap-3">
          <Input label="Dia do fecho" inputMode="numeric" value={closeDay} onChange={(e) => setCloseDay(e.target.value.replace(/D/g, '').slice(0, 2))} className="w-32" inputClassName="num text-right" />
          <span className="pb-2 text-base text-ink-2">de cada mês (1 a 28)</span>
          <Button className="ml-auto" variant="primary" loading={busy === 'close'} disabled={!(Number(closeDay) >= 1 && Number(closeDay) <= 28)} onClick={() => save('close')}>Guardar</Button>
        </div>
      </Card>
    </div>
  );
}

const COST_TYPES = { rent: 'Renda', utilities: 'Água e luz', transport: 'Transporte', other: 'Outro' };

function FixedCosts({ s, reload }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save() {
    setBusy(true); setError('');
    const body = { description: editing.description.trim(), amount: editing.amount, type: editing.type };
    try {
      if (editing.id) await api.put('/api/settings/fixed-costs/' + editing.id, body);
      else await api.post('/api/settings/fixed-costs', body);
      toast('Custo fixo guardado.'); setEditing(null); reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirm({ title: 'Remover custo fixo', message: `"${editing.description}" deixa de ser deduzido no relatório mensal.`, confirmLabel: 'Remover', danger: true }))) return;
    try { await api.delete('/api/settings/fixed-costs/' + editing.id); toast('Custo removido.'); setEditing(null); reload(); } catch (err) { setError(errorMessage(err)); }
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-base text-ink-2">Total mensal deduzido no lucro: <span className="num font-semibold text-ink">{money(s.fixed_costs_monthly_total)}</span></p>
        <Button variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ description: '', amount: 0, type: 'rent' }); }}>Novo custo</Button>
      </div>
      <Table
        columns={[
          { key: 'description', header: 'Descrição' },
          { key: 'type', header: 'Tipo', render: (c) => <Badge tone={c.type === 'rent' ? 'info' : 'neutral'}>{COST_TYPES[c.type] || c.type}</Badge> },
          { key: 'amount', header: 'Valor mensal', align: 'right', render: (c) => money(c.amount) },
        ]}
        rows={s.fixed_costs}
        onRowClick={(c) => { setError(''); setEditing({ ...c }); }}
        empty={<p className="py-10 text-center text-ink-muted">Sem custos fixos. Registe a renda para o relatório mensal mostrar o lucro real.</p>}
      />
      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar custo fixo' : 'Novo custo fixo'}
        footer={<>{editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={remove}>Remover</Button>}<Button onClick={() => setEditing(null)}>Cancelar</Button><Button variant="primary" loading={busy} disabled={!editing || editing.description.trim().length < 2 || editing.amount <= 0} onClick={save}>Guardar</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Select label="Tipo" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
              {Object.entries(COST_TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Input label="Descrição" placeholder="Ex.: Renda do contentor" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <MoneyInput label="Valor por mês" valueCents={editing.amount} onChangeCents={(v) => setEditing({ ...editing, amount: v })} />
          </div>
        )}
      </Drawer>
    </>
  );
}

// Despesas avulsas: o que se paga uma vez (limpeza, transporte do stock...).
// Entram no lucro liquido do mes da data escolhida.
function Expenses() {
  const toast = useToast();
  const confirm = useConfirm();
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const list = useApi(`/api/settings/expenses?year=${period.year}&month=${period.month}`);
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const months = Array.from({ length: 12 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); return { year: d.getFullYear(), month: d.getMonth() + 1, label: d.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' }) }; });
  const categories = list.data?.categories || [];
  const valid = editing && editing.category.trim().length >= 2 && editing.amount > 0 && editing.date && editing.date <= isoDay();
  async function save() {
    setBusy(true); setError('');
    const body = { date: editing.date, category: editing.category.trim(), description: editing.description.trim(), amount: editing.amount };
    try {
      if (editing.id) await api.put('/api/settings/expenses/' + editing.id, body);
      else await api.post('/api/settings/expenses', body);
      toast('Despesa guardada.'); setEditing(null); list.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function remove() {
    if (!(await confirm({ title: 'Remover despesa', message: `"${editing.category}" de ${money(editing.amount)} deixa de ser descontada no lucro do mês.`, confirmLabel: 'Remover', danger: true }))) return;
    try { await api.delete('/api/settings/expenses/' + editing.id); toast('Despesa removida.'); setEditing(null); list.reload(); } catch (err) { setError(errorMessage(err)); }
  }
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-lg font-semibold text-ink">Despesas avulsas</h2>
      <p className="mb-3 text-sm text-ink-muted">O que paga uma vez: limpeza, transporte do stock, uma reparação... Entra no lucro líquido do mês da data da despesa.</p>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <Select aria-label="Mês das despesas" value={`${period.year}-${period.month}`} onChange={(e) => { const [y, m] = e.target.value.split('-').map(Number); setPeriod({ year: y, month: m }); }} className="w-52">
          {months.map((m) => <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>{m.label}</option>)}
        </Select>
        <Button variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ date: isoDay(), category: '', description: '', amount: 0 }); }}>Nova despesa</Button>
      </div>
      {list.error && <Alert tone="danger" className="mb-3">{list.error}</Alert>}
      {list.data && <p className="mb-2 text-base text-ink-2">Total do mês: <span className="num font-semibold text-ink">{money(list.data.total)}</span></p>}
      <Table
        columns={[
          { key: 'date', header: 'Data', render: (e) => <span className="num text-ink-2">{date(e.date)}</span> },
          { key: 'category', header: 'Categoria', render: (e) => <Badge tone="neutral">{e.category}</Badge> },
          { key: 'description', header: 'Descrição', render: (e) => <span className="text-ink-2">{e.description || '—'}</span> },
          { key: 'amount', header: 'Valor', align: 'right', render: (e) => money(e.amount) },
        ]}
        rows={list.data?.rows || []}
        loading={list.loading && !list.data}
        onRowClick={(e) => { setError(''); setEditing({ id: e.id, date: isoDay(e.date), category: e.category, description: e.description || '', amount: e.amount }); }}
        empty={<p className="py-10 text-center text-ink-muted">Sem despesas neste mês.</p>}
      />
      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar despesa' : 'Nova despesa'}
        footer={<>{editing?.id && <Button variant="danger-ghost" className="mr-auto" onClick={remove}>Remover</Button>}<Button onClick={() => setEditing(null)}>Cancelar</Button><Button variant="primary" loading={busy} disabled={!valid} onClick={save}>Guardar</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label="Data" type="date" max={isoDay()} value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Input label="Categoria" list="expense-categories" placeholder="Escolha ou escreva" value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} hint="Pode escrever uma categoria nova." />
            <datalist id="expense-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            <Input label="Descrição (opcional)" placeholder="Ex.: Detergente e vassouras" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
            <MoneyInput label="Valor" valueCents={editing.amount} onChangeCents={(v) => setEditing({ ...editing, amount: v })} />
          </div>
        )}
      </Drawer>
    </section>
  );
}

function Discounts({ s, reload }) {
  const toast = useToast();
  const [pct, setPct] = useState(String(s.discount_free_pct));
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  async function savePct() {
    setBusy('pct'); setError('');
    try { await api.put('/api/settings/discount', { discount_free_pct: Number(pct) }); toast('Limite de desconto guardado.'); reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  async function savePin() {
    setBusy('pin'); setError('');
    try { await api.put('/api/settings/authorization-pin', { pin, owner_password: password }); toast('PIN de autorização guardado.'); setPin(''); setPassword(''); reload(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(''); }
  }
  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <Card>
        <CardHeader title="Descontos no terminal" description="Até este limite o caixista aplica o desconto sozinho. Acima, precisa do PIN de autorização. Todos os descontos aparecem nos relatórios." />
        <label htmlFor="desconto-limite" className="text-sm font-medium text-ink-2">Limite sem autorização</label>
        <div className="mt-1.5 flex items-center gap-3">
          <div className="relative w-32">
            <Input id="desconto-limite" inputMode="numeric" value={pct} onChange={(e) => setPct(e.target.value.replace(/\D/g, '').slice(0, 3))} className="w-32" inputClassName="num pr-8 text-right" />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-muted">%</span>
          </div>
          <Button variant="primary" loading={busy === 'pct'} disabled={pct === '' || Number(pct) > 100} onClick={savePct}>Guardar</Button>
        </div>
        <p className="mt-1.5 text-xs text-ink-muted">Percentagem do subtotal da venda (0 a 100).</p>
      </Card>
      <Card>
        <CardHeader title="PIN de autorização" description="Pedido para cancelar vendas e para descontos acima do limite. Não o partilhe com os caixistas." action={<Badge tone={s.authorization_pin_configured ? 'positive' : 'warning'}>{s.authorization_pin_configured ? 'Configurado' : 'Por configurar'}</Badge>} />
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <Input label="Novo PIN (4 a 6 dígitos)" type="password" inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputClassName="num tracking-[0.3em]" />
          <Input label="A sua senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="mt-4 flex justify-end"><Button variant="primary" loading={busy === 'pin'} disabled={!/^\d{4,6}$/.test(pin) || !password} onClick={savePin}>Guardar PIN</Button></div>
      </Card>
    </div>
  );
}

function Terminals() {
  const toast = useToast();
  const confirm = useConfirm();
  const terminals = useApi('/api/owner/terminals');
  const [name, setName] = useState('');
  const [asking, setAsking] = useState(false);
  const [pairing, setPairing] = useState(null);
  const [left, setLeft] = useState(0);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!pairing) return undefined;
    const t = setInterval(() => {
      const s = Math.max(0, Math.round((new Date(pairing.expires_at) - Date.now()) / 1000));
      setLeft(s);
      if (s === 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [pairing]);

  async function generate() {
    setError('');
    try {
      const res = await api.post('/api/owner/terminals/pairing-code', { name: name.trim() });
      setAsking(false); setPairing({ ...res.data, name: name.trim() }); setName('');
    } catch (err) { setError(errorMessage(err)); }
  }
  async function revoke(t) {
    if (!(await confirm({ title: 'Revogar terminal', message: `"${t.name}" deixa de poder vender. Vendas ainda por enviar nesse computador perdem-se.`, confirmLabel: 'Revogar', danger: true }))) return;
    try { await api.post(`/api/owner/terminals/${t.id}/revoke`); toast('Terminal revogado.'); terminals.reload(); } catch (err) { toast(errorMessage(err), 'danger'); }
  }
  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-base text-ink-2">Computadores e tablets do balcão onde os caixistas vendem com o PIN.</p>
        <Button variant="primary" icon={Plus} onClick={() => { setError(''); setAsking(true); }}>Emparelhar terminal</Button>
      </div>
      <Table
        columns={[
          { key: 'name', header: 'Terminal', render: (t) => <span className="flex items-center gap-2"><Monitor size={15} className="text-ink-muted" />{t.name}</span> },
          { key: 'created_at', header: 'Emparelhado', render: (t) => dateTime(t.created_at) },
          { key: 'last_seen_at', header: 'Última actividade', render: (t) => dateTime(t.last_seen_at) },
          { key: 'state', header: 'Estado', render: (t) => (t.revoked_at ? <Badge>Revogado</Badge> : <Badge tone="positive">Activo</Badge>) },
          { key: 'actions', header: '', align: 'right', render: (t) => !t.revoked_at && <Button size="sm" variant="danger-ghost" onClick={() => revoke(t)}>Revogar</Button> },
        ]}
        rows={terminals.data || []}
        loading={terminals.loading && !terminals.data}
        empty={<p className="py-10 text-center text-ink-muted">Nenhum terminal. Emparelhe o computador do balcão para começar a vender.</p>}
      />
      <Dialog open={asking} size="sm" title="Emparelhar terminal" onClose={() => setAsking(false)}
        footer={<><Button onClick={() => setAsking(false)}>Cancelar</Button><Button variant="primary" disabled={name.trim().length < 2} onClick={generate}>Gerar código</Button></>}>
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        <Input label="Nome do terminal" placeholder="Ex.: Balcão principal" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </Dialog>
      <Dialog open={Boolean(pairing)} size="sm" title={pairing ? 'Código para ' + pairing.name : ''} onClose={() => { setPairing(null); terminals.reload(); }}
        footer={<Button variant="primary" onClick={() => { setPairing(null); terminals.reload(); }}>Concluído</Button>}>
        {pairing && (
          <>
            <ol className="mb-4 list-decimal space-y-1 pl-5 text-base text-ink-2">
              <li>No computador do balcão, abra <span className="font-medium text-ink">{window.location.origin}/terminal</span></li>
              <li>Introduza este código:</li>
            </ol>
            <p className="num rounded-lg border border-border bg-subtle py-4 text-center text-2xl font-semibold tracking-[0.4em] text-ink">{pairing.code}</p>
            <p className="mt-3 text-center text-sm text-ink-muted">{left > 0 ? `Válido durante ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}. Só pode ser usado uma vez.` : 'Expirado. Gere um novo código.'}</p>
          </>
        )}
      </Dialog>
    </>
  );
}

const ACTION_LABEL = {
  CREATE_SALE: 'Venda', CANCEL_SALE: 'Venda cancelada', CANCEL_ATTEMPT: 'PIN errado ao cancelar', DISCOUNT_AUTHORIZED: 'Desconto autorizado',
  DISCOUNT_PIN_FAIL: 'PIN errado em desconto', STOCK_ADJUSTMENT: 'Ajuste de stock', UPDATE_PRODUCT: 'Produto alterado', DELETE_PRODUCT: 'Produto removido',
  POS_LOGIN: 'Entrada no terminal', POS_PIN_FAIL: 'PIN errado no terminal', SHIFT_CLOSING_OK: 'Fecho de turno', SHIFT_ATTEMPT_FAIL: 'Contagem errada no fecho',
  CASHIER_LOCKED: 'Caixista bloqueado', CASHIER_UNLOCKED: 'Caixista desbloqueado', CREATE_CASHIER: 'Caixista criado', DEACTIVATE_CASHIER: 'Caixista desactivado',
  REACTIVATE_CASHIER: 'Caixista reactivado', RESET_CASHIER_PIN: 'PIN de caixista alterado', TERMINAL_PAIRED: 'Terminal emparelhado', TERMINAL_REVOKED: 'Terminal revogado',
  AUTH_PIN_CHANGED: 'PIN de autorização alterado', UPDATE_DISCOUNT_POLICY: 'Limite de desconto alterado', CREATE_FIXED_COST: 'Custo fixo criado',
  UPDATE_FIXED_COST: 'Custo fixo alterado', DELETE_FIXED_COST: 'Custo fixo removido', DEBT_PAYMENT: 'Pagamento de cheneca', CREATE_DEBT: 'Cheneca criada',
  CREATE_SHRINKAGE: 'Quebra registada', CREATE_DEMAND_CAPTURE: 'Produto em falta', SUPPORT_SESSION_OPENED: 'Acesso de suporte Genesis',
};
const ALERT_ACTIONS = new Set(['CANCEL_ATTEMPT', 'DISCOUNT_PIN_FAIL', 'POS_PIN_FAIL', 'SHIFT_ATTEMPT_FAIL', 'CASHIER_LOCKED', 'AUTH_PIN_CHANGE_FAIL']);

function Audit() {
  const { data, loading } = useApi('/api/owner/audit?limit=150');
  return (
    <Table
      columns={[
        { key: 'created_at', header: 'Quando', render: (a) => <span className="whitespace-nowrap">{dateTime(a.created_at)}</span> },
        { key: 'action', header: 'Acção', render: (a) => <span className={ALERT_ACTIONS.has(a.action) ? 'font-medium text-danger' : 'text-ink'}>{ACTION_LABEL[a.action] || a.action}</span> },
        { key: 'user', header: 'Quem', render: (a) => <span className="text-ink-2">{a.user_name}</span> },
      ]}
      rows={data || []}
      loading={loading}
      empty={<p className="py-10 text-center text-ink-muted">Sem registos.</p>}
    />
  );
}
