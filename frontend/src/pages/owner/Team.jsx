import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, date, isoDay, errorMessage } from '../../utils/format';
import { useI18n } from '../../i18n/react';
import { Alert, Badge, Button, Dialog, Drawer, Input, MoneyInput, PageHeader, Select, Table, Tabs, Toolbar, useConfirm, useToast } from '../../components/ui';

export default function Team() {
  const { t } = useI18n();
  const [tab, setTab] = useState('cashiers');
  return (
    <>
      <PageHeader title={t('Equipa')} description={t('Caixistas que vendem no terminal e trabalhadores na folha salarial.')} />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[{ value: 'cashiers', label: t('Caixistas') }, { value: 'employees', label: t('Trabalhadores') }]} />
      {tab === 'cashiers' ? <Cashiers /> : <Employees />}
    </>
  );
}

const pinOk = (p) => /^\d{4}$/.test(p);

function Cashiers() {
  const toast = useToast();
  const confirm = useConfirm();
  const { t } = useI18n();
  const cashiers = useApi('/api/owner/cashiers');
  const [creating, setCreating] = useState(null);
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    setBusy(true); setError('');
    try {
      await api.post('/api/owner/cashiers', { name: creating.name.trim(), phone: creating.phone.trim() || null, pin: creating.pin, role: creating.role });
      toast(t('{name} pode entrar no terminal com o PIN.', { name: creating.name.trim() }));
      setCreating(null); cashiers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function savePin() {
    setBusy(true); setError('');
    try {
      await api.put(`/api/owner/cashiers/${pinFor.id}/pin`, { pin });
      toast(t('PIN alterado. A sessão aberta deste caixista terminou.'));
      setPinFor(null); cashiers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function toggle(c) {
    if (c.is_active && !(await confirm({ title: t('Desactivar caixista'), message: t('{name} deixa de poder vender e a sessão aberta termina imediatamente.', { name: c.name }), confirmLabel: t('Desactivar'), danger: true }))) return;
    try {
      await api.put(`/api/owner/cashiers/${c.id}/${c.is_active ? 'deactivate' : 'reactivate'}`);
      toast(c.is_active ? t('Caixista desactivado.') : t('Caixista reactivado.'));
      cashiers.reload();
    } catch (err) { toast(errorMessage(err), 'danger'); }
  }
  async function unlock(c) {
    if (!(await confirm({ title: t('Desbloquear perfil'), message: t('{name} errou 3 vezes a contagem do fecho de turno. Confirme que verificou a gaveta antes de desbloquear.', { name: c.name }), confirmLabel: t('Desbloquear') }))) return;
    try { await api.post(`/api/owner/cashiers/${c.id}/unlock`); toast(t('Perfil desbloqueado.')); cashiers.reload(); } catch (err) { toast(errorMessage(err), 'danger'); }
  }

  return (
    <>
      <Toolbar>
        <p className="text-sm text-ink-muted">{t('Cada pessoa entra no terminal com um PIN pessoal de 4 dígitos. O caixista vende; o guarda confere os recibos à saída.')}</p>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setCreating({ name: '', phone: '', pin: '', role: 'cashier' }); }}>{t('Novo perfil')}</Button>
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: t('Nome'), render: (c) => <span className={c.is_active ? 'text-ink' : 'text-ink-faint'}>{c.name}</span> },
          { key: 'role', header: t('Função'), render: (c) => <Badge tone={c.role === 'guard' ? 'info' : 'neutral'}>{c.role === 'guard' ? t('Guarda') : t('Caixista')}</Badge> },
          { key: 'state', header: t('Estado'), render: (c) => (!c.is_active ? <Badge>{t('Inactivo')}</Badge> : c.locked ? <Badge tone="danger">{t('Bloqueado no fecho')}</Badge> : !c.has_pin ? <Badge tone="warning">{t('Sem PIN')}</Badge> : <Badge tone="positive">{t('Activo')}</Badge>) },
          { key: 'sales', header: t('Vendas hoje'), align: 'right', render: (c) => (c.role === 'guard' ? '—' : c.today_sales) },
          { key: 'revenue', header: t('Receita hoje'), align: 'right', render: (c) => (c.role === 'guard' ? '—' : money(c.today_revenue)) },
          { key: 'actions', header: '', align: 'right', render: (c) => (
            <div className="flex justify-end gap-1">
              {c.locked && c.is_active && <Button size="sm" variant="primary" onClick={() => unlock(c)}>{t('Desbloquear')}</Button>}
              {c.is_active && <Button size="sm" variant="ghost" onClick={() => { setError(''); setPin(''); setPinFor(c); }}>{c.has_pin ? t('Mudar PIN') : t('Definir PIN')}</Button>}
              <Button size="sm" variant={c.is_active ? 'danger-ghost' : 'ghost'} onClick={() => toggle(c)}>{c.is_active ? t('Desactivar') : t('Reactivar')}</Button>
            </div>
          ) },
        ]}
        rows={cashiers.data || []}
        loading={cashiers.loading && !cashiers.data}
        empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não há caixistas.')}</p>}
      />

      <Drawer open={Boolean(creating)} onClose={() => setCreating(null)} title={t('Novo perfil')}
        footer={<><Button onClick={() => setCreating(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!creating || creating.name.trim().length < 2 || !pinOk(creating.pin)} onClick={create}>{t('Criar')}</Button></>}>
        {creating && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label={t('Nome')} value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} autoFocus />
            <Select label={t('Função')} value={creating.role} onChange={(e) => setCreating({ ...creating, role: e.target.value })}>
              <option value="cashier">{t('Caixista: vende no balcão')}</option>
              <option value="guard">{t('Guarda: confere os recibos à saída')}</option>
            </Select>
            <Input label={t('Telefone')} hint={t('Opcional')} inputMode="tel" value={creating.phone} onChange={(e) => setCreating({ ...creating, phone: e.target.value })} />
            <Input label={t('PIN de 4 dígitos')} hint={t('Entregue-o à pessoa em privado.')} type="password" inputMode="numeric" maxLength={4} value={creating.pin} onChange={(e) => setCreating({ ...creating, pin: e.target.value.replace(/\D/g, '') })} inputClassName="num tracking-[0.4em]" />
          </div>
        )}
      </Drawer>

      <Dialog open={Boolean(pinFor)} size="sm" title={pinFor ? t('PIN de {name}', { name: pinFor.name }) : ''} description={t('A sessão aberta deste caixista termina ao mudar o PIN.')} onClose={() => setPinFor(null)}
        footer={<><Button onClick={() => setPinFor(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!pinOk(pin)} onClick={savePin}>{t('Guardar PIN')}</Button></>}>
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        <Input label={t('Novo PIN de 4 dígitos')} type="password" inputMode="numeric" maxLength={4} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputClassName="num tracking-[0.4em]" />
      </Dialog>
    </>
  );
}

