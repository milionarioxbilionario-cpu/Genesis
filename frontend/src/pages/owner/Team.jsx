import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import api from '../../utils/api';
import useApi from '../../utils/useApi';
import { money, date, isoDay, errorMessage } from '../../utils/format';
import { Alert, Badge, Button, Dialog, Drawer, Input, MoneyInput, PageHeader, Table, Tabs, Toolbar, useConfirm, useToast } from '../../components/ui';

export default function Team() {
  const [tab, setTab] = useState('cashiers');
  return (
    <>
      <PageHeader title="Equipa" description="Caixistas que vendem no terminal e trabalhadores na folha salarial." />
      <Tabs className="mb-5" value={tab} onChange={setTab} items={[{ value: 'cashiers', label: 'Caixistas' }, { value: 'employees', label: 'Trabalhadores' }]} />
      {tab === 'cashiers' ? <Cashiers /> : <Employees />}
    </>
  );
}

const pinOk = (p) => /^\d{4}$/.test(p);

function Cashiers() {
  const toast = useToast();
  const confirm = useConfirm();
  const cashiers = useApi('/api/owner/cashiers');
  const [creating, setCreating] = useState(null);
  const [pinFor, setPinFor] = useState(null);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function create() {
    setBusy(true); setError('');
    try {
      await api.post('/api/owner/cashiers', { name: creating.name.trim(), phone: creating.phone.trim() || null, pin: creating.pin });
      toast(`${creating.name.trim()} pode entrar no terminal com o PIN.`);
      setCreating(null); cashiers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function savePin() {
    setBusy(true); setError('');
    try {
      await api.put(`/api/owner/cashiers/${pinFor.id}/pin`, { pin });
      toast('PIN alterado. A sessão aberta deste caixista terminou.');
      setPinFor(null); cashiers.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function toggle(c) {
    if (c.is_active && !(await confirm({ title: 'Desactivar caixista', message: `${c.name} deixa de poder vender e a sessão aberta termina imediatamente.`, confirmLabel: 'Desactivar', danger: true }))) return;
    try {
      await api.put(`/api/owner/cashiers/${c.id}/${c.is_active ? 'deactivate' : 'reactivate'}`);
      toast(c.is_active ? 'Caixista desactivado.' : 'Caixista reactivado.');
      cashiers.reload();
    } catch (err) { toast(errorMessage(err), 'danger'); }
  }
  async function unlock(c) {
    if (!(await confirm({ title: 'Desbloquear perfil', message: `${c.name} errou 3 vezes a contagem do fecho de turno. Confirme que verificou a gaveta antes de desbloquear.`, confirmLabel: 'Desbloquear' }))) return;
    try { await api.post(`/api/owner/cashiers/${c.id}/unlock`); toast('Perfil desbloqueado.'); cashiers.reload(); } catch (err) { toast(errorMessage(err), 'danger'); }
  }

  return (
    <>
      <Toolbar>
        <p className="text-sm text-ink-muted">Cada caixista entra no terminal da loja com um PIN pessoal de 4 dígitos.</p>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setCreating({ name: '', phone: '', pin: '' }); }}>Novo caixista</Button>
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: 'Nome', render: (c) => <span className={c.is_active ? 'text-ink' : 'text-ink-faint'}>{c.name}</span> },
          { key: 'state', header: 'Estado', render: (c) => (!c.is_active ? <Badge>Inactivo</Badge> : c.locked ? <Badge tone="danger">Bloqueado no fecho</Badge> : !c.has_pin ? <Badge tone="warning">Sem PIN</Badge> : <Badge tone="positive">Activo</Badge>) },
          { key: 'sales', header: 'Vendas hoje', align: 'right', render: (c) => c.today_sales },
          { key: 'revenue', header: 'Receita hoje', align: 'right', render: (c) => money(c.today_revenue) },
          { key: 'actions', header: '', align: 'right', render: (c) => (
            <div className="flex justify-end gap-1">
              {c.locked && c.is_active && <Button size="sm" variant="primary" onClick={() => unlock(c)}>Desbloquear</Button>}
              {c.is_active && <Button size="sm" variant="ghost" onClick={() => { setError(''); setPin(''); setPinFor(c); }}>{c.has_pin ? 'Mudar PIN' : 'Definir PIN'}</Button>}
              <Button size="sm" variant={c.is_active ? 'danger-ghost' : 'ghost'} onClick={() => toggle(c)}>{c.is_active ? 'Desactivar' : 'Reactivar'}</Button>
            </div>
          ) },
        ]}
        rows={cashiers.data || []}
        loading={cashiers.loading && !cashiers.data}
        empty={<p className="py-10 text-center text-ink-muted">Ainda não há caixistas.</p>}
      />

      <Drawer open={Boolean(creating)} onClose={() => setCreating(null)} title="Novo caixista"
        footer={<><Button onClick={() => setCreating(null)}>Cancelar</Button><Button variant="primary" loading={busy} disabled={!creating || creating.name.trim().length < 2 || !pinOk(creating.pin)} onClick={create}>Criar</Button></>}>
        {creating && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            <Input label="Nome" value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} autoFocus />
            <Input label="Telefone" hint="Opcional" inputMode="tel" value={creating.phone} onChange={(e) => setCreating({ ...creating, phone: e.target.value })} />
            <Input label="PIN de 4 dígitos" hint="Entregue-o ao caixista em privado." type="password" inputMode="numeric" maxLength={4} value={creating.pin} onChange={(e) => setCreating({ ...creating, pin: e.target.value.replace(/\D/g, '') })} inputClassName="num tracking-[0.4em]" />
          </div>
        )}
      </Drawer>

      <Dialog open={Boolean(pinFor)} size="sm" title={pinFor ? 'PIN de ' + pinFor.name : ''} description="A sessão aberta deste caixista termina ao mudar o PIN." onClose={() => setPinFor(null)}
        footer={<><Button onClick={() => setPinFor(null)}>Cancelar</Button><Button variant="primary" loading={busy} disabled={!pinOk(pin)} onClick={savePin}>Guardar PIN</Button></>}>
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        <Input label="Novo PIN de 4 dígitos" type="password" inputMode="numeric" maxLength={4} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} inputClassName="num tracking-[0.4em]" />
      </Dialog>
    </>
  );
}

