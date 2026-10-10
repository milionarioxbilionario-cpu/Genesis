import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Inbox, LayoutDashboard, Lightbulb, LogOut, ScrollText, Store } from 'lucide-react';
import {
  Alert, Badge, Button, Card, CardHeader, ConfirmProvider, Dialog, Drawer, Input, KeyValue, MoneyInput, PageHeader,
  PRODUCT_ICONS, ProductImage, Segmented, Select, Spinner, Stat, Table, Textarea, ToastProvider, Toolbar, useConfirm, useToast, cx,
} from '@ui';

// PAINEL DO SUPER ADMIN (Genesis 2.0) — build separada do produto. Mesmo
// design system. Fala com /api/admin/* (protegido por origem + sessao +
// papel super_admin). O "entrar como dono" passou a MODO SUPORTE so leitura.
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/', withCredentials: true });

const money = (c) => (Number(c || 0) / 100).toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: 'always' }) + ' MT';
const date = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const dateTime = (d) => (d ? new Date(d).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
const errorMessage = (err, fb = 'Ocorreu um erro.') => {
  const raw = err?.response?.data?.error;
  return typeof raw === 'string' ? raw : (!err?.response ? 'Sem ligação ao servidor.' : fb);
};
const STATUS = {
  pending: { label: 'Pendente', tone: 'info' },
  trial: { label: 'Em teste', tone: 'warning' },
  active: { label: 'Activa', tone: 'positive' },
  suspended: { label: 'Suspensa', tone: 'danger' },
  blocked: { label: 'Bloqueada', tone: 'danger' },
  rejected: { label: 'Rejeitada', tone: 'neutral' },
  deleted: { label: 'Eliminada', tone: 'neutral' },
};
const TYPES = { bottle_store: 'Bottle store', mercearia: 'Mercearia', padaria: 'Padaria', talho: 'Talho', supermercado: 'Supermercado', restaurante: 'Restaurante', boutique: 'Boutique', outro: 'Outro' };

function useLoad(url) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const reload = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try { const r = await api.get(url); setState({ data: r.data, loading: false, error: '' }); } catch (err) { setState({ data: null, loading: false, error: errorMessage(err) }); }
  }, [url]);
  useEffect(() => { reload(); }, [reload]);
  return { ...state, reload };
}

// ---------------------------------------------------------------- entrada
function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/api/auth/login', { email: email.trim(), password });
      if (res.data.user.role !== 'super_admin') {
        await api.post('/api/auth/logout').catch(() => {});
        setError('Esta conta não tem acesso à administração.');
        return;
      }
      navigate('/', { replace: true });
    } catch (err) { setError(errorMessage(err, 'Credenciais inválidas.')); } finally { setLoading(false); }
  }
  return (
    <div className="flex min-h-screen items-start justify-center bg-bg px-4 pt-24">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
          <span className="text-md font-semibold text-ink">Genesis Admin</span>
        </div>
        <h1 className="mt-8 text-xl font-semibold tracking-tight text-ink">Acesso restrito</h1>
        <p className="mt-1 text-base text-ink-muted">Administração da plataforma.</p>
        {error && <Alert tone="danger" className="mt-5">{error}</Alert>}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-4">
          <Input label="Email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <Input label="Senha" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="primary" size="lg" block loading={loading} disabled={!email || !password}>Entrar</Button>
        </form>
      </div>
    </div>
  );
}

function RequireAdmin({ children }) {
  const [state, setState] = useState('loading');
  useEffect(() => {
    api.get('/api/auth/me').then((r) => setState(r.data.user.role === 'super_admin' ? 'ok' : 'no')).catch(() => setState('no'));
  }, []);
  if (state === 'loading') return <div className="flex min-h-screen items-center justify-center text-ink-muted"><Spinner /></div>;
  if (state === 'no') return <Navigate to="/entrar" replace />;
  return children;
}

const NAV = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard, end: true },
  { to: '/pedidos', label: 'Pedidos de conta', icon: Inbox },
  { to: '/lojas', label: 'Lojas', icon: Store },
  { to: '/catalogos', label: 'Catálogos-mestre', icon: BookOpen },
  { to: '/sugestoes', label: 'Sugestões', icon: Lightbulb },
  { to: '/auditoria', label: 'Auditoria', icon: ScrollText },
];