function Employees() {
  const toast = useToast();
  const { t } = useI18n();
  const employees = useApi('/api/owner/employees');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = (employees.data || []).filter((e) => e.is_active);

  async function save() {
    setBusy(true); setError('');
    const body = { name: editing.name.trim(), role: editing.role.trim(), monthly_salary: editing.monthly_salary, phone: editing.phone?.trim() || null, start_date: editing.start_date || null, is_active: editing.is_active };
    try {
      if (editing.id) await api.put('/api/owner/employees/' + editing.id, body);
      else await api.post('/api/owner/employees', body);
      toast(t('Trabalhador guardado.'));
      setEditing(null); employees.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <Toolbar>
        <p className="text-sm text-ink-muted">{t('Folha salarial mensal:')} <span className="num font-medium text-ink">{money(active.reduce((s, e) => s + e.monthly_salary, 0))}</span> {t('— deduzida no relatório mensal.')}</p>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ name: '', role: '', monthly_salary: 0, phone: '', start_date: isoDay(), is_active: true }); }}>{t('Novo trabalhador')}</Button>
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: t('Nome'), render: (e) => <span className={e.is_active ? 'text-ink' : 'text-ink-faint'}>{e.name}</span> },
          { key: 'role', header: t('Função'), render: (e) => <span className="text-ink-2">{e.role}</span> },
          { key: 'start', header: t('Início'), render: (e) => date(e.start_date) },
          { key: 'state', header: t('Estado'), render: (e) => (e.is_active ? <Badge tone="positive">{t('Activo')}</Badge> : <Badge>{t('Saiu')}</Badge>) },
          { key: 'salary', header: t('Salário'), align: 'right', render: (e) => money(e.monthly_salary) },
        ]}
        rows={employees.data || []}
        loading={employees.loading && !employees.data}
        onRowClick={(e) => { setError(''); setEditing({ ...e, phone: e.phone || '', start_date: e.start_date ? e.start_date.slice(0, 10) : '' }); }}
        empty={<p className="py-10 text-center text-ink-muted">{t('Ainda não há trabalhadores registados.')}</p>}
      />
      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? t('Editar trabalhador') : t('Novo trabalhador')}
        footer={<>{editing?.id && <Button variant={editing.is_active ? 'danger-ghost' : 'ghost'} className="mr-auto" onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}>{editing.is_active ? t('Marcar saída') : t('Reactivar')}</Button>}<Button onClick={() => setEditing(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!editing?.name?.trim() || !editing?.role?.trim()} onClick={save}>{t('Guardar')}</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {!editing.is_active && <Alert tone="info">{t('Ao guardar, deixa de contar na folha salarial.')}</Alert>}
            <Input label={t('Nome')} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            <Input label={t('Função')} placeholder={t('Ex.: Ajudante, Segurança')} value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
            <MoneyInput label={t('Salário mensal')} valueCents={editing.monthly_salary} onChangeCents={(v) => setEditing({ ...editing, monthly_salary: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('Telefone')} inputMode="tel" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              <Input label={t('Data de início')} type="date" value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