function Employees() {
  const toast = useToast();
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
      toast('Trabalhador guardado.');
      setEditing(null); employees.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }

  return (
    <>
      <Toolbar>
        <p className="text-sm text-ink-muted">Folha salarial mensal: <span className="num font-medium text-ink">{money(active.reduce((s, e) => s + e.monthly_salary, 0))}</span> — deduzida no relatório mensal.</p>
        <Button className="ml-auto" variant="primary" icon={Plus} onClick={() => { setError(''); setEditing({ name: '', role: '', monthly_salary: 0, phone: '', start_date: isoDay(), is_active: true }); }}>Novo trabalhador</Button>
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: 'Nome', render: (e) => <span className={e.is_active ? 'text-ink' : 'text-ink-faint'}>{e.name}</span> },
          { key: 'role', header: 'Função', render: (e) => <span className="text-ink-2">{e.role}</span> },
          { key: 'start', header: 'Início', render: (e) => date(e.start_date) },
          { key: 'state', header: 'Estado', render: (e) => (e.is_active ? <Badge tone="positive">Activo</Badge> : <Badge>Saiu</Badge>) },
          { key: 'salary', header: 'Salário', align: 'right', render: (e) => money(e.monthly_salary) },
        ]}
        rows={employees.data || []}
        loading={employees.loading && !employees.data}
        onRowClick={(e) => { setError(''); setEditing({ ...e, phone: e.phone || '', start_date: e.start_date ? e.start_date.slice(0, 10) : '' }); }}
        empty={<p className="py-10 text-center text-ink-muted">Ainda não há trabalhadores registados.</p>}
      />
      <Drawer open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?.id ? 'Editar trabalhador' : 'Novo trabalhador'}
        footer={<>{editing?.id && <Button variant={editing.is_active ? 'danger-ghost' : 'ghost'} className="mr-auto" onClick={() => setEditing({ ...editing, is_active: !editing.is_active })}>{editing.is_active ? 'Marcar saída' : 'Reactivar'}</Button>}<Button onClick={() => setEditing(null)}>Cancelar</Button><Button variant="primary" loading={busy} disabled={!editing?.name?.trim() || !editing?.role?.trim()} onClick={save}>Guardar</Button></>}>
        {editing && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {!editing.is_active && <Alert tone="info">Ao guardar, deixa de contar na folha salarial.</Alert>}
            <Input label="Nome" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} autoFocus />
            <Input label="Função" placeholder="Ex.: Ajudante, Segurança" value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value })} />
            <MoneyInput label="Salário mensal" valueCents={editing.monthly_salary} onChangeCents={(v) => setEditing({ ...editing, monthly_salary: v })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Telefone" inputMode="tel" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              <Input label="Data de início" type="date" value={editing.start_date} onChange={(e) => setEditing({ ...editing, start_date: e.target.value })} />
            </div>
          </div>
        )}
      </Drawer>
    </>
  );
}