function Shell() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-border bg-surface md:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-ink text-sm font-semibold text-white">G</span>
          <span className="font-semibold text-ink">Admin</span>
        </div>
        <nav className="flex-1 px-3 py-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('mb-0.5 flex h-9 items-center gap-3 rounded px-3 text-base', isActive ? 'bg-accent-soft font-medium text-accent-text' : 'text-ink-2 hover:bg-subtle')}>
              <Icon size={17} strokeWidth={1.8} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" icon={LogOut} block onClick={async () => { await api.post('/api/auth/logout').catch(() => {}); navigate('/entrar'); }}>Sair</Button>
        </div>
      </aside>
      <main className="mx-auto max-w-content px-4 py-6 md:pl-64 md:pr-8 lg:py-8">
        <nav className="mb-4 flex gap-1 overflow-x-auto md:hidden">
          {NAV.map(({ to, label, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('shrink-0 rounded px-3 py-1.5 text-sm', isActive ? 'bg-accent-soft text-accent-text' : 'text-ink-2')}>{label}</NavLink>)}
        </nav>
        <Outlet />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------- visao geral
function Overview() {
  const { data, error } = useLoad('/api/admin/overview');
  const max = data ? Math.max(1, ...data.growth.map((g) => g.total)) : 1;
  return (
    <>
      <PageHeader title="Visão geral" description="Estado da plataforma." />
      {error && <Alert tone="danger">{error}</Alert>}
      {!data ? <Spinner /> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label="Receita mensal recorrente" value={money(data.mrr)} hint={`${data.active} loja(s) activa(s)`} />
            <Stat label="Em teste" value={String(data.trial)} hint={`${data.trials_ending_soon} a terminar em 7 dias`} tone={data.trials_ending_soon ? undefined : undefined} />
            <Stat label="Pedidos pendentes" value={String(data.pending)} />
            <Stat label="Suspensas / bloqueadas" value={String(data.suspended + data.blocked)} tone={data.suspended + data.blocked ? 'danger' : undefined} />
          </div>
          {data.catalog_suggestions > 0 && (
            <Alert tone="info" className="mt-4" title={`${data.catalog_suggestions} produto(s) novo(s) nas lojas`}>
              As lojas acrescentaram produtos que não estão no catálogo-mestre. <NavLink to="/sugestoes" className="font-medium text-accent-text underline">Ver sugestões</NavLink>
            </Alert>
          )}
          <Card className="mt-4">
            <CardHeader title="Lojas na plataforma" description="Últimos 6 meses (activas, em teste e suspensas)." />
            <div className="flex h-40 items-end gap-3">
              {data.growth.map((g) => (
                <div key={g.month} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="num text-xs text-ink-2">{g.total}</span>
                  <div className="w-full max-w-[48px] rounded-t bg-accent" style={{ height: `${(g.total / max) * 100}%`, minHeight: 2 }} />
                  <span className="text-xs text-ink-muted">{g.month.slice(5)}/{g.month.slice(2, 4)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------- pedidos
function Requests() {
  const toast = useToast();
  const { data, loading, error, reload } = useLoad('/api/admin/requests');
  const [approved, setApproved] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState('');
  async function approve(t) {
    setBusy(t.id);
    try { const r = await api.post(`/api/admin/requests/${t.id}/approve`); setApproved({ ...r.data, name: t.name, phone: t.phone }); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  async function reject() {
    setBusy(rejecting.id);
    try { await api.post(`/api/admin/requests/${rejecting.id}/reject`, { reason }); toast('Pedido rejeitado.'); setRejecting(null); setReason(''); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <>
      <PageHeader title="Pedidos de conta" description="Aprovar cria a conta do dono com 30 dias de teste." />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: 'Negócio', render: (t) => <div><p className="text-ink">{t.name}</p><p className="text-xs text-ink-muted">{TYPES[t.business_type] || t.business_type} · {t.location}</p></div> },
          { key: 'owner', header: 'Dono', render: (t) => <div><p className="text-ink">{t.owner_name}</p><p className="num text-xs text-ink-muted">{t.phone}{t.email ? ' · ' + t.email : ''}</p></div> },
          { key: 'created', header: 'Pedido', render: (t) => dateTime(t.created_at) },
          { key: 'actions', header: '', align: 'right', render: (t) => (
            <div className="flex justify-end gap-1">
              <Button size="sm" variant="ghost" onClick={() => { setReason(''); setRejecting(t); }}>Rejeitar</Button>
              <Button size="sm" variant="primary" loading={busy === t.id} onClick={() => approve(t)}>Aprovar</Button>
            </div>
          ) },
        ]}
        rows={data || []}
        loading={loading && !data}
        empty={<p className="py-10 text-center text-ink-muted">Sem pedidos pendentes.</p>}
      />
      <Dialog open={Boolean(approved)} size="sm" title="Conta criada" description={approved ? approved.name : ''} onClose={() => setApproved(null)} footer={<Button variant="primary" onClick={() => setApproved(null)}>Concluído</Button>}>
        {approved && (
          <>
            <p className="mb-3 text-base text-ink-2">Envie estes dados ao dono ({approved.phone}). A senha temporária só é mostrada agora.</p>
            <KeyValue label="Email" value={approved.email} />
            <KeyValue label="Senha temporária" value={<span className="font-medium">{approved.temporaryPassword}</span>} />
            <KeyValue label="Teste até" value={date(approved.trial_ends_at)} />
          </>
        )}
      </Dialog>
      <Dialog open={Boolean(rejecting)} size="sm" title="Rejeitar pedido" description={rejecting?.name} onClose={() => setRejecting(null)}
        footer={<><Button onClick={() => setRejecting(null)}>Cancelar</Button><Button variant="danger" loading={busy === rejecting?.id} disabled={reason.trim().length < 3} onClick={reject}>Rejeitar</Button></>}>
        <Textarea label="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
      </Dialog>
    </>
  );
}

// ---------------------------------------------------------------- lojas
function Tenants() {
  const { data, loading, error, reload } = useLoad('/api/admin/tenants');
  const [filter, setFilter] = useState('live');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => (data || []).filter((t) => {
    if (filter === 'live' && !['active', 'trial'].includes(t.status)) return false;
    if (filter === 'problem' && !['suspended', 'blocked'].includes(t.status)) return false;
    const s = q.trim().toLowerCase();
    return !s || t.name.toLowerCase().includes(s) || (t.owner_name || '').toLowerCase().includes(s) || (t.phone || '').includes(s);
  }), [data, filter, q]);
  return (
    <>
      <PageHeader title="Lojas" />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Toolbar>
        <Segmented value={filter} onChange={setFilter} options={[{ value: 'live', label: 'Activas e em teste' }, { value: 'problem', label: 'Suspensas' }, { value: 'all', label: 'Todas' }]} />
        <Input aria-label="Pesquisar" placeholder="Pesquisar loja, dono ou telefone" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto w-72" />
      </Toolbar>
      <Table
        columns={[
          { key: 'name', header: 'Loja', render: (t) => <div><p className="text-ink">{t.name}</p><p className="text-xs text-ink-muted">{TYPES[t.business_type] || t.business_type} · {t.location}</p></div> },
          { key: 'status', header: 'Estado', render: (t) => <Badge tone={STATUS[t.status]?.tone}>{STATUS[t.status]?.label || t.status}</Badge> },
          { key: 'trial', header: 'Teste até', render: (t) => (t.status === 'trial' ? <span className={new Date(t.trial_ends_at) < new Date() ? 'text-danger' : 'text-ink-2'}>{date(t.trial_ends_at)}</span> : '—') },
          { key: 'sales', header: 'Vendas 30 dias', align: 'right', render: (t) => t.sales_30d },
          { key: 'revenue', header: 'Receita 30 dias', align: 'right', render: (t) => money(t.revenue_30d) },
        ]}
        rows={rows}
        loading={loading && !data}
        onRowClick={(t) => setSelected(t.id)}
        empty={<p className="py-10 text-center text-ink-muted">Nenhuma loja.</p>}
      />
      {selected && <TenantDrawer id={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </>
  );
}

function TenantDrawer({ id, onClose, onChanged }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { data: t, reload } = useLoad('/api/admin/tenants/' + id);
  const [busy, setBusy] = useState('');
  const [supportUrl, setSupportUrl] = useState('');
  async function act(path, label, opts = {}) {
    if (opts.confirm && !(await confirm({ title: label, message: opts.confirm, confirmLabel: label, danger: opts.danger }))) return;
    // O Safari (iPhone) so deixa abrir um separador no proprio toque: um
    // window.open depois do await era bloqueado em silencio. O separador abre
    // ja, vazio, e recebe o link quando o codigo chegar. Se mesmo assim for
    // bloqueado, aparece um link para tocar.
    const tab = path === 'support' ? window.open('', '_blank') : null;
    setBusy(path);
    try {
      const r = await api.post(`/api/admin/tenants/${id}/${path}`, opts.body);
      if (path === 'support') {
        if (tab) { tab.opener = null; tab.location.replace(r.data.url); toast('Modo suporte aberto noutro separador (só leitura, 60 s para abrir).'); }
        else setSupportUrl(r.data.url);
      } else { toast('Feito.'); reload(); onChanged(); }
    } catch (err) { if (tab) tab.close(); toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <Drawer open onClose={onClose} title={t?.name || 'Loja'} description={t ? `${TYPES[t.business_type] || t.business_type} · ${t.location}` : ''}>
      {!t ? <Spinner /> : (
        <div className="flex flex-col gap-5">
          <div>
            <KeyValue label="Estado" value={<Badge tone={STATUS[t.status]?.tone}>{STATUS[t.status]?.label}</Badge>} />
            {t.status === 'trial' && <KeyValue label="Teste até" value={date(t.trial_ends_at)} />}
            <KeyValue label="Dono" value={t.owner_name} />
            <KeyValue label="Telefone" value={t.phone} />
            <KeyValue label="Subscrição" value={money(t.subscription_price) + ' / mês'} />
            <KeyValue label="Produtos" value={t.products_count} />
            <KeyValue label="Vendas (total)" value={`${t.sales_count} · ${money(t.revenue_total)}`} />
            <KeyValue label="Cliente desde" value={date(t.created_at)} />
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-ink-muted">Contas</h3>
            {t.users.map((u) => <KeyValue key={u.id} label={`${u.name} · ${u.role === 'owner' ? 'dono' : 'caixista'}`} value={u.is_active ? 'activa' : 'inactiva'} />)}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium text-ink-muted">Acções</h3>
            <Button loading={busy === 'support'} onClick={() => act('support', 'Abrir modo suporte')}>Abrir modo suporte (só leitura)</Button>
            {supportUrl && (
              <Alert tone="warning" title="O browser bloqueou o separador novo">
                <a href={supportUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline" onClick={() => setSupportUrl('')}>Tocar aqui para abrir o modo suporte</a> (válido 60 s).
              </Alert>
            )}
            {t.status === 'trial' && <Button loading={busy === 'extend-trial'} onClick={() => act('extend-trial', 'Prolongar teste', { body: { days: 14 } })}>Prolongar teste 14 dias</Button>}
            {['trial', 'suspended'].includes(t.status) && <Button variant="primary" loading={busy === 'activate'} onClick={() => act('activate', 'Activar subscrição', { confirm: 'A loja passa a pagante (activa).' })}>Activar subscrição (pagamento recebido)</Button>}
            {['active', 'trial'].includes(t.status) && <Button variant="danger-ghost" loading={busy === 'suspend'} onClick={() => act('suspend', 'Suspender', { confirm: 'Todas as sessões e terminais da loja deixam de funcionar de imediato.', danger: true })}>Suspender (pagamento em atraso)</Button>}
            {t.status === 'suspended' && <Button loading={busy === 'unsuspend'} onClick={() => act('unsuspend', 'Reactivar')}>Reactivar</Button>}
            {t.status === 'blocked' ? <Button loading={busy === 'unblock'} onClick={() => act('unblock', 'Desbloquear')}>Desbloquear</Button>
              : t.status !== 'deleted' && <Button variant="danger-ghost" loading={busy === 'block'} onClick={() => act('block', 'Bloquear', { confirm: 'Bloqueio por abuso ou fraude.', danger: true, body: { reason: 'Bloqueio administrativo' } })}>Bloquear</Button>}
            {t.status === 'deleted' ? <Button loading={busy === 'restore'} onClick={() => act('restore', 'Recuperar')}>Recuperar loja</Button>
              : <Button variant="danger-ghost" loading={busy === 'delete'} onClick={() => act('delete', 'Eliminar', { confirm: 'Desactiva todas as contas da loja. Os dados ficam guardados e a loja pode ser recuperada.', danger: true })}>Eliminar</Button>}
          </div>
        </div>
      )}
    </Drawer>
  );
}

// ---------------------------------------------------------------- catalogos
function Catalogs() {
  const toast = useToast();
  const { data, error, reload } = useLoad('/api/master_catalogs');
  const [type, setType] = useState('bottle_store');
  const [form, setForm] = useState({ name: '', category: '', cost: '', sell: '' });
  const [busy, setBusy] = useState(false);
  const template = (data?.templates || []).find((t) => t.businessType === type);
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/api/master_catalogs', { businessType: type, categories: [form.category || 'Geral'], sampleProducts: [{ name: form.name.trim(), category: form.category || 'Geral', cost_mzn: Number(form.cost.replace(',', '.')), price_mzn: Number(form.sell.replace(',', '.')) }] });
      toast('Produto acrescentado ao catálogo-mestre.');
      setForm({ name: '', category: form.category, cost: '', sell: '' });
      reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(false); }
  }
  return (
    <>
      <PageHeader title="Catálogos-mestre" description="Produtos sugeridos às lojas novas no onboarding, por tipo de negócio." />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Toolbar>
        <Select aria-label="Tipo de negócio" value={type} onChange={(e) => setType(e.target.value)} className="w-56">
          {Object.entries(TYPES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
      </Toolbar>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Table
            columns={[
              { key: 'name', header: 'Produto' },
              { key: 'cost', header: 'Custo sugerido', align: 'right', render: (p) => money(Math.round(p.cost_mzn * 100)) },
              { key: 'sell', header: 'Preço sugerido', align: 'right', render: (p) => money(Math.round(p.price_mzn * 100)) },
            ]}
            rows={template?.sampleProducts || []}
            rowKey="name"
            empty={<p className="py-10 text-center text-ink-muted">Sem produtos neste tipo. O onboarding usa a lista base do sistema.</p>}
          />
        </div>
        <Card>
          <CardHeader title="Acrescentar produto" />
          <form onSubmit={add} className="flex flex-col gap-3">
            <Input label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Categoria" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Custo (MT)" inputMode="decimal" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              <Input label="Preço (MT)" inputMode="decimal" value={form.sell} onChange={(e) => setForm({ ...form, sell: e.target.value })} />
            </div>
            <Button type="submit" variant="primary" loading={busy} disabled={!form.name.trim() || !(Number(form.sell.replace(',', '.')) > 0)}>Acrescentar</Button>
          </form>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------- sugestoes
// Produtos que as lojas criaram e que nao estao no catalogo-mestre (Fase 8.2).
// Sem nomes de lojas: so quantas lojas e os precos que usam.
function Suggestions() {
  const toast = useToast();
  const { data, error, loading, reload } = useLoad('/api/admin/catalog-suggestions');
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState('');
  async function accept() {
    setBusy('accept');
    try {
      await api.post('/api/admin/catalog-suggestions/accept', {
        business_type: open.business_type, name_key: open.name_key, product_name: open.product_name.trim(), category: open.category.trim() || 'Geral',
        suggested_cost: open.cost, suggested_sell: open.sell, barcode: open.barcode?.trim() || null, icon: open.icon || null,
      });
      toast('Acrescentado ao catálogo-mestre. As lojas novas deste tipo já o recebem.');
      setOpen(null); reload();
    } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  async function dismiss(g) {
    setBusy('dismiss');
    try { await api.post('/api/admin/catalog-suggestions/dismiss', { business_type: g.business_type, name_key: g.name_key }); toast('Sugestão ignorada.'); setOpen(null); reload(); } catch (err) { toast(errorMessage(err), 'danger'); } finally { setBusy(''); }
  }
  return (
    <>
      <PageHeader title="Sugestões do catálogo" description="Produtos que as lojas acrescentaram e que não estão no catálogo-mestre. Ao acrescentar, as lojas novas desse tipo passam a recebê-los no início." />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Table
        columns={[
          { key: 'name', header: 'Produto', render: (g) => <div className="flex items-center gap-3"><ProductImage product={{ name: g.product_name, category: g.category, icon: g.icon }} size={32} /><div><p className="text-ink">{g.product_name}</p><p className="text-xs text-ink-muted">{g.category}{g.barcode ? ' · ' + g.barcode : ''}</p></div></div> },
          { key: 'type', header: 'Tipo de negócio', render: (g) => TYPES[g.business_type] || g.business_type },
          { key: 'stores', header: 'Lojas', align: 'right', render: (g) => g.stores },
          { key: 'cost', header: 'Compra (média)', align: 'right', render: (g) => money(g.avg_cost) },
          { key: 'sell', header: 'Venda (média)', align: 'right', render: (g) => <span>{money(g.avg_sell)}{g.min_sell !== g.max_sell && <span className="block text-xs text-ink-muted">{money(g.min_sell)} – {money(g.max_sell)}</span>}</span> },
          { key: 'when', header: 'Último', render: (g) => <span className="whitespace-nowrap text-ink-2">{date(g.last_at)}</span> },
        ]}
        rows={data?.groups || []}
        rowKey={(g) => g.business_type + '|' + g.name_key}
        loading={loading && !data}
        onRowClick={(g) => setOpen({ ...g, cost: g.avg_cost, sell: g.avg_sell })}
        empty={<p className="py-10 text-center text-ink-muted">Nenhuma sugestão por tratar.</p>}
      />
      <Drawer
        open={Boolean(open)}
        onClose={() => setOpen(null)}
        title="Acrescentar ao catálogo-mestre"
        description={open ? `${TYPES[open.business_type] || open.business_type} · pedido por ${open.stores} loja(s)` : ''}
        footer={open && (
          <>
            <Button variant="danger-ghost" className="mr-auto" loading={busy === 'dismiss'} onClick={() => dismiss(open)}>Ignorar</Button>
            <Button onClick={() => setOpen(null)}>Cancelar</Button>
            <Button variant="primary" loading={busy === 'accept'} disabled={!open.product_name.trim() || !(open.sell > 0)} onClick={accept}>Acrescentar</Button>
          </>
        )}
      >
        {open && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-2">Pode corrigir o nome e os preços antes de acrescentar (ficam como sugestão para as lojas novas).</p>
            <Input label="Nome" value={open.product_name} onChange={(e) => setOpen({ ...open, product_name: e.target.value })} />
            <Input label="Categoria" value={open.category} onChange={(e) => setOpen({ ...open, category: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <MoneyInput label="Preço de compra sugerido" valueCents={open.cost} onChangeCents={(v) => setOpen({ ...open, cost: v })} />
              <MoneyInput label="Preço de venda sugerido" valueCents={open.sell} onChangeCents={(v) => setOpen({ ...open, sell: v })} />
            </div>
            <KeyValue label="Preços de venda nas lojas" value={open.min_sell === open.max_sell ? money(open.min_sell) : `${money(open.min_sell)} – ${money(open.max_sell)}`} />
            <Input label="Código de barras" value={open.barcode || ''} onChange={(e) => setOpen({ ...open, barcode: e.target.value })} inputClassName="num" />
            <Select label="Ícone" value={open.icon || ''} onChange={(e) => setOpen({ ...open, icon: e.target.value || null })}>
              <option value="">Automático (pela categoria)</option>
              {PRODUCT_ICONS.map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
            </Select>
          </div>
        )}
      </Drawer>
    </>
  );
}

// ---------------------------------------------------------------- auditoria
function Audit() {
  const { data, loading } = useLoad('/api/admin/audit');
  return (
    <>
      <PageHeader title="Auditoria" description="Últimas 200 acções na plataforma." />
      <Table
        columns={[
          { key: 'when', header: 'Quando', render: (a) => <span className="whitespace-nowrap">{dateTime(a.created_at)}</span> },
          { key: 'action', header: 'Acção', render: (a) => <span className="font-medium text-ink">{a.action}</span> },
          { key: 'tenant', header: 'Loja', render: (a) => a.tenant_name || '—' },
          { key: 'user', header: 'Por', render: (a) => <span className="text-ink-2">{a.user_name}</span> },
        ]}
        rows={data || []}
        loading={loading}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ConfirmProvider>
          <Routes>
            <Route path="/entrar" element={<Login />} />
            <Route element={<RequireAdmin><Shell /></RequireAdmin>}>
              <Route index element={<Overview />} />
              <Route path="pedidos" element={<Requests />} />
              <Route path="lojas" element={<Tenants />} />
              <Route path="catalogos" element={<Catalogs />} />
              <Route path="sugestoes" element={<Suggestions />} />
              <Route path="auditoria" element={<Audit />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ConfirmProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
