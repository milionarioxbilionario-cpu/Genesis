import React, { useState } from 'react';
import { KeyRound, Plus, UserCog } from 'lucide-react';
import api from '../utils/api';
import useApi from '../utils/useApi';
import { errorMessage } from '../utils/format';
import { useI18n } from '../i18n/react';
import { Alert, Badge, Button, Dialog, Drawer, Input, Select, Table, Toolbar, useConfirm, useToast } from './ui';

// E2 (31/10/2026): gerentes criados pelo dono. Entram em /entrar com o e-mail e
// a senha e trabalham so no estabelecimento deles, sem custos, lucro, salarios
// nem os dados do dono (o servidor corta: backend/src/utils/managerPolicy.js).
// O PIN de autorizacao (opcional) autoriza cancelamentos e descontos; sem PIN, nao.
// `tenantId`: so os gerentes desse estabelecimento (na Equipa); sem ele, todos (painel geral).
const pinOk = (p) => /^\d{4,6}$/.test(p);

export default function ManagersCard({ tenantId = null, establishments = null }) {
  const { t } = useI18n();
  const toast = useToast();
  const confirm = useConfirm();
  const list = useApi('/api/managers');
  const [creating, setCreating] = useState(null);
  const [editing, setEditing] = useState(null); // { m, kind: 'password' | 'pin', value }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rows = (list.data || []).filter((m) => !tenantId || m.tenant_id === tenantId);
  const many = Array.isArray(establishments) && establishments.length > 1;

  async function create() {
    setBusy(true); setError('');
    try {
      const body = { name: creating.name.trim(), email: creating.email.trim(), password: creating.password, ...(creating.pin ? { pin: creating.pin } : {}), ...(creating.tenant_id ? { tenant_id: creating.tenant_id } : {}) };
      await api.post('/api/managers', body);
      toast(t('{name} já pode entrar em genesismz.com/entrar com o e-mail e a senha.', { name: body.name }));
      setCreating(null); list.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function saveEdit() {
    setBusy(true); setError('');
    try {
      const body = editing.kind === 'password' ? { password: editing.value } : { pin: editing.value || null };
      await api.put('/api/managers/' + editing.m.id, body);
      toast(editing.kind === 'password' ? t('Senha nova guardada. A sessão aberta do gerente terminou.') : editing.value ? t('PIN de autorização guardado.') : t('PIN retirado: este gerente já não autoriza cancelamentos nem descontos.'));
      setEditing(null); list.reload();
    } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
  }
  async function toggle(m) {
    if (m.is_active && !(await confirm({ title: t('Desactivar gerente'), message: t('{name} deixa de entrar no painel e a sessão aberta termina imediatamente.', { name: m.name }), confirmLabel: t('Desactivar'), danger: true }))) return;
    try {
      await api.put('/api/managers/' + m.id, { is_active: !m.is_active });
      toast(m.is_active ? t('Gerente desactivado.') : t('Gerente reactivado.'));
      list.reload();
    } catch (err) { toast(errorMessage(err), 'danger'); }
  }

  const canCreate = creating && creating.name.trim().length >= 2 && /\S+@\S+\.\S+/.test(creating.email.trim()) && creating.password.length >= 8
    && (!creating.pin || pinOk(creating.pin)) && (!many || Boolean(tenantId) || Boolean(creating.tenant_id));
  return (
    <>
      <Toolbar>
        <p className="text-sm text-ink-muted">{t('O gerente toma conta do dia-a-dia: vendas, produtos, stock, equipa e relatórios de vendas. Não vê custos, lucro, salários nem os seus dados de dono.')}</p>
        <span className="ml-auto">
          <Button variant="primary" icon={Plus} onClick={() => { setError(''); setCreating({ name: '', email: '', password: '', pin: '', tenant_id: tenantId || '' }); }}>{t('Novo gerente')}</Button>
        </span>
      </Toolbar>
      {list.error && <Alert tone="danger" className="mb-3">{list.error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: t('Nome'), render: (m) => <span className={m.is_active ? 'text-ink' : 'text-ink-faint'}><span className="block font-medium">{m.name}</span><span className="block text-xs text-ink-muted">{m.email}</span></span> },
          ...(tenantId ? [] : [{ key: 'est', header: t('Estabelecimento'), render: (m) => m.establishment }]),
          { key: 'state', header: t('Estado'), render: (m) => (!m.is_active ? <Badge>{t('Inactivo')}</Badge> : <Badge tone="positive">{t('Activo')}</Badge>) },
          { key: 'pin', header: t('Autoriza'), render: (m) => (m.has_pin ? <Badge tone="info">{t('Com PIN')}</Badge> : <span className="text-sm text-ink-muted">{t('Não (sem PIN)')}</span>) },
          { key: 'actions', header: '', align: 'right', render: (m) => (
            <div className="flex justify-end gap-1">
              {m.is_active && <Button size="sm" variant="ghost" icon={KeyRound} onClick={() => { setError(''); setEditing({ m, kind: 'password', value: '' }); }}>{t('Nova senha')}</Button>}
              {m.is_active && <Button size="sm" variant="ghost" onClick={() => { setError(''); setEditing({ m, kind: 'pin', value: '' }); }}>{m.has_pin ? t('Mudar PIN') : t('Definir PIN')}</Button>}
              <Button size="sm" variant={m.is_active ? 'danger-ghost' : 'ghost'} onClick={() => toggle(m)}>{m.is_active ? t('Desactivar') : t('Reactivar')}</Button>
            </div>
          ) },
        ]}
        rows={rows}
        loading={list.loading && !list.data}
        empty={<div className="flex flex-col items-center gap-2 py-10 text-center text-ink-muted"><UserCog size={20} /><p>{t('Ainda não há gerentes.')}</p></div>}
      />

      <Drawer open={Boolean(creating)} onClose={() => setCreating(null)} title={t('Novo gerente')} description={t('A conta é da pessoa: e-mail e senha dela. Entregue a senha em privado; ela pode mudá-la depois.')}
        footer={<><Button onClick={() => setCreating(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!canCreate} onClick={create}>{t('Criar')}</Button></>}>
        {creating && (
          <div className="flex flex-col gap-4">
            {error && <Alert tone="danger">{error}</Alert>}
            {many && !tenantId && (
              <Select label={t('Estabelecimento')} value={creating.tenant_id} onChange={(e) => setCreating({ ...creating, tenant_id: e.target.value })}>
                <option value="">{t('Escolha o estabelecimento')}</option>
                {establishments.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </Select>
            )}
            <Input label={t('Nome')} value={creating.name} onChange={(e) => setCreating({ ...creating, name: e.target.value })} autoFocus />
            <Input label={t('E-mail')} type="email" autoComplete="off" value={creating.email} onChange={(e) => setCreating({ ...creating, email: e.target.value })} hint={t('Um e-mail só pode ter uma conta no Genesis.')} />
            <Input label={t('Senha')} type="password" autoComplete="new-password" value={creating.password} onChange={(e) => setCreating({ ...creating, password: e.target.value })} hint={t('Pelo menos 8 caracteres.')} />
            <Input label={t('PIN de autorização')} hint={t('Opcional, 4 a 6 dígitos. Com PIN, o gerente autoriza cancelamentos e descontos acima do limite (fica o nome dele no rastreio). Tem de ser diferente do seu.')} type="password" inputMode="numeric" maxLength={6} value={creating.pin} onChange={(e) => setCreating({ ...creating, pin: e.target.value.replace(/\D/g, '') })} inputClassName="num tracking-[0.4em]" />
          </div>
        )}
      </Drawer>

      <Dialog open={Boolean(editing)} size="sm" onClose={() => setEditing(null)}
        title={editing ? (editing.kind === 'password' ? t('Senha nova para {name}', { name: editing.m.name }) : t('PIN de autorização de {name}', { name: editing.m.name })) : ''}
        description={editing?.kind === 'password' ? t('A sessão aberta do gerente termina. Entregue-lhe a senha nova em privado.') : t('Deixe vazio e guarde para retirar o PIN: o gerente deixa de autorizar.')}
        footer={<><Button onClick={() => setEditing(null)}>{t('Cancelar')}</Button><Button variant="primary" loading={busy} disabled={!editing || (editing.kind === 'password' ? editing.value.length < 8 : Boolean(editing.value) && !pinOk(editing.value))} onClick={saveEdit}>{t('Guardar')}</Button></>}>
        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}
        {editing && (editing.kind === 'password'
          ? <Input label={t('Senha nova')} type="password" autoComplete="new-password" autoFocus value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} hint={t('Pelo menos 8 caracteres.')} />
          : <Input label={t('PIN (4 a 6 dígitos)')} type="password" inputMode="numeric" maxLength={6} autoFocus value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value.replace(/\D/g, '') })} inputClassName="num tracking-[0.4em]" />)}
      </Dialog>
    </>
  );
}
